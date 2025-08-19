## MindGauge – Full‑Stack AI Project
Demo Video Link : https://www.youtube.com/watch?v=AKklNEkjOXw

A modern assessment platform that generates AI‑powered, role‑based tests, collects candidate submissions, and produces actionable reports.

### Monorepo layout

- `frontend/`: Vite + React + TypeScript app (neutral UI, shadcn‑style sidebar)
- `service/`: Node.js + Express + TypeScript API with AI/NLP services and MongoDB models

## 1) Architecture

- **Frontend (SPA)**
  - React Router pages: `Dashboard`, `CreateAssessment`, `Test`, `Results`, `History`
  - Test runner shows one question at a time; answers stored locally until submit
  - Results show overall score, per‑skill breakdown, summary, feedback, and resources
  - API client in `frontend/src/lib/api.ts` points to the service via `VITE_API_URL`

- **Backend (API)**
  - Express routes:
    - `POST /api/tests/generate`: create an assessment from structured+NL inputs
    - `GET  /api/tests`: list user assessments
    - `GET  /api/tests/:id`: get an assessment
    - `POST /api/submissions/:assessmentId`: submit answers, score, and create report
    - `GET  /api/submissions/assessment/:assessmentId`: list submissions for an assessment
    - `GET  /api/submissions/:id`: get a submission
  - Middleware: `requireAuth` (JWT via `Authorization: Bearer <token>`) 
  - Models: `Assessment`, `Submission`, `User` (MongoDB via Mongoose)

- **Services**
  - `services/nlp.ts`: parse the free‑text notes into constraints
  - `services/ai.ts`: Gemini‑powered question generation, open‑answer evaluation, rich report and insights (with heuristic fallbacks)

## 2) How AI question generation works

Path: `service/src/services/ai.ts`

- Input blueprint: role, tech stack, experience level, preferred question types, duration, and natural‑language notes
- If no API key is configured, a baseline deterministic set is generated (`buildBaselineSet`)
- With a Google Gemini API key, we:
  - Prompt `gemini-1.5-flash` to return a strict JSON array of questions with fields: `type`, `prompt`, `options/correctAnswers` (for MCQ/short), `starterCode/tests` (for coding), and `metadata`
  - Parse JSON defensively (supports raw JSON, fenced code blocks, or slice between `[` and `]`)
  - Normalize questions:
    - MCQ: sanitize options, ensure at least 4 options, coerce answer to a valid option (letter or text)
    - Coding: carry through `starterCode` and test specs
    - Short/Scenario: ensure `correctAnswers` exists
  - Persist assessment with normalized questions

## 3) How natural language parsing works

Path: `service/src/services/nlp.ts`

- `parseNaturalLanguage(notes)` extracts constraints from free text:
  - `makeHeavierOnProblemSolving` when text mentions “problem solving”
  - `includeSystemDesign` when notes mention “system design”
  - `focusSkills`: distinct skill tokens captured from “focus on …” phrases
- `combineToBlueprint` merges structured inputs + parsed constraints into a blueprint given to the AI generator

## 4) How the AI evaluation logic works

Path: `service/src/routes/submissions.ts` and `service/src/services/ai.ts`

- Upon `POST /api/submissions/:assessmentId`:
  - For each question:
    - MCQ/Short: exact match vs normalized `correctAnswers`
    - Coding: execute candidate code safely in `vm2`; run declared tests; score = pass/total
    - Scenario: call `evaluateOpenAnswer()` (Gemini) to get `{ score, feedback }`, with fallback heuristic
  - Compute weighted overall score by question `timeEstimateMin`
  - Build per‑skill breakdown from `metadata.skillTag`
  - Generate rich report via `richEvaluate()` (Gemini) → multi‑paragraph summary + per‑question feedback (fallback if parsing fails)
  - Generate insights via `generateInsights()` (Gemini) → strengths, weaknesses, recommendations, and suggested resources (fallback curated list)
  - Persist a `Submission` with all computed data

## 5) Deployment instructions

### Prerequisites

- Node.js 18+
- MongoDB (Atlas or self‑hosted)
- Google Gemini API key (optional but recommended)

### Environment variables

Create `service/.env` (or configure host env):

```bash
PORT=8080
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=supersecret
GEMINI_API_KEY=your_google_generative_ai_key # optional; enables AI features
```

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:8080
```

### Install & run (development)

```bash
# backend
cd service
npm i
npm run build
npm start

# in another shell
cd ../frontend
npm i
npm run dev
```

Open the app at `http://localhost:5173` (Vite default). Ensure the backend is reachable at `VITE_API_URL`.

### Production build

```bash
# backend (service)
cd service
npm ci
npm run build
NODE_ENV=production npm start

# frontend
cd ../frontend
npm ci
npm run build
npm run preview # or serve dist/ with your web server
```

Serve `frontend/dist/` behind a reverse proxy that forwards `/api/*` to the service. Example Nginx snippet:

```nginx
location /api/ {
  proxy_pass http://localhost:4000/api/;
}
location / {
  root   /var/www/ai-assess/frontend/dist;
  try_files $uri /index.html;
}
```


## Notes

- Without a `GEMINI_API_KEY`, the system falls back to deterministic question generation and heuristic evaluation/insights.
- All AI prompts request strict JSON and the server validates/normalizes outputs defensively.


