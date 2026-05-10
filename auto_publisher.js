const fs = require('fs');
const path = require('path');
const uploadInstagram = require('./insta_upload');
const { uploadFacebook } = require('./facebook_upload');

// --- 중복 실행 방지 로직 (Lock File) ---
const LOCK_FILE = path.resolve(__dirname, 'publisher.lock');

if (fs.existsSync(LOCK_FILE)) {
    console.log('⚠️ 이미 다른 스케줄러가 실행 중입니다. (publisher.lock 발견)');
    console.log('만약 강제 종료 후 다시 실행하는 것이라면 publisher.lock 파일을 삭제하고 다시 실행하세요.');
    process.exit(1);
}

// 락 파일 생성
fs.writeFileSync(LOCK_FILE, process.pid.toString());

// 프로세스 종료 시 락 파일 삭제
function cleanup() {
    if (fs.existsSync(LOCK_FILE)) {
        fs.unlinkSync(LOCK_FILE);
        console.log('\n🔒 스케줄러 잠금이 해제되었습니다.');
    }
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(); });
process.on('SIGTERM', () => { cleanup(); process.exit(); });
process.on('uncaughtException', (err) => {
    console.error('치명적 에러 발생:', err);
    cleanup();
    process.exit(1);
});
// ------------------------------------

// 정규식으로 지시서(대시보드 HTML) 읽어오기
function parseSchedule() {
    const htmlPath = path.resolve(__dirname, 'dashboard', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // 섹션별 분리
    const slots = [];
    const sectionRegex = /<section class="slot" id="slot-(\d{4})">([\s\S]*?)<\/section>/g;
    let match;
    
    while ((match = sectionRegex.exec(html)) !== null) {
        const content = match[2];
        
        // 시간 파싱
        const timeMatch = content.match(/<div class="slot-time">(.*?)<\/div>/);
        const time = timeMatch ? timeMatch[1].trim() : null; // e.g. "19:30"
        
        // 타입(인스타/블로그) 및 제목 파싱
        const titleMatch = content.match(/<div class="slot-title">(.*?)<\/div>/);
        const title = titleMatch ? titleMatch[1].trim() : "";
        const isInsta = title.includes('인스타');
        
        // 캡션 파싱
        const captionMatch = content.match(/<div class="caption-box" id="cap-\d{4}">([\s\S]*?)<\/div>/);
        // HTML 내 줄바꿈 처리를 위해 약간의 디코딩 적용
        let caption = captionMatch ? captionMatch[1] : "";
        caption = caption.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
        
        // 이미지 경로 파싱
        const images = [];
        const imgRegex = /<img src="(images\/.*?)"/g;
        let imgMatch;
        while ((imgMatch = imgRegex.exec(content)) !== null) {
            images.push(path.resolve(__dirname, 'dashboard', imgMatch[1]));
        }

        if (time && isInsta && images.length > 0 && caption) {
            slots.push({
                time,
                title,
                images,
                caption
            });
        }
    }
    return slots;
}

// 스케줄러 로직
async function startScheduler() {
    console.log('📝 지시서 파싱 중...');
    const schedule = parseSchedule();
    
    if (schedule.length === 0) {
        console.log('❌ 파싱된 인스타그램/페이스북 스케줄이 없습니다.');
        return;
    }
    
    console.log(`✅ 총 ${schedule.length}개의 통합 소셜 스케줄이 로드되었습니다:`);
    schedule.forEach(s => console.log(` - [${s.time}] ${s.title}`));
    
    console.log('\n⏳ 자동 발행 타이머가 시작되었습니다. 창을 끄지 마세요!');
    
    // 이미 실행된 슬롯 방지 세트
    const executedSlots = new Set();
    
    // 이미 시간이 지난 슬롯은 오늘 실행하지 않기 위해 세트에 추가
    const now = new Date();
    const currentHourMin = now.getHours() * 60 + now.getMinutes();
    
    schedule.forEach(slot => {
        const [h, m] = slot.time.split(':').map(Number);
        const slotHourMin = h * 60 + m;
        if (slotHourMin < currentHourMin) {
            executedSlots.add(slot.time); // 이미 지난 시간은 세트에 등록해버림
        }
    });

    setInterval(async () => {
        const checkNow = new Date();
        const currentTime = `${String(checkNow.getHours()).padStart(2, '0')}:${String(checkNow.getMinutes()).padStart(2, '0')}`;
        
        for (const slot of schedule) {
            if (slot.time === currentTime && !executedSlots.has(slot.time)) {
                executedSlots.add(slot.time); // 중복 실행 방지
                console.log(`\n⏰ 예약된 시간이 되었습니다! [${slot.time}] 슬롯 실행 시작...`);
                
                // 순차 실행 (인스타 -> 페북)
                try {
                    await uploadInstagram(slot.images, slot.caption, `${slot.time} 인스타`);
                    await uploadFacebook(slot.images, slot.caption, `${slot.time} 페북`);
                } catch (e) {
                    console.error('발행 중 오류 발생:', e);
                }
            }
        }
    }, 10000); // 10초마다 체크하여 오차를 줄임
}

startScheduler();
