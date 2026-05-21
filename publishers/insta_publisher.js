require('../engine/env_loader');
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
 * 인스타그램 업로드 자동화 함수 (22시간 전 다른 컴퓨터에서 성공했던 원본 로직)
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
            console.log(`[${slotName}] '게시물' 옵션 선택 중...`);
            const postOption = page.locator('span:has-text("게시물"), span:has-text("Post")').first();
            await postOption.waitFor({ state: 'visible', timeout: 10000 });
            await postOption.click();
            console.log(`[${slotName}] '게시물' 옵션 클릭 성공.`);
        } catch (e) {
            console.log(`[${slotName}] '게시물' 옵션이 바로 나타나지 않았습니다. (이미 업로드 창일 수 있음)`);
        }

        console.log(`[${slotName}] 업로드 창 열림. 잠시 대기 후 사진 주입을 준비합니다...`);
        await page.waitForTimeout(1500); // 애니메이션 대기
        const selectComputerBtn = page.locator('button:has-text("컴퓨터에서 선택"), button:has-text("Select from computer"), button:has-text("Select from Computer")').first();
        await selectComputerBtn.waitFor({ state: 'visible', timeout: 20000 });

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
                page.waitForTimeout(20000) 
            ]);
        } catch (e) {}
        
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

module.exports = uploadInstagram;
