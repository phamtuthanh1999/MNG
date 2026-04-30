import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * Auth Routes - Định nghĩa các endpoint cho xác thực
 * Tuân theo RESTful conventions
 */

// POST /api/auth/register - Đăng ký user mới
router.post("/register", register);

// POST /api/auth/login - Đăng nhập
router.post("/login", login);

// GET /api/auth/me - Lấy thông tin user hiện tại (cần auth)
router.get("/me", authMiddleware, getMe);

export default router;