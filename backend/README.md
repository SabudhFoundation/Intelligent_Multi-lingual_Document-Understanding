# FastAPI PostgreSQL Backend

This backend stores CSV rows in PostgreSQL, exposes APIs to fetch/search them, and adds a LangChain chat endpoint for user questions over matching database rows.

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` with your PostgreSQL connection:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/multilingual_docs
OPENAI_API_KEY=your_openai_key_here
```

Create the database once in PostgreSQL:

```sql
CREATE DATABASE multilingual_docs;
```

## Run

```powershell
uvicorn app.main:app --reload
```

Open the API docs at `http://127.0.0.1:8000/docs`.

## Main Endpoints

- `GET /health` checks the PostgreSQL connection.
- `POST /csv/upload` uploads a CSV file and stores every row in PostgreSQL.
- `POST /csv/import?path=C:\path\file.csv` imports a local CSV file.
- `GET /records?search=value` fetches stored rows from PostgreSQL.
- `POST /chat` asks a LangChain-powered question over matching rows.

If `OPENAI_API_KEY` is empty, `/chat` still returns keyword-matched records as a fallback.
