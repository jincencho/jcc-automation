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

  // Evaluate canvas crop in Chromium
  const crops = await page.evaluate(async (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;

        // The face in this portrait is horizontally centered (center = w * 0.5)
        // Vertically: top of hair is ~0.08h, eyes ~0.42h, chin ~0.72h, center of face is ~0.45h
        // Let's test 3 crop zooms:
        // Crop A: box size ~ 0.65 of width, center y = 0.44h (hair to collar)
        // Crop B: box size ~ 0.55 of width, center y = 0.45h (hair to chin - very tight face focus)
        // Crop C: box size ~ 0.60 of width, center y = 0.44h (balanced tight face focus)

        function getCrop(cropSizeFrac, centerYFrac) {
          const size = Math.round(w * cropSizeFrac);
          const cx = Math.round(w * 0.5);
          const cy = Math.round(h * centerYFrac);
          const sx = Math.max(0, cx - Math.round(size / 2));
          const sy = Math.max(0, cy - Math.round(size / 2));

          const canvas = document.createElement('canvas');
          canvas.width = 400; // high-res square
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);
          return canvas.toDataURL('image/jpeg', 0.92);
        }

        resolve({
          w, h,
          cropA: getCrop(0.68, 0.43),
          cropB: getCrop(0.55, 0.45),
          cropC: getCrop(0.60, 0.44)
        });
      };
      img.src = src;
    });
  }, dataUri);

  console.log(`Original image dimensions: ${crops.w}x${crops.h}`);

  fs.writeFileSync(path.join(artifactDir, 'test_crop_A.jpg'), Buffer.from(crops.cropA.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(artifactDir, 'test_crop_B.jpg'), Buffer.from(crops.cropB.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(artifactDir, 'test_crop_C.jpg'), Buffer.from(crops.cropC.split(',')[1], 'base64'));
  console.log('Saved test crops A, B, C');

  await browser.close();
})();
