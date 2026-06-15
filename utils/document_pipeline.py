from __future__ import annotations
import argparse
import base64
import hashlib
import json
import math
import re
import sqlite3
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional
from .keywords import JOB_ROLE_WORDS, SKILL_WORDS
from .nlp_utils import detect_language, normalize_language, normalize_text, tokenize_words


EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_PATTERN = re.compile(r"(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)")
PRICE_PATTERN = re.compile(r"(?:Rs\.?|INR|₹|\$|USD)\s?\d[\d,]*(?:\.\d{1,2})?", re.I)
INVOICE_PATTERN = re.compile(r"\b(?:invoice|inv)[\s#:.-]*([A-Za-z0-9-]*\d[A-Za-z0-9-]*)", re.I)


@dataclass
class PipelineConfig:
    input_path: Path
    output_dir: Path = Path("outputs")
    language: Optional[str] = None
    document_type: Optional[str] = None
    encryption_key: str = "batch-16-demo-key"
    vector_dimensions: int = 64


@dataclass
class DocumentResult:
    source_path: str
    document_type: str
    language: str
    extracted_text: str
    masked_text: str
    english_text: str
    translation_status: str
    entities: Dict[str, List[str]]
    features: Dict[str, Any]
    summary: str
    embedding: List[float]
    database_path: str
    vector_index_path: str
    privacy_vault_path: str


def read_document_text(path: Path) -> str:
    """Extract text from plain text, PDF, or image files."""

    if not path.exists():
        raise FileNotFoundError(path)

    suffix = path.suffix.lower()
    if suffix in {".txt", ".md", ".csv", ".json"}:
        return path.read_text(encoding="utf-8", errors="ignore")

    if suffix == ".pdf" or _looks_like_pdf(path):
        return _extract_pdf_text(path)

    if suffix in {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp"}:
        return _extract_image_text(path)

    return path.read_text(encoding="utf-8", errors="ignore")


def classify_document(text: str, requested_type: Optional[str] = None) -> str:
    if requested_type:
        return requested_type.strip().casefold()

    lowered = text.casefold()
    invoice_score = sum(word in lowered for word in ("invoice", "bill", "gst", "total", "amount", "item", "price"))
    resume_score = sum(word in lowered for word in ("resume", "experience", "skills", "education", "certification", "job role"))
    if invoice_score > resume_score:
        return "invoice"
    if resume_score > invoice_score:
        return "resume"
    return "general"


def mask_privacy(text: str, key: str) -> tuple[str, Dict[str, str]]:
    vault: Dict[str, str] = {}

    def replace(pattern: re.Pattern[str], label: str, value: str) -> str:
        token = f"[{label}_{len(vault) + 1}]"
        vault[token] = _xor_encrypt(value, key)
        return token

    masked = EMAIL_PATTERN.sub(lambda m: replace(EMAIL_PATTERN, "EMAIL", m.group(0)), text)
    masked = PHONE_PATTERN.sub(lambda m: replace(PHONE_PATTERN, "PHONE", m.group(0)), masked)
    masked = PRICE_PATTERN.sub(lambda m: replace(PRICE_PATTERN, "PRICE", m.group(0)), masked)

    for label in ("name", "location", "mobile number", "client location"):
        pattern = re.compile(rf"\b{re.escape(label)}\s*[:\-]\s*([^\n,;]+)", re.I)
        masked = pattern.sub(lambda m, current_label=label: f"{current_label}: {replace(pattern, current_label.upper().replace(' ', '_'), m.group(1).strip())}", masked)

    return masked, vault


def translate_to_english(text: str, language: str) -> tuple[str, str]:
    """Return English processing text.

    This is intentionally pluggable. In the offline version, English text is passed
    through and Indic text is kept after masking so downstream extraction still works.
    """

    if language == "english":
        return text, "source_already_english"
    return text, f"translation_provider_not_configured_kept_{language}_text"


def extract_entities(text: str, document_type: str) -> Dict[str, List[str]]:
    lowered = text.casefold()
    entities: Dict[str, List[str]] = {
        "emails": sorted(set(EMAIL_PATTERN.findall(text))),
        "phones": sorted(set(PHONE_PATTERN.findall(text))),
        "prices": sorted(set(PRICE_PATTERN.findall(text))),
        "invoice_ids": sorted(set(INVOICE_PATTERN.findall(text))),
        "privacy_placeholders": sorted(set(re.findall(r"\[[A-Z_]+_\d+\]", text))),
        "skills": sorted(skill for skill in SKILL_WORDS if skill in lowered),
        "job_roles": sorted(role for role in JOB_ROLE_WORDS if role in lowered),
    }

    if document_type == "invoice":
        entities["items"] = _extract_invoice_items(text)
    elif document_type == "resume":
        entities["certifications"] = _extract_labeled_values(text, "certifications?")

    return {key: value for key, value in entities.items() if value}


def extract_features(text: str, tokens: List[str], entities: Dict[str, List[str]], document_type: str) -> Dict[str, Any]:
    return {
        "document_type": document_type,
        "character_count": len(text),
        "token_count": len(tokens),
        "entity_counts": {key: len(value) for key, value in entities.items()},
        "has_private_placeholders": bool(re.search(r"\[[A-Z_]+_\d+\]", text)),
    }


def summarize(text: str, max_sentences: int = 3) -> str:
    sentences = re.split(r"(?<=[.!?।])\s+", normalize_text(text))
    selected = [sentence.strip() for sentence in sentences if sentence.strip()][:max_sentences]
    return " ".join(selected)


def embed_text(text: str, dimensions: int = 64) -> List[float]:
    vector = [0.0] * dimensions
    words = re.findall(r"\w+", text.casefold(), flags=re.UNICODE)
    for word in words:
        digest = hashlib.sha256(word.encode("utf-8")).digest()
        bucket = int.from_bytes(digest[:4], "big") % dimensions
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[bucket] += sign

    norm = math.sqrt(sum(value * value for value in vector)) or 1.0
    return [round(value / norm, 6) for value in vector]


def run_pipeline(config: PipelineConfig) -> DocumentResult:
    output_dir = config.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    raw_text = read_document_text(config.input_path)
    extracted_text = normalize_text(raw_text, keep_line_breaks=True)
    if not extracted_text:
        raise ValueError(f"No text could be extracted from {config.input_path}")

    language = normalize_language(config.language) if config.language else (detect_language(extracted_text) or "english")
    document_type = classify_document(extracted_text, config.document_type)
    masked_text, vault = mask_privacy(extracted_text, config.encryption_key)
    english_text, translation_status = translate_to_english(masked_text, language)
    tokens = _safe_tokenize(english_text, language)
    entities = extract_entities(english_text, document_type)
    features = extract_features(english_text, tokens, entities, document_type)
    summary = summarize(english_text)
    embedding = embed_text(english_text, config.vector_dimensions)

    stem = config.input_path.stem
    db_path = output_dir / "document_understanding.sqlite3"
    vector_index_path = output_dir / "vector_index.json"
    vault_path = output_dir / f"{stem}_privacy_vault.json"

    result = DocumentResult(
        source_path=str(config.input_path),
        document_type=document_type,
        language=language,
        extracted_text=extracted_text,
        masked_text=masked_text,
        english_text=english_text,
        translation_status=translation_status,
        entities=entities,
        features=features,
        summary=summary,
        embedding=embedding,
        database_path=str(db_path),
        vector_index_path=str(vector_index_path),
        privacy_vault_path=str(vault_path),
    )

    _write_json(vault_path, vault)
    _write_vector_index(vector_index_path, result)
    _write_database(db_path, result)
    _write_json(output_dir / f"{stem}_result.json", asdict(result))
    return result


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run the multilingual document understanding pipeline.")
    parser.add_argument("input_path", type=Path, help="Text, PDF, or image document path")
    parser.add_argument("--output-dir", type=Path, default=Path("outputs"))
    parser.add_argument("--language", help="Optional language hint: english, hindi, bengali, punjabi, malayalam")
    parser.add_argument("--document-type", help="Optional type hint: resume, invoice, or general")
    parser.add_argument("--encryption-key", default="batch-16-demo-key")
    return parser


def result_to_console(result: DocumentResult) -> str:
    return json.dumps(
        {
            "source_path": result.source_path,
            "document_type": result.document_type,
            "language": result.language,
            "translation_status": result.translation_status,
            "entities": result.entities,
            "features": result.features,
            "summary": result.summary,
            "database_path": result.database_path,
            "vector_index_path": result.vector_index_path,
            "privacy_vault_path": result.privacy_vault_path,
        },
        ensure_ascii=False,
        indent=2,
    )


def _looks_like_pdf(path: Path) -> bool:
    with path.open("rb") as handle:
        return handle.read(5) == b"%PDF-"


def _extract_pdf_text(path: Path) -> str:
    try:
        import pdfplumber
    except ImportError as exc:
        raise RuntimeError("Install pdfplumber to extract PDF text: pip install pdfplumber") from exc

    parts: List[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            parts.append(page.extract_text() or "")
    return "\n".join(parts)


def _extract_image_text(path: Path) -> str:
    try:
        import pytesseract
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError("Install pytesseract and Pillow for image OCR") from exc

    return pytesseract.image_to_string(Image.open(path))


def _safe_tokenize(text: str, language: str) -> List[str]:
    try:
        return tokenize_words(text, language)
    except ValueError:
        return re.findall(r"\w+|[^\w\s]", text, flags=re.UNICODE)


def _extract_labeled_values(text: str, label: str) -> List[str]:
    pattern = re.compile(rf"\b{label}\s*[:\-]\s*([^\n]+)", re.I)
    return [match.strip() for match in pattern.findall(text)]


def _extract_invoice_items(text: str) -> List[str]:
    items: List[str] = []
    for line in text.splitlines():
        if PRICE_PATTERN.search(line) and not re.search(r"\b(total|subtotal|tax)\b", line, re.I):
            items.append(line.strip())
    return items[:20]


def _xor_encrypt(value: str, key: str) -> str:
    key_bytes = key.encode("utf-8") or b"key"
    value_bytes = value.encode("utf-8")
    encrypted = bytes(byte ^ key_bytes[index % len(key_bytes)] for index, byte in enumerate(value_bytes))
    return base64.urlsafe_b64encode(encrypted).decode("ascii")


def _write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def _write_vector_index(path: Path, result: DocumentResult) -> None:
    existing: List[Dict[str, Any]] = []
    if path.exists():
        existing = json.loads(path.read_text(encoding="utf-8"))

    existing = [entry for entry in existing if entry.get("source_path") != result.source_path]
    existing.append(
        {
            "source_path": result.source_path,
            "document_type": result.document_type,
            "language": result.language,
            "summary": result.summary,
            "embedding": result.embedding,
        }
    )
    _write_json(path, existing)


def _write_database(path: Path, result: DocumentResult) -> None:
    with sqlite3.connect(path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                source_path TEXT PRIMARY KEY,
                document_type TEXT NOT NULL,
                language TEXT NOT NULL,
                extracted_text TEXT NOT NULL,
                masked_text TEXT NOT NULL,
                english_text TEXT NOT NULL,
                translation_status TEXT NOT NULL,
                entities_json TEXT NOT NULL,
                features_json TEXT NOT NULL,
                summary TEXT NOT NULL,
                embedding_json TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            INSERT INTO documents (
                source_path, document_type, language, extracted_text, masked_text,
                english_text, translation_status, entities_json, features_json,
                summary, embedding_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(source_path) DO UPDATE SET
                document_type = excluded.document_type,
                language = excluded.language,
                extracted_text = excluded.extracted_text,
                masked_text = excluded.masked_text,
                english_text = excluded.english_text,
                translation_status = excluded.translation_status,
                entities_json = excluded.entities_json,
                features_json = excluded.features_json,
                summary = excluded.summary,
                embedding_json = excluded.embedding_json
            """,
            (
                result.source_path,
                result.document_type,
                result.language,
                result.extracted_text,
                result.masked_text,
                result.english_text,
                result.translation_status,
                json.dumps(result.entities, ensure_ascii=False),
                json.dumps(result.features, ensure_ascii=False),
                result.summary,
                json.dumps(result.embedding),
            ),
        )
