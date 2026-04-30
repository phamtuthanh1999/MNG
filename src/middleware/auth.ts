import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Auth Middleware - Xác thực JWT token
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: "Không tìm thấy token xác thực" 
    });
  }

  const token = authHeader.split(" ")[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "Token không hợp lệ" 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false,
      message: "Token hết hạn hoặc không hợp lệ" 
    });
  }
};

/**
 * Admin Role Middleware - Kiểm tra quyền admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({ 
      success: false,
      message: "Yêu cầu quyền Admin" 
    });
  }
  
  next();
};

/**
 * Staff Role Middleware - Kiểm tra quyền staff trở lên
 */
export const isStaff = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return res.status(403).json({ 
      success: false,
      message: "Yêu cầu quyền Staff trở lên" 
    });
  }
  
  next();
};