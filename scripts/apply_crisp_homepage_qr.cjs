const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

(async () => {
  const url = 'https://jcc-band.vercel.app';

  // 1. Generate crystal clear 400x400 PNG Data URI with standard margin 2
  const qrPngDataUri = await QRCode.toDataURL(url, {
    margin: 2,
    errorCorrectionLevel: 'M',
    width: 400,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  console.log('Generated QR Data URI (length):', qrPngDataUri.length);

  // 2. Add JCC_HOMEPAGE_QR_B64 to web/src/constants/brandAssets.js
  const brandAssetsPath = path.join(__dirname, '../web/src/constants/brandAssets.js');
  let brandAssetsContent = fs.readFileSync(brandAssetsPath, 'utf8');

  const qrExportCode = `\n// JCC 진센조 공식 홈페이지 초고화질 QR코드 (사진·PDF·인쇄 100% 스캔 보장)\nexport const JCC_HOMEPAGE_QR_B64 = "${qrPngDataUri}";\n`;

  if (brandAssetsContent.includes('export const JCC_HOMEPAGE_QR_B64')) {
    // Replace existing
    brandAssetsContent = brandAssetsContent.replace(/export const JCC_HOMEPAGE_QR_B64 = "[^"]+";/, qrExportCode.trim());
  } else {
    brandAssetsContent += qrExportCode;
  }
  fs.writeFileSync(brandAssetsPath, brandAssetsContent, 'utf8');
  console.log('Updated brandAssets.js with JCC_HOMEPAGE_QR_B64');

  // 3. Update web/src/components/BenefitCalculator.jsx
  const calcPath = path.join(__dirname, '../web/src/components/BenefitCalculator.jsx');
  let calcContent = fs.readFileSync(calcPath, 'utf8');

  // Ensure import includes JCC_HOMEPAGE_QR_B64
  const oldImport = "import { BRAND_LOGO_B64, MANAGER_PROFILE_B64 } from '../constants/brandAssets';";
  const newImport = "import { BRAND_LOGO_B64, MANAGER_PROFILE_B64, JCC_HOMEPAGE_QR_B64 } from '../constants/brandAssets';";

  if (!calcContent.includes('JCC_HOMEPAGE_QR_B64')) {
    if (calcContent.includes(oldImport)) {
      calcContent = calcContent.replace(oldImport, newImport);
    } else {
      console.error('Could not find brandAssets import in BenefitCalculator.jsx');
      process.exit(1);
    }
  }

  // Replace CardEventQrSvg in a4-manager-qr with ultra-crisp <img> tag
  const oldQrBlock = `<div className="a4-manager-qr">
                        <a
                          href="https://jcc-band.vercel.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="JCC 진센조 공식 홈페이지 바로가기"
                        >
                          <CardEventQrSvg url="https://jcc-band.vercel.app" size={38} label="JCC 진센조 공식 홈페이지 QR코드" />
                          <span className="a4-manager-qr-label">
                            홈페이지 QR
                          </span>
                        </a>
                      </div>`;

  const newQrBlock = `<div className="a4-manager-qr">
                        <a
                          href="https://jcc-band.vercel.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          title="JCC 진센조 공식 홈페이지 바로가기 (클릭 또는 스마트폰 QR 스캔)"
                          style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                          <img
                            src={JCC_HOMEPAGE_QR_B64}
                            alt="JCC 진센조 공식 홈페이지 QR코드"
                            width={46}
                            height={46}
                            style={{
                              display: 'block',
                              width: '46px',
                              height: '46px',
                              background: '#ffffff',
                              borderRadius: '4px',
                              padding: '2px',
                              boxSizing: 'border-box',
                              border: '1px solid rgba(255, 255, 255, 0.4)',
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
                              imageRendering: 'pixelated',
                              flexShrink: 0
                            }}
                          />
                          <span className="a4-manager-qr-label" style={{ marginTop: '3px', letterSpacing: '-0.2px' }}>
                            홈페이지 QR
                          </span>
                        </a>
                      </div>`;

  if (!calcContent.includes(oldQrBlock)) {
    console.error('Could not find oldQrBlock in BenefitCalculator.jsx');
    process.exit(1);
  }

  calcContent = calcContent.replace(oldQrBlock, newQrBlock);
  fs.writeFileSync(calcPath, calcContent, 'utf8');
  console.log('Successfully updated BenefitCalculator.jsx with crisp Homepage QR <img>!');
})();
