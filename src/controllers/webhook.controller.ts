import { Request, Response } from "express";
import { sendTextMessage } from "../services/messenger.service";

/**
 * Webhook Controller - Xử lý webhook callback từ Facebook
 */

/**
 * Xác minh webhook từ Facebook
 * GET /api/webhook
 * Facebook gửi GET request để verify endpoint
 */
export const verifyWebhook = (req: Request, res: Response) => {
console.log("🔍 Verifying Facebook webhook...");
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;
  console.log("Expected verify token:", VERIFY_TOKEN);
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  console.log("Received verification request:", { mode, token, challenge });
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Facebook webhook verified");
    return res.status(200).send(challenge);
  }

  console.warn("⚠️ Facebook webhook verification failed");
  return res.status(403).json({ success: false, message: "Verification failed" });
};

/**
 * Nhận sự kiện webhook từ Facebook
 * POST /api/webhook
 * Facebook gửi POST request khi có sự kiện mới
 */
export const receiveWebhook = (req: Request, res: Response) => {
  const body = req.body;
  if (body.object === "page") {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging?.[0];
      if (!webhookEvent) continue;

      const senderId = webhookEvent.sender?.id;
      console.log("📩 Webhook event from sender:", senderId);

      // Xử lý tin nhắn
      if (webhookEvent.message) {
        handleMessage(senderId, webhookEvent.message);
      }

      // Xử lý postback (nút bấm)
      if (webhookEvent.postback) {
        handlePostback(senderId, webhookEvent.postback);
      }
    }

    // Facebook yêu cầu trả về 200 trong vòng 20 giây
    return res.status(200).send("EVENT_RECEIVED");
  }

  return res.status(404).json({ success: false, message: "Unknown object type" });
};

/**
 * Xử lý tin nhắn từ người dùng
 */
async function handleMessage(senderId: string, message: any) {
  const text = message.text;
  console.log(`💬 Message from ${senderId}: ${text}`);

  try {
    await sendTextMessage(senderId, "Tôi sẽ phản hồi sớm tới bạn");
    console.log(`✅ Replied to ${senderId}`);
  } catch (err) {
    console.error(`❌ Failed to send reply to ${senderId}:`, err);
  }
}

/**
 * Xử lý postback (khi người dùng bấm nút)
 */
function handlePostback(senderId: string, postback: any) {
  const payload = postback.payload;
  console.log(`🔘 Postback from ${senderId}: ${payload}`);

  // TODO: Thêm logic xử lý postback tại đây
}
