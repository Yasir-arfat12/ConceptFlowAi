# ConceptFlow Planner → Session Integration Flow

## Architecture Overview
The Planner is directly integrated into the single source of truth: **PostgreSQL-backed learning sessions**.
There are no fake/localStorage sessions or duplicate learning pages. The Planner and the Dashboard both converge on the exact same Learning/Tutor session experience.

---

## 1. End-to-End User & Data Flow

```
Planner (Enter "Binary Search")
      │
      ▼
GET /api/learning/preview?topic=Binary+Search
      │ (Returns 6 concepts from prebuiltBinarySearch)
      ▼
Render Modern Plan Card + Concept Timeline
      │
      ▼
User clicks [ ▶ Start Session ] / [ ▶ Continue Session ]
      │
      ▼
POST /api/learning/start { topic: 'Binary Search', resumeIfExists: true }
      │
      ├── If active session exists → returns existing sessionId (status 200)
      └── If no active session → creates session + 6 concepts in PostgreSQL (status 201)
      │
      ▼
Navigate to: dashboard/session?sessionId={sessionId}
      │
      ▼
Session Page loads: GET /api/learning/{sessionId}
      │ (Concept 1 active, Concepts 2-6 locked)
      ▼
User answers Checkpoint 1: POST /api/checkpoints/{checkpointId}/answer
      │ (Backend updates PostgreSQL: Concept 1 = completed, Concept 2 = active)
      ▼
User navigates to Dashboard
      │
      ▼
Dashboard loads: GET /api/dashboard
      │ (Returns activeSessionId, currentConcept = Concept 2)
      ▼
Dashboard "Continue Learning" button has:
navigateTo('dashboard/session?sessionId=' + activeSession.id)
      │
      ▼
Returns to EXACT SAME session at Concept 2 with no progress loss or duplication
```

---

## 2. API Contract Reference

### A. Topic Preview & Curriculum Discovery
- **Endpoint**: `GET /api/learning/preview?topic={topic}`
- **Auth**: Optional / Public
- **Request Parameters**:
  - `topic`: `string` (e.g. `Binary Search`, `binary-search`, `Dynamic Programming`)
- **Response (Supported - Binary Search)**:
```json
{
  "success": true,
  "data": {
    "isSupported": true,
    "topic": "Binary Search",
    "description": "Master Binary Search from fundamentals to implementation, edge cases, and algorithmic complexity.",
    "totalConcepts": 6,
    "features": [
      "6 Interactive Concepts",
      "Checkpoint Knowledge Checks",
      "Progressive Difficulty Scaling",
      "PostgreSQL Cloud Session Sync"
    ],
    "concepts": [
      { "orderIndex": 1, "title": "Searching Basics and Why Sorted Data Matters", "keyTakeaways": "..." },
      { "orderIndex": 2, "title": "Binary Search Intuition", "keyTakeaways": "..." },
      { "orderIndex": 3, "title": "The Binary Search Algorithm", "keyTakeaways": "..." },
      { "orderIndex": 4, "title": "Implementing Binary Search", "keyTakeaways": "..." },
      { "orderIndex": 5, "title": "Boundary Conditions and Edge Cases", "keyTakeaways": "..." },
      { "orderIndex": 6, "title": "Time Complexity, Variations and Applications", "keyTakeaways": "..." }
    ]
  }
}
```
- **Response (Unsupported Topic)**:
```json
{
  "success": true,
  "data": {
    "isSupported": false,
    "topic": "Dynamic Programming",
    "message": "More learning paths are coming soon. Binary Search is currently available with full interactive checkpoints.",
    "supportedTopics": ["Binary Search"]
  }
}
```

---

### B. Session Creation / Resumption
- **Endpoint**: `POST /api/learning/start`
- **Auth**: Required (`Bearer {JWT}`)
- **Request Body**:
```json
{
  "topic": "Binary Search",
  "resumeIfExists": true
}
```
- **Response (201 Created or 200 Resumed)**:
```json
{
  "success": true,
  "resumed": false,
  "data": {
    "session": {
      "id": 14,
      "user_id": 2,
      "topic": "Binary Search",
      "status": "active",
      "progress_percentage": 0,
      "current_concept_id": 85
    },
    "concepts": [
      { "id": 85, "title": "Searching Basics and Why Sorted Data Matters", "status": "active", "orderIndex": 1 },
      { "id": 86, "title": "Binary Search Intuition", "status": "locked", "orderIndex": 2 },
      { "id": 87, "title": "The Binary Search Algorithm", "status": "locked", "orderIndex": 3 },
      { "id": 88, "title": "Implementing Binary Search", "status": "locked", "orderIndex": 4 },
      { "id": 89, "title": "Boundary Conditions and Edge Cases", "status": "locked", "orderIndex": 5 },
      { "id": 90, "title": "Time Complexity, Variations and Applications", "status": "locked", "orderIndex": 6 }
    ],
    "currentConcept": {
      "id": 85,
      "title": "Searching Basics and Why Sorted Data Matters",
      "status": "active",
      "orderIndex": 1
    }
  }
}
```

---

### C. Session State Retrieval
- **Endpoint**: `GET /api/learning/:sessionId`
- **Auth**: Required (`Bearer {JWT}`)
- **Response**: Full session object, list of concepts with individual statuses (`active`, `completed`, `locked`), score, and checkpoints.

---

### D. Checkpoint Evaluation
- **Endpoint**: `POST /api/checkpoints/:checkpointId/answer`
- **Auth**: Required (`Bearer {JWT}`)
- **Request Body**:
```json
{
  "answer": "Binary search requires sorted data so we can discard half the search space with each step."
}
```
- **Behavior**: Evaluates keywords, records response in `checkpoint_responses`, updates concept status to `'completed'`, unlocks next concept to `'active'`, updates session progress percentage in PostgreSQL.

---

### E. Dashboard Synchronization
- **Endpoint**: `GET /api/dashboard`
- **Auth**: Required (`Bearer {JWT}`)
- **Behavior**: Aggregates real PostgreSQL data:
  - `activeSessionId`: Current active session ID
  - `currentConcept`: ID and title of current active concept
  - `mastery`: Overall score and concept breakdown
- **Dashboard Action**:
  - `Continue Learning` button routes to `dashboard/session?sessionId={activeSessionId}`.

---

## 3. Duplicate Session Prevention
1. **Frontend**: Debounced/disabled `isStarting` state prevents rapid duplicate clicks.
2. **Backend**: `resumeIfExists: true` checks `learning_sessions` for an existing active session with the same topic for the authenticated user and returns it instead of creating a duplicate.
3. **Dashboard Resume**: Always passes the existing `activeSession.id` in query parameters.
