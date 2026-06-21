from __future__ import annotations

import json
from sqlalchemy.orm import Session

from .config import get_settings
from .crud import find_context_documents
from .models import ProcessedDocument


SYSTEM_PROMPT = """You answer user questions using only the provided processed documents.
Use the document metadata, summary, and extracted text to answer the question.
If the documents do not contain the answer, say that the repository does not have enough information.
Keep the answer concise and mention relevant document ids when useful."""


def answer_question(db: Session, question: str, limit: int = 8) -> tuple[str, list[int], bool]:
    documents = list(find_context_documents(db, question, limit=limit))
    document_ids = [document.id for document in documents]
    context = _documents_to_context(documents)

    settings = get_settings()
    if settings.openai_api_key:
        try:
            from langchain_core.prompts import ChatPromptTemplate
            from langchain_openai import ChatOpenAI

            prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", SYSTEM_PROMPT),
                    ("human", "Question: {question}\n\nDocuments:\n{context}"),
                ]
            )
            model = ChatOpenAI(
                model=settings.chat_model,
                api_key=settings.openai_api_key,
                temperature=0,
            )
            response = (prompt | model).invoke({"question": question, "context": context})
            return str(response.content), document_ids, True
        except Exception as exc:
            return (
                f"LangChain model call failed: {exc}. Matching documents: {context or 'none'}",
                document_ids,
                False,
            )

    return _fallback_answer(question, documents), document_ids, False


def _documents_to_context(documents: list[ProcessedDocument]) -> str:
    lines = []
    for document in documents:
        payload = {
            "id": document.id,
            "source_file": document.source_file,
            "document_type": document.document_type,
            "language": document.language,
            "summary": document.summary,
            "entities": document.entities,
        }
        lines.append(json.dumps(payload, ensure_ascii=False))
    return "\n".join(lines)


def _fallback_answer(question: str, documents: list[ProcessedDocument]) -> str:
    if not documents:
        return "I could not find matching processed documents for that question."

    preview = []
    for document in documents[:5]:
        preview.append(
            f"Document {document.id} from {document.source_file}: type={document.document_type}, language={document.language}, summary={document.summary[:120]}"
        )

    return (
        "OPENAI_API_KEY is not configured, so I used keyword matching instead of an LLM. "
        "Here are the closest documents:\n" + "\n".join(preview)
    )
