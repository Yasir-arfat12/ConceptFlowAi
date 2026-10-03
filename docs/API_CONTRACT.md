# ConceptFlow AI — REST API Contract

All endpoints follow standard REST conventions and return structured JSON responses.

### Global Response Envelopes

#### Success Envelope
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable explanation"
  }
}
```

---

## 1. Authentication Endpoints

### 1.1 Register
- **Route**: `POST /api/auth/register`
- **Auth**: Public
- **Body**:
  ```json
  {
    "name": "Alex Student",
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Alex Student",
        "email": "alex@example.com"
      },
      "token": "eyJhbGciOi..."
    },
    "user": { ... },
    "token": "..."
  }
  ```

### 1.2 Login
- **Route**: `POST /api/auth/login`
- **Auth**: Public
- **Body**:
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Alex Student",
        "email": "alex@example.com"
      },
      "token": "eyJhbGciOi..."
    },
    "user": { ... },
    "token": "..."
  }
  ```

### 1.3 Get Current User
- **Route**: `GET /api/auth/me`
- **Auth**: Required (`Bearer <token>` or HTTP-only cookie)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": 1,
        "name": "Alex Student",
        "email": "alex@example.com",
        "created_at": "2026-10-04T01:30:00.000Z"
      }
    }
  }
  ```

### 1.4 Logout
- **Route**: `POST /api/auth/logout`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": { "message": "Logged out successfully." }
  }
  ```

---

## 2. Learning Sessions Endpoints

### 2.1 Start Learning Session
- **Route**: `POST /api/learning/start`
- **Auth**: Required
- **Body**:
  ```json
  {
    "topic": "Teach me Binary Search"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "session": {
        "id": 10,
        "topic": "Binary Search",
        "status": "active",
        "progress_percentage": 0,
        "current_concept_id": 101
      },
      "concepts": [
        { "id": 101, "title": "Searching Basics and Why Sorted Data Matters", "status": "active", "orderIndex": 1 },
        { "id": 102, "title": "Binary Search Intuition", "status": "locked", "orderIndex": 2 },
        { "id": 103, "title": "Binary Search Algorithm", "status": "locked", "orderIndex": 3 },
        { "id": 104, "title": "Implementing Binary Search", "status": "locked", "orderIndex": 4 },
        { "id": 105, "title": "Boundary Conditions and Edge Cases", "status": "locked", "orderIndex": 5 },
        { "id": 106, "title": "Time Complexity, Variations and Applications", "status": "locked", "orderIndex": 6 }
      ],
      "currentConcept": {
        "id": 101,
        "title": "Searching Basics and Why Sorted Data Matters",
        "content": "...",
        "examples": "...",
        "keyTakeaways": "...",
        "orderIndex": 1,
        "status": "active",
        "checkpoints": [
          { "id": 501, "question": "Why must the array be sorted before using binary search?", "expected_keywords": ["sorted", "eliminate", "half"] }
        ]
      }
    }
  }
  ```

### 2.2 Get User Sessions
- **Route**: `GET /api/learning`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "sessions": [
        {
          "id": 10,
          "topic": "Binary Search",
          "status": "active",
          "progress_percentage": 17,
          "current_concept_id": 102,
          "updated_at": "2026-10-04T01:35:00.000Z"
        }
      ]
    }
  }
  ```

### 2.3 Get Session Details
- **Route**: `GET /api/learning/:sessionId`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "session": { "id": 10, "topic": "Binary Search", "status": "active", "progress_percentage": 17 },
      "concepts": [ ... ],
      "currentConcept": { ... }
    }
  }
  ```

### 2.4 Get Current Concept
- **Route**: `GET /api/learning/:sessionId/current`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "currentConcept": {
        "id": 102,
        "title": "Binary Search Intuition",
        "content": "...",
        "examples": "...",
        "keyTakeaways": "...",
        "orderIndex": 2,
        "status": "active",
        "checkpoints": [ ... ]
      }
    }
  }
  ```

### 2.5 Get Specific Concept
- **Route**: `GET /api/learning/:sessionId/concepts/:conceptId`
- **Auth**: Required
- **Behavior**:
  - If concept is `locked`, returns `403 Forbidden` (`code: CONCEPT_LOCKED`).
  - If concept is `active` or `completed`, returns `200 OK` with full concept body and checkpoints.

---

## 3. Checkpoint & Answer Evaluation Endpoints

### 3.1 Get Concept Checkpoints
- **Route**: `GET /api/learning/:sessionId/concepts/:conceptId/checkpoints`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "checkpoints": [
        {
          "id": 501,
          "question": "Why must the array be sorted before using binary search?",
          "question_type": "open_ended",
          "order_index": 1
        }
      ]
    }
  }
  ```

### 3.2 Submit Checkpoint Answer
- **Route**: `POST /api/checkpoints/:checkpointId/answer`
- **Auth**: Required
- **Body**:
  ```json
  {
    "answer": "Binary search requires sorted order so comparing with the mid element allows us to eliminate half the array."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "score": 100,
      "isCorrect": true,
      "feedback": "Outstanding answer! You clearly explained that sorted order permits discarding half the elements.",
      "masteryLevel": "Strong understanding",
      "passed": true,
      "passScore": 60,
      "conceptCompleted": true,
      "sessionCompleted": false,
      "nextConceptId": 102,
      "nextConceptTitle": "Binary Search Intuition",
      "attemptNumber": 1
    }
  }
  ```

---

## 4. Contextual Doubt Endpoints

### 4.1 Ask Contextual Doubt
- **Route**: `POST /api/learning/:sessionId/concepts/:conceptId/doubt`
- **Auth**: Required
- **Body**:
  ```json
  {
    "question": "Why does eliminating half the elements make the complexity logarithmic?"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "answer": "Each comparison cuts the remaining candidates in half: n -> n/2 -> n/4 ...",
      "conceptTitle": "Binary Search Intuition",
      "learningStateModified": false
    },
    "answer": "Each comparison cuts the remaining candidates in half..."
  }
  ```

### 4.2 Get Concept Doubt History
- **Route**: `GET /api/learning/:sessionId/concepts/:conceptId/doubts`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "messages": [
        { "id": 1, "role": "user", "message": "Why does eliminating half...", "created_at": "..." },
        { "id": 2, "role": "assistant", "message": "Each comparison cuts...", "created_at": "..." }
      ]
    }
  }
  ```

### 4.3 General / Direct Tutor Helper
- **Route**: `POST /api/tutor`
- **Auth**: Optional
- **Body**:
  ```json
  {
    "question": "Why does binary search need sorted data?",
    "context": { "title": "Searching Basics" }
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "answer": "Binary search halves the search space...",
    "data": { "answer": "Binary search halves the search space..." }
  }
  ```

---

## 5. Quizzes & Assignments

### 5.1 Create / Retrieve Quiz
- **Route**: `POST /api/learning/:sessionId/quiz`
- **Auth**: Required
- **Response** (`200 OK` or `201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "quiz": { "id": 1, "questions": [ ... ] },
      "questions": [ ... ]
    }
  }
  ```

### 5.2 Submit Quiz
- **Route**: `POST /api/learning/:sessionId/quiz/submit`
- **Auth**: Required
- **Body**:
  ```json
  {
    "answers": [
      { "questionIndex": 0, "selectedAnswer": "sorted" }
    ]
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "score": 100,
      "correct": 5,
      "total": 5,
      "breakdown": [ ... ],
      "feedback": "Excellent work!"
    }
  }
  ```

### 5.3 Create / Retrieve Assignment
- **Route**: `POST /api/learning/:sessionId/assignment`
- **Auth**: Required
- **Response** (`200 OK` or `201 Created`):
  ```json
  {
    "success": true,
    "data": {
      "assignment": {
        "title": "Binary Search Implementation & Edge Cases",
        "description": "...",
        "tasks": [ ... ]
      }
    }
  }
  ```

### 5.4 Submit Assignment
- **Route**: `POST /api/learning/:sessionId/assignment/submit`
- **Auth**: Required
- **Body**:
  ```json
  {
    "code": "function binarySearch(arr, target) { ... }"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "score": 85,
      "feedback": "✓ Binary search implementation looks complete. ✓ Search modification logic is present."
    }
  }
  ```

---

## 6. Progress & Dashboard Endpoints

### 6.1 Get Progress
- **Route**: `GET /api/progress`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "sessions": [
        { "sessionId": 10, "topic": "Binary Search", "progress": 17, "status": "active" }
      ],
      "overall": {
        "totalSessions": 1,
        "completedSessions": 0,
        "totalConcepts": 6,
        "completedConcepts": 1,
        "overallPercentage": 17
      }
    }
  }
  ```

### 6.2 Get Dashboard Stats
- **Route**: `GET /api/dashboard`
- **Auth**: Required
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "stats": {
        "totalSessions": 1,
        "completedSessions": 0,
        "activeSessions": 1,
        "totalConcepts": 6,
        "completedConcepts": 1,
        "averageCheckpointScore": 100,
        "correctAnswersCount": 1
      },
      "activeSession": { ... },
      "currentConcept": { ... },
      "recentSessions": [ ... ]
    }
  }
  ```
