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

  const dump = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('h3')).map(h => {
      const card = h.closest('.glass-panel');
      const buttons = card ? Array.from(card.querySelectorAll('button')).map(b => b.innerText.trim()) : [];
      return {
        h3: h.innerText.trim(),
        buttons
      };
    });
    return sections;
  });
  console.log(JSON.stringify(dump, null, 2));
  await browser.close();
}
run();
