from datetime import datetime

from pydantic import Field, field_validator
from sqlmodel import SQLModel


class InsightQuery(SQLModel):
    question: str = Field(min_length=3, max_length=500)

    @field_validator("question")
    @classmethod
    def clean_question(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Question cannot be empty")

        return value


class InsightResponse(SQLModel):
    question: str
    answer: str
    supporting_facts: list[str]
    confidence: str
    context_summary: str
    source: str


class InsightHistoryRead(InsightResponse):
    id: int
    organization_id: int
    user_id: int | None = None
    is_pinned: bool
    created_at: datetime


class InsightHistoryListResponse(SQLModel):
    items: list[InsightHistoryRead]
    total: int
    limit: int
    offset: int