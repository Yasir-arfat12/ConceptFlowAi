CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS learning_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_concepts (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES learning_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS checkpoints (
    id SERIAL PRIMARY KEY,
    learning_concept_id INTEGER REFERENCES learning_concepts(id) ON DELETE CASCADE,
    question TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checkpoint_responses (
    id SERIAL PRIMARY KEY,
    checkpoint_id INTEGER REFERENCES checkpoints(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    answer TEXT NOT NULL,
    score INTEGER,
    is_correct BOOLEAN,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES learning_sessions(id) ON DELETE CASCADE,
    questions JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES learning_sessions(id) ON DELETE CASCADE,
    assignment_data JSONB NOT NULL
);
