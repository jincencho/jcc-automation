const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const fileUrl = 'file:///' + path.resolve('JCC_혜택계산기.html').replace(/\\/g, '/');
  await page.goto(fileUrl);
  try {
    const pw = page.locator('input[type="password"]');
    if (await pw.isVisible({ timeout: 1500 })) {
      await pw.fill('08931121');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  } catch (e) {}

  const btns = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
  });
  console.log('All buttons with keywords:', btns.filter(b => b.includes('A4') || b.includes('비교') || b.includes('출력') || b.includes('견적') || b.includes('보기')));
  await browser.close();
}
run();
