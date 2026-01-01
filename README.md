# F1/OPT Immigration Agent

An Agentic AI System designed to assist international students (F1 Visa) with their OPT (Optional Practical Training) application timeline. This project establishes a strict "Source of Truth" for user status using Pydantic validation and provides a modern React interface for interaction.

## Project Structure

```text
Immigration-Agent/
├── backend/            # FastAPI server & Core Python logic
│   ├── api.py          # API Gateway
│   ├── models.py       # Data validation models
│   ├── calculators.py  # Timeline calculations
│   └── validators.py   # Immigration rule enforcer
├── frontend/           # React + Vite (Tailwind UI)
├── tests/              # Unit and integration tests
├── .gitignore          # Version control exclusions
└── README.md           # Documentation
```

## Architecture

The system consists of three main layers:
1.  **Core Logic (`backend/models.py`)**: The central "Source of Truth". Uses Pydantic v2 to strictly enforce immigration rules (e.g., STEM eligibility, date limits).
2.  **Backend API (`backend/api.py`)**: A lightweight FastAPI service that exposes the core logic to the frontend.
3.  **Frontend (`/frontend`)**: A React + Vite application with Glassmorphism UI (TailwindCSS) for user intake.

---

## Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js & npm

### 1. Backend Setup

The backend handles data validation and business logic.

```bash
# 1. Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate

# 2. Install Python dependencies
pip install -r backend/requirements.txt
```

**Running the Backend:**
```bash
# Navigate to backend directory
cd backend

# Starts the FastAPI server on http://localhost:8000
uvicorn api:app --reload
```

### 2. Frontend Setup

The frontend provides the user interface.

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install Node dependencies
npm install
```

**Running the Frontend:**
```bash
# Starts the Vite dev server on http://localhost:5173
npm run dev
```

---

## Codebase Explanation

### Core Backend Files (`/backend`)

#### `models.py` (The Source of Truth)
This file defines the data schema and legal rules.
- **`DegreeLevel`, `OptStage`**: Enums restricting input values.
- **`UserState`**: The main Pydantic model representing a student's status.

#### `calculators.py` (The Timeline Projector)
Pure mathematical utility that projects key dates based on an anchor.

#### `validators.py` (The Rule Enforcer)
Contains specific validation logic for immigration constraints used after data collection.

#### `api.py` (The Bridge)
A FastAPI application that acts as the interface between the web UI and the Python validation logic.

---

## Testing

**Backend Unit Tests:**
Run tests from the project root:
```bash
pytest tests/
```

**End-to-End Test:**
1. Start Backend (`cd backend && uvicorn api:app --reload`).
2. Start Frontend (`cd frontend && npm run dev`).
3. Open browser to `http://localhost:5173`.
4. Try entering invalid combinations (e.g., Non-STEM degree + STEM Extension) to see validation in action.

