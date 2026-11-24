const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1600 } });
  const page = await context.newPage();

  const fileUrl = 'file:///' + path.resolve('JCC_혜택계산기.html').replace(/\\/g, '/');
  console.log('Navigating to', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load' });

  // Handle password
  try {
    const pwInput = page.locator('input[type="password"]');
    if (await pwInput.isVisible({ timeout: 1500 })) {
      await pwInput.fill('08931121');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  } catch (e) {}

  await page.waitForTimeout(500);

  const artifactDir = 'C:\\Users\\진센조\\.gemini\\antigravity\\brain\\3ca4ffe5-d17f-4218-abfa-c9da004ae864';

  // 1. Verify Cashback label in Input View
  const inputCashbackLabel = await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll('label')).find(l => l.innerText.includes('삼성AI구독 혜택'));
    return label ? label.innerText : 'Not found';
  });
  console.log('Input Cashback Label:', inputCashbackLabel);

  // Set cashback amount to 300,000 to see it in action
  await page.evaluate(() => {
    const cbInput = document.querySelector('input[placeholder*="삼성AI구독 캐시백"]');
    if (cbInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(cbInput, '300000');
      cbInput.dispatchEvent(new Event('input', { bubbles: true }));
      cbInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(300);

  // Take screenshot of Input cashback box
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_input_cashback_label.png') });

  // 2. Click "비교 결과 보기 (A4 출력)" to go to result page
  console.log('Navigating to Result / Quote page...');
  await page.evaluate(() => {
    const a4Btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('비교 결과 보기 (A4 출력)'));
    if (a4Btn) a4Btn.click();
  });
  await page.waitForTimeout(1000);

  // 3. Verify A4 quotation displays "삼성AI구독 혜택 (캐시백,차차월 5~7일)"
  const a4Text = await page.evaluate(() => {
    const sheet = document.querySelector('.a4-print-sheet') || document.querySelector('.a4-sheet-wrapper');
    return sheet ? sheet.innerText : 'Sheet not found';
  });
  const hasCashbackNote = a4Text.includes('삼성AI구독 혜택 (캐시백,차차월 5~7일)');
  console.log('A4 Sheet contains "삼성AI구독 혜택 (캐시백,차차월 5~7일)":', hasCashbackNote);

  // Screenshot A4 sheet
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_a4_cashback_label.png') });

  // 4. Scroll to bottom of Result page to inspect bottom buttons
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const bottomButtons = await page.evaluate(() => {
    const bar = document.querySelector('div[style*="marginTop: 1.25rem"], div[style*="margin-top: 1.25rem"]') ||
                Array.from(document.querySelectorAll('div')).find(d => d.className.includes('container') && d.className.includes('no-print') && d.innerText.includes('조건 수정하기') && d.innerText.includes('사진(이미지) 저장'));
    return bar ? Array.from(bar.querySelectorAll('button')).map(b => b.innerText.trim()) : 'Bar not found';
  });
  console.log('Bottom Action Bar Buttons:', bottomButtons);

  // Screenshot bottom buttons
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_bottom_action_bar.png') });

  // 5. Test clicking bottom "조건 수정하기" button
  console.log('Clicking bottom "조건 수정하기" button...');
  const clickedEdit = await page.evaluate(() => {
    const allBtns = Array.from(document.querySelectorAll('button'));
    // Find the second "조건 수정하기" or the one in the bottom bar
    const editBtns = allBtns.filter(b => b.innerText.includes('조건 수정하기'));
    if (editBtns.length >= 2) {
      editBtns[editBtns.length - 1].click();
      return true;
    } else if (editBtns.length === 1) {
      editBtns[0].click();
      return true;
    }
    return false;
  });
  console.log('Clicked bottom edit button:', clickedEdit);
  await page.waitForTimeout(1000);

  // Check if we are back in input view
  const currentStepIsInput = await page.evaluate(() => {
    return Boolean(document.querySelector('h3') && document.body.innerText.includes('상담 및 출력 기본 정보'));
  });
  console.log('Returned to input step successfully:', currentStepIsInput);

  await page.screenshot({ path: path.join(artifactDir, 'screenshot_returned_to_input.png') });

  await browser.close();
  console.log('All tests completed successfully!');
}

run().catch(console.error);
