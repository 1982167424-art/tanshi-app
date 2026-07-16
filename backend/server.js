require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./src/config');

// 初始化数据库
require('./src/models/database');
require('./src/models/init').initDatabase();

const routes = require('./src/routes');
const logger = require('./src/middleware/logger');
const errorHandler = require('./src/middleware/errorHandler');
const db = require('./src/models/database');

const app = express();
const PORT = config.port;

// ============ 全局中间件 ============
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(logger);

// ============ 健康检查 ============
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: '探时后端服务运行正常', data: { status: 'ok' } });
});

// ============ 业务路由 ============
app.use('/api', routes);

// ============ 管理后台页面 ============
app.get('/', (req, res) => {
  // 口令验证：优先检查 cookie，其次 query 参数
  const cookieCode = (req.headers.cookie || '').match(/access_code=([^;]+)/);
  const passedCode = cookieCode ? decodeURIComponent(cookieCode[1]) : '';
  const queryCode = req.query.code;

  if (passedCode !== config.accessCode && queryCode !== config.accessCode) {
    // 未通过验证，显示口令输入页
    return res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>探时 - 访问验证</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#fff7ed,#fef3c7);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:rgba(255,255,255,.85);border-radius:20px;padding:40px;box-shadow:0 8px 30px rgba(251,191,36,.2);border:1px solid rgba(251,191,36,.3);max-width:380px;width:100%;text-align:center}
.icon{font-size:3rem;margin-bottom:16px}
h1{color:#92400e;font-size:1.5rem;margin-bottom:8px;font-family:serif}
.desc{color:#a16207;font-size:.85rem;margin-bottom:24px}
input{width:100%;padding:12px 16px;border:1px solid #fbbf24;border-radius:10px;font-size:.95rem;margin-bottom:12px;outline:none;transition:border-color .2s;background:rgba(255,255,255,.7)}
input:focus{border-color:#f59e0b}
button{width:100%;padding:12px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#fff;border:none;border-radius:10px;font-size:1rem;font-weight:600;cursor:pointer;transition:transform .2s}
button:hover{transform:scale(1.02)}
.error{color:#dc2626;font-size:.8rem;margin-top:8px;min-height:1rem}
</style>
</head>
<body>
<div class="card">
<div class="icon">🔐</div>
<h1>探时管理后台</h1>
<p class="desc">请输入访问口令以继续</p>
<form id="form">
<input id="code" type="password" placeholder="访问口令" autocomplete="off" autofocus>
<button type="submit">进入</button>
<div class="error" id="err"></div>
</form>
</div>
<script>
document.getElementById('form').addEventListener('submit', function(e){
  e.preventDefault();
  const code = document.getElementById('code').value;
  // 跳转携带口令，后端会种 cookie
  window.location.href = '/?code=' + encodeURIComponent(code);
});
</script>
</body>
</html>`);
  }

  // 验证通过，种 cookie（有效期7天）
  if (queryCode === config.accessCode) {
    res.setHeader('Set-Cookie', `access_code=${encodeURIComponent(config.accessCode)}; Path=/; Max-Age=604800; HttpOnly`);
    return res.redirect('/');
  }

  // ===== 以下为管理后台主页面 =====
  const { safeUser } = require('./src/services/auth.service');
  const rawUsers = db.prepare('SELECT * FROM users').all();
  const users = rawUsers.map(safeUser);
  const days = db.prepare('SELECT * FROM days').all();
  const notes = db.prepare('SELECT * FROM notes').all();
  const habits = db.prepare('SELECT * FROM habits').all();
  const moods = db.prepare('SELECT * FROM moods').all();
  const reminders = db.prepare('SELECT * FROM reminders').all();
  const trash = db.prepare('SELECT * FROM trash').all();
  const adminKey = config.adminKey;

  // 预构建用户卡片HTML
  const userCards = users.length === 0
    ? '<div class="empty"><div class="emoji">📭</div><p>暂无注册用户</p></div>'
    : users.map(u => {
        const uDays = days.filter(d => d.user_uid === u.uid).length;
        const uNotes = notes.filter(n => n.user_uid === u.uid).length;
        const uHabits = habits.filter(h => h.user_uid === u.uid).length;
        const uMoods = moods.filter(m => m.user_uid === u.uid).length;
        const uReminders = reminders.filter(r => r.user_uid === u.uid).length;
        return [
          '<div class="user-card" id="user-' + u.uid + '">',
          '  <div class="user-header">',
          '    <div class="avatar">' + u.username.charAt(0).toUpperCase() + '</div>',
          '    <div class="user-info"><h3>' + u.username + '</h3><p>' + u.uid + '</p></div>',
          '  </div>',
          '  <div style="font-size:.85rem;color:#a16207">',
          '    <span style="margin-right:12px">🎂 ' + (u.birthday || '') + '</span>',
          '    <span class="badge ' + (u.isTeenMode ? 'badge-teen' : 'badge-normal') + '">' + (u.isTeenMode ? '青少年模式' : '标准模式') + '</span>',
          '  </div>',
          '  <div class="data-stats">',
          '    <div class="data-stat"><div class="num">' + uDays + '</div><div class="label">日子</div></div>',
          '    <div class="data-stat"><div class="num">' + uNotes + '</div><div class="label">笔记</div></div>',
          '    <div class="data-stat"><div class="num">' + uHabits + '</div><div class="label">习惯</div></div>',
          '    <div class="data-stat"><div class="num">' + uMoods + '</div><div class="label">心情</div></div>',
          '    <div class="data-stat"><div class="num">' + uReminders + '</div><div class="label">提醒</div></div>',
          '  </div>',
          '  <div style="font-size:.8rem;color:#a16207">注册时间：' + (u.createdAt ? new Date(u.createdAt).toLocaleDateString('zh-CN') : '-') + '</div>',
          '  <button class="delete-btn" onclick="deleteUser(\'' + u.uid + '\')">🗑️ 删除用户及所有数据</button>',
          '</div>',
        ].join('\n');
      }).join('');

  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>探时 - 管理后台</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#fff7ed,#fef3c7);min-height:100vh;padding:20px}
.header{text-align:center;padding:30px;background:rgba(255,255,255,.8);border-radius:20px;margin-bottom:20px;box-shadow:0 4px 20px rgba(251,191,36,.15)}
.header h1{color:#92400e;font-size:2rem;display:flex;align-items:center;justify-content:center;gap:10px}
.stats{display:flex;justify-content:center;gap:16px;margin-top:20px;flex-wrap:wrap}
.stat-item{text-align:center;padding:12px 24px;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:12px;min-width:100px}
.stat-number{font-size:2rem;font-weight:700;color:#92400e}
.stat-label{font-size:.8rem;color:#a16207}
.users-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.user-card{background:rgba(255,255,255,.85);border-radius:16px;padding:20px;box-shadow:0 4px 15px rgba(0,0,0,.08);border:1px solid rgba(251,191,36,.2);transition:transform .2s,box-shadow .2s}
.user-card:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(251,191,36,.2)}
.user-header{display:flex;align-items:center;gap:12px;margin-bottom:15px}
.avatar{width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,#fbbf24,#f59e0b);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:#fff;font-weight:600}
.user-info h3{color:#78350f;font-size:1.1rem}
.user-info p{color:#a16207;font-size:.85rem;font-family:monospace}
.data-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:15px 0;padding:15px 0;border-top:1px solid rgba(251,191,36,.2);border-bottom:1px solid rgba(251,191,36,.2)}
.data-stat{text-align:center;padding:8px;background:rgba(251,191,36,.08);border-radius:8px}
.data-stat .num{font-size:1.4rem;font-weight:700;color:#92400e}
.data-stat .label{font-size:.7rem;color:#a16207}
.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:500}
.badge-teen{background:linear-gradient(135deg,#fde68a,#fbbf24);color:#78350f}
.badge-normal{background:linear-gradient(135deg,#dbeafe,#93c5fd);color:#1e40af}
.delete-btn{background:linear-gradient(135deg,#fecaca,#fca5a5);color:#991b1b;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:.85rem;transition:all .2s;margin-top:10px;width:100%}
.delete-btn:hover{background:linear-gradient(135deg,#fca5a5,#f87171)}
.empty{text-align:center;padding:60px 20px;color:#a16207}
.empty .emoji{font-size:4rem;margin-bottom:20px}
.refresh-btn{position:fixed;bottom:20px;right:20px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#fff;border:none;padding:15px 25px;border-radius:30px;cursor:pointer;font-weight:600;box-shadow:0 4px 15px rgba(251,191,36,.4);transition:transform .2s}
.refresh-btn:hover{transform:scale(1.05)}
</style>
</head>
<body>
<div class="header">
<h1>⏰ 探时管理后台</h1>
<div class="stats">
<div class="stat-item"><div class="stat-number">${users.length}</div><div class="stat-label">用户</div></div>
<div class="stat-item"><div class="stat-number">${days.length}</div><div class="stat-label">日子</div></div>
<div class="stat-item"><div class="stat-number">${notes.length}</div><div class="stat-label">笔记</div></div>
<div class="stat-item"><div class="stat-number">${habits.length}</div><div class="stat-label">习惯</div></div>
<div class="stat-item"><div class="stat-number">${moods.length}</div><div class="stat-label">心情</div></div>
<div class="stat-item"><div class="stat-number">${reminders.length}</div><div class="stat-label">提醒</div></div>
<div class="stat-item"><div class="stat-number">${trash.length}</div><div class="stat-label">回收站</div></div>
</div>
</div>
<div class="users-grid">
${userCards}
</div>
<button class="refresh-btn" onclick="location.reload()">🔄 刷新</button>
<script>
const ADMIN_KEY = '${adminKey}';
async function deleteUser(uid){
  if(!confirm('确定删除该用户及所有数据？此操作不可恢复！'))return;
  try{
    const r=await fetch('/api/admin/users/'+uid,{method:'DELETE',headers:{'X-Admin-Key':ADMIN_KEY}});
    const d=await r.json();
    if(d.success){alert('已删除');location.reload();}
    else alert('失败：'+d.message);
  }catch(e){alert('失败：'+e.message);}
}
</script>
</body>
</html>`);
});

// ============ 404 ============
app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

// ============ 错误处理 ============
app.use(errorHandler);

// ============ 启动 ============
const server = app.listen(PORT, () => {
  console.log(`🚀 探时后端服务已启动: http://localhost:${PORT}`);
  console.log(`📡 API端点 (前缀 /api):`);
  console.log(`   POST   /api/auth/register        - 注册`);
  console.log(`   POST   /api/auth/login           - 登录`);
  console.log(`   GET    /api/users/:uid            - 获取用户`);
  console.log(`   PUT    /api/users/:uid            - 更新用户`);
  console.log(`   PUT    /api/users/:uid/password   - 修改密码`);
  console.log(`   DELETE /api/users/:uid            - 删除用户`);
  console.log(`   GET/POST/PUT/DELETE /api/days      - 日子CRUD`);
  console.log(`   GET/POST/PUT/DELETE /api/notes     - 笔记CRUD`);
  console.log(`   GET/POST/PUT/DELETE /api/habits    - 习惯CRUD`);
  console.log(`   GET/POST/PUT/DELETE /api/moods     - 心情CRUD`);
  console.log(`   GET/POST/PUT/DELETE /api/reminders - 提醒CRUD`);
  console.log(`   GET /api/trash  POST /api/trash/:id/restore  DELETE /api/trash/:id - 回收站`);
  console.log(`   GET    /api/data/export           - 导出数据`);
  console.log(`   POST   /api/data/import           - 导入数据`);
  console.log(`   GET    /api/data/search?q=        - 全局搜索`);
  console.log(`   POST   /api/ai/chat               - AI对话`);
  console.log(`   POST   /api/ai/analysis           - AI心情分析`);
  console.log(`   GET    /api/admin/stats           - 管理统计(需Admin-Key)`);
  console.log(`   DELETE /api/admin/users/:uid      - 管理删除用户(需Admin-Key)`);
});

// ============ 定时清理回收站（每天凌晨3点） ============
const TRASH_EXPIRE_DAYS = 30;
const purgeExpiredTrash = () => {
  try {
    const threshold = new Date(Date.now() - TRASH_EXPIRE_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const result = db.prepare('DELETE FROM trash WHERE deleted_at < ?').run(threshold);
    if (result.changes > 0) {
      console.log(`🗑️ 回收站清理: 删除了 ${result.changes} 条过期记录`);
    }
  } catch (err) {
    console.error('回收站清理失败:', err.message);
  }
};

// 计算距离下一个凌晨3点的毫秒数
const getMsUntil3AM = () => {
  const now = new Date();
  const next = new Date(now);
  next.setHours(3, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next - now;
};

// 首次延迟到凌晨3点执行，之后每24小时执行一次
setTimeout(() => {
  purgeExpiredTrash();
  setInterval(purgeExpiredTrash, 24 * 60 * 60 * 1000);
}, getMsUntil3AM());
console.log(`⏰ 回收站定时清理已启用: 每天凌晨3点自动清理${TRASH_EXPIRE_DAYS}天前的过期数据`);

// ============ 优雅关闭 ============
function gracefulShutdown(signal) {
  console.log(`\n${signal} 收到，正在关闭服务...`);
  server.close(() => {
    console.log('HTTP 服务已关闭');
    try {
      db.close();
      console.log('数据库连接已关闭');
    } catch {
      // 数据库可能已关闭
    }
    process.exit(0);
  });

  // 5秒后强制退出
  setTimeout(() => {
    console.error('强制关闭');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
