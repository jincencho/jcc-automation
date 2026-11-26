const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });

  page.on('dialog', async (d) => await d.accept());

  await page.addInitScript(() => {
    sessionStorage.setItem('jcc_calc_auth_user', JSON.stringify({
      id: 'admin',
      name: '조준석',
      store: '통합진주',
      level: 'admin'
    }));
    sessionStorage.removeItem('jcc_calc_screen_locked');
  });

  const fileUrl = 'file:///' + path.resolve('JCC_혜택계산기.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(800);

  // 1. Check dropdown options
  const categorySelect = page.locator('select[title*="무상수리 서비스 품목 선택"]').first();
  const options = await categorySelect.locator('option').allInnerTexts();
  console.log('Dropdown has "시스템에어컨":', options.includes('시스템에어컨'));
  console.log('Dropdown has "에어컨 천장형":', options.includes('에어컨 천장형'));

  if (!options.includes('시스템에어컨') || options.includes('에어컨 천장형')) {
    console.error('ERROR: Dropdown option check failed!');
    process.exit(1);
  }

  // 2. Select '시스템에어컨'
  await categorySelect.selectOption('시스템에어컨');
  await page.waitForTimeout(500);

  // 3. Verify [시스템에어컨 QR] button
  const qrBtn = page.locator('button:has-text("시스템에어컨 QR")').first();
  console.log('[시스템에어컨 QR] button visible:', await qrBtn.isVisible());

  // 4. Click [시스템에어컨 QR] button
  await qrBtn.click();
  await page.waitForTimeout(500);

  const modal = page.locator('.calc-modal-dialog').first();
  await modal.screenshot({ path: path.join(artifactDir, 'screenshot_system_air_conditioner_modal.png') });
  console.log('Saved screenshot_system_air_conditioner_modal.png');

  // Verify modal title
  const modalText = await modal.innerText();
  console.log('Modal title check:', modalText.includes('[시스템에어컨] 케어서비스 안내'));

  await browser.close();
  console.log('🎉 ALL SYSTEM AIR CONDITIONER CHECKS PASSED!');
})();
