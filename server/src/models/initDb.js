const { pool } = require('../config/db');

const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create subjects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create concepts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS concepts (
        id SERIAL PRIMARY KEY,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create learning_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        topic VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create learning_concepts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_concepts (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES learning_sessions(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        status VARCHAR(20) DEFAULT 'locked',
        order_index INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create checkpoints table
    await client.query(`
      CREATE TABLE IF NOT EXISTS checkpoints (
        id SERIAL PRIMARY KEY,
        learning_concept_id INTEGER REFERENCES learning_concepts(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        correct_answer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create checkpoint_responses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS checkpoint_responses (
        id SERIAL PRIMARY KEY,
        checkpoint_id INTEGER REFERENCES checkpoints(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        answer TEXT,
        score INTEGER,
        is_correct BOOLEAN,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create quizzes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES learning_sessions(id) ON DELETE CASCADE UNIQUE,
        questions JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create assignments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES learning_sessions(id) ON DELETE CASCADE UNIQUE,
        assignment_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Database tables created successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating database tables:', err);
  } finally {
    client.release();
  }
};

if (require.main === module) {
  initDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Initialization failed', err);
      process.exit(1);
    });
}

module.exports = initDb;
