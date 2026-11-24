const { chromium } = require('playwright');
const path = require('path');
const artifactDir = 'C:\\Users\\진센조\\.gemini\\antigravity\\brain\\3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
  await page.addInitScript(() => {
    sessionStorage.setItem('jcc_calc_auth', 'true');
  });
  await page.goto('file:///c:/jincenchoproject/JCC_혜택계산기.html', { waitUntil: 'load' });

  // Click 2번 구독 포함 계산기
  await page.getByText('2번 구독 포함 계산기').click();
  await page.waitForTimeout(500);

  // Click 백화점 (갤러리아 진주점) channel tab
  const deptTab = await page.getByText('백화점 (갤러리아 진주점)');
  if (await deptTab.count() > 0) {
    await deptTab.first().click();
    await page.waitForTimeout(500);
  }

  // Click 수기 직접입력
  await page.getByText('수기 직접입력').click();
  await page.waitForTimeout(300);

  // Fill gross
  const allInputs = await page.$$('input[type="text"]');
  for (const inp of allInputs) {
    const ph = await inp.getAttribute('placeholder');
    if (ph && (ph.includes('금액') || ph.includes('입력') || ph.includes('0원'))) {
      await inp.fill('26008000');
      await page.keyboard.press('Tab');
      break;
    }
  }
  await page.waitForTimeout(600);

  // Scroll to comparison section
  const section = await page.getByText('3대 시나리오 실시간 유불리 비교');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(artifactDir, 'screenshot_3scenarios_comparison.png'),
    fullPage: false
  });

  // Open POS Modal
  const posBtn = await page.getByText('캐셔 POS 결제 지시서 출력');
  await posBtn.scrollIntoViewIfNeeded();
  await posBtn.click();
  await page.waitForTimeout(600);

  // Switch to ⚡ 3.전부차감
  const fullBtnInPos = await page.getByRole('button', { name: '⚡ 3.전부차감' });
  if (await fullBtnInPos.count() > 0) {
    await fullBtnInPos.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({
    path: path.join(artifactDir, 'screenshot_pos_modal_full_deduct.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Screenshots captured successfully!');
})();
