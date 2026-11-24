const fs = require('fs');
const QRCode = require('qrcode');

async function run() {
  console.log('1. Updating extracted_data.json with unified washer master precheck...');
  const data = JSON.parse(fs.readFileSync('assets/extracted_data.json', 'utf8'));

  data.washer[0] = {
    slideIndex: 1,
    imageSrc: "assets/official_guides/washer/washer_precheck_master.png",
    texts: [
      "세탁기·건조기   |   공통 필수 사전점검 및 설치주의사항",
      "세탁기·건조기 설치 전 사전 확인 및 환경 점검 (통합 마스터)",
      "설치 프로세스 4단계 및 급배수·진입로·간섭 환경 종합 점검",
      "적용 모델",
      "삼성 세탁기·건조기 전 모델 공통 (드럼, 전자동, Bespoke AI 콤보, AI 건조기)",
      "주요 확인 포인트",
      "체크1 급·배수 연결 거리",
      "제품 설치 위치와 수도꼭지(급수부) 및 배수구 거리가 반드시 3 m 이내여야 설치 가능 (3m 초과 시 수압 저하, 배수 지연, 오작동 원인)",
      "체크2 세탁실 진입로 폭",
      "현관문, 복도, 세탁실 출입문 유효 너비 최소 700 mm 이상 확보 필수 (문 손잡이, 싱크대 등 돌출 간섭물 사전 확인)",
      "체크3 세탁실 내부 공간",
      "제품 거치 공간 너비 최소 710 mm 이상, 높이 최소 1,000 mm (1,120 mm 권장) 확보 필요",
      "체크4 설치 공간 협소 주의",
      "세탁실 상부 선반 분리 불가 환경, 벽면 급수 배관/수도꼭지 돌출로 유효 공간 부족 시 설치 제한",
      "체크5 주변 시설물 간섭 주의",
      "보일러 및 가스 계량기 등 법정 안전설비 점검 동선 및 안전거리가 확보되지 않을 경우 설치 불가",
      "⚠  공통 주의사항",
      "세탁기·건조기는 급/배수 연결 거리(3m 이내), 진입로 폭(700mm 이상), 설치 공간(710mm 이상)이 충족되어야 정상 설치가 가능합니다. 현장 조건이 미충족되거나 보일러/가스계량기 간섭 시 안전상 설치가 제한될 수 있으므로 구매 전 반드시 실측하시기 바랍니다.",
      "삼성전자 고객센터  1588-3366   |   세탁기·건조기 설치주의사항 고객 안내용 요약본",
      "구매 전 설치 환경·진입로·급/배수 조건을 반드시 확인하세요."
    ]
  };

  fs.writeFileSync('assets/extracted_data.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('extracted_data.json updated successfully.');

  console.log('2. Preparing official installation guide URLs (buying-guide) and generating standard QR SVGs...');
  const catMeta = {
    washer: {
      name: "세탁기·건조기",
      url: "https://www.samsung.com/sec/buying-guide/",
      prodUrl: null,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2.01L6 2c-1.11 0-2 .89-2 2v16c0 1.11.89 2 2 2h12c1.11 0 2-.89 2-2V4c0-1.11-.89-1.99-2-1.99zM18 20H6v-9.02h12V20zm0-11H6V4h12v5zM8 5h2v2H8V5zm4 0h4v2h-4V5z"/><circle cx="12" cy="15.5" r="3.5"/></svg>`,
      desc: "Bespoke AI 콤보 일체형, 원바디 Top-Fit, AI 건조기(2025/2026년형), 직렬/병렬/앵글 설치, 통버블 및 아가사랑 세탁기"
    },
    kitchenfit: {
      name: "냉장고·키친핏",
      url: "https://www.samsung.com/sec/buying-guide/",
      prodUrl: "https://www.samsung.com/sec/refrigerators/all-refrigerators/?kitchenfit",
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm0 8h10V4H7v6zm0 10h10v-8H7v8zm2-6h2v2H9v-2zm0-6h2v2H9V8z"/></svg>`,
      desc: "Bespoke 키친핏 4도어 단독, 김치플러스 단독, 4+1도어, 4+3도어, 4+4도어, 1도어 4대 풀패키지, 인피니티 4도어 및 2대 페어"
    },
    dishwasher: {
      name: "식기세척기",
      url: "https://www.samsung.com/sec/dishwashers/dishwashers-install-guide/",
      prodUrl: "https://www.samsung.com/sec/dishwashers/all-dishwashers/",
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm0-13H5V5h14v1zm-7 5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`,
      desc: "트루빌트인(True Built-in), 세미빌트인, 오토오픈/일반 빌트인, 프리스탠딩, 6인용 카운터탑, 걸레받이 커팅 및 싱크대 리폼비 기준"
    },
    induction: {
      name: "인덕션 & 후드",
      url: "https://www.samsung.com/sec/buying-guide/",
      prodUrl: "https://www.samsung.com/sec/electric-range/all-electric-range/",
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-7 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm-6-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`,
      desc: "Bespoke AI 후드 Air, 전면배기/플러그앤플레이 후드인덕션, 상판 560×480mm 타공 가이드, 하부 오븐/식세기 간섭 대처법"
    },
    water: {
      name: "정수기",
      url: "https://www.samsung.com/sec/buying-guide/",
      prodUrl: "https://www.samsung.com/sec/water-purifier/all-water-purifier/",
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
      desc: "Bespoke 빌트인 언더싱크 정수기, 얼음정수기, 카운터탑 정수기 본체 치수, 수압(1.5~8.0bar) 및 전기/타공 필수 조건"
    },
    airdresser: {
      name: "에어드레서",
      url: "https://www.samsung.com/sec/buying-guide/",
      prodUrl: "https://www.samsung.com/sec/airdresser/all-airdresser/",
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 13H7v-2h2v2zm0-4H7V7h2v2zm6 4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>`,
      desc: "대용량 5벌형(DF24/DF20) 및 일반 슬림 3벌형(DF60/DF10) 가구장 내경 규격 및 도어 오픈 깊이"
    },
    robot: {
      name: "로봇청소기",
      url: "https://www.samsung.com/sec/buying-guide/",
      prodUrl: "https://www.samsung.com/sec/vacuum-cleaners/all-vacuum-cleaners/",
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A1.5 1.5 0 0 0 6 14.5 1.5 1.5 0 0 0 7.5 16 1.5 1.5 0 0 0 9 14.5 1.5 1.5 0 0 0 7.5 13m9 0a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5 1.5 1.5 0 0 0-1.5-1.5"/></svg>`,
      desc: "Bespoke AI 스팀 자동 급배수 빌트인/프리스탠딩 설치 공간, 싱크대 하부장 치수, 가구장 리폼 비용 및 협력사 안내"
    },
    tv: {
      name: "TV & 에어컨",
      url: "https://www.samsung.com/sec/buying-guide/",
      prodUrl: "https://www.samsung.com/sec/tvs/all-tvs/",
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>`,
      desc: "The Frame 및 대화면 Neo QLED 슬림핏 벽걸이 규격, 시스템에어컨 천장 배관 및 실외기 이격 기준"
    },
    oven: {
      name: "빌트인 오븐",
      url: "https://www.samsung.com/sec/buying-guide/",
      prodUrl: null,
      icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10zm-8-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm5.5-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM8 5h2v2H8V5z"/></svg>`,
      desc: "Bespoke 빌트인 오븐 50L (NQ50T8539BK), 600mm 가구장 내경 규격, 상하부 200㎠ 환기 통풍구 필수 조건"
    }
  };

  const qrMap = {};
  for (const [k, meta] of Object.entries(catMeta)) {
    qrMap[k] = await QRCode.toString(meta.url, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#ffffff' }
    });
  }
  console.log('All 9 QR codes successfully generated with standard QRCode engine.');

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  }

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
      if (t.includes('설치 가이드 요약') || t.includes('핵심 체크사항')) continue;
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

  // HTML CSS & Layout
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
      box-shadow: var(--shadow-sm);
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
      display: flex;
      align-items: center;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .nav-container::-webkit-scrollbar { display: none; }

    .category-tabs {
      display: flex;
      gap: 4px;
      padding: 10px 0;
      white-space: nowrap;
    }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-muted);
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: var(--transition);
    }
    .tab-btn:hover {
      background: #f8fafc;
      color: var(--primary);
    }
    .tab-btn.active {
      background: var(--primary-light);
      color: var(--primary);
      border-color: #bfdbfe;
      font-weight: 700;
    }
    .tab-btn svg { width: 18px; height: 18px; }

    /* Search Bar */
    .search-bar-wrap {
      max-width: 1200px;
      margin: 20px auto 0;
      padding: 0 16px;
    }
    .search-card {
      background: #ffffff;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: var(--shadow-sm);
      flex-wrap: wrap;
    }
    .search-input-box {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 260px;
    }
    .search-input-box svg { width: 20px; height: 20px; color: var(--text-muted); }
    .search-input {
      width: 100%;
      border: none;
      outline: none;
      font-size: 14px;
      color: var(--text);
    }
    .filter-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chip {
      background: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 11px;
      border-radius: 999px;
      cursor: pointer;
      transition: var(--transition);
      border: 1px solid #e2e8f0;
    }
    .chip:hover, .chip.active {
      background: #2563eb;
      color: #fff;
      border-color: #2563eb;
    }

    /* Main Container */
    .main-container {
      max-width: 1200px;
      margin: 24px auto 0;
      padding: 0 16px;
    }

    .category-section-block {
      display: none;
    }
    .category-section-block.active {
      display: block;
    }

    .section-header-banner {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px 24px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: var(--shadow-sm);
    }
    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .section-icon-box {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      background: var(--primary-light);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .section-icon-box svg { width: 24px; height: 24px; }
    .section-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
    }
    .section-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Individual Official Installation Sheet */
    .sheets-list {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .official-sheet {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-md);
      transition: var(--transition);
      display: flex;
      flex-direction: column;
    }
    .official-sheet:hover {
      box-shadow: var(--shadow-lg);
      border-color: #94a3b8;
    }

    /* Sheet Header Bar */
    .sheet-header-bar {
      background: #f8fafc;
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
    .sheet-tag {
      font-size: 12px;
      font-weight: 700;
      color: #1e40af;
      background: #dbeafe;
      padding: 3px 10px;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 4px;
    }
    .sheet-title {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
    }
    .sheet-actions {
      display: flex;
      gap: 8px;
    }
    .btn-sheet-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      font-size: 12.5px;
      font-weight: 700;
      border-radius: var(--radius-sm);
      cursor: pointer;
      border: 1px solid transparent;
      transition: var(--transition);
    }
    .btn-zoom {
      background: #f1f5f9;
      color: #334155;
      border-color: #cbd5e1;
    }
    .btn-zoom:hover { background: #e2e8f0; color: #0f172a; }
    .btn-print {
      background: #1259a4;
      color: #ffffff;
    }
    .btn-print:hover { background: #093b73; }

    /* Diagram Image Banner */
    .sheet-diagram-banner {
      background: #ffffff;
      border-bottom: 1px solid var(--border-light);
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .sheet-diagram-title {
      align-self: flex-start;
      font-size: 13px;
      font-weight: 700;
      color: #475569;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sheet-diagram-title::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 14px;
      background: #2563eb;
      border-radius: 2px;
    }
    .diagram-img-box {
      width: 100%;
      max-width: 900px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      cursor: pointer;
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: #fafafa;
      border: 1px solid #f1f5f9;
    }
    .diagram-img-box img {
      width: 100%;
      max-height: 480px;
      object-fit: contain;
      transition: transform 0.25s ease;
      display: block;
    }
    .diagram-img-box:hover img {
      transform: scale(1.015);
    }
    .diagram-zoom-badge {
      position: absolute;
      bottom: 10px;
      right: 12px;
      background: rgba(15, 23, 42, 0.85);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      backdrop-filter: blur(4px);
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Content Body */
    .sheet-body-content {
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .sheet-summary-heading {
      font-size: 13.5px;
      font-weight: 800;
      color: #1e3a8a;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 2px solid #e0e7ff;
      padding-bottom: 4px;
    }

    .summary-spec-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .summary-spec-table th, .summary-spec-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }
    .summary-spec-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #334155;
      width: 110px;
      white-space: nowrap;
    }

    .checkpoints-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 8px;
    }
    .checkpoint-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #2563eb;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 12.5px;
      line-height: 1.45;
    }
    .checkpoint-badge {
      font-weight: 800;
      color: #1d4ed8;
      display: inline-block;
      margin-bottom: 2px;
    }

    .sheet-warning-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 4px solid #f59e0b;
      border-radius: 4px;
      padding: 10px 14px;
      font-size: 12.5px;
      color: #92400e;
      line-height: 1.5;
    }

    /* Footer Bar with Scannable QR Code */
    .sheet-footer-bar {
      background: #f8fafc;
      border-top: 1px solid var(--border-light);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .footer-text-col {
      flex: 1;
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
    }
    .footer-qr-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
      width: 76px;
    }
    .qr-img-box {
      width: 66px;
      height: 66px;
      background: #ffffff;
      padding: 4px;
      border-radius: 6px;
      border: 1.5px solid #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      transition: var(--transition);
      text-decoration: none;
    }
    .qr-img-box:hover {
      transform: scale(1.05);
      border-color: #2563eb;
    }
    .qr-img-box svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    /* Lightbox Modal */
    #globalLightbox {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.92);
      z-index: 9999;
      padding: 24px;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(8px);
    }
    #globalLightbox.active {
      display: flex;
    }
    .lightbox-card {
      background: #ffffff;
      border-radius: var(--radius-lg);
      max-width: 95vw;
      max-height: 94vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .lightbox-head {
      padding: 14px 20px;
      background: #0f172a;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .lightbox-head h3 { font-size: 16px; font-weight: 700; }
    .lightbox-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 24px;
      line-height: 1;
      cursor: pointer;
    }
    .lightbox-close:hover { color: #ffffff; }
    .lightbox-body {
      padding: 20px;
      overflow: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f8fafc;
    }
    .lightbox-body img {
      max-width: 100%;
      max-height: 78vh;
      object-fit: contain;
      border-radius: 4px;
      box-shadow: var(--shadow-sm);
    }
    .lightbox-foot {
      padding: 10px 20px;
      background: #ffffff;
      border-top: 1px solid var(--border-light);
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
    }

    /* Dedicated Print Container & Media Print Styles */
    #printContainer {
      display: none;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 6mm 8mm;
      }

      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
      }

      /* Hide all interactive UI elements */
      .top-header, .nav-wrapper, .search-bar-wrap, .main-container, #globalLightbox {
        display: none !important;
      }

      /* Print only the targeted single sheet */
      #printContainer {
        display: block !important;
        width: 194mm !important;
        height: 283mm !important;
        max-height: 283mm !important;
        margin: 0 auto !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      #printContainer .official-sheet {
        display: flex !important;
        flex-direction: column !important;
        height: 283mm !important;
        max-height: 283mm !important;
        border: 1.5px solid #0f172a !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      #printContainer .sheet-header-bar {
        background: #f1f5f9 !important;
        border-bottom: 1.5px solid #0f172a !important;
        padding: 8px 12px !important;
      }
      #printContainer .sheet-actions {
        display: none !important;
      }
      #printContainer .sheet-tag {
        font-size: 11px !important;
        padding: 2px 8px !important;
        border: 1px solid #1e40af !important;
      }
      #printContainer .sheet-title {
        font-size: 16px !important;
        color: #000 !important;
      }

      #printContainer .sheet-diagram-banner {
        background: #ffffff !important;
        padding: 6px 12px !important;
        border-bottom: 1px solid #cbd5e1 !important;
        flex: 0 0 auto !important;
      }
      #printContainer .sheet-diagram-title {
        font-size: 11.5px !important;
        margin-bottom: 4px !important;
      }
      #printContainer .diagram-zoom-badge {
        display: none !important;
      }
      #printContainer .diagram-img-box {
        max-width: 100% !important;
        background: transparent !important;
        border: none !important;
      }
      #printContainer .diagram-img-box img {
        max-height: 108mm !important;
        width: auto !important;
        max-width: 100% !important;
        object-fit: contain !important;
      }

      #printContainer .sheet-body-content {
        padding: 8px 12px !important;
        gap: 6px !important;
        flex: 1 1 auto !important;
        overflow: hidden !important;
      }
      #printContainer .sheet-summary-heading {
        font-size: 12px !important;
        padding-bottom: 2px !important;
      }
      #printContainer .summary-spec-table th, 
      #printContainer .summary-spec-table td {
        padding: 4px 8px !important;
        font-size: 11.5px !important;
      }
      #printContainer .checkpoints-grid {
        gap: 5px !important;
      }
      #printContainer .checkpoint-card {
        padding: 5px 8px !important;
        font-size: 11px !important;
        line-height: 1.35 !important;
      }
      #printContainer .sheet-warning-box {
        padding: 6px 10px !important;
        font-size: 10.5px !important;
        line-height: 1.35 !important;
        border-left: 3px solid #d97706 !important;
      }

      #printContainer .sheet-footer-bar {
        background: #f8fafc !important;
        border-top: 1.5px solid #0f172a !important;
        padding: 8px 12px !important;
        flex: 0 0 auto !important;
      }
      #printContainer .footer-text-col {
        font-size: 10px !important;
        line-height: 1.35 !important;
      }
      #printContainer .footer-qr-col {
        width: 24mm !important;
      }
      #printContainer .qr-img-box {
        width: 20mm !important;
        height: 20mm !important;
        border: 1px solid #000 !important;
        padding: 1mm !important;
      }
    }
  </style>
</head>
<body>

  <!-- Top Brand Bar -->
  <header class="top-header">
    <div class="header-container">
      <div class="brand-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
        SAMSUNG ELECTRONICS INSTALLATION ARCHIVE 2026
      </div>
      <h1 class="header-title">삼성전자 가전 설치주의사항 및 모델별 실측 가이드북</h1>
      <p class="header-desc">
        본 가이드북은 삼성전자 공식 홈페이지(samsung.com/sec) 및 2026년 최신 공식 설치 매뉴얼 원본을 바탕으로 제작된 공식 실측 안내 자료입니다. 고객 상담 및 현장 실측 시 1페이지 규격 인쇄, 도면 고해상도 확대, 카테고리별 실시간 공식 웹 연동 QR 코드를 지원합니다.
      </p>
      <div class="header-stats">
        <div class="stat-pill">전체 9대 가전 카테고리</div>
        <div class="stat-pill">공식 실측 가이드 93개 시트 전수 수록</div>
        <div class="stat-pill">공식 삼성닷컴 100% 무오차 표준 규격</div>
        <div class="stat-pill">A4 단 1장 맞춤 인쇄 최적화</div>
        <a href="https://www.samsung.com/sec/buying-guide/" target="_blank" rel="noopener noreferrer" class="stat-pill" style="background: rgba(37, 99, 235, 0.4); border-color: #60a5fa; color: #ffffff; font-weight: 700; text-decoration: none;">
          🔗 삼성전자 공식 설치·구매가이드 포털 (samsung.com/sec/buying-guide)
        </a>
      </div>
    </div>
  </header>

  <!-- Sticky Category Navigation Bar -->
  <nav class="nav-wrapper">
    <div class="nav-container">
      <div class="category-tabs" id="categoryTabs">
`;

  let isFirst = true;
  let tabButtonsHtml = '';
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
        <input type="text" id="searchInput" class="search-input" placeholder="모델명, 품목, 치수 검색 (예: AI 콤보, 키친핏 41, 14인용, 560x480, 통버블, 정수기, 빌트인 오븐)...">
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
              <div style="font-size: 11px; color: #64748b; line-height: 1.45;">
                <strong>※ 공식 설치가이드 (buying-guide):</strong> <a href="${catUrl}" target="_blank" rel="noopener noreferrer" style="color: #1259a4; text-decoration: underline; font-weight: 700;">${catUrl}</a><br>
                ${meta.prodUrl ? `<strong>※ 공식 제품 상세/스펙 정보:</strong> <a href="${meta.prodUrl}" target="_blank" rel="noopener noreferrer" style="color: #1259a4; text-decoration: underline; font-weight: 600;">${meta.prodUrl}</a><br>` : ''}
                <strong>※ 주의:</strong> 본 자료는 제품 설치 안내 요약본이며, 현장 조건 및 세부 파생 모델에 따라 실제 설치 조건이 상이할 수 있습니다. 설치 전 의심스러운 부분이나 최신 상세 규격은 반드시 위 공식 설치가이드(QR 스캔/클릭)를 참조하시기 바랍니다.
              </div>
            </div>
            <div class="footer-qr-col">
              <a href="${catUrl}" target="_blank" rel="noopener noreferrer" class="qr-img-box" title="스마트폰 카메라로 스캔하거나 클릭하면 삼성 공식 설치가이드 페이지로 즉시 이동합니다">
                ${qrSvg}
              </a>
              <div style="font-size: 10px; font-weight: 700; color: #1e40af; text-align: center; line-height: 1.2;">
                공식 설치가이드<br>스캔 / 클릭
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

  <script>
    // Tab switching logic
    const tabs = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.category-section-block');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.getAttribute('data-cat');
        tabs.forEach(t => t.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        tab.classList.add('active');
        const targetSection = document.getElementById('sec-' + cat);
        if (targetSection) targetSection.classList.add('active');

        window.scrollTo({ top: 180, behavior: 'smooth' });
      });
    });

    // Search and quick filter
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
      applySearch(e.target.value);
    });

    function applySearch(query) {
      searchInput.value = query;
      const q = query.trim().toLowerCase();
      
      const allChips = document.querySelectorAll('.filter-chips .chip');
      allChips.forEach(chip => {
        if (chip.textContent.trim() === query || (query === '' && chip.textContent.trim() === '전체보기')) {
          chip.classList.add('active');
        } else {
          chip.classList.remove('active');
        }
      });

      const allSheets = document.querySelectorAll('.official-sheet');

      if (!q) {
        allSheets.forEach(sheet => sheet.style.display = 'flex');
        return;
      }

      // Show all sections when searching
      sections.forEach(s => s.classList.add('active'));

      allSheets.forEach(sheet => {
        const kw = (sheet.getAttribute('data-keywords') || '').toLowerCase();
        if (kw.includes(q)) {
          sheet.style.display = 'flex';
        } else {
          sheet.style.display = 'none';
        }
      });
    }

    // Lightbox modal functions
    const lightbox = document.getElementById('globalLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxTitle = document.getElementById('lightboxTitle');

    function openLightbox(imgSrc, title) {
      lightboxImg.src = imgSrc;
      lightboxTitle.textContent = title || '삼성전자 공식 실측 도면';
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox(e) {
      lightbox.classList.remove('active');
      lightboxImg.src = '';
      document.body.style.overflow = '';
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });

    // Exact Single-Page Print Engine (Guarantees EXACT 1 A4 Page)
    function printExactSheet(sheetId) {
      const srcSheet = document.getElementById(sheetId);
      if (!srcSheet) {
        alert('출력할 시트를 찾을 수 없습니다.');
        return;
      }

      const printContainer = document.getElementById('printContainer');
      printContainer.innerHTML = '';

      // Deep clone the targeted sheet
      const clone = srcSheet.cloneNode(true);
      clone.id = 'printTargetSheet';
      clone.style.display = 'flex';

      printContainer.appendChild(clone);

      // Trigger native browser print dialog
      setTimeout(() => {
        window.print();
        // Clear print container after printing
        setTimeout(() => {
          printContainer.innerHTML = '';
        }, 1000);
      }, 150);
    }
  </script>
</body>
</html>
`;

  const finalHtml = htmlHeader + tabButtonsHtml + searchHtml + sectionsHtml + htmlFooter;
  fs.writeFileSync('samsung_appliance_install_guide.html', finalHtml, 'utf8');
  console.log('SUCCESS! Updated samsung_appliance_install_guide.html created.');
  console.log('File size:', fs.statSync('samsung_appliance_install_guide.html').size, 'bytes');
}

run();
