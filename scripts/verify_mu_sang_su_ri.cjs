const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });

  const fileUrl = 'file:///' + path.resolve('JCC_혜택계산기.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'load' });

  // Handle password
  try {
    const pw = page.locator('input[type="password"]');
    if (await pw.isVisible({ timeout: 1500 })) {
      await pw.fill('08931121');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  } catch (e) {}

  await page.waitForTimeout(500);

  // Set 1 appliance free item (2900) + 1 mobile free item (4900)
  await page.evaluate(() => {
    const freeInputs = Array.from(document.querySelectorAll('input[placeholder*="2,900"]'));
    if (freeInputs[0]) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(freeInputs[0], '2900');
      freeInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      freeInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('무상수리 연장 품목 추가'));
    if (addBtn) addBtn.click();
  });
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    const freeInputs = Array.from(document.querySelectorAll('input[placeholder*="2,900"]'));
    if (freeInputs[1]) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(freeInputs[1], '4900');
      freeInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      freeInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
    }
    const mobileLabels = Array.from(document.querySelectorAll('label')).filter(l => l.innerText.includes('모바일'));
    if (mobileLabels[1]) {
      const chk = mobileLabels[1].querySelector('input[type="checkbox"]');
      if (chk && !chk.checked) chk.click();
    }
  });
  await page.waitForTimeout(400);

  const inputTexts = await page.evaluate(() => {
    const header = Array.from(document.querySelectorAll('*')).find(el => el.innerText && el.innerText.includes('무상수리 연장 이용료'));
    const summary = document.querySelector('div[style*="rgba(59, 130, 246, 0.14)"]');
    return {
      headerFound: Boolean(header),
      summarySnippet: summary ? summary.innerText : ''
    };
  });
  console.log('Input View check:', inputTexts);

  const artifactDir = 'C:\\Users\\진센조\\.gemini\\antigravity\\brain\\3ca4ffe5-d17f-4218-abfa-c9da004ae864';
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_input_musangsuri.png') });

  // Navigate to A4
  await page.evaluate(() => {
    const a4Btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('비교 결과 보기 (A4 출력)'));
    if (a4Btn) a4Btn.click();
  });
  await page.waitForTimeout(1000);

  const a4Text = await page.evaluate(() => {
    const sheet = document.querySelector('.a4-print-sheet') || document.querySelector('.a4-sheet-wrapper');
    return sheet ? sheet.innerText : '';
  });

  console.log('A4 contains "무상수리 연장 이용료":', a4Text.includes('무상수리 연장 이용료'));
  console.log('A4 contains "무상수리 보증":', a4Text.includes('무상수리 보증'));
  console.log('A4 contains any "A/S":', /a\/s/i.test(a4Text));

  await page.screenshot({ path: path.join(artifactDir, 'screenshot_a4_musangsuri.png') });

  await browser.close();
  console.log('Verification done!');
}
run();
