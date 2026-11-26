const fs = require('fs');
const path = require('path');

const cropPath = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864/face_golden_crop.jpg';
const cropBuffer = fs.readFileSync(cropPath);
const cropBase64 = `data:image/jpeg;base64,${cropBuffer.toString('base64')}`;

// 1. Update web/public/images/profile.jpg
fs.writeFileSync(path.join(__dirname, '../web/public/images/profile.jpg'), cropBuffer);
console.log('Updated web/public/images/profile.jpg');

// 2. Update web/src/constants/brandAssets.js
const brandAssetsPath = path.join(__dirname, '../web/src/constants/brandAssets.js');
let content = fs.readFileSync(brandAssetsPath, 'utf8');

const prefix = 'export const MANAGER_PROFILE_B64 = "';
const startIdx = content.indexOf(prefix);
if (startIdx === -1) {
  console.error('Could not find MANAGER_PROFILE_B64');
  process.exit(1);
}

const endIdx = content.indexOf('";', startIdx + prefix.length);
if (endIdx === -1) {
  console.error('Could not find end of MANAGER_PROFILE_B64');
  process.exit(1);
}

content = content.slice(0, startIdx + prefix.length) + cropBase64 + content.slice(endIdx);
fs.writeFileSync(brandAssetsPath, content, 'utf8');
console.log('Updated web/src/constants/brandAssets.js with new MANAGER_PROFILE_B64');
