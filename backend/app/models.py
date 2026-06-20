from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class CsvRecord(Base):
    __tablename__ = "csv_records"
    __table_args__ = (UniqueConstraint("source_file", "row_number", name="uq_csv_source_row"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    source_file: Mapped[str] = mapped_column(String(255), index=True)
    row_number: Mapped[int] = mapped_column(Integer)
    data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    searchable_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
