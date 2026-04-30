import { Router } from 'express';
import * as ctrl from '../controllers/time-shift.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// ── Stats (đặt trước /:id để không bị shadowed) ──────────────────
// GET /api/time-shifts/stats/daily?date=YYYY-MM-DD
router.get('/stats/daily', authMiddleware, ctrl.statsDaily);

// GET /api/time-shifts/stats/weekly?date=YYYY-MM-DD
router.get('/stats/weekly', authMiddleware, ctrl.statsWeekly);

// GET /api/time-shifts/stats/monthly?year=2026&month=4
router.get('/stats/monthly', authMiddleware, ctrl.statsMonthly);

// ── CRUD ─────────────────────────────────────────────────────────
// POST /api/time-shifts
router.post('/', authMiddleware, ctrl.create);

// GET /api/time-shifts?date=YYYY-MM-DD
router.get('/', authMiddleware, ctrl.list);

// GET /api/time-shifts/:id
router.get('/:id', authMiddleware, ctrl.getOne);

// PUT /api/time-shifts/:id
router.put('/:id', authMiddleware, ctrl.update);

// DELETE /api/time-shifts/:id
router.delete('/:id', authMiddleware, ctrl.remove);

export default router;
