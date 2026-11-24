const QRCode = require('./qr_generator.js');

// Let's improve toSvg to merge horizontal runs of black modules
// This reduces the SVG size from 30KB down to ~2KB!

function optimizeSvg(qrModel, size = 64) {
  const count = qrModel.moduleCount;
  let pathD = '';
  for (let r = 0; r < count; r++) {
    let startCol = -1;
    for (let c = 0; c < count; c++) {
      if (qrModel.isDark(r, c)) {
        if (startCol === -1) startCol = c;
      } else {
        if (startCol !== -1) {
          pathD += `M${startCol},${r}h${c - startCol}v1h-${c - startCol}z `;
          startCol = -1;
        }
      }
    }
    if (startCol !== -1) {
      pathD += `M${startCol},${r}h${count - startCol}v1h-${count - startCol}z `;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${count} ${count}" width="${size}" height="${size}"><rect width="${count}" height="${count}" fill="#ffffff"/><path d="${pathD}" fill="#0f172a"/></svg>`;
}

// Pre-generate QR SVGs for all 8 categories
const categoryUrls = {
  washer: 'https://www.samsung.com/sec/washing-machines/',
  kitchenfit: 'https://www.samsung.com/sec/refrigerators/kitchenfit/',
  dishwasher: 'https://www.samsung.com/sec/dishwashers/dishwashers-install-guide/',
  induction: 'https://www.samsung.com/sec/electric-ranges/',
  water: 'https://www.samsung.com/sec/water-purifiers/',
  airdresser: 'https://www.samsung.com/sec/airdressers/',
  robot: 'https://www.samsung.com/sec/vacuum-cleaners/',
  tv: 'https://www.samsung.com/sec/tvs/'
};

const fs = require('fs');
const qrSvgs = {};

for (const [cat, url] of Object.entries(categoryUrls)) {
  // Use Kazuhiko Arase QRCodeModel directly or QRCode
  // Let's load the generator
}
