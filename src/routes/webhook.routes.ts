import { Router } from "express";
import { verifyWebhook, receiveWebhook } from "../controllers/webhook.controller";

const router = Router();

/**
 * Webhook Routes - Endpoint nhận callback từ Facebook
 */

// GET /api/webhook - Facebook gọi để xác minh webhook
router.get("/", verifyWebhook);

// POST /api/webhook - Facebook gọi khi có sự kiện mới
router.post("/", receiveWebhook);

export default router;
