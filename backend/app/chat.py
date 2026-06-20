from __future__ import annotations

import json
from sqlalchemy.orm import Session

from .config import get_settings
from .crud import find_context_records
from .models import CsvRecord


SYSTEM_PROMPT = """You answer user questions using only the provided PostgreSQL CSV rows.
If the rows do not contain the answer, say that the database does not have enough matching data.
Keep the answer concise and mention relevant record ids when useful."""


def answer_question(db: Session, question: str, limit: int = 8) -> tuple[str, list[int], bool]:
    records = list(find_context_records(db, question, limit=limit))
    record_ids = [record.id for record in records]
    context = _records_to_context(records)

    settings = get_settings()
    if settings.openai_api_key:
        try:
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_openai import ChatOpenAI

            prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", SYSTEM_PROMPT),
                    ("human", "Question: {question}\n\nRows:\n{context}"),
                ]
            )
            model = ChatOpenAI(
                model=settings.chat_model,
                api_key=settings.openai_api_key,
                temperature=0,
            )
            response = (prompt | model).invoke({"question": question, "context": context})
            return str(response.content), record_ids, True
        except Exception as exc:
            return (
                f"LangChain model call failed: {exc}. Matching database rows: {context or 'none'}",
                record_ids,
                False,
            )

    return _fallback_answer(question, records), record_ids, False


def _records_to_context(records: list[CsvRecord]) -> str:
    lines = []
    for record in records:
        payload = {
            "id": record.id,
            "source_file": record.source_file,
            "row_number": record.row_number,
            "data": record.data,
        }
        lines.append(json.dumps(payload, ensure_ascii=False))
    return "\n".join(lines)


def _fallback_answer(question: str, records: list[CsvRecord]) -> str:
    if not records:
        return "I could not find matching rows in PostgreSQL for that question."

    preview = []
    for record in records[:5]:
        fields = ", ".join(f"{key}: {value}" for key, value in list(record.data.items())[:6])
        preview.append(f"Record {record.id} from {record.source_file} row {record.row_number}: {fields}")

    return (
        "OPENAI_API_KEY is not configured, so I used keyword matching instead of an LLM. "
        "Here are the closest rows:\n" + "\n".join(preview)
    )
