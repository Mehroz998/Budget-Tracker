import express from "express";
import {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getDashboardSummary,
  exportTransactions,
} from "../controller/transactionController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

// Must be before /:id so it's not intercepted
router.get("/summary", getDashboardSummary);
router.get("/export", exportTransactions);

router.post("/", addTransaction);
router.get("/", getTransactions);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
