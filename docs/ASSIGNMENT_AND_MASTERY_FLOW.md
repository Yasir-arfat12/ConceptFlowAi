# ConceptFlow AI — Assignment and Mastery Flow Architecture

## 1. Overview
The Personalized Assignment System is the final practice stage of a completed learning session in ConceptFlow AI.
Assignments are generated dynamically from the student's actual performance telemetry and target their weakest concepts to solidify conceptual understanding.

```
START SESSION
     ↓
Learn Concept 1 → Checkpoints
     ↓
Learn Concept 2 → Checkpoints
     ↓
...
     ↓
Complete Final Concept
     ↓
SESSION COMPLETED
     ↓
Analyze Student Performance & Identify Weak/Strong Concepts
     ↓
Generate Personalized Assignment (8 Concept-Mapped Questions)
     ↓
Student Takes Interactive Assignment (Locked Answers & Immediate Feedback)
     ↓
Recalculate Concept Mastery (Checkpoint 50% + Quiz 30% + Assignment 20%)
     ↓
Update Overall Mastery, Insights & Dashboard
```

---

## 2. Mastery Calculation Formula
Concept mastery is calculated authoritatively in PostgreSQL using the following normalized weighting:
- **Checkpoint questions**: 50%
- **Session Quiz Performance**: 30%
- **Session Assignment Performance**: 20%

If a quiz has not yet been completed, the formula normalizes between available components:
- Checkpoints: ~71.4% (50 / 70)
- Assignment: ~28.6% (20 / 70)

---

## 3. Assignment Generation & Question Structure
Every assignment contains 8 concept-mapped questions weighted heavily towards weak areas:
- **Weak Concepts**: ~70% (5–6 questions)
- **Strong & Application Concepts**: ~30% (2–3 questions)

### Difficulty Calibration:
- `0–49%`: **Needs Practice** (Foundational, guided explanations, misconception detection)
- `50–74%`: **Developing** (Application, implementation, edge cases, debugging)
- `75–89%`: **Strong** (Complex reasoning, optimization, variations)
- `90–100%`: **Mastered** (Advanced problems, real-world scenarios, deeper reasoning)

---

## 4. Database Schema
1. `assignments`:
   - `id SERIAL PRIMARY KEY`
   - `session_id INTEGER NOT NULL UNIQUE REFERENCES learning_sessions(id) ON DELETE CASCADE`
   - `assignment_data JSONB NOT NULL` (contains 8 structured questions)
   - `status VARCHAR(20) DEFAULT 'ready'` ('ready' | 'in_progress' | 'completed')
   - `score INTEGER`
   - `result JSONB`
   - `completed_at TIMESTAMPTZ`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`

2. `assignment_attempts`:
   - `id SERIAL PRIMARY KEY`
   - `assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE`
   - `user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`
   - `session_id INTEGER REFERENCES learning_sessions(id) ON DELETE CASCADE`
   - `score INTEGER DEFAULT 0`
   - `total_questions INTEGER DEFAULT 0`
   - `correct_answers INTEGER DEFAULT 0`
   - `percentage INTEGER DEFAULT 0`
   - `status VARCHAR(20) DEFAULT 'in_progress'`
   - `completed_at TIMESTAMPTZ`

3. `assignment_attempt_answers`:
   - `id SERIAL PRIMARY KEY`
   - `attempt_id INTEGER REFERENCES assignment_attempts(id) ON DELETE CASCADE`
   - `question_id VARCHAR(100) NOT NULL`
   - `concept_id INTEGER REFERENCES learning_concepts(id) ON DELETE SET NULL`
   - `selected_answer TEXT`
   - `correct_answer TEXT`
   - `is_correct BOOLEAN DEFAULT FALSE`
   - `explanation TEXT`
   - `feedback TEXT`

---

## 5. API Endpoints
- `GET  /api/learning/assignments`: Returns all personalized assignments for user.
- `GET  /api/learning/assignments/latest`: Returns most recently completed session's assignment.
- `GET  /api/learning/:sessionId/assignment`: Returns assignment details and attempt progress.
- `POST /api/learning/:sessionId/assignment`: Generates or retrieves assignment.
- `POST /api/learning/:sessionId/assignment/attempt`: Starts or resumes an attempt.
- `POST /api/learning/:sessionId/assignment/answer`: Evaluates and locks single question answer.
- `POST /api/learning/:sessionId/assignment/submit`: Finalizes assignment and updates mastery.
