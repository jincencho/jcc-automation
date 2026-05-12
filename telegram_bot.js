const TelegramBot = require('node-telegram-bot-api');
const { runAutoViral } = require('./auto_publisher');
const fs = require('fs');
const path = require('path');

const token = '8722162859:AAFXVsi2rRNaqybfb4h5CeD9eFme-APzlFQ';
const bot = new TelegramBot(token, { polling: true });

console.log('🚀 JCC 진센조 체계화된 원격 제어 봇이 가동되었습니다.');

bot.onText(/\/status/, (msg) => {
    const strategy = JSON.parse(fs.readFileSync('./data/marketing_strategy.json', 'utf8'));
    const targets = JSON.parse(fs.readFileSync('./data/viral_targets.json', 'utf8'));
    const activeCount = targets.filter(t => t.status === 'active').length;
    
    let statusMsg = `📊 *JCC 진센조 시스템 상태*\n\n`;
    statusMsg += `✅ 핵심 타겟: ${Object.keys(strategy.core_targets).length}종\n`;
    statusMsg += `✅ 대기 중 타겟: ${activeCount}개\n`;
    
    bot.sendMessage(msg.chat.id, statusMsg, { parse_mode: 'Markdown' });
});

bot.onText(/\/publish/, async (msg) => {
    bot.sendMessage(msg.chat.id, '🔄 오늘 의 마케팅 프로세스를 시작합니다 (체계화 버전)...');
    try {
        await runAutoViral();
        bot.sendMessage(msg.chat.id, '✨ 오늘 의 바이럴 마케팅이 성공적으로 완료되었습니다!');
    } catch (e) {
        bot.sendMessage(msg.chat.id, `❌ 에러: ${e.message}`);
    }
});
