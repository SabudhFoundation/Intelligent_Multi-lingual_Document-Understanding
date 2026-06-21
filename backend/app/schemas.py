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


class ProcessedDocumentRead(BaseModel):
    id: int
    source_file: str
    source_path: str
    document_type: str
    language: str
    extracted_text: str
    masked_text: str
    english_text: str
    translation_status: str
    entities: dict[str, Any]
    features: dict[str, Any]
    summary: str
    embedding: list[float]
    database_path: str
    vector_index_path: str
    privacy_vault_path: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ProcessedDocumentsResponse(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[ProcessedDocumentRead]


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1)
    limit: int = Field(default=8, ge=1, le=30)


class ChatResponse(BaseModel):
    answer: str
    source_record_ids: list[int]
    used_llm: bool
