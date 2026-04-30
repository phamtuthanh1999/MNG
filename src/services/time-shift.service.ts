import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '../data-source';
import { TimeShift } from '../entity/TimeShift';
import { User } from '../entity/User';

const repo = () => AppDataSource.getRepository(TimeShift);
const userRepo = () => AppDataSource.getRepository(User);

/** Lấy FB_PSID của user theo USER_CD — dùng để gửi Messenger */
export const getFbPsid = async (userCd: string): Promise<string | null> => {
  const user = await userRepo().findOne({ where: { USER_CD: userCd }, select: ['FB_PSID'] });
  return user?.FB_PSID ?? null;
};

/** Format phút → "Xh Ym" */
export const formatMinutes = (totalMin: number): string => {
  if (totalMin <= 0) return '0m';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/** Lấy chuỗi ngày Việt Nam: "Thứ Ba, 21/04/2026" */
const formatDateVN = (d: Date): string => {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${days[d.getDay()]}, ${dd}/${mm}/${yyyy}`;
};

/** ISO date string YYYY-MM-DD theo local timezone */
const isoDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Parse YYYY-MM-DD thành Date local (tránh UTC offset) */
const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Ngày đầu tuần (Thứ Hai) của một ngày bất kỳ */
const weekStart = (d: Date): Date => {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

// ─────────────────────── CRUD ───────────────────────

export const createShift = async (data: Partial<TimeShift>) => {
  const shift = repo().create(data);
  return repo().save(shift);
};

export const listShifts = async (userCd: string, date?: string) => {
  const where: any = { USER_CD: userCd };
  if (date) where.SHIFT_DATE = date;
  return repo().find({ where, order: { SHIFT_DATE: 'DESC', START_TIME: 'ASC' } });
};

export const getShift = async (id: number) =>
  repo().findOne({ where: { ID: id } });

export const updateShift = async (id: number, data: Partial<TimeShift>) => {
  await repo().update(id, data);
  return repo().findOne({ where: { ID: id } });
};

export const deleteShift = async (id: number) =>
  repo().delete(id);

/** Kiểm tra trùng giờ: trả về ca đầu tiên bị overlap (bỏ qua excludeId khi sửa) */
export const findOverlap = async (
  userCd: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: number,
): Promise<TimeShift | null> => {
  const shifts = await repo().find({ where: { USER_CD: userCd, SHIFT_DATE: date } });
  for (const s of shifts) {
    if (excludeId !== undefined && s.ID === excludeId) continue;
    // Overlap khi newStart < existingEnd VÀ newEnd > existingStart
    if (startTime < s.END_TIME && endTime > s.START_TIME) return s;
  }
  return null;
};

// ─────────────────────── STATS ───────────────────────

/** Tổng phút theo ngày */
export const dailyTotal = async (userCd: string, date: string): Promise<number> => {
  const rows = await repo().find({ where: { USER_CD: userCd, SHIFT_DATE: date } });
  return rows.reduce((s, r) => s + r.DURATION_MIN, 0);
};

/** Tổng phút theo tuần — trả về mảng 7 phần tử [Mon..Sun] */
export const weeklyTotals = async (userCd: string, anchorDate: string): Promise<number[]> => {
  const anchor = parseLocalDate(anchorDate);
  const start = weekStart(anchor);
  const results: number[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const mins = await dailyTotal(userCd, isoDate(d));
    results.push(mins);
  }
  return results;
};

/** Tổng phút theo tháng — trả về mảng số ngày trong tháng */
export const monthlyTotals = async (userCd: string, year: number, month: number): Promise<number[]> => {
  const daysInMonth = new Date(year, month, 0).getDate(); // month là 1-based
  const results: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const mins = await dailyTotal(userCd, dateStr);
    results.push(mins);
  }
  return results;
};

/** Tổng hợp cho widget /api/time — dateStr tuỳ chọn, mặc định hôm nay */
export const getTimeSummary = async (userCd: string, dateStr?: string) => {
  const now = dateStr ? parseLocalDate(dateStr) : new Date();
  const targetDate = dateStr || isoDate(new Date());

  const shifts = await repo().find({
    where: { USER_CD: userCd, SHIFT_DATE: targetDate },
    order: { START_TIME: 'ASC' },
  });

  const todayMin = shifts.reduce((s, r) => s + r.DURATION_MIN, 0);

  // Tổng tuần (dựa theo anchor date được chọn)
  const wStart = weekStart(now);
  let weekMin = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(wStart);
    d.setDate(wStart.getDate() + i);
    weekMin += await dailyTotal(userCd, isoDate(d));
  }

  return {
    date: formatDateVN(now),
    shifts: shifts.map((s) => ({
      id: s.ID,
      name: s.SHIFT_NM,
      start: s.START_TIME,
      end: s.END_TIME,
      date: s.SHIFT_DATE,
      note: s.NOTE,
      duration: formatMinutes(s.DURATION_MIN),
    })),
    totalToday: formatMinutes(todayMin),
    totalWeek: formatMinutes(weekMin),
  };
};
