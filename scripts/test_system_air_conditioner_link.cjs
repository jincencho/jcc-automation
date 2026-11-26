const { chromium } = require('playwright');
const path = require('path');

const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });

  page.on('dialog', async (d) => await d.accept());

  await page.addInitScript(() => {
    try {
      indexedDB.deleteDatabase('jcc_ota_engine_v1');
      localStorage.removeItem('jcc_ota_bundle_backup_v1');
    } catch (e) {}
    sessionStorage.setItem('jcc_calc_auth_user', JSON.stringify({
      id: 'admin',
      name: '조준석',
      store: '통합진주',
      level: 'admin'
    }));
    sessionStorage.removeItem('jcc_calc_screen_locked');
  });

  const fileUrl = 'file:///' + path.resolve('JCC_혜택계산기.html').replace(/\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // 1. Select '시스템에어컨'
  const categorySelect = page.locator('select[title*="무상수리 서비스 품목 선택"]').first();
  await categorySelect.selectOption('시스템에어컨');
  await page.waitForTimeout(500);

  const qrBtn = page.locator('button:has-text("시스템에어컨 QR")').first();
  console.log('[시스템에어컨 QR] button visible:', await qrBtn.isVisible());

  // Click QR button
  await qrBtn.click();
  await page.waitForTimeout(500);

  const modal = page.locator('div:has-text("시스템에어컨 케어서비스 영상 안내")').locator('..').locator('.calc-modal-dialog').first();
  const targetModal = (await modal.count() > 0) ? modal : page.locator('.calc-modal-dialog').last();
  const modalText = await targetModal.innerText();
  console.log('Modal text:', modalText.replace(/\n+/g, ' '));
  console.log('Modal text contains yPngVJV_4MA:', modalText.includes('yPngVJV_4MA'));
  console.log('Modal text contains YouTube 영상 열기:', modalText.includes('YouTube 영상 열기'));

  const artifactPath = path.resolve(artifactDir, 'screenshot_system_air_conditioner_youtube_verified.png');
  await targetModal.screenshot({ path: artifactPath });
  console.log('Screenshot saved to:', artifactPath);

  await browser.close();
  console.log('Test completed!');
})();
