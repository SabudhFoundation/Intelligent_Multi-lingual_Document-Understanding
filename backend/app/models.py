from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, UniqueConstraint, func, JSON
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class CsvRecord(Base):
    __tablename__ = "csv_records"
    __table_args__ = (UniqueConstraint("source_file", "row_number", name="uq_csv_source_row"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_file: Mapped[str] = mapped_column(String(255), index=True)
    row_number: Mapped[int] = mapped_column(Integer)
    data: Mapped[dict] = mapped_column(JSON, nullable=False)
    searchable_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class ProcessedDocument(Base):
    __tablename__ = "processed_documents"
    __table_args__ = (UniqueConstraint("source_path", name="uq_processed_source_path"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_file: Mapped[str] = mapped_column(String(255), index=True)
    source_path: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    extracted_text: Mapped[str] = mapped_column(Text, nullable=False)
    masked_text: Mapped[str] = mapped_column(Text, nullable=False)
    english_text: Mapped[str] = mapped_column(Text, nullable=False)
    translation_status: Mapped[str] = mapped_column(String(100), nullable=False)
    entities: Mapped[dict] = mapped_column(JSON, nullable=False)
    features: Mapped[dict] = mapped_column(JSON, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list] = mapped_column(JSON, nullable=False)
    database_path: Mapped[str] = mapped_column(Text, nullable=False)
    vector_index_path: Mapped[str] = mapped_column(Text, nullable=False)
    privacy_vault_path: Mapped[str] = mapped_column(Text, nullable=False)
    searchable_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
