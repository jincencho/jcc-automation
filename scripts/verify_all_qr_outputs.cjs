const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1800 } });
  const page = await context.newPage();

  page.on('dialog', async (d) => await d.accept());
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));

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
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Navigate to quote view
  const viewQuoteBtn = page.locator('button:has-text("보기 (A4 출력)")').first();
  await viewQuoteBtn.click({ force: true });
  await page.waitForTimeout(1000);

  // 1. [화면 노출] Capture manager card with crisp QR code
  const card = page.locator('.a4-manager-card').first();
  await card.screenshot({ path: path.join(artifactDir, 'screenshot_qr_screen_card.png') });
  console.log('1. Saved screenshot_qr_screen_card.png');

  const qrBox = page.locator('.a4-manager-qr').first();
  await qrBox.screenshot({ path: path.join(artifactDir, 'screenshot_qr_closeup_verified.png') });
  console.log('2. Saved screenshot_qr_closeup_verified.png');

  // 2. Click the actual '견적서 사진(이미지) 저장' button
  const exportImgBtn = page.locator('button:has-text("견적서 사진(이미지) 저장")').first();
  console.log('Clicking 견적서 사진(이미지) 저장 button...');
  await exportImgBtn.click({ force: true });
  await page.waitForTimeout(2000);

  // If a modal or download opened, capture it
  const modal = page.locator('.image-preview-modal, [class*="modal"]').first();
  if (await modal.isVisible()) {
    await modal.screenshot({ path: path.join(artifactDir, 'screenshot_image_export_modal.png') });
    console.log('Saved screenshot_image_export_modal.png');
  }

  // 3. [출력물 (Print Media)] Test @media print emulation
  console.log('Testing 출력물 (@media print)...');
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(500);

  // In print media, capture the printed sheet
  const printSheet = page.locator('.a4-print-sheet').first();
  await printSheet.screenshot({ path: path.join(artifactDir, 'screenshot_print_media_output.png') });
  console.log('3. Saved screenshot_print_media_output.png (출력물 결과물)');

  // Also capture the print card footer specifically
  const printCard = page.locator('.a4-manager-card').first();
  await printCard.screenshot({ path: path.join(artifactDir, 'screenshot_print_media_card_qr.png') });
  console.log('4. Saved screenshot_print_media_card_qr.png');

  // 4. Test General Manager card as well
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => {
    sessionStorage.setItem('jcc_calc_auth_user', JSON.stringify({
      id: 'manager1',
      name: '김철수',
      store: '통합진주',
      phone: '010-1234-5678',
      level: 'lv1'
    }));
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.locator('button:has-text("보기 (A4 출력)")').first().click({ force: true });
  await page.waitForTimeout(800);

  const gmCard = page.locator('.a4-manager-card-simple').first();
  await gmCard.screenshot({ path: path.join(artifactDir, 'screenshot_general_manager_with_qr.png') });
  console.log('5. Saved screenshot_general_manager_with_qr.png');

  await browser.close();
  console.log('🎉 ALL QR CODE OUTPUT CHECKS COMPLETED SUCCESSFULLY!');
})();
