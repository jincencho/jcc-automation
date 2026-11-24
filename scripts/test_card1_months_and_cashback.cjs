const { chromium } = require('playwright');
const path = require('path');

const artifactDir = 'C:\\Users\\진센조\\.gemini\\antigravity\\brain\\3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });

  await page.addInitScript(() => {
    sessionStorage.setItem('jcc_calc_auth', 'true');
  });

  console.log('Navigating to calculator...');
  await page.goto('file:///c:/jincenchoproject/JCC_혜택계산기.html', { waitUntil: 'load' });
  await page.waitForTimeout(800);

  // 1. Check 1번 구독 비교 계산기 (default or click tab)
  const calc1Tab = await page.getByText('1번 구독 비교 계산기');
  if (await calc1Tab.count() > 0) {
    await calc1Tab.first().click();
    await page.waitForTimeout(500);
  }

  // Scroll to 제휴카드 할인 상세 설정
  const cardSection = await page.getByText('제휴카드 할인 상세 설정');
  if (await cardSection.count() > 0) {
    await cardSection.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_card1_contract_months.png') });
    console.log('Saved screenshot_card1_contract_months.png');
  }

  // Scroll to 삼성AI구독 혜택 (캐시백)
  const cashbackSection = await page.getByText('삼성AI구독 혜택 (캐시백)');
  if (await cashbackSection.count() > 0) {
    await cashbackSection.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactDir, 'screenshot_sub_cashback_highlight.png') });
    console.log('Saved screenshot_sub_cashback_highlight.png');
  }

  // Now test typing into the contract months input (e.g. 36)
  const monthsInput = await page.locator('input[title*="약정개월수"]').first();
  if (await monthsInput.count() > 0) {
    await monthsInput.fill('36');
    await monthsInput.dispatchEvent('input');
    await monthsInput.dispatchEvent('change');
    await page.waitForTimeout(400);
    console.log('Filled 36 into monthsInput');
  }

  // Also test clicking +20만 in cashback
  const plus20Btn = await page.getByRole('button', { name: '+20만' }).first();
  if (await plus20Btn.count() > 0) {
    await plus20Btn.click();
    await page.waitForTimeout(400);
    console.log('Clicked +20만');
  }

  await cardSection.first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_card1_and_cashback_active.png') });
  console.log('Saved screenshot_card1_and_cashback_active.png');

  await browser.close();
})();
