const fs = require('fs');
const path = require('path');

const extractBase = 'c:/jincenchoproject/assets/desktop_guides/extracted';
const dirs = fs.readdirSync(extractBase).filter(d => fs.statSync(path.join(extractBase, d)).isDirectory());

dirs.forEach(d => {
  const relsDir = path.join(extractBase, d, 'ppt', 'slides', '_rels');
  if (!fs.existsSync(relsDir)) return;
  const files = fs.readdirSync(relsDir);
  files.sort((a,b) => parseInt(a.replace(/\D/g,'')) - parseInt(b.replace(/\D/g,'')));
  files.forEach(f => {
    const xml = fs.readFileSync(path.join(relsDir, f), 'utf8');
    const matches = [...xml.matchAll(/Target="\.\.\/media\/([^"\s>]+)"/g)].map(m => m[1]);
    if (matches.length > 1) {
      console.log(`${d} -> ${f}: [${matches.join(', ')}]`);
    }
  });
});
