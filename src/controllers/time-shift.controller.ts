import { Request, Response } from 'express';
import * as svc from '../services/time-shift.service';
import { sendTextMessage } from '../services/messenger.service';

/** Lấy USER_CD từ JWT đã decode, fallback sang query param */
const getUserCd = (req: Request): string | null =>
  (req as any).user?.userCode ||   // JWT payload field từ auth.service.ts
  (req as any).user?.userCd ||
  (req as any).user?.USER_CD ||
  (req.query.userCd as string) ||
  null;

// ─────────────────────── CRUD ───────────────────────

/**
 * POST /api/time-shifts
 * Body: { SHIFT_NM, SHIFT_DATE, START_TIME, END_TIME, NOTE? }
 */
export const create = async (req: Request, res: Response) => {
  try {
    const userCd = getUserCd(req);
    if (!userCd) return res.status(401).json({ success: false, message: 'Không xác định được user' });

    const { SHIFT_NM, SHIFT_DATE, START_TIME, END_TIME, NOTE } = req.body;
    if (!SHIFT_NM || !SHIFT_DATE || !START_TIME || !END_TIME) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc: SHIFT_NM, SHIFT_DATE, START_TIME, END_TIME' });
    }

    const overlap = await svc.findOverlap(userCd, SHIFT_DATE, START_TIME, END_TIME);
    if (overlap) {
      return res.status(409).json({
        success: false,
        message: `Trùng giờ với ca "${overlap.SHIFT_NM}" (${overlap.START_TIME}–${overlap.END_TIME})`,
      });
    }

    const shift = await svc.createShift({
      USER_CD: userCd,
      SHIFT_NM,
      SHIFT_DATE,
      START_TIME,
      END_TIME,
      NOTE: NOTE ?? null,
      USER_LOGIN: (req as any).user?.username || null,
    });

    // Gửi thông báo Messenger (fire & forget, không block response)
    svc.getFbPsid(userCd).then(psid => {
      if (psid) {
        const msg = `✅ Đã thêm ca: ${SHIFT_NM}\nNgày: ${SHIFT_DATE}\nGiờ: ${START_TIME} – ${END_TIME}`;
        sendTextMessage(psid, msg).catch(() => {});
      }
    }).catch(() => {});

    return res.status(201).json({ success: true, message: 'Tạo ca thành công', data: shift });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Lỗi tạo ca', error: err.message });
  }
};

/**
 * GET /api/time-shifts?date=YYYY-MM-DD
 */
export const list = async (req: Request, res: Response) => {
  try {
    const userCd = getUserCd(req);
    if (!userCd) return res.status(401).json({ success: false, message: 'Không xác định được user' });

    const date = req.query.date as string | undefined;
    const shifts = await svc.listShifts(userCd, date);
    return res.json({ success: true, data: shifts, total: shifts.length });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách ca', error: err.message });
  }
};

/**
 * GET /api/time-shifts/:id
 */
export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const shift = await svc.getShift(id);
    if (!shift) return res.status(404).json({ success: false, message: 'Không tìm thấy ca' });
    return res.json({ success: true, data: shift });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Lỗi lấy ca', error: err.message });
  }
};

/**
 * PUT /api/time-shifts/:id
 * Body: { SHIFT_NM?, SHIFT_DATE?, START_TIME?, END_TIME?, NOTE? }
 */
export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await svc.getShift(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy ca' });

    const { SHIFT_NM, SHIFT_DATE, START_TIME, END_TIME, NOTE } = req.body;

    const checkDate = SHIFT_DATE ?? existing.SHIFT_DATE;
    const checkStart = START_TIME ?? existing.START_TIME;
    const checkEnd = END_TIME ?? existing.END_TIME;
    const overlap = await svc.findOverlap(getUserCd(req)!, checkDate, checkStart, checkEnd, id);
    if (overlap) {
      return res.status(409).json({
        success: false,
        message: `Trùng giờ với ca "${overlap.SHIFT_NM}" (${overlap.START_TIME}–${overlap.END_TIME})`,
      });
    }

    const updated = await svc.updateShift(id, {
      ...(SHIFT_NM !== undefined && { SHIFT_NM }),
      ...(SHIFT_DATE !== undefined && { SHIFT_DATE }),
      ...(START_TIME !== undefined && { START_TIME }),
      ...(END_TIME !== undefined && { END_TIME }),
      ...(NOTE !== undefined && { NOTE }),
      USER_LOGIN: (req as any).user?.username || existing.USER_LOGIN,
    });

    // Gửi thông báo Messenger (fire & forget)
    const userCd = getUserCd(req);
    if (userCd) {
      svc.getFbPsid(userCd).then(psid => {
        if (psid && updated) {
          const nm = updated.SHIFT_NM;
          const dt = updated.SHIFT_DATE;
          const st = updated.START_TIME;
          const en = updated.END_TIME;
          const msg = `✏️ Đã sửa ca: ${nm}\nNgày: ${dt}\nGiờ: ${st} – ${en}`;
          sendTextMessage(psid, msg).catch(() => {});
        }
      }).catch(() => {});
    }

    return res.json({ success: true, message: 'Cập nhật ca thành công', data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật ca', error: err.message });
  }
};

/**
 * DELETE /api/time-shifts/:id
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await svc.getShift(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy ca' });

    await svc.deleteShift(id);
    return res.json({ success: true, message: 'Xóa ca thành công' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Lỗi xóa ca', error: err.message });
  }
};

// ─────────────────────── STATS ───────────────────────

/**
 * GET /api/time-shifts/stats/daily?date=YYYY-MM-DD
 */
export const statsDaily = async (req: Request, res: Response) => {
  try {
    const userCd = getUserCd(req);
    if (!userCd) return res.status(401).json({ success: false, message: 'Không xác định được user' });

    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const totalMin = await svc.dailyTotal(userCd, date);

    return res.json({
      success: true,
      data: { date, totalMin, totalFormatted: svc.formatMinutes(totalMin) },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Lỗi thống kê ngày', error: err.message });
  }
};

/**
 * GET /api/time-shifts/stats/weekly?date=YYYY-MM-DD
 * Trả về 7 phần tử [T2..CN] theo phút, dùng cho chart
 */
export const statsWeekly = async (req: Request, res: Response) => {
  try {
    const userCd = getUserCd(req);
    if (!userCd) return res.status(401).json({ success: false, message: 'Không xác định được user' });

    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    const bars = await svc.weeklyTotals(userCd, date);
    const totalMin = bars.reduce((s, v) => s + v, 0);

    return res.json({
      success: true,
      data: {
        bars, // [Mon, Tue, Wed, Thu, Fri, Sat, Sun] in minutes
        totalMin,
        totalFormatted: svc.formatMinutes(totalMin),
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Lỗi thống kê tuần', error: err.message });
  }
};

/**
 * GET /api/time-shifts/stats/monthly?year=2026&month=4
 * Trả về mảng số phút theo từng ngày trong tháng
 */
export const statsMonthly = async (req: Request, res: Response) => {
  try {
    const userCd = getUserCd(req);
    if (!userCd) return res.status(401).json({ success: false, message: 'Không xác định được user' });

    const now = new Date();
    const year = parseInt((req.query.year as string) || String(now.getFullYear()));
    const month = parseInt((req.query.month as string) || String(now.getMonth() + 1));

    if (month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: 'Tháng không hợp lệ (1-12)' });
    }

    const bars = await svc.monthlyTotals(userCd, year, month);
    const totalMin = bars.reduce((s, v) => s + v, 0);

    return res.json({
      success: true,
      data: {
        year,
        month,
        bars, // mảng số phút theo từng ngày
        totalMin,
        totalFormatted: svc.formatMinutes(totalMin),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Lỗi thống kê tháng', error: err.message });
  }
};

// ─────────────────────── SUMMARY ───────────────────────

/**
 * GET /api/time?userCd=...
 * Tổng hợp cho widget Home MNG_TIME
 * Trả về: { date, shifts[], totalToday, totalWeek }
 */
export const timeSummary = async (req: Request, res: Response) => {
  try {
    const userCd = getUserCd(req);
    if (!userCd) return res.status(401).json({ success: false, message: 'Không xác định được user' });

    const date = req.query.date as string | undefined;
    const summary = await svc.getTimeSummary(userCd, date);
    return res.json(summary);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Lỗi lấy tổng hợp', error: err.message });
  }
};
