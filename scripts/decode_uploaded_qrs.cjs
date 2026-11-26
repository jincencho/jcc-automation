const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const imgPath = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864/.user_uploaded/media_1795678461096_96cf94f4.jpg';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Load jsqr
  await page.goto('about:blank');
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js' });

  const imgBase64 = fs.readFileSync(imgPath).toString('base64');
  const dataUri = `data:image/jpeg;base64,${imgBase64}`;

  const results = await page.evaluate(async (uri) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = img.naturalWidth;
        fullCanvas.height = img.naturalHeight;
        const ctx = fullCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const w = img.naturalWidth;
        const h = img.naturalHeight;

        // The image has 2 rows and 6 columns inside the white projector screen box.
        // Let's define approximate normalized bounding boxes for the 12 QR codes
        // Let's test a grid:
        // Top row (6 items): [세탁기], [정수기], [TV], [로봇청소기], [에어드레서], [냉장고]
        // Bottom row (6 items): [식기세척기], [에어컨], [시스템 에어컨], [공기청정기], [인덕션], [AI구독]
        
        // Approximate coordinates relative to w and h:
        // Screen bounds: x from ~0.04 to ~0.96, y from ~0.33 to ~0.80
        // Top row y: ~0.33 to ~0.53
        // Bottom row y: ~0.59 to ~0.79
        // 6 columns across x:
        // col 0: ~0.04 - 0.18
        // col 1: ~0.19 - 0.33
        // col 2: ~0.34 - 0.48
        // col 3: ~0.50 - 0.64
        // col 4: ~0.66 - 0.80
        // col 5: ~0.82 - 0.96

        const labels = [
          ['세탁기', '정수기', 'TV', '로봇청소기', '에어드레서', '냉장고'],
          ['식기세척기', '에어컨', '시스템에어컨', '공기청정기', '인덕션', 'AI구독']
        ];

        const output = [];

        // Try scanning with slight offsets/scaling to ensure 100% detection
        for (let row = 0; row < 2; row++) {
          const yStart = row === 0 ? 0.32 : 0.58;
          const yEnd = row === 0 ? 0.53 : 0.79;
          const boxH = (yEnd - yStart) * h;
          const boxY = yStart * h;

          for (let col = 0; col < 6; col++) {
            const label = labels[row][col];
            const xStart = 0.04 + col * 0.153;
            const boxW = 0.14 * w;
            const boxX = xStart * w;

            // Crop canvas
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = boxW;
            cropCanvas.height = boxH;
            const cropCtx = cropCanvas.getContext('2d');
            cropCtx.drawImage(fullCanvas, boxX, boxY, boxW, boxH, 0, 0, boxW, boxH);

            const imgData = cropCtx.getImageData(0, 0, boxW, boxH);
            let code = jsQR(imgData.data, imgData.width, imgData.height);

            // If not found, try slightly larger / smaller padding
            if (!code) {
              const padX = boxX - 0.02 * w;
              const padY = boxY - 0.02 * h;
              const padW = boxW + 0.04 * w;
              const padH = boxH + 0.04 * h;
              const padCanvas = document.createElement('canvas');
              padCanvas.width = padW;
              padCanvas.height = padH;
              const padCtx = padCanvas.getContext('2d');
              padCtx.drawImage(fullCanvas, padX, padY, padW, padH, 0, 0, padW, padH);
              const padData = padCtx.getImageData(0, 0, padW, padH);
              code = jsQR(padData.data, padData.width, padData.height);
            }

            output.push({
              row,
              col,
              label,
              data: code ? code.data : null,
              box: { boxX, boxY, boxW, boxH }
            });
          }
        }

        resolve({ width: w, height: h, output });
      };
      img.src = uri;
    });
  }, dataUri);

  console.log('Image dimensions:', results.width, 'x', results.height);
  console.log('Decoded results:');
  results.output.forEach(r => {
    console.log(`[${r.label}] -> ${r.data || 'FAILED TO DECODE'}`);
  });

  await browser.close();
})();
