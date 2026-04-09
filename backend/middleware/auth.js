import { verifyAccessToken } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";
import pool from "../database/db.js";

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No token provided, Please login.", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [decoded.id],
    );

    if (result.rows.length === 0) {
      throw new AppError("User no longer exists", 401);
    }

    const user = result.rows[0];

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token", 401));
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Token expired, Please login again", 401));
    }
    next(error);
  }
};
