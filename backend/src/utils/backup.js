/**
 * SQLite 数据库备份工具
 * 定时将数据库备份到 data/backup/ 目录
 */
const db = require('../models/database');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../../data/backup');
const MAX_BACKUPS = 7; // 保留最近7天的备份

// 确保备份目录存在
const ensureBackupDir = () => {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
};

// 执行备份
const backup = () => {
  try {
    ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `tanshi-${timestamp}.db`);

    // 使用 SQLite 的 backup API（更安全）
    db.backup(backupPath)
      .then(() => {
        console.log(`✅ 数据库备份成功: ${backupPath}`);
        cleanupOldBackups();
      })
      .catch((err) => {
        console.error('❌ 数据库备份失败:', err.message);
      });
  } catch (err) {
    console.error('❌ 数据库备份失败:', err.message);
  }
};

// 清理旧备份（保留最近 MAX_BACKUPS 个）
const cleanupOldBackups = () => {
  try {
    ensureBackupDir();
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('tanshi-') && f.endsWith('.db'))
      .sort()
      .reverse();

    if (files.length > MAX_BACKUPS) {
      files.slice(MAX_BACKUPS).forEach(f => {
        fs.unlinkSync(path.join(BACKUP_DIR, f));
        console.log(`🗑️ 清理旧备份: ${f}`);
      });
    }
  } catch (err) {
    console.error('清理旧备份失败:', err.message);
  }
};

// 启动定时备份（每天凌晨4点）
const startScheduledBackup = () => {
  const getMsUntil4AM = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(4, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next - now;
  };

  setTimeout(() => {
    backup();
    setInterval(backup, 24 * 60 * 60 * 1000);
  }, getMsUntil4AM());

  console.log('⏰ 数据库定时备份已启用: 每天凌晨4点自动备份');
};

module.exports = { backup, startScheduledBackup };
