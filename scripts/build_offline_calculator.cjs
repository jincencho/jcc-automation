const esbuild = require('c:/jincenchoproject/web/node_modules/esbuild');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'web');
const logoPath = path.join(webDir, 'public/images/logo_new.png');
const logoB64 = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
  : '';

const tempEntry = path.join(webDir, 'src/.standalone_entry_temp.jsx');
const entryCode = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import BenefitCalculator from './components/BenefitCalculator.jsx';

const LOGO_SRC = ${JSON.stringify(logoB64)};

function StandaloneApp() {
  return (
    <div className="app-container">
      <nav className="site-nav" style={{ padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-color)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {LOGO_SRC && <img src={LOGO_SRC} alt="JINCENCHO" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />}
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold-light)', background: 'rgba(212, 175, 55, 0.14)', border: '1px solid rgba(212, 175, 55, 0.4)', padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
            오프라인 단독 실행 버전
          </span>
        </div>
        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          JCC 진센조 · 스마트 고객혜택 계산기
        </div>
      </nav>
      <main>
        <BenefitCalculator />
      </main>
      <footer className="site-footer" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--glass-border)', marginTop: '3.5rem', fontSize: '0.82rem' }}>
        <p>&copy; 2026 JCC (JINJU CENTUM CHOJUNSEOK). All rights reserved.</p>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<StandaloneApp />);
`;

fs.writeFileSync(tempEntry, entryCode, 'utf8');

try {
  console.log('Bundling BenefitCalculator with esbuild...');
  const result = esbuild.buildSync({
    entryPoints: [tempEntry],
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    loader: {
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.svg': 'dataurl'
    },
    write: false
  });

  const jsBundle = result.outputFiles[0].text;
  const css = fs.readFileSync(path.join(webDir, 'src/index.css'), 'utf8');

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JCC 진센조 | 일반구매 vs 삼성AI구독 혜택 계산기</title>
  <style>
${css}
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
${jsBundle}
  </script>
</body>
</html>
`;

  const outputPath = path.join(rootDir, 'JCC_혜택계산기.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`Success! Offline single-file HTML generated: ${outputPath} (${(html.length / 1024).toFixed(1)} KB)`);
} finally {
  if (fs.existsSync(tempEntry)) {
    fs.unlinkSync(tempEntry);
  }
}
