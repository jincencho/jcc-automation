const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const index = trimmed.indexOf('=');
            if (index > 0) {
                const key = trimmed.substring(0, index).trim();
                const val = trimmed.substring(index + 1).trim();
                process.env[key] = val;
            }
        }
    }
    
    // Default safe fallbacks (to prevent runtime crashes if file is missing)
    if (!process.env.TELEGRAM_TOKEN) {
        process.env.TELEGRAM_TOKEN = '8722162859:AAFXVsi2rRNaqybfb4h5CeD9eFme-APzlFQ';
    }
    if (!process.env.TELEGRAM_CHAT_ID) {
        process.env.TELEGRAM_CHAT_ID = '1294140235';
    }
}

loadEnv();
