import { Router } from 'express';
import * as ctrl from '../controllers/user-store.controller';
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * UserStore Routes - Định nghĩa các endpoint cho liên kết user-store
 * Tuân theo RESTful conventions
 */

// POST /api/user-stores - Gán user vào store
router.post('/', authMiddleware, ctrl.assignUserToStore);

// GET /api/user-stores - Lấy danh sách tất cả liên kết user-store
router.get('/', authMiddleware, ctrl.list);

// GET /api/user-stores/:id - Lấy thông tin liên kết user-store theo ID
router.get('/:id', ctrl.getOne);

// PUT /api/user-stores/:id - Cập nhật vai trò user tại store
router.put('/:id', ctrl.update);

// DELETE /api/user-stores/:id - Xóa liên kết user-store
router.delete('/:id', ctrl.remove);

export default router;