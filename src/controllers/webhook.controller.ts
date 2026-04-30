import { Request, Response } from "express";
import { sendTextMessage } from "../services/messenger.service";
import { updateFbPsid, getAdminBySenderId, unlinkFbPsid } from "../services/auth.service";

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
 * Nếu tin nhắn bắt đầu bằng "/login <username>" thì liên kết PSID với user
 */
async function handleMessage(senderId: string, message: any) {
  const text: string = (message.text || '').trim();
  console.log(`💬 Message from ${senderId}: ${text}`);

  try {
    // Lệnh liên kết: /login <username>
    const loginMatch = text.match(/^\/login\s+(\S+)$/i);
    if (loginMatch) {
      const username = loginMatch[1];
      const result = await updateFbPsid(username, senderId);
      if (result.ok) {
        await sendTextMessage(senderId, `✅ Đã liên kết tài khoản "${username}" thành công!\nTừ giờ bạn sẽ nhận thông báo ca làm việc qua Messenger.`);
      } else if (result.reason === 'user_not_found') {
        await sendTextMessage(senderId, `❌ Không tìm thấy tài khoản "${username}". Kiểm tra lại tên đăng nhập và thử lại.`);
      } else if (result.reason === 'user_already_linked') {
        await sendTextMessage(senderId, `⚠️ Tài khoản "${username}" đã liên kết với một Messenger khác.\nMỗi tài khoản chỉ được liên kết với 1 Facebook.`);
      } else if (result.reason === 'psid_taken') {
        await sendTextMessage(senderId, `⚠️ Messenger này đã được liên kết với tài khoản khác.\nMỗi Facebook chỉ được liên kết với 1 tài khoản.`);
      }
      return;
    }

    // Lệnh ADMIN xóa liên kết: ADM delete FB <username>
    const admDeleteMatch = text.match(/^ADM\s+delete\s+FB\s+(\S+)$/i);
    if (admDeleteMatch) {
      const admin = await getAdminBySenderId(senderId);
      if (!admin) {
        await sendTextMessage(senderId, `❌ Bạn không có quyền thực hiện lệnh này.`);
        return;
      }
      const targetUsername = admDeleteMatch[1];
      const result = await unlinkFbPsid(targetUsername);
      if (result === 'unlinked') {
        await sendTextMessage(senderId, `✅ Đã xóa liên kết Facebook của tài khoản "${targetUsername}" thành công.`);
      } else if (result === 'not_found') {
        await sendTextMessage(senderId, `❌ Không tìm thấy tài khoản "${targetUsername}".`);
      } else {
        await sendTextMessage(senderId, `ℹ️ Tài khoản "${targetUsername}" chưa liên kết Facebook nào.`);
      }
      return;
    }

    // Hướng dẫn mặc định
    await sendTextMessage(
      senderId,
      `Xin chào! 👋\n\nĐể nhận thông báo ca làm việc, gửi lệnh:\n🔑 /login <tên đăng nhập>\n\nVí dụ: /login admin`
    );
    console.log(`✅ Replied to ${senderId}`);
  } catch (err) {
    console.error(`❌ Failed to reply to ${senderId}:`, err);
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
