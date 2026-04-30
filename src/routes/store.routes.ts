import { Router } from 'express';
import * as ctrl from '../controllers/store.controller';
import * as userStoreCtrl from '../controllers/user-store.controller';
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * Store Routes - Định nghĩa các endpoint cho cửa hàng
 * Tuân theo RESTful conventions
 */

// GET /api/stores/search - Tìm kiếm cửa hàng (phải đặt trước /:id)
router.get('/search', ctrl.search);

// GET /api/stores/:storeCode/users - Lấy danh sách user của store
router.get('/:storeCode/users', authMiddleware, userStoreCtrl.getStoreUsers);

// POST /api/stores - Tạo cửa hàng mới
router.post('/', authMiddleware, ctrl.create);

// GET /api/stores - Lấy danh sách cửa hàng
router.get('/', authMiddleware, ctrl.list);

// GET /api/stores/:id - Lấy thông tin cửa hàng theo ID
router.get('/:id', ctrl.getOne);

// PUT /api/stores/:id - Cập nhật cửa hàng
router.put('/:id', authMiddleware, ctrl.update);

// DELETE /api/stores/:id - Xóa cửa hàng
router.delete('/:id', ctrl.remove);

export default router;