import { Router } from 'express';
import * as userStoreCtrl from '../controllers/user-store.controller';
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * User Routes - Định nghĩa các endpoint liên quan đến user
 * Bổ sung routes cho user-store relationship
 */

// GET /api/users/:userCode/stores - Lấy danh sách store của user
router.get('/:userCode/stores', authMiddleware, userStoreCtrl.getUserStores);

export default router;