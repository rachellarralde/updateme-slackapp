const { Pool } = require('pg');

let pool;

const setupDatabase = async () => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Test the connection
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');

    // Create necessary tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id TEXT PRIMARY KEY,
        monitored_channels TEXT[],
        keywords TEXT[],
        auto_summary_enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS message_history (
        id SERIAL PRIMARY KEY,
        channel_id TEXT,
        user_id TEXT,
        message_text TEXT,
        timestamp TIMESTAMP,
        is_mention BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
  } catch (error) {
    console.error('Database setup error:', error);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    throw new Error('Database not initialized. Call setupDatabase first.');
  }
  return pool;
};

module.exports = {
  setupDatabase,
  getPool,
};