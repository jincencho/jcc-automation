const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  await page.addInitScript(() => {
    sessionStorage.setItem('jcc_calc_auth', 'true');
  });
  await page.goto('file:///c:/jincenchoproject/JCC_혜택계산기.html', { waitUntil: 'load' });
  await page.waitForTimeout(800);

  const calc2Tab = await page.getByText('2번 구독 포함 계산기');
  if (await calc2Tab.count() > 0) {
    await calc2Tab.first().click();
    await page.waitForTimeout(500);
  }

  const deptTab = await page.getByText('백화점 (갤러리아 진주점)');
  if (await deptTab.count() > 0) {
    await deptTab.first().click();
    await page.waitForTimeout(500);
  }

  const manualBtn = await page.getByText('수기 직접입력');
  if (await manualBtn.count() > 0) {
    await manualBtn.first().click();
    await page.waitForTimeout(400);
  }

  const allInputs = await page.$$('input[type="text"]');
  for (const inp of allInputs) {
    const ph = await inp.getAttribute('placeholder');
    if (ph && (ph.includes('금액') || ph.includes('입력') || ph.includes('0원'))) {
      await inp.fill('23500000');
      await inp.dispatchEvent('input');
      await inp.dispatchEvent('change');
    }
  }
  await page.waitForTimeout(800);

  const scenarioSection = page.locator('text=3대 시나리오 실시간 유불리 비교').first();
  await scenarioSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_2350m_fixed.png') });
  console.log('Saved screenshot_2350m_fixed.png');
  await browser.close();
})();
