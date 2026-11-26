const { chromium } = require('playwright');
const path = require('path');

const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1800 } });
  const page = await context.newPage();

  page.on('dialog', async (d) => await d.accept());

  // General manager session (non-조준석 manager, e.g. 김철수 매니저)
  await page.addInitScript(() => {
    sessionStorage.setItem('jcc_calc_auth_user', JSON.stringify({
      id: 'manager1',
      name: '김철수',
      store: '삼성스토어 통합진주',
      phone: '010-9876-5432',
      level: 'lv1'
    }));
    sessionStorage.removeItem('jcc_calc_screen_locked');
  });

  const fileUrl = 'file:///' + path.resolve('JCC_혜택계산기.html').replace(/\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Click '보기 (A4 출력)' to navigate to quotation view
  const viewQuoteBtn = page.locator('button:has-text("보기 (A4 출력)")').first();
  await viewQuoteBtn.click({ force: true });
  await page.waitForTimeout(1000);

  // Locate the general manager business card footer
  const managerCard = page.locator('.a4-manager-card-simple, .a4-manager-card').first();
  await managerCard.waitFor({ timeout: 5000 });
  console.log('✓ Found manager card in quotation view!');

  const cardText = await managerCard.innerText();
  console.log('Manager card text:\n', cardText);

  // 1. Capture close-up of general manager card
  await managerCard.screenshot({ path: path.join(artifactDir, 'screenshot_general_manager_card_closeup.png') });
  console.log('✓ Saved screenshot_general_manager_card_closeup.png');

  // 2. Capture bottom footer wrapper with disclaimer
  const footerWrapper = page.locator('.a4-footer-wrapper').first();
  await footerWrapper.screenshot({ path: path.join(artifactDir, 'screenshot_general_manager_footer_full.png') });
  console.log('✓ Saved screenshot_general_manager_footer_full.png');

  // 3. Capture the quotation sheet bottom section (including pricing & footer)
  const quoteSheet = page.locator('.a4-print-sheet').first();
  await quoteSheet.screenshot({ path: path.join(artifactDir, 'screenshot_general_manager_quote_sheet.png') });
  console.log('✓ Saved screenshot_general_manager_quote_sheet.png');

  await browser.close();
  console.log('Done capturing general manager screenshots!');
})();
