# F1/OPT Immigration Agent

An Agentic AI System designed to assist international students (F1 Visa) with their OPT (Optional Practical Training) application timeline. This project establishes a strict "Source of Truth" for user status using Pydantic validation and provides a modern React interface for interaction.

## Architecture

The system consists of three main layers:
1.  **Core Logic (`models.py`)**: The central "Source of Truth". Uses Pydantic v2 to strictly enforce immigration rules (e.g., STEM eligibility, date limits).
2.  **Backend API (`api.py`)**: A lightweight FastAPI service that exposes the core logic to the frontend.
3.  **Frontend (`/frontend`)**: A React + Vite application with Glassmorphism UI (TailwindCSS) for user intake.

---

## Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js & npm

### 1. Backend Setup

The backend handles data validation and business logic.

```bash
# 1. Clone the repository (if not already done)
# 2. Create a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt
```

**Running the Backend:**
```bash
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

### Core Backend Files

#### `models.py` (The Source of Truth)
This file defines the data schema and legal rules.
- **`DegreeLevel`, `OptStage`**: Enums restricting input values.
- **`UserState`**: The main Pydantic model representing a student's status.
- **Validators**:
    - **`check_program_end_date`**: Ensures the program end date is reasonable (within 1 year future or 60 days past).
    - **`check_stem_eligibility`**: Prevents users from selecting "STEM Extension" without a "STEM Degree".
    - **`check_unemployment_limit`**: Enforces the 90-day (Post) and 150-day (STEM) unemployment caps.

#### `api.py` (The Bridge)
A FastAPI application that acts as the interface between the web UI and the Python validation logic.
- **`POST /validate`**: Receives a JSON payload from the frontend. It attempts to create a `UserState` object.
    - **Success**: Returns 200 OK with the validated data.
    - **Failure**: Returns 400 Bad Request with specific error messages (e.g., "You cannot apply for STEM Extension without a STEM degree") which are displayed on the UI.

#### `intake.py` (CLI Mock Agent)
A standalone script for testing the flow without a web browser.
- Simulates an interactive interview in the terminal.
- Useful for quick verification of the `models.py` logic during development.

#### `test_models.py` (Quality Assurance)
Contains unit tests using `pytest` to verify all validation rules defined in `models.py`.
- Run with `pytest test_models.py`.

### Frontend Files (`/frontend`)

#### `src/components/IntakeForm.tsx`
The main React component for user interaction.
- **State Management**: Manages form inputs (`degree_level`, `opt_stage`, etc.).
- **API Integration**: Sends data to `http://localhost:8000/validate`.
- **UI/UX**: Uses TailwindCSS for styling and Lucide React for icons. Displays real-time validation feedback from the backend.

#### `src/index.css` & Tailwind Config
- Configured for **Tailwind CSS v4** using the PostCSS plugin.
- Implements a dark-themed, glassmorphism design system.

---

## Testing

**Backend Unit Tests:**
```bash
pytest
```

**End-to-End Test:**
1. Start Backend (`uvicorn api:app --reload`).
2. Start Frontend (`npm run dev`).
3. Open browser to `http://localhost:5173`.
4. Try entering invalid combinations (e.g., Non-STEM degree + STEM Extension) to see validation in action.
