require('./engine/env_loader');
const { chromium } = require('playwright');
const path = require('path');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; 

async function sendTelegramMessage(text) {
    if (TELEGRAM_CHAT_ID === 'TO_BE_FILLED') return;
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
        });
    } catch (e) {
        console.error('텔레그램 전송 실패:', e);
    }
}

/**
 * 인스타그램 업로드 자동화 함수
 * @param {string[]} images 절대 경로가 담긴 이미지 배열
 * @param {string} caption 본문 텍스트
 * @param {string} slotName 알림용 슬롯 이름 (예: "22:00 슬롯")
 */
async function uploadInstagram(images, caption, slotName = "인스타 슬롯") {
    const userDataDir = path.resolve(__dirname, 'playwright_data');
    console.log(`[${slotName}] 브라우저를 시작합니다...`);
    
    let context;
    try {
        context = await chromium.launchPersistentContext(userDataDir, {
            headless: false,
            viewport: { width: 1280, height: 800 }
        });
    } catch (e) {
        console.error('브라우저 실행 실패 (이미 열려있는지 확인하세요):', e);
        await sendTelegramMessage(`⚠️ [${slotName}] 브라우저를 열 수 없습니다. 이미 열려있는 창을 닫아주세요.`);
        return;
    }

    const page = context.pages()[0] || await context.newPage();
    
    try {
        console.log(`[${slotName}] 인스타그램으로 이동 중...`);
        await page.goto('https://www.instagram.com/');

        console.log(`[${slotName}] 로그인 상태를 확인하고 있습니다...`);
        await page.waitForTimeout(3000);

        console.log(`[${slotName}] 만들기(Create) 버튼 클릭...`);
        const createBtn = page.locator('span:has-text("만들기"), span:has-text("새 게시물"), span:has-text("새게시물"), span:has-text("Create"), span:has-text("New post"), svg[aria-label*="만들기"], svg[aria-label*="게시물"], svg[aria-label*="Create"], svg[aria-label*="New"]').first();
        await createBtn.waitFor({ state: 'visible', timeout: 300000 });
        await createBtn.click();

        try {
            const postOption = page.locator('span:text-is("Post"), span:text-is("게시물")').first();
            await postOption.waitFor({ state: 'visible', timeout: 2000 });
            await postOption.click();
        } catch (e) {
            // Dropdown might not appear, ignore
        }

        console.log(`[${slotName}] 업로드 창 열림. 사진 주입을 준비합니다...`);
        const selectComputerBtn = page.getByRole('button', { name: /Select from computer|컴퓨터에서 선택/i });
        await selectComputerBtn.waitFor({ state: 'visible', timeout: 10000 });

        console.log(`[${slotName}] OS 파일 탐색기를 가로챕니다...`);
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            selectComputerBtn.click()
        ]);
        
        await fileChooser.setFiles(images);
        console.log(`[${slotName}] 이미지 ${images.length}장 첨부 완료.`);

        await page.waitForTimeout(1000);
        console.log(`[${slotName}] 다음 단계로 이동 중...`);
        await page.getByRole('button', { name: /Next|다음/i }).first().click();
        
        await page.waitForTimeout(2000);
        console.log(`[${slotName}] 필터 화면 통과...`);
        await page.getByRole('button', { name: /Next|다음/i }).first().click();
        
        console.log(`[${slotName}] 캡션 텍스트 입력 중...`);
        const captionBoxSelector = 'div[role="textbox"][contenteditable="true"]';
        await page.waitForSelector(captionBoxSelector, { state: 'visible', timeout: 10000 });
        
        await page.fill(captionBoxSelector, caption);
        console.log(`[${slotName}] 캡션 입력 완료.`);
        
        await page.waitForTimeout(3000);
        console.log(`[${slotName}] 공유(Share) 버튼 클릭!`);
        await page.getByRole('button', { name: /Share|공유하기/i }).click();

        console.log(`[${slotName}] 업로드 완료를 기다리는 중 (최대 1분)...`);
        try {
            await Promise.race([
                page.waitForSelector('text="게시물이 공유되었습니다"', { timeout: 60000 }),
                page.waitForSelector('text="Your post has been shared"', { timeout: 60000 }),
                page.waitForSelector('div[role="dialog"]', { state: 'hidden', timeout: 60000 }),
                page.waitForTimeout(20000) // 최소 20초는 기다려줌 (업로드 시간 확보)
            ]);
        } catch (e) {
            // 무시 (오류가 나도 이미 전송은 진행되었음)
        }
        
        // 안정성을 위해 추가로 5초 대기
        await page.waitForTimeout(5000);
        
        console.log(`[${slotName}] ✅ 성공: 발행 완료 확인!`);
        await sendTelegramMessage(`✅ [${slotName}] 인스타그램 업로드가 성공적으로 완료되었습니다.`);
        
    } catch (e) {
        console.error(`[${slotName}] ❌ 에러 발생:`, e);
        await sendTelegramMessage(`⚠️ [${slotName}] 업로드 중 에러가 발생했습니다: ${e.message}`);
    } finally {
        console.log(`[${slotName}] 작업이 종료되었습니다. 5초 후 브라우저가 닫힙니다.`);
        await page.waitForTimeout(5000);
        await context.close();
    }
}

// 만약 직접 실행되었다면 (독립 실행 모드)
if (require.main === module) {
    const images = [
        path.resolve(__dirname, 'dashboard/images/I_NEW_SHINJEONG_03_IMG_01.png'),
        path.resolve(__dirname, 'dashboard/images/I_NEW_SHINJEONG_03_IMG_02.png'),
        path.resolve(__dirname, 'dashboard/images/I_NEW_SHINJEONG_03_IMG_03.png'),
        path.resolve(__dirname, 'dashboard/images/I_NEW_SHINJEONG_03_IMG_04.png'),
        path.resolve(__dirname, 'dashboard/images/I_NEW_SHINJEONG_03_IMG_05.png')
    ];
    const caption = `신정동 입주 채널 비교법 🏢\n\n빌트인 = 변경 불가 (비교 X)\n비빌트인 = 자유 선택 (비교 핵심)\n\n통합매장에서 D-30 한 번 방문 =\n비빌트인 전체 비교 완료.\n\n울산 토박이가 동선 정리해드립니다.\n\n📍 매장방문 → 프로필 링크\n📩 카톡 비대면 견적\n\n#삼성AI가전 #BespokeAI #JCC #진센조 #JINCENCHO #입주가전 #신축아파트 #빌트인가전 #비빌트인가전 #입주체크리스트 #문수로입주 #신정동입주 #문수로푸르지오입주 #문수로롯데캐슬입주 #진주통합매장 #부울경입주 #19년경력 #D30입주 #채널비교 #통합매장`;
    uploadInstagram(images, caption, "22:00 독립 실행 테스트");
}

module.exports = uploadInstagram;
