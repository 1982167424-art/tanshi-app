const db = require('./database');

// 初始化所有表（CREATE TABLE IF NOT EXISTS，可安全重复执行）
function initDatabase() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uid          TEXT PRIMARY KEY,
      username     TEXT UNIQUE NOT NULL,
      password     TEXT NOT NULL,
      birthday     TEXT,
      is_teen_mode INTEGER DEFAULT 0,
      avatar       TEXT DEFAULT '',
      created_at   TEXT NOT NULL
    );
  `);

  // 日子表（倒计时 / 纪念日）
  db.exec(`
    CREATE TABLE IF NOT EXISTS days (
      id                 TEXT PRIMARY KEY,
      user_uid           TEXT NOT NULL,
      type               TEXT,
      title              TEXT,
      target_date        TEXT,
      note               TEXT,
      countdown_seconds  INTEGER DEFAULT 0,
      initial_seconds    INTEGER DEFAULT 0,
      is_running         INTEGER DEFAULT 1,
      created_at         TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // 笔记表
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id         TEXT PRIMARY KEY,
      user_uid   TEXT NOT NULL,
      category   TEXT,
      title      TEXT,
      content    TEXT,
      updated_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // 习惯表（check_dates 以 JSON 字符串存储打卡日期数组）
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
      id          TEXT PRIMARY KEY,
      user_uid    TEXT NOT NULL,
      emoji       TEXT,
      name        TEXT,
      check_dates TEXT,
      created_at  TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // 心情表
  db.exec(`
    CREATE TABLE IF NOT EXISTS moods (
      id         TEXT PRIMARY KEY,
      user_uid   TEXT NOT NULL,
      mood_type  TEXT,
      date       TEXT,
      note       TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // 提醒表
  db.exec(`
    CREATE TABLE IF NOT EXISTS reminders (
      id           TEXT PRIMARY KEY,
      user_uid     TEXT NOT NULL,
      habit_id     TEXT,
      habit_name   TEXT,
      habit_emoji  TEXT,
      time         TEXT,
      frequency    TEXT,
      enabled      INTEGER DEFAULT 1,
      created_at   TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // 回收站表（data 以 JSON 字符串存储被删除的原始数据）
  db.exec(`
    CREATE TABLE IF NOT EXISTS trash (
      id         TEXT PRIMARY KEY,
      user_uid   TEXT NOT NULL,
      type       TEXT,
      data       TEXT,
      deleted_at TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // ============ 数据库迁移：为旧表补充 created_at 列 ============
  migrateColumn('moods', 'created_at', 'TEXT');
  migrateColumn('reminders', 'created_at', 'TEXT');
  // users 表增加 access_code 列（用户专属访问口令）
  migrateColumn('users', 'access_code', 'TEXT');

  console.log('✅ 数据库表初始化完成');
}

// 安全添加列（如果列不存在才添加）
function migrateColumn(table, column, type) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = columns.some(c => c.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    console.log(`  📦 迁移: ${table} 表添加 ${column} 列`);
  }
}

module.exports = { initDatabase };
