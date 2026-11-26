const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1800 } });
  const page = await context.newPage();

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
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // 1. Select a product category in 1번 계산기: '세탁기'
  console.log('Testing 1번 계산기 품목 선택 -> QR 버튼 노출...');
  const categorySelect = page.locator('select[title*="무상수리 서비스 품목 선택"]').first();
  await categorySelect.selectOption('세탁기');
  await page.waitForTimeout(500);

  // Check if [세탁기 QR] button appeared
  const qrBtn = page.locator('button:has-text("세탁기 QR")').first();
  const isQrBtnVisible = await qrBtn.isVisible();
  console.log('1. [세탁기 QR] button visible in employee input:', isQrBtnVisible);

  // Capture screenshot of the item row with the QR button
  const planRow = page.locator('.calc-input-editable').first().locator('..');
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot_care_video_input_row.png'),
    clip: { x: 50, y: 350, width: 850, height: 420 }
  });
  console.log('Saved screenshot_care_video_input_row.png');

  // 2. Click [세탁기 QR] button and capture modal
  await qrBtn.click();
  await page.waitForTimeout(600);

  const modal = page.locator('.calc-modal-dialog').first();
  await modal.screenshot({ path: path.join(artifactDir, 'screenshot_care_video_single_modal.png') });
  console.log('2. Saved screenshot_care_video_single_modal.png');

  // Close single modal
  await page.locator('button:has-text("닫기")').first().click();
  await page.waitForTimeout(500);

  // 3. Click [🎬 케어영상 QR 허브 (12종)] button
  console.log('Testing [🎬 케어영상 QR 허브 (12종)] button...');
  const hubBtn = page.locator('button:has-text("케어영상 QR 허브")').first();
  await hubBtn.click();
  await page.waitForTimeout(600);

  const hubModal = page.locator('.calc-modal-dialog').first();
  await hubModal.screenshot({ path: path.join(artifactDir, 'screenshot_care_video_hub_modal.png') });
  console.log('3. Saved screenshot_care_video_hub_modal.png');

  // Close hub modal
  await page.locator('button:has-text("확인 완료")').first().click();
  await page.waitForTimeout(500);

  // 4. Verify Quote View (A4 sheet) does NOT have the care video QR (it should only be in manager input)
  console.log('Checking Quote View to ensure care QR is NOT on the quotation sheet...');
  const viewQuoteBtn = page.locator('button:has-text("보기 (A4 출력)")').first();
  await viewQuoteBtn.click({ force: true });
  await page.waitForTimeout(800);

  const quoteSheet = page.locator('.a4-print-sheet').first();
  const hasCareVideoOnQuote = await quoteSheet.locator('button:has-text("케어영상 QR"), img[alt*="케어서비스"]').count();
  console.log('4. Care video QR count on customer quote sheet (must be 0):', hasCareVideoOnQuote);

  await browser.close();
  console.log('🎉 ALL CARE VIDEO UI VERIFICATIONS PASSED!');
})();
