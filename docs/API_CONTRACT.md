# ConceptFlow AI – API Contract

> **Source of Truth**: Frontend files in `frontend/src/`  
> **Envelope**: `{ success: true, data: {...} }` (success) | `{ success: false, error: { code, message } }` (error)  
> **Auth**: Bearer token in `Authorization` header. Stored in `localStorage` as `conceptflow:token`.

---

## Endpoints

### Auth

#### `POST /api/auth/signup`
- **Auth required**: No
- **Body**: `{ firstName, lastName?, email, password, age?, dob?, address? }`
- **Success 201**: `{ success: true, data: { user: { id, name, email, created_at } } }`
- **Errors**: `409 EMAIL_TAKEN`, `400 VALIDATION_ERROR`
- **Frontend file**: `AuthPage.jsx`

#### `POST /api/auth/login`
- **Auth required**: No
- **Body**: `{ email, password }`
- **Success 200**: `{ success: true, data: { token, user: { id, name, email } } }`
- **Errors**: `401 UNAUTHORIZED`
- **Frontend file**: `AuthPage.jsx`

#### `GET /api/auth/me`
- **Auth required**: Yes
- **Success 200**: `{ success: true, data: { user: { id, name, email, created_at } } }`
- **Errors**: `401 UNAUTHORIZED`
- **Frontend file**: `AppStore.jsx` (user restore on refresh)

---

### Learning Sessions

#### `POST /api/learning/start`
- **Auth required**: Yes
- **Body**: `{ topic: string }` — free-text query (e.g. "Teach me Binary Search")
- **Success 201**: `{ success: true, data: { session: { id, topic_title, source, status, current_position, concepts: [...] } } }`
- **Errors**: `503 AI_TEMPORARILY_UNAVAILABLE` (with `data.suggestions[]` of available topics)
- **Frontend file**: `NewChat.jsx` (navigates to `/dashboard/session?topic=...`) — **DERIVED from UI shape**
- **Notes**: Source of truth for frontend is `Session.jsx` params. Start is called when Session page loads.

#### `GET /api/learning`
- **Auth required**: Yes
- **Success 200**: `{ success: true, data: { sessions: [...] } }`
- **Frontend file**: `SessionHistory.jsx`, `Dashboard.jsx`

#### `GET /api/learning/:sessionId`
- **Auth required**: Yes
- **Success 200**: `{ success: true, data: { session: { id, topic_title, status, current_position, concepts: [...] } } }`
- **Errors**: `404 NOT_FOUND`
- **Frontend file**: `Session.jsx`

#### `GET /api/learning/:sessionId/current`
- **Auth required**: Yes
- **Success 200**: `{ success: true, data: { concept: { id, position, title, explanation, key_points, example, status, checkpoint_id, checkpoint_question }, session: {...}, completed: false } }`
- **Success 200 (all done)**: `{ success: true, data: { completed: true, session: {...} } }`
- **Frontend file**: `Session.jsx`

---

### Checkpoints

#### `POST /api/checkpoints/:checkpointId/answer`
- **Auth required**: Yes
- **Body**: `{ answer: string }`
- **Success 200**: `{ success: true, data: { score, isCorrect, feedback, missingPoints[], evaluatedBy, nextConcept?, sessionCompleted, attemptNo } }`
- **Errors**: `403 CONCEPT_LOCKED`, `409 CONCEPT_NOT_ACTIVE`, `404 NOT_FOUND`
- **Frontend file**: `Session.jsx` — **DERIVED from UI shape** (frontend uses `result.passed` currently; field renamed to `isCorrect`)

> [!NOTE]  
> **Frontend change**: `Session.jsx` uses `result.passed` from the local `gradeAnswer()`. The API returns `isCorrect`. A minimal adapter is added in `api.js` to normalize: `{ ...r, passed: r.isCorrect }`.

---

### Doubts

#### `POST /api/learning/:sessionId/concept/:conceptId/doubt`
- **Auth required**: Yes
- **Body**: `{ question: string }`
- **Success 200**: `{ success: true, data: { threadId, question, answer, source, createdAt } }`
- **Errors**: `403 CONCEPT_LOCKED`, `404 NOT_FOUND`
- **Frontend files**: `DoubtDrawer.jsx` (uses `data.answer`), `Session.jsx`

#### `GET /api/learning/:sessionId/concept/:conceptId/doubt`
- **Auth required**: Yes
- **Success 200**: `{ success: true, data: { threadId?, messages: [{ id, role, content, source, createdAt }] } }`
- **Frontend file**: `DoubtDrawer.jsx` — **DERIVED**

---

### Dashboard & Progress

#### `GET /api/dashboard`
- **Auth required**: Yes
- **Success 200**: `{ success: true, data: { stats: { streak, topicsStarted, topicsCompleted, conceptsCompleted, avgScore }, continueLearning: {...}?, recentSessions: [...] } }`
- **Frontend file**: `Dashboard.jsx` — **DERIVED** (currently uses local AppStore state)

#### `GET /api/progress`
- **Auth required**: Yes
- **Success 200**: `{ success: true, data: { sessions: [{ id, topic_title, status, done, total, last_accessed_at }] } }`
- **Frontend file**: `Insights.jsx`, `SessionHistory.jsx` — **DERIVED**

#### `GET /api/topics`
- **Auth required**: Yes
- **Success 200**: `{ success: true, data: { topics: [{ slug, title, description, difficulty }] } }`
- **Frontend file**: `NewChat.jsx` (suggested topics) — **DERIVED**

---

### System

#### `GET /api/health`
- **Auth required**: No
- **Success 200**: `{ status: "ok"|"degraded", db: "connected"|"disconnected", ai: "live"|"offline", timestamp }`

---

## Error Codes

| Code | HTTP | When |
|------|------|------|
| `UNAUTHORIZED` | 401 | No token or wrong credentials |
| `FORBIDDEN` | 403 | Access denied |
| `CONCEPT_LOCKED` | 403 | Trying to answer/doubt a locked concept |
| `CONCEPT_NOT_ACTIVE` | 409 | Trying to answer an already-completed concept |
| `EMAIL_TAKEN` | 409 | Duplicate email on signup |
| `NOT_FOUND` | 404 | Resource doesn't exist or belongs to another user |
| `VALIDATION_ERROR` | 400 | Invalid request body/params |
| `AI_TEMPORARILY_UNAVAILABLE` | 503 | AI failed and no predefined topic matched |
| `RATE_LIMIT` | 429 | Too many requests |

---

## Frontend Changes

| File | Change | Reason |
|------|--------|--------|
| `AuthPage.jsx` | Replaced hardcoded `fetch('http://localhost:3000/...')` with `api.signup()` / `api.login()` | Required to use the shared API service and store JWT token |
| `AuthPage.jsx` | Added `setToken(token)` after login | JWT was not being stored |
| `vite.config.js` | Added `server.proxy` for `/api` → `http://localhost:3000` | Enables dev without CORS issues |
| `src/lib/api.js` | Created new file | Central API service module |
