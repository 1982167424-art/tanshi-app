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

  // 签到记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS checkins (
      id            TEXT PRIMARY KEY,
      user_uid      TEXT NOT NULL,
      checkin_date  TEXT NOT NULL,
      points_earned INTEGER DEFAULT 2,
      renewed       INTEGER DEFAULT 0,
      created_at    TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // 用户称号表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_titles (
      id            TEXT PRIMARY KEY,
      user_uid      TEXT NOT NULL,
      title_code    TEXT NOT NULL,
      title_name    TEXT NOT NULL,
      title_type    TEXT NOT NULL,
      is_permanent  INTEGER DEFAULT 0,
      unlocked_at   TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // 设备登录记录表（限5台设备）
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_sessions (
      id          TEXT PRIMARY KEY,
      user_uid    TEXT NOT NULL,
      device_info TEXT,
      ip_address  TEXT,
      login_at    TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // IP 注册记录表（每IP只能注册1个账号）
  db.exec(`
    CREATE TABLE IF NOT EXISTS registered_ips (
      ip_address TEXT PRIMARY KEY,
      user_uid   TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // ============ 好友关系表 ============
  db.exec(`
    CREATE TABLE IF NOT EXISTS friends (
      id TEXT PRIMARY KEY,
      user_uid TEXT NOT NULL,
      friend_uid TEXT NOT NULL,
      permission TEXT DEFAULT 'chat_only',
      created_at TEXT NOT NULL,
      UNIQUE(user_uid, friend_uid)
    );
  `);

  // ============ 好友申请表 ============
  db.exec(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id TEXT PRIMARY KEY,
      from_uid TEXT NOT NULL,
      to_uid TEXT NOT NULL,
      reason TEXT DEFAULT '',
      reply TEXT DEFAULT '',
      permission TEXT DEFAULT 'chat_only',
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL
    );
  `);

  // ============ 隐私设置表 ============
  db.exec(`
    CREATE TABLE IF NOT EXISTS privacy_settings (
      user_uid TEXT PRIMARY KEY,
      show_exercise INTEGER DEFAULT 1,
      show_space INTEGER DEFAULT 1,
      show_status INTEGER DEFAULT 1,
      block_exercise TEXT DEFAULT '[]',
      block_space TEXT DEFAULT '[]',
      block_status TEXT DEFAULT '[]'
    );
  `);

  // ============ 验证码表 ============
  db.exec(`
    CREATE TABLE IF NOT EXISTS verify_codes (
      id TEXT PRIMARY KEY,
      target TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  // ============ 空间（朋友圈）帖子表 ============
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_uid TEXT NOT NULL,
      content TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      video TEXT DEFAULT '',
      visibility TEXT DEFAULT 'friends',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // ============ 帖子评论表 ============
  db.exec(`
    CREATE TABLE IF NOT EXISTS post_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_uid TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // ============ 帖子点赞表 ============
  db.exec(`
    CREATE TABLE IF NOT EXISTS post_likes (
      post_id TEXT NOT NULL,
      user_uid TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, user_uid),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // ============ 状态表（微信状态） ============
  db.exec(`
    CREATE TABLE IF NOT EXISTS statuses (
      id TEXT PRIMARY KEY,
      user_uid TEXT NOT NULL,
      content TEXT NOT NULL,
      emoji TEXT DEFAULT '',
      background TEXT DEFAULT '',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // ============ 好友私聊消息表 ============
  db.exec(`
    CREATE TABLE IF NOT EXISTS friend_messages (
      id TEXT PRIMARY KEY,
      from_uid TEXT NOT NULL,
      to_uid TEXT NOT NULL,
      content TEXT NOT NULL,
      msg_type TEXT DEFAULT 'text',
      extra TEXT DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (from_uid) REFERENCES users(uid) ON DELETE CASCADE,
      FOREIGN KEY (to_uid) REFERENCES users(uid) ON DELETE CASCADE
    );
  `);

  // ============ 收藏表 ============
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_uid TEXT NOT NULL,
      fav_type TEXT NOT NULL,
      fav_id TEXT NOT NULL,
      title TEXT DEFAULT '',
      subtitle TEXT DEFAULT '',
      url TEXT DEFAULT '',
      icon TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      UNIQUE(user_uid, fav_type, fav_id)
    );
  `);

  // ============ 黑名单表 ============
  db.exec(`
    CREATE TABLE IF NOT EXISTS blocklist (
      user_uid TEXT NOT NULL,
      blocked_uid TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_uid, blocked_uid)
    );
  `);

  // ============ 数据库迁移 ============
  migrateColumn('moods', 'created_at', 'TEXT');
  migrateColumn('reminders', 'created_at', 'TEXT');
  migrateColumn('users', 'access_code', 'TEXT');
  migrateColumn('users', 'points', 'INTEGER DEFAULT 0');
  migrateColumn('users', 'total_checkin_days', 'INTEGER DEFAULT 0');
  migrateColumn('users', 'oauth_provider', 'TEXT');
  migrateColumn('users', 'oauth_id', 'TEXT');
  migrateColumn('users', 'oauth_email', 'TEXT');
  migrateColumn('friend_messages', 'msg_type', "TEXT DEFAULT 'text'");
  migrateColumn('friend_messages', 'extra', "TEXT DEFAULT '{}'");

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
