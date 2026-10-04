# ConceptFlow AI — Session-Based Personalized Quiz & Mastery Intelligence Flow

## 1. Overview & Pedagogical Loop
ConceptFlow AI operates a connected learning intelligence loop that links:

$$\text{Learning Session} \longrightarrow \text{Concept Checkpoints} \longrightarrow \text{Personalized Quiz} \longrightarrow \text{PostgreSQL Evaluation} \longrightarrow \text{Concept Mastery} \longrightarrow \text{Weak Area Identification} \longrightarrow \text{Targeted Assignment}$$

Every quiz and assignment is session-aware, concept-anchored, and directly influences both concept-level mastery and overall student understanding without using fake or hardcoded metrics.

---

## 2. Session Selection Priority
When a student navigates to the **Quiz** section, ConceptFlow determines the active learning context using the following deterministic hierarchy:
1. **Explicit Session Parameter:** `?sessionId=<id>`
2. **Current Active Session:** `learning_sessions.status = 'active'`
3. **Most Recent Incomplete Session:** `progress_percentage < 100` ordered by `updated_at DESC`
4. **Most Recent Completed Session:** Latest session completed by the user
5. **No Sessions Found:** Presents an encouraging zero-state with a direct link to `[ Start Learning a Topic ]`.

---

## 3. Quiz Generation Architecture

### A. Contextual Inputs Provided to Generation
Quiz generation incorporates the complete state of the student's learning session:
- **Session Topic:** (e.g. *Binary Search*)
- **Concepts List:** Title, content, order index, and database IDs
- **Checkpoint Performance:** Scores achieved on each concept checkpoint
- **Concept Mastery State:** Mastered ($\ge 80\%$), Developing ($60-79\%$), Needs Practice ($<60\%$)
- **Weak Concepts List:** Concepts identified as having low scores or incorrect responses

### B. Adaptive Question Distribution
- Default Quiz Length: **10 questions**.
- Questions are systematically mapped to the session's concepts.
- If weak concepts are identified, 3–4 questions are concentrated on those concepts with diagnostic feedback.
- Strong concepts receive reasoning and application scenarios to test edge cases.

### C. Offline / Binary Search Demo Fallback
- For hackathon resilience, Binary Search includes 10 prebuilt deterministic questions mapped across all 6 concepts.
- When external AI is offline, Binary Search generates instantly with 100% offline availability.

---

## 4. Question & Quiz JSON Structure
Each question contains comprehensive concept mapping and option-level diagnostic feedback:
```json
{
  "id": "bs_q5",
  "conceptId": 205,
  "conceptTitle": "Boundary Conditions and Edge Cases",
  "type": "single_select",
  "question": "When searching for target 2 in duplicate array [1, 2, 2, 2, 3], how do you locate the FIRST occurrence?",
  "options": [
    {
      "value": "A",
      "label": "Return mid immediately upon finding nums[mid] == 2",
      "feedback": "Returning immediately might return the middle or last occurrence."
    },
    {
      "value": "B",
      "label": "Set left = mid + 1 upon match",
      "feedback": "Moving right would search for later occurrences."
    },
    {
      "value": "C",
      "label": "Record mid as candidate answer and set right = mid - 1 to keep searching left",
      "feedback": "Correct! Recording the match and continuing left discovers earlier occurrences."
    },
    {
      "value": "D",
      "label": "Restart binary search from index 0",
      "feedback": "Binary search can locate boundaries in O(log n) without linear restart."
    }
  ],
  "correctAnswer": "C",
  "correctOptionIndex": 2,
  "explanation": "To find the first occurrence, when nums[mid] === target, record result = mid and move right = mid - 1 to search the left partition.",
  "hint": "Do not exit on first match; keep searching leftward while remembering the best answer."
}
```

---

## 5. PostgreSQL Database Schema

### `quizzes`
Stores the generated questions and latest result summary for each session:
```sql
CREATE TABLE IF NOT EXISTS quizzes (
  id              SERIAL PRIMARY KEY,
  session_id      INTEGER NOT NULL UNIQUE REFERENCES learning_sessions(id) ON DELETE CASCADE,
  questions       JSONB NOT NULL,
  result          JSONB,
  score           INTEGER,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `quiz_attempts`
Tracks every attempt taken by the student for historical trend and analytics:
```sql
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id          INTEGER NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  quiz_id             INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  score               INTEGER NOT NULL DEFAULT 0,
  total_questions     INTEGER NOT NULL DEFAULT 0,
  correct_answers     INTEGER NOT NULL DEFAULT 0,
  percentage          INTEGER NOT NULL DEFAULT 0,
  completed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `quiz_attempt_answers`
Stores question-level answers mapped to specific concept IDs:
```sql
CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
  id                  SERIAL PRIMARY KEY,
  attempt_id          INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id         VARCHAR(100),
  concept_id          INTEGER REFERENCES learning_concepts(id) ON DELETE SET NULL,
  selected_answer     TEXT,
  correct_answer      TEXT,
  is_correct          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 6. Single Source of Truth Mastery Calculation (`masteryService.js`)

Concept scores are recalculated in PostgreSQL upon checkpoint submissions, quiz evaluations, and assignment completions:

### Concept Mastery Weighting Formula
For each concept $c$:
$$\text{Score}(c) = \frac{0.5 \cdot \text{Checkpoint}(c) + 0.3 \cdot \text{Quiz}(c) + 0.2 \cdot \text{Assignment}}{\text{Available Weights}}$$

- **Checkpoints ($50\%$ weight):** Average checkpoint response scores for concept $c$.
- **Quiz ($30\%$ weight):** Accuracy percentage of quiz questions specifically mapped to concept $c$.
- **Assignment ($20\%$ weight):** Evaluated score of the session assignment.
- Normalized dynamically when only a subset of assessments have been completed.

### Concept Mastery Classification
- **Mastered ($\ge 80\%$):** Deep conceptual foundation.
- **Developing ($60\% - 79\%$):** Core logic understood, but gaps in edge cases or variations.
- **Needs Practice ($< 60\%$):** Recurring misconceptions requiring targeted practice.

---

## 7. Weak Concepts $\longrightarrow$ Personalized Assignment Flow

1. Following quiz submission, `submitQuiz` identifies concepts where the student scored $< 75\%$.
2. The results screen presents a **Recommended Next Step** card detailing the weak concept and offering a `[ Start Assignment ]` button.
3. `POST /api/learning/:sessionId/assignment` analyzes those weak concepts to construct targeted practice tasks (e.g. *Boundary conditions, duplicate occurrences, and empty array handling*).
4. The student solves the assignment in the interactive editor and submits it via `POST /api/learning/:sessionId/assignment/submit`.
5. The assignment submission is graded, stored in PostgreSQL, and calls `recalculateSessionMastery`, boosting concept mastery and completing the continuous improvement loop.

---

## 8. API Endpoints Contract

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/learning/:sessionId/quiz` | Generates 10-question quiz mapped to concepts |
| `GET` | `/api/learning/:sessionId/quiz` | Retrieves existing quiz questions |
| `POST` | `/api/learning/:sessionId/quiz/submit` | Evaluates answers, stores attempt, updates concept mastery |
| `POST` | `/api/learning/:sessionId/assignment` | Generates personalized assignment for weak concepts |
| `GET` | `/api/learning/:sessionId/assignment` | Retrieves session assignment |
| `POST` | `/api/learning/:sessionId/assignment/submit` | Evaluates assignment and updates mastery in PostgreSQL |
| `GET` | `/api/dashboard` | Returns live mastery, breakdown, and score trends |
