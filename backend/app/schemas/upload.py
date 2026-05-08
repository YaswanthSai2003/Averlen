from typing import Any

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


class IngestionResponse(SQLModel):
    job_id: int
    status: str
    message: str


class JobStatusResponse(SQLModel):
    job_id: int
    status: str
    total_rows: int
    processed_rows: int
    failed_rows: int
    error_message: str | None = None


class IngestionErrorRead(SQLModel):
    id: int
    job_id: int
    row_number: int
    error_message: str
    raw_data: str


class IngestionErrorListResponse(SQLModel):
    job_id: int
    errors: list[IngestionErrorRead]
