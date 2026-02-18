# F1/OPT Immigration Agent

AI-assisted F1 OPT eligibility validator with a FastAPI backend, RAG-based regulation retrieval, and React frontend intake UI.

## Project Structure

```text
Immigration-Agent/
├── backend/
│   ├── api.py
│   ├── models.py
│   ├── calculators.py
│   ├── rag.py
│   ├── ingest_regs.py
│   └── requirements.txt
├── frontend/
├── tests/
└── README.md
```

## Stack

- Backend: FastAPI + Pydantic v2
- RAG store: ChromaDB
- Embeddings: Sentence Transformers
- Frontend: React + Vite + Tailwind

## Quick Start

### Prerequisites

- Python 3.11
- Node.js 18+

### 1. Backend Install

#### Version A: uv

```bash
cd /Users/wilson/Github/Immigration-Agent
rm -rf .venv
uv venv --python 3.11 --seed .venv
source .venv/bin/activate
which python
python -m pip --version
pip install -r backend/requirements.txt
```

Expected `which python` output:

```text
/Users/wilson/Github/Immigration-Agent/.venv/bin/python
```

#### Version B: Standard Python venv

```bash
cd /Users/wilson/Github/Immigration-Agent
rm -rf .venv
/usr/local/bin/python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install -U pip setuptools wheel
pip install -r backend/requirements.txt
```

### 2. Build RAG Index (first time only)

```bash
python backend/ingest_regs.py
```

This creates/updates `backend/chroma_db`.

### 3. Run Backend

```bash
cd backend
uvicorn api:app --reload
```

Backend URL: `http://localhost:8000`

Optional production-safe CORS:

```bash
export ALLOWED_ORIGINS="http://localhost:5173,https://your-frontend.example.com"
```

### 4. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

## API Notes

- `POST /validate` validates intake payload via `UserState`.
- `opt_stage=Post|STEM` returns computed `timeline`.
- `opt_stage=Pre` returns `timeline=null` and `timeline_message` with guidance.
- If local RAG index is missing/unavailable, API still returns valid response with `rag_warning` instead of failing.

## Testing

From project root:

```bash
pytest tests/
```

Notes:

- `tests/test_rag_validation.py` stubs RAG retrieval; it does not require a prebuilt Chroma index.
- Real runtime RAG references in `/validate` still require `python backend/ingest_regs.py`.

## Troubleshooting

- If `ingest_regs.py` fails with torch/numpy compatibility errors, recreate the venv and reinstall from `backend/requirements.txt`.
- If ingestion fails with Chroma schema errors like `KeyError: '_type'`, rerun `python backend/ingest_regs.py`. The script now auto-backs up incompatible `backend/chroma_db` and rebuilds it.
- Do not mix old global site-packages with the project venv.
