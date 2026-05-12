const { chromium } = require('playwright');
const path = require('path');

class SNSPublisher {
    constructor() {
        this.userDataDir = path.resolve(__dirname, '../playwright_data');
    }

    async publishToInstagram(target, caption, images = []) {
        console.log(`📸 [SNSPublisher] Publishing to Instagram for: ${target.name}`);
        const context = await chromium.launchPersistentContext(this.userDataDir, {
            headless: false,
            viewport: { width: 1000, height: 1000 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, Intel ImageEngine/1.0, Chrome/120.0.0.0 Safari/537.36'
        });

        const page = await context.newPage();
        try {
            await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle' });
            await page.waitForTimeout(7000);

            // 0. Clear Popups
            const popups = ['button:has-text("나중에 하기")', 'button:has-text("Not Now")'];
            for (const sel of popups) {
                if (await page.locator(sel).first().isVisible({ timeout: 2000 })) {
                    await page.locator(sel).first().click();
                }
            }

            // 1. Click "Create"
            console.log('[SNSPublisher] Opening Create Modal...');
            await page.locator('div[role="button"]:has(svg[aria-label*="게시물"]), div[role="button"]:has(svg[aria-label*="post"])').first().click();
            await page.waitForTimeout(3000);

            // 2. Direct File Injection (Most Reliable)
            console.log('[SNSPublisher] Injecting files directly...');
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(images);
            await page.waitForTimeout(7000);

            // 3. Navigate "Next"
            for (let i = 0; i < 2; i++) {
                console.log(`[SNSPublisher] Clicking Next (${i+1}/2)...`);
                await page.locator('div[role="button"]:has-text("다음"), div[role="button"]:has-text("Next")').first().click();
                await page.waitForTimeout(3000);
            }

            // 4. Caption
            console.log('[SNSPublisher] Writing caption...');
            await page.locator('div[aria-label="문구 입력..."], div[aria-label="Write a caption..."]').first().fill(caption);
            await page.waitForTimeout(2000);

            // 5. Final Share
            console.log('[SNSPublisher] Sharing...');
            await page.locator('div[role="button"]:has-text("공유하기"), div[role="button"]:has-text("Share")').first().click();
            await page.waitForTimeout(20000);

            console.log(`✅ Success! Instagram post for ${target.name} is complete.`);
            return true;
        } catch (error) {
            console.error('❌ Instagram publish failed:', error);
            await page.screenshot({ path: `error_insta_${target.id}_final.png` });
            return false;
        } finally {
            await context.close();
        }
    }
}

module.exports = SNSPublisher;
