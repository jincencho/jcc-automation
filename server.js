const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'schedule_data.json');
const BACKUP_DIR = path.join(__dirname, 'backups');
const HTML_FILE = path.join(__dirname, 'employee_schedule.html');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Helper to get local IPv4 addresses
function getLocalIps() {
  const ifaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push({ name, ip: net.address });
      }
    }
  }
  return ips;
}

// In-memory cache & persistence
let scheduleCache = null;
let lastUpdatedAt = 0;

function loadScheduleData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      scheduleCache = parsed.state || parsed;
      lastUpdatedAt = parsed.updatedAt || Date.now();
      console.log(`[DATA] Loaded existing schedule data (updatedAt: ${new Date(lastUpdatedAt).toLocaleString('ko-KR')})`);
    } catch (e) {
      console.error('[DATA] Error reading schedule_data.json', e);
    }
  }
}

loadScheduleData();

function saveScheduleData(state, updatedAt) {
  scheduleCache = state;
  lastUpdatedAt = updatedAt || Date.now();
  const payload = {
    state: scheduleCache,
    updatedAt: lastUpdatedAt,
    savedAt: new Date().toISOString()
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');

  // Daily / Periodic Backup
  const dateStr = new Date().toISOString().slice(0, 10);
  const backupFile = path.join(BACKUP_DIR, `schedule_backup_${dateStr}.json`);
  if (!fs.existsSync(backupFile)) {
    fs.writeFileSync(backupFile, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`[BACKUP] Created daily backup: ${backupFile}`);
  }
}

const server = http.createServer((req, res) => {
  // CORS headers so any local/remote clients can access seamlessly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // 1. API: GET /api/schedule
  if (url.pathname === '/api/schedule' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      state: scheduleCache,
      updatedAt: lastUpdatedAt
    }));
    return;
  }

  // 2. API: POST /api/schedule
  if (url.pathname === '/api/schedule' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (parsed.state) {
          saveScheduleData(parsed.state, parsed.updatedAt);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, updatedAt: lastUpdatedAt }));
          console.log(`[SYNC] Schedule updated at ${new Date().toLocaleTimeString('ko-KR')}`);
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing state object' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // 3. API: GET /api/status
  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'online',
      localIps: getLocalIps(),
      port: PORT,
      lastUpdatedAt
    }));
    return;
  }

  // 4. Serve Main Schedule Web Application
  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/schedule') {
    if (fs.existsSync(HTML_FILE)) {
      const html = fs.readFileSync(HTML_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('employee_schedule.html 파일을 찾을 수 없습니다.');
    }
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLocalIps();
  console.log('================================================================');
  console.log('🏢 [직원 휴무 계획표 중앙 실시간 연동 서버가 시작되었습니다]');
  console.log('----------------------------------------------------------------');
  console.log(`▶ 현재 PC 접속 주소 :   http://localhost:${PORT}`);
  ips.forEach(i => {
    console.log(`▶ 같은 매장/Wi-Fi 접속: http://${i.ip}:${PORT}  (${i.name})`);
  });
  console.log('----------------------------------------------------------------');
  console.log('※ 다른 PC/모바일에서 위 주소로 접속하면 실시간으로 연동됩니다.');
  console.log('================================================================');
});
