import pool from "../database/db.js";
import AppError from "../utils/AppError.js";
import { sanitizeInput } from "../utils/sanitization.js";

const getDateCondition = (dateFilter, startDate, endDate) => {
  switch (dateFilter) {
    case "last_7_days":
      return `date >= CURRENT_DATE - INTERVAL '7 days'`;
    case "last_month":
      return `date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') AND date < date_trunc('month', CURRENT_DATE)`;
    case "month_to_date":
      return `date >= date_trunc('month', CURRENT_DATE)`;
    case "last_3_months":
      return `date >= CURRENT_DATE - INTERVAL '3 months'`;
    case "custom_range":
      if (startDate && endDate) {
        return `date >= '${startDate}' AND date <= '${endDate}'`;
      }
      return "1=1";
    case "from_start":
    default:
      return "1=1";
  }
};

// Add new transaction
export const addTransaction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, amount, category, description, date } = sanitizeInput(
      req.body,
    );

    if (!type || !amount || !category || !date) {
      throw new AppError("All fields are required except description", 400);
    }

    if (type !== "income" && type !== "expense") {
      throw new AppError("Invalid transaction type", 400);
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, amount, category, description, date) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, type, amount, category, description, date],
    );

    res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get all transactions
export const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      category,
      dateFilter,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;

    let conditions = ["user_id = $1"];
    const params = [userId];
    let paramCount = 1;

    // Filter by Category
    if (category && category !== "All") {
      paramCount++;
      conditions.push(`category = $${paramCount}`);
      params.push(category);
    }

    // Filter by Date
    conditions.push(getDateCondition(dateFilter, startDate, endDate));

    // Get Total Count for pagination
    const countQuery = `SELECT COUNT(*) FROM transactions WHERE ${conditions.join(" AND ")}`;
    const countResult = await pool.query(countQuery, params);
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const offset = (page - 1) * limit;

    let query = `SELECT * FROM transactions WHERE ${conditions.join(" AND ")} ORDER BY date DESC, created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: parseInt(page, 10),
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update transaction
export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { type, amount, category, description, date } = sanitizeInput(
      req.body,
    );

    const result = await pool.query(
      `UPDATE transactions 
       SET type = $1, amount = $2, category = $3, description = $4, date = $5
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [type, amount, category, description, date, id, userId],
    );

    if (result.rows.length === 0) {
      throw new AppError("Transaction not found or unauthorized", 404);
    }

    res.status(200).json({
      success: true,
      message: "Transaction updated",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete transaction
export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      "DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId],
    );

    if (result.rows.length === 0) {
      throw new AppError("Transaction not found or unauthorized", 404);
    }

    res.status(200).json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    next(error);
  }
};

// Get Dashboard Summary Data
export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { dateFilter, startDate, endDate } = req.query;
    const dateCondition = getDateCondition(dateFilter, startDate, endDate);

    // 1. Get totals
    const result = await pool.query(
      `SELECT 
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense
       FROM transactions WHERE user_id = $1 AND (${dateCondition})`,
      [userId],
    );

    let income = parseFloat(result.rows[0].total_income || 0);
    let expense = parseFloat(result.rows[0].total_expense || 0);
    let balance = income - expense;

    // 2. Get categories breakdown for expense mapping
    const categoryResult = await pool.query(
      `SELECT category as name, SUM(amount) as value 
       FROM transactions 
       WHERE user_id = $1 AND type='expense' AND (${dateCondition})
       GROUP BY category`,
      [userId],
    );
    let categoryBreakdown = categoryResult.rows.map((row) => ({
      name: row.name,
      value: parseFloat(row.value),
    }));

    // 3. Get monthly breakdown
    // Always returns grouped by month, but only for the timespan covered by the filter
    const monthResult = await pool.query(
      `SELECT 
          to_char(date, 'Mon') as name,
          EXTRACT(YEAR FROM date) as year_num,
          EXTRACT(MONTH FROM date) as month_num,
          SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
       FROM transactions
       WHERE user_id = $1 AND (${dateCondition})
       GROUP BY name, year_num, month_num
       ORDER BY year_num ASC, month_num ASC`,
      [userId],
    );

    let monthlyData = monthResult.rows.map((row) => ({
      name: row.name,
      income: parseFloat(row.income),
      expense: parseFloat(row.expense),
    }));

    // 4. Get expense trend data (Line chart)
    const expenseTrendResult = await pool.query(
      `SELECT 
          to_char(date, 'DD Mon') as name,
          date as raw_date,
          category,
          SUM(amount) as total
       FROM transactions
       WHERE user_id = $1 AND type='expense' AND (${dateCondition})
       GROUP BY name, raw_date, category
       ORDER BY raw_date ASC`,
      [userId],
    );

    const trendMap = {};
    const categoriesSet = new Set();

    expenseTrendResult.rows.forEach((row) => {
      const dateStr = row.name;
      const cat = row.category;
      const amount = parseFloat(row.total);
      categoriesSet.add(cat);

      if (!trendMap[dateStr]) {
        trendMap[dateStr] = { name: dateStr, raw_date: row.raw_date };
      }
      trendMap[dateStr][cat] = amount;
    });

    const availableCategories = Array.from(categoriesSet);
    const expenseTrendData = Object.values(trendMap)
      .map((dayData) => {
        // Zero-fill missing categories so Recharts lines connect properly
        availableCategories.forEach((cat) => {
          if (dayData[cat] === undefined) {
            dayData[cat] = 0;
          }
        });
        return dayData;
      })
      .sort((a, b) => new Date(a.raw_date) - new Date(b.raw_date));

    res.status(200).json({
      success: true,
      data: {
        metrics: { balance, income, expense },
        categoryBreakdown,
        monthlyData,
        trendData: {
          data: expenseTrendData,
          categories: availableCategories,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Export transactions to CSV
export const exportTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { category, dateFilter, startDate, endDate } = req.query;

    let conditions = ["user_id = $1"];
    const params = [userId];
    let paramCount = 1;

    // Filter by Category
    if (category && category !== "All") {
      paramCount++;
      conditions.push(`category = $${paramCount}`);
      params.push(category);
    }

    // Filter by Date
    conditions.push(getDateCondition(dateFilter, startDate, endDate));

    let query = `SELECT * FROM transactions WHERE ${conditions.join(" AND ")} ORDER BY date DESC, created_at DESC`;
    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No transactions found" });
    }

    const csvHeader = "Date,Description,Category,Type,Amount\n";
    const csvRows = result.rows
      .map((trx) => {
        const date = new Date(trx.date).toLocaleDateString();
        const desc = trx.description
          ? trx.description.replace(/"/g, '""')
          : "";
        const amount = parseFloat(trx.amount).toFixed(2);
        return `"${date}","${desc}","${trx.category}","${trx.type}","${amount}"`;
      })
      .join("\n");

    const csvData = csvHeader + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="transactions.csv"`
    );
    res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};
