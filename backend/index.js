import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoute.js";
import transactionRoutes from "./routes/transactionRoute.js";
import cors from "cors";
import helmet from "helmet";

//Load environment variables
dotenv.config();
const app = express();

const port = process.env.PORT || 5000;

//use basic MiddleWares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(express.urlencoded({ extended: true }));

//Route Middleware for auth routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "Budget Tracker",
    version: "1.0.0",
    status: "running",
  });
});

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
