from __future__ import annotations

import csv
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import UploadFile
from sqlalchemy.orm import Session

from .crud import upsert_csv_row


def import_csv_path(db: Session, csv_path: Path, source_file: str | None = None) -> tuple[int, int]:
    inserted = 0
    updated = 0
    source = source_file or csv_path.name

    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if not reader.fieldnames:
            raise ValueError("CSV file must contain a header row")

        for row_number, row in enumerate(reader, start=1):
            _, was_inserted = upsert_csv_row(db, source, row_number, row)
            if was_inserted:
                inserted += 1
            else:
                updated += 1

    db.commit()
    return inserted, updated


async def import_upload(db: Session, upload: UploadFile) -> tuple[str, int, int]:
    suffix = Path(upload.filename or "upload.csv").suffix or ".csv"
    with NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_path = Path(temp_file.name)
        while chunk := await upload.read(1024 * 1024):
            temp_file.write(chunk)

    try:
        inserted, updated = import_csv_path(db, temp_path, upload.filename or "upload.csv")
        return upload.filename or "upload.csv", inserted, updated
    finally:
        temp_path.unlink(missing_ok=True)
