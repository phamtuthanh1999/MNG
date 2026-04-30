import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/product.controller';
import { authMiddleware } from "../middleware/auth";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file .xlsx'));
    }
  },
});

/**
 * Product Routes - Định nghĩa các endpoint cho sản phẩm
 * Tuân theo RESTful conventions
 */

// GET /api/products/search - Tìm kiếm sản phẩm (phải đặt trước /:id)
router.get('/search', ctrl.search);

// ===== EXCEL ROUTES =====
// GET /api/products/excel/template - Download template Excel sản phẩm
router.get('/excel/template', ctrl.downloadProductTemplate);

// POST /api/products/excel/upload - Upload file Excel sản phẩm
router.post('/excel/upload', authMiddleware, upload.single('file'), ctrl.uploadProductExcel);

// POST /api/products - Tạo sản phẩm mới
router.post('/', authMiddleware, ctrl.create);

// GET /api/products - Lấy danh sách sản phẩm
router.get('/', authMiddleware, ctrl.list);

// GET /api/products/:id - Lấy thông tin sản phẩm theo ID
router.get('/:id', ctrl.getOne);

// PUT /api/products/:id - Cập nhật sản phẩm
router.put('/:id', authMiddleware, ctrl.update);

// DELETE /api/products/:id - Xóa sản phẩm
router.delete('/:id', ctrl.remove);

export default router;
