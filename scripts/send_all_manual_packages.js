const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TOKEN = '8722162859:AAFXVsi2rRNaqybfb4h5CeD9eFme-APzlFQ';
const CHAT_ID = '1294140235';

console.log('🚀 [Jincencho System] 오늘 바이럴 전체 패키지 텔레그램 전송 시작...');

const targets = [
    { id: 'busan_ecodelta_daeseong', file: '2026-05-11_Package_busan_ecodelta_daeseong.md', name: '부산 에코델타시티 대성베르힐' },
    { id: 'changwon_lotte_forest', file: '2026-05-11_Package_changwon_lotte_forest.md', name: '창원 롯데캐슬 포레스트 1BL' }
];

try {
    for (const target of targets) {
        console.log(`\n==========================================`);
        console.log(`🎯 타겟: ${target.name}`);
        console.log(`==========================================`);
        
        // 1. 이미지 전송
        for (let i = 1; i <= 5; i++) {
            const imgName = `carousel_${target.id}_${i}.png`;
            const imgPath = path.resolve(__dirname, '../generated_hooks', imgName);
            if (fs.existsSync(imgPath)) {
                console.log(` - 슬라이드 ${i} 전송 중...`);
                const cmd = `curl.exe -s -X POST "https://api.telegram.org/bot${TOKEN}/sendPhoto" -F chat_id=${CHAT_ID} -F photo="@${imgPath}"`;
                execSync(cmd);
            } else {
                console.log(` ⚠️ 파일을 찾을 수 없습니다: ${imgName}`);
            }
        }

        // 2. 캡션 추출
        const mdPath = path.resolve(__dirname, '../marketing_vault/Calendar', target.file);
        if (fs.existsSync(mdPath)) {
            const content = fs.readFileSync(mdPath, 'utf8');
            // 인스타그램 캡션 부분만 정규식으로 추출
            const instaMatch = content.match(/### 📱 \[INSTAGRAM\] 채널[\s\S]*?\*\*캡션\*\*:\s*([\s\S]*?)(?=\n---|$)/);
            
            let caption = "캡션을 찾을 수 없습니다.";
            if (instaMatch && instaMatch[1]) {
                caption = instaMatch[1].trim();
            }

            console.log(`📝 캡션 텍스트 전송 중...`);
            const header = `👇 [${target.name}] 복사용 텍스트 👇\n\n`;
            const urlEncodedText = encodeURIComponent(header + caption);
            const textCmd = `curl.exe -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" -d "chat_id=${CHAT_ID}" -d "text=${urlEncodedText}"`;
            execSync(textCmd);
        } else {
            console.log(` ⚠️ 마크다운 패키지 파일을 찾을 수 없습니다: ${target.file}`);
        }
        
        // API 리미트 방지를 위한 2초 대기
        execSync('powershell Start-Sleep -Seconds 2');
    }

    console.log('\n✅ 모든 타겟의 전송이 완료되었습니다! 폰에서 확인해 주세요.');

} catch (error) {
    console.error('🔥 전송 중 오류 발생:', error);
}
