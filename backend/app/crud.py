from __future__ import annotations

from typing import Any

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from .models import CsvRecord


def normalize_row(row: dict[str, Any]) -> dict[str, Any]:
    return {str(key).strip(): value for key, value in row.items() if str(key).strip()}


def make_searchable_text(row: dict[str, Any]) -> str:
    return " ".join("" if value is None else str(value) for value in row.values())


def upsert_csv_row(db: Session, source_file: str, row_number: int, row: dict[str, Any]) -> tuple[CsvRecord, bool]:
    normalized = normalize_row(row)
    existing = db.scalar(
        select(CsvRecord).where(
            CsvRecord.source_file == source_file,
            CsvRecord.row_number == row_number,
        )
    )
    if existing:
        existing.data = normalized
        existing.searchable_text = make_searchable_text(normalized)
        return existing, False

    record = CsvRecord(
        source_file=source_file,
        row_number=row_number,
        data=normalized,
        searchable_text=make_searchable_text(normalized),
    )
    db.add(record)
    return record, True


def build_records_query(source_file: str | None = None, search: str | None = None) -> Select[tuple[CsvRecord]]:
    query = select(CsvRecord)
    if source_file:
        query = query.where(CsvRecord.source_file == source_file)
    if search:
        pattern = f"%{search}%"
        query = query.where(
            or_(
                CsvRecord.searchable_text.ilike(pattern),
                CsvRecord.source_file.ilike(pattern),
            )
        )
    return query


def list_records(
    db: Session,
    source_file: str | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[int, list[CsvRecord]]:
    base_query = build_records_query(source_file=source_file, search=search)
    total = db.scalar(select(func.count()).select_from(base_query.subquery())) or 0
    items = db.scalars(base_query.order_by(CsvRecord.id.desc()).limit(limit).offset(offset)).all()
    return total, list(items)


def find_context_records(db: Session, question: str, limit: int = 8) -> list[CsvRecord]:
    terms = [term.strip() for term in question.split() if len(term.strip()) > 2]
    if not terms:
        return db.scalars(select(CsvRecord).order_by(CsvRecord.id.desc()).limit(limit)).all()

    filters = [CsvRecord.searchable_text.ilike(f"%{term}%") for term in terms[:8]]
    return db.scalars(select(CsvRecord).where(or_(*filters)).order_by(CsvRecord.id.desc()).limit(limit)).all()
