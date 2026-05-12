const { chromium } = require('playwright');
const path = require('path');

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
 * 네이버 블로그 업로드 및 실제 발행 자동화 (22시간 전 다른 컴퓨터에서 성공했던 원본 로직)
 */
async function uploadNaverBlog(title, bodyBlocks, images, slotName = "네이버 블로그", isDraft = false) {
    console.log(`[${slotName}] 네이버 블로그 자동화를 시작합니다...`);
    const userDataDir = path.resolve(__dirname, '..', 'playwright_data');
    
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: { width: 1280, height: 1000 }
    });

    const page = context.pages()[0] || await context.newPage();

    try {
        await page.goto('https://blog.naver.com/jincencho?Redirect=Write', { waitUntil: 'networkidle' });
        console.log(`[${slotName}] 에디터 페이지 접속 완료.`);

        let editor;
        const mainFrame = page.frameLocator('#mainFrame');
        const hasIframe = await page.locator('#mainFrame').isVisible({ timeout: 5000 }).catch(() => false);
        
        if (hasIframe) {
            editor = mainFrame;
        } else {
            editor = page;
        }

        console.log(`[${slotName}] 방해 요소(팝업) 제거 시도 중...`);
        try {
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
        } catch (e) {}

        console.log(`[${slotName}] 제목 입력 시도...`);
        const titleSelector = '.se-documentTitle .se-placeholder, .se-documentTitle textarea';
        await editor.locator(titleSelector).first().click({ timeout: 10000 });
        await page.keyboard.type(title, { delay: 50 });
        await page.keyboard.press('Enter');

        console.log(`[${slotName}] 본문 작성 영역 진입 중...`);
        try {
            const bodySelectors = ['.se-main-container', '.se-content', '.se-component-content', '.se-placeholder'];
            let bodyFocused = false;
            for (let sel of bodySelectors) {
                const target = editor.locator(sel).first();
                if (await target.isVisible({ timeout: 2000 })) {
                    await target.click();
                    bodyFocused = true;
                    break;
                }
            }
            if (!bodyFocused) await page.keyboard.press('Tab');
        } catch (e) {}
        
        await page.waitForTimeout(1000);
        
        let tags = [];
        for (let block of bodyBlocks) {
            if (block.startsWith('#')) {
                const foundTags = block.split(/\s+/).filter(t => t.startsWith('#'));
                tags = [...tags, ...foundTags];
                continue;
            }
            const cleanText = block.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^-\s+/, '').trim();
            if (cleanText.length === 0) continue;
            await page.keyboard.type(cleanText, { delay: 10 });
            await page.keyboard.press('Enter');
            await page.waitForTimeout(200);
        }

        if (images && images.length > 0) {
            console.log(`[${slotName}] 이미지 첨부 시도 중...`);
            const [fileChooser] = await Promise.all([
                page.waitForEvent('filechooser', { timeout: 15000 }),
                editor.locator('button:has-text("사진"), .se-image-toolbar-button, button[aria-label="사진"]').first().click()
            ]);
            await fileChooser.setFiles(images);
            await page.waitForTimeout(10000);
        }

        if (isDraft) {
            await editor.locator('button:has-text("저장")').first().click();
            await page.waitForTimeout(3000);
            console.log(`[${slotName}] ✅ 임시저장 성공.`);
        } else {
            await editor.locator('.publish_btn__m9KHH').first().click();
            await page.waitForTimeout(2000);
            
            const tagInput = editor.locator('#tag-input').first();
            if (await tagInput.isVisible({ timeout: 5000 })) {
                for (let tag of tags) {
                    const cleanTag = tag.replace('#', '');
                    await tagInput.fill(cleanTag);
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(300);
                }
            }

            await editor.locator('.confirm_btn__WEaBq').first().click();
            console.log(`[${slotName}] 발행 버튼 클릭 완료.`);
            
            try {
                await page.waitForURL(/blog\.naver\.com\/jincencho\/\d+/, { timeout: 30000 });
                const finalUrl = page.url();
                await sendTelegramMessage(`✅ [${slotName}] 발행 완료!\n제목: ${title}\n링크: ${finalUrl}`);
            } catch (e) {
                await sendTelegramMessage(`✅ [${slotName}] 발행 시도 완료 (제목: ${title})`);
            }
        }

    } catch (error) {
        console.error(`[${slotName}] 치명적 에러:`, error);
        const screenshotPath = path.resolve(__dirname, '..', 'dashboard', 'error_blog.png');
        await page.screenshot({ path: screenshotPath });
        await sendTelegramMessage(`⚠️ [${slotName}] 업로드 실패: ${error.message}`);
    } finally {
        await page.waitForTimeout(3000);
        await context.close();
    }
}

module.exports = { uploadNaverBlog };
