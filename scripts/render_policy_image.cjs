/**
 * JCC 제휴카드 정책표 고해상도 그래픽 자동 생성 및 배포 스크립트
 * 
 * 사용법:
 *   node scripts/render_policy_image.cjs [htmlPath] [outName]
 * 
 * 기능:
 * 1. Chrome Headless 2x 레티나 (3560x2240) 초고해상도 렌더링
 * 2. web/public/images/ 및 web/dist/images/ 에 자동 배치
 * 3. 사용자 바탕화면(Desktop)에 자동 복사
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const defaultHtml = path.resolve(__dirname, '../web/public/images/card_policy_table.html');
const targetHtml = process.argv[2] ? path.resolve(process.argv[2]) : defaultHtml;

const outBaseName = process.argv[3] || 'card_policy_2026_11.png';
const webPublicOut = path.resolve(__dirname, '../web/public/images', outBaseName);
const webDistOut = path.resolve(__dirname, '../web/dist/images', outBaseName);
const desktopOut = path.resolve('C:\\Users\\진센조\\Desktop', outBaseName.replace('card_policy_', '').replace('.png', '_제휴카드정책표_고해상도.png'));

if (!fs.existsSync(chromePath)) {
  console.error('[오류] Chrome 실행 파일을 찾을 수 없습니다:', chromePath);
  process.exit(1);
}

if (!fs.existsSync(targetHtml)) {
  console.error('[오류] 렌더링할 정책표 HTML 파일을 찾을 수 없습니다:', targetHtml);
  process.exit(1);
}

console.log(`[1/3] Chrome Headless 2x 레티나 렌더링 시작...`);
const htmlUrl = 'file:///' + targetHtml.replace(/\\/g, '/');
const cmd = `"${chromePath}" --headless=new --no-sandbox --disable-gpu --window-size=1780,1120 --force-device-scale-factor=2 --screenshot="${webPublicOut}" "${htmlUrl}"`;

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log(`  ✓ 생성 완료: ${webPublicOut} (${fs.statSync(webPublicOut).size} bytes)`);
} catch (err) {
  console.error('[오류] Chrome 렌더링 실패:', err.message);
  process.exit(1);
}

console.log(`[2/3] web/dist/images 및 바탕화면 동기화...`);
try {
  if (fs.existsSync(path.dirname(webDistOut))) {
    fs.copyFileSync(webPublicOut, webDistOut);
    console.log(`  ✓ web/dist 동기화 완료: ${webDistOut}`);
  }
  fs.copyFileSync(webPublicOut, desktopOut);
  console.log(`  ✓ 바탕화면 저장 완료: ${desktopOut}`);
} catch (err) {
  console.warn('[주의] 복사 중 일부 경로 접근 실패:', err.message);
}

console.log(`[3/3] 제휴카드 고해상도 그래픽 배포 파이프라인 준비 완료!`);
