const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TOKEN = '8722162859:AAFXVsi2rRNaqybfb4h5CeD9eFme-APzlFQ';
const CHAT_ID = '1294140235';

console.log('🚀 [Jincencho System] 프리미엄 이미지 재전송을 시작합니다...');

const images = [
    { name: '혼수 프리미엄', file: 'wedding_premium.png' },
    { name: '구독 프리미엄', file: 'subscription_premium.png' }
];

// 보관소에서 이미지 가져오기 (절대 경로 직접 지정)
const brainDir = 'C:\\Users\\진센조\\.gemini\\antigravity\\brain\\b606a68d-6cce-4c21-b612-6a46ca0eb984';
const source1 = path.join(brainDir, 'wedding_premium_interior_1778494603788.png');
const source2 = path.join(brainDir, 'subscription_trendy_minimalist_1778494625447.png');

const targetDir = 'c:\\jincenchoproject\\generated_hooks';

try {
    // 파일 복사 시도
    console.log('📦 보관소에서 파일을 가져오는 중...');
    if (fs.existsSync(source1)) {
        fs.copyFileSync(source1, path.join(targetDir, 'wedding_premium.png'));
    }
    if (fs.existsSync(source2)) {
        fs.copyFileSync(source2, path.join(targetDir, 'subscription_premium.png'));
    }

    for (const img of images) {
        const imgPath = path.join(targetDir, img.file);
        if (fs.existsSync(imgPath)) {
            console.log(`📸 [${img.name}] 전송 중...`);
            const cmd = `curl.exe -s -X POST "https://api.telegram.org/bot${TOKEN}/sendPhoto" -F chat_id=${CHAT_ID} -F photo="@${imgPath}"`;
            const result = execSync(cmd).toString();
            console.log(`✅ [${img.name}] 전송 성공!`);
        } else {
            console.log(`⚠️ [${img.name}] 파일을 찾을 수 없어 전송을 건너뜁니다.`);
        }
    }
    console.log('🏁 모든 이미지 재전송 작업이 완료되었습니다.');
} catch (error) {
    console.error('🔥 전송 중 오류 발생:', error.message);
}
