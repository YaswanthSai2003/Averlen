import json
import os
import uuid
from datetime import datetime, timedelta, timezone

import pandas as pd
from fastapi import HTTPException, UploadFile
from sqlmodel import Session, select

from app.core.cache import delete_cache_pattern
from app.core.config import settings
from app.db.models import (
    Booking,
    IngestionError,
    IngestionJob,
    Property,
    UploadSession,
    User,
)
from app.services.notification_service import (
    notify_upload_failed,
    notify_upload_finished,
)


ALLOWED_CSV_CONTENT_TYPES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/octet-stream",
}

DANGEROUS_CSV_PREFIXES = (
    "=",
    "+",
    "-",
    "@",
    "\t",
    "\r",
)


def utc_now() -> datetime:
    return datetime.now(
        timezone.utc,
    )


def normalize_datetime(
    value: datetime,
) -> datetime:
    if value.tzinfo is None:
        return value.replace(
            tzinfo=timezone.utc,
        )

    return value


def get_private_upload_dir() -> str:
    return (
        settings.private_upload_dir
        or settings.upload_dir
    )


def validate_upload_id(
    upload_id: str,
) -> None:
    try:
        uuid.UUID(
            upload_id,
        )

    except (
        ValueError,
        TypeError,
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid upload_id",
        )


def get_csv_path(
    upload_id: str,
) -> str:
    validate_upload_id(
        upload_id,
    )

    return os.path.join(
        get_private_upload_dir(),
        f"{upload_id}.csv",
    )


def remove_file_safely(
    file_path: str,
) -> None:
    try:
        if os.path.exists(
            file_path,
        ):
            os.remove(
                file_path,
            )

    except OSError:
        pass


def validate_upload_file(
    file: UploadFile,
    content: bytes,
) -> None:
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file provided",
        )

    if not file.filename.lower().endswith(
        ".csv",
    ):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported",
        )

    if (
        file.content_type
        and file.content_type
        not in ALLOWED_CSV_CONTENT_TYPES
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid file type. "
                "Please upload a CSV file"
            ),
        )

    max_size_bytes = (
        settings.max_upload_size_mb
        * 1024
        * 1024
    )

    if len(content) > max_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=(
                "CSV file must be "
                f"{settings.max_upload_size_mb}"
                "MB or smaller"
            ),
        )

    if not content.strip():
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty",
        )


def validate_csv_dataframe(
    df: pd.DataFrame,
) -> None:
    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="CSV file is empty",
        )

    if (
        len(df)
        > settings.max_csv_rows
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "CSV row limit exceeded. "
                "Maximum allowed rows: "
                f"{settings.max_csv_rows}"
            ),
        )

    if (
        len(df.columns)
        > settings.max_csv_columns
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "CSV column limit exceeded. "
                "Maximum allowed columns: "
                f"{settings.max_csv_columns}"
            ),
        )

    for column in df.columns:
        column_values = (
            df[column]
            .astype(str)
            .str.strip()
        )

        if (
            column_values
            .str
            .startswith(
                DANGEROUS_CSV_PREFIXES,
            )
            .any()
        ):
            raise HTTPException(
                status_code=400,
                detail=(
                    "CSV contains potentially "
                    "unsafe formula values"
                ),
            )


def read_validated_csv(
    file_path: str,
) -> pd.DataFrame:
    if not os.path.exists(
        file_path,
    ):
        raise HTTPException(
            status_code=404,
            detail="Uploaded file not found",
        )

    try:
        df = pd.read_csv(
            file_path,
        )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read CSV file",
        )

    validate_csv_dataframe(
        df,
    )

    return df


def get_upload_session_or_404(
    session: Session,
    upload_id: str,
    current_user: User,
) -> UploadSession:
    validate_upload_id(
        upload_id,
    )

    upload_session = session.get(
        UploadSession,
        upload_id,
    )

    if (
        not upload_session
        or upload_session.organization_id
        != current_user.organization_id
        or upload_session.user_id
        != current_user.id
    ):
        raise HTTPException(
            status_code=404,
            detail="Upload not found",
        )

    if (
        normalize_datetime(
            upload_session.expires_at,
        )
        < utc_now()
    ):
        raise HTTPException(
            status_code=410,
            detail="Upload session expired",
        )

    return upload_session


def create_upload_session(
    session: Session,
    current_user: User,
    original_filename: str,
    stored_filename: str,
    stored_path: str,
) -> UploadSession:
    if current_user.id is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    upload_session = UploadSession(
        id=stored_filename.replace(
            ".csv",
            "",
        ),
        organization_id=(
            current_user.organization_id
        ),
        user_id=current_user.id,
        original_filename=(
            original_filename
        ),
        stored_filename=(
            stored_filename
        ),
        stored_path=stored_path,
        status="uploaded",
        expires_at=(
            utc_now()
            + timedelta(
                minutes=(
                    settings
                    .upload_session_expire_minutes
                ),
            )
        ),
    )

    session.add(
        upload_session,
    )
    session.commit()
    session.refresh(
        upload_session,
    )

    return upload_session


def save_upload_for_preview(
    file: UploadFile,
    session: Session,
    current_user: User,
) -> tuple[str, str]:
    content = file.file.read()

    validate_upload_file(
        file,
        content,
    )

    os.makedirs(
        get_private_upload_dir(),
        exist_ok=True,
    )

    upload_id = str(
        uuid.uuid4(),
    )

    safe_filename = (
        f"{upload_id}.csv"
    )

    file_path = os.path.join(
        get_private_upload_dir(),
        safe_filename,
    )

    with open(
        file_path,
        "wb",
    ) as buffer:
        buffer.write(
            content,
        )

    try:
        read_validated_csv(
            file_path,
        )

    except Exception:
        remove_file_safely(
            file_path,
        )
        raise

    create_upload_session(
        session=session,
        current_user=current_user,
        original_filename=(
            file.filename
        ),
        stored_filename=(
            safe_filename
        ),
        stored_path=file_path,
    )

    return (
        upload_id,
        file.filename,
    )


def preview_csv(
    upload_id: str,
    filename: str,
    session: Session | None = None,
    current_user: User | None = None,
) -> dict:
    if (
        session is not None
        and current_user is not None
    ):
        upload_session = (
            get_upload_session_or_404(
                session=session,
                upload_id=upload_id,
                current_user=current_user,
            )
        )

        file_path = (
            upload_session.stored_path
        )

    else:
        file_path = get_csv_path(
            upload_id,
        )

    df = read_validated_csv(
        file_path,
    )

    return {
        "upload_id": upload_id,
        "filename": filename,
        "columns": list(
            df.columns,
        ),
        "preview_rows": (
            df.head(
                settings.csv_preview_rows,
            )
            .fillna("")
            .to_dict(
                orient="records",
            )
        ),
    }


def clear_analytics_cache(
    organization_id: int,
) -> None:
    delete_cache_pattern(
        "analytics:*:"
        f"org:{organization_id}*",
    )


def serialize_row(
    row,
) -> str:
    return json.dumps(
        row
        .fillna("")
        .to_dict(),
        default=str,
    )


def create_ingestion_error(
    job_id: int,
    organization_id: int,
    row_number: int,
    error_message: str,
    raw_data: str,
) -> IngestionError:
    return IngestionError(
        job_id=job_id,
        organization_id=(
            organization_id
        ),
        row_number=row_number,
        error_message=(
            error_message
        ),
        raw_data=raw_data,
    )


def build_booking_dedup_key(
    property_id: int,
    check_in,
    check_out,
    booked_on,
    price: float,
) -> tuple:
    """Build a stable booking key for CSV idempotency."""

    return (
        property_id,
        check_in,
        check_out,
        booked_on,
        round(
            float(price),
            2,
        ),
    )


def process_csv_job(
    job_id: int,
    upload_id: str,
    mapping: dict,
    organization_id: int,
    session_factory,
) -> None:
    with session_factory() as session:
        job = session.get(
            IngestionJob,
            job_id,
        )

        if (
            not job
            or job.organization_id
            != organization_id
        ):
            return

        try:
            upload_session = session.get(
                UploadSession,
                upload_id,
            )

            if (
                not upload_session
                or upload_session
                .organization_id
                != organization_id
            ):
                raise ValueError(
                    "Upload not found for "
                    "this organization"
                )

            if (
                normalize_datetime(
                    upload_session
                    .expires_at,
                )
                < utc_now()
            ):
                raise ValueError(
                    "Upload session expired"
                )

            job.status = (
                "processing"
            )

            job.error_message = (
                None
            )

            job.error_summary = (
                None
            )

            upload_session.status = (
                "processing"
            )

            session.add(
                job,
            )
            session.add(
                upload_session,
            )
            session.commit()

            df = read_validated_csv(
                upload_session
                .stored_path,
            )

            required_fields = [
                "property_id",
                "check_in",
                "check_out",
                "price",
                "booked_on",
            ]

            for field in (
                required_fields
            ):
                if (
                    field
                    not in mapping
                    or mapping[field]
                    not in df.columns
                ):
                    raise ValueError(
                        "Mapped column not "
                        f"found for {field}"
                    )

            organization_properties = (
                session.exec(
                    select(
                        Property,
                    ).where(
                        Property
                        .organization_id
                        == organization_id
                    )
                ).all()
            )

            valid_property_ids = {
                property_obj.id
                for property_obj
                in organization_properties
                if property_obj.id
                is not None
            }

            job.total_rows = len(
                df,
            )

            session.add(
                job,
            )
            session.commit()

            existing_bookings = (
                session.exec(
                    select(
                        Booking,
                    ).where(
                        Booking
                        .organization_id
                        == organization_id,
                        Booking
                        .property_id
                        .in_(
                            valid_property_ids
                        ),
                    )
                ).all()
                if valid_property_ids
                else []
            )

            existing_booking_keys = {
                build_booking_dedup_key(
                    property_id=(
                        booking
                        .property_id
                    ),
                    check_in=(
                        booking
                        .check_in
                    ),
                    check_out=(
                        booking
                        .check_out
                    ),
                    booked_on=(
                        booking
                        .booked_on
                    ),
                    price=(
                        booking
                        .price
                    ),
                )
                for booking
                in existing_bookings
            }

            current_upload_booking_keys = (
                set()
            )

            bookings = []
            ingestion_errors = []

            duplicate_rows = 0
            skipped_rows = 0

            for (
                index,
                row,
            ) in df.iterrows():
                row_number = (
                    int(index)
                    + 2
                )

                raw_data = (
                    serialize_row(
                        row,
                    )
                )

                try:
                    property_id = int(
                        row[
                            mapping[
                                "property_id"
                            ]
                        ]
                    )

                    if (
                        property_id
                        not in
                        valid_property_ids
                    ):
                        ingestion_errors.append(
                            create_ingestion_error(
                                job_id=job_id,
                                organization_id=(
                                    organization_id
                                ),
                                row_number=(
                                    row_number
                                ),
                                error_message=(
                                    "Invalid "
                                    "property_id "
                                    "for this "
                                    "organization"
                                ),
                                raw_data=(
                                    raw_data
                                ),
                            )
                        )

                        skipped_rows += 1
                        continue

                    check_in = (
                        pd.to_datetime(
                            row[
                                mapping[
                                    "check_in"
                                ]
                            ]
                        ).date()
                    )

                    check_out = (
                        pd.to_datetime(
                            row[
                                mapping[
                                    "check_out"
                                ]
                            ]
                        ).date()
                    )

                    if (
                        check_out
                        <= check_in
                    ):
                        ingestion_errors.append(
                            create_ingestion_error(
                                job_id=job_id,
                                organization_id=(
                                    organization_id
                                ),
                                row_number=(
                                    row_number
                                ),
                                error_message=(
                                    "check_out "
                                    "must be after "
                                    "check_in"
                                ),
                                raw_data=(
                                    raw_data
                                ),
                            )
                        )

                        skipped_rows += 1
                        continue

                    price = float(
                        row[
                            mapping[
                                "price"
                            ]
                        ]
                    )

                    if price <= 0:
                        ingestion_errors.append(
                            create_ingestion_error(
                                job_id=job_id,
                                organization_id=(
                                    organization_id
                                ),
                                row_number=(
                                    row_number
                                ),
                                error_message=(
                                    "price must be "
                                    "greater than 0"
                                ),
                                raw_data=(
                                    raw_data
                                ),
                            )
                        )

                        skipped_rows += 1
                        continue

                    booked_on = (
                        pd.to_datetime(
                            row[
                                mapping[
                                    "booked_on"
                                ]
                            ]
                        ).date()
                    )

                    booking_key = (
                        build_booking_dedup_key(
                            property_id=(
                                property_id
                            ),
                            check_in=(
                                check_in
                            ),
                            check_out=(
                                check_out
                            ),
                            booked_on=(
                                booked_on
                            ),
                            price=price,
                        )
                    )

                    if (
                        booking_key in existing_booking_keys
                        or booking_key in current_upload_booking_keys
                    ):
                        duplicate_rows += 1
                        skipped_rows += 1

                        # Duplicates are skipped, not validation failures.
                        continue

                    current_upload_booking_keys.add(
                        booking_key,
                    )

                    booking = Booking(
                        organization_id=(
                            organization_id
                        ),
                        property_id=(
                            property_id
                        ),
                        check_in=(
                            check_in
                        ),
                        check_out=(
                            check_out
                        ),
                        price=price,
                        booked_on=(
                            booked_on
                        ),
                    )

                    bookings.append(
                        booking,
                    )

                except Exception as exc:
                    ingestion_errors.append(
                        create_ingestion_error(
                            job_id=job_id,
                            organization_id=(
                                organization_id
                            ),
                            row_number=(
                                row_number
                            ),
                            error_message=(
                                str(exc)
                            ),
                            raw_data=(
                                raw_data
                            ),
                        )
                    )

                    skipped_rows += 1

            session.add_all(
                bookings,
            )

            session.add_all(
                ingestion_errors,
            )

            job.processed_rows = len(
                bookings,
            )

            job.failed_rows = len(
                ingestion_errors,
            )

            job.skipped_rows = (
                skipped_rows
            )

            job.duplicate_rows = (
                duplicate_rows
            )

            if ingestion_errors:
                job.status = (
                    "completed_with_errors"
                )

                job.error_summary = (
                    f"{len(ingestion_errors)} "
                    "row(s) need review."
                )

            else:
                job.status = (
                    "completed"
                )

                job.error_summary = (
                    None
                )

            job.completed_at = (
                utc_now()
            )

            upload_session.status = (
                "processed"
            )

            upload_session.processed_at = (
                utc_now()
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

            notify_upload_finished(
                session,
                job,
            )

            clear_analytics_cache(
                organization_id,
            )

            remove_file_safely(
                upload_session
                .stored_path,
            )

        except Exception as exc:
            job.status = "failed"

            job.error_message = (
                str(exc)
            )

            job.error_summary = (
                str(exc)
            )

            job.completed_at = (
                utc_now()
            )

            upload_session = (
                session.get(
                    UploadSession,
                    upload_id,
                )
            )

            if upload_session:
                upload_session.status = (
                    "failed"
                )

                session.add(
                    upload_session,
                )

            session.add(
                job,
            )

            session.commit()

            session.refresh(
                job,
            )

            notify_upload_failed(
                session,
                job,
            )