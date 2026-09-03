from datetime import datetime
from typing import Any

from pydantic import field_validator
from sqlmodel import SQLModel


class CsvPreviewResponse(SQLModel):
    upload_id: str
    filename: str
    columns: list[str]
    preview_rows: list[dict[str, Any]]


class ColumnMappingRequest(SQLModel):
    upload_id: str
    property_id: str
    check_in: str
    check_out: str
    price: str
    booked_on: str

    @field_validator(
        "upload_id",
        "property_id",
        "check_in",
        "check_out",
        "price",
        "booked_on",
    )
    @classmethod
    def non_empty_value(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Field cannot be empty")
        return value


class IngestionResponse(SQLModel):
    job_id: int
    status: str
    message: str


class JobStatusResponse(SQLModel):
    job_id: int
    import_number: int
    status: str
    total_rows: int
    processed_rows: int
    failed_rows: int
    skipped_rows: int = 0
    duplicate_rows: int = 0
    error_message: str | None = None
    error_summary: str | None = None
    data_removed_at: datetime | None = None
    rollback_available: bool = False
    linked_booking_count: int = 0
    created_at: datetime | None = None
    completed_at: datetime | None = None


class IngestionErrorRead(SQLModel):
    id: int
    job_id: int
    row_number: int
    error_message: str
    raw_data: str


class IngestionErrorListResponse(SQLModel):
    job_id: int
    errors: list[IngestionErrorRead]


class IngestionJobRead(SQLModel):
    job_id: int
    import_number: int
    organization_id: int
    user_id: int | None = None
    filename: str
    status: str
    total_rows: int
    processed_rows: int
    failed_rows: int
    skipped_rows: int = 0
    duplicate_rows: int = 0
    error_message: str | None = None
    error_summary: str | None = None
    data_removed_at: datetime | None = None
    rollback_available: bool = False
    linked_booking_count: int = 0
    created_at: datetime
    completed_at: datetime | None = None


class IngestionJobListResponse(SQLModel):
    jobs: list[IngestionJobRead]


class IngestionJobPageResponse(SQLModel):
    items: list[IngestionJobRead]
    total: int
    limit: int
    offset: int


class DataQualityReport(SQLModel):
    job_id: int
    total_rows: int
    valid_rows: int
    failed_rows: int
    duplicate_rows: int
    skipped_rows: int = 0
    invalid_property_rows: int
    invalid_date_rows: int
    invalid_price_rows: int
    other_error_rows: int
    data_quality_score: float
    data_quality_level: str
    warnings: list[str]