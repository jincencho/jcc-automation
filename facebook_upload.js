const { chromium } = require('playwright');
const path = require('path');

// Telegram settings
const TELEGRAM_TOKEN = '8722162859:AAFXVsi2rRNaqybfb4h5CeD9eFme-APzlFQ';
const TELEGRAM_CHAT_ID = '1294140235';

async function sendTelegramMessage(message) {
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message
            })
        });
    } catch (error) {
        console.error('텔레그램 전송 실패:', error.message);
    }
}

async function uploadFacebook(imagePaths, caption, slotName) {
    console.log(`[${slotName}] 페이스북 업로드 시작...`);
    const userDataDir = path.resolve(__dirname, 'user_data_fb');
    const browser = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: ['--start-maximized'],
        noViewport: true
    });

    const page = await browser.newPage();

    try {
        await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        // 로그인 확인 (게시물 작성 버튼이 없으면 로그인 필요)
        const postTriggerSelector = 'div[role="button"] span:has-text("무슨 생각을 하고 계신가요?")';
        const loginCheck = await page.$(postTriggerSelector);
        
        if (!loginCheck) {
            console.log(`[${slotName}] 페이스북 로그인이 필요합니다. 브라우저에서 로그인해 주세요.`);
            await sendTelegramMessage(`⚠️ [${slotName}] 페이스북 로그인이 필요합니다. 브라우저 창을 확인해 주세요.`);
            // 사용자가 로그인할 때까지 대기 (최대 5분)
            await page.waitForSelector(postTriggerSelector, { timeout: 300000 });
        }

        // --- 계정 전환 (진센조 프로필로 전환) ---
        console.log(`[${slotName}] '진센조' 프로필 전환 확인 중...`);
        try {
            // 현재 활성화된 프로필 아이콘 클릭
            await page.click('div[aria-label="내 프로필"], div[aria-label="Your profile"]', { timeout: 10000 });
            
            // '진센조' 프로필이 바로 보이면 클릭, 아니면 '모든 프로필 보기' 클릭
            const jincenchoSelector = 'div[role="button"]:has-text("진센조"), div[aria-label*="진센조"]';
            const jincenchoBtn = page.locator(jincenchoSelector).first();
            
            if (await jincenchoBtn.isVisible()) {
                console.log(`[${slotName}] '진센조' 프로필 발견, 전환합니다...`);
                await jincenchoBtn.click();
            } else {
                console.log(`[${slotName}] '모든 프로필 보기' 클릭 중...`);
                await page.click('div[aria-label="프로필 모두 보기"], div[aria-label="See all profiles"]');
                await page.waitForTimeout(2000);
                await page.click(jincenchoSelector);
                console.log(`[${slotName}] '진센조' 프로필로 전환을 시도했습니다.`);
            }
            
            // 전환 후 메인 페이지 로딩 대기
            await page.waitForTimeout(5000); 
            await page.goto('https://www.facebook.com/', { waitUntil: 'domcontentloaded' });
        } catch (e) {
            console.log(`[${slotName}] 프로필 전환 건너뜀 (이미 진센조이거나 메뉴를 찾을 수 없음):`, e.message);
        }

        // 알림 설정 등 팝업 창 닫기 시도
        try {
            console.log(`[${slotName}] 팝업 창 확인 중...`);
            const closeDialogBtn = page.locator('div[role="dialog"] div[role="button"][aria-label="닫기"], div[role="dialog"] div[role="button"]:has-text("나중에 하기"), div[role="dialog"] div[role="button"]:has-text("Not Now")').first();
            if (await closeDialogBtn.isVisible()) {
                await closeDialogBtn.click();
                console.log(`[${slotName}] 팝업 창을 닫았습니다.`);
            }
        } catch (e) {
            // 무시
        }

        console.log(`[${slotName}] 게시물 작성창 여는 중...`);
        // 팝업에 가려져 있을 수 있으므로 강제 클릭 또는 엔터
        await page.click(postTriggerSelector, { force: true });

        console.log(`[${slotName}] 사진/동영상 영역 활성화...`);
        // 사진/동영상 버튼 클릭
        await page.click('div[role="button"][aria-label="사진/동영상"]', { force: true });

        console.log(`[${slotName}] 이미지 파일 업로드 중...`);
        // 파일 입력을 위한 hidden input 찾기 (상태: attached)
        const fileInput = await page.waitForSelector('input[type="file"][accept*="image"]', { state: 'attached', timeout: 10000 });
        await fileInput.setInputFiles(imagePaths);
        console.log(`[${slotName}] 이미지 첨부 완료.`);

        console.log(`[${slotName}] 캡션 입력 중...`);
        // 더 유연한 캡션 입력창 셀렉터 사용
        const textInputSelector = 'div[role="textbox"][contenteditable="true"], div[role="textbox"][aria-label*="생각"], div[role="textbox"][aria-label*="write"], div[role="textbox"][aria-label*="Post"]';
        await page.waitForSelector(textInputSelector, { timeout: 30000 });
        await page.fill(textInputSelector, caption);

        console.log(`[${slotName}] 게시/다음 버튼 상태 확인 및 클릭 시도...`);
        // 정확한 텍스트 매칭을 위해 text-is 사용
        const nextBtnSelector = 'div[role="button"][aria-label="다음"], div[role="button"][aria-label="Next"], div[role="button"] span:text-is("다음"), div[role="button"] span:text-is("Next")';
        const postBtnSelector = 'div[role="button"][aria-label="게시"], div[role="button"][aria-label="Post"], div[role="button"] span:text-is("게시"), div[role="button"] span:text-is("Post")';
        
        const actionBtn = await page.waitForSelector(`${nextBtnSelector}, ${postBtnSelector}`, { timeout: 30000 });
        const btnLabel = (await actionBtn.innerText() || await actionBtn.getAttribute('aria-label') || "").toLowerCase();
        console.log(`[${slotName}] 감지된 버튼 라벨: ${btnLabel}`);
        
        console.log(`[${slotName}] 버튼 활성화 대기 중...`);
        for (let i = 0; i < 15; i++) {
            const isDisabled = await actionBtn.getAttribute('aria-disabled');
            if (isDisabled !== 'true') break;
            await page.waitForTimeout(1000);
        }

        await page.waitForTimeout(2000);
        await actionBtn.click({ force: true });
        
        if (btnLabel.includes('다음') || btnLabel.includes('next')) {
            console.log(`[${slotName}] '다음' 클릭 완료. 최종 '게시' 버튼 대기 중...`);
            const finalPostBtn = await page.waitForSelector(postBtnSelector, { timeout: 15000 });
            await page.waitForTimeout(2000);
            await finalPostBtn.click({ force: true });
            console.log(`[${slotName}] 최종 '게시' 클릭 완료!`);
        } else {
            await page.keyboard.press('Enter');
        }

        // --- 게시 후 나타나는 팝업(공유 권장 등) 닫기 시도 ---
        try {
            console.log(`[${slotName}] 완료 팝업 확인 중...`);
            await page.waitForTimeout(5000); // 팝업이 뜰 때까지 잠시 대기
            const finishDialogBtn = page.locator('div[role="dialog"] div[role="button"][aria-label="닫기"], div[role="dialog"] div[role="button"]:has-text("완료"), div[role="dialog"] div[role="button"]:has-text("Done"), div[role="dialog"] div[role="button"][aria-label="Close"]').first();
            if (await finishDialogBtn.isVisible()) {
                await finishDialogBtn.click();
                console.log(`[${slotName}] 완료 팝업을 닫았습니다.`);
            }
        } catch (e) {
            // 무시
        }

        console.log(`[${slotName}] ✅ 페이스북 발행 프로세스 완료!`);
        await sendTelegramMessage(`✅ [${slotName}] 페이스북 업로드가 성공적으로 완료되었습니다.`);

    } catch (error) {
        console.error(`[${slotName}] 에러 발생:`, error);
        await sendTelegramMessage(`❌ [${slotName}] 페이스북 업로드 중 에러: ${error.message}`);
    } finally {
        console.log(`[${slotName}] 작업이 종료되었습니다. 5초 후 브라우저가 닫힙니다.`);
        await page.waitForTimeout(5000);
        await browser.close();
    }
}

// 독립 실행 테스트 모드
if (require.main === module) {
    const images = [
        path.resolve(__dirname, 'sub_carousel_final_1.png'),
        path.resolve(__dirname, 'sub_carousel_final_2.png'),
        path.resolve(__dirname, 'sub_carousel_final_3.png'),
        path.resolve(__dirname, 'sub_carousel_final_4.png'),
        path.resolve(__dirname, 'sub_carousel_final_5.png')
    ];
    const caption = `[진센조 가전구독 특별 컨설팅] 🕴️\n\n로봇청소기 딱 한 대, 그냥 온라인으로 대충 구독하셨습니까?\n\n진주 통합매장 '진센조'는 다릅니다. 단 1대의 구독이라도 고객님의 라이프스타일을 분석해 최적의 요금제를 설계해 드립니다.\n\n📍 상담 신청은 아래 프로필 링크를 클릭하세요!\nhttps://linktr.ee/jincencho\n\n#가전구독 #삼성AI구독 #진센조 #통합진주 #진주가전 #비대면상담`;
    uploadFacebook(images, caption, "페이스북 테스트 슬롯");
}

module.exports = { uploadFacebook };
