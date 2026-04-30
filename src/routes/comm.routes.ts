import { Router } from 'express';
import * as ctrl from '../controllers/comm.controller';
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * Comm Routes - Định nghĩa các endpoint cho đơn vị
 * Tuân theo RESTful conventions
 */

// GET /api/comms/search - Tìm kiếm đơn vị (phải đặt trước /:id)
router.get('/search', ctrl.search);

// GET /api/comms/active - Lấy danh sách đơn vị đang hoạt động
router.get('/active', ctrl.getActive);

// POST /api/comms - Tạo đơn vị mới
router.post('/', authMiddleware, ctrl.create);

// GET /api/comms - Lấy danh sách đơn vị
router.get('/', authMiddleware, ctrl.list);

// GET /api/comms/:id - Lấy thông tin đơn vị theo ID
router.get('/:id', ctrl.getOne);

// PUT /api/comms/:id - Cập nhật đơn vị
router.put('/:id', authMiddleware, ctrl.update);

// DELETE /api/comms/:id - Xóa đơn vị
router.delete('/:id', ctrl.remove);

export default router;