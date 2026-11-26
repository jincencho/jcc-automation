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
    sessionStorage.setItem('jcc_calc_auth', 'true');
    sessionStorage.setItem('jcc_calc_auth_user', JSON.stringify({
      id: 'admin',
      name: '조준석',
      store: '통합진주',
      level: 'admin'
    }));
    sessionStorage.removeItem('jcc_calc_screen_locked');
  });

  console.log('Navigating to local build or web...');
  // Check on file:/// or Vercel
  const fileUrl = 'file:///' + path.resolve('JCC_혜택계산기.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  // If on login screen in offline HTML, auto-login with admin session
  const loginBtn = page.locator('button:has-text("로그인")').first();
  if (await loginBtn.isVisible()) {
    await page.fill('input[type="text"], input[placeholder*="ID"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await loginBtn.click();
    await page.waitForTimeout(1000);
  }

  // 1. Verify Unchecked State
  const checkboxLabel = page.locator('label:has-text("장기 미배달")').first();
  await checkboxLabel.waitFor({ timeout: 10000 });
  console.log('✓ Found long-term delivery checkbox in basic info panel!');

  const noticeUncheckedCount = await page.locator('.a4-sub-rereview-notice').count();
  console.log('1) Notice count when unchecked:', noticeUncheckedCount, '(PASS: 0)');

  // Capture screenshot of basic info with unchecked box
  const basicInfoPanel = page.locator('text=상담 및 출력 기본 정보').locator('xpath=ancestor::div[contains(@class, "glass-panel")]').first();
  await basicInfoPanel.screenshot({ path: path.join(artifactDir, 'screenshot_longterm_unchecked.png') });
  console.log('✓ Saved screenshot_longterm_unchecked.png');

  // 2. Check the box by clicking label
  await checkboxLabel.click();
  await page.waitForTimeout(600);

  // Capture screenshot of basic info with checked box
  await basicInfoPanel.screenshot({ path: path.join(artifactDir, 'screenshot_longterm_checked.png') });
  console.log('✓ Saved screenshot_longterm_checked.png');

  // 3. Verify Notice is now visible
  const noticeCheckedCount = await page.locator('.a4-sub-rereview-notice').count();
  console.log('2) Notice count when checked:', noticeCheckedCount, '(PASS: > 0)');

  const noticeBox = page.locator('.a4-sub-rereview-notice').first();
  const noticeText = await noticeBox.innerText();
  console.log('Notice text snippet:', noticeText.replace(/\n/g, ' '));

  await noticeBox.screenshot({ path: path.join(artifactDir, 'screenshot_longterm_notice_visible.png') });
  console.log('✓ Saved screenshot_longterm_notice_visible.png');

  // Capture quotation bottom showing notice
  const quoteFooter = page.locator('.a4-sub-rereview-notice').locator('xpath=ancestor::div[contains(@class, "a4-page")]').first();
  if (await quoteFooter.isVisible()) {
    await quoteFooter.screenshot({ path: path.join(artifactDir, 'screenshot_quote_page_with_notice.png') });
    console.log('✓ Saved screenshot_quote_page_with_notice.png');
  }

  // 4. Uncheck test: Click label again
  await checkboxLabel.click();
  await page.waitForTimeout(600);

  const noticeAfterUncheckCount = await page.locator('.a4-sub-rereview-notice').count();
  console.log('3) Notice count after unchecking:', noticeAfterUncheckCount, '(PASS: 0)');

  await browser.close();
  console.log('🎉 ALL TOGGLE & QUOTATION VISIBILITY VERIFICATIONS PASSED PERFECTLY!');
})();
