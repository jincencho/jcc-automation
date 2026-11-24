const fs = require('fs');
const path = require('path');

function getDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
    return { type: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  return { type: 'other', length: buf.length };
}

const mediaDir = 'c:/jincenchoproject/assets/desktop_guides/extracted/후드_후드인덕션_설치가이드_진센조폼_A4가로/ppt/media';
['image6.png', 'image8.bin', 'image7.bin'].forEach(f => {
  const p = path.join(mediaDir, f);
  if (fs.existsSync(p)) {
    console.log(f, getDimensions(p));
  }
});
