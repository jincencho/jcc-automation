const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:\\Users\\진센조\\.gemini\\antigravity\\brain\\3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  console.log('Capturing final 58-day notice screenshots...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  page.on('dialog', async (d) => await d.accept());

  await page.addInitScript(() => {
    sessionStorage.setItem('jcc_calc_auth', 'true');
    sessionStorage.setItem('jcc_calc_auth_user', JSON.stringify({
      id: 'admin',
      name: '조준석',
      store: '통합진주',
      level: 'admin'
    }));
    sessionStorage.removeItem('jcc_calc_screen_locked');
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click 혜택 계산기
  await page.locator('text=혜택 계산기').first().click();
  await page.waitForTimeout(1000);

  // 1. Screenshot consult date area
  console.log('Capturing consult date area...');
  const dateInput = page.locator('#jcc_consult_date_input');
  await dateInput.waitFor({ timeout: 10000 });
  const dateWrapper = dateInput.locator('xpath=..');
  await dateWrapper.screenshot({
    path: path.join(artifactDir, 'screenshot_rereview_date_input.png')
  });
  console.log('Saved screenshot_rereview_date_input.png');

  // 2. Go to Quotation 1 (비교 결과 보기)
  console.log('Navigating to Quotation 1...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('비교 결과 보기'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // 3. Screenshot the notice banner in Quotation 1
  const noticeElem = page.locator('.a4-sub-rereview-notice').first();
  await noticeElem.waitFor({ timeout: 10000 });
  await noticeElem.screenshot({
    path: path.join(artifactDir, 'screenshot_rereview_notice_box.png')
  });
  console.log('Saved screenshot_rereview_notice_box.png');

  // 4. Screenshot the full Quotation 1 page
  const q1Paper = page.locator('.a4-paper').first();
  await q1Paper.screenshot({
    path: path.join(artifactDir, 'screenshot_quote1_with_rereview.png')
  });
  console.log('Saved screenshot_quote1_with_rereview.png');

  // 5. Back to input and test Quotation 2
  console.log('Navigating back to test Quotation 2...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('조건 수정하기'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1000);

  // Switch to 2번 구독 포함 계산기
  const mixedTabBtn = page.locator('button:has-text("2번 구독 포함 계산기")').first();
  await mixedTabBtn.click();
  await page.waitForTimeout(1000);

  // Click 스마트 견적서 보기
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('스마트 견적서 보기'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // Screenshot Quotation 2 Page 2
  const q2Page2 = page.locator('.a4-paper').nth(1);
  if (await q2Page2.count() > 0) {
    await q2Page2.screenshot({
      path: path.join(artifactDir, 'screenshot_quote2_with_rereview.png')
    });
    console.log('Saved screenshot_quote2_with_rereview.png');
  }

  await browser.close();
  console.log('All 58-day verification captures completed successfully!');
})();
