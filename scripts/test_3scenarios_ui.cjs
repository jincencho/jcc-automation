const { chromium } = require('playwright');
const path = require('path');

const artifactDir = 'C:\\Users\\진센조\\.gemini\\antigravity\\brain\\3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });

  // Pre-authenticate
  await page.addInitScript(() => {
    sessionStorage.setItem('jcc_calc_auth', 'true');
  });

  console.log('Navigating to file:///c:/jincenchoproject/JCC_혜택계산기.html ...');
  await page.goto('file:///c:/jincenchoproject/JCC_혜택계산기.html', { waitUntil: 'load' });
  await page.waitForTimeout(800);

  // Switch to 2번 구독 포함 계산기 if needed or scroll to channel selector
  const calc2Tab = await page.getByText('2번 구독 포함 계산기');
  if (await calc2Tab.count() > 0) {
    console.log('Clicking 2번 구독 포함 계산기...');
    await calc2Tab.first().click();
    await page.waitForTimeout(600);
  }

  // Click 백화점 (갤러리아 진주점) channel tab
  const deptTab = await page.getByText('백화점 (갤러리아 진주점)');
  if (await deptTab.count() > 0) {
    console.log('Clicking 백화점 tab...');
    await deptTab.first().click();
    await page.waitForTimeout(500);
  }

  // Click 수기 직접입력
  const manualBtn = await page.getByText('수기 직접입력');
  if (await manualBtn.count() > 0) {
    console.log('Clicking 수기 직접입력...');
    await manualBtn.first().click();
    await page.waitForTimeout(400);
  }

  // Set gross input to 26008000
  console.log('Setting gross to 26,008,000 ...');
  const deptInput = await page.$('input[placeholder*="정산할 가전"]');
  if (deptInput) {
    console.log('Found deptInput, filling 23500000...');
    await deptInput.fill('23500000');
    await deptInput.dispatchEvent('input');
    await deptInput.dispatchEvent('change');
  } else {
    console.log('deptInput not found, checking all inputs...');
    const allInputs = await page.$$('input[type="text"]');
    for (const inp of allInputs) {
      const ph = await inp.getAttribute('placeholder');
      if (ph && ph.includes('정산할 가전')) {
        await inp.fill('23500000');
        await inp.dispatchEvent('input');
        await inp.dispatchEvent('change');
        break;
      }
    }
  }
  await page.waitForTimeout(600);

  // Scroll to 3-scenario section
  const compareTitle = await page.getByText('3대 시나리오 실시간 유불리 비교');
  if (await compareTitle.count() > 0) {
    await compareTitle.first().scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 150));
    await page.waitForTimeout(500);
  }

  // Screenshot 1: 3-scenario side-by-side cards
  console.log('Taking screenshot of 3 scenarios side-by-side...');
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot_3scenarios_comparison.png'),
    fullPage: false
  });

  // Click Card 3: 전부 차감 플랜
  console.log('Clicking Card 3: 전부 차감 플랜...');
  const card3 = await page.getByText('⚡ 3. 전부 차감 플랜');
  if (await card3.count() > 0) {
    await card3.first().click();
    await page.waitForTimeout(600);
  }

  // Screenshot 2: 전부 차감 플랜 선택 후 화면
  console.log('Taking screenshot with 전부 차감 selected...');
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot_3scenarios_full_selected.png'),
    fullPage: false
  });

  // Open POS Modal
  console.log('Clicking POS 지시서 button...');
  const posBtn = await page.getByText('캐셔 POS 결제 지시서 출력');
  if (await posBtn.count() > 0) {
    await posBtn.first().scrollIntoViewIfNeeded();
    await posBtn.first().click();
    await page.waitForTimeout(800);
  }

  // Screenshot 3: POS Modal for 전부 차감 (Full Deduct)
  console.log('Taking screenshot of POS Modal for 전부 차감...');
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot_pos_modal_full_deduct.png'),
    fullPage: false
  });

  // Switch to 부분 차감 inside POS Modal
  console.log('Switching to 부분 차감 inside POS Modal...');
  const partBtnInPos = await page.getByRole('button', { name: '🛡️ 2.부분차감' });
  if (await partBtnInPos.count() > 0) {
    await partBtnInPos.click();
    await page.waitForTimeout(500);
  }

  // Screenshot 4: POS Modal for 부분 차감 (Partial Deduct)
  console.log('Taking screenshot of POS Modal for 부분 차감...');
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot_pos_modal_partial_deduct.png'),
    fullPage: false
  });

  // Switch to 전부 적립 inside POS Modal
  console.log('Switching to 전부 적립 inside POS Modal...');
  const rewardBtnInPos = await page.getByRole('button', { name: '💰 1.전부적립' });
  if (await rewardBtnInPos.count() > 0) {
    await rewardBtnInPos.click();
    await page.waitForTimeout(500);
  }

  // Screenshot 5: POS Modal for 전부 적립 (Full Reward)
  console.log('Taking screenshot of POS Modal for 전부 적립...');
  await page.screenshot({
    path: path.join(artifactDir, 'screenshot_pos_modal_full_reward.png'),
    fullPage: false
  });

  await browser.close();
  console.log('All tests and screenshots completed successfully!');
})();
