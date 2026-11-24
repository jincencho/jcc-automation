const fs = require('fs');
const path = 'c:/jincenchoproject/assets/desktop_guides/extracted/26년 세탁기 설치가이드/ppt/slides/_rels';
const files = fs.readdirSync(path);
files.sort((a,b) => parseInt(a.replace(/\D/g,'')) - parseInt(b.replace(/\D/g,'')));
files.forEach(f => {
  const xml = fs.readFileSync(path + '/' + f, 'utf8');
  const matches = [...xml.matchAll(/Target="\.\.\/media\/([^"\s>]+)"/g)].map(m => m[1]);
  if (matches.length > 1) {
    console.log(f, matches);
  }
});
