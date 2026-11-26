const { chromium } = require('playwright');
const path = require('path');

const artifactDir = 'C:\\Users\\진센조\\.gemini\\antigravity\\brain\\3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  console.log('Capturing zoomed mobile-friendly screenshots...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 2 // High-DPI 2x retina
  });
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
  await page.locator('text=혜택 계산기').first().click();
  await page.waitForTimeout(1000);

  // 1. Expand Affiliate Section
  const affiliateHeader = page.locator('text=제휴 연계 추가 혜택 (상조 제휴 · 통신사 IPTV)');
  await affiliateHeader.scrollIntoViewIfNeeded();
  await affiliateHeader.click();
  await page.waitForTimeout(400);

  // Enable both
  await page.locator('label:has-text("상조 제휴 혜택") input[type="checkbox"]').check();
  await page.waitForTimeout(200);
  await page.locator('label:has-text("통신사 IPTV") input[type="checkbox"]').check();
  await page.waitForTimeout(200);

  // Screenshot Zoomed Manager Panel
  const managerPanel = page.locator('div:has-text("제휴 연계 추가 혜택 (상조 제휴 · 통신사 IPTV)")').first();
  await managerPanel.screenshot({
    path: path.join(artifactDir, 'screenshot_zoom_manager_panel.png')
  });
  console.log('Saved screenshot_zoom_manager_panel.png');

  // Go to Quotation 1
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('비교 결과 보기'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // Zoomed Option B Card
  const optionBCard = page.locator('.plan-sub').first();
  if (await optionBCard.count() > 0) {
    await optionBCard.screenshot({
      path: path.join(artifactDir, 'screenshot_zoom_quote1_optionb.png')
    });
    console.log('Saved screenshot_zoom_quote1_optionb.png');
  }

  // Zoomed Quotation 1 Notes
  const notesBox = page.locator('.a4-info-box').first();
  if (await notesBox.count() > 0) {
    await notesBox.screenshot({
      path: path.join(artifactDir, 'screenshot_zoom_quote1_notes.png')
    });
    console.log('Saved screenshot_zoom_quote1_notes.png');
  }

  // Zoomed Full Comparison Box
  const comparisonBox = page.locator('.a4-paper').first();
  if (await comparisonBox.count() > 0) {
    await comparisonBox.screenshot({
      path: path.join(artifactDir, 'screenshot_zoom_quote1_paper.png')
    });
    console.log('Saved screenshot_zoom_quote1_paper.png');
  }

  // Now test Quotation 2 Section 3
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('조건 수정하기'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(800);

  const mixedTabBtn = page.locator('button:has-text("2번 구독 포함 계산기")').first();
  await mixedTabBtn.click();
  await page.waitForTimeout(800);

  // Expand and enable affiliate in mixed mode
  const affHeaderMixed = page.locator('text=제휴 연계 추가 혜택 (상조 제휴 · 통신사 IPTV)');
  await affHeaderMixed.scrollIntoViewIfNeeded();
  await affHeaderMixed.click();
  await page.waitForTimeout(300);
  await page.locator('label:has-text("상조 제휴 혜택") input[type="checkbox"]').check();
  await page.waitForTimeout(200);
  await page.locator('label:has-text("통신사 IPTV") input[type="checkbox"]').check();
  await page.waitForTimeout(200);

  // View Quotation 2
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('스마트 견적서 보기'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // Zoomed Page 2
  const page2Paper = page.locator('.a4-paper').nth(1);
  if (await page2Paper.count() > 0) {
    await page2Paper.screenshot({
      path: path.join(artifactDir, 'screenshot_zoom_quote2_page2.png')
    });
    console.log('Saved screenshot_zoom_quote2_page2.png');
  }

  await browser.close();
  console.log('All zoomed retina screenshots captured!');
})();
