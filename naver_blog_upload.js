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
            body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
        });
    } catch (e) {
        console.error('텔레그램 전송 실패:', e);
    }
}

/**
 * 네이버 블로그 업로드 및 실제 발행 자동화
 */
async function uploadNaverBlog(title, bodyBlocks, images, slotName = "네이버 블로그", isDraft = false) {
    console.log(`[${slotName}] 네이버 블로그 자동화를 시작합니다...`);
    const userDataDir = path.resolve(__dirname, 'playwright_data');
    
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: { width: 1280, height: 1000 }
    });

    const page = context.pages()[0] || await context.newPage();

    try {
        // 1. 에디터 접속
        await page.goto('https://blog.naver.com/jincencho?Redirect=Write', { waitUntil: 'networkidle' });
        console.log(`[${slotName}] 에디터 페이지 접속 완료.`);

        // 2. 프레임 또는 직접 노출 여부 확인 및 에디터 로케이터 설정
        let editor;
        const mainFrame = page.frameLocator('#mainFrame');
        const hasIframe = await page.locator('#mainFrame').isVisible({ timeout: 5000 }).catch(() => false);
        
        if (hasIframe) {
            console.log(`[${slotName}] iframe(mainFrame) 감지됨. 프레임 모드로 진행.`);
            editor = mainFrame;
        } else {
            console.log(`[${slotName}] iframe 없음. 메인 페이지 모드로 진행.`);
            editor = page;
        }

        // 3. '이어 쓰기' 또는 가이드 팝업 제거 (가장 중요)
        console.log(`[${slotName}] 방해 요소(팝업) 제거 시도 중...`);
        try {
            // 여러 종류의 취소/닫기 버튼 시도
            const cancelSelectors = [
                '.se-popup-button-cancel', 
                'button:has-text("취소")', 
                'button[aria-label="닫기"]',
                '.se-help-guide-close'
            ];
            for (let sel of cancelSelectors) {
                const btn = editor.locator(sel).first();
                if (await btn.isVisible({ timeout: 2000 })) {
                    await btn.click();
                    console.log(`[${slotName}] 팝업 제거 성공: ${sel}`);
                    await page.waitForTimeout(1000);
                }
            }
        } catch (e) {
            console.log(`[${slotName}] 팝업 제거 과정 건너뜀 (이미 닫혀있거나 없음).`);
        }

        // 4. 제목 입력
        console.log(`[${slotName}] 제목 입력 시도...`);
        const titleSelector = '.se-documentTitle .se-placeholder, .se-documentTitle textarea';
        await editor.locator(titleSelector).first().click({ timeout: 10000 });
        await page.keyboard.type(title, { delay: 50 });
        await page.keyboard.press('Enter');
        console.log(`[${slotName}] 제목 입력 완료.`);

        // 5. 본문 입력
        console.log(`[${slotName}] 본문 작성 영역 진입 중...`);
        try {
            const bodySelectors = ['.se-main-container', '.se-content', '.se-component-content', '.se-placeholder'];
            let bodyFocused = false;
            for (let sel of bodySelectors) {
                const target = editor.locator(sel).first();
                if (await target.isVisible({ timeout: 2000 })) {
                    await target.click();
                    bodyFocused = true;
                    console.log(`[${slotName}] 본문 영역 클릭 성공: ${sel}`);
                    break;
                }
            }
            
            if (!bodyFocused) {
                console.log(`[${slotName}] 클릭 실패. Tab 키로 본문 진입 시도...`);
                await page.keyboard.press('Tab');
            }
        } catch (e) {
            console.log(`[${slotName}] 본문 진입 중 경미한 오류, 계속 진행합니다.`);
        }
        
        await page.waitForTimeout(1000);
        
        let tags = [];
        for (let block of bodyBlocks) {
            // 해시태그 추출 및 본문에서 제외
            if (block.startsWith('#')) {
                const foundTags = block.split(/\s+/).filter(t => t.startsWith('#'));
                tags = [...tags, ...foundTags];
                continue;
            }
            
            // 마크다운 기호(**, *) 제거하여 깔끔한 텍스트로 변환
            const cleanText = block.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^-\s+/, '').trim();
            if (cleanText.length === 0) continue;

            await page.keyboard.type(cleanText, { delay: 10 });
            await page.keyboard.press('Enter');
            await page.waitForTimeout(200);
        }

        // 6. 이미지 추가
        if (images && images.length > 0) {
            console.log(`[${slotName}] 이미지 첨부 시도 중...`);
            const [fileChooser] = await Promise.all([
                page.waitForEvent('filechooser', { timeout: 15000 }),
                editor.locator('button:has-text("사진"), .se-image-toolbar-button, button[aria-label="사진"]').first().click()
            ]);
            await fileChooser.setFiles(images);
            console.log(`[${slotName}] 이미지 업로드 대기 중 (10초)...`);
            await page.waitForTimeout(10000);
        }

        if (isDraft) {
            console.log(`[${slotName}] 임시저장 클릭...`);
            await editor.locator('button:has-text("저장")').first().click();
            await page.waitForTimeout(3000);
            console.log(`[${slotName}] ✅ 임시저장 성공.`);
        } else {
            console.log(`[${slotName}] 최종 발행 프로세스 시작...`);
            await editor.locator('.publish_btn__m9KHH').first().click();
            await page.waitForTimeout(2000);
            
            // 태그 입력
            const tagInput = editor.locator('#tag-input').first();
            if (await tagInput.isVisible({ timeout: 5000 })) {
                for (let tag of tags) {
                    const cleanTag = tag.replace('#', '');
                    await tagInput.fill(cleanTag);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(300);
                }
            }

            // 최종 발행 버튼
            await editor.locator('.confirm_btn__WEaBq').first().click();
            console.log(`[${slotName}] 발행 버튼 클릭 완료. 페이지 이동 확인 중...`);
            
            try {
                await page.waitForURL(/blog\.naver\.com\/jincencho\/\d+/, { timeout: 30000 });
                const finalUrl = page.url();
                console.log(`[${slotName}] ✅ 발행 성공! 링크: ${finalUrl}`);
                await sendTelegramMessage(`✅ [${slotName}] 발행 완료!\n제목: ${title}\n링크: ${finalUrl}`);
            } catch (e) {
                console.log(`[${slotName}] 발행 후 페이지 이동 확인은 실패했으나 전송은 완료되었을 수 있습니다.`);
                await sendTelegramMessage(`✅ [${slotName}] 발행 시도 완료 (제목: ${title})`);
            }
        }

    } catch (error) {
        console.error(`[${slotName}] 치명적 에러:`, error);
        const screenshotPath = path.resolve(__dirname, 'dashboard', 'error_blog.png');
        await page.screenshot({ path: screenshotPath });
        console.log(`[${slotName}] 에러 스크린샷 저장됨: ${screenshotPath}`);
        await sendTelegramMessage(`⚠️ [${slotName}] 업로드 실패: ${error.message}`);
    } finally {
        await page.waitForTimeout(3000);
        await context.close();
    }
}

module.exports = { uploadNaverBlog };
