import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  // user: process.env.DB_USER,
  // host: process.env.DB_HOST,
  // database: process.env.DB_DATABASE || "budget_tracker",
  // password: process.env.DB_PASSWORD,
  // port: process.env.DB_PORT || 5432,
  // max: 20,
  // idleTimeoutMillis: 10000,
  // connectionTimeoutMillis: 10000,
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool
  .connect()
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.error("Error connecting to the database", err);
  });

pool.on("error", (err) => {
  console.error("Error in the database connection", err);
});

export default pool;
