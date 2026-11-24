const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 1800 });
  await page.addInitScript(() => {
    sessionStorage.setItem('jcc_calc_auth', 'true');
  });
  await page.goto('file:///c:/jincenchoproject/JCC_혜택계산기.html');
  await page.waitForTimeout(1000);
  
  // click 2번 구독 포함 계산기
  const tab2 = page.locator('text=2번 구독 포함 계산기').first();
  await tab2.click();
  await page.waitForTimeout(500);

  // click 수기 직접입력
  const manualTab = page.locator('text=수기 직접입력').first();
  await manualTab.click();
  await page.waitForTimeout(500);

  const input = page.locator('input[placeholder*="승인"]').first();
  await input.fill('23500000');
  await page.waitForTimeout(1000);

  // Scroll to scenario cards
  const scenarioSection = page.locator('text=3대 시나리오 실시간 유불리 비교').first();
  await scenarioSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_2350m_scenario.png') });
  console.log('Saved screenshot_2350m_scenario.png');

  // Let's also read the text content of the cards and comparison
  const text = await page.locator('text=3대 시나리오 실시간 유불리 비교').locator('xpath=ancestor::div[contains(@style, "border")]').first().innerText();
  console.log('Scenario text:\n', text);

  // Also print the 1인 카드 분할 매칭 banner
  const splitBanner = await page.locator('text=1인 카드 2단계 최적 분할').locator('xpath=ancestor::div[contains(@style, "border")]').first().innerText().catch(() => 'no banner');
  console.log('Split banner:\n', splitBanner);

  await browser.close();
})();
