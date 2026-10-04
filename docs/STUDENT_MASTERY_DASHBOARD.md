# ConceptFlow AI — Student Mastery Dashboard Architecture & Implementation

## 1. Overview & Philosophy
ConceptFlow is a concept-based personalized learning platform. Rather than tracking superficial activity metrics (e.g. session counts, raw clickstream, or generic assignments), ConceptFlow's Student Mastery Dashboard answers the central pedagogical question:

> **"How well does this student actually understand what they are learning?"**

The dashboard functions as the student's **Personal Learning Intelligence Center**, providing deep, trustworthy insight into concept mastery, strengths, learning gaps, and actionable next steps.

---

## 2. Architecture & Mastery Calculation Engine

### A. Authoritative Backend Calculation (`server/src/controllers/dashboardController.js`)
All mastery metrics and insights are calculated in PostgreSQL/Node.js to ensure a single source of truth:
1. **Concept Score Determination:**
   - Evaluated checkpoints for each concept are scored between 0 and 100 via AI grading and stored in `checkpoint_responses`.
   - The concept's authoritative score is the average of checkpoint scores attained for that concept.
2. **Mastery Status Classification:**
   - **Mastered (>= 80%):** Strong conceptual foundation and comprehension.
   - **Developing (60% – 79%):** Core intuition understood, but needs consolidation.
   - **Needs Practice (< 60%):** Edge cases, syntax, or reasoning errors detected.
   - **Not Started (—):** Concept has not yet been unlocked or evaluated.
3. **Overall Mastery Score:**
   - Authoritative average of all completed concepts.
   - If no concepts are completed yet, overall score is `0` with label `"Not Started"`.
   - Label brackets:
     - `>= 85%`: `"Mastered Understanding"`
     - `>= 70%`: `"Good Understanding"`
     - `>= 50%`: `"Developing Understanding"`
     - `< 50%`: `"Foundational"`
4. **Learning Insights:**
   - Derived deterministically from actual checkpoint performance rather than fabricated AI strings.
   - Identifies whether the student excels in fundamentals vs edge cases, or highlights concepts with low checkpoint scores.
5. **Consistency Strip:**
   - Real 7-day (Monday to Sunday) activity map verifying active sessions on each calendar day.

---

## 3. Two-Level Dashboard Architecture

### Level 1: Home Dashboard (`frontend/src/pages/Dashboard.jsx`)
- **Personalized Header:** Dynamic greeting with the authenticated student's name (`Welcome back, [Name] 👋`).
- **Continue Learning Card:** Identifies the active learning session, current concept node, and progress percentage with a direct `[Continue Learning]` action.
- **Overall Mastery Card:** SVG radial gauge visualization with overall percentage, label, and breakdown badges (*Strong*, *Developing*, *Needs Practice*).
- **Learning Intelligence Stats Grid:**
  - Concepts Mastered
  - Checkpoints Completed
  - Average Score
  - Learning Streak
- **Learning Journey Pathway:** Visual connected node sequence of concepts in the active session showing completion checkmarks, active indicators, locked states, and individual scores.
- **Strong Areas vs Areas to Improve:**
  - Identifies top-scoring concepts (>= 75%).
  - Identifies weak concepts (< 75%) with direct `[Review Concept]` navigation back to the tutor.
- **Learning Consistency:** 7-day weekday activity indicators.
- **Deterministic Learning Insight:** Trustworthy, data-driven assessment of current performance.
- **Recent Learning Sessions:** History of recent topics with average scores and resume triggers.
- **Zero-State Onboarding:** When a new student has 0 sessions, an encouraging onboarding interface is presented with recommended topics (Binary Search, Dynamic Programming, System Design, Graph Algorithms).

### Level 2: My Mastery Analytics (`frontend/src/pages/Insights.jsx`)
- **Header:** *"My Mastery Analytics — Understand what you know, what you're improving, and where to focus next."*
- **Top 4 KPI Metrics:**
  - Overall Mastery Score
  - Average Checkpoint Score
  - Concepts Mastered
  - Concepts in Progress
- **Mastery Distribution Breakdown:** Multi-segment progress bar and 4-tier categorization (Mastered, Developing, Needs Practice, Not Started).
- **Understanding Over Time (Score Trend):** Historical checkpoint score progression line graph reflecting whether the student's mastery is increasing.
- **Concept Performance Table:** Searchable, status-filtered breakdown of every concept with scores, status badges, and action buttons (`[Review]`, `[Continue]`).
- **Personalized Next Focus Card:** Pinpoints the highest priority concept to revisit or continue with contextual guidance and a direct launch button.

---

## 4. API Endpoints & Response Schema

### `GET /api/dashboard`
Returns:
```json
{
  "progress": {
    "totalSessions": 3,
    "completedSessions": 1,
    "completedConcepts": 4,
    "averageScore": 82,
    "totalCheckpointsAnswered": 12,
    "currentStreak": 3
  },
  "mastery": {
    "overall": 82,
    "label": "Good Understanding",
    "mastered": 3,
    "developing": 1,
    "needsPractice": 0,
    "notStarted": 4,
    "total": 8,
    "strongAreas": [
      { "id": "uuid-1", "title": "Searching Basics", "topic": "Binary Search", "score": 92 }
    ],
    "areasToImprove": [
      { "id": "uuid-2", "title": "Edge Cases", "topic": "Binary Search", "score": 58, "sessionId": "uuid-session" }
    ],
    "scoreTrend": [
      { "score": 75, "date": "2026-10-01", "concept": "Basics" },
      { "score": 85, "date": "2026-10-03", "concept": "Intuition" }
    ],
    "consistency": [
      { "day": "Mon", "active": true, "count": 1 },
      { "day": "Tue", "active": true, "count": 2 },
      { "day": "Wed", "active": false, "count": 0 }
    ],
    "insight": "Strong grasp on fundamentals across Binary Search. Review Edge Cases to boost mastery.",
    "journey": [
      { "id": "uuid-1", "title": "Searching Basics", "order": 1, "status": "COMPLETED", "score": 92 },
      { "id": "uuid-2", "title": "Intuition", "order": 2, "status": "ACTIVE", "score": 84 }
    ],
    "allConcepts": [...],
    "nextFocus": {
      "concept": "Binary Search — Edge Cases",
      "score": 58,
      "reason": "Recent checkpoint score is below target threshold. Revisit this concept before moving forward.",
      "sessionId": "uuid-session"
    }
  },
  "currentLearning": {
    "sessionId": "uuid-session",
    "topic": "Binary Search",
    "currentConcept": "Intuition",
    "currentConceptIndex": 2,
    "totalConcepts": 5,
    "progressPercentage": 40
  },
  "recentSessions": [...]
}
```

---

## 5. UI/UX Design System Continuity
- **Palette:** Deep pitch black background (`#000000`), subtle cards (`bg-[#0A0A0A]` with `border-white/10`), high-contrast pure white headers (`#FFFFFF`), muted metadata (`text-white/40` and `text-white/60`).
- **Accent Indicators:** Emerald green (`#10B981` / `bg-emerald-500`) for Mastered, Amber (`#F59E0B` / `bg-amber-500`) for Developing, Rose (`#F43F5E` / `bg-rose-500`) for Needs Practice.
- **Typography & Spacing:** Strict adherence to the standard font hierarchy, compact badges, smooth transitions, and responsive grid layouts (stacking seamlessly on mobile and tablet).
