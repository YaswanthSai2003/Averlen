from contextlib import nullcontext

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
)
from sqlalchemy import func
from sqlmodel import Session, select
from sqlmodel import Session as SQLModelSession

from app.api.deps import (
    get_current_user,
    require_writable_manager,
)
from app.core.config import settings
from app.db.database import (
    engine,
    get_session,
)
from app.db.models import (
    IngestionError,
    IngestionJob,
    User,
)
from app.schemas.upload import (
    ColumnMappingRequest,
    CsvPreviewResponse,
    DataQualityReport,
    IngestionErrorListResponse,
    IngestionErrorRead,
    IngestionJobListResponse,
    IngestionJobPageResponse,
    IngestionJobRead,
    IngestionResponse,
    JobStatusResponse,
)
from app.services.ingestion_service import (
    get_upload_session_or_404,
    preview_csv,
    process_csv_job,
    save_upload_for_preview,
)


router = APIRouter(
    prefix="/upload",
    tags=["Upload"],
)


def calculate_quality_level(
    score: float,
) -> str:
    if score >= 90:
        return "excellent"

    if score >= 75:
        return "good"

    if score >= 50:
        return "warning"

    return "poor"


def categorize_error_message(
    error_message: str,
) -> str:
    message = (
        error_message
        .lower()
    )

    if (
        "duplicate booking skipped"
        in message
    ):
        return "duplicate"

    if (
        "invalid property_id"
        in message
    ):
        return "invalid_property"

    if (
        "check_out must be after check_in"
        in message
    ):
        return "invalid_date"

    if (
        "date" in message
        or "datetime" in message
    ):
        return "invalid_date"

    if "price" in message:
        return "invalid_price"

    return "other"


def get_job_errors_for_org(
    session: Session,
    job_id: int,
    organization_id: int,
) -> list[IngestionError]:
    return list(
        session.exec(
            select(
                IngestionError,
            ).where(
                IngestionError.job_id
                == job_id,
                IngestionError.organization_id
                == organization_id,
            )
        ).all()
    )


def count_validation_errors(
    errors: list[IngestionError],
) -> int:
    """Count validation failures, excluding idempotent duplicate skips."""

    return sum(
        1
        for error in errors
        if categorize_error_message(
            error.error_message,
        )
        != "duplicate"
    )


def get_effective_status(
    job: IngestionJob,
    failed_rows: int,
) -> str:
    status = (
        job.status
        .lower()
    )

    """Normalize legacy duplicate-only jobs to completed."""

    if (
        status
        == "completed_with_errors"
        and failed_rows == 0
    ):
        return "completed"

    return job.status


def get_effective_error_summary(
    job: IngestionJob,
    failed_rows: int,
) -> str | None:
    if failed_rows <= 0:
        return None

    return (
        getattr(
            job,
            "error_summary",
            None,
        )
        or (
            f"{failed_rows} "
            "row(s) need review."
        )
    )


def get_effective_failed_rows(
    session: Session,
    job: IngestionJob,
) -> int:
    if job.id is None:
        return job.failed_rows

    errors = (
        get_job_errors_for_org(
            session=session,
            job_id=job.id,
            organization_id=(
                job.organization_id
            ),
        )
    )

    if errors:
        return (
            count_validation_errors(
                errors,
            )
        )

    return job.failed_rows


def build_job_read(
    job: IngestionJob,
    failed_rows: int | None = None,
) -> IngestionJobRead:
    effective_failed_rows = (
        job.failed_rows
        if failed_rows is None
        else failed_rows
    )

    return IngestionJobRead(
        job_id=job.id,
        organization_id=(
            job.organization_id
        ),
        user_id=job.user_id,
        filename=job.filename,
        status=get_effective_status(
            job,
            effective_failed_rows,
        ),
        total_rows=job.total_rows,
        processed_rows=(
            job.processed_rows
        ),
        failed_rows=(
            effective_failed_rows
        ),
        skipped_rows=getattr(
            job,
            "skipped_rows",
            0,
        ),
        duplicate_rows=getattr(
            job,
            "duplicate_rows",
            0,
        ),
        error_message=(
            job.error_message
        ),
        error_summary=(
            get_effective_error_summary(
                job,
                effective_failed_rows,
            )
        ),
        created_at=job.created_at,
        completed_at=(
            job.completed_at
        ),
    )


def build_failed_count_map(
    session: Session,
    jobs: list[IngestionJob],
    organization_id: int,
) -> dict[int, int]:
    job_ids = [
        job.id
        for job in jobs
        if job.id is not None
    ]

    if not job_ids:
        return {}

    errors = list(
        session.exec(
            select(
                IngestionError,
            ).where(
                IngestionError.organization_id
                == organization_id,
                IngestionError.job_id.in_(
                    job_ids,
                ),
            )
        ).all()
    )

    errors_by_job: dict[
        int,
        list[IngestionError],
    ] = {
        job_id: []
        for job_id in job_ids
    }

    for error in errors:
        errors_by_job.setdefault(
            error.job_id,
            [],
        ).append(
            error,
        )

    failed_counts: dict[
        int,
        int,
    ] = {}

    for job in jobs:
        if job.id is None:
            continue

        job_errors = (
            errors_by_job.get(
                job.id,
                [],
            )
        )

        if job_errors:
            failed_counts[
                job.id
            ] = (
                count_validation_errors(
                    job_errors,
                )
            )

        else:
            failed_counts[
                job.id
            ] = job.failed_rows

    return failed_counts


def build_quality_warnings(
    total_rows: int,
    failed_rows: int,
    duplicate_rows: int,
    skipped_rows: int,
    invalid_property_rows: int,
    invalid_date_rows: int,
    invalid_price_rows: int,
    other_error_rows: int,
    data_quality_score: float,
) -> list[str]:
    warnings: list[str] = []

    if total_rows == 0:
        return [
            "No rows were processed."
        ]

    failure_rate = (
        failed_rows
        / total_rows
    )

    if failure_rate >= 0.5:
        warnings.append(
            "More than half of the "
            "uploaded rows failed "
            "validation."
        )

    if duplicate_rows > 0:
        warnings.append(
            f"{duplicate_rows} "
            "duplicate booking row(s) "
            "were skipped."
        )

    non_duplicate_skips = max(
        0,
        skipped_rows
        - duplicate_rows,
    )

    if (
        non_duplicate_skips
        > 0
    ):
        warnings.append(
            f"{non_duplicate_skips} "
            "row(s) were skipped "
            "because of validation "
            "issues."
        )

    if (
        invalid_property_rows
        > 0
    ):
        warnings.append(
            f"{invalid_property_rows} "
            "row(s) referenced properties "
            "outside this organization or "
            "invalid property IDs."
        )

    if (
        invalid_date_rows
        > 0
    ):
        warnings.append(
            f"{invalid_date_rows} "
            "row(s) had invalid booking "
            "date ranges or date parsing "
            "issues."
        )

    if (
        invalid_price_rows
        > 0
    ):
        warnings.append(
            f"{invalid_price_rows} "
            "row(s) had invalid price "
            "values."
        )

    if (
        other_error_rows
        > 0
    ):
        warnings.append(
            f"{other_error_rows} "
            "row(s) could not be imported "
            "because of other validation "
            "errors."
        )

    if (
        failed_rows > 0
        and data_quality_score
        < 75
    ):
        warnings.append(
            "Data quality is below the "
            "recommended threshold. "
            "Review failed rows before "
            "relying on analytics."
        )

    return warnings


def build_data_quality_report(
    job: IngestionJob,
    errors: list[IngestionError],
) -> DataQualityReport:
    duplicate_error_rows = 0
    invalid_property_rows = 0
    invalid_date_rows = 0
    invalid_price_rows = 0
    other_error_rows = 0

    for error in errors:
        category = (
            categorize_error_message(
                error.error_message,
            )
        )

        if (
            category
            == "duplicate"
        ):
            duplicate_error_rows += 1

        elif (
            category
            == "invalid_property"
        ):
            invalid_property_rows += 1

        elif (
            category
            == "invalid_date"
        ):
            invalid_date_rows += 1

        elif (
            category
            == "invalid_price"
        ):
            invalid_price_rows += 1

        else:
            other_error_rows += 1

    total_rows = (
        job.total_rows
    )

    valid_rows = (
        job.processed_rows
    )


    failed_rows = (
        invalid_property_rows
        + invalid_date_rows
        + invalid_price_rows
        + other_error_rows
    )

    stored_duplicate_rows = (
        getattr(
            job,
            "duplicate_rows",
            0,
        )
    )

    duplicate_rows = max(
        stored_duplicate_rows,
        duplicate_error_rows,
    )

    skipped_rows = getattr(
        job,
        "skipped_rows",
        0,
    )

    if total_rows <= 0:
        data_quality_score = (
            0.0
        )

    elif failed_rows == 0:

        data_quality_score = (
            100.0
        )

    else:
        data_quality_score = round(
            (
                valid_rows
                / total_rows
            )
            * 100,
            2,
        )

    data_quality_level = (
        calculate_quality_level(
            data_quality_score,
        )
    )

    warnings = (
        build_quality_warnings(
            total_rows=(
                total_rows
            ),
            failed_rows=(
                failed_rows
            ),
            duplicate_rows=(
                duplicate_rows
            ),
            skipped_rows=(
                skipped_rows
            ),
            invalid_property_rows=(
                invalid_property_rows
            ),
            invalid_date_rows=(
                invalid_date_rows
            ),
            invalid_price_rows=(
                invalid_price_rows
            ),
            other_error_rows=(
                other_error_rows
            ),
            data_quality_score=(
                data_quality_score
            ),
        )
    )

    return DataQualityReport(
        job_id=job.id,
        total_rows=total_rows,
        valid_rows=valid_rows,
        failed_rows=failed_rows,
        duplicate_rows=(
            duplicate_rows
        ),
        skipped_rows=(
            skipped_rows
        ),
        invalid_property_rows=(
            invalid_property_rows
        ),
        invalid_date_rows=(
            invalid_date_rows
        ),
        invalid_price_rows=(
            invalid_price_rows
        ),
        other_error_rows=(
            other_error_rows
        ),
        data_quality_score=(
            data_quality_score
        ),
        data_quality_level=(
            data_quality_level
        ),
        warnings=warnings,
    )


@router.get(
    "/bookings/template",
)
def download_booking_template():
    csv_content = (
        "property_id,check_in,"
        "check_out,price,booked_on\n"
        "1,2025-03-01,"
        "2025-03-05,5000,"
        "2025-02-20\n"
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                "attachment; "
                'filename="'
                "averlen_bookings_"
                'template.csv"'
            )
        },
    )


@router.get(
    "/bookings/sample",
)
def download_booking_sample():
    csv_content = (
        "property_id,check_in,"
        "check_out,price,booked_on\n"
        "1,2026-01-05,"
        "2026-01-08,7200,"
        "2025-12-20\n"
        "1,2026-01-12,"
        "2026-01-15,7650,"
        "2025-12-28\n"
        "2,2026-01-07,"
        "2026-01-11,13200,"
        "2025-12-21\n"
        "2,2026-01-19,"
        "2026-01-22,14100,"
        "2026-01-02\n"
        "3,2026-01-09,"
        "2026-01-10,3900,"
        "2026-01-04\n"
        "3,2026-01-20,"
        "2026-01-23,4200,"
        "2026-01-05\n"
    )

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": (
                "attachment; "
                'filename="'
                "averlen_sample_"
                'bookings.csv"'
            )
        },
    )


@router.post(
    "/bookings/preview",
    response_model=CsvPreviewResponse,
)
def preview_booking_upload(
    file: UploadFile = File(
        ...,
    ),
    session: Session = Depends(
        get_session,
    ),
    current_user: User = Depends(
        require_writable_manager,
    ),
):
    upload_id, filename = (
        save_upload_for_preview(
            file=file,
            session=session,
            current_user=(
                current_user
            ),
        )
    )

    return preview_csv(
        upload_id=upload_id,
        filename=filename,
        session=session,
        current_user=(
            current_user
        ),
    )


@router.post(
    "/bookings/process",
    response_model=IngestionResponse,
)
def process_booking_upload(
    payload: ColumnMappingRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(
        get_session,
    ),
    current_user: User = Depends(
        require_writable_manager,
    ),
):
    upload_session = (
        get_upload_session_or_404(
            session=session,
            upload_id=(
                payload.upload_id
            ),
            current_user=(
                current_user
            ),
        )
    )

    if (
        upload_session.status
        not in {
            "uploaded",
            "failed",
        }
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Upload has already "
                "been queued or "
                "processed"
            ),
        )

    job = IngestionJob(
        organization_id=(
            current_user
            .organization_id
        ),
        user_id=(
            current_user.id
        ),
        filename=(
            upload_session
            .original_filename
        ),
        status="pending",
    )

    # Lock the upload before background processing starts.

    upload_session.status = (
        "queued"
    )

    session.add(
        job,
    )

    session.add(
        upload_session,
    )

    session.commit()

    session.refresh(
        job,
    )

    session.refresh(
        upload_session,
    )

    mapping = (
        payload.model_dump()
    )

    upload_id = mapping.pop(
        "upload_id",
    )

    if settings.testing:

        def session_factory():
            return nullcontext(
                session,
            )

        process_csv_job(
            job.id,
            upload_id,
            mapping,
            current_user
            .organization_id,
            session_factory,
        )

        session.refresh(
            job,
        )

        effective_failed_rows = (
            get_effective_failed_rows(
                session,
                job,
            )
        )

        return IngestionResponse(
            job_id=job.id,
            status=(
                get_effective_status(
                    job,
                    effective_failed_rows,
                )
            ),
            message=(
                "CSV processing "
                "completed"
            ),
        )

    def session_factory():
        return SQLModelSession(
            engine,
        )

    background_tasks.add_task(
        process_csv_job,
        job.id,
        upload_id,
        mapping,
        current_user
        .organization_id,
        session_factory,
    )

    return IngestionResponse(
        job_id=job.id,
        status="pending",
        message=(
            "CSV processing "
            "started"
        ),
    )


@router.get(
    "/jobs",
    response_model=(
        IngestionJobListResponse
    ),
)
def list_upload_jobs(
    session: Session = Depends(
        get_session,
    ),
    current_user: User = Depends(
        get_current_user,
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
):
    jobs = list(
        session.exec(
            select(
                IngestionJob,
            )
            .where(
                IngestionJob
                .organization_id
                == current_user
                .organization_id
            )
            .order_by(
                IngestionJob
                .created_at
                .desc()
            )
            .offset(
                offset,
            )
            .limit(
                limit,
            )
        ).all()
    )

    failed_counts = (
        build_failed_count_map(
            session=session,
            jobs=jobs,
            organization_id=(
                current_user
                .organization_id
            ),
        )
    )

    return IngestionJobListResponse(
        jobs=[
            build_job_read(
                job,
                failed_rows=(
                    failed_counts.get(
                        job.id,
                        job.failed_rows,
                    )
                ),
            )
            for job in jobs
            if job.id is not None
        ]
    )


@router.get(
    "/jobs/page",
    response_model=(
        IngestionJobPageResponse
    ),
)
def list_upload_jobs_page(
    session: Session = Depends(
        get_session,
    ),
    current_user: User = Depends(
        get_current_user,
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
):
    total = session.exec(
        select(
            func.count(
                IngestionJob.id,
            )
        ).where(
            IngestionJob
            .organization_id
            == current_user
            .organization_id
        )
    ).one()

    jobs = list(
        session.exec(
            select(
                IngestionJob,
            )
            .where(
                IngestionJob
                .organization_id
                == current_user
                .organization_id
            )
            .order_by(
                IngestionJob
                .created_at
                .desc()
            )
            .offset(
                offset,
            )
            .limit(
                limit,
            )
        ).all()
    )

    failed_counts = (
        build_failed_count_map(
            session=session,
            jobs=jobs,
            organization_id=(
                current_user
                .organization_id
            ),
        )
    )

    items = [
        build_job_read(
            job,
            failed_rows=(
                failed_counts.get(
                    job.id,
                    job.failed_rows,
                )
            ),
        )
        for job in jobs
        if job.id is not None
    ]

    return IngestionJobPageResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/jobs/{job_id}",
    response_model=(
        JobStatusResponse
    ),
)
def get_job_status(
    job_id: int,
    session: Session = Depends(
        get_session,
    ),
    current_user: User = Depends(
        get_current_user,
    ),
):
    job = session.get(
        IngestionJob,
        job_id,
    )

    if (
        not job
        or job.organization_id
        != current_user
        .organization_id
    ):
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    failed_rows = (
        get_effective_failed_rows(
            session,
            job,
        )
    )

    return JobStatusResponse(
        job_id=job.id,
        status=(
            get_effective_status(
                job,
                failed_rows,
            )
        ),
        total_rows=(
            job.total_rows
        ),
        processed_rows=(
            job.processed_rows
        ),
        failed_rows=(
            failed_rows
        ),
        skipped_rows=getattr(
            job,
            "skipped_rows",
            0,
        ),
        duplicate_rows=getattr(
            job,
            "duplicate_rows",
            0,
        ),
        error_message=(
            job.error_message
        ),
        error_summary=(
            get_effective_error_summary(
                job,
                failed_rows,
            )
        ),
        created_at=(
            job.created_at
        ),
        completed_at=(
            job.completed_at
        ),
    )


@router.get(
    "/jobs/{job_id}/errors",
    response_model=(
        IngestionErrorListResponse
    ),
)
def get_job_errors(
    job_id: int,
    session: Session = Depends(
        get_session,
    ),
    current_user: User = Depends(
        get_current_user,
    ),
):
    job = session.get(
        IngestionJob,
        job_id,
    )

    if (
        not job
        or job.organization_id
        != current_user
        .organization_id
    ):
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    errors = (
        get_job_errors_for_org(
            session=session,
            job_id=job_id,
            organization_id=(
                current_user
                .organization_id
            ),
        )
    )


    validation_errors = [
        error
        for error in errors
        if categorize_error_message(
            error.error_message,
        )
        != "duplicate"
    ]

    return IngestionErrorListResponse(
        job_id=job_id,
        errors=[
            IngestionErrorRead(
                id=error.id,
                job_id=(
                    error.job_id
                ),
                row_number=(
                    error.row_number
                ),
                error_message=(
                    error.error_message
                ),
                raw_data=(
                    error.raw_data
                ),
            )
            for error
            in validation_errors
        ],
    )


@router.get(
    "/jobs/{job_id}/quality",
    response_model=(
        DataQualityReport
    ),
)
def get_job_data_quality_report(
    job_id: int,
    session: Session = Depends(
        get_session,
    ),
    current_user: User = Depends(
        get_current_user,
    ),
):
    job = session.get(
        IngestionJob,
        job_id,
    )

    if (
        not job
        or job.organization_id
        != current_user
        .organization_id
    ):
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    errors = (
        get_job_errors_for_org(
            session=session,
            job_id=job_id,
            organization_id=(
                current_user
                .organization_id
            ),
        )
    )

    return build_data_quality_report(
        job=job,
        errors=errors,
    )