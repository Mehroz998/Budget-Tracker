import bcrypt from "bcrypt";
import pool from "../database/db.js";
import AppError from "../utils/AppError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  revokeRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { sanitizeInput } from "../utils/sanitization.js";

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = sanitizeInput(req.body);

    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );
    if (existingUser.rows.length > 0) {
      throw new AppError("Email already registered", 409);
    }

    //Name only contain letter
    if (!/^[A-Za-z\s]+$/.test(name.trim())) {
      throw new AppError("Name must only contain letters", 400);
    }

    if (password.length < 6 || password.length > 12) {
      throw new AppError(
        "Password must be between 6 and 12 characters long",
        400,
      );
    }

    // Check user enter all the fields
    if (!name || !email || !password || !confirmPassword) {
      throw new AppError("All fields are required", 400);
    }

    //Check Email Format is valid or not
    if (!validateEmail(email)) {
      throw new AppError("Enter Email in right format", 400);
    }

    // Check if password and confirm password are the same
    if (password !== confirmPassword) {
      res.json({
        success: false,
        message: "Password and confirm password must be same",
      });
    }

    //Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    //create user
    const result = await pool.query(
      `
            INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at
        `,
      [name, email, hashedPassword],
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.log("Error in register controller", error);
    res.status(500).json({
      message: "Error in register controller",
      error: error.message,
    });
  }
};

//Login
export const login = async (req, res) => {
  const { email, password } = sanitizeInput(req.body);
  try {
    // Check both fields
    if (!email || !password) {
      throw new AppError("All fields are required", 500);
    }

    // Check user exists or not by email
    const result = await pool.query(`SELECT * FROM users WHERE email=$1`, [
      email,
    ]);

    // if user not exists
    if (result.rows.length === 0) {
      throw new AppError("Invalid Credential", 401);
    }

    const user = result.rows[0];

    // if user exist check password using bcrypt
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    // check password true or not
    if (!isPasswordMatch) {
      throw new AppError("Invalid Credential", 401);
    }

    // JWT Token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    //Store refresh token
    await storeRefreshToken(user.id, refreshToken);

    // res and store token in cookie
    res.status(200).json({
      success: true,
      message: "Login Successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (err) {
    console.log("Login Failed", err);
    throw new AppError("Internal Error", 401);
  }
};

//logout User
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || refreshToken == "") {
      throw new AppError("Required Token");
    }
    await revokeRefreshToken(refreshToken);
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.log("Error Occured while Logout", err);
    res.json({
      success: false,
      message: "Failed to logout",
      error: err,
    });
  }
};

// Get My Data
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, name, email, created_at
             FROM users WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    return res.status(200).json({
      success: true,
      message: "Profile Data",
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//Refresh Access Token
export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  // Check if token is valid in database
  const isValid = await isRefreshTokenValid(refreshToken);
  if (!isValid) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Verify token
  const decoded = verifyRefreshToken(refreshToken);

  // Get user
  const result = await pool.query(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [decoded.id],
  );

  if (result.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  const user = result.rows[0];

  //Revoke old refresh token
  await revokeRefreshToken(refreshToken);

  //Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Store new refresh token
  await storeRefreshToken(user.id, newRefreshToken);

  res.json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    },
  });
};
