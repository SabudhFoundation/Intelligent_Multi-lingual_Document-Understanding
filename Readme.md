# Intelligent Multilingual Document Understanding

This project implements the workflow shown in the architecture diagram for
resume, invoice, and general document understanding.

## Pipeline Stages

1. Accept text, PDF, or image input.
2. Extract text with direct text reading, PDF extraction, or optional OCR.
3. Detect or accept a language hint for English, Hindi, Bengali, Punjabi, and Malayalam.
4. Classify the document as resume, invoice, or general.
5. Mask private values such as email, phone, price, name, location, mobile number, and client location.
6. Store the masked values in a privacy vault using a reversible local encoding key.
7. Prepare English-processing text. English is passed through; Indic translation is a pluggable stage.
8. Extract NER-style fields and related features.
9. Create a short summary.
10. Generate a lightweight embedding and update a local vector index.
11. Dump the processed document to SQLite.

## Quick Start

```powershell
python main.py path\to\document.txt
```

With hints:

```powershell
python main.py path\to\invoice.pdf --document-type invoice --language english
python main.py path\to\resume.txt --document-type resume --language bengali
```

Outputs are written to `outputs/` by default:

- `document_understanding.sqlite3` stores processed documents.
- `vector_index.json` stores embeddings for simple semantic search experiments.
- `<document>_privacy_vault.json` stores encrypted private values.
- `<document>_result.json` stores the full pipeline result.

## Optional Dependencies

PDF text extraction uses `pdfplumber` if the input is a PDF.

```powershell
pip install pdfplumber
```

Image OCR uses `pytesseract` and `Pillow` if the input is an image. Tesseract OCR must also be installed on the system.

```powershell
pip install pytesseract Pillow
```

The notebooks contain model-training experiments for LayoutLMv3 OCR/form understanding and XLM-R token classification. The runnable pipeline is intentionally lightweight so it works without downloading large models.
--For running must write : python main.py file path
