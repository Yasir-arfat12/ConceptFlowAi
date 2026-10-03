/**
 * ConceptFlow DB Initialization
 * Run: node src/models/initDb.js
 * Creates all tables required by the ConceptFlow learning model.
 */
require('dotenv').config();
const { pool } = require('../config/db');

const initDb = async (options = {}) => {
  const reset = options.reset || process.argv.includes('--reset') || process.env.RESET_DB === 'true';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if legacy tables (e.g., users with UUID id) exist
    const checkType = await client.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'id'
    `);
    const isLegacy = checkType.rows.length > 0 && checkType.rows[0].data_type !== 'integer';

    if (reset || isLegacy) {
      console.log('🔄 Rebuilding database schema cleanly...');
      await client.query(`
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
      `);
    }

    // USERS
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id              SERIAL PRIMARY KEY,
        name            VARCHAR(100)  NOT NULL,
        email           VARCHAR(255)  UNIQUE NOT NULL,
        password_hash   VARCHAR(255)  NOT NULL,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);

    // LEARNING SESSIONS
    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_sessions (
        id                  SERIAL PRIMARY KEY,
        user_id             INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic               VARCHAR(500)  NOT NULL,
        status              VARCHAR(20)   NOT NULL DEFAULT 'active',
        progress_percentage INTEGER       NOT NULL DEFAULT 0,
        current_concept_id  INTEGER,
        created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_user   ON learning_sessions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_status ON learning_sessions(status)`);

    // LEARNING CONCEPTS
    await client.query(`
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
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_concepts_session ON learning_concepts(session_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_concepts_status  ON learning_concepts(status)`);

    // Add FK from learning_sessions.current_concept_id to learning_concepts
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_sessions_current_concept'
        ) THEN
          ALTER TABLE learning_sessions
            ADD CONSTRAINT fk_sessions_current_concept
            FOREIGN KEY (current_concept_id) REFERENCES learning_concepts(id)
            ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED;
        END IF;
      END
      $$
    `);

    // CHECKPOINTS
    await client.query(`
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
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_checkpoints_concept ON checkpoints(learning_concept_id)`);

    // CHECKPOINT RESPONSES
    await client.query(`
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
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_responses_checkpoint ON checkpoint_responses(checkpoint_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_responses_user       ON checkpoint_responses(user_id)`);

    // DOUBT MESSAGES
    await client.query(`
      CREATE TABLE IF NOT EXISTS doubt_messages (
        id              SERIAL PRIMARY KEY,
        session_id      INTEGER       NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
        concept_id      INTEGER       NOT NULL REFERENCES learning_concepts(id) ON DELETE CASCADE,
        user_id         INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role            VARCHAR(10)   NOT NULL CHECK (role IN ('user', 'assistant')),
        message         TEXT          NOT NULL,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_doubts_session ON doubt_messages(session_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_doubts_concept ON doubt_messages(concept_id)`);

    // QUIZZES
    await client.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id              SERIAL PRIMARY KEY,
        session_id      INTEGER       NOT NULL UNIQUE REFERENCES learning_sessions(id) ON DELETE CASCADE,
        questions       JSONB         NOT NULL,
        result          JSONB,
        score           INTEGER,
        completed_at    TIMESTAMPTZ,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_quizzes_session ON quizzes(session_id)`);

    // ASSIGNMENTS
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id              SERIAL PRIMARY KEY,
        session_id      INTEGER       NOT NULL UNIQUE REFERENCES learning_sessions(id) ON DELETE CASCADE,
        assignment_data JSONB         NOT NULL,
        result          JSONB,
        score           INTEGER,
        completed_at    TIMESTAMPTZ,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_assignments_session ON assignments(session_id)`);

    // Seed default demo user if not present
    const demoCheck = await client.query('SELECT id FROM users WHERE email = $1', ['demo@conceptflow.ai']);
    if (demoCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('password123', 10);
      await client.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
        ['Demo Learner', 'demo@conceptflow.ai', hash]
      );
      console.log('   Seed: Created demo user demo@conceptflow.ai / password123');
    }

    await client.query('COMMIT');
    console.log('✅ ConceptFlow database tables created/verified successfully.');
    console.log('   Tables: users, learning_sessions, learning_concepts, checkpoints,');
    console.log('           checkpoint_responses, doubt_messages, quizzes, assignments');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  initDb()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = initDb;
