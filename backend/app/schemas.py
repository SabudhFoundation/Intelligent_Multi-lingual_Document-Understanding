from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CsvRecordRead(BaseModel):
    id: int
    source_file: str
    row_number: int
    data: dict[str, Any]
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class CsvImportResponse(BaseModel):
    source_file: str
    inserted: int
    updated: int


class RecordsResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[CsvRecordRead]


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    limit: int = Field(default=8, ge=1, le=30)


class ChatResponse(BaseModel):
    answer: str
    source_record_ids: list[int]
    used_llm: bool
