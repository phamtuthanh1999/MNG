import { Router } from 'express';
import multer from 'multer';
import * as ctrl from '../controllers/export.controller';
import { authMiddleware } from "../middleware/auth";

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
			cb(null, true);
		} else {
			cb(new Error('Chỉ chấp nhận file .xlsx'));
		}
	},
});

/**
 * Export Routes - Định nghĩa các endpoint cho phiếu xuất kho
 * Tuân theo RESTful conventions
 */

// ===== EXPORT ROUTES =====

// GET /api/exports/search - Tìm kiếm phiếu xuất (phải đặt trước /:id)
router.get('/search', ctrl.search);

// ===== EXCEL ROUTES =====
// GET /api/exports/excel/template - Download template Excel
router.get('/excel/template', ctrl.downloadTemplate);

// POST /api/exports/excel/upload - Upload file Excel xuất hàng
router.post('/excel/upload', authMiddleware, upload.single('file'), ctrl.uploadExcel);

// POST /api/exports - Tạo phiếu xuất mới
router.post('/', authMiddleware, ctrl.create);

// GET /api/exports - Lấy danh sách phiếu xuất
router.get('/', authMiddleware, ctrl.list);

// GET /api/exports/:id - Lấy thông tin phiếu xuất theo ID
router.get('/:id', ctrl.getOne);

// PUT /api/exports/:id - Cập nhật phiếu xuất
router.put('/:id', authMiddleware, ctrl.update);

// DELETE /api/exports/:id - Xóa phiếu xuất
router.delete('/:id', authMiddleware, ctrl.remove);

// ===== EXPORT DETAIL ROUTES =====

// GET /api/exports/:exportId/details - Lấy danh sách chi tiết phiếu xuất theo EXPORT_ID
router.get('/:exportId/details', ctrl.listDetails);

// POST /api/exports/details - Tạo chi tiết phiếu xuất mới
router.post('/details', authMiddleware, ctrl.createDetail);

// GET /api/exports/details/:id - Lấy chi tiết phiếu xuất theo ID
router.get('/details/:id', ctrl.getOneDetail);

// PUT /api/exports/details/:id - Cập nhật chi tiết phiếu xuất
router.put('/details/:id', authMiddleware, ctrl.updateDetail);

// DELETE /api/exports/details/:id - Xóa chi tiết phiếu xuất
router.delete('/details/:id', authMiddleware, ctrl.removeDetail);

export default router;