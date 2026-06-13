from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from functools import lru_cache
from typing import Any, Dict, Iterable, List, Mapping, Optional


DEFAULT_MODEL_NAME = "xlm-roberta-base"


@dataclass(frozen=True)
class LanguageConfig:
    """Static metadata needed by the preprocessing and model layers."""

    key: str
    name: str
    iso_639_1: str
    script: str
    unicode_range: str
    contributors: tuple[str, ...] = ()


SUPPORTED_LANGUAGES: Dict[str, LanguageConfig] = {
    "english": LanguageConfig(
        key="english",
        name="English",
        iso_639_1="en",
        script="Latin",
        unicode_range=r"A-Za-z",
    ),
    "hindi": LanguageConfig(
        key="hindi",
        name="Hindi",
        iso_639_1="hi",
        script="Devanagari",
        unicode_range=r"\u0900-\u097F",
    ),
    "bengali": LanguageConfig(
        key="bengali",
        name="Bengali",
        iso_639_1="bn",
        script="Bengali",
        unicode_range=r"\u0980-\u09FF",
        contributors=("saikat",),
    ),
    "punjabi": LanguageConfig(
        key="punjabi",
        name="Punjabi",
        iso_639_1="pa",
        script="Gurmukhi",
        unicode_range=r"\u0A00-\u0A7F",
        contributors=("neha",),
    ),
    "malayalam": LanguageConfig(
        key="malayalam",
        name="Malayalam",
        iso_639_1="ml",
        script="Malayalam",
        unicode_range=r"\u0D00-\u0D7F",
        contributors=("aisha",),
    ),
}

LANGUAGE_ALIASES: Mapping[str, str] = {
    "en": "english",
    "eng": "english",
    "english": "english",
    "hi": "hindi",
    "hin": "hindi",
    "hindi": "hindi",
    "bangla": "bengali",
    "ben": "bengali",
    "bn": "bengali",
    "bengali": "bengali",
    "gurmukhi": "punjabi",
    "panjabi": "punjabi",
    "pa": "punjabi",
    "pan": "punjabi",
    "punjabi": "punjabi",
    "mal": "malayalam",
    "ml": "malayalam",
    "malayalam": "malayalam",
    "malaylam": "malayalam",
}

_LANGUAGE_PATTERNS = {
    key: re.compile(f"[{config.unicode_range}]")
    for key, config in SUPPORTED_LANGUAGES.items()
}
_INDIC_SCRIPT_RANGES = "".join(
    config.unicode_range for config in SUPPORTED_LANGUAGES.values()
)
_TOKEN_PATTERN = re.compile(
    rf"[{_INDIC_SCRIPT_RANGES}]+|[A-Za-z0-9_]+|[^\w\s]",
    flags=re.UNICODE,
)
_WHITESPACE_PATTERN = re.compile(r"\s+")


def normalize_language(language: str) -> str:
    """Return the canonical language key for a user-provided language name."""

    if not language or not language.strip():
        raise ValueError("language must be a non-empty string")

    lookup_key = language.strip().casefold().replace("_", "-")
    canonical = LANGUAGE_ALIASES.get(lookup_key)
    if canonical is None:
        supported = ", ".join(sorted(SUPPORTED_LANGUAGES))
        raise ValueError(f"Unsupported language '{language}'. Supported: {supported}")
    return canonical


def get_language_config(language: str) -> LanguageConfig:
    """Get metadata for a supported project language."""

    return SUPPORTED_LANGUAGES[normalize_language(language)]


def list_supported_languages() -> List[str]:
    """Return the canonical language keys supported by this module."""

    return sorted(SUPPORTED_LANGUAGES)


def normalize_text(text: str, *, keep_line_breaks: bool = False) -> str:
    """Normalize text from OCR or forms before tokenization/model inference."""

    if text is None:
        return ""

    normalized = unicodedata.normalize("NFC", str(text))
    normalized = normalized.replace("\u200c", "").replace("\u200d", "")

    if keep_line_breaks:
        lines = [
            _WHITESPACE_PATTERN.sub(" ", line).strip()
            for line in normalized.splitlines()
        ]
        return "\n".join(line for line in lines if line)

    return _WHITESPACE_PATTERN.sub(" ", normalized).strip()


def detect_language(text: str) -> Optional[str]:
    """Detect the supported language with the highest script-character count."""

    normalized = normalize_text(text)
    if not normalized:
        return None

    counts = {
        language: len(pattern.findall(normalized))
        for language, pattern in _LANGUAGE_PATTERNS.items()
    }
    best_language, best_count = max(counts.items(), key=lambda item: item[1])
    return best_language if best_count > 0 else None


def ensure_supported_text(text: str, language: Optional[str] = None) -> str:
    """Normalize text and validate that it belongs to a supported language."""

    normalized = normalize_text(text)
    if not normalized:
        raise ValueError("text must not be empty")

    expected = normalize_language(language) if language else detect_language(normalized)
    if expected is None:
        raise ValueError("Could not detect a supported project language")

    if not _LANGUAGE_PATTERNS[expected].search(normalized):
        raise ValueError(f"Text does not appear to contain {expected} script")

    return normalized


def tokenize_words(text: str, language: Optional[str] = None) -> List[str]:
    """Tokenize supported Indic text into words and punctuation tokens."""

    normalized = ensure_supported_text(text, language)
    return _TOKEN_PATTERN.findall(normalized)


def batch_tokenize(
    texts: Iterable[str],
    *,
    language: Optional[str] = None,
) -> List[List[str]]:
    """Tokenize a sequence of documents using the lightweight tokenizer."""

    return [tokenize_words(text, language) for text in texts]


@lru_cache(maxsize=4)
def get_hf_tokenizer(model_name: str = DEFAULT_MODEL_NAME) -> Any:
    try:
        from transformers import AutoTokenizer
    except ImportError as exc:
        raise ImportError(
            "Install transformers to use Hugging Face tokenizer utilities: "
            "pip install transformers"
        ) from exc

    return AutoTokenizer.from_pretrained(model_name)


def encode_for_model(
    text: str,
    *,
    language: Optional[str] = None,
    model_name: str = DEFAULT_MODEL_NAME,
    max_length: int = 512,
    **tokenizer_kwargs: Any,
) -> Mapping[str, Any]:
    """Normalize text and encode it with an XLM-R compatible tokenizer."""

    normalized = ensure_supported_text(text, language)
    tokenizer = get_hf_tokenizer(model_name)
    return tokenizer(
        normalized,
        truncation=True,
        max_length=max_length,
        return_tensors=tokenizer_kwargs.pop("return_tensors", None),
        **tokenizer_kwargs,
    )


@lru_cache(maxsize=4)
def initialize_nlp(
    task: str = "token-classification",
    model_name: str = DEFAULT_MODEL_NAME,
    **pipeline_kwargs: Any,
) -> Any:
    """Initialize and cache a Hugging Face NLP pipeline for project languages."""

    try:
        from transformers import pipeline
    except ImportError as exc:
        raise ImportError(
            "Install transformers to initialize NLP pipelines: "
            "pip install transformers"
        ) from exc

    return pipeline(task=task, model=model_name, tokenizer=model_name, **pipeline_kwargs)


def prepare_document(
    text: str,
    *,
    language: Optional[str] = None,
    model_name: Optional[str] = None,
) -> Dict[str, Any]:
    """Prepare one document for downstream multilingual NLP workflows."""

    normalized = ensure_supported_text(text, language)
    detected_language = normalize_language(language) if language else detect_language(normalized)
    config = SUPPORTED_LANGUAGES[detected_language]

    prepared: Dict[str, Any] = {
        "language": config.key,
        "language_name": config.name,
        "iso_639_1": config.iso_639_1,
        "script": config.script,
        "text": normalized,
        "tokens": tokenize_words(normalized, config.key),
    }

    if model_name:
        prepared["encoding"] = encode_for_model(
            normalized,
            language=config.key,
            model_name=model_name,
        )

    return prepared


__all__ = [
    "DEFAULT_MODEL_NAME",
    "LANGUAGE_ALIASES",
    "SUPPORTED_LANGUAGES",
    "LanguageConfig",
    "batch_tokenize",
    "detect_language",
    "encode_for_model",
    "ensure_supported_text",
    "get_hf_tokenizer",
    "get_language_config",
    "initialize_nlp",
    "list_supported_languages",
    "normalize_language",
    "normalize_text",
    "prepare_document",
    "tokenize_words",
]
