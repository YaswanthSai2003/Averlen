import json
import os
import uuid
from datetime import datetime, timezone

import pandas as pd
from fastapi import HTTPException, UploadFile
from sqlmodel import select

from app.core.cache import delete_cache
from app.core.config import settings
from app.db.models import Booking, IngestionError, IngestionJob, Property


def save_upload_for_preview(file: UploadFile) -> tuple[str, str]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    os.makedirs(settings.upload_dir, exist_ok=True)

    upload_id = str(uuid.uuid4())
    safe_filename = f"{upload_id}.csv"
    file_path = os.path.join(settings.upload_dir, safe_filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    return upload_id, file.filename


def preview_csv(upload_id: str, filename: str) -> dict:
    file_path = os.path.join(settings.upload_dir, f"{upload_id}.csv")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Uploaded file not found")

    try:
        df = pd.read_csv(file_path)
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read CSV file")

    return {
        "upload_id": upload_id,
        "filename": filename,
        "columns": list(df.columns),
        "preview_rows": df.head(5).fillna("").to_dict(orient="records"),
    }


def clear_analytics_cache(organization_id: int) -> None:
    delete_cache(f"analytics:revenue_summary:org:{organization_id}")
    delete_cache(f"analytics:revenue_by_property:org:{organization_id}")
    delete_cache(f"analytics:revenue_by_city:org:{organization_id}")


def serialize_row(row) -> str:
    return json.dumps(row.fillna("").to_dict(), default=str)


def create_ingestion_error(
    job_id: int,
    organization_id: int,
    row_number: int,
    error_message: str,
    raw_data: str,
) -> IngestionError:
    return IngestionError(
        job_id=job_id,
        organization_id=organization_id,
        row_number=row_number,
        error_message=error_message,
        raw_data=raw_data,
    )


def process_csv_job(
    job_id: int,
    upload_id: str,
    mapping: dict,
    organization_id: int,
    session_factory,
) -> None:
    with session_factory() as session:
        job = session.get(IngestionJob, job_id)

        if not job or job.organization_id != organization_id:
            return

        try:
            job.status = "processing"
            session.add(job)
            session.commit()

            file_path = os.path.join(settings.upload_dir, f"{upload_id}.csv")

            if not os.path.exists(file_path):
                raise ValueError("Uploaded file not found")

            df = pd.read_csv(file_path)

            required_fields = [
                "property_id",
                "check_in",
                "check_out",
                "price",
                "booked_on",
            ]

            for field in required_fields:
                if mapping[field] not in df.columns:
                    raise ValueError(f"Mapped column not found for {field}")

            organization_properties = session.exec(
                select(Property).where(Property.organization_id == organization_id)
            ).all()

            valid_property_ids = {
                property_obj.id
                for property_obj in organization_properties
                if property_obj.id is not None
            }

            job.total_rows = len(df)
            session.add(job)
            session.commit()

            bookings = []
            ingestion_errors = []

            for index, row in df.iterrows():
                row_number = int(index) + 2
                raw_data = serialize_row(row)

                try:
                    property_id = int(row[mapping["property_id"]])

                    if property_id not in valid_property_ids:
                        ingestion_errors.append(
                            create_ingestion_error(
                                job_id=job_id,
                                organization_id=organization_id,
                                row_number=row_number,
                                error_message=(
                                    "Invalid property_id for this organization"
                                ),
                                raw_data=raw_data,
                            )
                        )
                        continue

                    check_in = pd.to_datetime(row[mapping["check_in"]]).date()
                    check_out = pd.to_datetime(row[mapping["check_out"]]).date()

                    if check_out <= check_in:
                        ingestion_errors.append(
                            create_ingestion_error(
                                job_id=job_id,
                                organization_id=organization_id,
                                row_number=row_number,
                                error_message="check_out must be after check_in",
                                raw_data=raw_data,
                            )
                        )
                        continue

                    price = float(row[mapping["price"]])

                    if price <= 0:
                        ingestion_errors.append(
                            create_ingestion_error(
                                job_id=job_id,
                                organization_id=organization_id,
                                row_number=row_number,
                                error_message="price must be greater than 0",
                                raw_data=raw_data,
                            )
                        )
                        continue

                    booking = Booking(
                        property_id=property_id,
                        check_in=check_in,
                        check_out=check_out,
                        price=price,
                        booked_on=pd.to_datetime(row[mapping["booked_on"]]).date(),
                    )

                    bookings.append(booking)

                except Exception as exc:
                    ingestion_errors.append(
                        create_ingestion_error(
                            job_id=job_id,
                            organization_id=organization_id,
                            row_number=row_number,
                            error_message=str(exc),
                            raw_data=raw_data,
                        )
                    )

            session.add_all(bookings)
            session.add_all(ingestion_errors)

            job.status = "completed"
            job.processed_rows = len(bookings)
            job.failed_rows = len(ingestion_errors)
            job.completed_at = datetime.now(timezone.utc)

            session.add(job)
            session.commit()

            clear_analytics_cache(organization_id)

        except Exception as exc:
            job.status = "failed"
            job.error_message = str(exc)
            job.completed_at = datetime.now(timezone.utc)

            session.add(job)
            session.commit()
