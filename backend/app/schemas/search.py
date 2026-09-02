from typing import Any, Literal

from sqlmodel import Field, SQLModel


SearchResultType = Literal[
    "property",
    "upload_job",
    "workspace_member",
    "ai_insight",
    "pricing_recommendation",
]


class SearchResult(SQLModel):
    type: SearchResultType
    id: int
    title: str
    subtitle: str | None = None
    extra: dict[str, Any] = Field(default_factory=dict)


class SearchResponse(SQLModel):
    query: str
    results: list[SearchResult]
