import pool from "./db.js";

const setupDb = async () => {
  try {
    console.log("Setting up the database...");

    //Create users table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

    //Create transactions table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                type VARCHAR(10) CHECK (type IN ('income', 'expense')),
                amount DECIMAL(10,2) NOT NULL,
                category VARCHAR(50),
                description TEXT,
                date DATE NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

    //Create refresh_tokens table
    await pool.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                token text NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                revoked BOOLEAN DEFAULT false
            );
        `);

    console.log("Database setup completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up the database", error);
    process.exit(1);
  }
};

setupDb();
