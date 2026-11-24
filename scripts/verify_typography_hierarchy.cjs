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

  // Helper
  function setInputVal(page, selector, val) {
    return page.evaluate(({ selector, val }) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error('Not found: ' + selector);
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, { selector, val });
  }

  // 1. Setup Plan 1: 60,000원, 48개월
  await setInputVal(page, 'input[placeholder="예: 72,000"]', '60000');
  await page.evaluate(() => {
    const sel = document.querySelector('select[aria-label="약정기간 선택 1"]');
    if (sel) {
      sel.value = '48';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(300);

  // 2. Add Plan 2: 20,000원, 72개월
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('약정기간 · 구독료 칸 추가'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(400);

  await page.evaluate(() => {
    const p2Fee = document.querySelector('input[placeholder="예: 25,000"]');
    if (p2Fee) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(p2Fee, '20000');
      p2Fee.dispatchEvent(new Event('input', { bubbles: true }));
      p2Fee.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const sel2 = document.querySelector('select[aria-label="약정기간 선택 2"]');
    if (sel2) {
      sel2.value = '72';
      sel2.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(400);

  // 3. Select Samsung Card Preset
  await page.evaluate(() => {
    const cardBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === '삼성카드');
    if (cardBtn) cardBtn.click();
  });
  await page.waitForTimeout(400);

  // 4. Setup Free Services: 1 가전 (2900), 2 모바일 (4900)
  await page.evaluate(() => {
    const freeInputs = Array.from(document.querySelectorAll('input[placeholder*="2,900"]'));
    if (freeInputs[0]) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(freeInputs[0], '2900');
      freeInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      freeInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('무상 A/S 연장 품목 추가'));
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

  // 5. Cashback: 200,000
  await page.evaluate(() => {
    const cbInput = document.querySelector('input[placeholder*="삼성AI구독 캐시백"]');
    if (cbInput) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(cbInput, '200000');
      cbInput.dispatchEvent(new Event('input', { bubbles: true }));
      cbInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(400);

  const artifactDir = 'C:\\Users\\진센조\\.gemini\\antigravity\\brain\\3ca4ffe5-d17f-4218-abfa-c9da004ae864';
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_input_summary_refined.png') });

  // 6. Navigate to A4 result
  console.log('Navigating to A4 Comparison Quote...');
  await page.evaluate(() => {
    const a4Btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('비교 결과 보기 (A4 출력)'));
    if (a4Btn) a4Btn.click();
  });
  await page.waitForTimeout(1000);

  // Screenshot OPTION B in A4
  await page.screenshot({ path: path.join(artifactDir, 'screenshot_a4_quote_typography_refined.png') });

  await browser.close();
  console.log('Finished capturing screenshots!');
}

run().catch(console.error);
