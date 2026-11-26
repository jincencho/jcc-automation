const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const inputPath = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864/.user_uploaded/media_1795666106043_6c062438.jpg';
const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const imgBase64 = fs.readFileSync(inputPath).toString('base64');
  const dataUri = `data:image/jpeg;base64,${imgBase64}`;

  const cropTight = await page.evaluate(async (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;

        // Ultra face-focused crop:
        // Center on face (cx = 0.5w, cy = 0.44h)
        // Crop size = 0.50 of width (tight face focus: chin to forehead/hair)
        const size = Math.round(w * 0.50);
        const cx = Math.round(w * 0.5);
        const cy = Math.round(h * 0.44);
        const sx = Math.max(0, cx - Math.round(size / 2));
        const sy = Math.max(0, cy - Math.round(size / 2));

        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);
        resolve(canvas.toDataURL('image/jpeg', 0.94));
      };
      img.src = src;
    });
  }, dataUri);

  fs.writeFileSync(path.join(artifactDir, 'face_tight_crop.jpg'), Buffer.from(cropTight.split(',')[1], 'base64'));
  console.log('Saved face_tight_crop.jpg');

  // Load offline calculator with admin session
  await page.addInitScript(() => {
    sessionStorage.setItem('jcc_calc_auth_user', JSON.stringify({
      id: 'admin',
      name: '조준석',
      store: '통합진주',
      level: 'admin'
    }));
    sessionStorage.removeItem('jcc_calc_screen_locked');
  });

  const fileUrl = 'file:///' + path.resolve('JCC_혜택계산기.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const viewQuoteBtn = page.locator('button:has-text("보기 (A4 출력)")').first();
  await viewQuoteBtn.click({ force: true });
  await page.waitForTimeout(800);

  // Apply new tight crop and enhance photo styling
  await page.evaluate((src) => {
    const el = document.querySelector('.a4-manager-photo');
    if (el) {
      el.src = src;
      el.style.width = '52px';
      el.style.height = '52px';
      el.style.border = '2.5px solid #d4af37';
      el.style.boxShadow = '0 0 10px rgba(212, 175, 55, 0.45)';
    }
  }, cropTight);
  await page.waitForTimeout(400);

  const card = page.locator('.a4-manager-card').first();
  await card.screenshot({ path: path.join(artifactDir, 'screenshot_manager_card_face_tight.png') });
  console.log('✓ Captured screenshot_manager_card_face_tight.png');

  // Also capture the whole quotation footer with this new card
  const footerWrapper = page.locator('.a4-footer-wrapper').first();
  await footerWrapper.screenshot({ path: path.join(artifactDir, 'screenshot_manager_footer_full_new_photo.png') });
  console.log('✓ Captured screenshot_manager_footer_full_new_photo.png');

  await browser.close();
})();
