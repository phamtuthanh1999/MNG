import { Router } from 'express';
import * as ctrl from '../controllers/report.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/reports/products - Báo cáo tổng hợp theo sản phẩm
router.get('/products', authMiddleware, ctrl.productSummary);

export default router;