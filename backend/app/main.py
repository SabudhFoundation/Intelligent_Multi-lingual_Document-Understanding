from __future__ import annotations

from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from .chat import answer_question
from .config import get_settings
from .crud import list_records
from .csv_loader import import_csv_path, import_upload
from .database import get_db, init_db
from .schemas import ChatRequest, ChatResponse, CsvImportResponse, CsvRecordRead, RecordsResponse

settings = get_settings()
app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@app.post("/csv/upload", response_model=CsvImportResponse)
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)) -> CsvImportResponse:
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a .csv file")

    try:
        source_file, inserted, updated = await import_upload(db, file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return CsvImportResponse(source_file=source_file, inserted=inserted, updated=updated)


@app.post("/csv/import", response_model=CsvImportResponse)
def import_csv_from_path(
    path: str = Query(..., description="Local CSV path on this machine"),
    source_file: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> CsvImportResponse:
    csv_path = Path(path)
    if not csv_path.exists() or csv_path.suffix.lower() != ".csv":
        raise HTTPException(status_code=400, detail="CSV path does not exist or is not a .csv file")

    try:
        inserted, updated = import_csv_path(db, csv_path, source_file=source_file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return CsvImportResponse(source_file=source_file or csv_path.name, inserted=inserted, updated=updated)


@app.get("/records", response_model=RecordsResponse)
def get_records(
    source_file: str | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> RecordsResponse:
    total, items = list_records(db, source_file=source_file, search=search, limit=limit, offset=offset)
    return RecordsResponse(total=total, limit=limit, offset=offset, items=[CsvRecordRead.model_validate(item) for item in items])


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    answer, source_record_ids, used_llm = answer_question(db, request.question, limit=request.limit)
    return ChatResponse(answer=answer, source_record_ids=source_record_ids, used_llm=used_llm)
