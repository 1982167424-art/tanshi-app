const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authRequired } = require('../middleware/auth');
const { success, fail } = require('../utils/response');
const { generateId } = require('../utils/crypto');

router.use(authRequired);

// ============ 工具函数 ============

const getTodayStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const daysBetween = (d1, d2) => {
  const [y1, m1, dd1] = d1.split('-').map(Number);
  const [y2, m2, dd2] = d2.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, dd2) - new Date(y1, m1 - 1, dd1)) / 86400000);
};

const addDaysStr = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const chineseNum = (n) => {
  const d = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (n <= 10) return d[n];
  if (n < 20) return '十' + d[n - 10];
  return d[Math.floor(n / 10)] + '十' + (n % 10 > 0 ? d[n % 10] : '');
};

// 节假日配置
const HOLIDAYS = [
  { month: 1, day: 1, code: 'holiday_newyear', name: '元旦快乐' },
  { month: 5, day: 1, code: 'holiday_labour', name: '劳动节快乐' },
  { month: 10, day: 1, code: 'holiday_national', name: '国庆快乐' },
  { month: 12, day: 25, code: 'holiday_christmas', name: '圣诞快乐' },
  { date: '2025-01-29', code: 'holiday_spring', name: '春节快乐' },
  { date: '2025-04-04', code: 'holiday_qingming', name: '清明安康' },
  { date: '2025-05-31', code: 'holiday_dragonboat', name: '端午安康' },
  { date: '2025-10-06', code: 'holiday_midautumn', name: '中秋快乐' },
  { date: '2026-02-17', code: 'holiday_spring', name: '春节快乐' },
  { date: '2026-04-05', code: 'holiday_qingming', name: '清明安康' },
  { date: '2026-06-19', code: 'holiday_dragonboat', name: '端午安康' },
  { date: '2026-09-25', code: 'holiday_midautumn', name: '中秋快乐' },
];

const getHoliday = (dateStr) => {
  const parts = dateStr.split('-').map(Number);
  for (const h of HOLIDAYS) {
    if (h.date && h.date === dateStr) return h;
    if (h.month && h.month === parts[1] && h.day === parts[2]) return h;
  }
  return null;
};

const calculateStreak = (datesDesc) => {
  if (!datesDesc || datesDesc.length === 0) return 0;
  let streak = 0;
  let expected = datesDesc[0];
  for (const date of datesDesc) {
    const diff = daysBetween(date, expected);
    if (diff === 0) { streak++; expected = addDaysStr(date, -1); }
    else if (diff >= 1 && diff <= 2) { streak++; expected = addDaysStr(date, -1); }
    else break;
  }
  return streak;
};

const unlockTitle = (uid, code, name, type, permanent) => {
  const exists = db.prepare('SELECT id FROM user_titles WHERE user_uid = ? AND title_code = ?').get(uid, code);
  if (exists) return null;
  db.prepare('INSERT INTO user_titles (id, user_uid, title_code, title_name, title_type, is_permanent, unlocked_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(generateId(), uid, code, name, type, permanent ? 1 : 0, new Date().toISOString());
  return { code, name, type };
};

const checkTitles = (uid, streak, total, today) => {
  const newTitles = [];
  if (streak >= 7 && streak % 7 === 0) {
    const n = streak / 7;
    const t = unlockTitle(uid, `weekly_${n}`, `完美连签·${chineseNum(n)}周`, 'weekly', false);
    if (t) newTitles.push(t);
  }
  if (total >= 100 && total % 100 === 0) {
    const n = total / 100;
    const label = n === 1 ? '百日' : n === 2 ? '双百' : `${chineseNum(n)}百`;
    const t = unlockTitle(uid, `milestone_${n}`, `同行${label}`, 'milestone', false);
    if (t) newTitles.push(t);
  }
  if (total >= 520) {
    const t = unlockTitle(uid, 'special_520', '520纪念日', 'special', true);
    if (t) newTitles.push(t);
  }
  const holiday = getHoliday(today);
  if (holiday) {
    const t = unlockTitle(uid, holiday.code, holiday.name, 'holiday', false);
    if (t) newTitles.push(t);
  }
  return newTitles;
};

// ============ 路由 ============

// GET /api/checkin/status
router.get('/status', (req, res, next) => {
  try {
    const uid = req.user.uid;
    const today = getTodayStr();
    const user = db.prepare('SELECT points, total_checkin_days FROM users WHERE uid = ?').get(uid);
    const todayCheckin = db.prepare('SELECT id FROM checkins WHERE user_uid = ? AND checkin_date = ?').get(uid, today);
    const datesDesc = db.prepare('SELECT checkin_date FROM checkins WHERE user_uid = ? ORDER BY checkin_date DESC').all(uid).map(r => r.checkin_date);
    const lastDate = datesDesc[0] || null;
    const daysSince = lastDate ? daysBetween(lastDate, today) : 0;
    let streak = 0;
    if (todayCheckin) streak = calculateStreak(datesDesc);
    else if (lastDate && daysSince <= 3) streak = calculateStreak(datesDesc);

    let breakWarning = false, breakMessage = '';
    if (!todayCheckin && lastDate) {
      breakWarning = true;
      if (daysSince >= 4) breakMessage = '您已断签超过3天，连续签到天数已重置！';
      else if (daysSince === 1) breakMessage = `您已连续签到${streak}天，今天还没签到哦！`;
      else breakMessage = `您已断签${daysSince - 1}天，请尽快签到以免断签！`;
    }

    return success(res, {
      checked_in_today: !!todayCheckin,
      streak_days: streak,
      total_points: user?.points || 0,
      total_checkin_days: user?.total_checkin_days || 0,
      last_checkin_date: lastDate,
      days_since_last_checkin: daysSince,
      break_warning: breakWarning,
      break_message: breakMessage,
    }, '获取签到状态成功');
  } catch (err) { next(err); }
});

// POST /api/checkin
router.post('/', (req, res, next) => {
  try {
    const uid = req.user.uid;
    const today = getTodayStr();
    if (db.prepare('SELECT id FROM checkins WHERE user_uid = ? AND checkin_date = ?').get(uid, today)) {
      return fail(res, '今日已签到', 400);
    }

    const user = db.prepare('SELECT points, total_checkin_days FROM users WHERE uid = ?').get(uid);
    const oldPoints = user?.points || 0;
    const oldTotal = user?.total_checkin_days || 0;
    const datesDesc = db.prepare('SELECT checkin_date FROM checkins WHERE user_uid = ? ORDER BY checkin_date DESC').all(uid).map(r => r.checkin_date);

    let streak = 1, renewed = false, deducted = 0, prevStreak = 0;
    if (datesDesc.length > 0) {
      const diff = daysBetween(datesDesc[0], today);
      if (diff >= 1 && diff <= 3) {
        streak = calculateStreak(datesDesc) + 1;
      } else if (diff >= 4) {
        prevStreak = calculateStreak(datesDesc);
        const hasRenewed = db.prepare('SELECT id FROM checkins WHERE user_uid = ? AND renewed = 1 AND checkin_date > ?').get(uid, datesDesc[0]);
        if (!hasRenewed && oldPoints >= 100 && prevStreak > 0) {
          renewed = true;
          deducted = 100;
          streak = prevStreak + 1;
        }
      }
    }

    const earned = 2;
    const finalPoints = oldPoints + earned - deducted;
    const newTotal = oldTotal + 1;

    db.prepare('INSERT INTO checkins (id, user_uid, checkin_date, points_earned, renewed, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(generateId(), uid, today, earned, renewed ? 1 : 0, new Date().toISOString());
    db.prepare('UPDATE users SET points = ?, total_checkin_days = ? WHERE uid = ?').run(finalPoints, newTotal, uid);

    const newTitles = checkTitles(uid, streak, newTotal, today);

    return success(res, {
      points_earned: earned, total_points: finalPoints, streak_days: streak,
      total_checkin_days: newTotal, new_titles: newTitles,
      points_deducted: deducted, auto_renewed: renewed, previous_streak: renewed ? prevStreak : undefined,
    }, '签到成功');
  } catch (err) { next(err); }
});

// GET /api/checkin/titles
router.get('/titles', (req, res, next) => {
  try {
    const rows = db.prepare('SELECT * FROM user_titles WHERE user_uid = ? ORDER BY unlocked_at DESC').all(req.user.uid);
    return success(res, { titles: rows.map(r => ({ id: r.id, code: r.title_code, name: r.title_name, type: r.title_type, is_permanent: !!r.is_permanent, unlocked_at: r.unlocked_at })) }, '获取称号列表成功');
  } catch (err) { next(err); }
});

module.exports = router;
