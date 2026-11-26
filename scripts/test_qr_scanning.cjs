const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Load jsQR library from unpkg or local CDN script for reliable decoding test
  await page.goto('about:blank');
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js' });

  // Generate crisp 360x360 PNG Data URI
  const targetUrl = 'https://jcc-band.vercel.app';
  const pngDataUri = await QRCode.toDataURL(targetUrl, {
    margin: 2,
    errorCorrectionLevel: 'M',
    width: 360,
    color: { dark: '#000000', light: '#ffffff' }
  });

  // Test decoding the generated PNG directly
  const scanDirect = await page.evaluate(async (dataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        resolve(code ? code.data : null);
      };
      img.src = dataUrl;
    });
  }, pngDataUri);
  console.log('1. Direct PNG DataURI decode result:', scanDirect);

  // Now test html2canvas capture when rendered on the page at 48px
  await page.setContent(`
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
      </head>
      <body style="background: #0f172a; padding: 20px;">
        <div id="card" style="background: #0f172a; padding: 10px; display: inline-block;">
          <!-- New 48px QR with clean white border -->
          <div id="qr-box" style="display: inline-flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.05); padding: 4px; border-radius: 6px;">
            <img id="qr-img" src="${pngDataUri}" width="48" height="48" style="display: block; width: 48px; height: 48px; border-radius: 4px; background: #ffffff;" />
            <span style="font-size: 10px; color: #fde68a; font-weight: bold; margin-top: 2px;">홈페이지 QR</span>
          </div>
        </div>
      </body>
    </html>
  `);

  await page.waitForTimeout(500);

  // Capture with html2canvas (scale: 2) as done in 사진저장 & PDF
  const h2cResult = await page.evaluate(async () => {
    const card = document.getElementById('card');
    const canvas = await html2canvas(card, { scale: 2, backgroundColor: '#0f172a' });
    const imgData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imgData.data, imgData.width, imgData.height);
    return {
      decoded: code ? code.data : null,
      canvasDataUrl: canvas.toDataURL('image/png')
    };
  });

  console.log('2. html2canvas captured card QR decode result:', h2cResult.decoded);

  const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';
  fs.writeFileSync(path.join(artifactDir, 'test_h2c_captured_card.png'), Buffer.from(h2cResult.canvasDataUrl.split(',')[1], 'base64'));
  console.log('Saved test_h2c_captured_card.png');

  await browser.close();
})();
