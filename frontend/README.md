# Immigration Agent Frontend

Frontend for the F1/OPT Immigration Agent.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- lucide-react (icons)

## Prerequisites

- Node.js 18+
- Backend API running at `http://localhost:8000` (or your configured base URL)

## Setup

From this folder:

```bash
npm install
cp .env.example .env
```

Edit `.env` if needed:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Run in Development

```bash
npm run dev
```

Default app URL: `http://localhost:5173`

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Test

```bash
npm install
npm run test:run
```

## Main Files

- `src/App.tsx`: app shell (background + theme toggle + intake form)
- `src/components/ThemeToggle.tsx`: dark/light theme persistence
- `src/components/IntakeForm.tsx`: form state, API call, validation/timeline display

## API Contract Used by Frontend

Endpoint:

- `POST /validate`

Request body (example):

```json
{
  "degree_level": "Master",
  "is_stem_degree": true,
  "program_end_date": "2026-05-13",
  "opt_stage": "Post",
  "unemployment_days_used": 0
}
```

Success response includes:

- `status`
- `user_state`
- `timeline`
- `timeline_message`
- `rag_context`
- `rag_warning`

Validation failure response:

- `detail.status = "invalid"`
- `detail.errors = [{ field, message }]`

## Notes

- Dates from backend are plain `YYYY-MM-DD`. The UI formats them in UTC to avoid timezone off-by-one display issues.
- If backend is unreachable, the UI shows a connection error message.
