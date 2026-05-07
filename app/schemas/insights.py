from sqlmodel import SQLModel


class InsightQuery(SQLModel):
    question: str


class InsightResponse(SQLModel):
    question: str
    answer: str
    supporting_facts: list[str]
    confidence: str
    context_summary: str
    source: str
