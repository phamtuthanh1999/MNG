import { Request, Response } from "express";
import { registerUser, loginUser, getUserById } from "../services/auth.service";

/**
 * Auth Controller - Xử lý các yêu cầu HTTP cho xác thực
 * Tuân theo RESTful conventions
 */

/**
 * Đăng ký user mới
 * POST /api/auth/register
 */
export const register = async (req: Request, res: Response) => {
  const { userCode, username, email, password, fullName, phone, roleCode } = req.body;

  try {
    // Validate required fields
    if (!userCode || !username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Thiếu thông tin bắt buộc: userCode, username, email, password" 
      });
    }

    const user = await registerUser({ 
      userCode, 
      username, 
      email, 
      password, 
      fullName, 
      phone, 
      roleCode 
    });
    
    res.status(201).json({ 
      success: true,
      message: "Đăng ký user thành công",
      data: {
        ID: user.ID,
        USER_CD: user.USER_CD,
        USERNAME: user.USERNAME,
        EMAIL: user.EMAIL,
        FULL_NAME: user.FULL_NAME,
        ROLE_CD: user.ROLE_CD
      }
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    res.status(400).json({ 
      success: false,
      message: "Đăng ký thất bại",
      error 
    });
  }
};

/**
 * Đăng nhập
 * POST /api/auth/login
 */
export const login = async (req: Request, res: Response) => {
  const { login, password } = req.body;

  try {
    // Validate required fields
    if (!login || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Thiếu thông tin đăng nhập" 
      });
    }

    const { token, user } = await loginUser({ login, password });
    
    res.json({ 
      success: true,
      message: "Đăng nhập thành công", 
      data: {
        token,
        user
      }
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    res.status(401).json({ 
      success: false,
      message: "Đăng nhập thất bại",
      error 
    });
  }
};

/**
 * Lấy thông tin user hiện tại
 * GET /api/auth/me
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin user"
      });
    }

    const user = await getUserById(userId);
    
    res.json({
      success: true,
      message: "Lấy thông tin user thành công",
      data: user
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({
      success: false,
      message: "Lỗi server",
      error
    });
  }
};

