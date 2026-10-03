-- ConceptFlow PostgreSQL Schema
-- Rebuilt from scratch for the true ConceptFlow learning model

-- Drop old/legacy tables if refreshing
DROP TABLE IF EXISTS doubt_messages CASCADE;
DROP TABLE IF EXISTS doubt_threads CASCADE;
DROP TABLE IF EXISTS checkpoint_responses CASCADE;
DROP TABLE IF EXISTS checkpoints CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS session_concepts CASCADE;
DROP TABLE IF EXISTS topic_concepts CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS learning_concepts CASCADE;
DROP TABLE IF EXISTS learning_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;
DROP TABLE IF EXISTS ai_call_log CASCADE;

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    email           VARCHAR(255)  UNIQUE NOT NULL,
    password_hash   VARCHAR(255)  NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- LEARNING SESSIONS
CREATE TABLE IF NOT EXISTS learning_sessions (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic               VARCHAR(500)  NOT NULL,
    status              VARCHAR(20)   NOT NULL DEFAULT 'active',
    progress_percentage INTEGER       NOT NULL DEFAULT 0,
    current_concept_id  INTEGER,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user   ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON learning_sessions(status);

-- LEARNING CONCEPTS
CREATE TABLE IF NOT EXISTS learning_concepts (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER       NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    title           VARCHAR(500)  NOT NULL,
    content         TEXT,
    examples        TEXT,
    key_takeaways   TEXT,
    order_index     INTEGER       NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'locked',
    score           INTEGER,
    mastery_level   VARCHAR(30),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_concepts_session ON learning_concepts(session_id);
CREATE INDEX IF NOT EXISTS idx_concepts_status  ON learning_concepts(status);

-- FOREIGN KEY FOR CURRENT CONCEPT
ALTER TABLE learning_sessions
    ADD CONSTRAINT fk_sessions_current_concept
    FOREIGN KEY (current_concept_id) REFERENCES learning_concepts(id)
    ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;

-- CHECKPOINTS
CREATE TABLE IF NOT EXISTS checkpoints (
    id                    SERIAL PRIMARY KEY,
    learning_concept_id   INTEGER       NOT NULL REFERENCES learning_concepts(id) ON DELETE CASCADE,
    question              TEXT          NOT NULL,
    question_type         VARCHAR(30)   NOT NULL DEFAULT 'open_ended',
    options               JSONB,
    correct_answer        TEXT,
    expected_keywords     JSONB,
    order_index           INTEGER       NOT NULL DEFAULT 1,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checkpoints_concept ON checkpoints(learning_concept_id);

-- CHECKPOINT RESPONSES
CREATE TABLE IF NOT EXISTS checkpoint_responses (
    id              SERIAL PRIMARY KEY,
    checkpoint_id   INTEGER       NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
    user_id         INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    answer          TEXT          NOT NULL,
    score           INTEGER       NOT NULL DEFAULT 0,
    is_correct      BOOLEAN       NOT NULL DEFAULT FALSE,
    feedback        TEXT,
    mastery_level   VARCHAR(30),
    attempt_number  INTEGER       NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_responses_checkpoint ON checkpoint_responses(checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_responses_user       ON checkpoint_responses(user_id);

-- DOUBT MESSAGES
CREATE TABLE IF NOT EXISTS doubt_messages (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER       NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    concept_id      INTEGER       NOT NULL REFERENCES learning_concepts(id) ON DELETE CASCADE,
    user_id         INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(10)   NOT NULL CHECK (role IN ('user', 'assistant')),
    message         TEXT          NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doubts_session ON doubt_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_doubts_concept ON doubt_messages(concept_id);

-- QUIZZES
CREATE TABLE IF NOT EXISTS quizzes (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER       NOT NULL UNIQUE REFERENCES learning_sessions(id) ON DELETE CASCADE,
    questions       JSONB         NOT NULL,
    result          JSONB,
    score           INTEGER,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_quizzes_session ON quizzes(session_id);

-- ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER       NOT NULL UNIQUE REFERENCES learning_sessions(id) ON DELETE CASCADE,
    assignment_data JSONB         NOT NULL,
    result          JSONB,
    score           INTEGER,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assignments_session ON assignments(session_id);
