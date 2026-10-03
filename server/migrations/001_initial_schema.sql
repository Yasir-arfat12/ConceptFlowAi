-- migrations/001_initial_schema.sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema migrations tracker
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Predefined topics catalog
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty VARCHAR(50) DEFAULT 'beginner',
  aliases TEXT[] DEFAULT '{}',
  is_predefined BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Concepts belonging to a topic
CREATE TABLE IF NOT EXISTS topic_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  explanation TEXT NOT NULL,
  key_points JSONB DEFAULT '[]',
  example TEXT,
  code_snippet TEXT,
  checkpoint_question TEXT NOT NULL,
  checkpoint_rubric JSONB NOT NULL DEFAULT '{}',
  faq JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(topic_id, position)
);
CREATE INDEX IF NOT EXISTS idx_topic_concepts_topic_id ON topic_concepts(topic_id);

-- Learning sessions (one per user per topic start)
CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  topic_title VARCHAR(255) NOT NULL,
  original_query TEXT NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'predefined')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  current_position INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON learning_sessions(status);

-- Per-learner snapshot of concept content
CREATE TABLE IF NOT EXISTS session_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  explanation TEXT NOT NULL,
  key_points JSONB DEFAULT '[]',
  example TEXT,
  code_snippet TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'completed')),
  completed_at TIMESTAMPTZ,
  UNIQUE(session_id, position)
);
-- At most one active concept per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_concepts_one_active
  ON session_concepts(session_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_session_concepts_session_id ON session_concepts(session_id);

-- Checkpoints (one per session_concept)
CREATE TABLE IF NOT EXISTS checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_concept_id UUID NOT NULL UNIQUE REFERENCES session_concepts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  rubric JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_checkpoints_session_concept_id ON checkpoints(session_concept_id);

-- Checkpoint answers/attempts
CREATE TABLE IF NOT EXISTS checkpoint_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkpoint_id UUID NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_no INTEGER NOT NULL DEFAULT 1,
  answer TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  feedback TEXT NOT NULL DEFAULT '',
  missing_points JSONB DEFAULT '[]',
  evaluated_by VARCHAR(20) NOT NULL DEFAULT 'fallback' CHECK (evaluated_by IN ('ai', 'fallback')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_checkpoint_responses_checkpoint_id ON checkpoint_responses(checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_responses_user_id ON checkpoint_responses(user_id);

-- Doubt threads (one per session+concept)
CREATE TABLE IF NOT EXISTS doubt_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  session_concept_id UUID NOT NULL REFERENCES session_concepts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, session_concept_id)
);
CREATE INDEX IF NOT EXISTS idx_doubt_threads_session_id ON doubt_threads(session_id);

-- Doubt messages
CREATE TABLE IF NOT EXISTS doubt_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES doubt_threads(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  source VARCHAR(20) NOT NULL DEFAULT 'ai' CHECK (source IN ('ai', 'fallback')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doubt_messages_thread_id ON doubt_messages(thread_id);

-- AI call log (no prompt text stored)
CREATE TABLE IF NOT EXISTS ai_call_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task VARCHAR(100) NOT NULL,
  model VARCHAR(100),
  latency_ms INTEGER,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'fallback', 'error')),
  fallback_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
