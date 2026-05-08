from fastapi import (APIRouter, BackgroundTasks, Depends, File, HTTPException,
                     UploadFile)
from sqlmodel import Session
from sqlmodel import Session as SQLModelSession
from sqlmodel import select

from app.api.deps import get_current_user
from app.db.database import engine, get_session
from app.db.models import IngestionError, IngestionJob, User
from app.schemas.upload import (ColumnMappingRequest, CsvPreviewResponse,
                                IngestionErrorListResponse, IngestionErrorRead,
                                IngestionResponse, JobStatusResponse)
from app.services.ingestion_service import (preview_csv, process_csv_job,
                                            save_upload_for_preview)

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/bookings/preview", response_model=CsvPreviewResponse)
def preview_booking_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    upload_id, filename = save_upload_for_preview(file)
    return preview_csv(upload_id, filename)


@router.post("/bookings/process", response_model=IngestionResponse)
def process_booking_upload(
    payload: ColumnMappingRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    job = IngestionJob(
        organization_id=current_user.organization_id,
        filename=f"{payload.upload_id}.csv",
        status="pending",
    )

    session.add(job)
    session.commit()
    session.refresh(job)

    mapping = payload.model_dump()
    upload_id = mapping.pop("upload_id")

    def session_factory():
        return SQLModelSession(engine)

    background_tasks.add_task(
        process_csv_job,
        job.id,
        upload_id,
        mapping,
        current_user.organization_id,
        session_factory,
    )

    return IngestionResponse(
        job_id=job.id,
        status="pending",
        message="CSV processing started",
    )


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(
    job_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    job = session.get(IngestionJob, job_id)

    if not job or job.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(
        job_id=job.id,
        status=job.status,
        total_rows=job.total_rows,
        processed_rows=job.processed_rows,
        failed_rows=job.failed_rows,
        error_message=job.error_message,
    )


@router.get(
    "/jobs/{job_id}/errors",
    response_model=IngestionErrorListResponse,
)
def get_job_errors(
    job_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    job = session.get(IngestionJob, job_id)

    if not job or job.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Job not found")

    errors = session.exec(
        select(IngestionError).where(
            IngestionError.job_id == job_id,
            IngestionError.organization_id == current_user.organization_id,
        )
    ).all()

    return IngestionErrorListResponse(
        job_id=job_id,
        errors=[
            IngestionErrorRead(
                id=error.id,
                job_id=error.job_id,
                row_number=error.row_number,
                error_message=error.error_message,
                raw_data=error.raw_data,
            )
            for error in errors
        ],
    )
