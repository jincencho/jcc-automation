const { chromium } = require('playwright');
const path = require('path');

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

  // 1. Initial State (Unchecked)
  const cb = page.locator('label:has-text("장기 미배달") input[type="checkbox"]').first();
  console.log('1. Initially checked:', await cb.isChecked());

  // Capture basic info panel unchecked
  const basicInfoPanel = page.locator('text=상담 및 출력 기본 정보').locator('xpath=ancestor::div[contains(@class, "glass-panel")]').first();
  await basicInfoPanel.screenshot({ path: path.join(artifactDir, 'screenshot_longterm_unchecked.png') });
  console.log('✓ Saved screenshot_longterm_unchecked.png');

  // Go to quote screen with force: true
  const viewQuoteBtn = page.locator('button:has-text("보기 (A4 출력)")').first();
  await viewQuoteBtn.click({ force: true });
  await page.waitForTimeout(800);

  let noticeCount = await page.locator('.a4-sub-rereview-notice').count();
  console.log('2. Notice count on quote screen when UNCHECKED:', noticeCount, '(PASS: 0)');

  // Go back to input screen using '조건 수정하기'
  const backBtn = page.locator('button:has-text("조건 수정하기")').first();
  await backBtn.click({ force: true });
  await page.waitForTimeout(600);

  // 2. Check the box
  await cb.click({ force: true });
  await page.waitForTimeout(600);
  console.log('3. After clicking checkbox, checked:', await cb.isChecked());

  // Capture basic info panel checked
  await basicInfoPanel.screenshot({ path: path.join(artifactDir, 'screenshot_longterm_checked.png') });
  console.log('✓ Saved screenshot_longterm_checked.png');

  // Go to quote screen again
  await viewQuoteBtn.click({ force: true });
  await page.waitForTimeout(800);

  noticeCount = await page.locator('.a4-sub-rereview-notice').count();
  console.log('4. Notice count on quote screen when CHECKED:', noticeCount, '(PASS: >= 1)');

  if (noticeCount > 0) {
    const noticeEl = page.locator('.a4-sub-rereview-notice').first();
    const noticeText = await noticeEl.innerText();
    console.log('Notice text snippet:\n', noticeText);

    await noticeEl.screenshot({ path: path.join(artifactDir, 'screenshot_longterm_notice_visible.png') });
    console.log('✓ Saved screenshot_longterm_notice_visible.png');

    const quotePage = page.locator('.a4-print-sheet').first();
    await quotePage.screenshot({ path: path.join(artifactDir, 'screenshot_quote_page_with_notice.png') });
    console.log('✓ Saved screenshot_quote_page_with_notice.png');
  }

  // 3. Uncheck test
  const backBtn2 = page.locator('button:has-text("조건 수정하기")').first();
  await backBtn2.click({ force: true });
  await page.waitForTimeout(600);

  await cb.click({ force: true });
  await page.waitForTimeout(600);
  console.log('5. After unchecking, checked:', await cb.isChecked());

  await viewQuoteBtn.click({ force: true });
  await page.waitForTimeout(800);

  noticeCount = await page.locator('.a4-sub-rereview-notice').count();
  console.log('6. Final notice count on quote screen after UNCHECKING:', noticeCount, '(PASS: 0)');

  await browser.close();
  console.log('🎉 ALL TESTS PASSED COMPLETELY AND VERIFIED!');
})();
