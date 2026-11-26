const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

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
  await page.waitForTimeout(1000);

  const viewQuoteBtn = page.locator('button:has-text("보기 (A4 출력)")').first();
  await viewQuoteBtn.click({ force: true });
  await page.waitForTimeout(1000);

  // 1. Capture the manager QR element directly
  const qrEl = page.locator('.a4-manager-qr').first();
  await qrEl.screenshot({ path: path.join(artifactDir, 'screenshot_qr_closeup.png') });
  console.log('Saved screenshot_qr_closeup.png');

  // 2. Also test html2canvas capture of the QR code (how it appears in 사진저장 and PDF)
  const capturedQrDataUrl = await page.evaluate(async () => {
    const node = document.querySelector('.a4-print-sheet');
    const canvas = await html2canvas(node, { scale: 2 });
    return canvas.toDataURL('image/png');
  });

  fs.writeFileSync(path.join(artifactDir, 'screenshot_full_html2canvas_capture.png'), Buffer.from(capturedQrDataUrl.split(',')[1], 'base64'));
  console.log('Saved screenshot_full_html2canvas_capture.png');

  await browser.close();
})();
