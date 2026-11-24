const fs = require('fs');
const path = require('path');

function getPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    return null;
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

const mediaDir = 'c:/jincenchoproject/assets/desktop_guides/extracted/26년 세탁기 설치가이드/ppt/media';
['image2.png', 'image3.png', 'image4.png', 'image5.png', 'image6.png'].forEach(f => {
  const p = path.join(mediaDir, f);
  if (fs.existsSync(p)) {
    console.log(f, getPngDimensions(p));
  }
});
