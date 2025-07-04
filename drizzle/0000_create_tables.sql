
-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  trial_ends_at TIMESTAMP,
  subscription_tier TEXT DEFAULT 'free',
  subscription_id TEXT,
  last_login TIMESTAMP
);

  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  title TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  parent_id INTEGER REFERENCES goals(id),
  user_id INTEGER REFERENCES users(id),
  content JSON,
  "order" INTEGER DEFAULT 0
);

-- Create transcriptions table 
CREATE TABLE IF NOT EXISTS transcriptions (
  content TEXT NOT NULL,
  corrected_content TEXT,
  analysis JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  goal_id INTEGER REFERENCES goals(id),
  user_id INTEGER REFERENCES users(id),
  duration INTEGER DEFAULT 0,
  goal_matches INTEGER[],
  media JSON
);

-- Create user activity table
CREATE TABLE IF NOT EXISTS user_activity (
  user_id INTEGER REFERENCES users(id) NOT NULL,
  activity_type TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details JSON
);

-- Create project tracking table
CREATE TABLE IF NOT EXISTS project_tracking (
  user_id INTEGER REFERENCES users(id) NOT NULL,
  goal_id INTEGER REFERENCES goals(id) NOT NULL,
  total_time INTEGER DEFAULT 0,
  sessions_count INTEGER DEFAULT 0,
  date_grouping DATE NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
