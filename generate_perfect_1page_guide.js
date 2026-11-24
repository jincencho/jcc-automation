const fs = require('fs');
const path = require('path');
const QRCode = require('./qr_generator.js');

const data = JSON.parse(fs.readFileSync('assets/extracted_data.json', 'utf8'));

// Helper to sanitize HTML
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

// Category metadata & Official Samsung URLs
const catMeta = {
  washer: {
    name: "세탁기·건조기",
    url: "https://www.samsung.com/sec/washing-machines/",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2.01L6 2c-1.11 0-2 .89-2 2v16c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2V4c0-1.11-.89-1.99-2-1.99zM18 20H6v-9.02h12V20zm0-11H6V4h12v5zM8 5h2v2H8V5zm4 0h4v2h-4V5z"/><circle cx="12" cy="15.5" r="3.5"/></svg>`,
    desc: "Bespoke AI 콤보 일체형, 원바디 Top-Fit, AI 건조기(2025/2026년형), 직렬/병렬/앵글 설치, 통버블 및 아가사랑 세탁기"
  },
  kitchenfit: {
    name: "냉장고·키친핏",
    url: "https://www.samsung.com/sec/refrigerators/kitchenfit/",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 8h10V4H7v6zm0 10h10v-8H7v8zm2-6h2v2H9v-2zm0-6h2v2H9V8z"/></svg>`,
    desc: "Bespoke 키친핏 4도어 단독, 김치플러스 단독, 4+1도어, 4+3도어, 4+4도어, 1도어 4대 풀패키지, 인피니티 4도어 및 2대 페어"
  },
  dishwasher: {
    name: "식기세척기",
    url: "https://www.samsung.com/sec/dishwashers/dishwashers-install-guide/",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm0-13H5V5h14v1zm-7 5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`,
    desc: "트루빌트인(True Built-in), 세미빌트인, 오토오픈/일반 빌트인, 프리스탠딩, 6인용 카운터탑, 걸레받이 커팅 및 싱크대 리폼비 기준"
  },
  induction: {
    name: "인덕션 & 후드",
    url: "https://www.samsung.com/sec/electric-ranges/",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-7 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-6-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`,
    desc: "Bespoke AI 후드 Air, 전면배기/플러그앤플레이 후드인덕션, 상판 560×480mm 타공 가이드, 하부 오븐/식세기 간섭 대처법"
  },
  water: {
    name: "정수기",
    url: "https://www.samsung.com/sec/water-purifiers/",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
    desc: "Bespoke 빌트인 언더싱크 정수기, 얼음정수기, 카운터탑 정수기 본체 치수, 수압(1.5~8.0bar) 및 전기/타공 필수 조건"
  },
  airdresser: {
    name: "에어드레서",
    url: "https://www.samsung.com/sec/airdressers/",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 13H7v-2h2v2zm0-4H7V7h2v2zm6 4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>`,
    desc: "대용량 5벌형(DF24/DF20) 및 일반 슬림 3벌형(DF60/DF10) 가구장 내경 규격 및 도어 오픈 깊이"
  },
  robot: {
    name: "로봇청소기",
    url: "https://www.samsung.com/sec/vacuum-cleaners/",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A1.5 1.5 0 0 0 6 14.5 1.5 1.5 0 0 0 7.5 16 1.5 1.5 0 0 0 9 14.5 1.5 1.5 0 0 0 7.5 13m9 0a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5 1.5 1.5 0 0 0-1.5-1.5"/></svg>`,
    desc: "Bespoke AI 스팀 자동 급배수 빌트인/프리스탠딩 설치 공간, 싱크대 하부장 치수, 가구장 리폼 비용 및 협력사 안내"
  },
  tv: {
    name: "TV & 에어컨",
    url: "https://www.samsung.com/sec/tvs/",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>`,
    desc: "The Frame 및 대화면 Neo QLED 슬림핏 벽걸이 규격, 시스템에어컨 천장 배관 및 실외기 이격 기준"
  },
  oven: {
    name: "빌트인 오븐",
    url: "https://www.samsung.com/sec/electric-ovens/",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10zm-8-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm5.5-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM8 5h2v2H8V5z"/></svg>`,
    desc: "Bespoke 빌트인 오븐 50L (NQ50T8539BK), 600mm 가구장 내경 규격, 상하부 200㎠ 환기 통풍구 필수 조건"
  }
};

// Generate QR SVGs for all categories
const qrMap = {};
for (const [catKey, meta] of Object.entries(catMeta)) {
  qrMap[catKey] = QRCode.generateSvg(meta.url, 6, 52);
}

// Parse single slide into structured object
function parseSlide(s) {
  const texts = s.texts || [];
  if (texts.length === 0) return null;

  const tag = texts[0] || '';
  const title = texts[1] || '';
  
  let diagTitle = '';
  let modelDesc = '';
  const checkPoints = [];
  let warning = '';
  let footer = '';

  let inModel = false;
  let inCheck = false;
  let inWarning = false;

  for (let i = 2; i < texts.length; i++) {
    const t = texts[i];
    if (t.includes('설치 가이드 요약') || t.includes('핵심 체크사항')) {
      continue;
    }
    if (t === '적용 모델' || t.startsWith('적용 모델')) {
      inModel = true; inCheck = false; inWarning = false;
      continue;
    }
    if (t.includes('주요 확인 포인트') || t.includes('체크사항') || t.includes('확인 필요')) {
      inCheck = true; inModel = false; inWarning = false;
      continue;
    }
    if (t.includes('공통 주의사항') || t.includes('설치 유의사항') || t.includes('주의사항') || t.includes('⚠')) {
      inWarning = true; inModel = false; inCheck = false;
      continue;
    }
    if (t.includes('삼성전자 고객센터') || t.includes('1588-3366')) {
      footer = t;
      inModel = false; inCheck = false; inWarning = false;
      continue;
    }
    if (t.includes('구매 전 설치') || t.includes('고객 안내용') || t.includes('구매처에 상담')) {
      footer += (footer ? '   |   ' : '') + t;
      continue;
    }

    if (inWarning) {
      warning += (warning ? ' ' : '') + t;
    } else if (inCheck) {
      if (t.startsWith('체크') || t.startsWith('✓')) {
        checkPoints.push({ label: t, text: '' });
      } else if (checkPoints.length > 0) {
        checkPoints[checkPoints.length - 1].text += (checkPoints[checkPoints.length - 1].text ? ' ' : '') + t;
      } else {
        checkPoints.push({ label: '확인', text: t });
      }
    } else if (inModel) {
      modelDesc += (modelDesc ? ' ' : '') + t;
    } else {
      if (!diagTitle) diagTitle = t;
      else if (diagTitle.length < 35) diagTitle += ' ' + t;
    }
  }

  return {
    slideIndex: s.slideIndex,
    imageSrc: s.imageSrc,
    tag,
    title,
    diagTitle: diagTitle || title,
    modelDesc,
    checkPoints,
    warning,
    footer: footer || '삼성전자 고객센터  1588-3366   |   설치주의사항 고객 안내용 요약본'
  };
}

console.log('Generating perfected 1-page fit HTML with official QR codes and strict zero-discrepancy standards...');

const htmlHeader = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>삼성전자 가전 설치주의사항 및 모델별 실측 가이드북 (2026 공식 통합본)</title>
  <style>
    :root {
      --primary: #1259a4;
      --primary-light: #eaf3ff;
      --primary-dark: #093b73;
      --accent: #2189ff;
      --bg: #f1f5f9;
      --surface: #ffffff;
      --border: #cbd5e1;
      --border-light: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
      --shadow-md: 0 4px 12px rgba(15,23,42,0.08);
      --shadow-lg: 0 12px 28px rgba(15,23,42,0.12);
      --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      padding-bottom: 80px;
    }

    a { color: var(--accent); text-decoration: none; }

    /* Top Brand Bar */
    .top-header {
      background: linear-gradient(135deg, #0b1a30 0%, #102a4e 50%, #15396b 100%);
      color: #fff;
      padding: 30px 20px 36px;
      position: relative;
    }
    .header-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .brand-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.14);
      padding: 5px 14px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 700;
      color: #93c5fd;
      border: 1px solid rgba(255, 255, 255, 0.2);
      margin-bottom: 12px;
    }
    .header-title {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .header-desc {
      font-size: 14px;
      color: #cbd5e1;
      max-width: 880px;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    .header-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .stat-pill {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-sm);
      padding: 6px 12px;
      font-size: 12px;
      color: #e2e8f0;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    /* Sticky Navigation Tabs */
    .nav-wrapper {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .nav-container::-webkit-scrollbar { display: none; }
    .category-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
      padding: 8px 0;
    }
    .tab-btn {
      background: transparent;
      border: none;
      padding: 9px 15px;
      font-size: 14px;
      font-weight: 700;
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: var(--transition);
    }
    .tab-btn:hover {
      background: #f1f5f9;
      color: var(--text);
    }
    .tab-btn.active {
      background: #1259a4;
      color: #ffffff;
    }
    .tab-btn svg { width: 17px; height: 17px; }

    /* Search & Filter Bar */
    .search-bar-wrap {
      max-width: 1200px;
      margin: 20px auto 26px;
      padding: 0 16px;
    }
    .search-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
      box-shadow: var(--shadow-sm);
    }
    .search-input-box {
      flex: 1;
      min-width: 260px;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-input-box svg {
      position: absolute;
      left: 12px;
      width: 17px;
      height: 17px;
      fill: var(--text-muted);
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 10px 14px 10px 38px;
      font-size: 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      outline: none;
      background: #f8fafc;
      transition: var(--transition);
    }
    .search-input:focus {
      background: #fff;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(33, 137, 255, 0.2);
    }
    .filter-chips {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .chip {
      background: #f1f5f9;
      border: 1px solid var(--border-light);
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: var(--transition);
    }
    .chip:hover {
      background: #e0f2fe;
      color: #0284c7;
      border-color: #bae6fd;
    }

    /* Main Container */
    .main-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
    }

    /* Section Header */
    .section-header-banner {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
    }
    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .section-icon-box {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-sm);
      background: var(--primary-light);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .section-icon-box svg { width: 26px; height: 26px; }
    .section-title { font-size: 21px; font-weight: 800; color: var(--text); }
    .section-subtitle { font-size: 13.5px; color: var(--text-muted); margin-top: 2px; }

    /* ==========================================================================
       OFFICIAL CUSTOMER CONSULTATION SHEET (Screen Display Style)
       ========================================================================== */
    .official-sheet {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      box-shadow: var(--shadow-sm);
      margin-bottom: 30px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: var(--transition);
    }
    .official-sheet:hover {
      box-shadow: var(--shadow-md);
      border-color: #93c5fd;
    }

    /* 1. Header Bar */
    .sheet-header-bar {
      padding: 14px 22px;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
    .sheet-tag {
      font-size: 12.5px;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
      line-height: 1;
    }
    .sheet-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
      margin-top: 4px;
    }
    .sheet-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-sheet-action {
      font-size: 12px;
      font-weight: 700;
      padding: 6px 13px;
      border-radius: 5px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: var(--transition);
      border: 1px solid transparent;
      line-height: 1;
    }
    .btn-zoom {
      background: #f1f5f9;
      color: #334155;
      border-color: #cbd5e1;
    }
    .btn-zoom:hover { background: #e2e8f0; }
    .btn-print {
      background: #eff6ff;
      color: #1e40af;
      border-color: #bfdbfe;
    }
    .btn-print:hover { background: #1e40af; color: #fff; }

    /* 2. Diagram Banner */
    .sheet-diagram-banner {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 20px 22px;
      text-align: center;
    }
    .sheet-diagram-title {
      font-size: 14.5px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 14px;
      display: inline-block;
    }
    .diagram-img-box {
      width: 100%;
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }
    .diagram-img-box img {
      max-width: 100%;
      height: auto;
      max-height: 480px;
      object-fit: contain;
      transition: transform 0.25s ease;
    }
    .diagram-img-box:hover img {
      transform: scale(1.02);
    }
    .diagram-zoom-badge {
      position: absolute;
      bottom: 8px;
      right: 10px;
      background: rgba(15, 23, 42, 0.75);
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      pointer-events: none;
      backdrop-filter: blur(4px);
    }

    /* 3. Summary Content Body */
    .sheet-body-content {
      padding: 20px 22px;
      background: #ffffff;
    }
    .sheet-summary-heading {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sheet-summary-heading::before {
      content: "";
      width: 3.5px;
      height: 13px;
      background: #1259a4;
      display: inline-block;
      border-radius: 2px;
    }
    .summary-spec-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 14px;
    }
    .summary-spec-table th, .summary-spec-table td {
      border: 1px solid #e2e8f0;
      padding: 9px 13px;
      vertical-align: middle;
    }
    .summary-spec-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #334155;
      width: 20%;
      text-align: left;
    }
    .summary-spec-table td {
      color: #0f172a;
      line-height: 1.5;
    }

    /* Check points grid */
    .checkpoints-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 8px;
      margin-bottom: 14px;
    }
    .checkpoint-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12.5px;
      line-height: 1.45;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .checkpoint-badge {
      background: #0284c7;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 3px;
      line-height: 1.2;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* Warning Alert Callout */
    .sheet-warning-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 0 4px 4px 0;
      padding: 10px 14px;
      font-size: 12.5px;
      color: #92400e;
      line-height: 1.5;
      margin-bottom: 14px;
    }

    /* 4. Footer Bar with QR and Official Disclaimer */
    .sheet-footer-bar {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 12px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
    }
    .footer-text-col {
      flex: 1;
      min-width: 280px;
    }
    .footer-qr-col {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 6px 12px;
      border-radius: 6px;
      flex-shrink: 0;
    }
    .qr-img-box {
      width: 52px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-img-box svg {
      width: 52px;
      height: 52px;
      display: block;
    }

    /* Category Switching */
    .category-section-block {
      display: none;
    }
    .category-section-block.active {
      display: block;
      animation: fadeIn 0.25s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Lightbox Modal */
    #globalLightbox {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.88);
      backdrop-filter: blur(8px);
      z-index: 99999;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    #globalLightbox.active {
      display: flex;
      opacity: 1;
    }
    .lightbox-card {
      background: #ffffff;
      border-radius: 12px;
      max-width: 1050px;
      width: 100%;
      max-height: 92vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .lightbox-head {
      padding: 14px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .lightbox-head h3 { font-size: 16px; font-weight: 800; color: #0f172a; }
    .lightbox-close {
      background: #e2e8f0;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #334155;
      transition: var(--transition);
    }
    .lightbox-close:hover { background: #ef4444; color: #fff; }
    .lightbox-body {
      padding: 20px;
      overflow-y: auto;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lightbox-body img {
      max-width: 100%;
      max-height: 75vh;
      object-fit: contain;
    }
    .lightbox-foot {
      padding: 10px 20px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }

    /* ==========================================================================
       DEDICATED EXACT SINGLE-PAGE PRINT SYSTEM (@media print)
       Guarantees ZERO cut-off and 100% exact 1 A4 page fit!
       ========================================================================== */
    #printContainer {
      display: none;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 6mm 8mm; /* Optimized exact printable margin */
      }

      body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .top-header, .nav-wrapper, .search-bar-wrap, .main-container, #globalLightbox {
        display: none !important;
      }

      #printContainer {
        display: block !important;
        width: 100% !important;
        height: 283mm !important;
        max-height: 283mm !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
        box-sizing: border-box !important;
      }

      #printContainer .official-sheet {
        height: 100% !important;
        max-height: 100% !important;
        border: 1.5px solid #0f172a !important;
        border-radius: 4px !important;
        box-shadow: none !important;
        margin: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }

      #printContainer .sheet-header-bar {
        padding: 8px 14px !important;
        border-bottom: 1px solid #cbd5e1 !important;
        background: #f8fafc !important;
        flex: 0 0 auto !important;
      }
      #printContainer .sheet-tag {
        font-size: 8.5pt !important;
        font-weight: 700 !important;
        color: #475569 !important;
      }
      #printContainer .sheet-title {
        font-size: 13pt !important;
        font-weight: 800 !important;
        color: #0f172a !important;
        margin-top: 2px !important;
      }
      #printContainer .btn-sheet-action, 
      #printContainer .diagram-zoom-badge {
        display: none !important;
      }

      #printContainer .sheet-diagram-banner {
        padding: 4px 12px !important;
        background: #ffffff !important;
        border-bottom: 1px solid #cbd5e1 !important;
        text-align: center !important;
        flex: 1 1 auto !important;
        min-height: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
      }
      #printContainer .sheet-diagram-title {
        font-size: 9.5pt !important;
        font-weight: 800 !important;
        margin-bottom: 3px !important;
      }
      #printContainer .diagram-img-box {
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        max-height: 110mm !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      #printContainer .diagram-img-box img {
        max-height: 105mm !important;
        max-width: 100% !important;
        object-fit: contain !important;
      }

      #printContainer .sheet-body-content {
        padding: 6px 14px !important;
        background: #ffffff !important;
        flex: 0 0 auto !important;
      }
      #printContainer .sheet-summary-heading {
        font-size: 8.5pt !important;
        font-weight: 800 !important;
        margin-bottom: 3px !important;
      }
      #printContainer .summary-spec-table {
        font-size: 8pt !important;
        margin-bottom: 4px !important;
      }
      #printContainer .summary-spec-table th, 
      #printContainer .summary-spec-table td {
        padding: 3px 6px !important;
      }
      #printContainer .summary-spec-table th {
        width: 18% !important;
        background: #f1f5f9 !important;
      }
      #printContainer .checkpoints-grid {
        gap: 3px !important;
        margin-bottom: 4px !important;
      }
      #printContainer .checkpoint-card {
        padding: 3px 6px !important;
        font-size: 7.5pt !important;
        line-height: 1.3 !important;
        border: 1px solid #e2e8f0 !important;
      }
      #printContainer .checkpoint-badge {
        font-size: 6.5pt !important;
        padding: 1px 3px !important;
      }
      #printContainer .sheet-warning-box {
        padding: 4px 8px !important;
        font-size: 7.5pt !important;
        line-height: 1.35 !important;
        margin-bottom: 4px !important;
        border-left-width: 3px !important;
        background: #fffbeb !important;
      }

      #printContainer .sheet-footer-bar {
        padding: 6px 14px !important;
        background: #f8fafc !important;
        border-top: 1px solid #cbd5e1 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        font-size: 6.8pt !important;
        line-height: 1.3 !important;
        flex: 0 0 auto !important;
      }
      #printContainer .footer-text-col {
        max-width: 82% !important;
      }
      #printContainer .footer-qr-col {
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 3px 6px !important;
        border: 1px solid #cbd5e1 !important;
        background: #ffffff !important;
      }
      #printContainer .qr-img-box {
        width: 44px !important;
        height: 44px !important;
      }
      #printContainer .qr-img-box svg {
        width: 44px !important;
        height: 44px !important;
      }
    }
  </style>
</head>
<body>

  <!-- Top Brand Banner -->
  <header class="top-header">
    <div class="header-container">
      <div class="brand-badge">
        <span>●</span> SAMSUNG ELECTRONICS OFFICIAL INSTALLATION ARCHIVE
      </div>
      <h1 class="header-title">삼성전자 가전 설치주의사항 및 모델별 실측 가이드북</h1>
      <p class="header-desc">
        삼성전자 공식 설치가이드 PPT 원본 및 공식 홈페이지 스펙과 100% 일치하도록 구축된 공식 고객 안내용 실측 요약본입니다. 세탁기·건조기, 비스포크 키친핏, 식기세척기, 인덕션, 정수기 등 전 품목의 설치 치수와 중요 제한 조건을 한눈에 확인하고 A4 딱 1장으로 출력할 수 있습니다.
      </p>
      <div class="header-stats">
        <span class="stat-pill">📋 총 92개 공식 설치 가이드 시트 완벽 수록</span>
        <span class="stat-pill">📐 CAD 정면·측면 고화질 실측 도면 100% 연동</span>
        <span class="stat-pill">🖨️ A4 용지 딱 1장(Exact Single Page) 출력 보장</span>
        <span class="stat-pill">📱 스캔 가능한 공식 홈페이지 QR 코드 탑재</span>
        <span class="stat-pill">⚡ 인터넷 없는 현장에서도 100% 오프라인 작동</span>
      </div>
    </div>
  </header>

  <!-- Sticky Category Navigation Bar -->
  <nav class="nav-wrapper">
    <div class="nav-container">
      <div class="category-tabs" id="categoryTabs">
`;

// Build category tab buttons
let tabButtonsHtml = '';
let isFirst = true;
for (const [catKey, meta] of Object.entries(catMeta)) {
  const count = (data[catKey] || []).length;
  const activeClass = isFirst ? 'active' : '';
  tabButtonsHtml += `
        <button class="tab-btn ${activeClass}" data-cat="${catKey}">
          ${meta.icon}
          ${meta.name} (${count})
        </button>`;
  isFirst = false;
}

const searchHtml = `
      </div>
    </div>
  </nav>

  <!-- Search and Quick Filter Section -->
  <div class="search-bar-wrap">
    <div class="search-card">
      <div class="search-input-box">
        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <input type="text" id="searchInput" class="search-input" placeholder="모델명, 품목, 치수 검색 (예: AI 콤보, 키친핏 41, 14인용, 560x480, 통버블, 정수기)...">
      </div>
      <div class="filter-chips">
        <span class="chip" onclick="applySearch('AI 콤보')">AI 콤보</span>
        <span class="chip" onclick="applySearch('키친핏')">키친핏</span>
        <span class="chip" onclick="applySearch('트루빌트인')">트루빌트인</span>
        <span class="chip" onclick="applySearch('직렬 설치')">직렬 설치</span>
        <span class="chip" onclick="applySearch('병렬 설치')">병렬 설치</span>
        <span class="chip" onclick="applySearch('타공')">타공 560×480</span>
        <span class="chip" onclick="applySearch('정수기')">정수기</span>
        <span class="chip" onclick="applySearch('빌트인 오븐')">빌트인 오븐</span>
        <span class="chip" onclick="applySearch('')">전체보기</span>
      </div>
    </div>
  </div>

  <!-- Main Content Container -->
  <main class="main-container">
`;

// Build all category sections
let sectionsHtml = '';
isFirst = true;

for (const [catKey, meta] of Object.entries(catMeta)) {
  const slides = data[catKey] || [];
  const activeClass = isFirst ? 'active' : '';
  const qrSvg = qrMap[catKey] || '';
  const catUrl = meta.url;

  sectionsHtml += `
    <!-- Category Section: ${meta.name} -->
    <section class="category-section-block ${activeClass}" id="sec-${catKey}">
      <div class="section-header-banner">
        <div class="section-title-wrap">
          <div class="section-icon-box">
            ${meta.icon}
          </div>
          <div>
            <h2 class="section-title">${meta.name} 설치주의사항 & 모델별 실측 규격</h2>
            <p class="section-subtitle">${meta.desc}</p>
          </div>
        </div>
        <div style="font-size: 13px; font-weight: 700; color: #1e40af;">
          총 ${slides.length}개 공식 실측 가이드 시트
        </div>
      </div>

      <!-- Slides Sheets List -->
      <div class="sheets-list">
`;

  slides.forEach((s, idx) => {
    const parsed = parseSlide(s);
    if (!parsed) return;

    const sheetId = `sheet_${catKey}_${idx + 1}`;

    sectionsHtml += `
        <!-- Sheet ${idx + 1}: ${escapeHtml(parsed.title)} -->
        <article class="official-sheet" id="${sheetId}" data-keywords="${escapeHtml(parsed.tag + ' ' + parsed.title + ' ' + parsed.diagTitle + ' ' + parsed.modelDesc + ' ' + parsed.warning)}">
          <!-- 1. Header Bar -->
          <div class="sheet-header-bar">
            <div>
              <div class="sheet-tag">${escapeHtml(parsed.tag)}</div>
              <h3 class="sheet-title">${escapeHtml(parsed.title)}</h3>
            </div>
            <div class="sheet-actions">
              <button class="btn-sheet-action btn-zoom" onclick="openLightbox('${parsed.imageSrc}', '${escapeHtml(parsed.title)}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7h-1v2H7v1h2v2h1v-2h2V9h-2V7z"/></svg>
                도면 크게보기
              </button>
              <button class="btn-sheet-action btn-print" onclick="printExactSheet('${sheetId}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                A4 1장 출력
              </button>
            </div>
          </div>

          <!-- 2. Diagram Banner -->
          <div class="sheet-diagram-banner">
            <div class="sheet-diagram-title">${escapeHtml(parsed.diagTitle)}</div>
            <div class="diagram-img-box" onclick="openLightbox('${parsed.imageSrc}', '${escapeHtml(parsed.title)}')">
              <img src="${parsed.imageSrc}" alt="${escapeHtml(parsed.title)}" loading="lazy">
              <span class="diagram-zoom-badge">🔍 고해상도 확대</span>
            </div>
          </div>

          <!-- 3. Summary Content Body -->
          <div class="sheet-body-content">
            <div class="sheet-summary-heading">설치 가이드 요약</div>
`;

    if (parsed.modelDesc) {
      sectionsHtml += `
            <table class="summary-spec-table">
              <tbody>
                <tr>
                  <th>적용 모델</th>
                  <td><strong>${escapeHtml(parsed.modelDesc)}</strong></td>
                </tr>
              </tbody>
            </table>
`;
    }

    if (parsed.checkPoints && parsed.checkPoints.length > 0) {
      sectionsHtml += `
            <div class="checkpoints-grid">
`;
      parsed.checkPoints.forEach(cp => {
        sectionsHtml += `
              <div class="checkpoint-card">
                <span class="checkpoint-badge">${escapeHtml(cp.label)}</span>
                <div>${escapeHtml(cp.text)}</div>
              </div>
`;
      });
      sectionsHtml += `
            </div>
`;
    }

    if (parsed.warning) {
      sectionsHtml += `
            <div class="sheet-warning-box">
              <strong>⚠ 설치 유의사항 및 필수 조건:</strong><br>
              ${escapeHtml(parsed.warning)}
            </div>
`;
    }

    sectionsHtml += `
          </div>

          <!-- 4. Footer Bar with Scannable QR Code and Official Disclaimer -->
          <div class="sheet-footer-bar">
            <div class="footer-text-col">
              <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">
                삼성전자 고객센터 1588-3366   |   ${escapeHtml(parsed.tag)} 고객 안내용 요약본
              </div>
              <div style="font-size: 11px; color: #64748b; line-height: 1.4;">
                <strong>※ 공식 출처:</strong> <a href="${catUrl}" target="_blank" style="color: #1259a4; text-decoration: underline;">${catUrl}</a><br>
                <strong>※ 주의:</strong> 본 자료는 제품 설치 안내 요약본이며, 현장 조건 및 세부 파생 모델에 따라 실제 설치 조건이 상이할 수 있습니다. 설치 전 의심스러운 부분이나 최신 상세 규격은 반드시 삼성전자 공식 홈페이지를 참조하시기 바랍니다.
              </div>
            </div>
            <div class="footer-qr-col">
              <div class="qr-img-box">
                ${qrSvg}
              </div>
              <div style="font-size: 10px; font-weight: 700; color: #1e40af; text-align: center; line-height: 1.2;">
                공식 사이트<br>QR 연결
              </div>
            </div>
          </div>
        </article>
`;
  });

  sectionsHtml += `
      </div>
    </section>
`;

  isFirst = false;
}

const htmlFooter = `
  </main>

  <!-- Fullscreen Lightbox Modal -->
  <div id="globalLightbox" onclick="closeLightbox(event)">
    <div class="lightbox-card" onclick="event.stopPropagation()">
      <div class="lightbox-head">
        <h3 id="lightboxTitle">삼성전자 공식 실측 도면</h3>
        <button class="lightbox-close" onclick="closeLightbox(event)">&times;</button>
      </div>
      <div class="lightbox-body">
        <img id="lightboxImg" src="" alt="도면 확대">
      </div>
      <div class="lightbox-foot">
        <span>SAMSUNG ELECTRONICS OFFICIAL INSTALLATION MANUAL ARCHIVE</span>
        <span>ESC 키 또는 바깥 영역을 클릭하면 닫힙니다.</span>
      </div>
    </div>
  </div>

  <!-- Dedicated Single-Page Print Container -->
  <div id="printContainer"></div>

  <!-- JavaScript Interaction Logic -->
  <script>
    // Tab Switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const secBlocks = document.querySelectorAll('.category-section-block');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-cat');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        secBlocks.forEach(sec => {
          sec.classList.remove('active');
          if (sec.id === 'sec-' + cat) {
            sec.classList.add('active');
          }
        });
        window.scrollTo({ top: 180, behavior: 'smooth' });
      });
    });

    // Search and Filter
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      applySearch(e.target.value);
    });

    function applySearch(keyword) {
      searchInput.value = keyword;
      const term = keyword.trim().toLowerCase();
      const allSheets = document.querySelectorAll('.official-sheet');

      if (!term) {
        allSheets.forEach(s => s.style.display = 'flex');
        return;
      }

      // If searching, show all category blocks that have matches
      secBlocks.forEach(sec => sec.classList.add('active'));

      allSheets.forEach(sheet => {
        const text = (sheet.getAttribute('data-keywords') || '').toLowerCase();
        if (text.includes(term)) {
          sheet.style.display = 'flex';
        } else {
          sheet.style.display = 'none';
        }
      });
    }

    // Lightbox Controls
    function openLightbox(src, title) {
      document.getElementById('lightboxImg').src = src;
      document.getElementById('lightboxTitle').textContent = title || '삼성전자 공식 실측 도면';
      const box = document.getElementById('globalLightbox');
      box.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox(e) {
      if (e) e.stopPropagation();
      const box = document.getElementById('globalLightbox');
      box.classList.remove('active');
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    // Exact 1-Page A4 Print System
    function printExactSheet(sheetId) {
      const targetSheet = document.getElementById(sheetId);
      if (!targetSheet) return;

      const printContainer = document.getElementById('printContainer');
      printContainer.innerHTML = targetSheet.outerHTML;

      // Trigger Print directly
      window.print();
    }
  </script>
</body>
</html>`;

const finalHtml = htmlHeader + tabButtonsHtml + searchHtml + sectionsHtml + htmlFooter;
fs.writeFileSync('c:/jincenchoproject/samsung_appliance_install_guide.html', finalHtml, 'utf8');

console.log('SUCCESS! Perfected 1-page fit HTML generated.');
console.log('Total file size:', finalHtml.length, 'bytes');
