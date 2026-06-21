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

---

## Web Frontend Dashboard

A premium React + TypeScript + Vanilla CSS web dashboard is available inside the `frontend/` directory to manage and search your database records, upload files, and chat with an AI assistant.

### Quick Start (Web Portal)

The application is fully deployable with zero external dependencies. SQLite is used for the database (auto-initialized on startup).

#### Option 1: Using PowerShell Script (Recommended)
```powershell
.\run_app.ps1
```
This launches both services in new windows:
- **Backend API**: `http://127.0.0.1:8000` (FastAPI + Uvicorn)
- **Frontend Portal**: `http://localhost:5173` (React + Vite)

#### Option 2: Manual Setup

**Backend**:
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend** (in another terminal):
```powershell
cd frontend
pnpm install
pnpm run dev
```

### Features

- 📊 **Analytics Dashboard** - Real-time metrics and system health
- 📤 **CSV Manager** - Upload and import CSV files directly
- 🔍 **Record Explorer** - Search and filter database records
- 🤖 **AI Assistant** - Chat with your documents using LangChain + OpenAI (optional)

### System Requirements

- Python 3.8+
- Node.js 18+
- pnpm (or npm)
- No external database required (SQLite is embedded)

### Configuration

The application works out-of-the-box with default SQLite settings. For advanced configuration:
- Backend config: [backend/app/config.py](backend/app/config.py)
- Frontend config: [frontend/vite.config.ts](frontend/vite.config.ts)

### API Endpoints

- `GET /health` - Health check
- `POST /csv/upload` - Upload CSV file
- `POST /csv/import` - Import local CSV
- `GET /records` - Search records
- `POST /chat` - Chat with documents
- `GET /docs` - Interactive API documentation (Swagger UI)

For more details, see the [frontend/README.md](frontend/README.md).

