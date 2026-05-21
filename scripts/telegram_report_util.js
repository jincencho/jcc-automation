const TelegramBot = require('node-telegram-bot-api');

const token = '8722162859:AAFXVsi2rRNaqybfb4h5CeD9eFme-APzlFQ';
const chatId = '1294140235'; // Updated to main user chat ID

async function sendReport(date, targetNames) {
    const bot = new TelegramBot(token);
    const message = `📊 *[JCC 진센조 자동화 보고]*\n\n📅 날짜: ${date}\n✅ 생성 완료 타겟: ${targetNames.join(', ')}\n\n오늘의 바이럴 패키지 생성이 완료되었습니다. 폴더를 확인해 주세요!`;
    
    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log("📢 Telegram report sent.");
    } catch (e) {
        console.error("❌ Failed to send telegram report:", e.message);
    }
}

async function sendError(date, errorMessage) {
    const bot = new TelegramBot(token);
    const message = `🚨 *[JCC 진센조 자동화 오류]*\n\n📅 날짜: ${date}\n❌ 오류: ${errorMessage}\n\n콘텐츠 생성 중 문제가 발생했습니다. 수동 확인이 필요합니다.`;
    
    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log("🚨 Telegram error alert sent.");
    } catch (e) {
        console.error("❌ Failed to send error alert:", e.message);
    }
}

module.exports = { sendReport, sendError };
