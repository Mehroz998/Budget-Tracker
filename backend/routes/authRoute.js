import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  refreshToken,
} from "../controller/authController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

// Register route: /api/auth/register
router.post("/register", register);

//Login route: /api/auth/login
router.post("/login", login);

//Logout route: /api/auth/logout
router.post("/logout", authenticate, logout);

//Profile Data: /api/auth/getme
router.get("/getme", authenticate, getMe);

// Refresh token endpoint should be public (does not require access token)
router.post("/refresh", refreshToken);

export default router;
