import React, { useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import { DEPT_POS_BARCODES } from '../constants/deptBarcodes';
import { BRAND_LOGO_B64, MANAGER_PROFILE_B64 } from '../constants/brandAssets';
import {
  Lock,
  Unlock,
  Calculator,
  Printer,
  Camera,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Award,
  Phone,
  MapPin,
  MessageCircle,
  FileCheck2,
  ChevronRight,
  ShieldCheck,
  Wrench,
  Percent,
  Plus,
  Trash2,
  Save,
  FolderOpen,
  Download,
  Upload,
  Share2,
  X,
  Smartphone,
  Maximize2,
  Scale,
  Layers,
  ShoppingBag,
  Receipt,
  Sliders
} from 'lucide-react';

// 숫자를 한국어 단위(억/만/원) 보조 텍스트로 변환
function formatKoreanCurrencyHint(num) {
  const n = Number(num) || 0;
  if (n <= 0) return '0원';
  const eok = Math.floor(n / 100000000);
  const man = Math.floor((n % 100000000) / 10000);
  const rest = n % 10000;

  const parts = [];
  if (eok > 0) parts.push(`${eok.toLocaleString()}억`);
  if (man > 0) parts.push(`${man.toLocaleString()}만`);
  if (rest > 0) parts.push(`${rest.toLocaleString()}`);
  return `${parts.join(' ')}원`;
}

function formatWon(num) {
  const n = Math.round(Number(num) || 0);
  return `${n.toLocaleString('ko-KR')}원`;
}

// 원리금 균등상환 기준 카드 장기할부 월 납부액 및 총 할부이자 계산
function calculateCardInstallment(principal, annualRatePercent, months) {
  const P = Math.max(0, Number(principal) || 0);
  const n = Math.max(1, Number(months) || 1);
  const rate = Math.max(0, Number(annualRatePercent) || 0);

  if (P === 0) {
    return { monthly: 0, totalPayment: 0, totalInterest: 0 };
  }
  if (rate === 0) {
    const monthly = Math.round(P / n);
    return { monthly, totalPayment: P, totalInterest: 0 };
  }

  const monthlyRate = rate / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, n);
  const exactMonthly = (P * monthlyRate * factor) / (factor - 1);
  const monthly = Math.round(exactMonthly);
  const totalPayment = monthly * n;
  const totalInterest = Math.max(0, totalPayment - P);

  return { monthly, totalPayment, totalInterest };
}

// 바코드 SVG 생성 컴포넌트 (캐셔 POS 전달용 백업)
function BarcodeSvg({ value = '1041315089', width = 230, height = 44 }) {
  const pattern = [
    2, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 1, 2, 1, 2, 2, 1, 3, 2, 1, 1, 2, 1, 1, 3, 2, 1, 1, 2, 2,
    1, 2, 3, 1, 1, 2, 1, 1, 2, 3, 1, 2, 2, 1, 1, 3, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1, 2, 2, 1, 3
  ];
  let x = 8;
  const bars = [];
  pattern.forEach((w, i) => {
    if (i % 2 === 0) {
      bars.push(<rect key={i} x={x} y="0" width={w * 2.1} height={height} fill="#0f172a" />);
    }
    x += w * 2.1;
  });

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
      <svg width={width} height={height} viewBox={`0 0 ${x + 8} ${height}`}>
        {bars}
      </svg>
      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '4px', color: '#0f172a', marginTop: '3px' }}>
        * {value} *
      </span>
    </div>
  );
}

// 금액 입력 컴포넌트 (콤마 자동 포맷 + 원화 단위 보조 텍스트)
function MoneyInput({ value, onChange, placeholder = '0', accentColor = 'var(--accent-gold)', compact = false }) {
  const numericValue = Number(value) || 0;
  const displayValue = numericValue === 0 ? '' : numericValue.toLocaleString('ko-KR');

  const handleTextChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(raw ? parseInt(raw, 10) : 0);
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid var(--glass-border)',
          borderRadius: '10px',
          padding: compact ? '0.5rem 0.75rem' : '0.68rem 0.85rem',
          gap: '0.4rem',
          transition: 'border-color 0.2s'
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          style={{
            flex: 1,
            width: '100%',
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'white',
            fontSize: compact ? '1rem' : '1.12rem',
            fontWeight: 700,
            textAlign: 'right'
          }}
        />
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, flexShrink: 0 }}>원</span>
      </div>
    </div>
  );
}

const EVENT_TYPE_INFO = {
  wedding: {
    key: 'wedding',
    title: '혼수 (웨딩)',
    desc: '예식장 계약서, 청첩장, 혼인관계증명서 등으로 증빙 가능',
    badge: '💍 혼수가전 특별 혜택 대상'
  },
  moving_in: {
    key: 'moving_in',
    title: '입주',
    desc: '아파트 공급/분양계약서, 입주예정확인원 등으로 증빙 가능',
    badge: '🏢 입주가전 특별 혜택 대상'
  },
  moving: {
    key: 'moving',
    title: '이사',
    desc: '부동산 매매/임대차계약서, 이사 견적서 등으로 증빙 가능',
    badge: '🚚 이사가전 특별 혜택 대상'
  },
  normal: {
    key: 'normal',
    title: '일반',
    desc: '별도 서류 증빙 불필요 (기본 프로모션 적용)',
    badge: '🛍️ 맞춤가전 프로모션'
  }
};

const DEFAULT_CHECKPOINTS = [
  { id: 'cp1', text: '계약 기간 전 품목 무상수리 서비스 보장', checked: true },
  { id: 'cp2', text: '초기 목돈 지출 및 장기 할부이자 부담 ZERO', checked: true },
  { id: 'cp3', text: '전문 엔지니어 정기 케어서비스 및 소모품 관리', checked: true },
  { id: 'cp4', text: '진주 백화점·로드샵 통합매장 최대 혜택 적용', checked: true }
];

const CARD_EVENT_QR_ITEMS = [
  {
    id: 'kb',
    shortLabel: 'KB카드',
    title: 'KB국민카드 이벤트 대상 조회',
    badge: 'KB KOOKMIN CARD EVENT CHECK',
    matchKeyword: 'KB',
    url: 'https://m.kbcard.com/BON/DVIEW/MBVM0004'
  },
  {
    id: 'woori',
    shortLabel: '우리카드',
    title: '우리카드 이벤트 대상 조회',
    badge: 'WOORI CARD EVENT CHECK',
    matchKeyword: '우리',
    url: 'https://m.wooricard.com/dcmw/yh1/mlk/mlk06/M1MLK206S00.do?'
  },
  {
    id: 'lotte',
    shortLabel: '롯데카드',
    title: '롯데카드 이벤트 대상 조회',
    badge: 'LOTTE CARD EVENT CHECK',
    matchKeyword: '로카',
    url: 'https://m.lottecard.co.kr/app/LPBNFDA_V580.lc?evnBultSeq=23&ccoEvnGubun=SAMSUNG'
  }
];

// 26.11월 기준 제휴카드별 실적인정 기준 가이드 데이터 (출력 견적서 안내용)
const AFFILIATE_CARD_POLICY = {
  samsung: {
    key: 'samsung',
    matchKeywords: ['삼성전자 AI구독 삼성카드', '삼성카드'],
    displayName: '삼성카드 (삼성전자 AI구독)',
    csPhone: '1588-8700',
    promoPeriod: '72개월',
    features: [
      { label: '구독료', status: 'O', text: '인정' },
      { label: '가족카드', status: 'X', text: '합산불가' },
      { label: '통신/주유/의료', status: 'O', text: '인정' },
      { label: 'OTT/쿠팡/배달', status: 'O', text: '인정' },
      { label: '상조 납입금', status: 'O', text: '인정' },
      { label: '보험료', status: '△', text: '4대보험외' },
      { label: '관리비/공과금', status: 'X', text: '제외' },
      { label: '무이자할부', status: 'X', text: '제외' }
    ]
  },
  kb: {
    key: 'kb',
    matchKeywords: ['KB', '국민', 'KB카드', 'KB국민', '삼성전자 AI구독 KB카드'],
    displayName: 'KB국민카드 (삼성전자 AI구독)',
    csPhone: '1588-1688',
    promoPeriod: '36개월',
    features: [
      { label: '가족카드', status: 'O', text: '합산가능' },
      { label: '구독료', status: 'X', text: '제외' },
      { label: '통신/주유/의료', status: 'O', text: '인정' },
      { label: 'OTT/쿠팡/배달', status: 'O', text: '인정' },
      { label: '상조 납입금', status: 'O', text: '인정' },
      { label: '보험료', status: '△', text: '4대보험외' },
      { label: '관리비/공과금', status: 'X', text: '제외' },
      { label: '대중교통/무이자', status: 'X', text: '제외' }
    ]
  },
  woori: {
    key: 'woori',
    matchKeywords: ['우리', '우리카드', '삼성전자 AI구독 우리카드'],
    displayName: '우리카드 (삼성전자 AI구독)',
    csPhone: '1800-0845',
    promoPeriod: '60개월',
    features: [
      { label: '초/중/고 납입금', status: 'O', text: '인정' },
      { label: '가족카드', status: 'O', text: '합산가능' },
      { label: '통신/주유/의료', status: 'O', text: '인정' },
      { label: 'OTT/쿠팡/배달', status: 'O', text: '인정' },
      { label: '상조 납입금', status: 'O', text: '인정' },
      { label: '대중교통', status: '△', text: '일부제한' },
      { label: '보험료', status: '△', text: '4대보험외' },
      { label: '구독료/관리비/공과금', status: 'X', text: '제외' }
    ]
  },
  lotte: {
    key: 'lotte',
    matchKeywords: ['롯데', '로카', 'AMEX', '구독엔로카'],
    displayName: '롯데카드 (구독엔로카 AMEX)',
    csPhone: '1588-8100',
    promoPeriod: '발급월+71개월',
    features: [
      { label: '구독료', status: 'O', text: '인정' },
      { label: '가족카드', status: 'O', text: '합산가능' },
      { label: '통신/주유/의료', status: 'O', text: '인정' },
      { label: 'OTT/쿠팡/배달', status: 'O', text: '인정' },
      { label: '상조 납입금', status: 'O', text: '인정' },
      { label: '보험료', status: '△', text: '4대보험외' },
      { label: '관리비/공과금', status: 'X', text: '제외' },
      { label: '대중교통/무이자', status: 'X', text: '제외' }
    ]
  },
  hana: {
    key: 'hana',
    matchKeywords: ['하나', '하나카드', '삼성전자 AI구독 하나카드'],
    displayName: '하나카드 (삼성전자 AI구독)',
    csPhone: '1800-1111',
    promoPeriod: '1회',
    features: [
      { label: '대중교통', status: 'O', text: '인정' },
      { label: '무이자할부', status: 'O', text: '인정' },
      { label: '구독료', status: 'O', text: '할인제외분' },
      { label: '통신/주유/의료', status: 'O', text: '인정' },
      { label: 'OTT/쿠팡/배달', status: 'O', text: '인정' },
      { label: '가족카드', status: 'X', text: '합산불가' },
      { label: '보험료', status: '△', text: '4대보험외' },
      { label: '관리비/공과금/등록금', status: 'X', text: '제외' }
    ]
  }
};

// 카드명에서 '삼성카드' 여부만 정확히 판별 (타 제휴카드 '삼성전자 AI구독 KB/우리/하나/롯데' 등은 제외)
function checkIsSamsungCard(cardName) {
  if (!cardName || typeof cardName !== 'string') return false;
  const name = cardName.trim().toLowerCase();
  if (
    name.includes('kb') ||
    name.includes('국민') ||
    name.includes('우리') ||
    name.includes('하나') ||
    name.includes('롯데') ||
    name.includes('로카') ||
    name.includes('amex') ||
    name.includes('현대') ||
    name.includes('신한') ||
    name.includes('농협') ||
    name.includes('nh') ||
    name.includes('bc') ||
    name.includes('비씨')
  ) {
    return false;
  }
  return name.includes('삼성');
}

// 필요 실적이 70만원 이상 구간인지 판별 (삼성카드 구독료 7만원 미만 시 70만원 구간 제한용)
function isSpend70kOrMore(val) {
  if (!val) return false;
  const str = String(val).trim().replace(/,/g, '');
  if (/70\s*만/.test(str)) return true;
  if (/^70$/.test(str)) return true;
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (!isNaN(num) && num >= 700000) return true;
  if (!isNaN(num) && num === 70 && !str.includes('천')) return true;
  return false;
}

function getAffiliateCardPolicy(cardName) {
  if (!cardName || typeof cardName !== 'string') return null;
  const name = cardName.trim();
  if (!name) return null;
  const lower = name.toLowerCase();
  // 타 제휴카드(KB, 우리, 하나, 롯데)를 먼저 검사하여 '삼성전자 AI구독 ...' 이름에 오매칭되지 않도록 방지
  if (lower.includes('kb') || lower.includes('국민')) return AFFILIATE_CARD_POLICY.kb;
  if (lower.includes('우리')) return AFFILIATE_CARD_POLICY.woori;
  if (lower.includes('하나')) return AFFILIATE_CARD_POLICY.hana;
  if (lower.includes('롯데') || lower.includes('로카') || lower.includes('amex')) return AFFILIATE_CARD_POLICY.lotte;
  if (checkIsSamsungCard(lower)) return AFFILIATE_CARD_POLICY.samsung;
  return null;
}

// 견적서 항목명에 카드 풀네임 대신 간결한 카드사명을 노출하여 글자 겹침 방지
function getCardCompanyShort(cardName) {
  if (!cardName || typeof cardName !== 'string') return '';
  const name = cardName.trim();
  if (!name) return '';
  const lower = name.toLowerCase();
  // 타 제휴카드사를 먼저 체크해야 '삼성전자 AI구독 KB카드' 등이 삼성카드로 잘못 출력되지 않음
  if (lower.includes('kb') || lower.includes('국민')) return 'KB카드';
  if (lower.includes('우리')) return '우리카드';
  if (lower.includes('하나')) return '하나카드';
  if (lower.includes('롯데') || lower.includes('로카') || lower.includes('amex')) return '롯데카드';
  if (lower.includes('현대')) return '현대카드';
  if (lower.includes('신한')) return '신한카드';
  if (lower.includes('농협') || lower.includes('nh')) return 'NH농협카드';
  if (lower.includes('bc') || lower.includes('비씨')) return 'BC카드';
  if (checkIsSamsungCard(lower)) return '삼성카드';
  return name.length > 6 ? name.slice(0, 6) : name;
}

// 구독료 실적 인정 대상 제휴카드 판별 (삼성카드, 롯데카드 2개사만 실적 인정)
function checkIsSubFeeRecognizedCard(cardName) {
  if (!cardName || typeof cardName !== 'string') return false;
  const lower = cardName.trim().toLowerCase();
  if (lower.includes('롯데') || lower.includes('로카') || lower.includes('amex')) return true;
  return checkIsSamsungCard(cardName);
}

// 필요실적 텍스트(예: '70만', '50만원', '월 70만', '700000', '70')를 원 단위 숫자로 변환
function parseSpendToWon(spendStr) {
  if (!spendStr) return 0;
  const s = String(spendStr).replace(/^월\s*/, '').replace(/^필요실적\s*/, '').replace(/\s*사용$/, '').trim();
  const manMatch = s.match(/([\d.]+)\s*만/);
  if (manMatch) {
    return Math.round(parseFloat(manMatch[1]) * 10000);
  }
  const cleanNumStr = s.replace(/,/g, '').replace(/원/g, '').trim();
  const numMatch = cleanNumStr.match(/^[\d.]+/);
  if (!numMatch) return 0;
  const val = parseFloat(numMatch[0]);
  if (isNaN(val)) return 0;
  if (val < 1000) {
    return Math.round(val * 10000);
  }
  return Math.round(val);
}

// 카드 필요실적 및 월 구독료를 바탕으로 실질 필요실적 안내 문구 생성
// 구독료 실적 인정 카드(삼성/롯데)는 천원 단위 절사된 구독료를 차감하여 노출 (예: 70만원 - 75,000원 = 월 62.5만원 사용)
function getDeductedSpendDesc(rawSpendStr, monthlyFeeWon, cardName) {
  let cleanBase = rawSpendStr ? String(rawSpendStr).replace(/^필요실적\s*/, '').replace(/\s*사용$/, '').trim() : '';
  if (!cleanBase) return '';
  if (!cleanBase.startsWith('월')) {
    cleanBase = `월 ${cleanBase}`;
  }
  if (!checkIsSubFeeRecognizedCard(cardName)) {
    return `${cleanBase} 사용`;
  }
  const targetWon = parseSpendToWon(cleanBase);
  const recFee = Math.floor((Number(monthlyFeeWon) || 0) / 1000) * 1000;
  // 공식 카드 기준실적(30만, 50만, 70만, 100만 등 10만원 단위)인 경우 구독료 차감 적용
  if (targetWon > 0 && recFee > 0 && targetWon % 100000 === 0) {
    const remainWon = Math.max(0, targetWon - recFee);
    const remainMan = remainWon / 10000;
    const remainStr = remainMan % 1 === 0 ? `${remainMan}만원` : `${Number(remainMan.toFixed(2))}만원`;
    return `월 ${remainStr} 사용`;
  }
  return `${cleanBase} 사용`;
}

// 제휴카드별 적용 대상 구독 모델 인덱스 배열 추출 헬퍼 (다중 모델 선택 지원)
function getCardSelectedIndices(cardItem, cardIdx, totalCount, isSingleCard = false) {
  if (totalCount <= 1) return [0];
  if (Array.isArray(cardItem?.targetModelIndices) && cardItem.targetModelIndices.length > 0) {
    const valid = cardItem.targetModelIndices
      .map(Number)
      .filter((i) => !isNaN(i) && i >= 0 && i < totalCount);
    if (valid.length > 0) {
      return [...new Set(valid)].sort((a, b) => a - b);
    }
  }
  if (cardItem?.targetModelIndex !== undefined && cardItem?.targetModelIndex !== null) {
    const idx = Number(cardItem.targetModelIndex);
    if (idx === -1) {
      return Array.from({ length: totalCount }, (_, i) => i);
    }
    if (idx >= 0 && idx < totalCount) {
      return [idx];
    }
  }
  if (isSingleCard) {
    return Array.from({ length: totalCount }, (_, i) => i);
  }
  return [cardIdx < totalCount ? cardIdx : 0];
}

// 100% 오프라인 작동 순수 JS QR코드(Version 5-L, 37x37) SVG Path 생성기
const QR_PATH_CACHE = {};
function getOfflineQrSvgPath(text) {
  if (QR_PATH_CACHE[text]) return QR_PATH_CACHE[text];
  const utf8 = Array.from(new TextEncoder().encode(text));
  const VERSION = 5;
  const SIZE = 37;
  const DATA_CW = 108;
  const EC_CW = 26;

  let bits = '';
  const appendBits = (val, len) => {
    bits += val.toString(2).padStart(len, '0');
  };
  appendBits(0b0100, 4);
  appendBits(utf8.length, 8);
  for (const b of utf8) appendBits(b, 8);
  appendBits(0, Math.min(4, DATA_CW * 8 - bits.length));
  while (bits.length % 8 !== 0) bits += '0';

  const dataCw = [];
  for (let i = 0; i < bits.length; i += 8) {
    dataCw.push(parseInt(bits.slice(i, i + 8), 2));
  }
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (dataCw.length < DATA_CW) {
    dataCw.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

  let gen = new Uint8Array([1]);
  for (let i = 0; i < EC_CW; i++) {
    const next = new Uint8Array(gen.length + 1);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= gfMul(gen[j], EXP[i]);
    }
    gen = next;
  }

  const msg = new Uint8Array(DATA_CW + EC_CW);
  msg.set(dataCw, 0);
  for (let i = 0; i < DATA_CW; i++) {
    const coef = msg[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  const allCodewords = [...dataCw, ...Array.from(msg.slice(DATA_CW))];

  const matrix = Array.from({ length: SIZE }, () => new Int8Array(SIZE).fill(-1));
  const isFunc = Array.from({ length: SIZE }, () => new Uint8Array(SIZE).fill(0));
  const setFunc = (r, c, val) => {
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
      matrix[r][c] = val ? 1 : 0;
      isFunc[r][c] = 1;
    }
  };

  const placeFinder = (row, col) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const isBorder = r === -1 || r === 7 || c === -1 || c === 7;
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setFunc(row + r, col + c, !isBorder && (isOuter || isInner));
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, SIZE - 7);
  placeFinder(SIZE - 7, 0);

  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      setFunc(30 + r, 30 + c, Math.max(Math.abs(r), Math.abs(c)) !== 1);
    }
  }
  for (let i = 8; i < SIZE - 8; i++) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }
  setFunc(4 * VERSION + 9, 8, true);
  for (let i = 0; i < 9; i++) {
    if (!isFunc[8][i]) setFunc(8, i, false);
    if (!isFunc[i][8]) setFunc(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    setFunc(8, SIZE - 1 - i, false);
    setFunc(SIZE - 1 - i, 8, false);
  }

  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;
  let upward = true;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < SIZE; vert++) {
      const r = upward ? SIZE - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunc[r][c]) {
          let bit = 0;
          if (bitIdx < totalBits) {
            bit = (allCodewords[bitIdx >> 3] >> (7 - (bitIdx & 7))) & 1;
            bitIdx++;
          }
          if ((r + c) % 2 === 0) bit ^= 1;
          matrix[r][c] = bit;
        }
      }
    }
    upward = !upward;
  }

  const formatBits = 0x77c4;
  const getFormatBit = (i) => (formatBits >> i) & 1;
  const tlCoords = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = tlCoords[i];
    matrix[r][c] = getFormatBit(14 - i);
  }
  for (let i = 0; i < 7; i++) matrix[SIZE - 1 - i][8] = getFormatBit(14 - i);
  for (let i = 7; i < 15; i++) matrix[8][SIZE - 15 + i] = getFormatBit(14 - i);

  let path = '';
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (matrix[r][c] === 1) path += `M${c + 2},${r + 2}h1v1h-1z`;
    }
  }
  QR_PATH_CACHE[text] = path;
  return path;
}

function CardEventQrSvg({ url, size = 72, label = '이벤트 대상 확인 QR코드' }) {
  const path = getOfflineQrSvgPath(url);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 41 41"
      shapeRendering="crispEdges"
      style={{
        display: 'block',
        background: '#ffffff',
        borderRadius: '8px',
        padding: '2px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        flexShrink: 0
      }}
      aria-label={label}
    >
      <rect width="41" height="41" fill="#ffffff" />
      <path d={path} fill="#0f172a" />
    </svg>
  );
}

export default function BenefitCalculator({ onBack }) {
  // 인증 상태 (세션 유지)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('jcc_calc_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');

  // 화면 전환 ('input' | 'result')
  const [step, setStep] = useState('input');
  // 계산기 모드 ('compare': 일반구매 vs 구독 비교 계산기 | 'mixed': 일반+구독 혼합 견적기)
  const [calculatorMode, setCalculatorMode] = useState('compare');
  const isMixedMode = calculatorMode === 'mixed';

  // 스마트 견적기 전용: 구독 모델 및 전용 서비스 통합 항목군
  // (모델명 · 갯수 · 구독기간 · 서비스주기(6,12,36) · 기본구독료 · 할인구독료 · 선납금 · 무상수리 이용금액 · 소모품비용 · 방문케어비용)
  const DEFAULT_MIXED_SUB_ITEMS = [
    {
      id: 1,
      name: '',
      quantity: 1,
      months: 72,
      serviceCycle: 12,
      baseMonthlyFee: 0,
      discountMonthlyFee: 0,
      prepay: 0,
      freeRepairFee: 0,
      selfCareFee: 0,
      visitCareFee: 0,
      hasReinstall: false
    }
  ];
  const [mixedSubItems, setMixedSubItems] = useState(DEFAULT_MIXED_SUB_ITEMS);

  // 혼합 견적기 전용: 일반구매 모델군 (모델명 · 수량 · 기준금액 · 할인된 금액)
  const DEFAULT_MIXED_LUMP_ITEMS = [{ id: 1, name: '', price: 0, quantity: 1, discountedPrice: 0 }];
  const [mixedLumpItems, setMixedLumpItems] = useState(DEFAULT_MIXED_LUMP_ITEMS);

  // 혼합 견적기 행사 유형 (4가지: 'wedding': 혼수 | 'moving_in': 입주 | 'moving': 이사 | 'normal': 일반)
  const [mixedEventType, setMixedEventType] = useState('wedding');

  // 혼합 견적기 전용: 캐시백 항목군 (이벤트 사유/명칭 · 금액 · 서류 증빙 조건 여부)
  const DEFAULT_MIXED_CASHBACK_ITEMS = [{ id: 1, name: '', amount: 0, hasProof: true }];
  // 혼합 견적기 전용: 상품권 항목군 (상품권 종류/사유 · 금액 · 서류 증빙 조건 여부)
  const DEFAULT_MIXED_VOUCHER_ITEMS = [{ id: 1, name: '', amount: 0, hasProof: true }];

  const [mixedCashbackItems, setMixedCashbackItems] = useState(DEFAULT_MIXED_CASHBACK_ITEMS);
  const [mixedVoucherItems, setMixedVoucherItems] = useState(DEFAULT_MIXED_VOUCHER_ITEMS);

  // 일반구매 결제 채널 및 특정 조건 할인 정책 (갤러리아 백화점 vs 진주본점)
  const [mixedChannelType, setMixedChannelType] = useState('dept'); // 'dept': 백화점 | 'road': 로드샵
  const [mixedDeptDiscount, setMixedDeptDiscount] = useState(0); // 하위 호환용
  const [mixedDeptCardDiscount, setMixedDeptCardDiscount] = useState(0); // ① 제휴카드 청구할인
  const [mixedDeptVoucherDiscount, setMixedDeptVoucherDiscount] = useState(0); // ② 상품권(G캐시)
  const [mixedDeptVoucherMode, setMixedDeptVoucherMode] = useState('instant'); // 'instant': 결제 즉시 차감 | 'reward': 적립 후 고객 사용
  const [mixedDeptDiscountNote, setMixedDeptDiscountNote] = useState('');
  const [mixedDeptDiscountProof, setMixedDeptDiscountProof] = useState(true);

  const [mixedRoadDiscount, setMixedRoadDiscount] = useState(0);
  const [mixedRoadDiscountNote, setMixedRoadDiscountNote] = useState('');
  const [mixedRoadDiscountProof, setMixedRoadDiscountProof] = useState(true);

  // 갤러리아 백화점 직원 전용 스마트 결제 설계기 상태
  const [deptCalcOpen, setDeptCalcOpen] = useState(true);
  const [deptCustomGross, setDeptCustomGross] = useState(null); // null이면 mixedLumpGross 연동
  const [deptRewardRate, setDeptRewardRate] = useState(10.0); // 제휴카드 우대 사은율 (기본 10.0%)
  const [deptStrategy, setDeptStrategy] = useState('reward'); // 'reward': 전액 증정 | 'instant': 안전 선차감
  const [deptCardCount, setDeptCardCount] = useState(1); // 1: 1인 카드 (3분할) | 2: 2인 2카드 (신랑+신부)
  const [deptSplitSlider, setDeptSplitSlider] = useState(60.7); // 2인 분할 비율 (%)
  const [deptHasPhone, setDeptHasPhone] = useState(false);
  const [deptPhoneAmount, setDeptPhoneAmount] = useState(0);
  const [showPosCashierModal, setShowPosCashierModal] = useState(false);

  const handleAddMixedLumpItem = () => {
    setMixedLumpItems((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((it) => it.id)) + 1 : 1;
      return [...prev, { id: nextId, name: '', price: 0, quantity: 1, discountedPrice: 0 }];
    });
  };
  const handleUpdateMixedLumpItem = (id, field, value) => {
    setMixedLumpItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const handleRemoveMixedLumpItem = (id) => {
    setMixedLumpItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  };

  // 캐시백 항목 추가/수정/삭제
  const handleAddMixedCashbackItem = () => {
    setMixedCashbackItems((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((it) => it.id)) + 1 : 1;
      return [...prev, { id: nextId, name: '', amount: 0, hasProof: true }];
    });
  };
  const handleUpdateMixedCashbackItem = (id, field, value) => {
    setMixedCashbackItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const handleRemoveMixedCashbackItem = (id) => {
    setMixedCashbackItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  };

  // 상품권 항목 추가/수정/삭제
  const handleAddMixedVoucherItem = () => {
    setMixedVoucherItems((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((it) => it.id)) + 1 : 1;
      return [...prev, { id: nextId, name: '', amount: 0, hasProof: true }];
    });
  };
  const handleUpdateMixedVoucherItem = (id, field, value) => {
    setMixedVoucherItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const handleRemoveMixedVoucherItem = (id) => {
    setMixedVoucherItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  };

  // 구독 모델 및 서비스 통합 항목 추가/수정/삭제
  const handleAddMixedSubItem = () => {
    setMixedSubItems((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((it) => it.id)) + 1 : 1;
      const lastMonths = prev[prev.length - 1]?.months || 72;
      return [
        ...prev,
        {
          id: nextId,
          name: '',
          quantity: 1,
          months: lastMonths,
          serviceCycle: 12,
          baseMonthlyFee: 0,
          discountMonthlyFee: 0,
          prepay: 0,
          freeRepairFee: 0,
          selfCareFee: 0,
          visitCareFee: 0,
          hasReinstall: false
        }
      ];
    });
  };
  const handleUpdateMixedSubItem = (id, field, value) => {
    setMixedSubItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const handleRemoveMixedSubItem = (id) => {
    setMixedSubItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  };

  // 고객 및 상담 기본 정보
  const todayStr = new Date().toISOString().slice(0, 10);
  const [customerName, setCustomerName] = useState('');
  const [consultDate, setConsultDate] = useState(todayStr);
  const [consultType, setConsultType] = useState('입주가전 맞춤설계');
  const [productSummary, setProductSummary] = useState('');
  const [memo, setMemo] = useState('');

  // 매니저 명함 정보 & 카드 최저금리 설정 (localStorage 저장)
  const [managerPhone, setManagerPhone] = useState(() => localStorage.getItem('jcc_calc_manager_phone') || '');
  const [storeInfo, setStoreInfo] = useState(
    () => localStorage.getItem('jcc_calc_store_info') || '경남 진주시 동부로 79 (진주 백화점·로드샵 통합매장)'
  );
  const [cardLowestRate, setCardLowestRate] = useState(() => {
    const saved = localStorage.getItem('jcc_calc_card_rate');
    return saved !== null ? saved : '5.9';
  });

  useEffect(() => {
    localStorage.setItem('jcc_calc_manager_phone', managerPhone);
  }, [managerPhone]);

  useEffect(() => {
    localStorage.setItem('jcc_calc_store_info', storeInfo);
  }, [storeInfo]);

  useEffect(() => {
    localStorage.setItem('jcc_calc_card_rate', cardLowestRate);
  }, [cardLowestRate]);

  // 반응형 화면 너비 감지 (모바일 화면 맞춤/스크롤 뷰 최적화)
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSmallScreen = windowWidth <= 860;
  const mobileSheetScale = Math.min(1, Math.max(0.38, (windowWidth - 32) / 820));

  // 1) 일반구매 (일시불/할부) 상태 — 세부 내역 없이 핵심 금액만 간결 입력
  const [lumpBasePrice, setLumpBasePrice] = useState(0);
  const [lumpTotalBenefit, setLumpTotalBenefit] = useState(0);

  const handleLumpBaseChange = (val) => {
    setLumpBasePrice(val);
  };

  const handleLumpBenefitChange = (val) => {
    setLumpTotalBenefit(val);
  };

  // 최종 체감가를 직접 입력해도 총 혜택 금액이 자동 역산되도록 연동
  const handleLumpFinalDirectChange = (targetFinal) => {
    const base = Number(lumpBasePrice) || 0;
    if (base > 0) {
      setLumpTotalBenefit(Math.max(0, base - targetFinal));
    } else {
      setLumpBasePrice(targetFinal);
      setLumpTotalBenefit(0);
    }
  };

  // 2) 삼성AI구독 상태 — 선납금 합계 + 약정기간·구독료 일원화 목록 + 무상/케어서비스 합계 분리
  const [subInputMode, setSubInputMode] = useState('monthly'); // 'monthly' | 'total'
  const [subPrepay, setSubPrepay] = useState(0);
  const [subPlans, setSubPlans] = useState([
    {
      id: 1,
      name: '',
      quantity: 1,
      months: 72,
      monthlyFee: 0,
      totalAmount: 0,
      policyNote: '',
      policyDiscount: 0,
      isMobile: false,
      freeRepairFee: 0,
      careItems: []
    }
  ]);
  const [subCardName, setSubCardName] = useState(''); // 제휴카드 이름 (직접 입력)
  const [subCardMinSpend, setSubCardMinSpend] = useState(''); // 제휴카드 필요 전월실적 (직접 입력)
  const [subCardMonthly, setSubCardMonthly] = useState(0); // 제휴카드 월 청구할인 금액
  const [activeQrModalItem, setActiveQrModalItem] = useState(null); // 확대 모달에 표시할 카드 QR 아이템
  const [subCardAuto70k, setSubCardAuto70k] = useState(true); // 구독료 7만원 이상 시 2.6만 / 미만 시 1.6만 자동 전환
  const [subSegmentCardOverrides, setSubSegmentCardOverrides] = useState({}); // 구간별 청구할인 수동 조정값
  const [subSegmentSpendOverrides, setSubSegmentSpendOverrides] = useState({}); // 구간별 필요실적 수동 조정값
  const [subPurchaseBenefit, setSubPurchaseBenefit] = useState(0); // 통합 구독 구매 혜택 금액
  // 무상 A/S 연장 이용료 (복수 품목 지원: 1번 금액 x 대수 x 개월수, 2번 ...)
  const [subFreeServiceItems, setSubFreeServiceItems] = useState([
    { id: 1, monthlyFee: 0, quantity: 1, months: 72, isMobile: false }
  ]);
  // 케어서비스 혜택 (세부 설정: 1번 소모품비용 갯수, 2번 방문케어 횟수 ...)
  const [subCareServiceItems, setSubCareServiceItems] = useState([
    { id: 1, name: '소모품비용', amount: 0, count: 1, unit: '개' },
    { id: 2, name: '방문케어', amount: 0, count: 1, unit: '회' }
  ]);
  const [includeServiceInFinal, setIncludeServiceInFinal] = useState(true); // 무상·케어 금액을 최종 체감가에 반영

  // 복수 제휴카드 목록 상태 (구독 품목 증가 시 제휴카드 복수 등록 및 중복할인 지원)
  const [subCards, setSubCards] = useState([
    {
      id: 1,
      cardName: '',
      minSpend: '',
      monthly: 0,
      months: null,
      targetModelIndex: 0,
      segmentCardOverrides: {},
      segmentSpendOverrides: {}
    }
  ]);

  const handleUpdateCard = (cardId, patch) => {
    setSubCards((prev) => {
      const next = prev.map((c) => (c.id === cardId ? { ...c, ...patch } : c));
      if (cardId === next[0]?.id) {
        if (patch.cardName !== undefined) setSubCardName(patch.cardName);
        if (patch.minSpend !== undefined) setSubCardMinSpend(patch.minSpend);
        if (patch.monthly !== undefined) setSubCardMonthly(patch.monthly);
      }
      return next;
    });
  };

  const handleUpdateModelSelection = (cardId, nextIndices) => {
    const availableModels = isMixedMode ? mixedSubItems : activePlans;
    const totalModelsCount = availableModels.length;

    const validIndices = nextIndices
      .map(Number)
      .filter((i) => !isNaN(i) && i >= 0 && i < totalModelsCount)
      .sort((a, b) => a - b);

    if (validIndices.length === 0) return;

    const selectedItems = validIndices.map((i) => availableModels[i]).filter(Boolean);
    const targetMonthly = isMixedMode
      ? selectedItems.reduce((sum, item) => sum + getItemMonthly(item) * getSubQty(item.quantity), 0)
      : selectedItems.reduce((sum, item) => sum + (item.rowMonthly || 0), 0);
    const targetMonths = selectedItems.length > 0
      ? Math.max(...selectedItems.map((item) => Number(item.months) || 72))
      : subMonths;

    setSubCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const trimmedName = (c.cardName || '').trim();
        const isSamsung = checkIsSamsungCard(trimmedName);
        const patch = {
          targetModelIndices: validIndices,
          targetModelIndex: validIndices.length === totalModelsCount ? -1 : validIndices[0],
          months: c.months || targetMonths
        };

        if (isSamsung) {
          if (targetMonthly >= 70000) {
            patch.minSpend = '70만';
            patch.monthly = 26000;
          } else {
            patch.minSpend = '30만';
            patch.monthly = 16000;
          }
        }
        return { ...c, ...patch };
      })
    );
  };

  const handleAddCard = (defaultMonths) => {
    setSubCards((prev) => {
      const nextId = (prev.reduce((maxId, c) => Math.max(maxId, c.id), 0) || 0) + 1;
      const availableModels = isMixedMode ? mixedSubItems : subPlans;
      const totalModelsCount = availableModels.length;

      if (prev.length === 0) {
        const defaultCardName = '삼성전자 AI구독 삼성카드';
        const defaultSpend = '30만';
        const defaultMonthly = 16000;
        setSubCardName(defaultCardName);
        setSubCardMinSpend(defaultSpend);
        setSubCardMonthly(defaultMonthly);
        const allIndices = availableModels.map((_, i) => i);
        return [
          {
            id: nextId,
            cardName: defaultCardName,
            minSpend: defaultSpend,
            monthly: defaultMonthly,
            months: defaultMonths || null,
            targetModelIndex: -1,
            targetModelIndices: allIndices,
            segmentCardOverrides: {},
            segmentSpendOverrides: {}
          }
        ];
      }

      // 복수 카드로 확장될 때, 기존 카드들의 targetModelIndices 설정
      const updatedPrev = prev.map((c, i) => {
        if (!Array.isArray(c.targetModelIndices) || c.targetModelIndices.length === 0) {
          const currentIndices = getCardSelectedIndices(c, i, totalModelsCount, false);
          return {
            ...c,
            targetModelIndices: currentIndices
          };
        }
        return c;
      });

      const usedIndices = new Set(updatedPrev.flatMap((c) => c.targetModelIndices || []));
      let fallbackIdx = availableModels.findIndex((_, idx) => !usedIndices.has(idx));
      if (fallbackIdx < 0) fallbackIdx = prev.length < totalModelsCount ? prev.length : 0;

      const targetModel = availableModels[fallbackIdx];
      const m = defaultMonths || (targetModel ? Number(targetModel.months) || 72 : 72);
      const firstIsSamsung = checkIsSamsungCard(prev[0]?.cardName || subCardName || '');
      const newCardName = firstIsSamsung ? '구독엔로카 AMEX' : '삼성전자 AI구독 삼성카드';
      const newSpend = firstIsSamsung ? '50만' : '70만';
      const newMonthly = firstIsSamsung ? 16000 : 26000;

      return [
        ...updatedPrev,
        {
          id: nextId,
          cardName: newCardName,
          minSpend: newSpend,
          monthly: newMonthly,
          months: m,
          targetModelIndex: fallbackIdx,
          targetModelIndices: [fallbackIdx],
          segmentCardOverrides: {},
          segmentSpendOverrides: {}
        }
      ];
    });
  };

  const handleRemoveCard = (cardId) => {
    setSubCards((prev) => {
      const filtered = prev.filter((c) => c.id !== cardId);
      if (filtered.length === 0) {
        setSubCardName('');
        setSubCardMinSpend('');
        setSubCardMonthly(0);
        setSubSegmentCardOverrides({});
        return [];
      }
      if (filtered.length === 1) {
        // 단일 카드로 복귀 시 전체 모델 자동 연동(-1)으로 복귀
        filtered[0] = {
          ...filtered[0],
          targetModelIndex: -1,
          months: filtered[0].months || subMonths
        };
      }
      if (filtered[0]) {
        setSubCardName(filtered[0].cardName);
        setSubCardMinSpend(filtered[0].minSpend);
        setSubCardMonthly(filtered[0].monthly);
      }
      return filtered;
    });
  };

  const handleDirectSingleCardChange = (val) => {
    setSubCardMonthly(val);
    setSubSegmentCardOverrides({});
    handleUpdateCard(subCards[0]?.id || 1, { monthly: val });
  };

  const handleSegmentCardOverride = (endMonth, val, isFirstSegment = false) => {
    if (isFirstSegment) {
      setSubCardMonthly(val);
    }
    setSubSegmentCardOverrides((prev) => ({
      ...prev,
      [endMonth]: val
    }));
  };

  const handleDirectSingleSpendChange = (val) => {
    setSubCardMinSpend(val);
    setSubSegmentSpendOverrides({});
    handleUpdateCard(subCards[0]?.id || 1, { minSpend: val });
  };

  const handleSegmentSpendOverride = (endMonth, val, isFirstSegment = false) => {
    if (isFirstSegment) {
      setSubCardMinSpend(val);
    }
    setSubSegmentSpendOverrides((prev) => ({
      ...prev,
      [endMonth]: val
    }));
  };

  const handleAddSubPlan = () => {
    let nextDefaultMonths = 60;
    setSubPlans((prev) => {
      const usedMonths = prev.map((p) => p.months);
      nextDefaultMonths = !usedMonths.includes(60)
        ? 60
        : !usedMonths.includes(72)
          ? 72
          : !usedMonths.includes(48)
            ? 48
            : 36;
      const nextId = prev.reduce((maxId, p) => Math.max(maxId, p.id), 0) + 1;
      return [
        ...prev,
        {
          id: nextId,
          name: '',
          quantity: 1,
          months: nextDefaultMonths,
          monthlyFee: 0,
          totalAmount: 0,
          policyNote: '',
          policyDiscount: 0,
          isMobile: false,
          freeRepairFee: 0,
          careItems: []
        }
      ];
    });
  };

  // 품목별 케어서비스 행 추가/수정/삭제 헬퍼
  const handleAddPlanCareItem = (planId) => {
    setSubPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const currentItems = Array.isArray(p.careItems) ? p.careItems : [];
        const nextId = currentItems.reduce((maxId, it) => Math.max(maxId, it.id || 0), 0) + 1;
        const defaultType = !currentItems.some((it) => it.type === 'visit')
          ? 'visit'
          : !currentItems.some((it) => it.type === 'self')
            ? 'self'
            : 'consumable';
        return {
          ...p,
          careItems: [...currentItems, { id: nextId, type: defaultType, cycle: 12, count: 1, amount: 0, customName: '' }]
        };
      })
    );
  };

  const handleUpdatePlanCareItem = (planId, careId, patch) => {
    setSubPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const currentItems = Array.isArray(p.careItems) ? p.careItems : [];
        return {
          ...p,
          careItems: currentItems.map((c) => (c.id === careId ? { ...c, ...patch } : c))
        };
      })
    );
  };

  const handleRemovePlanCareItem = (planId, careId) => {
    setSubPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const currentItems = Array.isArray(p.careItems) ? p.careItems : [];
        return {
          ...p,
          careItems: currentItems.filter((c) => c.id !== careId)
        };
      })
    );
  };

  const handleUpdateSubPlan = (id, patch) => {
    setSubPlans((prev) => {
      const isFirst = prev[0]?.id === id;
      const updated = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      if (patch.months && (isFirst || prev.length === 1)) {
        // 1번 구독 약정기간이 변경되면, 제휴 무상서비스의 약정기간도 동일하게 기본 연동!
        setSubFreeServiceItems((prevFree) =>
          prevFree.map((it, idx) => (idx === 0 || prevFree.length === 1 ? { ...it, months: patch.months } : it))
        );
        // 제휴카드 1번도 기본 연동 (동일하게 자동 동기화)
        setSubCards((prevCards) =>
          prevCards.map((c, idx) => {
            if (idx === 0) {
              return { ...c, months: patch.months };
            }
            return c;
          })
        );
      }
      return updated;
    });
  };

  const handleRemoveSubPlan = (id) => {
    setSubPlans((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  };

  // 강조 배지 모드 ('auto' | 'sub' | 'lump')
  const [recommendMode, setRecommendMode] = useState('auto');
  const [checkpoints, setCheckpoints] = useState(DEFAULT_CHECKPOINTS);

  // ---------------- 비밀번호 로그인 처리 ----------------
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === '08931121') {
      sessionStorage.setItem('jcc_calc_auth', 'true');
      setIsAuthenticated(true);
      setPasswordInput('');
    } else {
      alert('비밀번호가 틀렸습니다.');
      setPasswordInput('');
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem('jcc_calc_auth');
    setIsAuthenticated(false);
    setStep('input');
  };

  // 복합 견적기 구독 항목 공통 헬퍼 (제휴카드 및 구간 계산에 필요)
  const getSubQty = (q) => (q === '' || q === undefined ? 1 : Number(q) || 1);
  const getItemMonthly = (it) => {
    const disc = Number(it.discountMonthlyFee) || 0;
    return disc > 0 ? disc : Number(it.baseMonthlyFee) || 0;
  };
  const getItemBaseMonthly = (it) => {
    const base = Number(it.baseMonthlyFee) || 0;
    return base > 0 ? base : Number(it.discountMonthlyFee) || 0;
  };
  const getMixedSubItemCalc = (it) => {
    const qty = getSubQty(it.quantity);
    const months = Number(it.months) || 72;
    const rawBase = Number(it.baseMonthlyFee) || 0;
    const rawDisc = Number(it.discountMonthlyFee) || 0;
    const prepay = Number(it.prepay) || 0;

    const baseMonthly = rawBase > 0 ? rawBase : rawDisc;
    const monthly = rawDisc > 0 ? rawDisc : rawBase;
    const monthlyTotal = monthly * months * qty;

    // 기본 구독 총액(할인 전 기준총액): 기본구독료 입력 시 (기본구독료 × 약정개월수 × 수량)
    const rawBaseGross = rawBase > 0 ? rawBase * months * qty : prepay + monthlyTotal;
    // 선납금 + 할인구독료 적용 총액: 할인구독료 입력 시 (선납금 + 할인구독료 × 약정개월수 × 수량)
    const discountedGross = rawDisc > 0 ? prepay + monthlyTotal : rawBaseGross;
    const baseGross = Math.max(rawBaseGross, discountedGross);

    // 구독료 할인 (기본 구독 총액 - 선납포함 할인 구독 총액 차액)
    const feeDiscount = Math.max(0, baseGross - discountedGross);

    const freeRepair = (Number(it.freeRepairFee) || 0) * months * qty;
    const selfCare = (Number(it.selfCareFee) || 0) * qty;
    const visitCare = (Number(it.visitCareFee) || 0) * qty;
    const careTotal = selfCare + visitCare;
    const serviceTotal = freeRepair + careTotal;

    const serviceParts = [];
    if (freeRepair > 0) {
      serviceParts.push(it.isMobile ? '무상수리+파손보험' : '무상수리연장');
    }
    if (selfCare > 0 && visitCare > 0) {
      serviceParts.push('소모품·방문케어');
    } else if (visitCare > 0) {
      serviceParts.push('방문케어');
    } else if (selfCare > 0) {
      serviceParts.push('소모품케어');
    }
    const serviceLabel = serviceParts.length > 0 ? serviceParts.join(' + ') : '무상수리연장 + 방문케어';

    return {
      qty,
      months,
      baseMonthly,
      monthly,
      prepay,
      monthlyTotal,
      baseGross,
      discountedGross,
      feeDiscount,
      freeRepair,
      selfCare,
      visitCare,
      careTotal,
      serviceTotal,
      serviceLabel
    };
  };
  const mixedSubMonthlyFeeTotal = mixedSubItems.reduce(
    (sum, it) => sum + getItemMonthly(it) * getSubQty(it.quantity),
    0
  );

  const validMixedSubItems = mixedSubItems.filter(
    (it) => getItemMonthly(it) > 0 || (it.name || '').trim()
  );

  // ---------------- 계산 로직 ----------------
  const normalizedPlans = subPlans.map((p) => {
    const m = Number(p.months) || 72;
    const qty = p.quantity === '' || p.quantity === undefined ? 1 : Number(p.quantity) || 1;
    const unitMonthly =
      subInputMode === 'monthly'
        ? Number(p.monthlyFee) || 0
        : m > 0
          ? Math.round((Number(p.totalAmount) || 0) / m)
          : 0;
    const rowMonthly = unitMonthly * qty;
    const rowGross = rowMonthly * m;
    const policyDisc = Number(p.policyDiscount) || 0;
    return { ...p, months: m, quantity: qty, unitMonthly, rowMonthly, rowGross, policyDiscount: policyDisc };
  });

  const nonZeroPlans = normalizedPlans.filter((p) => p.rowMonthly > 0 || p.rowGross > 0);
  const activePlans = nonZeroPlans.length > 0 ? nonZeroPlans : [normalizedPlans[0]];
  const mixedActiveMonths = validMixedSubItems
    .map((p) => Number(p.months) || 72)
    .filter((m) => m > 0);
  const sortedUniqueMonths = isMixedMode
    ? [...new Set(mixedActiveMonths.length > 0 ? mixedActiveMonths : [72])].sort((a, b) => a - b)
    : [...new Set(activePlans.map((p) => p.months))].sort((a, b) => a - b);
  const descUniqueMonths = [...sortedUniqueMonths].sort((a, b) => b - a);
  const subMonths = sortedUniqueMonths[sortedUniqueMonths.length - 1] || 72;
  const isMultiPeriod = sortedUniqueMonths.length > 1;
  const periodSummaryLabel = descUniqueMonths.join('·');

  const trimmedCardName = subCardName.trim();
  const trimmedCardSpend = subCardMinSpend.trim();
  const isSamsungCard = checkIsSamsungCard(trimmedCardName);
  const isNonSamsungCard = Boolean(trimmedCardName && !isSamsungCard);
  const currentCardPolicy = getAffiliateCardPolicy(trimmedCardName);
  const cardCompanyLabel = getCardCompanyShort(trimmedCardName);

  // 삼성카드, 롯데카드, 하나카드는 구독료가 실적으로 인정되므로 기본구독료 차감 금액(구독료 제외금액) 반영
  const isCardEligibleForSubFee = Boolean(
    (currentCardPolicy && currentCardPolicy.features.some((f) => f.label.includes('구독료') && f.status === 'O')) ||
    isSamsungCard ||
    trimmedCardName.includes('롯데') ||
    trimmedCardName.includes('로카')
  );

  const cardMonthlyNum = Number(subCardMonthly) || 0;
  const subSegments = sortedUniqueMonths.map((endMonth, idx) => {
    const startMonth = idx === 0 ? 1 : sortedUniqueMonths[idx - 1] + 1;
    const duration = endMonth - startMonth + 1;
    const baseMonthly = isMixedMode
      ? validMixedSubItems
          .filter((p) => (Number(p.months) || 72) >= endMonth)
          .reduce((sum, p) => sum + getItemMonthly(p) * getSubQty(p.quantity), 0)
      : activePlans
          .filter((p) => p.months >= endMonth)
          .reduce((sum, p) => sum + p.rowMonthly, 0);

    const hasManualCardOverride = Object.prototype.hasOwnProperty.call(subSegmentCardOverrides, endMonth);
    let targetCard = subCards.length === 0
      ? 0
      : (hasManualCardOverride
          ? Number(subSegmentCardOverrides[endMonth]) || 0
          : cardMonthlyNum);

    // 삼성카드의 경우: 구독료 7만원 이상일 때 70만원 실적에 26,000원, 7만원 미만이면 30만원 구간에 16,000원 자동 반영 (70만원 구간 제한)
    if (isSamsungCard && subCards.length > 0) {
      if (baseMonthly < 70000) {
        if (targetCard > 16000) targetCard = 16000;
        if (!hasManualCardOverride && (targetCard === 0 || targetCard > 16000)) targetCard = 16000;
      } else if (!hasManualCardOverride && (targetCard === 0 || targetCard === 16000)) {
        targetCard = 26000;
      }
    }

    const appliedCard = baseMonthly > 0 ? Math.min(baseMonthly, targetCard) : targetCard;
    const netMonthly = Math.max(0, baseMonthly - targetCard);
    return {
      startMonth,
      endMonth,
      duration,
      baseMonthly,
      targetCard,
      appliedCard,
      netMonthly
    };
  });

  const uniqueAppliedCards = [...new Set(subSegments.map((s) => s.appliedCard))];
  const isSteppedCardDiscount = uniqueAppliedCards.length > 1;
  const hasAnyCardDiscount = subSegments.some((s) => s.appliedCard > 0);

  const lumpFinalPrice = Math.max(0, (Number(lumpBasePrice) || 0) - (Number(lumpTotalBenefit) || 0));
  const numericCardRate = Math.max(0, parseFloat(cardLowestRate) || 0);
  const lumpInstallment = calculateCardInstallment(lumpFinalPrice, numericCardRate, subMonths);

  const effectiveMonthlyBase = subSegments[0]?.baseMonthly || 0;

  // 각 구간별 필요 실적 및 구독료 차감 실질 실적 계산
  const getSegmentSpendDesc = (seg, segIdx) => {
    let rawSpend = subSegmentSpendOverrides[seg?.endMonth];
    if (rawSpend === undefined || rawSpend === '') {
      if (segIdx === 0) {
        rawSpend = trimmedCardSpend;
      } else {
        rawSpend = isSamsungCard && seg?.baseMonthly < 70000 ? '30만' : trimmedCardSpend;
      }
    }
    // 삼성카드의 경우 구독료 7만원 미만이면 70만원 실적 적용 불가 -> 30만원 구간 강제 반영
    if (isSamsungCard && seg?.baseMonthly < 70000 && isSpend70kOrMore(rawSpend)) {
      rawSpend = '30만';
    }

    return getDeductedSpendDesc(rawSpend, seg?.baseMonthly, subCardName);
  };

  // 삼성카드만 구독료 7만원 이상일 때 70만원에 26,000원, 미만일 때 30만원에 16,000원 적용되므로 멀티라인 노출
  // 롯데카드 및 타 카드사(KB, 우리, 하나 등)는 구독료 금액과 상관없는 고정 혜택이므로 견적서에 한 줄로만 노출
  const shouldShowMultiLineCard = isMultiPeriod && isSamsungCard;

  const cardSubLines = shouldShowMultiLineCard
    ? subSegments.map((seg, idx) => {
        const segSpendDesc = getSegmentSpendDesc(seg, idx);
        const segPrefix = idx === 0 ? `${seg.duration}개월간` : `잔여 ${seg.duration}개월`;
        const segDiscountText = seg.appliedCard > 0 ? `(-${formatWon(seg.appliedCard)} X ${seg.duration}개월)` : '';
        const spendWithDiscount = [segSpendDesc, segDiscountText].filter(Boolean).join(' ');
        const parts = [segPrefix, spendWithDiscount].filter(Boolean);
        return parts.join(' · ');
      })
    : [
        (() => {
          const spendDesc = getSegmentSpendDesc(subSegments[0], 0);
          const monthly = subCardMonthly || uniqueAppliedCards[0] || 0;
          const discountText = monthly > 0 ? `(-${formatWon(monthly)} X ${subMonths}개월)` : '';
          return [spendDesc, discountText].filter(Boolean).join(' ');
        })()
      ].filter(Boolean);

  const cardSubLineText = cardSubLines.join(' / ');

  const handleSelectCardPreset = (cardFullName) => {
    setSubCardName(cardFullName);
    if (checkIsSamsungCard(cardFullName)) {
      if (isMultiPeriod) {
        const newSpend = {};
        const newCard = {};
        subSegments.forEach((seg, idx) => {
          if (idx === 0) {
            if (seg.baseMonthly >= 70000) {
              newSpend[seg.endMonth] = '70만';
              newCard[seg.endMonth] = 26000;
              setSubCardMonthly(26000);
            } else {
              newSpend[seg.endMonth] = '30만';
              newCard[seg.endMonth] = 16000;
              setSubCardMonthly(16000);
            }
          } else {
            if (seg.baseMonthly < 70000) {
              newSpend[seg.endMonth] = '30만';
              newCard[seg.endMonth] = 16000;
            } else {
              newSpend[seg.endMonth] = '70만';
              newCard[seg.endMonth] = 26000;
            }
          }
        });
        setSubSegmentSpendOverrides(newSpend);
        setSubSegmentCardOverrides((prev) => ({ ...prev, ...newCard }));
        if (newSpend[subSegments[0]?.endMonth]) {
          setSubCardMinSpend(newSpend[subSegments[0]?.endMonth]);
        }
      } else {
        const effectiveSubMonthly = isMixedMode ? mixedSubMonthlyFeeTotal : effectiveMonthlyBase;
        if (effectiveSubMonthly >= 70000) {
          setSubCardMinSpend('70만');
          setSubCardMonthly(26000);
        } else {
          setSubCardMinSpend('30만');
          setSubCardMonthly(16000);
        }
      }
    } else {
      // 롯데카드, KB카드, 우리카드, 하나카드 등 타 카드사 선택 시:
      // 다구간 수동 오버라이드를 초기화하여 깔끔하게 1구간(단일)으로 복귀
      setSubSegmentSpendOverrides({});
      setSubSegmentCardOverrides({});
      if (cardFullName.includes('롯데') || cardFullName.includes('로카')) {
        setSubCardMinSpend('50만');
      } else {
        setSubCardMinSpend('30만');
      }
      setSubCardMonthly(16000);
    }
  };

  const handleSelectCardPresetForCard = (cardId, cardFullName) => {
    const isSamsung = checkIsSamsungCard(cardFullName);
    const isLotte = cardFullName.includes('롯데') || cardFullName.includes('로카');
    const cardItem = subCards.find((c) => c.id === cardId);
    const cardIdx = subCards.findIndex((c) => c.id === cardId);
    const isSingleCard = subCards.length === 1;

    const availableModels = isMixedMode ? mixedSubItems : activePlans;
    const totalModelsCount = availableModels.length;
    const selectedIndices = getCardSelectedIndices(cardItem, cardIdx, totalModelsCount, isSingleCard);

    let targetMonthly = 0;
    let targetMonths = subMonths;
    if (isMixedMode) {
      const selectedItems = selectedIndices.map((i) => mixedSubItems[i]).filter(Boolean);
      targetMonthly = selectedItems.reduce((sum, item) => sum + getItemMonthly(item) * getSubQty(item.quantity), 0);
      targetMonths = selectedItems.length > 0 ? Math.max(...selectedItems.map((item) => Number(item.months) || 72)) : subMonths;
    } else {
      const selectedItems = selectedIndices.map((i) => activePlans[i]).filter(Boolean);
      targetMonthly = selectedItems.reduce((sum, item) => sum + (item.rowMonthly || 0), 0);
      targetMonths = selectedItems.length > 0 ? Math.max(...selectedItems.map((item) => Number(item.months) || 72)) : subMonths;
    }

    const defaultSpend = isSamsung ? (targetMonthly >= 70000 ? '70만' : '30만') : isLotte ? '50만' : '30만';
    const defaultMonthly = isSamsung ? (targetMonthly >= 70000 ? 26000 : 16000) : 16000;

    handleUpdateCard(cardId, {
      cardName: cardFullName,
      minSpend: defaultSpend,
      monthly: defaultMonthly,
      months: targetMonths,
      targetModelIndices: selectedIndices,
      targetModelIndex: selectedIndices.length === totalModelsCount ? -1 : selectedIndices[0],
      segmentSpendOverrides: {},
      segmentCardOverrides: {}
    });

    if (subCards[0]?.id === cardId && subCards.length === 1) {
      handleSelectCardPreset(cardFullName);
    }
  };
  const subGrossTotal =
    normalizedPlans.reduce((sum, p) => sum + p.rowGross, 0) + (Number(subPrepay) || 0);

  // 복수 제휴카드 연산 (카드명이 입력되었거나 월 청구할인 금액 > 0)
  const activeCards = subCards.filter(
    (c) => Boolean(c && ((c.cardName && c.cardName.trim()) || (Number(c.monthly) || 0) > 0))
  );
  const effectiveCards = activeCards;
  const isSingleCardMode = effectiveCards.length === 1;

  // 복수 제휴카드 세부 정보 및 혜택 계산
  const cardDetails = effectiveCards.map((c, cardIdx) => {
    const trimmedName = (c.cardName || '').trim();
    const isSamsung = checkIsSamsungCard(trimmedName);
    const company = getCardCompanyShort(trimmedName);
    const policy = getAffiliateCardPolicy(trimmedName);

    const availableModels = isMixedMode ? mixedSubItems : activePlans;
    const totalModelsCount = availableModels.length;
    const selectedIndices = getCardSelectedIndices(c, cardIdx, totalModelsCount, isSingleCardMode);
    const isAllSelected = selectedIndices.length === totalModelsCount;

    let targetModelTitle = '';
    let planMonthlyFee = 0;
    let modelMonths = subMonths;

    if (isMixedMode) {
      if (isAllSelected) {
        targetModelTitle = isSingleCardMode ? '' : '전체 구독 모델';
        planMonthlyFee = mixedSubMonthlyFeeTotal;
        modelMonths = subMonths;
      } else if (selectedIndices.length === 1) {
        const mItem = mixedSubItems[selectedIndices[0]];
        targetModelTitle = (mItem?.name || '').trim() || `${selectedIndices[0] + 1}번 구독 모델`;
        planMonthlyFee = mItem ? getItemMonthly(mItem) * getSubQty(mItem.quantity) : 0;
        modelMonths = Number(mItem?.months) || 72;
      } else {
        const selectedItems = selectedIndices.map((i) => mixedSubItems[i]).filter(Boolean);
        targetModelTitle = `${selectedIndices.map((i) => `${i + 1}번`).join('·')} 모델`;
        planMonthlyFee = selectedItems.reduce((sum, item) => sum + getItemMonthly(item) * getSubQty(item.quantity), 0);
        modelMonths = selectedItems.length > 0 ? Math.max(...selectedItems.map((item) => Number(item.months) || 72)) : subMonths;
      }
    } else {
      if (isAllSelected) {
        targetModelTitle = isSingleCardMode ? '' : '전체 품목';
        planMonthlyFee = effectiveMonthlyBase;
        modelMonths = subMonths;
      } else if (selectedIndices.length === 1) {
        const pItem = activePlans[selectedIndices[0]];
        targetModelTitle = (pItem?.name || '').trim() || `품목 ${selectedIndices[0] + 1}`;
        planMonthlyFee = pItem?.rowMonthly || 0;
        modelMonths = Number(pItem?.months) || 72;
      } else {
        const selectedItems = selectedIndices.map((i) => activePlans[i]).filter(Boolean);
        targetModelTitle = `${selectedIndices.map((i) => `${i + 1}번`).join('·')} 품목`;
        planMonthlyFee = selectedItems.reduce((sum, item) => sum + (item.rowMonthly || 0), 0);
        modelMonths = selectedItems.length > 0 ? Math.max(...selectedItems.map((item) => Number(item.months) || 72)) : subMonths;
      }
    }

    const cardMonths = Number(c.months) || modelMonths;
    let monthlyNum = Number(c.monthly) || 0;

    // 삼성카드인 경우 월할인 미입력 시 대상 구독료 기준(7만원 이상 26,000 / 미만 16,000) 자동 적용 (구독료 7만원 미만이면 16,000원 초과 불가)
    if (isSamsung) {
      if (planMonthlyFee < 70000) {
        if (monthlyNum > 16000 || monthlyNum === 0) monthlyNum = 16000;
      } else if (monthlyNum === 0 || monthlyNum === 16000) {
        monthlyNum = 26000;
      }
    }

    // 단일 삼성카드 다구간 모드일 때 (구독 약정기간이 복수일 때 구간별 구독료 기준 자동 연산)
    if (isSingleCardMode && isSamsung && isMultiPeriod) {
      const cardLimitMonths = Number(c.months) > 0 ? Number(c.months) : subMonths;
      const segDiscounts = subSegments.reduce((sum, seg) => {
        if (seg.startMonth > cardLimitMonths) return sum;
        const activeDuration = Math.max(0, Math.min(seg.endMonth, cardLimitMonths) - seg.startMonth + 1);
        return sum + seg.appliedCard * activeDuration;
      }, 0);
      return {
        card: c,
        company,
        isSamsung,
        isNonSamsung: Boolean(trimmedName && !isSamsung),
        policy,
        totalDiscount: segDiscounts,
        planMonthlyFee: isMixedMode ? mixedSubMonthlyFeeTotal : effectiveMonthlyBase,
        cardMonths: cardLimitMonths,
        targetModelTitle: '',
        lines: cardSubLines,
        isMultiLine: true
      };
    }

    const totalDiscount = monthlyNum * cardMonths;

    let effectiveSpend = c.minSpend || (isSamsung ? (planMonthlyFee >= 70000 ? '70만' : '30만') : (trimmedName.includes('롯데') || trimmedName.includes('로카') ? '50만' : '30만'));
    if (isSamsung && planMonthlyFee < 70000 && isSpend70kOrMore(effectiveSpend)) {
      effectiveSpend = '30만';
    }
    const spendDesc = getDeductedSpendDesc(effectiveSpend, planMonthlyFee, trimmedName);

    const discountText = monthlyNum > 0 ? `(-${formatWon(monthlyNum)} X ${cardMonths}개월)` : '';
    const lineText = [spendDesc, discountText].filter(Boolean).join(' ');

    return {
      card: c,
      company,
      isSamsung,
      isNonSamsung: Boolean(trimmedName && !isSamsung),
      policy,
      totalDiscount,
      planMonthlyFee,
      cardMonths,
      targetModelTitle,
      lines: lineText ? [lineText] : [],
      isMultiLine: false
    };
  });

  const subCardTotalDiscount = effectiveCards.length === 0
    ? 0
    : (isSingleCardMode && isSamsungCard && isMultiPeriod)
      ? (cardDetails[0]?.totalDiscount ?? subSegments.reduce((sum, seg) => sum + seg.appliedCard * seg.duration, 0))
      : cardDetails.reduce((sum, d) => sum + d.totalDiscount, 0);

  const cardCompanySummary = effectiveCards.length === 0
    ? ''
    : [...new Set(cardDetails.map((d) => d.company).filter(Boolean))].join(' + ');

  const allCardSubLines = effectiveCards.length === 0
    ? []
    : isSingleCardMode
      ? (cardDetails[0]?.isMultiLine
          ? cardDetails[0].lines
          : (isMixedMode && cardDetails[0]?.lines?.length > 0
              ? [
                  `${cardDetails[0].company ? `${cardDetails[0].company} · ` : ''}${cardDetails[0].lines[0]}${
                    cardDetails[0].targetModelTitle && mixedSubItems.length > 1
                      ? ` [적용: ${cardDetails[0].targetModelTitle}]`
                      : ''
                  }`
                ]
              : cardDetails[0]?.lines || cardSubLines))
      : cardDetails.map((d, i) => {
          const line = d.lines[0] || '';
          const symbol = ['①', '②', '③', '④', '⑤'][i] || `[${i + 1}]`;
          const targetTag = d.targetModelTitle ? ` [적용: ${d.targetModelTitle}]` : '';
          return `${symbol} ${d.company ? `${d.company} · ` : ''}${line}${targetTag}`;
        });

  const hasAnyNonSamsungCard = effectiveCards.length > 0 && cardDetails.some((d) => d.isNonSamsung);

  const startingTotalCardMonthly = effectiveCards.length === 0
    ? 0
    : isSingleCardMode
      ? (isMixedMode
          ? (cardDetails[0]?.isSamsung && (!subCards[0]?.monthly || Number(subCards[0]?.monthly) === 0 || Number(subCards[0]?.monthly) === 16000 || Number(subCards[0]?.monthly) === 26000)
              ? (subSegments[0]?.appliedCard || (cardDetails[0]?.planMonthlyFee >= 70000 ? 26000 : 16000))
              : (Number(subCards[0]?.monthly) || cardMonthlyNum))
          : (subSegments[0]?.appliedCard || cardMonthlyNum))
      : cardDetails.reduce((sum, d) => sum + (Number(d.card.monthly) || (d.isSamsung ? (d.planMonthlyFee >= 70000 ? 26000 : 16000) : 0)), 0);

  const subMonthlyAfterCard = Math.max(0, effectiveMonthlyBase - startingTotalCardMonthly);

  // 무상수리 연장 이용료 총액: 1번 계산기(!isMixedMode)에서는 subPlans의 품목별 설정에서 직접 파생
  const activeSubFreeItems = isMixedMode
    ? subFreeServiceItems
    : subPlans
        .filter((p) => (Number(p.freeRepairFee) || 0) > 0)
        .map((p) => ({
          id: p.id,
          monthlyFee: Number(p.freeRepairFee) || 0,
          quantity: 1,
          months: Number(p.months) || 72,
          isMobile: Boolean(p.isMobile),
          name: p.name
        }));

  const subFreeServiceAmount = activeSubFreeItems.reduce((sum, it) => {
    const fee = Number(it.monthlyFee) || 0;
    const qty = it.quantity === '' ? 1 : Number(it.quantity) || 1;
    const months = Number(it.months) || 72;
    return sum + fee * qty * months;
  }, 0);
  const validFreeServiceItems = activeSubFreeItems.filter((it) => (Number(it.monthlyFee) || 0) > 0);
  const validFreeServiceCount = validFreeServiceItems.length;
  const hasAnyFreeServiceMobile = activeSubFreeItems.some((it) => Boolean(it.isMobile));
  const hasAnyMixedMobile = mixedSubItems.some((it) => Boolean(it.isMobile));
  const totalFreeServiceQuantity = validFreeServiceItems.reduce(
    (sum, it) => sum + (it.quantity === '' ? 1 : Number(it.quantity) || 1),
    0
  );

  // 가전(무상서비스 전용) vs 모바일(무상+파손보험) 분리 계산
  const applianceFreeServiceItems = activeSubFreeItems.filter((it) => !it.isMobile && (Number(it.monthlyFee) || 0) > 0);
  const applianceFreeServiceAmount = applianceFreeServiceItems.reduce((sum, it) => {
    const fee = Number(it.monthlyFee) || 0;
    const qty = it.quantity === '' ? 1 : Number(it.quantity) || 1;
    const months = Number(it.months) || 72;
    return sum + fee * qty * months;
  }, 0);
  const applianceFreeServiceCount = applianceFreeServiceItems.length;
  const applianceFreeServiceQuantity = applianceFreeServiceItems.reduce(
    (sum, it) => sum + (it.quantity === '' ? 1 : Number(it.quantity) || 1),
    0
  );

  const mobileFreeServiceItems = activeSubFreeItems.filter((it) => it.isMobile && (Number(it.monthlyFee) || 0) > 0);
  const mobileFreeServiceAmount = mobileFreeServiceItems.reduce((sum, it) => {
    const fee = Number(it.monthlyFee) || 0;
    const qty = it.quantity === '' ? 1 : Number(it.quantity) || 1;
    const months = Number(it.months) || 72;
    return sum + fee * qty * months;
  }, 0);
  const mobileFreeServiceCount = mobileFreeServiceItems.length;
  const mobileFreeServiceQuantity = mobileFreeServiceItems.reduce(
    (sum, it) => sum + (it.quantity === '' ? 1 : Number(it.quantity) || 1),
    0
  );

  const hasApplianceFreeService = applianceFreeServiceAmount > 0;
  const hasMobileFreeService = mobileFreeServiceAmount > 0;
  const isCombinedFreeService = hasApplianceFreeService && hasMobileFreeService;

  // 케어서비스 혜택 총액: 1번 계산기(!isMixedMode)에서는 각 품목의 careItems에서 추출 (단가 × 횟수)
  const activeSubCareItems = isMixedMode
    ? subCareServiceItems
    : subPlans.flatMap((p) => {
        const rawCareItems = Array.isArray(p.careItems) ? p.careItems : [];
        const items = rawCareItems.length > 0
          ? rawCareItems
          : (Number(p.careAmount) || 0) > 0
            ? [{ id: 1, type: p.careType || 'visit', cycle: 12, count: 1, amount: Number(p.careAmount) || 0, customName: p.careName || '' }]
            : [];

        return items
          .filter((c) => (Number(c.amount) || 0) > 0)
          .map((c) => {
            let typeLabel = '케어서비스';
            let unit = '회';
            if (c.type === 'visit') {
              typeLabel = '방문케어';
              unit = '회';
            } else if (c.type === 'self') {
              typeLabel = '셀프케어';
              unit = '회';
            } else if (c.type === 'consumable') {
              typeLabel = '소모품';
              unit = '개';
            } else if (c.type === 'all') {
              typeLabel = '방문케어+소모품';
              unit = '회';
            } else if (c.type === 'custom' && c.customName) {
              typeLabel = c.customName;
              unit = '건';
            }

            const countNum = c.count === '' || c.count === undefined ? 1 : Number(c.count) || 1;
            const cycleText = c.cycle ? `${c.cycle}개월 주기` : '';
            const countText = countNum > 1 ? `${countNum}${unit}` : '';
            const details = [cycleText, countText].filter(Boolean).join(' · ');
            const planTitle = (p.name || '').trim();
            const fullLabel = planTitle
              ? `${planTitle} (${typeLabel}${details ? ` · ${details}` : ''})`
              : `${typeLabel}${details ? ` (${details})` : ''}`;

            return {
              id: `${p.id}-${c.id}`,
              name: fullLabel,
              amount: Number(c.amount) || 0,
              count: countNum,
              unit,
              planName: planTitle,
              serviceType: typeLabel,
              cycle: c.cycle
            };
          });
      });

  const subCareServiceAmount = isMixedMode
    ? subCareServiceItems.reduce(
        (sum, it) => sum + (Number(it.amount) || 0) * (Number(it.count) || 1),
        0
      )
    : activeSubCareItems.reduce(
        (sum, it) => sum + (Number(it.amount) || 0) * (Number(it.count) || 1),
        0
      );
  const validCareServiceItems = isMixedMode
    ? subCareServiceItems.filter((it) => (Number(it.amount) || 0) > 0)
    : activeSubCareItems;
  const validCareServiceCount = validCareServiceItems.length;
  const hasCareService = subCareServiceAmount > 0;
  const subServiceTotal = (Number(subFreeServiceAmount) || 0) + (Number(subCareServiceAmount) || 0);
  const subCashBenefitTotal = subCardTotalDiscount + (Number(subPurchaseBenefit) || 0);
  // 총 혜택 합계: 무상서비스 연장이용료와 케어서비스는 제외하고 직접 청구할인·캐시백만 합산
  const subTotalBenefitSum = subCashBenefitTotal;

  // 삼성AI구독 최종 체감가: 총 혜택 합계 + (서비스 혜택 가치)까지 모두 반영하여 최종체감가 산출!
  const subFinalPrice = Math.max(
    0,
    subGrossTotal - subTotalBenefitSum - (includeServiceInFinal ? subServiceTotal : 0)
  );

  // 최종 차이가격: 일반구매 일시불 조건(lumpFinalPrice) 대비 비교
  const rawDiff = lumpFinalPrice - subFinalPrice; // 양수면 삼성AI구독이 일시불보다도 더 저렴
  const absDiff = Math.abs(rawDiff);

  const winner = isMixedMode
    ? 'none'
    : recommendMode === 'sub'
      ? 'sub'
      : recommendMode === 'lump'
        ? 'lump'
        : rawDiff >= 0
          ? 'sub'
          : 'lump';

  // ---------------- 혼합 견적 계산 (일반구매 품목군 + 기존 삼성AI구독 계산 연동) ----------------
  const getMixedQty = (q) => (q === '' || q === undefined ? 1 : Number(q) || 1);

  // 일반구매 개별 품목 계산기 (기준금액과 할인된 금액 기반)
  const getMixedLumpItemCalc = (it) => {
    const qty = getMixedQty(it.quantity);
    const rawPrice = Number(it.price) || 0;
    const hasDiscounted = it.discountedPrice !== undefined && it.discountedPrice !== '' && Number(it.discountedPrice) > 0;
    const rawDiscounted = hasDiscounted ? Number(it.discountedPrice) : 0;

    // 기준금액: 입력된 기준금액이 있으면 그것, 없는데 할인된 금액만 입력 시 할인된 금액을 기준가로 처리
    const unitPrice = rawPrice > 0 ? rawPrice : rawDiscounted;

    // 할인된 실결제 단가: 할인된 금액이 입력되어 있으면 그것, 아니면 이전 policyDiscount 차감, 둘 다 없으면 기준금액
    const unitNetPrice = hasDiscounted
      ? rawDiscounted
      : (Number(it.policyDiscount) > 0 ? Math.max(0, unitPrice - Number(it.policyDiscount)) : unitPrice);

    const unitDiscount = (unitPrice > 0 && unitPrice > unitNetPrice) ? unitPrice - unitNetPrice : 0;
    const gross = unitPrice * qty;
    const totalDiscount = unitDiscount * qty;
    const net = Math.max(0, gross - totalDiscount);

    return { qty, unitPrice, unitNetPrice, unitDiscount, gross, totalDiscount, net };
  };

  const validMixedLumpItems = mixedLumpItems.filter(
    (it) => (Number(it.price) || 0) > 0 || (Number(it.discountedPrice) || 0) > 0 || (it.name || '').trim()
  );
  const mixedLumpGross = mixedLumpItems.reduce((sum, it) => sum + getMixedLumpItemCalc(it).gross, 0);
  const mixedLumpModelDiscountTotal = mixedLumpItems.reduce((sum, it) => sum + getMixedLumpItemCalc(it).totalDiscount, 0);
  const mixedLumpNet = Math.max(0, mixedLumpGross - mixedLumpModelDiscountTotal);
  const mixedLumpQtyTotal = validMixedLumpItems.reduce((sum, it) => sum + getMixedLumpItemCalc(it).qty, 0);

  // 갤러리아 백화점 스마트 계산 엔진 (가전 907 vs 자급제 606 수수료 분리 · 마지노선 역산 · 1인 3분할 · 2인 카드 슬라이더)
  const deptApplianceGross = deptCustomGross !== null ? Number(deptCustomGross) || 0 : mixedLumpNet;
  const deptPhoneGross = deptHasPhone && Number(deptPhoneAmount) > 0 ? Number(deptPhoneAmount) : 0;
  const deptEffectiveGross = deptApplianceGross + deptPhoneGross;
  const deptPhoneGcash = Math.floor(deptPhoneGross / 1000000) * 40000;

  const DEPT_TIERS = [
    { label: '100만', minSpend: 1000000, targetReceipt: 1000000, cardDiscountRate: 0, normalGcash: 65000 },
    { label: '200만', minSpend: 2000000, targetReceipt: 2000000, cardDiscountRate: 0, normalGcash: 130000 },
    { label: '300만', minSpend: 3093000, targetReceipt: 3000000, cardDiscountRate: 0.03, normalGcash: 195000 },
    { label: '400만', minSpend: 4124000, targetReceipt: 4000000, cardDiscountRate: 0.03, normalGcash: 260000 },
    { label: '500만', minSpend: 5264000, targetReceipt: 5000000, cardDiscountRate: 0.05, normalGcash: 325000 },
    { label: '700만', minSpend: 7369000, targetReceipt: 7000000, cardDiscountRate: 0.05, normalGcash: 325000 },
    { label: '1000만', minSpend: 10527000, targetReceipt: 10000000, cardDiscountRate: 0.05, normalGcash: 650000 },
    { label: '1500만', minSpend: 15790000, targetReceipt: 15000000, cardDiscountRate: 0.05, normalGcash: 975000 },
    { label: '2000만', minSpend: 21053000, targetReceipt: 20000000, cardDiscountRate: 0.05, normalGcash: 1300000 }
  ];

  const getTierForAmount = (amt) => {
    let matched = null;
    let nextTier = DEPT_TIERS[0];
    for (let i = DEPT_TIERS.length - 1; i >= 0; i--) {
      if (amt >= DEPT_TIERS[i].minSpend) {
        matched = DEPT_TIERS[i];
        nextTier = DEPT_TIERS[i + 1] || null;
        break;
      }
    }
    if (!matched) nextTier = DEPT_TIERS[0];
    return { matched, nextTier };
  };

  const getGcashForTier = (tier) => {
    if (!tier) return 0;
    if (tier.minSpend >= 5264000) {
      return Math.round(tier.targetReceipt * (deptRewardRate / 100));
    }
    return tier.normalGcash;
  };

  const deptEnginePlan = (() => {
    if (deptCardCount === 1) {
      if (deptEffectiveGross <= 21053000) {
        const { matched: tier, nextTier } = getTierForAmount(deptEffectiveGross);
        const tierGcash = getGcashForTier(tier);
        const baseGcash = tierGcash + deptPhoneGcash;
        let bonusGcash = 0;
        if (baseGcash >= 2000000) bonusGcash = 130000;
        else if (baseGcash >= 1000000) bonusGcash = 65000;
        const totalGcash = baseGcash + bonusGcash;

        // 유효기간 분리 (기본 6.5%는 5년, 우대율 초과 추가분은 60일)
        const tierNormal = tier ? tier.normalGcash : 0;
        const gcash60Day = tier && tier.minSpend >= 5264000 ? Math.max(0, tierGcash - tierNormal) : 0;
        const gcash5Year = Math.max(0, totalGcash - gcash60Day);

        // 1) 전부 적립 시뮬레이션
        const rewardApplianceApproval = deptPhoneGross > 0 ? Math.max(0, deptEffectiveGross - deptPhoneGross) : deptEffectiveGross;
        const rewardCardDiscount = tier ? Math.floor(rewardApplianceApproval * tier.cardDiscountRate) : 0;
        const rewardFinalPerceived = deptEffectiveGross - rewardCardDiscount - totalGcash;

        // 2) 부분 차감 시뮬레이션 (마지노선 방어)
        let partialSafeDeduct = 0;
        let partialSafeReward = totalGcash;
        if (tier) {
          if (deptEffectiveGross - totalGcash >= tier.minSpend) {
            partialSafeDeduct = totalGcash;
            partialSafeReward = 0;
          } else if (deptEffectiveGross >= tier.minSpend) {
            partialSafeDeduct = Math.max(0, deptEffectiveGross - tier.minSpend);
            partialSafeReward = totalGcash - partialSafeDeduct;
          }
        }
        const partialCardApproval = deptEffectiveGross - partialSafeDeduct;
        const partialApplianceApproval = deptPhoneGross > 0 ? Math.max(0, partialCardApproval - deptPhoneGross) : partialCardApproval;
        const partialCardDiscount = tier ? Math.floor(partialApplianceApproval * tier.cardDiscountRate) : 0;
        const partialFinalPerceived = deptEffectiveGross - partialCardDiscount - totalGcash;

        // 3) 전부 차감 시뮬레이션 (G캐시 0원 올인)
        const fullSafeDeduct = totalGcash;
        const fullSafeReward = 0;
        const fullCardApproval = Math.max(0, deptEffectiveGross - fullSafeDeduct);
        const fullApplianceApproval = deptPhoneGross > 0 ? Math.max(0, fullCardApproval - deptPhoneGross) : fullCardApproval;
        const fullCardDiscount = tier ? Math.floor(fullApplianceApproval * tier.cardDiscountRate) : 0;
        const fullFinalPerceived = deptEffectiveGross - fullCardDiscount - totalGcash;

        // 현재 선택된 전략에 따른 active 값
        let safeDeduct = 0;
        let safeReward = totalGcash;
        let safeMode = 'reward_only';
        if (deptStrategy === 'full') {
          safeDeduct = fullSafeDeduct;
          safeReward = fullSafeReward;
          safeMode = 'full_instant';
        } else if (deptStrategy === 'partial' || deptStrategy === 'instant') {
          safeDeduct = partialSafeDeduct;
          safeReward = partialSafeReward;
          safeMode = safeDeduct >= totalGcash ? 'full_instant' : (safeDeduct > 0 ? 'partial_instant' : 'reward_only');
        }

        const cardApproval = deptEffectiveGross - safeDeduct;
        const applianceApproval = deptPhoneGross > 0 ? Math.max(0, cardApproval - deptPhoneGross) : cardApproval;
        const cardDiscount = tier ? Math.floor(applianceApproval * tier.cardDiscountRate) : 0;
        const finalPerceived = deptEffectiveGross - cardDiscount - totalGcash;

        let jumpTip = null;
        if (nextTier) {
          const needMore = nextTier.minSpend - deptEffectiveGross;
          if (needMore > 0 && needMore <= 1500000) {
            const nextGcash = getGcashForTier(nextTier);
            const extraBenefit = (nextGcash - baseGcash) + Math.floor(nextTier.minSpend * nextTier.cardDiscountRate) - cardDiscount;
            jumpTip = {
              nextLabel: nextTier.label,
              needMore,
              nextGcash,
              extraBenefit
            };
          }
        }

        return {
          mode: 'single',
          applianceGross: deptApplianceGross,
          phoneGross: deptPhoneGross,
          effectiveGross: deptEffectiveGross,
          tierLabel: tier ? tier.label : '구간 미달 (300만 미만)',
          cardApproval,
          cardDiscount,
          baseGcash,
          bonusGcash,
          totalGcash,
          gcash5Year,
          gcash60Day,
          safeDeduct,
          safeReward,
          safeMode,
          rewardPlan: {
            cardApproval: deptEffectiveGross,
            safeDeduct: 0,
            safeReward: totalGcash,
            totalCardDiscount: rewardCardDiscount,
            finalPerceived: rewardFinalPerceived
          },
          partialPlan: {
            cardApproval: partialCardApproval,
            safeDeduct: partialSafeDeduct,
            safeReward: partialSafeReward,
            totalCardDiscount: partialCardDiscount,
            finalPerceived: partialFinalPerceived
          },
          fullPlan: {
            cardApproval: fullCardApproval,
            safeDeduct: fullSafeDeduct,
            safeReward: fullSafeReward,
            totalCardDiscount: fullCardDiscount,
            finalPerceived: fullFinalPerceived
          },
          rewardCardApproval: deptEffectiveGross,
          rewardCardDiscount,
          rewardFinalPerceived,
          instantSafeDeduct: partialSafeDeduct,
          instantSafeReward: partialSafeReward,
          instantCardApproval: partialCardApproval,
          instantCardDiscount: partialCardDiscount,
          instantFinalPerceived: partialFinalPerceived,
          totalCardDiscount: cardDiscount,
          finalPerceived,
          posSteps: [
            {
              step: 1,
              label: '1차 제휴카드 승인 (가전)',
              amount: applianceApproval,
              barcodeType: 'appliance',
              barcodeTail: '907',
              barcodeBadge: '가전 907',
              discountRate: tier ? tier.cardDiscountRate : 0,
              discountAmount: cardDiscount,
              receiptAmount: Math.max(0, applianceApproval - cardDiscount),
              note: tier ? `${(tier.cardDiscountRate * 100).toFixed(0)}% 청구할인 [가전 수수료율]` : '청구할인 미적용'
            },
            deptPhoneGross > 0 ? {
              step: '자급제',
              label: '📱 자급제폰 결제 승인',
              amount: deptPhoneGross,
              barcodeType: 'phone',
              barcodeTail: '606',
              barcodeBadge: '자급제 606',
              discountRate: 0,
              discountAmount: 0,
              receiptAmount: deptPhoneGross,
              note: '⚠️ 자급제 전용 수수료율 적용 (가전 바코드 스캔 절대 금지! 100만당 4만 G캐시)'
            } : null,
            safeDeduct > 0 ? {
              step: '선차감',
              label: 'G캐시 선차감 결제',
              amount: safeDeduct,
              barcodeBadge: 'G캐시',
              discountRate: 0,
              discountAmount: 0,
              receiptAmount: safeDeduct,
              note: '결제 즉시 차감'
            } : null,
            safeReward > 0 ? {
              step: '증정',
              label: '💰 고객 G캐시 순적립',
              amount: safeReward,
              barcodeBadge: '앱 적립',
              discountRate: 0,
              discountAmount: 0,
              receiptAmount: safeReward,
              note: `백화점 모바일 앱 지급 (5년: ${formatWon(gcash5Year)} / 60일: ${formatWon(gcash60Day)})`
            } : null
          ].filter(Boolean),
          jumpTip
        };
      }

      // 2000만 초과: 1인 분할 비기 모드 (400만 / 300만 / 200만 / 100만 구간 지능형 매칭)
      const step1MinSpend = 21053000;
      let step2Approval = 0;
      let step2Gcash = 0;
      let step2Label = '';
      let step2DiscountRate = 0;

      if (deptApplianceGross - step1MinSpend >= 4124000) {
        // 400만 구간 우선 매칭 (마지노선 4,124,000원 / 3% 청구할인 / 6.5% G캐시 260,000원)
        step2Approval = 4124000;
        step2Gcash = 260000;
        step2Label = '400만';
        step2DiscountRate = 0.03;
      } else if (deptApplianceGross - step1MinSpend >= 3093000) {
        // 300만 구간 매칭 (마지노선 3,093,000원 / 3% 청구할인 / 6.5% G캐시 195,000원)
        step2Approval = 3093000;
        step2Gcash = 195000;
        step2Label = '300만';
        step2DiscountRate = 0.03;
      } else if (deptApplianceGross - step1MinSpend >= 2000000) {
        // 200만 구간 매칭 (2,000,000원 결제 / 청구할인 없음 / 6.5% G캐시 130,000원)
        step2Approval = 2000000;
        step2Gcash = 130000;
        step2Label = '200만';
        step2DiscountRate = 0;
      } else if (deptApplianceGross - step1MinSpend >= 1000000) {
        // 100만 구간 매칭 (1,000,000원 결제 / 청구할인 없음 / 6.5% G캐시 65,000원)
        step2Approval = 1000000;
        step2Gcash = 65000;
        step2Label = '100만';
        step2DiscountRate = 0;
      }

      const remainingForStep1And3 = deptApplianceGross - step2Approval;
      // 1차 카드는 2,000만원 마지노선(21,053,000원)을 안전하게 넘기며, 5% 청구할인을 받을 수 있도록 자투리 잔여금을 온전히 1차 카드에 배정!
      let step1Approval = remainingForStep1And3;
      const step1Tier = DEPT_TIERS.find((t) => t.label === '2000만') || DEPT_TIERS[DEPT_TIERS.length - 1];
      const step1Gcash = Math.round(step1Tier.targetReceipt * (deptRewardRate / 100));

      let step3Approval = 0;
      let step3Gcash = 0;

      const totalGcash = step1Gcash + step2Gcash + step3Gcash + deptPhoneGcash;

      // 유효기간 분리 (1인 3분할: 1차 2000만 우대 초과분은 60일, 나머지 2차/3차/자급제 및 기본 130만은 5년)
      const gcash60Day = Math.max(0, step1Gcash - 1300000);
      const gcash5Year = Math.max(0, totalGcash - gcash60Day);

      // 1) 전부 적립 시뮬레이션
      const rewardStep1Approval = step1Approval;
      const rewardStep2Approval = step2Approval;
      const rewardCardApproval = deptEffectiveGross;
      const rewardStep1Discount = Math.floor(rewardStep1Approval * 0.05);
      const rewardStep2Discount = rewardStep2Approval > 0 ? Math.floor(rewardStep2Approval * step2DiscountRate) : 0;
      const rewardCardDiscount = rewardStep1Discount + rewardStep2Discount;
      const rewardFinalPerceived = deptEffectiveGross - rewardCardDiscount - totalGcash;

      // 2) 부분 차감 시뮬레이션 (마지노선 방어)
      const partDeduct3 = Math.min(step3Approval, totalGcash);
      const partRem = totalGcash - partDeduct3;
      const partMargin = Math.max(0, step1Approval - 21053000);
      const partDeduct1 = Math.min(partMargin, partRem);
      const partialSafeDeduct = partDeduct3 + partDeduct1;
      const partialSafeReward = totalGcash - partialSafeDeduct;
      const partStep1Approval = step1Approval - partDeduct1;
      const partStep2Approval = step2Approval;
      const partialCardApproval = partStep1Approval + partStep2Approval + (step3Approval - partDeduct3) + deptPhoneGross;
      const partialStep1Discount = Math.floor(partStep1Approval * 0.05);
      const partialStep2Discount = partStep2Approval > 0 ? Math.floor(partStep2Approval * step2DiscountRate) : 0;
      const partialCardDiscount = partialStep1Discount + partialStep2Discount;
      const partialFinalPerceived = deptEffectiveGross - partialCardDiscount - totalGcash;

      // 3) 전부 차감 시뮬레이션 (G캐시 0원 올인):
      // [사용자 특명]: 300만원 이하 구간은 청구할인이 없음!
      // 따라서 300만원 미만 구간에서는 2차 카드는 딱 200만원만 결제하고 13만원 챙기고,
      // 나머지 모든 자투리는 5% 청구할인을 받을 수 있는 1차 카드(2,000만원 이상)에 갖다 붙여서 계산!
      let fullStep2Approval = 0;
      let fullStep2Discount = 0;
      let fullStep2Gcash = 0;
      let fullStep2Label = '';
      let fullStep2DiscountRate = 0;

      if ((deptApplianceGross - step3Approval) - (step1Gcash + 260000) - 21053000 >= 4124000) {
        fullStep2Approval = (deptApplianceGross - step3Approval) - (step1Gcash + 260000) - 21053000;
        fullStep2DiscountRate = 0.03;
        fullStep2Discount = Math.floor(fullStep2Approval * 0.03);
        fullStep2Gcash = 260000;
        fullStep2Label = '400만';
      } else if ((deptApplianceGross - step3Approval) - (step1Gcash + 195000) - 21053000 >= 3093000) {
        fullStep2Approval = (deptApplianceGross - step3Approval) - (step1Gcash + 195000) - 21053000;
        fullStep2DiscountRate = 0.03;
        fullStep2Discount = Math.floor(fullStep2Approval * 0.03);
        fullStep2Gcash = 195000;
        fullStep2Label = '300만';
      } else if (deptApplianceGross - step1Gcash >= 21053000 + 2000000) {
        // 딱 200만원 결제, 청구할인 0원, 13만원 사은 챙김, 나머지 자투리는 전부 1차 카드에 배정!
        fullStep2Approval = 2000000;
        fullStep2DiscountRate = 0;
        fullStep2Discount = 0;
        fullStep2Gcash = 130000;
        fullStep2Label = '200만';
      } else if (deptApplianceGross - step1Gcash >= 21053000 + 1000000) {
        fullStep2Approval = 1000000;
        fullStep2DiscountRate = 0;
        fullStep2Discount = 0;
        fullStep2Gcash = 65000;
        fullStep2Label = '100만';
      } else {
        fullStep2Approval = 0;
        fullStep2DiscountRate = 0;
        fullStep2Discount = 0;
        fullStep2Gcash = 0;
        fullStep2Label = '미달';
      }

      const fullTotalGcash = step1Gcash + fullStep2Gcash + deptPhoneGcash;
      const fullSafeDeduct = fullTotalGcash;
      const fullSafeReward = 0;

      // 1차 카드 승인: 전체 가전 원금에서 2차 승인액(200만)을 뺀 뒤, 총 G캐시를 전액 선차감!
      // (자투리 금액이 1차 카드에 다 붙어 2,000만 상한 마지노선을 완벽히 초과 수령!)
      const fullStep1Approval = Math.max(21053000, (deptApplianceGross - fullStep2Approval) - fullTotalGcash);
      const fullStep1Discount = Math.floor(fullStep1Approval * 0.05);
      const fullTotalCardDiscount = fullStep1Discount + fullStep2Discount;
      const fullCardApproval = fullStep1Approval + fullStep2Approval + deptPhoneGross;
      const fullFinalPerceived = deptEffectiveGross - fullTotalCardDiscount - fullTotalGcash;
      const fullDeduct1 = fullSafeDeduct;
      const fullDeduct2 = 0;
      const fullDeduct3 = 0;

      // 현재 선택된 전략에 따른 active 값
      let deduct1 = 0;
      let deduct2 = 0;
      let deduct3 = 0;
      let safeDeduct = 0;
      let safeReward = totalGcash;
      let safeMode = 'reward_only';
      let activeTotalGcash = totalGcash;
      let activeStep2Gcash = step2Gcash;
      let activeStep2Label = step2Label || '400만';
      let activeStep2DiscountRate = step2DiscountRate;
      let activeStep1Discount = 0;
      let activeStep2Discount = 0;
      let activeTotalCardDiscount = 0;
      let activeFinalPerceived = 0;
      let activeStep1ActualApproval = 0;
      let activeStep2ActualApproval = 0;
      let activeStep3ActualApproval = 0;
      let activeCardApproval = 0;

      if (deptStrategy === 'full') {
        deduct1 = fullDeduct1;
        deduct2 = fullDeduct2;
        deduct3 = fullDeduct3;
        safeDeduct = fullSafeDeduct;
        safeReward = fullSafeReward;
        safeMode = 'full_instant';
        activeTotalGcash = fullTotalGcash;
        activeStep2Gcash = fullStep2Gcash;
        activeStep2Label = fullStep2Label;
        activeStep2DiscountRate = fullStep2DiscountRate;
        activeStep1ActualApproval = fullStep1Approval;
        activeStep2ActualApproval = fullStep2Approval;
        activeStep3ActualApproval = 0;
        activeCardApproval = fullCardApproval;
        activeStep1Discount = fullStep1Discount;
        activeStep2Discount = fullStep2Discount;
        activeTotalCardDiscount = fullTotalCardDiscount;
        activeFinalPerceived = fullFinalPerceived;
      } else if (deptStrategy === 'partial' || deptStrategy === 'instant') {
        deduct1 = partDeduct1;
        deduct2 = 0;
        deduct3 = partDeduct3;
        safeDeduct = partialSafeDeduct;
        safeReward = partialSafeReward;
        safeMode = safeDeduct >= totalGcash ? 'full_instant' : (safeDeduct > 0 ? 'partial_instant' : 'reward_only');
        activeTotalGcash = totalGcash;
        activeStep2Gcash = step2Gcash;
        activeStep2Label = step2Label || '400만';
        activeStep2DiscountRate = step2DiscountRate;
        activeStep1ActualApproval = partStep1Approval;
        activeStep2ActualApproval = partStep2Approval;
        activeStep3ActualApproval = step3Approval - partDeduct3;
        activeCardApproval = partialCardApproval;
        activeStep1Discount = partialStep1Discount;
        activeStep2Discount = partialStep2Discount;
        activeTotalCardDiscount = partialCardDiscount;
        activeFinalPerceived = partialFinalPerceived;
      } else {
        // reward (전액 적립)
        deduct1 = 0;
        deduct2 = 0;
        deduct3 = 0;
        safeDeduct = 0;
        safeReward = totalGcash;
        safeMode = 'reward_only';
        activeTotalGcash = totalGcash;
        activeStep2Gcash = step2Gcash;
        activeStep2Label = step2Label || '400만';
        activeStep2DiscountRate = step2DiscountRate;
        activeStep1ActualApproval = rewardStep1Approval;
        activeStep2ActualApproval = rewardStep2Approval;
        activeStep3ActualApproval = step3Approval;
        activeCardApproval = rewardCardApproval;
        activeStep1Discount = rewardStep1Discount;
        activeStep2Discount = rewardStep2Discount;
        activeTotalCardDiscount = rewardCardDiscount;
        activeFinalPerceived = rewardFinalPerceived;
      }

      const step1ActualApproval = activeStep1ActualApproval;
      const step2ActualApproval = activeStep2ActualApproval;
      const step3ActualApproval = activeStep3ActualApproval;
      const cardApproval = activeCardApproval;
      const step1Discount = activeStep1Discount;
      const step2Discount = activeStep2Discount;
      const totalCardDiscount = activeTotalCardDiscount;
      const finalPerceived = activeFinalPerceived;
      const currentGcash = activeTotalGcash;

      let jumpTip = null;
      const jumpTarget = 21053000 + 5264000;
      if (deptEffectiveGross < jumpTarget && (jumpTarget - deptEffectiveGross) <= 1000000) {
        jumpTip = {
          needMore: jumpTarget - deptEffectiveGross,
          message: `단 ${(jumpTarget - deptEffectiveGross).toLocaleString()}원만 추가 시 [2,000만 + 500만] 동시 점프! G캐시 폭증!`
        };
      }

      return {
        mode: '1person_3split',
        applianceGross: deptApplianceGross,
        phoneGross: deptPhoneGross,
        effectiveGross: deptEffectiveGross,
        step1Approval: step1ActualApproval,
        step1BaseApproval: step1Approval,
        step1Discount,
        step1Gcash,
        step2Approval: step2ActualApproval,
        step2BaseApproval: step2Approval,
        step2Discount,
        step2Gcash: activeStep2Gcash,
        step2Label: activeStep2Label,
        step3Approval: step3ActualApproval,
        step3BaseApproval: step3Approval,
        step3Gcash,
        totalCardDiscount,
        totalGcash: currentGcash,
        gcash5Year,
        gcash60Day,
        safeDeduct,
        safeReward,
        safeMode,
        deduct1,
        deduct2,
        deduct3,
        cardApproval,
        rewardPlan: {
          cardApproval: rewardCardApproval,
          safeDeduct: 0,
          safeReward: totalGcash,
          totalGcash: totalGcash,
          step2Label: step2Label || '400만',
          step2Gcash: step2Gcash,
          totalCardDiscount: rewardCardDiscount,
          finalPerceived: rewardFinalPerceived
        },
        partialPlan: {
          cardApproval: partialCardApproval,
          safeDeduct: partialSafeDeduct,
          safeReward: partialSafeReward,
          totalGcash: totalGcash,
          step2Label: step2Label || '400만',
          step2Gcash: step2Gcash,
          totalCardDiscount: partialCardDiscount,
          finalPerceived: partialFinalPerceived
        },
        fullPlan: {
          cardApproval: fullCardApproval,
          safeDeduct: fullSafeDeduct,
          safeReward: 0,
          totalGcash: fullTotalGcash,
          step2Label: fullStep2Label || '200만',
          step2Gcash: fullStep2Gcash,
          totalCardDiscount: fullTotalCardDiscount,
          finalPerceived: fullFinalPerceived
        },
        rewardCardApproval,
        rewardCardDiscount,
        rewardFinalPerceived,
        instantSafeDeduct: partialSafeDeduct,
        instantSafeReward: partialSafeReward,
        instantCardApproval: partialCardApproval,
        instantCardDiscount: partialCardDiscount,
        instantFinalPerceived: partialFinalPerceived,
        finalPerceived,
        posSteps: [
          {
            step: 1,
            label: '1차 제휴카드 결제 (가전)',
            amount: step1ActualApproval,
            barcodeType: 'appliance',
            barcodeTail: '907',
            barcodeBadge: '가전 907',
            discountRate: 0.05,
            discountAmount: step1Discount,
            receiptAmount: Math.max(0, step1ActualApproval - step1Discount),
            note: `5% 청구할인 + ${deptRewardRate}% 우대 사은 (2,000만 상한 사수)${deduct1 > 0 ? ` [자투리 합산 및 G캐시 ${formatWon(deduct1)} 선차감 반영]` : ''}`
          },
          step2ActualApproval > 0 ? {
            step: 2,
            label: '2차 제휴카드 결제 (가전)',
            amount: step2ActualApproval,
            barcodeType: 'appliance',
            barcodeTail: '907',
            barcodeBadge: '가전 907',
            discountRate: activeStep2DiscountRate,
            discountAmount: step2Discount,
            receiptAmount: Math.max(0, step2ActualApproval - step2Discount),
            note: activeStep2DiscountRate > 0
              ? `3% 청구할인 + 6.5% 일반 사은 (${activeStep2Label} 구간: ${formatWon(activeStep2Gcash)})${deduct2 > 0 ? ` [G캐시 ${formatWon(deduct2)} 선차감]` : ''} [가전 수수료율]`
              : `300만 미만 청구할인 미대상 (0원) + 6.5% 사은 (${activeStep2Label} ${formatWon(step2ActualApproval)} 결제: 사은 ${formatWon(activeStep2Gcash)} 챙김) [가전 수수료율]`
          } : null,
          step3ActualApproval > 0 ? {
            step: 3,
            label: '3차 일반/카드 결제 (가전)',
            amount: step3ActualApproval,
            barcodeType: 'appliance',
            barcodeTail: '907',
            barcodeBadge: '가전 907',
            discountRate: 0,
            discountAmount: 0,
            receiptAmount: step3ActualApproval,
            note: step3Gcash > 0 ? '6.5% 일반 사은 (100만 단위) [가전 수수료율]' : '가전 자투리 결제'
          } : null,
          deptPhoneGross > 0 ? {
            step: '자급제',
            label: '📱 자급제폰 단독 승인',
            amount: deptPhoneGross,
            barcodeType: 'phone',
            barcodeTail: '606',
            barcodeBadge: '자급제 606',
            discountRate: 0,
            discountAmount: 0,
            receiptAmount: deptPhoneGross,
            note: '⚠️ 자급제 전용 수수료율 적용 (가전 바코드 스캔 절대 금지! 100만당 4만 G캐시)'
          } : null,
          safeDeduct > 0 ? {
            step: '선차감',
            label: deptStrategy === 'full' ? '⚡ G캐시 전액 올인 선차감' : '⚡ G캐시 안전 선차감 결제',
            amount: safeDeduct,
            barcodeBadge: 'G캐시',
            discountRate: 0,
            discountAmount: 0,
            receiptAmount: safeDeduct,
            note: `결제 시 G캐시 즉시 차감 (${deptStrategy === 'full' ? 'G캐시 0원 올인 차감: ' : '마지노선 사수: '}1차 ${formatWon(deduct1)}${deduct2 > 0 ? ` + 2차 ${formatWon(deduct2)}` : ''}${deduct3 > 0 ? ` + 3차 ${formatWon(deduct3)}` : ''})`
          } : null,
          safeReward > 0 ? {
            step: '증정',
            label: safeDeduct > 0 ? '💰 고객 잔여 순적립 G캐시' : '💰 고객 최종 순적립 G캐시',
            amount: safeReward,
            barcodeBadge: '앱 적립',
            discountRate: 0,
            discountAmount: 0,
            receiptAmount: safeReward,
            note: `백화점 모바일 앱 지급 (5년: ${formatWon(gcash5Year)} / 60일: ${formatWon(gcash60Day)})`
          } : null
        ].filter(Boolean),
        jumpTip
      };
    }

    // 2인 2카드 분할
    const ratio = Math.max(10, Math.min(90, deptSplitSlider)) / 100;
    const card1Amount = Math.round((deptApplianceGross * ratio) / 10000) * 10000;
    const card2Amount = deptApplianceGross - card1Amount;

    const { matched: t1 } = getTierForAmount(card1Amount);
    const { matched: t2, nextTier: t2Next } = getTierForAmount(card2Amount);

    const c1Gcash = getGcashForTier(t1);
    const c2Gcash = getGcashForTier(t2);

    const totalGcash = c1Gcash + c2Gcash + deptPhoneGcash;

    // 유효기간 분리 (2인 2카드: 각 카드가 500만 이상일 때 우대 추가분은 60일, 나머지는 5년)
    const c1Extra = t1 && t1.minSpend >= 5264000 ? Math.max(0, c1Gcash - t1.normalGcash) : 0;
    const c2Extra = t2 && t2.minSpend >= 5264000 ? Math.max(0, c2Gcash - t2.normalGcash) : 0;
    const gcash60Day = c1Extra + c2Extra;
    const gcash5Year = Math.max(0, totalGcash - gcash60Day);

    // 1) 전부 적립 시뮬레이션
    const rewardCardApproval = deptEffectiveGross;
    const rewardC1Discount = t1 ? Math.floor(card1Amount * t1.cardDiscountRate) : 0;
    const rewardC2Discount = t2 ? Math.floor(card2Amount * t2.cardDiscountRate) : 0;
    const rewardCardDiscount = rewardC1Discount + rewardC2Discount;
    const rewardFinalPerceived = deptEffectiveGross - rewardCardDiscount - totalGcash;

    // 2) 부분 차감 시뮬레이션 (마지노선 방어)
    const compM2 = t2 ? Math.max(0, card2Amount - t2.minSpend) : card2Amount;
    const compM1 = t1 ? Math.max(0, card1Amount - t1.minSpend) : card1Amount;
    const compCd2 = Math.min(compM2, totalGcash);
    const compCd1 = Math.min(compM1, totalGcash - compCd2);
    const partialSafeDeduct = compCd2 + compCd1;
    const partialSafeReward = totalGcash - partialSafeDeduct;
    const partCard1Actual = card1Amount - compCd1;
    const partCard2Actual = card2Amount - compCd2;
    const partialCardApproval = partCard1Actual + partCard2Actual + deptPhoneGross;
    const partialC1Discount = t1 ? Math.floor(partCard1Actual * t1.cardDiscountRate) : 0;
    const partialC2Discount = t2 ? Math.floor(partCard2Actual * t2.cardDiscountRate) : 0;
    const partialCardDiscount = partialC1Discount + partialC2Discount;
    const partialFinalPerceived = deptEffectiveGross - partialCardDiscount - totalGcash;

    // 3) 전부 차감 시뮬레이션 (G캐시 0원 올인)
    let fullC2Deduct = compCd2;
    let fullC1Deduct = compCd1;
    let fullRem = totalGcash - (fullC2Deduct + fullC1Deduct);
    if (fullRem > 0) {
      const extra2 = Math.min(card2Amount - fullC2Deduct, fullRem);
      fullC2Deduct += extra2;
      fullRem -= extra2;
    }
    if (fullRem > 0) {
      fullC1Deduct += fullRem;
      fullRem = 0;
    }
    const fullSafeDeduct = totalGcash;
    const fullSafeReward = 0;
    const fullCard1Actual = card1Amount - fullC1Deduct;
    const fullCard2Actual = card2Amount - fullC2Deduct;
    const fullCardApproval = fullCard1Actual + fullCard2Actual + deptPhoneGross;
    const fullC1Discount = t1 ? Math.floor(fullCard1Actual * t1.cardDiscountRate) : 0;
    const fullC2Discount = t2 ? Math.floor(fullCard2Actual * t2.cardDiscountRate) : 0;
    const fullCardDiscount = fullC1Discount + fullC2Discount;
    const fullFinalPerceived = deptEffectiveGross - fullCardDiscount - totalGcash;

    // 현재 선택된 전략에 따른 active 값
    let c1Deduct = 0;
    let c2Deduct = 0;
    let safeDeduct = 0;
    let safeReward = totalGcash;
    let safeMode = 'reward_only';

    if (deptStrategy === 'full') {
      c1Deduct = fullC1Deduct;
      c2Deduct = fullC2Deduct;
      safeDeduct = fullSafeDeduct;
      safeReward = fullSafeReward;
      safeMode = 'full_instant';
    } else if (deptStrategy === 'partial' || deptStrategy === 'instant') {
      c1Deduct = compCd1;
      c2Deduct = compCd2;
      safeDeduct = partialSafeDeduct;
      safeReward = partialSafeReward;
      safeMode = safeDeduct >= totalGcash ? 'full_instant' : (safeDeduct > 0 ? 'partial_instant' : 'reward_only');
    }

    const card1Actual = card1Amount - c1Deduct;
    const card2Actual = card2Amount - c2Deduct;
    const cardApproval = card1Actual + card2Actual + deptPhoneGross;

    // 실제 카드 승인액에 대한 카드사 청구할인 계산
    const c1Discount = t1 ? Math.floor(card1Actual * t1.cardDiscountRate) : 0;
    const c2Discount = t2 ? Math.floor(card2Actual * t2.cardDiscountRate) : 0;
    const totalCardDiscount = c1Discount + c2Discount;
    const finalPerceived = deptEffectiveGross - totalCardDiscount - totalGcash;

    let jumpTip = null;
    if (t2Next) {
      const needMore = t2Next.minSpend - card2Amount;
      if (needMore > 0 && needMore <= 1000000) {
        const nextGcash = getGcashForTier(t2Next);
        const extraGcash = nextGcash - c2Gcash;
        jumpTip = {
          card: '신부 카드',
          nextLabel: t2Next.label,
          needMore,
          extraGcash
        };
      }
    }

    return {
      mode: '2person_2cards',
      applianceGross: deptApplianceGross,
      phoneGross: deptPhoneGross,
      effectiveGross: deptEffectiveGross,
      card1Amount: card1Actual,
      card1BaseAmount: card1Amount,
      card1Tier: t1 ? t1.label : '미달',
      card1Discount: c1Discount,
      card1Gcash: c1Gcash,
      card2Amount: card2Actual,
      card2BaseAmount: card2Amount,
      card2Tier: t2 ? t2.label : '미달',
      card2Discount: c2Discount,
      card2Gcash: c2Gcash,
      totalCardDiscount,
      totalGcash,
      gcash5Year,
      gcash60Day,
      safeDeduct,
      safeReward,
      safeMode,
      c1Deduct,
      c2Deduct,
      cardApproval,
      rewardPlan: {
        cardApproval: rewardCardApproval,
        safeDeduct: 0,
        safeReward: totalGcash,
        totalCardDiscount: rewardCardDiscount,
        finalPerceived: rewardFinalPerceived
      },
      partialPlan: {
        cardApproval: partialCardApproval,
        safeDeduct: partialSafeDeduct,
        safeReward: partialSafeReward,
        totalCardDiscount: partialCardDiscount,
        finalPerceived: partialFinalPerceived
      },
      fullPlan: {
        cardApproval: fullCardApproval,
        safeDeduct: fullSafeDeduct,
        safeReward: fullSafeReward,
        totalCardDiscount: fullCardDiscount,
        finalPerceived: fullFinalPerceived
      },
      rewardCardApproval,
      rewardCardDiscount,
      rewardFinalPerceived,
      instantSafeDeduct: partialSafeDeduct,
      instantSafeReward: partialSafeReward,
      instantCardApproval: partialCardApproval,
      instantCardDiscount: partialCardDiscount,
      instantFinalPerceived: partialFinalPerceived,
      finalPerceived,
      posSteps: [
        {
          step: 1,
          label: '1번 카드 승인 (신랑 - 가전)',
          amount: card1Actual,
          barcodeType: 'appliance',
          barcodeTail: '907',
          barcodeBadge: '가전 907',
          discountRate: t1 ? t1.cardDiscountRate : 0,
          discountAmount: c1Discount,
          receiptAmount: Math.max(0, card1Actual - c1Discount),
          note: t1 ? `${t1.label} 구간 (${(t1.cardDiscountRate * 100).toFixed(0)}% 청구할인 + 우대 G캐시)${c1Deduct > 0 ? ` [G캐시 ${formatWon(c1Deduct)} 선차감]` : ''} [가전 수수료율]` : '구간 미달'
        },
        {
          step: 2,
          label: '2번 카드 승인 (신부 - 가전)',
          amount: card2Actual,
          barcodeType: 'appliance',
          barcodeTail: '907',
          barcodeBadge: '가전 907',
          discountRate: t2 ? t2.cardDiscountRate : 0,
          discountAmount: c2Discount,
          receiptAmount: Math.max(0, card2Actual - c2Discount),
          note: t2 ? `${t2.label} 구간 (${(t2.cardDiscountRate * 100).toFixed(0)}% 청구할인 + 우대 G캐시)${c2Deduct > 0 ? ` [G캐시 ${formatWon(c2Deduct)} 선차감]` : ''} [가전 수수료율]` : '구간 미달'
        },
        deptPhoneGross > 0 ? {
          step: '자급제',
          label: '📱 자급제폰 단독 승인',
          amount: deptPhoneGross,
          barcodeType: 'phone',
          barcodeTail: '606',
          barcodeBadge: '자급제 606',
          discountRate: 0,
          discountAmount: 0,
          receiptAmount: deptPhoneGross,
          note: '⚠️ 자급제 전용 수수료율 적용 (가전 바코드 스캔 절대 금지! 100만당 4만 G캐시)'
        } : null,
        safeDeduct > 0 ? {
          step: '선차감',
          label: '⚡ G캐시 즉시 선차감 결제',
          amount: safeDeduct,
          barcodeBadge: 'G캐시',
          discountRate: 0,
          discountAmount: 0,
          receiptAmount: safeDeduct,
          note: `결제 시 G캐시 즉시 차감 (마지노선 사수: 1번 ${formatWon(c1Deduct)} / 2번 ${formatWon(c2Deduct)})`
        } : null,
        safeReward > 0 ? {
          step: '증정',
          label: safeDeduct > 0 ? '💰 고객 잔여 순적립 G캐시' : '💰 고객 최종 순적립 G캐시',
          amount: safeReward,
          barcodeBadge: '앱 적립',
          discountRate: 0,
          discountAmount: 0,
          receiptAmount: safeReward,
          note: `백화점 모바일 앱 지급 (5년: ${formatWon(gcash5Year)} / 60일: ${formatWon(gcash60Day)})`
        } : null
      ].filter(Boolean),
      jumpTip
    };
  })();

  const handleApplyDeptEnginePlan = () => {
    setMixedChannelType('dept');
    setMixedDeptCardDiscount(deptEnginePlan.totalCardDiscount);
    setMixedDeptDiscount(deptEnginePlan.totalCardDiscount);
    const isDeduct = deptStrategy === 'partial' || deptStrategy === 'instant' || deptStrategy === 'full';
    const voucherAmt = isDeduct && deptEnginePlan.safeDeduct > 0
      ? deptEnginePlan.safeDeduct
      : deptEnginePlan.totalGcash;
    setMixedDeptVoucherDiscount(voucherAmt);
    setMixedDeptVoucherMode(deptStrategy);
    setMixedDeptDiscountProof(true);
    showTempNotice(
      deptStrategy === 'full'
        ? `✓ 백화점 전액 선차감 혜택(G캐시 전액 차감 ${formatWon(voucherAmt)}, 청구할인 ${formatWon(deptEnginePlan.totalCardDiscount)})이 견적서에 자동 반영되었습니다.`
        : isDeduct
          ? `✓ 백화점 부분 선차감 혜택(G캐시 선차감 ${formatWon(voucherAmt)}, 청구할인 ${formatWon(deptEnginePlan.totalCardDiscount)})이 견적서에 자동 반영되었습니다.`
          : `✓ 백화점 전액 적립 혜택(청구할인 ${formatWon(deptEnginePlan.totalCardDiscount)}, G캐시 ${formatWon(deptEnginePlan.totalGcash)})이 견적서에 자동 반영되었습니다.`
    );
  };

  // 행사 접두사 (혼수 / 입주 / 이사 / 일반)
  const eventPrefix =
    mixedEventType === 'wedding'
      ? '혼수'
      : mixedEventType === 'moving_in'
        ? '입주'
        : mixedEventType === 'moving'
          ? '이사'
          : '일반';

  // 백화점(갤러리아): 제휴카드 청구할인 및 사은행사 상품권(G캐시)
  const deptCardDiscount = mixedChannelType === 'dept'
    ? (Number(mixedDeptCardDiscount) || Number(mixedDeptDiscount) || 0)
    : 0;
  const deptVoucherDiscount = mixedChannelType === 'dept'
    ? (Number(mixedDeptVoucherDiscount) || 0)
    : 0;
  const roadSpecificDiscount = mixedChannelType === 'road'
    ? (Number(mixedRoadDiscount) || 0)
    : 0;

  // 전체 체감 특정할인 총액 (청구할인 + 상품권 둘 다 체감 혜택에 포함)
  const mixedLumpSpecificDiscount = mixedChannelType === 'dept'
    ? (deptCardDiscount + deptVoucherDiscount)
    : roadSpecificDiscount;

  // 백화점 상품권(G캐시) 차감 모드 여부 ('instant' | 'partial' | 'full' 모두 차감으로 인식)
  const isDeptVoucherDeduct =
    mixedDeptVoucherMode === 'instant' ||
    mixedDeptVoucherMode === 'partial' ||
    mixedDeptVoucherMode === 'full';

  // 결제 시점에서 즉시 차감되는 금액:
  // 백화점 상품권의 경우: 차감 모드(instant/partial/full)는 결제 즉시 차감, 'reward'는 사후 적립(결제 시점 미차감)
  const mixedLumpInstantPaymentDiscount = mixedChannelType === 'dept'
    ? (deptCardDiscount + (isDeptVoucherDeduct ? deptVoucherDiscount : 0))
    : roadSpecificDiscount;

  const mixedSpecialDiscountProof =
    mixedChannelType === 'dept'
      ? mixedDeptDiscountProof
      : mixedRoadDiscountProof;

  const effectiveDeptNote =
    (mixedDeptDiscountNote || '').trim() || '백화점 제휴카드 청구할인';

  const effectiveRoadNote =
    (mixedRoadDiscountNote || '').trim() ||
    (mixedEventType === 'normal' ? '로드샵 플러스페이 특별할인' : `로드샵 ${eventPrefix} 특별할인`);

  const effectiveSpecialDiscountNote =
    mixedChannelType === 'dept' ? effectiveDeptNote : effectiveRoadNote;

  const mixedLumpDiscountTotal = mixedLumpModelDiscountTotal + mixedLumpSpecificDiscount;
  const mixedLumpBenefitSub = Math.max(0, mixedLumpGross - mixedLumpDiscountTotal); // 혜택가 소계 (상품권 포함 전체 혜택 차감: 940만원)
  const mixedLumpPaySub = Math.max(0, mixedLumpGross - mixedLumpModelDiscountTotal - mixedLumpInstantPaymentDiscount); // 실제 카드 결제금액 (적립형 상품권 미차감: 1040만원)
  const mixedLumpSubFinal = mixedLumpPaySub;

  // ---------------- 스마트 견적기 구독 모델 및 전용 서비스 통합 계산 ----------------

  // 통합 구독 기준총액 (할인 전 기본 월 구독료 × 개월수 × 수량)
  const mixedSubGrossTotal = mixedSubItems.reduce(
    (sum, it) => sum + getMixedSubItemCalc(it).baseGross,
    0
  );

  // 선납금 + 할인구독료 적용 후 구독 총액
  const mixedSubDiscountedGrossTotal = mixedSubItems.reduce(
    (sum, it) => sum + getMixedSubItemCalc(it).discountedGross,
    0
  );

  // 구독료 할인 혜택 총액 (기본 구독 총액 - 선납포함 할인 구독 총액 차액 합산)
  const mixedSubFeeDiscountTotal = mixedSubItems.reduce(
    (sum, it) => sum + getMixedSubItemCalc(it).feeDiscount,
    0
  );

  // 해당 모델들 선납금 총액
  const mixedSubPrepayTotal = mixedSubItems.reduce(
    (sum, it) => sum + getMixedSubItemCalc(it).prepay,
    0
  );

  // 해당 모델들 월 구독료(약정기간 전체) 합계 (할인구독료 × 개월수 × 수량)
  const mixedSubMonthlyTotalSum = mixedSubItems.reduce(
    (sum, it) => sum + getMixedSubItemCalc(it).monthlyTotal,
    0
  );

  // 무상수리(A/S) 혜택 총액 (월 이용금액 × 개월수 × 대수)
  const mixedSubFreeRepairTotal = mixedSubItems.reduce(
    (sum, it) => sum + (Number(it.freeRepairFee) || 0) * (Number(it.months) || 72) * getSubQty(it.quantity),
    0
  );
  // 가전 무상 A/S 및 모바일(무상+파손) 분리 계산
  const mixedApplianceRepairTotal = mixedSubItems
    .filter((it) => !it.isMobile)
    .reduce(
      (sum, it) => sum + (Number(it.freeRepairFee) || 0) * (Number(it.months) || 72) * getSubQty(it.quantity),
      0
    );
  const mixedMobileRepairTotal = mixedSubItems
    .filter((it) => it.isMobile)
    .reduce(
      (sum, it) => sum + (Number(it.freeRepairFee) || 0) * (Number(it.months) || 72) * getSubQty(it.quantity),
      0
    );

  // 케어서비스(소모품 + 방문케어) 혜택 총액
  const mixedSubCareTotal = mixedSubItems.reduce(
    (sum, it) => sum + ((Number(it.selfCareFee) || 0) + (Number(it.visitCareFee) || 0)) * getSubQty(it.quantity),
    0
  );

  // 구독 전용 서비스 총 혜택 (무상수리 + 케어)
  const mixedSubServiceBenefit = mixedSubFreeRepairTotal + mixedSubCareTotal;

  // 약정기간 목록 및 대표 요약
  const mixedSubMonthsList = [...new Set(validMixedSubItems.map((it) => Number(it.months) || 72))].sort((a, b) => b - a);
  const mixedSubPeriodSummary = mixedSubMonthsList.join('·') || '72';

  // 약정기간별 구독료 그룹화 (약정기간이 서로 다른 복수 품목일 때 견적서 표시용)
  const mixedSubMonthsGroups = (() => {
    const map = {};
    validMixedSubItems.forEach((it) => {
      const calc = getMixedSubItemCalc(it);
      const m = calc.months || 72;
      if (!map[m]) {
        map[m] = {
          months: m,
          monthlyFee: 0,
          monthlyTotal: 0,
          prepay: 0,
          discountedGross: 0,
          count: 0
        };
      }
      map[m].monthlyFee += calc.monthly * calc.qty;
      map[m].monthlyTotal += calc.monthlyTotal;
      map[m].prepay += calc.prepay;
      map[m].discountedGross += calc.discountedGross;
      map[m].count += calc.qty;
    });
    return Object.values(map).sort((a, b) => b.months - a.months);
  })();

  // 구독 총 혜택 (카드 청구할인 + 구독료 할인만 합산! 무상수리 및 케어서비스는 제외)
  const mixedSubOnlyDiscount = subCardTotalDiscount + mixedSubFeeDiscountTotal;

  // 구독 최종 체감 소계: 기준총액 - (구독료할인 + 카드할인) - (서비스혜택 체감가 차감 반영 시 서비스혜택)
  // ※ mixedSubGrossTotal - mixedSubFeeDiscountTotal (= mixedSubDiscountedGrossTotal)에 이미 선납금이 포함되어 있으므로 중복 합산하지 않음
  const mixedSubPerceivedPrice = Math.max(
    0,
    mixedSubGrossTotal - mixedSubOnlyDiscount - (includeServiceInFinal ? mixedSubServiceBenefit : 0)
  );

  // 구독 최종 체감 소계 (선납금 포함)
  const mixedSubFinalPrice = mixedSubPerceivedPrice;

  // 월 카드 적용 후 실납부액
  const mixedSubMonthlyAfterCard = Math.max(0, mixedSubMonthlyFeeTotal - startingTotalCardMonthly);

  // 통합 캐시백 및 상품권 지급액 (항목군 합산)
  const validMixedCashbackItems = mixedCashbackItems.filter(
    (it) => (Number(it.amount) || 0) > 0 || (it.name || '').trim()
  );
  const mixedTotalCashback = mixedCashbackItems.reduce(
    (sum, it) => sum + (Number(it.amount) || 0),
    0
  );

  const validMixedVoucherItems = mixedVoucherItems.filter(
    (it) => (Number(it.amount) || 0) > 0 || (it.name || '').trim()
  );
  const mixedTotalVoucher = mixedVoucherItems.reduce(
    (sum, it) => sum + (Number(it.amount) || 0),
    0
  );

  // 3번 섹션 통합 캐시백·상품권 혜택 총합 및 일반구매 3번 혜택 반영 최종 체감가
  const section3TotalBenefit = mixedTotalCashback + mixedTotalVoucher;
  const mixedLumpFinalNet = Math.max(0, mixedLumpBenefitSub - section3TotalBenefit);

  const hasAnyProofPolicy = Boolean(
    mixedCashbackItems.some((it) => it.hasProof && (Number(it.amount) || 0) > 0) ||
    mixedVoucherItems.some((it) => it.hasProof && (Number(it.amount) || 0) > 0) ||
    (mixedSpecialDiscountProof && mixedLumpSpecificDiscount > 0)
  );

  // 전체 기준 총액 (일반 기준총액 + 구독 기준총액만 합산: 10,740,000원 + 11,850,000원)
  const mixedGrandGross = mixedLumpGross + mixedSubGrossTotal;
  // 전체 총 혜택 = 구독 전용 직접할인 + 일반 특정조건 할인 + 통합 캐시백 + 상품권 지급 (무상/케어서비스 제외)
  const mixedGrandBenefit = mixedSubOnlyDiscount + mixedLumpDiscountTotal + mixedTotalCashback + mixedTotalVoucher;
  // 고객 최종 실체감가: 총 적용 혜택 + 구독 전용 무상/케어 서비스 가치까지 모두 반영!
  const mixedGrandFinal = Math.max(
    0,
    mixedGrandGross - mixedGrandBenefit - (includeServiceInFinal ? mixedSubServiceBenefit : 0)
  );
  const totalGrandSavings = mixedGrandBenefit + (includeServiceInFinal ? mixedSubServiceBenefit : 0);
  const mixedGrandBenefitRate = mixedGrandGross > 0 ? ((totalGrandSavings / mixedGrandGross) * 100).toFixed(1) : '0.0';

  // 납부 분리:
  // ① 초기 실결제 부담금: 일반 결제액 - 즉시 차감 혜택(통합 캐시백/상품권) + 구독 선납금
  const mixedInitialPayment = Math.max(0, mixedLumpSubFinal + mixedSubPrepayTotal - mixedTotalCashback - mixedTotalVoucher);
  // ② 구독 월 실납부액
  const mixedMonthlyPayment = mixedSubMonthlyAfterCard;

  const toggleCheckpoint = (id) => {
    setCheckpoints((prev) => prev.map((cp) => (cp.id === id ? { ...cp, checked: !cp.checked } : cp)));
  };

  const handleResetAll = () => {
    if (!window.confirm('입력하신 모든 계산 내역을 초기화하시겠습니까?')) return;
    setCustomerName('');
    setConsultDate(todayStr);
    setConsultType('신혼·혼수가전 맞춤설계');
    setProductSummary('');
    setMemo('');
    setLumpBasePrice(0);
    setLumpTotalBenefit(0);
    setSubInputMode('monthly');
    setSubPrepay(0);
    setSubPlans([
      {
        id: 1,
        name: '',
        quantity: 1,
        months: 72,
        monthlyFee: 0,
        totalAmount: 0,
        policyNote: '',
        policyDiscount: 0,
        isMobile: false,
        freeRepairFee: 0,
        careItems: []
      }
    ]);
    setSubCardName('');
    setSubCardMinSpend('');
    setSubCardMonthly(0);
    setSubCards([
      {
        id: 1,
        cardName: '',
        minSpend: '',
        monthly: 0,
        months: 72,
        segmentCardOverrides: {},
        segmentSpendOverrides: {}
      }
    ]);
    setSubCardAuto70k(true);
    setSubSegmentCardOverrides({});
    setSubSegmentSpendOverrides({});
    setSubPurchaseBenefit(0);
    setSubFreeServiceItems([{ id: 1, monthlyFee: 0, quantity: 1, months: 72, isMobile: false }]);
    setSubCareServiceItems([
      { id: 1, name: '소모품비용', amount: 0, count: 1, unit: '개' },
      { id: 2, name: '방문케어', amount: 0, count: 1, unit: '회' }
    ]);
    setIncludeServiceInFinal(true);
    setRecommendMode('auto');
    setCheckpoints(DEFAULT_CHECKPOINTS);
    setMixedSubItems(DEFAULT_MIXED_SUB_ITEMS);
    setMixedLumpItems(DEFAULT_MIXED_LUMP_ITEMS);
    setMixedEventType('wedding');
    setMixedCashbackItems(DEFAULT_MIXED_CASHBACK_ITEMS);
    setMixedVoucherItems(DEFAULT_MIXED_VOUCHER_ITEMS);
    setMixedChannelType('dept');
    setMixedDeptDiscount(0);
    setMixedDeptCardDiscount(0);
    setMixedDeptVoucherDiscount(0);
    setMixedDeptVoucherMode('instant');
    setMixedDeptDiscountNote('');
    setMixedDeptDiscountProof(true);
    setMixedRoadDiscount(0);
    setMixedRoadDiscountNote('');
    setMixedRoadDiscountProof(true);
    setActiveQuoteId(null);
    setQuoteTitleInput('');
    setStep('input');
  };

  // 무상 A/S 연장 품목 관리
  const handleAddFreeServiceItem = () => {
    setSubFreeServiceItems((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((it) => it.id)) + 1 : 1;
      const defaultMonths = subPlans[0]?.months || subMonths || 72;
      return [...prev, { id: nextId, monthlyFee: 0, quantity: 1, months: defaultMonths, isMobile: false }];
    });
  };

  const handleRemoveFreeServiceItem = (id) => {
    setSubFreeServiceItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((it) => it.id !== id);
    });
  };

  const handleUpdateFreeServiceItem = (id, field, value) => {
    setSubFreeServiceItems((prev) => {
      return prev.map((it) => (it.id === id ? { ...it, [field]: value } : it));
    });
  };

  // 케어서비스 혜택 항목 관리 (1번 소모품비용 갯수, 2번 방문케어 횟수 ...)
  const handleAddCareServiceItem = () => {
    setSubCareServiceItems((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((it) => it.id)) + 1 : 1;
      const defaultName = nextId === 1 ? '소모품비용' : nextId === 2 ? '방문케어' : `추가 케어서비스 ${nextId}`;
      const defaultUnit = defaultName.includes('소모품') ? '개' : '회';
      return [...prev, { id: nextId, name: defaultName, amount: 0, count: 1, unit: defaultUnit }];
    });
  };

  const handleRemoveCareServiceItem = (id) => {
    setSubCareServiceItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((it) => it.id !== id);
    });
  };

  const handleUpdateCareServiceItem = (id, field, value) => {
    setSubCareServiceItems((prev) => {
      return prev.map((it) => (it.id === id ? { ...it, [field]: value } : it));
    });
  };

  // ---------------- 견적 보관함 (1번 구독비교 / 2번 구독포함 저장소 및 파일 완전 분리) ----------------
  const loadInitialQuotes = (mode) => {
    try {
      const specificKey = mode === 'mixed' ? 'jcc_calc_saved_quotes_mixed' : 'jcc_calc_saved_quotes_compare';
      const raw = localStorage.getItem(specificKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
      // 과거 통합 저장소('jcc_calc_saved_quotes') 데이터 최초 1회 마이그레이션
      const legacyRaw = localStorage.getItem('jcc_calc_saved_quotes');
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed)) {
          if (mode === 'mixed') {
            return parsed.filter((q) => q.mode === 'mixed' || q.data?.calculatorMode === 'mixed');
          } else {
            return parsed.filter((q) => q.mode !== 'mixed' && q.data?.calculatorMode !== 'mixed');
          }
        }
      }
      return [];
    } catch {
      return [];
    }
  };

  const [savedQuotesCompare, setSavedQuotesCompare] = useState(() => loadInitialQuotes('compare'));
  const [savedQuotesMixed, setSavedQuotesMixed] = useState(() => loadInitialQuotes('mixed'));
  const [quoteTitleInput, setQuoteTitleInput] = useState('');
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [saveNotice, setSaveNotice] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('jcc_calc_saved_quotes_compare', JSON.stringify(savedQuotesCompare));
    } catch {
      // localStorage 용량 초과 등 예외 무시
    }
  }, [savedQuotesCompare]);

  useEffect(() => {
    try {
      localStorage.setItem('jcc_calc_saved_quotes_mixed', JSON.stringify(savedQuotesMixed));
    } catch {
      // localStorage 용량 초과 등 예외 무시
    }
  }, [savedQuotesMixed]);

  const savedQuotes = isMixedMode ? savedQuotesMixed : savedQuotesCompare;
  const setSavedQuotes = (updater) => {
    if (isMixedMode) {
      setSavedQuotesMixed(updater);
    } else {
      setSavedQuotesCompare(updater);
    }
  };

  const showTempNotice = (msg) => {
    setSaveNotice(msg);
    setTimeout(() => {
      setSaveNotice((prev) => (prev === msg ? '' : prev));
    }, 2800);
  };

  const buildCurrentQuoteSnapshot = (customTitle) => {
    const autoTitle =
      [customerName && `${customerName} 고객님`, productSummary].filter(Boolean).join(' · ') ||
      `${consultType} (${consultDate})`;
    const title = (customTitle ?? quoteTitleInput).trim() || autoTitle;
    const now = new Date();
    const savedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const modeTag = isMixedMode ? 'mixed' : 'compare';

    return {
      id: `q_${modeTag}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mode: modeTag,
      title,
      savedAt,
      summary: {
        mode: modeTag,
        lumpFinalPrice,
        subFinalPrice,
        subMonthlyAfterCard,
        mixedGrandFinal,
        mixedInitialPayment,
        mixedSubMonthlyAfterCard
      },
      data: {
        customerName,
        consultDate,
        consultType,
        productSummary,
        memo,
        cardLowestRate,
        lumpBasePrice,
        lumpTotalBenefit,
        subInputMode,
        subPrepay,
        subPlans,
        subCards,
        subCardName,
        subCardMinSpend,
        subCardMonthly,
        subCardAuto70k,
        subSegmentCardOverrides,
        subSegmentSpendOverrides,
        subPurchaseBenefit,
        subFreeServiceItems,
        subCareServiceItems,
        subCareServiceAmount,
        includeServiceInFinal,
        recommendMode,
        checkpoints,
        calculatorMode,
        mixedSubItems,
        mixedLumpItems,
        mixedEventType,
        mixedCashbackItems,
        mixedVoucherItems,
        mixedChannelType,
        mixedDeptDiscount: deptCardDiscount,
        mixedDeptCardDiscount: deptCardDiscount,
        mixedDeptVoucherDiscount: deptVoucherDiscount,
        mixedDeptVoucherMode,
        mixedDeptDiscountNote,
        mixedDeptDiscountProof,
        mixedRoadDiscount,
        mixedRoadDiscountNote,
        mixedRoadDiscountProof,
        mixedSpecialDiscount: mixedLumpSpecificDiscount,
        mixedSpecialDiscountNote: effectiveSpecialDiscountNote,
        mixedSpecialDiscountProof
      }
    };
  };

  const applyQuoteData = (quoteObj) => {
    const d = quoteObj?.data || quoteObj;
    if (!d || typeof d !== 'object') return false;

    setCustomerName(d.customerName ?? '');
    setConsultDate(d.consultDate || todayStr);
    setConsultType(d.consultType || '신혼·혼수가전 맞춤설계');
    setProductSummary(d.productSummary ?? '');
    setMemo(d.memo ?? '');
    if (d.cardLowestRate !== undefined) setCardLowestRate(String(d.cardLowestRate));
    setLumpBasePrice(Number(d.lumpBasePrice) || 0);
    setLumpTotalBenefit(Number(d.lumpTotalBenefit) || 0);
    setSubInputMode(d.subInputMode === 'total' ? 'total' : 'monthly');
    setSubPrepay(Number(d.subPrepay) || 0);
    setSubPlans(
      Array.isArray(d.subPlans) && d.subPlans.length > 0
        ? d.subPlans.map((p) => {
            const rawCareItems = Array.isArray(p.careItems) ? p.careItems : [];
            const careItems = rawCareItems.length > 0
              ? rawCareItems
              : (Number(p.careAmount) || 0) > 0
                ? [{ id: 1, type: p.careType || 'visit', cycle: 12, amount: Number(p.careAmount) || 0, customName: p.careName || '' }]
                : [];
            return {
              ...p,
              isMobile: Boolean(p.isMobile),
              freeRepairFee: Number(p.freeRepairFee) || 0,
              careItems
            };
          })
        : [
            {
              id: 1,
              name: '',
              quantity: 1,
              months: 72,
              monthlyFee: 0,
              totalAmount: 0,
              policyNote: '',
              policyDiscount: 0,
              isMobile: false,
              freeRepairFee: 0,
              careItems: []
            }
          ]
    );
    setSubCardName(d.subCardName ?? '');
    setSubCardMinSpend(d.subCardMinSpend ?? '');
    setSubCardMonthly(Number(d.subCardMonthly) || 0);
    if (Array.isArray(d.subCards) && d.subCards.length > 0) {
      setSubCards(d.subCards);
    } else {
      setSubCards([
        {
          id: 1,
          cardName: d.subCardName ?? '',
          minSpend: d.subCardMinSpend ?? '',
          monthly: Number(d.subCardMonthly) || 0,
          months: d.subPlans?.[0]?.months || 72,
          segmentCardOverrides: d.subSegmentCardOverrides || {},
          segmentSpendOverrides: d.subSegmentSpendOverrides || {}
        }
      ]);
    }
    setSubCardAuto70k(d.subCardAuto70k !== undefined ? Boolean(d.subCardAuto70k) : true);
    setSubSegmentCardOverrides(
      d.subSegmentCardOverrides && typeof d.subSegmentCardOverrides === 'object'
        ? d.subSegmentCardOverrides
        : {}
    );
    setSubSegmentSpendOverrides(
      d.subSegmentSpendOverrides && typeof d.subSegmentSpendOverrides === 'object'
        ? d.subSegmentSpendOverrides
        : {}
    );
    setSubPurchaseBenefit(Number(d.subPurchaseBenefit) || 0);
    if (Array.isArray(d.subFreeServiceItems) && d.subFreeServiceItems.length > 0) {
      setSubFreeServiceItems(
        d.subFreeServiceItems.map((it) => ({
          ...it,
          quantity: it.quantity !== undefined ? (it.quantity === '' ? '' : Number(it.quantity) || 1) : 1,
          isMobile: Boolean(it.isMobile)
        }))
      );
    } else if (Number(d.subFreeServiceAmount) > 0) {
      setSubFreeServiceItems([
        { id: 1, monthlyFee: Math.round(Number(d.subFreeServiceAmount) / 72), quantity: 1, months: 72, isMobile: false }
      ]);
    } else {
      setSubFreeServiceItems([{ id: 1, monthlyFee: 0, quantity: 1, months: 72, isMobile: false }]);
    }
    if (Array.isArray(d.subCareServiceItems) && d.subCareServiceItems.length > 0) {
      setSubCareServiceItems(
        d.subCareServiceItems.map((it, idx) => ({
          id: it.id || idx + 1,
          name: it.name || (idx === 0 ? '소모품비용' : '방문케어'),
          amount: Number(it.amount) || 0,
          count: it.count !== undefined ? Number(it.count) : 1,
          unit: it.unit || (it.name?.includes('소모품') ? '개' : '회')
        }))
      );
    } else if (Number(d.subCareServiceAmount) > 0) {
      setSubCareServiceItems([
        { id: 1, name: '소모품비용', amount: 0, count: 1, unit: '개' },
        { id: 2, name: '방문케어', amount: Number(d.subCareServiceAmount), count: 1, unit: '회' }
      ]);
    } else {
      setSubCareServiceItems([
        { id: 1, name: '소모품비용', amount: 0, count: 1, unit: '개' },
        { id: 2, name: '방문케어', amount: 0, count: 1, unit: '회' }
      ]);
    }
    setIncludeServiceInFinal(d.includeServiceInFinal !== undefined ? Boolean(d.includeServiceInFinal) : true);
    setRecommendMode(d.recommendMode || 'auto');
    setCalculatorMode(d.calculatorMode === 'mixed' ? 'mixed' : 'compare');
    setMixedEventType(d.mixedEventType || 'wedding');

    if (Array.isArray(d.mixedCashbackItems) && d.mixedCashbackItems.length > 0) {
      setMixedCashbackItems(d.mixedCashbackItems);
    } else if (Number(d.mixedIntegratedCashback) > 0 || d.mixedCashbackLabel) {
      setMixedCashbackItems([
        {
          id: 1,
          name: d.mixedCashbackLabel || '',
          amount: Number(d.mixedIntegratedCashback) || 0,
          hasProof: d.mixedCashbackProof !== undefined ? Boolean(d.mixedCashbackProof) : true
        }
      ]);
    } else {
      setMixedCashbackItems(DEFAULT_MIXED_CASHBACK_ITEMS);
    }

    if (Array.isArray(d.mixedVoucherItems) && d.mixedVoucherItems.length > 0) {
      setMixedVoucherItems(d.mixedVoucherItems);
    } else if (Number(d.mixedVoucherAmount) > 0 || d.mixedVoucherNote) {
      setMixedVoucherItems([
        {
          id: 1,
          name: d.mixedVoucherNote || '',
          amount: Number(d.mixedVoucherAmount) || 0,
          hasProof: d.mixedVoucherProof !== undefined ? Boolean(d.mixedVoucherProof) : true
        }
      ]);
    } else {
      setMixedVoucherItems(DEFAULT_MIXED_VOUCHER_ITEMS);
    }

    if (d.mixedChannelType) {
      setMixedChannelType(d.mixedChannelType);
      const loadedDeptCard = Number(d.mixedDeptCardDiscount ?? d.mixedDeptDiscount) || 0;
      setMixedDeptDiscount(loadedDeptCard);
      setMixedDeptCardDiscount(loadedDeptCard);
      setMixedDeptVoucherDiscount(Number(d.mixedDeptVoucherDiscount) || 0);
      setMixedDeptVoucherMode(d.mixedDeptVoucherMode || 'instant');
      setMixedDeptDiscountNote(d.mixedDeptDiscountNote || '');
      setMixedDeptDiscountProof(d.mixedDeptDiscountProof !== false);
      setMixedRoadDiscount(Number(d.mixedRoadDiscount) || 0);
      setMixedRoadDiscountNote(d.mixedRoadDiscountNote || '');
      setMixedRoadDiscountProof(d.mixedRoadDiscountProof !== false);
    } else {
      setMixedChannelType('dept');
      const loadedSpecial = Number(d.mixedSpecialDiscount) || 0;
      setMixedDeptDiscount(loadedSpecial);
      setMixedDeptCardDiscount(loadedSpecial);
      setMixedDeptVoucherDiscount(0);
      setMixedDeptVoucherMode('instant');
      setMixedDeptDiscountNote(d.mixedSpecialDiscountNote || '');
      setMixedDeptDiscountProof(d.mixedSpecialDiscountProof !== false);
      setMixedRoadDiscount(0);
      setMixedRoadDiscountNote('');
      setMixedRoadDiscountProof(true);
    }
    setMixedSubItems(
      Array.isArray(d.mixedSubItems) && d.mixedSubItems.length > 0 ? d.mixedSubItems : DEFAULT_MIXED_SUB_ITEMS
    );
    setMixedLumpItems(
      Array.isArray(d.mixedLumpItems) && d.mixedLumpItems.length > 0 ? d.mixedLumpItems : DEFAULT_MIXED_LUMP_ITEMS
    );
    setCheckpoints(
      Array.isArray(d.checkpoints) && d.checkpoints.length > 0 ? d.checkpoints : DEFAULT_CHECKPOINTS
    );

    if (quoteObj?.id) {
      setActiveQuoteId(quoteObj.id);
      setQuoteTitleInput(quoteObj.title || '');
    }
    return true;
  };

  const handleSaveNewQuote = () => {
    const snapshot = buildCurrentQuoteSnapshot();
    setSavedQuotes((prev) => [snapshot, ...prev]);
    setActiveQuoteId(snapshot.id);
    setQuoteTitleInput(snapshot.title);
    showTempNotice(`✓ '${snapshot.title}' 견적이 ${isMixedMode ? '2번 보관함' : '1번 보관함'}에 저장되었습니다.`);
  };

  const handleOverwriteActiveQuote = () => {
    let targetId = activeQuoteId;
    if (!targetId) {
      if (savedQuotes.length > 0) {
        const latest = savedQuotes[0];
        const ok = window.confirm(
          `선택된 견적이 없습니다. 가장 최근 보관된 '${latest.title}' 견적에 덮어쓰시겠습니까?\n(취소 시 새 견적으로 저장됩니다)`
        );
        if (ok) {
          targetId = latest.id;
          setActiveQuoteId(latest.id);
        }
      }
    }
    if (!targetId) {
      handleSaveNewQuote();
      return;
    }
    const snapshot = buildCurrentQuoteSnapshot();
    setSavedQuotes((prev) =>
      prev.map((q) => (q.id === targetId ? { ...snapshot, id: targetId } : q))
    );
    setQuoteTitleInput(snapshot.title);
    showTempNotice(`✓ '${snapshot.title}' 견적이 ${isMixedMode ? '2번 보관함' : '1번 보관함'}에 수정 저장되었습니다.`);
  };

  const handleLoadQuote = (quote) => {
    if (applyQuoteData(quote)) {
      showTempNotice(`✓ '${quote.title}' 견적을 불러왔습니다.`);
    }
  };

  const handleDeleteQuote = (id, title) => {
    if (!window.confirm(`'${title}' 견적을 보관함에서 삭제하시겠습니까?`)) return;
    setSavedQuotes((prev) => prev.filter((q) => q.id !== id));
    if (activeQuoteId === id) {
      setActiveQuoteId(null);
    }
    showTempNotice(`'${title}' 견적이 삭제되었습니다.`);
  };

  const handleExportQuoteFile = () => {
    const currentSnapshot = buildCurrentQuoteSnapshot();
    const safeFileTitle = currentSnapshot.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
    const modeLabel = isMixedMode ? '2번_구독포함' : '1번_구독비교';
    const payloadType = isMixedMode ? 'JCC_QUOTE_MIXED_ARCHIVE' : 'JCC_QUOTE_COMPARE_ARCHIVE';
    const currentList = isMixedMode ? savedQuotesMixed : savedQuotesCompare;
    const payload = {
      type: payloadType,
      mode: isMixedMode ? 'mixed' : 'compare',
      exportedAt: new Date().toISOString(),
      currentQuote: currentSnapshot,
      savedQuotes: currentList.some((q) => q.id === activeQuoteId)
        ? currentList
        : [currentSnapshot, ...currentList]
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JCC_${modeLabel}_${safeFileTitle}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showTempNotice(`✓ ${isMixedMode ? '2번 구독 포함' : '1번 구독 비교'} 견적 파일(JCC_${modeLabel}_${safeFileTitle}.json)이 다운로드되었습니다.`);
  };

  const handleImportQuoteFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || ''));
        const fileType = parsed?.type;
        const fileMode =
          parsed?.mode ||
          parsed?.currentQuote?.mode ||
          parsed?.currentQuote?.data?.calculatorMode ||
          parsed?.data?.calculatorMode;

        const isIncomingMixed = fileType === 'JCC_QUOTE_MIXED_ARCHIVE' || fileMode === 'mixed';
        const isIncomingCompare = fileType === 'JCC_QUOTE_COMPARE_ARCHIVE' || fileMode === 'compare';

        // 1번 / 2번 성격 분리 검증: 다른 모드의 저장파일 불러오기 시도 차단 및 안내
        if (isMixedMode && isIncomingCompare && !isIncomingMixed) {
          alert(
            "불러오기 실패: 선택하신 파일은 '1번 구독 비교 계산기' 전용 저장파일입니다.\n상단 탭에서 '1번 구독 비교 계산기'로 전환하신 후 불러와 주세요."
          );
          e.target.value = '';
          return;
        }

        if (!isMixedMode && isIncomingMixed) {
          alert(
            "불러오기 실패: 선택하신 파일은 '2번 구독 포함 계산기' 전용 저장파일입니다.\n상단 탭에서 '2번 구독 포함 계산기'로 전환하신 후 불러와 주세요."
          );
          e.target.value = '';
          return;
        }

        if (fileType === 'JCC_QUOTE_ARCHIVE' || fileType === 'JCC_QUOTE_COMPARE_ARCHIVE' || fileType === 'JCC_QUOTE_MIXED_ARCHIVE') {
          const incomingList = Array.isArray(parsed.savedQuotes) ? parsed.savedQuotes : [];
          const targetQuote = parsed.currentQuote || incomingList[0];
          if (incomingList.length > 0) {
            setSavedQuotes((prev) => {
              const existingIds = new Set(prev.map((q) => q.id));
              const merged = [...incomingList.filter((q) => !existingIds.has(q.id)), ...prev];
              return merged;
            });
          } else if (targetQuote) {
            setSavedQuotes((prev) => [targetQuote, ...prev.filter((q) => q.id !== targetQuote.id)]);
          }
          if (targetQuote && applyQuoteData(targetQuote)) {
            showTempNotice(`✓ 파일에서 '${targetQuote.title}' 견적(${incomingList.length || 1}건)을 불러왔습니다.`);
          }
        } else if (parsed && typeof parsed === 'object') {
          const wrapped = parsed.data
            ? parsed
            : {
                id: `q_${isMixedMode ? 'mixed' : 'compare'}_${Date.now()}`,
                mode: isMixedMode ? 'mixed' : 'compare',
                title: file.name.replace(/\.json$/i, ''),
                savedAt: todayStr,
                data: parsed
              };
          setSavedQuotes((prev) => [wrapped, ...prev.filter((q) => q.id !== wrapped.id)]);
          applyQuoteData(wrapped);
          showTempNotice(`✓ 파일에서 '${wrapped.title}' 견적을 불러왔습니다.`);
        }
      } catch {
        alert('견적 파일(.json) 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const [isExportingImage, setIsExportingImage] = useState(false);
  const [imageModalData, setImageModalData] = useState(null);
  const [mobileFitMode, setMobileFitMode] = useState(false);

  const handleExportAsImage = async (pageIndex = 0, pageLabel = '') => {
    const nodes = document.querySelectorAll('.a4-print-sheet');
    const node = nodes[pageIndex] || nodes[0];
    if (!node || isExportingImage) return;
    setIsExportingImage(true);
    try {
      // 100% 오프라인 동작 보장: skipFonts: true 로 외부 웹폰트 네트워크 재요청 방지
      // Retina 2x 화질로 모바일/카톡 전송 시 글자가 또렷하게 보이도록 설정
      // 모바일 화면 맞춤 배율이 적용되어 있어도 캡처 시에는 transform: none 으로 원본 1640px 해상도 보장
      const dataUrl = await htmlToImage.toPng(node, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        style: {
          margin: '0',
          boxShadow: 'none',
          transform: 'none',
          transformOrigin: 'top left'
        }
      });

      const safeCustomer = (customerName || '소중한고객님').trim().replace(/[^a-zA-Z0-9가-힣_-]/g, '');
      const safeDate = (consultDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, '');
      const pSuffix = pageLabel ? `_${pageLabel}` : (nodes.length > 1 ? `_${pageIndex + 1}페이지` : '');
      const filename = `JCC_견적서_${safeCustomer}_${safeDate}${pSuffix}.png`;

      // Blob 및 File 객체 생성 (Web Share & 클립보드용)
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      let file = null;
      try {
        file = new File([blob], filename, { type: 'image/png' });
      } catch (_) {}

      // 모바일 브라우저인 경우 Web Share API(카카오톡/사진 저장 등 시스템 공유창) 우선 시도
      let shared = false;
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
      if (isMobile && file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `JCC 맞춤 견적서 (${safeCustomer} 고객님${pSuffix})`,
            text: `[JCC 진센조] ${safeCustomer} 고객님 맞춤 가전 혜택 견적서${pSuffix}입니다.`
          });
          shared = true;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            shared = true;
          }
        }
      }

      // Web Share가 지원되지 않거나 PC 환경인 경우 파일 다운로드 실행
      if (!shared) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
      }

      // 클립보드 이미지 복사 시도 (카카오톡 PC 등에 즉시 Ctrl+V 가능)
      let copied = false;
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          copied = true;
        } catch (clipErr) {
          console.warn('클립보드 자동 복사 스킵:', clipErr);
        }
      }

      // 모바일 기기에서도 손쉽게 갤러리에 저장(꾹 터치)할 수 있도록 미리보기 모달 오픈
      setImageModalData({
        dataUrl,
        filename,
        file,
        customer: safeCustomer
      });

      if (copied) {
        showTempNotice(`📷 견적서 사진이 저장되었으며 클립보드에도 복사되었습니다. (카카오톡에 바로 Ctrl+V 가능)`);
      } else if (shared) {
        showTempNotice(`📷 견적서 사진이 성공적으로 생성되었습니다.`);
      } else {
        showTempNotice(`📷 견적서 사진 파일(${filename})이 저장되었습니다.`);
      }
    } catch (err) {
      console.error('견적서 사진 생성 오류:', err);
      alert('견적서 사진 생성 중 오류가 발생했습니다. 브라우저 인쇄(PDF 저장)를 이용해 주세요.');
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleExportAllImages = async () => {
    const nodes = document.querySelectorAll('.a4-print-sheet');
    if (nodes.length <= 1) {
      await handleExportAsImage(0);
      return;
    }
    await handleExportAsImage(0, '1페이지');
    await new Promise((r) => setTimeout(r, 600));
    await handleExportAsImage(1, '2페이지');
  };

  const handlePrint = () => {
    window.print();
  };

  const renderPosCashierModal = () => {
    if (!showPosCashierModal) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="no-print"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(6px)'
        }}
        onClick={() => setShowPosCashierModal(false)}
      >
        <div
          style={{
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '16px',
            maxWidth: '760px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 모달 상단 헤더 (화면용 제어바) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1.25rem',
              background: '#0f172a',
              color: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={18} color="#f59e0b" />
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fde68a' }}>
                캐셔 POS 결제 & 사은행사 지시서 (직원 출력용)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPosCashierModal(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1.2rem',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>

          {/* 영수증/지시서 본체 (인쇄 가능) */}
          <div
            id="pos-cashier-print-area"
            style={{
              padding: '1.4rem 1.6rem',
              overflowY: 'auto',
              fontFamily: '"Pretendard", -apple-system, sans-serif'
            }}
          >
            {/* 지시서 타이틀 & 매장 정보 */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '0.9rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, letterSpacing: '2px' }}>
                GALLERIA JINJU STORE
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0.3rem 0', color: '#0f172a' }}>
                POS 결제 및 사은행사 지시서
              </h2>
              <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.3rem' }}>
                <span>일자: {consultDate || new Date().toISOString().slice(0, 10)}</span>
                <span>고객: <strong>{customerName || '소중한고객님'}</strong></span>
                <span>담당: <strong>조준석 매니저</strong></span>
              </div>
            </div>

            {/* 매장 계좌 및 담당 매니저 정보 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.86rem', marginBottom: '2px' }}>
                  ㈜한화 갤러리아 진주점 가전매장
                </div>
                <div style={{ fontSize: '0.76rem', color: '#475569' }}>
                  입금계좌: <strong>경남은행 207-0123-9010-00</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.78rem' }}>
                <span style={{ color: '#64748b' }}>담당 매니저: </span>
                <strong style={{ color: '#0369a1', fontWeight: 900 }}>조준석 매니저 (1041315089)</strong>
              </div>
            </div>

            {/* 3대 시나리오 실시간 플랜 전환 바 (POS 지시서 모달 상단) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                <span>지시서 적용 플랜:</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 900,
                  background: deptStrategy === 'reward' ? '#d1fae5' : deptStrategy === 'full' ? '#fef3c7' : '#e0f2fe',
                  color: deptStrategy === 'reward' ? '#047857' : deptStrategy === 'full' ? '#b45309' : '#0369a1',
                  border: `1px solid ${deptStrategy === 'reward' ? '#6ee7b7' : deptStrategy === 'full' ? '#fde68a' : '#7dd3fc'}`
                }}>
                  {deptStrategy === 'reward'
                    ? '💰 1. 전부 적립 플랜 (G캐시 100% 모바일 앱 적립)'
                    : deptStrategy === 'full'
                      ? '⚡ 3. 전부 차감 플랜 (G캐시 0원 올인 현장 차감)'
                      : '🛡️ 2. 부분 차감 플랜 (마지노선 방어 선차감)'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setDeptStrategy('reward')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: deptStrategy === 'reward' ? '1.5px solid #10b981' : '1px solid #cbd5e1',
                    background: deptStrategy === 'reward' ? '#10b981' : '#ffffff',
                    color: deptStrategy === 'reward' ? '#ffffff' : '#475569',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  💰 1.전부적립
                </button>
                <button
                  type="button"
                  onClick={() => setDeptStrategy('partial')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: (deptStrategy === 'partial' || deptStrategy === 'instant') ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                    background: (deptStrategy === 'partial' || deptStrategy === 'instant') ? '#0284c7' : '#ffffff',
                    color: (deptStrategy === 'partial' || deptStrategy === 'instant') ? '#ffffff' : '#475569',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  🛡️ 2.부분차감
                </button>
                <button
                  type="button"
                  onClick={() => setDeptStrategy('full')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: deptStrategy === 'full' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                    background: deptStrategy === 'full' ? '#d97706' : '#ffffff',
                    color: deptStrategy === 'full' ? '#ffffff' : '#475569',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ⚡ 3.전부차감
                </button>
              </div>
            </div>

            {/* 핵심: POS 필수 스캔 바코드 2종 (가전 907 vs 자급제 606 - 수수료 완전 분리) */}
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                  ■ POS 필수 스캔 바코드 2종 (수수료 상이 · 교차스캔 금지)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 800, background: '#fee2e2', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                  ⚠️ 가전 vs 자급제폰 수수료율 상이 / 전용 바코드 분리 필수
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {/* 1. 일반 가전 결제 바코드 (끝자리 907) */}
                <div
                  style={{
                    background: '#f0f9ff',
                    border: '2px solid #0284c7',
                    borderRadius: '10px',
                    padding: '0.75rem 0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0369a1' }}>
                      🏬 일반 가전 결제용 바코드
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 900, background: '#0284c7', color: '#ffffff', padding: '2px 7px', borderRadius: '4px' }}>
                      끝자리 907 (가전 수수료율)
                    </span>
                  </div>

                  {/* 실물 바코드 이미지 (끝자리 907) */}
                  <div style={{ background: '#ffffff', padding: '5px 8px', borderRadius: '6px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace', letterSpacing: '2px' }}>
                      {DEPT_POS_BARCODES.appliance.topCode}
                    </div>
                    <img
                      src={DEPT_POS_BARCODES.appliance.image}
                      alt="가전 바코드 2304641471907"
                      style={{ width: '100%', maxWidth: '240px', height: '48px', objectFit: 'contain', margin: '3px auto', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.98rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2.5px', color: '#0f172a' }}>
                      2304641471<span style={{ color: '#0284c7', textDecoration: 'underline' }}>907</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.76rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>가전 승인 대상액:</span>
                    <strong style={{ fontSize: '1.02rem', fontWeight: 900, color: '#0369a1' }}>
                      {formatWon(deptEnginePlan.applianceGross)}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 700, lineHeight: 1.3 }}>
                    ※ 일반 가전(냉장고, TV, 세탁기 등) 결제 시 스캔 (자급제 스캔 절대 금지)
                  </div>
                </div>

                {/* 2. 자급제폰 결제 바코드 (끝자리 606) */}
                <div
                  style={{
                    background: deptEnginePlan.phoneGross > 0 ? '#ecfdf5' : '#f8fafc',
                    border: deptEnginePlan.phoneGross > 0 ? '2px solid #059669' : '1px dashed #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.75rem 0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    opacity: deptEnginePlan.phoneGross > 0 ? 1 : 0.65,
                    boxShadow: deptEnginePlan.phoneGross > 0 ? '0 4px 12px rgba(5, 150, 105, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 900, color: deptEnginePlan.phoneGross > 0 ? '#047857' : '#64748b' }}>
                      📱 자급제폰 결제용 바코드
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        background: deptEnginePlan.phoneGross > 0 ? '#059669' : '#94a3b8',
                        color: '#ffffff',
                        padding: '2px 7px',
                        borderRadius: '4px'
                      }}
                    >
                      끝자리 606 (자급제 수수료율)
                    </span>
                  </div>

                  {/* 실물 바코드 이미지 (끝자리 606) */}
                  <div style={{ background: '#ffffff', padding: '5px 8px', borderRadius: '6px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace', letterSpacing: '2px' }}>
                      {DEPT_POS_BARCODES.phone.topCode}
                    </div>
                    <img
                      src={DEPT_POS_BARCODES.phone.image}
                      alt="자급제 바코드 2303990976606"
                      style={{ width: '100%', maxWidth: '240px', height: '48px', objectFit: 'contain', margin: '3px auto', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.98rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2.5px', color: '#0f172a' }}>
                      2303990976<span style={{ color: '#059669', textDecoration: 'underline' }}>606</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.76rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 700 }}>자급제 승인 대상액:</span>
                    <strong style={{ fontSize: '1.02rem', fontWeight: 900, color: deptEnginePlan.phoneGross > 0 ? '#047857' : '#94a3b8' }}>
                      {deptEnginePlan.phoneGross > 0 ? formatWon(deptEnginePlan.phoneGross) : '자급제 없음 (0원)'}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: deptEnginePlan.phoneGross > 0 ? '#047857' : '#94a3b8', fontWeight: 700, lineHeight: 1.3 }}>
                    {deptEnginePlan.phoneGross > 0
                      ? '※ 자급제폰 결제 시에만 단독 스캔 (일반 가전 스캔 절대 금지)'
                      : '※ 이번 결제에는 자급제폰이 포함되지 않아 스캔하지 않습니다.'}
                  </div>
                </div>
              </div>
            </div>

            {/* 결제 실행 단계별 지시표 */}
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>■ POS 승인 순서 및 분할 결제 지시 (현장 영수증 일치 확인)</span>
                <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 700 }}>
                  {deptEnginePlan.mode === '2person_2cards' ? '👥 2인 2카드 분할' : deptEnginePlan.mode === '1person_3split' ? '👤 1인 분할 비기' : '👤 1인 단독 결제'}
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.5rem', width: '38px', textAlign: 'center' }}>단계</th>
                    <th style={{ padding: '0.5rem 0.5rem' }}>결제 구분</th>
                    <th style={{ padding: '0.5rem 0.5rem', textAlign: 'center', width: '85px' }}>스캔 바코드</th>
                    <th style={{ padding: '0.5rem 0.5rem', textAlign: 'right', width: '110px' }}>POS 승인 금액</th>
                    <th style={{ padding: '0.5rem 0.6rem', textAlign: 'right', width: '145px', background: '#eff6ff', color: '#1e40af' }}>
                      청구할인된 영수증 금액 (확인용)
                    </th>
                    <th style={{ padding: '0.5rem 0.5rem' }}>혜택 및 수수료 비고</th>
                  </tr>
                </thead>
                <tbody>
                  {deptEnginePlan.posSteps.map((st, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: st.discountAmount > 0 ? '#f8fafc' : 'transparent' }}>
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#64748b' }}>
                        {st.step}
                      </td>
                      <td style={{ padding: '0.55rem 0.5rem', fontWeight: 800, color: '#0f172a' }}>
                        {st.label}
                      </td>
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}>
                        {st.barcodeBadge === '가전 907' ? (
                          <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem', border: '1px solid #7dd3fc', whiteSpace: 'nowrap' }}>
                            🏬 가전 907
                          </span>
                        ) : st.barcodeBadge === '자급제 606' ? (
                          <span style={{ background: '#d1fae5', color: '#047857', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem', border: '1px solid #6ee7b7', whiteSpace: 'nowrap' }}>
                            📱 자급제 606
                          </span>
                        ) : st.barcodeBadge === 'G캐시' ? (
                          <span style={{ background: '#fef3c7', color: '#b45309', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem', border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>
                            ⚡ G캐시 차감
                          </span>
                        ) : st.barcodeBadge === '앱 적립' ? (
                          <span style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', fontSize: '0.72rem', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                            💰 모바일 적립
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', color: '#475569', whiteSpace: 'nowrap' }}>
                        {formatWon(st.amount)}
                      </td>
                      <td style={{ padding: '0.55rem 0.6rem', textAlign: 'right', background: st.discountAmount > 0 ? '#eff6ff' : 'transparent', whiteSpace: 'nowrap' }}>
                        {st.discountAmount > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.25 }}>
                            <strong style={{ fontSize: '0.98rem', fontWeight: 900, color: '#1d4ed8' }}>
                              {formatWon(st.receiptAmount)}
                            </strong>
                            <span style={{ fontSize: '0.69rem', color: '#dc2626', fontWeight: 700 }}>
                              (-{formatWon(st.discountAmount)} 즉시 청구할인)
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#64748b' }}>
                            {formatWon(st.receiptAmount || st.amount)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.55rem 0.5rem', fontSize: '0.74rem', color: '#64748b' }}>
                        {st.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 최종 혜택 및 고객 정산 요약 */}
            <div style={{ background: '#f8fafc', padding: '0.9rem 1.1rem', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#64748b' }}>결제 기준 금액 총액</span>
                <div>
                  <strong>{formatWon(deptEnginePlan.effectiveGross)}</strong>
                  {deptEnginePlan.phoneGross > 0 && (
                    <span style={{ fontSize: '0.74rem', color: '#64748b', marginLeft: '6px' }}>
                      (가전 {formatWon(deptEnginePlan.applianceGross)} + 자급제 {formatWon(deptEnginePlan.phoneGross)})
                    </span>
                  )}
                </div>
              </div>

              {/* 선차감 모드일 때: G캐시 선차감 및 고객 실제 카드 결제액 표시 */}
              {deptEnginePlan.safeDeduct > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem', color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '5px', border: '1px solid #a7f3d0' }}>
                    <span style={{ fontWeight: 800 }}>⚡ G캐시 즉시 선차감 (결제 시 현장 차감)</span>
                    <strong style={{ fontSize: '0.95rem' }}>- {formatWon(deptEnginePlan.safeDeduct)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.88rem', marginBottom: '0.45rem', padding: '4px 8px', background: '#f0f9ff', borderRadius: '5px', border: '1px solid #bae6fd' }}>
                    <span style={{ color: '#0369a1', fontWeight: 900 }}>💳 고객 실제 카드 결제 승인 총액</span>
                    <strong style={{ fontSize: '1.15rem', color: '#0284c7', fontWeight: 900 }}>
                      {formatWon(deptEnginePlan.cardApproval || (deptEnginePlan.effectiveGross - deptEnginePlan.safeDeduct))}
                    </strong>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem', color: '#64748b' }}>
                  <span>고객 카드 결제 승인 총액 (전액 카드 결제)</span>
                  <strong>{formatWon(deptEnginePlan.effectiveGross)}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem', color: '#dc2626' }}>
                <span>제휴카드 즉시 청구할인 합계 (영수증 현장 차감)</span>
                <strong>- {formatWon(deptEnginePlan.totalCardDiscount)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.88rem', marginBottom: '0.45rem', padding: '5px 8px', background: '#eff6ff', borderRadius: '5px', border: '1px solid #bfdbfe' }}>
                <span style={{ color: '#1e40af', fontWeight: 900 }}>🧾 청구할인 적용 후 영수증 결제 총액 (확인용)</span>
                <strong style={{ fontSize: '1.18rem', color: '#1d4ed8', fontWeight: 900 }}>
                  {formatWon((deptEnginePlan.cardApproval || deptEnginePlan.effectiveGross) - deptEnginePlan.totalCardDiscount)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.82rem', marginBottom: '0.55rem', color: '#d97706' }}>
                <div>
                  <span>
                    {deptEnginePlan.safeDeduct > 0 ? '💰 고객 잔여 순적립 G캐시 (모바일 앱)' : `백화점 사은행사 G캐시 증정 합계 (${deptRewardRate}%)`}
                  </span>
                  <div style={{ fontSize: '0.71rem', color: '#b45309', fontWeight: 700, marginTop: '2px' }}>
                    • 기본 6.5% 사은 (유효기간 5년): <strong>{formatWon(deptEnginePlan.gcash5Year)}</strong>
                    {deptEnginePlan.gcash60Day > 0 && (
                      <span style={{ marginLeft: '6px' }}>
                        • 우대 추가분 (유효기간 60일): <strong style={{ color: '#dc2626' }}>{formatWon(deptEnginePlan.gcash60Day)}</strong>
                      </span>
                    )}
                  </div>
                </div>
                <strong style={{ fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
                  + {formatWon(deptEnginePlan.safeReward !== undefined ? deptEnginePlan.safeReward : deptEnginePlan.totalGcash)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.55rem', borderTop: '2px solid #0f172a' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>고객 체감 최종 혜택가</span>
                <strong style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                  {formatWon(deptEnginePlan.finalPerceived)}
                </strong>
              </div>
            </div>

            {/* 하단 캐셔 안내 주의사항 (수수료율 구분 및 G캐시 유효기간 안내) */}
            <div style={{ fontSize: '0.73rem', color: '#475569', lineHeight: 1.5, borderTop: '2px solid #ef4444', paddingTop: '0.7rem', background: '#fef2f2', padding: '0.7rem 0.9rem', borderRadius: '8px' }}>
              <div style={{ color: '#b91c1c', fontWeight: 900, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🚨 [캐셔 필수 확인 - 백화점 마진 수수료율 구분 및 G캐시 유효기간 지침]
              </div>
              <div>① 일반 가전과 자급제폰은 <strong>백화점 마진 수수료율이 완전히 상이</strong>하여 반드시 서로 다른 바코드로 분리 결제되어야 합니다.</div>
              <div>② 가전 승인금액은 반드시 <strong>[가전 바코드 907]</strong>을 스캔하고, 자급제폰 승인금액은 반드시 <strong>[자급제 바코드 606]</strong>을 스캔하십시오.</div>
              <div>③ 바코드를 교차 스캔하거나 하나로 통합 결제할 경우 <strong>매장 및 백화점 정산 수수료에 치명적인 오류</strong>가 발생하므로 절대 주의 바랍니다.</div>
              <div>④ ⏱️ <strong>사은행사 G캐시 유효기간 분리 안내</strong>: 기본 6.5% 사은(<strong>{formatWon(deptEnginePlan.gcash5Year)}</strong>)은 증정일로부터 <strong>5년</strong>, 9.5% 이상 우대 추가분(<strong>{formatWon(deptEnginePlan.gcash60Day)}</strong>)은 증정일로부터 <strong>60일(2개월 이내)</strong> 유효합니다. 고객에게 반드시 안내바랍니다.</div>
            </div>
          </div>

          {/* 모달 하단 버튼 바 */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              background: '#f1f5f9',
              borderTop: '1px solid #cbd5e1',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.65rem'
            }}
          >
            <button
              type="button"
              onClick={() => setShowPosCashierModal(false)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              닫기
            </button>
            <button
              type="button"
              onClick={() => {
                const printContents = document.getElementById('pos-cashier-print-area').innerHTML;
                const printWindow = window.open('', '', 'width=800,height=900');
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>POS 결제 지시서 - ${customerName || '고객님'}</title>
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #0f172a; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border-bottom: 1px solid #cbd5e1; padding: 8px; }
                        th { background: #f1f5f9; }
                        @media print { body { padding: 0; } }
                      </style>
                    </head>
                    <body>
                      ${printContents}
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                  printWindow.print();
                  printWindow.close();
                }, 250);
              }}
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: '8px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Receipt size={16} />
              POS 지시서 인쇄
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 1. 비밀번호 인증 화면
  // ============================================================================
  if (!isAuthenticated) {
    return (
      <section className="container" style={{ paddingTop: '4rem', minHeight: '80vh' }}>
        {onBack && (
          <button onClick={onBack} className="btn-back">
            <span>←</span> 홈으로 돌아가기
          </button>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <div
            className="glass-panel"
            style={{
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              padding: '3rem 2rem',
              borderTop: '4px solid var(--accent-gold)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: 'var(--accent-gold)'
              }}
            >
              <Lock size={28} />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.6rem' }}>고객혜택 계산기</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
              상담 매니저 전용 솔루션입니다.<br />비밀번호를 입력해주세요.
            </p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="비밀번호 입력"
                autoFocus
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border)',
                  color: 'white',
                  fontSize: '1.25rem',
                  textAlign: 'center',
                  letterSpacing: '6px'
                }}
              />
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                <Unlock size={18} /> 계산기 열기
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  // 계산기 모드 전환 탭 바
  const renderModeTabs = () => (
    <div
      className="container no-print"
      style={{
        maxWidth: '1100px',
        marginBottom: '1.25rem',
        display: 'flex',
        gap: '0.6rem',
        padding: '0.4rem',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      }}
    >
      <button
        type="button"
        onClick={() => {
          setCalculatorMode('compare');
          setActiveQuoteId(null);
          setQuoteTitleInput('');
          setSaveNotice('');
        }}
        style={{
          flex: 1,
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          border: 'none',
          background: calculatorMode === 'compare' ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : 'transparent',
          color: calculatorMode === 'compare' ? '#ffffff' : 'var(--text-secondary)',
          fontWeight: 800,
          fontSize: 'clamp(0.82rem, 2vw, 0.95rem)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: calculatorMode === 'compare' ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
          transition: 'all 0.2s'
        }}
      >
        <Scale size={18} /> 1번 구독 비교 계산기
      </button>
      <button
        type="button"
        onClick={() => {
          setCalculatorMode('mixed');
          setActiveQuoteId(null);
          setQuoteTitleInput('');
          setSaveNotice('');
        }}
        style={{
          flex: 1,
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          border: 'none',
          background: calculatorMode === 'mixed' ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
          color: calculatorMode === 'mixed' ? '#ffffff' : 'var(--text-secondary)',
          fontWeight: 800,
          fontSize: 'clamp(0.82rem, 2vw, 0.95rem)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          boxShadow: calculatorMode === 'mixed' ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
          transition: 'all 0.2s'
        }}
      >
        <Layers size={18} /> 2번 구독 포함 계산기
      </button>
    </div>
  );

  // ============================================================================
  // 2. 비교 결과 & A4 출력 미리보기 화면
  // ============================================================================
  if (step === 'result') {
    // 케어서비스 금액 미입력 시 케어서비스 관련 체크포인트도 출력물에서 제외
    const checkedPoints = checkpoints.filter((c) => c.checked && (hasCareService || c.id !== 'cp3'));

    return (
      <section className="calc-result-section" style={{ paddingTop: '1.5rem', paddingBottom: '5rem' }}>
        {/* 상단 컨트롤 바 (인쇄 시 숨김) */}
        <div
          className="container no-print"
          style={{
            maxWidth: '920px',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setStep('input')}
              className="btn-secondary"
              style={{ padding: '0.7rem 1.3rem', fontSize: '0.95rem' }}
            >
              <ArrowLeft size={17} /> 조건 수정하기
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                padding: '0.7rem 1.1rem',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              <RotateCcw size={16} /> 새 견적 작성
            </button>
            <button
              type="button"
              onClick={activeQuoteId ? handleOverwriteActiveQuote : handleSaveNewQuote}
              style={{
                background: 'rgba(212, 175, 55, 0.14)',
                border: '1px solid rgba(212, 175, 55, 0.45)',
                color: 'var(--accent-gold-light)',
                padding: '0.7rem 1.15rem',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              <Save size={16} /> {activeQuoteId ? '현재 견적 수정저장' : isMixedMode ? '2번 보관함에 저장' : '1번 보관함에 저장'}
            </button>
            <button
              type="button"
              onClick={handleExportQuoteFile}
              style={{
                background: 'rgba(59, 130, 246, 0.14)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#93c5fd',
                padding: '0.7rem 1.1rem',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              <Download size={16} /> {isMixedMode ? '2번 견적 파일저장' : '1번 견적 파일저장'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {isMixedMode ? (
              <>
                <button
                  type="button"
                  onClick={() => handleExportAsImage(0, '1페이지')}
                  disabled={isExportingImage}
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(5, 150, 105, 0.35))',
                    border: '1px solid rgba(52, 211, 153, 0.55)',
                    color: '#6ee7b7',
                    padding: '0.85rem 1.15rem',
                    borderRadius: '12px',
                    cursor: isExportingImage ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontWeight: 700,
                    fontSize: '0.94rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.22)'
                  }}
                  title="1페이지(1번 구독 & 2번 일반구매) 사진 저장"
                >
                  <Camera size={18} /> {isExportingImage ? '저장 중...' : '1P 사진 저장'}
                </button>

                <button
                  type="button"
                  onClick={() => handleExportAsImage(1, '2페이지')}
                  disabled={isExportingImage}
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(5, 150, 105, 0.35))',
                    border: '1px solid rgba(52, 211, 153, 0.55)',
                    color: '#6ee7b7',
                    padding: '0.85rem 1.15rem',
                    borderRadius: '12px',
                    cursor: isExportingImage ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontWeight: 700,
                    fontSize: '0.94rem',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.22)'
                  }}
                  title="2페이지(3번 통합캐시백 & 최종실체감가) 사진 저장"
                >
                  <Camera size={18} /> {isExportingImage ? '저장 중...' : '2P 사진 저장'}
                </button>

                <button
                  type="button"
                  onClick={handleExportAllImages}
                  disabled={isExportingImage}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#f8fafc',
                    padding: '0.85rem 1.25rem',
                    borderRadius: '12px',
                    cursor: isExportingImage ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontWeight: 700,
                    fontSize: '0.94rem'
                  }}
                  title="1·2페이지 사진 순차 저장"
                >
                  <Download size={18} /> 전 페이지(1·2P) 저장
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleExportAsImage(0)}
                disabled={isExportingImage}
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(5, 150, 105, 0.35))',
                  border: '1px solid rgba(52, 211, 153, 0.55)',
                  color: '#6ee7b7',
                  padding: '0.85rem 1.45rem',
                  borderRadius: '12px',
                  cursor: isExportingImage ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontWeight: 700,
                  fontSize: '0.98rem',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.22)'
                }}
              >
                <Camera size={19} /> {isExportingImage ? '사진 생성 중...' : '견적서 사진(이미지) 저장'}
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary pulse"
              style={{ padding: '0.85rem 1.8rem', fontSize: '1rem' }}
            >
              <Printer size={19} /> {isMixedMode ? 'A4 2장 인쇄 / PDF 저장' : 'A4 용지로 인쇄 / PDF 저장'}
            </button>
          </div>
        </div>

        {saveNotice && (
          <div className="container no-print" style={{ maxWidth: '920px', marginBottom: '0.75rem' }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                borderRadius: '10px',
                padding: '0.6rem 1rem',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#6ee7b7'
              }}
            >
              {saveNotice}
            </div>
          </div>
        )}

        <div
          className="container no-print"
          style={{ maxWidth: '920px', marginBottom: '1rem' }}
        >
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              color: '#bfdbfe'
            }}
          >
            💡 <strong>인쇄 팁:</strong> {isMixedMode ? '스마트 견적서는 2장으로 분리 출력됩니다. ' : ''}인쇄 설정(더보기)에서 <strong>&lsquo;배경 그래픽&rsquo;</strong>을 체크하고 <strong>&lsquo;머리글 및 바닥글&rsquo;</strong>을 해제하시면 {isMixedMode ? 'A4 2장' : 'A4 한 장'}에 가장 깔끔하게 출력됩니다.
          </div>
        </div>

        {/* 모바일 화면 맞춤/원본 크기 토글 바 */}
        {isSmallScreen && (
          <div
            className="container no-print"
            style={{
              maxWidth: '920px',
              marginBottom: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.6rem',
              flexWrap: 'wrap',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '10px',
              padding: '0.55rem 0.85rem'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#93c5fd' }}>
              📱 {mobileFitMode ? 'A4 화면 맞춤 보기' : '좌우 스크롤 원본 보기'}
            </div>
            <button
              type="button"
              onClick={() => setMobileFitMode((prev) => !prev)}
              style={{
                background: mobileFitMode ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.08)',
                border: mobileFitMode ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.2)',
                color: mobileFitMode ? '#bfdbfe' : '#e2e8f0',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {mobileFitMode ? (
                <>
                  <Maximize2 size={13} /> 🔍 100% 원본 크기 (좌우 스크롤)
                </>
              ) : (
                <>
                  <Smartphone size={13} /> 📱 한눈에 보기 (화면 맞춤)
                </>
              )}
            </button>
          </div>
        )}

        {/* ==================== A4 공통 헤더·푸터·안내 렌더러 ==================== */}
        {(() => null)()}
        {/* ==================== A4 출력 시트 ==================== */}
        {(() => {
          const sheetStyle =
            mobileFitMode && isSmallScreen
              ? {
                  transform: `scale(${mobileSheetScale})`,
                  transformOrigin: 'top center',
                  marginBottom: `calc(-1 * (1 - ${mobileSheetScale}) * 800px)`
                }
              : undefined;

          const renderA4Header = (pageNo = 1, totalPages = 1) => (
            <header className="a4-header">
              <div className="a4-header-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                  <img
                    src={BRAND_LOGO_B64}
                    alt="JCC"
                    style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
                  />
                  {/* 공식 삼성스토어 로고 (세상에 없던 AI 라이프.) */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.22rem 0.65rem',
                      background: '#ffffff',
                      border: '1.5px solid #0c2340',
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      fontFamily: '"Pretendard", "Samsung Sans", -apple-system, sans-serif'
                    }}
                    title="삼성스토어 공식 로고 · 세상에 없던 AI 라이프"
                  >
                    <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#0c2340', letterSpacing: '-0.5px' }}>
                      삼성스토어
                    </span>
                    <div style={{ width: '1.5px', height: '14px', background: '#cbd5e1' }} />
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#334155', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
                      세상에 없던 <strong style={{ fontWeight: 900, color: '#0f172a' }}>AI 라이프</strong>
                      <span style={{ color: '#2563eb', fontWeight: 900, fontSize: '0.92rem', lineHeight: 0, marginLeft: '1px' }}>.</span>
                    </span>
                  </div>
                  {totalPages > 1 && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        color: '#1e3a8a',
                        background: '#dbeafe',
                        border: '1px solid #93c5fd',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      PAGE {pageNo} / {totalPages}
                    </span>
                  )}
                </div>
                <h1 className="a4-doc-title">
                  {isMixedMode ? '삼성 AI 가전 스마트 견적서' : '일반구매 vs 삼성AI구독 결제조건 비교서'}
                </h1>
                <p className="a4-doc-subtitle">
                  {isMixedMode
                    ? '일반구매와 삼성AI구독의 최적 결합 맞춤 설계 및 최종 실체감가 안내'
                    : '일반구매와 삼성AI구독의 적용 혜택 및 최종 체감금액 안내'}
                </p>
              </div>

              <div className="a4-header-right">
                <div className="a4-meta-row">
                  <span className="a4-meta-label">고객명</span>
                  <strong className="a4-meta-val">
                    {customerName.trim() ? `${customerName.trim()} 고객님` : '소중한 고객님'}
                  </strong>
                </div>
                <div className="a4-meta-row">
                  <span className="a4-meta-label">상담일자</span>
                  <span className="a4-meta-val">{consultDate}</span>
                </div>
                {isMixedMode ? (
                  <div className="a4-meta-row">
                    <span className="a4-meta-label">행사구분</span>
                    <span
                      className="a4-meta-badge"
                      style={{
                        background: hasAnyProofPolicy ? '#065f46' : '#1e3a8a',
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {EVENT_TYPE_INFO[mixedEventType]?.title || '일반'}
                      {hasAnyProofPolicy && (
                        <span style={{ fontSize: '0.72rem', color: '#a7f3d0', marginLeft: '3px' }}>
                          · 증빙조건포함
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="a4-meta-row">
                    <span className="a4-meta-label">상담구분</span>
                    <span className="a4-meta-badge">{consultType}</span>
                  </div>
                )}
              </div>
            </header>
          );

          const renderA4Footer = (showManager = true, showDisclaimer = !isMixedMode) => (
            <>
              {showDisclaimer && (
                <p className="a4-disclaimer">
                  * 본 비교서는 상담일 기준 프로모션·제휴카드 할인·카드 할부금리를 반영한 예상 안내 자료이며, 결제 시점 정책 및 카드 실적에 따라 변동될 수 있습니다.
                </p>
              )}

              {/* 5. 조준석 매니저 하단 명함 영역 (1페이지는 숨김, 마지막 페이지 노출) */}
              {showManager && (
                <footer className="a4-manager-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', position: 'relative', overflow: 'hidden' }}>
                  <div className="a4-manager-left" style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
                    <img
                      src={MANAGER_PROFILE_B64}
                      alt="조준석 매니저"
                      className="a4-manager-photo"
                    />
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div className="a4-manager-badge-row">
                        <span className="a4-manager-role">19년 경력 가전 마스터 · 삼성 CS명장</span>
                      </div>
                      <div className="a4-manager-name">
                        조준석 매니저 <span className="a4-manager-brand">| JCC 진센조</span>
                      </div>
                      <div className="a4-manager-quote" style={{ fontSize: '0.67rem', whiteSpace: 'nowrap', lineHeight: 1.35, color: '#94a3b8' }}>
                        &ldquo;전국 유일 결합 설계와 19년 전문성으로<br />
                        고객님께 가장 정직한 최저 체감가를 약속합니다.&rdquo;
                      </div>
                    </div>
                  </div>

                  <div className="a4-manager-right" style={{ flexShrink: 0, minWidth: '190px' }}>
                    {managerPhone.trim() && (
                      <div className="a4-contact-item">
                        <Phone size={12} />
                        <strong>직통 문의: {managerPhone.trim()}</strong>
                      </div>
                    )}
                    <div className="a4-contact-item">
                      <MapPin size={12} />
                      <span>{storeInfo}</span>
                    </div>
                    <div className="a4-contact-item">
                      <MessageCircle size={12} />
                      <span>카카오톡 채널: <strong>진센조</strong></span>
                    </div>
                  </div>

                  <div className="a4-manager-qr">
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
                  </div>
                </footer>
              )}
            </>
          );

          const renderPage2ExtraInfo = () => {
            const uniquePolicies = subCardTotalDiscount > 0
              ? [...new Set(cardDetails.map((d) => d.policy).filter(Boolean))]
              : [];
            const hasCardPolicies = uniquePolicies.length > 0;
            const hasMemo = Boolean(memo.trim());

            return (
              <div className="a4-info-box" style={{ marginTop: '0.4rem' }}>
                {hasCardPolicies && (
                  <div className="a4-card-policy-box">
                    {uniquePolicies.slice(0, 2).map((pol, pIdx) => (
                      <div key={pol.key} style={pIdx > 0 ? { marginTop: '0.45rem', paddingTop: '0.36rem', borderTop: '1px dashed #86efac' } : undefined}>
                        <div className="a4-card-policy-header">
                          <div className="a4-card-policy-title">
                            <span className="a4-card-policy-badge">실적인정 기준</span>
                            <strong>{pol.displayName}</strong>
                          </div>
                          <div className="a4-card-policy-meta">
                            <span>프로모션: <strong>{pol.promoPeriod}</strong></span>
                            <span>카드문의: <strong>{pol.csPhone}</strong></span>
                          </div>
                        </div>

                        <div className="a4-card-policy-grid">
                          {pol.features.map((f, i) => (
                            <div key={i} className="a4-card-policy-item">
                              <span
                                className={`a4-status-tag ${
                                  f.status === 'O' ? 'tag-o' : f.status === 'X' ? 'tag-x' : 'tag-tri'
                                }`}
                              >
                                {f.status}
                              </span>
                              <span className="a4-card-feature-label">{f.label}</span>
                              <span className="a4-card-feature-text">{f.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {hasMemo && (
                  <div className="a4-memo-box" style={{ marginTop: hasCardPolicies ? '0.45rem' : '0' }}>
                    <div className="a4-memo-title">📋 맞춤 상담 메모 및 안내사항</div>
                    <div className="a4-memo-content">{memo.trim()}</div>
                  </div>
                )}

                {!hasCardPolicies && !hasMemo && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.65rem 0.9rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                      💡 스마트 결제 및 혜택 수령 체크포인트
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.72rem', color: '#64748b' }}>
                      <div style={{ background: '#ffffff', padding: '0.45rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                          {subCardTotalDiscount > 0 ? '① 제휴카드 청구할인' : '① 정기 구독 결제'}
                        </strong>
                        {subCardTotalDiscount > 0
                          ? '매월 실적 충족 시 결제일에 자동 청구 할인 반영'
                          : '약정 기간 등록된 결제수단으로 정기 자동이체 청구'}
                      </div>
                      <div style={{ background: '#ffffff', padding: '0.45rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>② 캐시백·상품권 지급</strong>
                        행사 기준 증빙 완료 후 익월(삼성AI구독 캐시백은 차차월 5~7일) 지정 계좌 및 모바일 지급
                      </div>
                      <div style={{ background: '#ffffff', padding: '0.45rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>③ 구독 전용 케어 보장</strong>
                        계약 기간 무상수리 보증 및 전문 엔지니어 정기 케어
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          };

          // 2번 스마트 견적서 1페이지 전용: 제휴카드 혜택 및 실적인정 기준 안내 박스
          const renderCardPolicyBox = () => {
            const uniquePolicies = subCardTotalDiscount > 0
              ? [...new Set(cardDetails.map((d) => d.policy).filter(Boolean))]
              : [];
            const hasCardPolicies = uniquePolicies.length > 0;

            if (!hasCardPolicies) {
              return (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.45rem 0.75rem', marginTop: '0.35rem' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', marginBottom: '0.2rem' }}>
                    💡 스마트 결제 및 혜택 수령 체크포인트
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', fontSize: '0.68rem', color: '#64748b' }}>
                    <div style={{ background: '#ffffff', padding: '0.35rem', borderRadius: '5px', border: '1px solid #f1f5f9' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '1px' }}>
                        {subCardTotalDiscount > 0 ? '① 제휴카드 청구할인' : '① 정기 구독 결제'}
                      </strong>
                      {subCardTotalDiscount > 0
                        ? '매월 실적 충족 시 결제일에 자동 청구 할인'
                        : '약정 기간 정기 자동이체 청구'}
                    </div>
                    <div style={{ background: '#ffffff', padding: '0.35rem', borderRadius: '5px', border: '1px solid #f1f5f9' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '1px' }}>② 캐시백·상품권 지급</strong>
                      행사 기준 증빙 완료 후 익월/차차월 지정 계좌 및 모바일 지급
                    </div>
                    <div style={{ background: '#ffffff', padding: '0.35rem', borderRadius: '5px', border: '1px solid #f1f5f9' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '1px' }}>③ 구독 전용 케어 보장</strong>
                      계약 기간 무상수리 보증 및 정기 케어
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="a4-info-box" style={{ marginTop: '0.35rem' }}>
                <div className="a4-card-policy-box">
                  {uniquePolicies.slice(0, 2).map((pol, pIdx) => (
                    <div key={pol.key} style={pIdx > 0 ? { marginTop: '0.45rem', paddingTop: '0.36rem', borderTop: '1px dashed #86efac' } : undefined}>
                      <div className="a4-card-policy-header">
                        <div className="a4-card-policy-title">
                          <span className="a4-card-policy-badge">실적인정 기준</span>
                          <strong>{pol.displayName}</strong>
                        </div>
                        <div className="a4-card-policy-meta">
                          <span>프로모션: <strong>{pol.promoPeriod}</strong></span>
                          <span>카드문의: <strong>{pol.csPhone}</strong></span>
                        </div>
                      </div>

                      <div className="a4-card-policy-grid">
                        {pol.features.map((f, i) => (
                          <div key={i} className="a4-card-policy-item">
                            <span
                              className={`a4-status-tag ${
                                f.status === 'O' ? 'tag-o' : f.status === 'X' ? 'tag-x' : 'tag-tri'
                              }`}
                            >
                              {f.status}
                            </span>
                            <span className="a4-card-feature-label">{f.label}</span>
                            <span className="a4-card-feature-text">{f.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          };

          // 2번 스마트 견적서 2페이지 전용: 상담 메모 정보 박스
          const renderPage2MemoInfo = () => {
            const hasMemo = Boolean(memo.trim());
            if (hasMemo) {
              return (
                <div className="a4-memo-box" style={{ marginTop: '0.35rem' }}>
                  <div className="a4-memo-title">📋 맞춤 상담 메모 및 안내사항</div>
                  <div className="a4-memo-content">{memo.trim()}</div>
                </div>
              );
            }
            return null;
          };

          // 2번 스마트 견적서 2페이지 전용: 전국 유일 스마트 견적서 차별화 어필 배너
          const renderPage2AppealBanner = () => {
            return (
              <div
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f0f7ff 100%)',
                  border: '1.5px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '0.55rem 0.85rem',
                  marginTop: '0.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.04)'
                }}
              >
                {/* 상단 타이틀 & 뱃지 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span
                      style={{
                        background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                        color: '#ffffff',
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        letterSpacing: '-0.01em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      👑 전국 유일
                    </span>
                    <strong style={{ fontSize: '0.82rem', color: '#1e3a8a', fontWeight: 900, letterSpacing: '-0.02em' }}>
                      JCC 진센조만의 독보적인 삼성 AI가전 스마트 복합 견적서
                    </strong>
                  </div>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 800,
                      color: '#0369a1',
                      background: '#e0f2fe',
                      border: '1px solid #bae6fd',
                      borderRadius: '4px',
                      padding: '1px 6px'
                    }}
                  >
                    1원 단위 투명 검증
                  </span>
                </div>

                {/* 핵심 3대 어필 포인트 */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.45rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '7px',
                    padding: '0.42rem 0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                    <div style={{ fontSize: '0.71rem', fontWeight: 800, color: '#1d4ed8' }}>
                      💡 전국 유일 하이브리드 설계
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#475569', lineHeight: 1.35, wordBreak: 'keep-all' }}>
                      삼성 AI구독과 일반구매를 최적으로 결합하여 최저 실체감가를 설계하는 <strong>전국 유일한 견적서</strong>입니다.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem', borderLeft: '1px solid #f1f5f9', paddingLeft: '0.45rem' }}>
                    <div style={{ fontSize: '0.71rem', fontWeight: 800, color: '#047857' }}>
                      🏬 전 채널 혜택 동시 비교
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#475569', lineHeight: 1.35, wordBreak: 'keep-all' }}>
                      백화점 상품권 &amp; 로드샵 제휴카드 캐시백, 무상수리 케어 가치까지 한눈에 투명하게 반영합니다.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem', borderLeft: '1px solid #f1f5f9', paddingLeft: '0.45rem' }}>
                    <div style={{ fontSize: '0.71rem', fontWeight: 800, color: '#b45309' }}>
                      🎖️ 19년 경력 CS명장 책임관리
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#475569', lineHeight: 1.35, wordBreak: 'keep-all' }}>
                      단순 가격 비교를 넘어 배송·설치·사후 혜택 입금 및 점검까지 끝까지 1:1 전담 케어해 드립니다.
                    </div>
                  </div>
                </div>
              </div>
            );
          };

          // 2번 스마트 견적서 2페이지 배치: 일반구매 모델 및 결제 조건 섹션
          const renderMixedLumpSection = () => {
            if (validMixedLumpItems.length === 0) return null;
            return (
              <div className="a4-mixed-sec a4-mixed-sec-lump" style={{ marginBottom: '0.45rem' }}>
                <div className="a4-mixed-sec-header header-lump">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <ShoppingBag size={15} style={{ color: '#fcd34d' }} />
                    <span>2. 일반구매 모델 &amp; 결제 조건</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: mixedChannelType === 'dept' ? '#78350f' : '#1e3a8a', color: '#ffffff', fontWeight: 700 }}>
                      {mixedChannelType === 'dept' ? '🏬 갤러리아 백화점 조건' : '🏪 진주본점 결제조건'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#fde68a', fontWeight: 600 }}>
                      총 {validMixedLumpItems.length}개 품목 ({mixedLumpQtyTotal}대)
                    </span>
                  </div>
                </div>

                <div className="a4-mixed-sec-body">
                  {/* 일반구매 품목 목록 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.18rem' }}>
                    {validMixedLumpItems.map((it, idx) => {
                      const { qty, gross, totalDiscount, net, unitDiscount } = getMixedLumpItemCalc(it);

                      return (
                        <div key={it.id} className="a4-row">
                          <span>
                            {idx + 1}. <strong>{(it.name || '').trim() || '일반구매 모델'}</strong>
                            {qty > 1 ? ` × ${qty}대` : ''}
                            {totalDiscount > 0 && (
                              <span style={{ display: 'inline-block', fontSize: '0.68rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', padding: '1px 5px', borderRadius: '4px', marginLeft: '6px', verticalAlign: 'middle' }}>
                                즉시할인 -{formatWon(totalDiscount)}{qty > 1 ? ` (대당 -${formatWon(unitDiscount)})` : ''}
                              </span>
                            )}
                          </span>
                          <strong>
                            {totalDiscount > 0 ? (
                              <>
                                <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textDecoration: 'line-through', marginRight: '5px' }}>
                                  {formatWon(gross)}
                                </span>
                                <span style={{ color: '#b45309' }}>{formatWon(net)}</span>
                              </>
                            ) : (
                              formatWon(gross)
                            )}
                          </strong>
                        </div>
                      );
                    })}
                    <div className="a4-row a4-row-base" style={{ paddingTop: '0.12rem' }}>
                      <span>일반구매 기준금액 합계</span>
                      <strong>
                        {mixedLumpModelDiscountTotal > 0 ? (
                          <>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600, textDecoration: 'line-through', marginRight: '6px' }}>
                              {formatWon(mixedLumpGross)}
                            </span>
                            <span style={{ color: '#b45309' }}>
                              {formatWon(mixedLumpGross - mixedLumpModelDiscountTotal)}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: '#0f172a' }}>{formatWon(mixedLumpGross)}</span>
                        )}
                      </strong>
                    </div>
                  </div>

                  {/* 일반구매 적용 혜택 & 특정 조건 할인 */}
                  <div className="a4-benefit-list" style={{ minHeight: 'auto', padding: '0.45rem 0.65rem' }}>
                    {mixedLumpModelDiscountTotal > 0 && (
                      <div className="a4-benefit-row">
                        <span>
                          <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                          <strong>현장 프로모션 즉시할인 합계</strong>
                        </span>
                        <span className="a4-minus">
                          - {formatWon(mixedLumpModelDiscountTotal)}
                        </span>
                      </div>
                    )}
                    {mixedChannelType === 'dept' ? (
                      <>
                        {deptCardDiscount > 0 && (
                          <div className="a4-benefit-row">
                            <span>
                              <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <strong>백화점 제휴카드 청구할인</strong>
                              {mixedDeptDiscountNote && (
                                <span style={{ color: '#78350f', fontSize: '0.73rem', fontWeight: 600, marginLeft: '6px' }}>
                                  ({mixedDeptDiscountNote})
                                </span>
                              )}
                              {mixedDeptDiscountProof && (
                                <span className="a4-proof-tag">제휴카드</span>
                              )}
                            </span>
                            <span className="a4-minus">- {formatWon(deptCardDiscount)}</span>
                          </div>
                        )}
                        {deptVoucherDiscount > 0 && (
                          <div className="a4-benefit-row">
                            <span>
                              <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <strong>갤러리아 상품권(G캐시)</strong>
                              {isDeptVoucherDeduct ? (
                                <span style={{ display: 'inline-block', fontSize: '0.68rem', fontWeight: 800, color: '#047857', background: '#d1fae5', border: '1px solid #6ee7b7', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', verticalAlign: 'middle' }}>
                                  {mixedDeptVoucherMode === 'full'
                                    ? '결제 전액 즉시차감'
                                    : mixedDeptVoucherMode === 'partial'
                                      ? '결제 부분 즉시차감'
                                      : '결제 즉시차감'}
                                </span>
                              ) : (
                                <span style={{ display: 'inline-block', fontSize: '0.68rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: '4px', marginLeft: '6px', verticalAlign: 'middle' }}>
                                  적립 (기본 5년 / 우대 추가분 60일)
                                </span>
                              )}
                            </span>
                            <span className="a4-minus">- {formatWon(deptVoucherDiscount)}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      roadSpecificDiscount > 0 && (
                        <div className="a4-benefit-row">
                          <span>
                            <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong>진주본점 결제조건 할인</strong>
                            {mixedRoadDiscountNote && (
                              <span style={{ color: '#78350f', fontSize: '0.73rem', fontWeight: 600, marginLeft: '6px' }}>
                                ({mixedRoadDiscountNote})
                              </span>
                            )}
                            {mixedRoadDiscountProof && (
                              <span className="a4-proof-tag">제휴카드</span>
                            )}
                          </span>
                          <span className="a4-minus">- {formatWon(roadSpecificDiscount)}</span>
                        </div>
                      )
                    )}
                    {mixedLumpModelDiscountTotal === 0 && mixedLumpSpecificDiscount === 0 && (
                      <div className="a4-benefit-row">
                        <span>
                          <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                          일반구매 기본 결제 조건
                        </span>
                        <span className="a4-benefit-note">표준 결제 조건 적용</span>
                      </div>
                    )}
                  </div>

                  {/* 일반구매 소계 바 (단일 라인) */}
                  <div className="a4-mixed-subtotal-bar subtotal-bar-lump" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {mixedChannelType === 'dept' && deptVoucherDiscount > 0 && (
                        isDeptVoucherDeduct ? (
                          <span style={{ fontSize: '0.76rem', color: '#047857', fontWeight: 800, background: '#d1fae5', border: '1px solid #6ee7b7', padding: '2px 8px', borderRadius: '4px' }}>
                            G캐시 {formatWon(deptVoucherDiscount)} 결제 즉시차감
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.76rem', color: '#92400e', fontWeight: 800, background: '#fef3c7', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: '4px' }}>
                            상품권(G캐시) {formatWon(deptVoucherDiscount)} 적립 지급
                          </span>
                        )
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginLeft: 'auto' }}>
                      <span style={{ fontSize: '0.76rem', color: '#78350f', fontWeight: 700 }}>일반구매 혜택가 소계: </span>
                      <strong style={{ fontSize: '1.02rem', fontWeight: 900, color: '#b45309' }}>
                        {formatWon(mixedLumpBenefitSub)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div
              className="a4-sheet-wrapper"
              style={
                mobileFitMode && isSmallScreen
                  ? {
                      overflow: 'hidden',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1.5rem',
                      padding: '0 0.5rem'
                    }
                  : undefined
              }
            >
              {isMixedMode ? (
                <>
                  {/* ===== [스마트 견적서 1페이지: 1번 구독 & 2번 일반구매] ===== */}
                  <div className="a4-print-sheet a4-page-1 a4-page-break" style={sheetStyle}>
                    {renderA4Header(1, 2)}
                    <div className="a4-mixed-unified-container">
                      {/* 1) 상단: 삼성AI구독 모델 및 전용 서비스 정리 */}
                      <div className="a4-mixed-sec a4-mixed-sec-sub">
                  <div className="a4-mixed-sec-header header-sub">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Sparkles size={15} style={{ color: '#93c5fd' }} />
                      <span>1. 삼성AI구독 모델 &amp; 전용 서비스</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#bfdbfe', fontWeight: 600 }}>
                      약정기간: {mixedSubPeriodSummary}개월 (총 {validMixedSubItems.length}개 모델 · {mixedSubItems.reduce((s, it) => s + getSubQty(it.quantity), 0)}대)
                    </span>
                  </div>

                  <div className="a4-mixed-sec-body">
                    {/* 구독 모델 목록 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.24rem' }}>
                      {validMixedSubItems.map((p, idx) => {
                        const modelTitle = (p.name || '').trim() || `삼성AI구독 모델 ${idx + 1}`;
                        const rawCycle = p.serviceCycle;
                        const hasCycle = rawCycle !== 0 && rawCycle !== '0' && rawCycle !== null && rawCycle !== '';
                        const itemCycle = Number(rawCycle) || 12;
                        const {
                          qty,
                          months: itemMonths,
                          baseMonthly: itemBase,
                          monthly: itemMonthly,
                          prepay: itemPrepay,
                          baseGross: itemBaseGross,
                          discountedGross: itemDiscountedGross,
                          feeDiscount: feeDiscountTotal,
                          selfCare: itemSelfCare,
                          visitCare: itemVisitCare,
                          serviceTotal: itemServiceTotal,
                          serviceLabel: itemServiceLabel
                        } = getMixedSubItemCalc(p);
                        const diff = itemBase - itemMonthly;
                        const hasCareService = (itemVisitCare > 0 || itemSelfCare > 0) && hasCycle;
                        const careTypeBadgeLabel =
                          itemVisitCare > 0 && itemSelfCare > 0
                            ? '방문케어+소모품'
                            : itemSelfCare > 0 && itemVisitCare === 0
                              ? '소모품'
                              : '방문케어';

                        return (
                          <div
                            key={p.id || idx}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.08rem',
                              paddingBottom: '0.24rem',
                              borderBottom: idx < validMixedSubItems.length - 1 ? '1px dashed rgba(37, 99, 235, 0.15)' : 'none'
                            }}
                          >
                            {/* 첫번째 줄: 1.모델명 + (72개월약정) (방문케어/셀프케어/소모품) (주기) 테두리 배지 | (선납금액) 월 기준료(취소선) 할인료 */}
                            <div className="a4-row" style={{ alignItems: 'center' }}>
                              <span style={{ flex: 1, minWidth: 0, display: 'inline-flex', alignItems: 'center', flexWrap: 'nowrap', gap: '0.22rem', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                                  {idx + 1}. <strong>{modelTitle}</strong>
                                  {qty > 1 ? ` × ${qty}대` : ''}
                                </span>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    fontSize: '0.63rem',
                                    fontWeight: 800,
                                    color: p.isMobile ? '#7c2d12' : '#1e40af',
                                    background: p.isMobile ? '#fff7ed' : '#eff6ff',
                                    border: p.isMobile ? '1px solid #fb923c' : '1px solid #60a5fa',
                                    borderRadius: '4px',
                                    padding: '1px 4.5px',
                                    lineHeight: 1.25,
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {p.isMobile
                                    ? `${itemMonths}개월 무상수리 + 파손보험`
                                    : `${itemMonths}개월 무상수리`}
                                </span>
                                {hasCareService && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      fontSize: '0.63rem',
                                      fontWeight: 800,
                                      color: '#065f46',
                                      background: '#ecfdf5',
                                      border: '1px solid #34d399',
                                      borderRadius: '4px',
                                      padding: '1px 4.5px',
                                      lineHeight: 1.25,
                                      flexShrink: 0,
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {careTypeBadgeLabel} {itemCycle}개월주기
                                  </span>
                                )}
                                {p.hasReinstall && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      fontSize: '0.63rem',
                                      fontWeight: 800,
                                      color: '#047857',
                                      background: '#d1fae5',
                                      border: '1px solid #10b981',
                                      borderRadius: '4px',
                                      padding: '1px 4.5px',
                                      lineHeight: 1.25,
                                      flexShrink: 0,
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    재설치서비스
                                  </span>
                                )}
                              </span>
                              <strong style={{ flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.35rem' }}>
                                {itemPrepay > 0 && (
                                  <span style={{ fontSize: '0.66rem', color: '#1e3a8a', fontWeight: 700, background: '#eff6ff', padding: '1px 4.5px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                                    선납 {formatWon(itemPrepay)}
                                  </span>
                                )}
                                {diff > 0 ? (
                                  <>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textDecoration: 'line-through' }}>
                                      월 {formatWon(itemBase * qty)}
                                    </span>
                                    <span style={{ color: '#1d4ed8', fontWeight: 800 }}>
                                      월 {formatWon(itemMonthly * qty)}
                                    </span>
                                  </>
                                ) : (
                                  <span style={{ color: '#1d4ed8', fontWeight: 800 }}>
                                    월 {formatWon(itemMonthly * qty)}
                                  </span>
                                )}
                              </strong>
                            </div>

                            {/* 모델별 서브 요약 노출 (구독료 할인 및 구독 혜택 상당 금액) */}
                            {(feeDiscountTotal > 0 || itemServiceTotal > 0) && (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.71rem',
                                  color: '#0369a1',
                                  paddingLeft: '0.85rem',
                                  paddingTop: '0.04rem',
                                  flexWrap: 'wrap',
                                  gap: '0.3rem'
                                }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  <span style={{ color: '#2563eb', fontWeight: 800 }}>↳</span>
                                  {feeDiscountTotal > 0 && (
                                    <span>
                                      <strong style={{ color: '#1e40af' }}>구독료 할인 -{formatWon(feeDiscountTotal)}</strong>{' '}
                                      <span style={{ fontSize: '0.66rem', color: '#64748b' }}>
                                        (기준 {formatWon(itemBaseGross)} → {formatWon(itemDiscountedGross)})
                                      </span>
                                    </span>
                                  )}
                                  {feeDiscountTotal > 0 && itemServiceTotal > 0 && <span style={{ color: '#94a3b8' }}>·</span>}
                                  {itemServiceTotal > 0 && (
                                    <strong style={{ color: '#0284c7' }}>
                                      구독 혜택 {formatWon(itemServiceTotal)} 상당
                                    </strong>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 구독 전용 혜택 및 서비스 내역 (요청 순서: 1.할인전 구독총금액 -> 2.구독료 할인 -> 3.선납금합계 -> 4.구독료합계 -> 5.제휴카드 할인정리 -> 6.무상수리+방문케어) */}
                    <div
                      className="a4-benefit-list"
                      style={{
                        minHeight: 'auto',
                        padding: '0.5rem 0.68rem',
                        background: 'rgba(37, 99, 235, 0.035)',
                        border: '1px solid rgba(37, 99, 235, 0.22)',
                        borderRadius: '7px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.24rem'
                      }}
                    >
                      {/* 1) 할인전 구독총금액 */}
                      <div className="a4-benefit-row" style={{ alignItems: 'center', fontSize: '0.78rem' }}>
                        <span style={{ color: '#1e3a8a', fontWeight: 800 }}>
                          <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                          할인전 구독총금액
                          <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600, marginLeft: '5px' }}>
                            (기본 구독료 × 약정기간 기준)
                          </span>
                        </span>
                        <strong
                          style={{
                            color: mixedSubFeeDiscountTotal > 0 ? '#64748b' : '#0f172a',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            textDecoration: mixedSubFeeDiscountTotal > 0 ? 'line-through' : 'none'
                          }}
                        >
                          {formatWon(mixedSubGrossTotal)}
                        </strong>
                      </div>

                      {/* 2) 구독료 할인 */}
                      {mixedSubFeeDiscountTotal > 0 && (
                        <div className="a4-benefit-row" style={{ alignItems: 'center', fontSize: '0.78rem' }}>
                          <span>
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#1e40af' }}>구독료 할인</strong>
                          </span>
                          <strong className="a4-minus-blue" style={{ fontSize: '0.84rem', fontWeight: 900 }}>
                            - {formatWon(mixedSubFeeDiscountTotal)}
                          </strong>
                        </div>
                      )}

                      {/* 3) 선납금 합계 */}
                      {mixedSubPrepayTotal > 0 && (
                        <div className="a4-benefit-row" style={{ alignItems: 'center', fontSize: '0.78rem' }}>
                          <span>
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#0f172a' }}>선납금 합계</strong>
                            <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600, marginLeft: '5px' }}>
                              (초기 일시불 납부)
                            </span>
                          </span>
                          <strong style={{ color: '#1e3a8a', fontSize: '0.82rem', fontWeight: 800 }}>
                            {formatWon(mixedSubPrepayTotal)}
                          </strong>
                        </div>
                      )}

                      {/* 4) 구독료 합계 */}
                      {mixedSubMonthsGroups.length > 1 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem' }}>
                          <div className="a4-benefit-row" style={{ alignItems: 'center', fontSize: '0.78rem' }}>
                            <span>
                              <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <strong style={{ fontWeight: 900, color: '#0f172a' }}>구독료 합계</strong>
                              <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600, marginLeft: '5px' }}>
                                (약정기간별 개별 합산)
                              </span>
                            </span>
                            <strong style={{ color: '#1d4ed8', fontSize: '0.84rem', fontWeight: 900 }}>
                              {formatWon(mixedSubMonthlyTotalSum)}
                            </strong>
                          </div>
                          {/* 약정기간별 상세 내역 (들여쓰기) */}
                          <div style={{ paddingLeft: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.08rem' }}>
                            {mixedSubMonthsGroups.map((grp) => (
                              <div
                                key={grp.months}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.71rem',
                                  color: '#475569'
                                }}
                              >
                                <span>
                                  <span style={{ color: '#3b82f6', marginRight: '4px', fontWeight: 700 }}>↳</span>
                                  <strong style={{ color: '#1e40af' }}>{grp.months}개월 약정 ({grp.count}대)</strong>: 월 {formatWon(grp.monthlyFee)} × {grp.months}개월
                                </span>
                                <span style={{ fontWeight: 700, color: '#1e3a8a' }}>
                                  = {formatWon(grp.monthlyTotal)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="a4-benefit-row" style={{ alignItems: 'center', fontSize: '0.78rem' }}>
                          <span>
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#0f172a' }}>구독료 합계</strong>
                            <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600, marginLeft: '5px' }}>
                              (월 {formatWon(mixedSubMonthlyFeeTotal)} × {mixedSubPeriodSummary}개월)
                            </span>
                          </span>
                          <strong style={{ color: '#1d4ed8', fontSize: '0.84rem', fontWeight: 900 }}>
                            {formatWon(mixedSubMonthlyTotalSum)}
                          </strong>
                        </div>
                      )}

                      {/* 5) 선납포함 총금액 (선납금 발생 시 상세내용에 표기) */}
                      {mixedSubPrepayTotal > 0 && (
                        <div className="a4-benefit-row" style={{ alignItems: 'center', fontSize: '0.78rem' }}>
                          <span>
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#1e40af' }}>선납포함 총금액</strong>
                          </span>
                          <strong style={{ color: '#1e40af', fontSize: '0.84rem', fontWeight: 900 }}>
                            {formatWon(mixedSubDiscountedGrossTotal)}
                          </strong>
                        </div>
                      )}

                      {/* 5) 제휴카드 할인정리 */}
                      {subCardTotalDiscount > 0 && (
                        <>
                          <div style={{ borderTop: '1px dashed rgba(37, 99, 235, 0.18)', margin: '0.1rem 0 0.06rem 0' }} />
                          <div className="a4-benefit-row" style={{ alignItems: 'center', lineHeight: 1.28 }}>
                            <span style={{ fontSize: '0.78rem', flex: 1, wordBreak: 'keep-all' }}>
                              <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <strong style={{ fontWeight: 900, color: '#0f172a' }}>제휴카드 청구할인</strong>
                              {cardCompanySummary && (
                                <span style={{ fontSize: '0.67rem', color: '#2563eb', fontWeight: 700, marginLeft: '4px' }}>
                                  ({cardCompanySummary})
                                </span>
                              )}
                            </span>
                            <strong className="a4-minus-blue" style={{ fontSize: '0.84rem', fontWeight: 900 }}>- {formatWon(subCardTotalDiscount)}</strong>
                          </div>
                          {allCardSubLines.length > 0 && (
                            <div style={{ fontSize: '0.63rem', color: '#64748b', fontWeight: 500, marginLeft: '9px', lineHeight: 1.35 }}>
                              {allCardSubLines.map((line, lIdx) => (
                                <div key={lIdx}>{line}</div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {/* 6) 구독 혜택 (무상수리 + 케어) */}
                      {mixedSubServiceBenefit > 0 && (
                        <div className="a4-benefit-row" style={{ alignItems: 'center' }}>
                          <span style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#0f172a' }}>
                              구독 혜택
                            </strong>
                          </span>
                          <strong style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.80rem' }}>
                            {formatWon(mixedSubServiceBenefit)} 상당
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* 구독 소계 바: 좌측에 모든혜택가 반영 총금액, 우측에 제휴카드 적용 실납부액 2줄 */}
                    <div
                      className="a4-mixed-subtotal-bar subtotal-bar-sub"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.45rem 0.85rem',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '7px',
                        flexWrap: 'wrap',
                        gap: '0.5rem'
                      }}
                    >
                      {/* 좌측 끝: 모든 혜택가 반영 총금액 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.08rem' }}>
                        <span style={{ fontSize: '0.70rem', color: '#475569', fontWeight: 700 }}>
                          모든 혜택가 반영 총금액
                        </span>
                        <strong style={{ fontSize: '1.08rem', fontWeight: 900, color: '#1e40af', letterSpacing: '-0.02em' }}>
                          {formatWon(mixedSubFinalPrice)}
                        </strong>
                      </div>

                      {/* 우측 끝: 제휴카드 적용 실납부액 위아래 2줄 */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.12rem' }}>
                        {subSegments.length > 1 ? (
                          subSegments.map((seg, sIdx) => {
                            const segNet = seg.netMonthly;
                            const periodLabel = sIdx === 0 ? `1~${seg.endMonth}개월` : `${seg.startMonth}~${seg.endMonth}개월`;
                            return (
                              <div key={seg.endMonth} style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.72rem', color: sIdx === 0 ? '#1e3a8a' : '#64748b', fontWeight: 700 }}>
                                  {subCardTotalDiscount > 0 ? `제휴카드 적용 실납부액 [${periodLabel}]:` : `월 납부액 [${periodLabel}]:`}
                                </span>
                                <strong
                                  style={{
                                    fontSize: sIdx === 0 ? '1.08rem' : '1.0rem',
                                    fontWeight: 900,
                                    color: sIdx === 0 ? '#1d4ed8' : '#2563eb',
                                    letterSpacing: '-0.02em'
                                  }}
                                >
                                  월 {formatWon(segNet)}
                                </strong>
                              </div>
                            );
                          })
                        ) : (
                          <>
                            <span style={{ fontSize: '0.72rem', color: '#1e3a8a', fontWeight: 700 }}>
                              {subCardTotalDiscount > 0 ? '제휴카드 적용 실납부액' : '월 납부액'}
                            </span>
                            <strong
                              style={{
                                fontSize: '1.14rem',
                                fontWeight: 900,
                                color: '#1d4ed8',
                                letterSpacing: '-0.02em',
                                textShadow: '0 1px 2px rgba(29, 78, 216, 0.1)'
                              }}
                            >
                              월 {formatWon(mixedSubMonthlyAfterCard)}
                            </strong>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 제휴카드 혜택 & 실적인정 기준 안내 (1페이지로 이동) */}
                {renderCardPolicyBox()}

                {/* 1페이지 하단: 다음 장(2P) 연결 안내 바 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.36rem 0.75rem', fontSize: '0.74rem', color: '#64748b', marginTop: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>📋 1P: 삼성AI구독 모델 &amp; 제휴카드 혜택 안내</span>
                  <span style={{ fontWeight: 700, color: '#2563eb' }}>다음 2P: 전국 유일 스마트 견적서 최종 실체감가 확인 ➔</span>
                </div>
              </div>

              {/* 1페이지 하단: 사진과 명함 제외 */}
              {renderA4Footer(false)}
            </div>

              {/* ===== [스마트 견적서 2페이지: 2번 일반구매 & 3번 통합캐시백 & 최종실체감가] ===== */}
              <div className="a4-print-sheet a4-page-2" style={sheetStyle}>
                {renderA4Header(2, 2)}
                <div className="a4-mixed-unified-container">
                  {/* 2) 일반구매 모델 및 할인 혜택 (2페이지로 이동) */}
                  {renderMixedLumpSection()}

                  {/* 3) 하단: 통합 캐시백 · 상품권 지급 및 최종 정산 */}
                  <div className="a4-mixed-sec a4-mixed-sec-grand">
                    <div className="a4-mixed-sec-header header-grand">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Award size={15} style={{ color: '#fde68a' }} />
                        <span>3. 통합 캐시백 · 상품권 지급 및 최종 실체감가</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>
                        총 할인 합계: - {formatWon(mixedGrandBenefit + mixedSubServiceBenefit)} ({mixedGrandGross > 0 ? (((mixedGrandBenefit + mixedSubServiceBenefit) / mixedGrandGross) * 100).toFixed(1) : '0.0'}% 절감)
                      </span>
                    </div>

                    <div className="a4-mixed-sec-body" style={{ padding: '0.55rem 0.95rem' }}>
                      {/* 1번·2번 혜택가 및 3번 모든 혜택 종합 정리 영역 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.24rem', paddingBottom: '0.38rem', borderBottom: '1px dashed #cbd5e1' }}>
                        {/* 1. 삼성AI구독 혜택가 (구독 등록 시) */}
                        {validMixedSubItems.length > 0 && (
                          <div className="a4-benefit-row" style={{ fontSize: '0.77rem', alignItems: 'center' }}>
                            <span>
                              <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <span style={{ color: '#1e3a8a', fontWeight: 700 }}>
                                1. 삼성AI구독 혜택가 소계
                              </span>
                            </span>
                            <span style={{ fontWeight: 800, color: '#1e40af' }}>
                              {formatWon(mixedSubGrossTotal - mixedSubOnlyDiscount)}
                            </span>
                          </div>
                        )}

                        {/* 2. 일반구매 혜택가 (일반구매 등록 시) */}
                        {validMixedLumpItems.length > 0 && (
                          <div className="a4-benefit-row" style={{ fontSize: '0.77rem', alignItems: 'center' }}>
                            <span>
                              <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <span style={{ color: '#92400e', fontWeight: 700 }}>2. 일반구매 혜택가 소계</span>
                            </span>
                            <strong style={{ color: '#b45309', fontWeight: 800 }}>
                              {formatWon(mixedLumpBenefitSub)}
                            </strong>
                          </div>
                        )}

                        {/* 소계 두개의 합계 (1번 구독 + 2번 일반구매 혜택가 소계 합) */}
                        {validMixedSubItems.length > 0 && validMixedLumpItems.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.24rem 0.55rem',
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              margin: '0.12rem 0 0.18rem 0'
                            }}
                          >
                            <span style={{ fontSize: '0.75rem', color: '#1e293b', fontWeight: 800 }}>
                              <span style={{ color: '#475569', marginRight: '4px', fontWeight: 800 }}>=</span>
                              소계 합계 (구독 혜택가 + 일반구매 혜택가)
                            </span>
                            <strong style={{ fontSize: '0.90rem', color: '#0f172a', fontWeight: 900 }}>
                              {formatWon((mixedSubGrossTotal - mixedSubOnlyDiscount) + mixedLumpBenefitSub)}
                            </strong>
                          </div>
                        )}

                        {/* 캐시백 혜택 (3번 숫자 제거) */}
                        {validMixedCashbackItems.map((cb, idx) => (
                          <div className="a4-benefit-row" key={cb.id || `cb-${idx}`} style={{ fontSize: '0.77rem', alignItems: 'center' }}>
                            <span>
                              <span style={{ color: '#059669', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <span style={{ color: '#065f46', fontWeight: 700 }}>{(cb.name || '').trim() || (mixedEventType === 'normal' ? '통합 캐시백' : `${eventPrefix}캐시백`)}</span>
                              <span style={{ fontSize: '0.70rem', color: '#059669', fontWeight: 600, marginLeft: '6px' }}>
                                (설치후 차차월 5~7일)
                              </span>
                              {cb.hasProof && (
                                <span className="a4-proof-tag" style={{ marginLeft: '6px' }}>증빙완료시</span>
                              )}
                            </span>
                            <span className="a4-minus-blue" style={{ fontSize: '0.82rem', fontWeight: 800 }}>- {formatWon(cb.amount)}</span>
                          </div>
                        ))}

                        {/* 상품권 혜택 (4번 숫자 제거) */}
                        {validMixedVoucherItems.map((vc, idx) => (
                          <div className="a4-benefit-row" key={vc.id || `vc-${idx}`} style={{ fontSize: '0.77rem', alignItems: 'center' }}>
                            <span>
                              <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <span style={{ color: '#92400e', fontWeight: 700 }}>{(vc.name || '').trim() || (mixedEventType === 'normal' ? '모바일/지류 상품권' : `${eventPrefix} 상품권`)}</span>
                              <span style={{ fontSize: '0.70rem', color: '#d97706', fontWeight: 600, marginLeft: '6px' }}>
                                (모바일 상품권, 설치후 2주 뒤)
                              </span>
                              {vc.hasProof && (
                                <span className="a4-proof-tag" style={{ marginLeft: '6px' }}>증빙완료시</span>
                              )}
                            </span>
                            <span className="a4-minus-blue" style={{ fontSize: '0.82rem', fontWeight: 800 }}>- {formatWon(vc.amount)}</span>
                          </div>
                        ))}

                        {/* 구독케어 혜택 (하단으로 이동) */}
                        {mixedSubServiceBenefit > 0 && (
                          <div className="a4-benefit-row" style={{ fontSize: '0.77rem', alignItems: 'center' }}>
                            <span>
                              <span style={{ color: '#0284c7', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <span style={{ color: '#0369a1', fontWeight: 700 }}>구독케어혜택</span>
                              <span style={{ fontSize: '0.70rem', color: '#0284c7', fontWeight: 600, marginLeft: '6px' }}>
                                (무상수리연장, 방문케어, 소모품)
                              </span>
                            </span>
                            <span className="a4-minus-blue" style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7' }}>
                              - {formatWon(mixedSubServiceBenefit)} 상당
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 최종 정산 요약 박스 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.35rem' }}>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                          총 기준금액 {formatWon(mixedGrandGross)} · 총 할인 합계 - {formatWon(mixedGrandBenefit + mixedSubServiceBenefit)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.08rem' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>고객 최종 실체감가</span>
                            <strong style={{ fontSize: '1.48rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '-0.02em' }}>
                              {formatWon(Math.max(0, mixedGrandGross - mixedGrandBenefit - mixedSubServiceBenefit))}
                            </strong>
                          </div>
                          {mixedSubServiceBenefit > 0 && (
                            <span style={{ fontSize: '0.69rem', color: '#0284c7', fontWeight: 700 }}>
                              (구독케어 비용 포함)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2페이지 추가 정보 (상담 메모) */}
                {renderPage2MemoInfo()}

                {/* 전국 유일 스마트 견적서 차별화 어필 배너 */}
                {renderPage2AppealBanner()}

                {renderA4Footer()}
              </div>
          </>
        ) : (
          /* ===== [비교서: Option A vs Option B] ===== */
          <div className="a4-print-sheet" style={sheetStyle}>
            {renderA4Header(1, 1)}

            {/* 품목 요약 바 (비교 모드에서 입력 시 표시) */}
            {productSummary.trim() && (
              <div className="a4-product-bar">
                <span className="a4-product-bar-label">상담 구성 품목</span>
                <span className="a4-product-bar-text">{productSummary.trim()}</span>
              </div>
            )}

            {/* 2. 최종 체감가 차이 강조 배너 (비교 모드 전용) */}
            <div className={`a4-highlight-banner ${winner === 'sub' ? 'winner-sub' : 'winner-lump'}`}>
              {rawDiff > 0 ? (
                <div className="a4-highlight-headline">
                  <strong>삼성AI구독</strong>이 일반구매 대비 최종 체감가
                  <span className="a4-diff-pill">{formatWon(absDiff)} 더 유리</span>합니다.
                </div>
              ) : rawDiff < 0 ? (
                winner === 'sub' ? (
                  <div className="a4-highlight-headline">
                    일반구매 대비 차액은<span className="a4-diff-pill">{formatWon(absDiff)}</span>이며,{' '}
                    <strong>삼성AI구독</strong>은 초기 목돈 부담이 없습니다.
                  </div>
                ) : (
                  <div className="a4-highlight-headline">
                    <strong>일반구매</strong>가 삼성AI구독 대비 최종 체감가
                    <span className="a4-diff-pill">{formatWon(absDiff)} 더 유리</span>합니다.
                  </div>
                )
              ) : (
                <div className="a4-highlight-headline">
                  일반구매와 삼성AI구독의 최종 체감가가<span className="a4-diff-pill">{formatWon(lumpFinalPrice)}으로 동일</span>합니다.
                </div>
              )}
              <div className="a4-highlight-sub">
                ※ 삼성AI구독은 고객님의 신용정보에 따라 가입이 제한될 수 있습니다.
              </div>
            </div>

            {/* 3. 일반구매 vs 구독 좌우 1:1 비교 카드 영역 (4단 수평 정렬 구조) */}
            <div className="a4-compare-grid">
              {/* 좌측: 일반구매 조건 */}
              <div className={`a4-plan-card ${winner === 'lump' ? 'a4-plan-recommended' : ''}`}>
                <div className="a4-plan-header plan-lump">
                  <div>
                    <span className="a4-plan-kicker">OPTION A · 일반 결제</span>
                    <h2 className="a4-plan-title">일반구매 조건</h2>
                  </div>
                  {winner === 'lump' && <span className="a4-rec-chip">추천 플랜</span>}
                </div>

                <div className="a4-plan-top">
                  <div className="a4-row a4-row-base">
                    <span>총 기준 구매금액</span>
                    <strong>{formatWon(lumpBasePrice)}</strong>
                  </div>

                  <div className="a4-row">
                    <span>결제 방식</span>
                    <strong>제휴카드 조건 (무이자 할부)</strong>
                  </div>
                </div>

                <div className="a4-plan-middle">
                  <div className="a4-divider-label">적용 혜택 및 서비스</div>
                  <div className="a4-benefit-list">
                    <div className="a4-benefit-row">
                      <span>
                        <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                        일반구매 총 할인·혜택
                      </span>
                      <span className="a4-minus">- {formatWon(lumpTotalBenefit)}</span>
                    </div>
                    <div className="a4-benefit-row">
                      <span>
                        <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                        무상수리 보증
                      </span>
                      <span className="a4-benefit-note">기본 보증만 적용</span>
                    </div>
                    {hasCareService && (
                      <div className="a4-benefit-row">
                        <span>
                          <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                          전문 케어서비스
                        </span>
                        <span className="a4-benefit-note">미포함 (별도 비용)</span>
                      </div>
                    )}
                  </div>

                  <div className="a4-row a4-benefit-total-row">
                    <span>총 할인 합계</span>
                    <strong className="a4-minus">- {formatWon(lumpTotalBenefit)}</strong>
                  </div>
                </div>

                {/* 좌측 결과 푸터: 메인(일시불 크게) + 하단(동일기간 할부 작게) */}
                <div className="a4-plan-footer footer-lump">
                  <div className="a4-final-row" style={{ alignItems: 'center' }}>
                    <span className="a4-final-label">일반구매 최종 체감가</span>
                    <strong className="a4-final-price">{formatWon(lumpFinalPrice)}</strong>
                  </div>

                  <div className="a4-footer-sub-box sub-box-lump">
                    <div className="a4-footer-sub-main">
                      <span>동일 {subMonths}개월 할부 시 (연 {numericCardRate}%)</span>
                      <strong className="sub-strong-red">총 {formatWon(lumpInstallment.totalPayment)}</strong>
                    </div>
                    <div className="a4-footer-sub-note">
                      월 납부액 {formatWon(lumpInstallment.monthly)} (할부이자 +{formatWon(lumpInstallment.totalInterest)} 포함)
                    </div>
                  </div>
                </div>
              </div>

              {/* 우측: 삼성AI구독 */}
              <div className={`a4-plan-card ${winner === 'sub' ? 'a4-plan-recommended-blue' : ''}`}>
                <div className="a4-plan-header plan-sub">
                  <div>
                    <span className="a4-plan-kicker">
                      {isMultiPeriod
                        ? `OPTION B · ${periodSummaryLabel}개월 약정`
                        : `OPTION B · ${subMonths}개월 약정 (${subMonths / 12}년)`}
                    </span>
                    <h2 className="a4-plan-title">삼성AI구독 조건</h2>
                  </div>
                  {winner === 'sub' && <span className="a4-rec-chip chip-blue">추천 플랜</span>}
                </div>

                <div className="a4-plan-top">
                  <div className="a4-row a4-row-base">
                    <span>총 구독 기준금액</span>
                    <strong>{formatWon(subGrossTotal)}</strong>
                  </div>

                  <div className="a4-row" style={isMultiPeriod || subPrepay > 0 ? { alignItems: 'flex-start' } : undefined}>
                    <span style={{ fontWeight: 800, color: '#1e293b' }}>월 기본 구독료</span>
                    {isMultiPeriod ? (
                      <div style={{ textAlign: 'right', lineHeight: 1.42 }}>
                        {subSegments.map((seg, idx) => (
                          <div key={seg.endMonth} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                              {idx === 0 ? `${seg.duration}개월간` : `잔여 ${seg.duration}개월`}
                            </span>
                            <strong style={{ fontSize: '0.86rem', fontWeight: 900, color: '#0f172a' }}>
                              월 {formatWon(seg.baseMonthly)}
                            </strong>
                          </div>
                        ))}
                        {subPrepay > 0 && (
                          <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                            선납금 {formatWon(subPrepay)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right', lineHeight: 1.36 }}>
                        <strong style={{ display: 'block', fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>월 {formatWon(effectiveMonthlyBase)}</strong>
                        {subPrepay > 0 && (
                          <span style={{ display: 'block', fontSize: '0.67rem', color: '#64748b', fontWeight: 500 }}>
                            선납금 {formatWon(subPrepay)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="a4-plan-middle">
                  <div className="a4-divider-label">적용 혜택 및 서비스</div>
                  <div className="a4-benefit-list">
                    {subCardTotalDiscount > 0 && (
                      <div>
                        <div
                          className="a4-benefit-row"
                          style={{
                            alignItems: 'center',
                            lineHeight: 1.28
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.78rem',
                              wordBreak: 'keep-all',
                              lineHeight: 1.25,
                              flex: 1
                            }}
                          >
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#0f172a' }}>제휴카드 청구할인</strong>
                            {cardCompanySummary && (
                              <span style={{ fontSize: '0.67rem', color: '#2563eb', fontWeight: 700, marginLeft: '4px' }}>
                                ({cardCompanySummary})
                              </span>
                            )}
                          </span>
                          <strong
                            className="a4-minus-blue"
                            style={{
                              flexShrink: 0,
                              marginLeft: '0.35rem',
                              whiteSpace: 'nowrap',
                              fontSize: '0.84rem',
                              fontWeight: 900
                            }}
                          >
                            - {formatWon(subCardTotalDiscount)}
                          </strong>
                        </div>
                        {allCardSubLines.length > 0 && (
                          <div
                            style={{
                              fontSize: '0.63rem',
                              color: '#64748b',
                              fontWeight: 500,
                              marginTop: '2px',
                              marginLeft: '9px',
                              lineHeight: 1.35,
                              wordBreak: 'keep-all'
                            }}
                          >
                            {allCardSubLines.map((line, lIdx) => (
                              <div key={lIdx}>{line}</div>
                            ))}
                          </div>
                        )}
                        {hasAnyNonSamsungCard && (
                          <div
                            style={{
                              fontSize: '0.60rem',
                              color: '#dc2626',
                              fontWeight: 600,
                              marginTop: '2px',
                              marginLeft: '9px',
                              lineHeight: 1.25,
                              wordBreak: 'keep-all'
                            }}
                          >
                            <div>※ 주의: 기존 카드 보유회원 적용 제외</div>
                            <div style={{ color: '#b91c1c', fontWeight: 500 }}>
                              (비회원 또는 최근 6개월간 결제이력 없는 고객 한함)
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {!isMixedMode && (
                      <div className="a4-benefit-row" style={{ alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem' }}>
                          <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                          <strong style={{ fontWeight: 900, color: '#0f172a' }}>삼성AI구독 혜택</strong>
                          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>
                            (캐시백, 차차월 5~7일)
                          </span>
                        </span>
                        <strong className="a4-minus-blue" style={{ fontSize: '0.84rem', fontWeight: 900 }}>
                          - {formatWon(subPurchaseBenefit)}
                        </strong>
                      </div>
                    )}
                    {isCombinedFreeService ? (
                      <>
                        {/* 1) 가전 무상수리 연장 이용료 */}
                        <div className="a4-benefit-row" style={{ alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
                            <span style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                              <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <strong style={{ fontWeight: 900, color: '#0f172a' }}>무상수리 연장 이용료</strong>
                              <span style={{ fontSize: '0.67rem', color: '#2563eb', fontWeight: 700, marginLeft: '4px' }}>
                                (가전)
                              </span>
                            </span>
                            {applianceFreeServiceCount > 0 && (
                              <span style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 500, marginTop: '2px', marginLeft: '9px', whiteSpace: 'nowrap' }}>
                                (가전 {applianceFreeServiceCount}개 품목 · {applianceFreeServiceQuantity}대)
                              </span>
                            )}
                          </div>
                          <strong style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.80rem', flexShrink: 0, marginTop: '1px' }}>
                            {applianceFreeServiceAmount > 0
                              ? `${formatWon(applianceFreeServiceAmount)} 상당`
                              : '무상 보증 포함'}
                          </strong>
                        </div>

                        {/* 2) 모바일 무상수리 + 파손보험 */}
                        <div className="a4-benefit-row" style={{ alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
                            <span style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                              <span style={{ color: '#0284c7', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <strong style={{ fontWeight: 900, color: '#0f172a' }}>모바일 무상수리 + 파손보험</strong>
                            </span>
                            {mobileFreeServiceCount > 0 && (
                              <span style={{ fontSize: '0.64rem', color: '#0284c7', fontWeight: 500, marginTop: '2px', marginLeft: '9px', whiteSpace: 'nowrap', opacity: 0.85 }}>
                                (모바일 {mobileFreeServiceCount}개 품목 · {mobileFreeServiceQuantity}대)
                              </span>
                            )}
                          </div>
                          <strong style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.80rem', flexShrink: 0, marginTop: '1px' }}>
                            {mobileFreeServiceAmount > 0
                              ? `${formatWon(mobileFreeServiceAmount)} 상당`
                              : '무상 보증 포함'}
                          </strong>
                        </div>
                      </>
                    ) : (
                      <div className="a4-benefit-row" style={{ alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
                          <span style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                            <span style={{ color: hasAnyFreeServiceMobile ? '#0284c7' : '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#0f172a' }}>
                              {hasAnyFreeServiceMobile ? '모바일 무상수리 + 파손보험' : '무상수리 연장 이용료'}
                            </strong>
                            {!hasAnyFreeServiceMobile && (
                              <span style={{ fontSize: '0.67rem', color: '#2563eb', fontWeight: 700, marginLeft: '4px' }}>
                                (혜택)
                              </span>
                            )}
                          </span>
                          {validFreeServiceCount > 0 && (
                            <span style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 500, marginTop: '2px', marginLeft: '9px', whiteSpace: 'nowrap' }}>
                              (총 {validFreeServiceCount}개 품목 · {totalFreeServiceQuantity}대)
                            </span>
                          )}
                        </div>
                        <strong style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.80rem', flexShrink: 0, marginTop: '1px' }}>
                          {subFreeServiceAmount > 0
                            ? `${formatWon(subFreeServiceAmount)} 상당`
                            : '무상 보증 포함'}
                        </strong>
                      </div>
                    )}
                    {hasCareService && (
                      <div className="a4-benefit-row" style={{ alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
                          <span style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#0f172a' }}>케어서비스 혜택</strong>
                            <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>
                              (방문관리·소모품)
                            </span>
                          </span>
                          {validCareServiceCount > 0 && (
                            <span style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 500, marginTop: '2px', marginLeft: '9px', whiteSpace: 'nowrap' }}>
                              ({validCareServiceCount <= 2
                                ? validCareServiceItems
                                    .map((it) => `${it.name?.trim() || '케어서비스'} ${it.count || 1}${it.unit || (it.name?.includes('소모품') ? '개' : '회')}`)
                                    .join(' · ')
                                : `총 ${validCareServiceCount}개 항목`})
                            </span>
                          )}
                        </div>
                        <strong style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.80rem', flexShrink: 0, marginTop: '1px' }}>
                          {formatWon(subCareServiceAmount)} 상당
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="a4-row a4-benefit-total-row">
                    <span>총 할인 합계</span>
                    <strong className="a4-minus-blue">- {formatWon(subTotalBenefitSum)}</strong>
                  </div>
                </div>

                {/* 우측 결과 푸터: 메인(최종 체감가 크게) + 하단(실제 월 납부액 작게) */}
                <div className="a4-plan-footer footer-sub">
                  <div className="a4-final-row" style={{ alignItems: 'center' }}>
                    <span className="a4-final-label" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.25 }}>
                      <strong style={{ fontSize: '0.94rem', fontWeight: 900, color: '#0f172a' }}>삼성AI구독 최종 체감가</strong>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                        {subPrepay > 0 && (
                          <span style={{ fontSize: '0.65rem', color: '#1e40af', fontWeight: 600, letterSpacing: '-0.2px' }}>
                            (선납금포함)
                          </span>
                        )}
                        {includeServiceInFinal && subServiceTotal > 0 && (
                          <span style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 600, letterSpacing: '-0.2px' }}>
                            (서비스혜택 {formatWon(subServiceTotal)} 반영)
                          </span>
                        )}
                      </div>
                    </span>
                    <strong className="a4-final-price price-blue" style={{ fontSize: '1.45rem', fontWeight: 900 }}>
                      {formatWon(subFinalPrice)}
                    </strong>
                  </div>

                  <div className="a4-footer-sub-box sub-box-blue" style={{ padding: '0.45rem 0.65rem' }}>
                    {isMultiPeriod ? (
                      subSegments.map((seg, idx) => (
                        <div
                          key={seg.endMonth}
                          className="a4-footer-sub-main"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: idx > 0 ? '0.2rem' : 0
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <strong style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a' }}>
                              {idx === 0 ? `${seg.duration}개월간 월 실납부액` : `잔여 ${seg.duration}개월 월 실납부액`}
                            </strong>
                            <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 500 }}>
                              ({idx === 0 ? `1~${seg.endMonth}개월` : `${seg.startMonth}~${seg.endMonth}개월`})
                            </span>
                          </span>
                          <strong className="sub-strong-blue" style={{ fontSize: '1.02rem', fontWeight: 900 }}>
                            월 {formatWon(seg.netMonthly)}
                          </strong>
                        </div>
                      ))
                    ) : (
                      <div className="a4-footer-sub-main" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e3a8a' }}>
                          {subCardTotalDiscount > 0 ? '제휴카드 적용 월 실납부액' : '월 실납부액'}
                        </strong>
                        <strong className="sub-strong-blue" style={{ fontSize: '1.02rem', fontWeight: 900 }}>월 {formatWon(subMonthlyAfterCard)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. 제휴카드 실적인정 기준 안내 & 메모 */}
            {renderPage2ExtraInfo()}

            {/* 5. 조준석 매니저 하단 명함 영역 */}
            {renderA4Footer()}
          </div>
        )}
      </div>
    );
  })()}

        {/* 하단 빠른 실행 버튼 바 */}
        <div
          className="container no-print"
          style={{
            maxWidth: '920px',
            marginTop: '1.25rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setStep('input');
              window.scrollTo(0, 0);
            }}
            className="btn-secondary"
            style={{
              padding: '0.85rem 1.6rem',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '12px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
            }}
          >
            <ArrowLeft size={19} /> 조건 수정하기
          </button>
          <button
            type="button"
            onClick={handleExportAsImage}
            disabled={isExportingImage}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.22), rgba(5, 150, 105, 0.35))',
              border: '1px solid rgba(52, 211, 153, 0.55)',
              color: '#6ee7b7',
              padding: '0.85rem 1.55rem',
              borderRadius: '12px',
              cursor: isExportingImage ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.22)'
            }}
          >
            <Camera size={19} /> {isExportingImage ? '사진 생성 중...' : '견적서 사진(이미지) 저장'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-primary pulse"
            style={{ padding: '0.85rem 1.8rem', fontSize: '1rem' }}
          >
            <Printer size={19} /> A4 용지로 인쇄 / PDF 저장
          </button>
          {isMixedMode && mixedChannelType === 'dept' && (
            <button
              type="button"
              onClick={() => setShowPosCashierModal(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(14, 165, 233, 0.35))',
                border: '1px solid rgba(56, 189, 248, 0.6)',
                color: '#38bdf8',
                padding: '0.85rem 1.55rem',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.22)'
              }}
            >
              <Receipt size={19} /> 🖨️ 캐셔 POS 결제 지시서
            </button>
          )}
        </div>

        {/* 견적서 사진 미리보기 & 모바일 저장 모달 */}
        {imageModalData && (
          <div
            role="dialog"
            aria-modal="true"
            className="no-print"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.82)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              backdropFilter: 'blur(6px)'
            }}
            onClick={() => setImageModalData(null)}
          >
            <div
              style={{
                background: '#0f172a',
                border: '1px solid rgba(212, 175, 55, 0.45)',
                borderRadius: '16px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Camera size={18} style={{ color: '#34d399' }} />
                  <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#f8fafc' }}>
                    견적서 사진 생성 완료
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setImageModalData(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* 모달 이미지 뷰어 */}
              <div
                style={{
                  padding: '1rem',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: '#020617'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.9rem',
                    fontSize: '0.82rem',
                    color: '#a7f3d0',
                    marginBottom: '0.85rem',
                    lineHeight: 1.45
                  }}
                >
                  💡 <strong>스마트폰 갤러리 저장 안내:</strong> 아래 사진을 <strong>1~2초간 꾹(길게) 터치</strong>하신 후 <strong>[사진 앱에 저장]</strong> 또는 <strong>[공유]</strong>를 선택하시면 스마트폰에 즉시 저장됩니다.
                </div>

                <img
                  src={imageModalData.dataUrl}
                  alt="견적서 사진"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                    border: '1px solid #334155'
                  }}
                />
              </div>

              {/* 모달 액션 버튼들 */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  padding: '0.85rem 1.25rem',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end'
                }}
              >
                {typeof navigator !== 'undefined' &&
                  navigator.canShare &&
                  imageModalData.file &&
                  navigator.canShare({ files: [imageModalData.file] }) && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.share({
                            files: [imageModalData.file],
                            title: `JCC 맞춤 견적서 (${imageModalData.customer} 고객님)`,
                            text: `[JCC 진센조] ${imageModalData.customer} 고객님 맞춤 가전 혜택 견적서입니다.`
                          });
                        } catch (_) {}
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        color: '#ffffff',
                        padding: '0.6rem 1.1rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Share2 size={15} /> 카카오톡 / 앱으로 공유
                    </button>
                  )}

                <a
                  href={imageModalData.dataUrl}
                  download={imageModalData.filename}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.45)',
                    color: '#93c5fd',
                    padding: '0.6rem 1.1rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Download size={15} /> 파일 다운로드
                </a>

                <button
                  type="button"
                  onClick={() => setImageModalData(null)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#cbd5e1',
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
        {/* 직원 전용 캐셔 POS 결제 및 사은행사 지시서 모달 */}
        {renderPosCashierModal()}
      </section>
    );
  }

  // ============================================================================
  // 삼성카드 실적 유효성 검사 및 견적서 화면('result') 이동 공통 핸들러
  // ============================================================================
  const handleGoToResult = () => {
    for (let cardIdx = 0; cardIdx < effectiveCards.length; cardIdx++) {
      const c = effectiveCards[cardIdx];
      const isSamsung = checkIsSamsungCard(c.cardName);
      if (!isSamsung) continue;

      if (isSingleCardMode && isMultiPeriod) {
        for (let sIdx = 0; sIdx < subSegments.length; sIdx++) {
          const seg = subSegments[sIdx];
          if (seg.baseMonthly < 70000) {
            const segSpend = subSegmentSpendOverrides[seg.endMonth] !== undefined
              ? subSegmentSpendOverrides[seg.endMonth]
              : (sIdx === 0 ? c.minSpend : '30만');
            const segCard = Number(seg.targetCard) || 0;
            if (isSpend70kOrMore(segSpend) || segCard > 16000) {
              alert(`[삼성카드 실적 제한 오류]\n${sIdx === 0 ? '① 1구간' : '② 2구간'} 약정 월 구독료가 7만원 미만(${formatWon(seg.baseMonthly)})이므로 70만원 실적(26,000원 할인)을 적용할 수 없습니다.\n해당 구간 필요 실적을 30만원(16,000원 할인)으로 변경 후 다시 시도해주세요.`);
              return;
            }
          }
        }
      } else {
        const availableModels = isMixedMode ? mixedSubItems : activePlans;
        const totalModelsCount = availableModels.length;
        const selectedIndices = getCardSelectedIndices(c, cardIdx, totalModelsCount, isSingleCardMode);
        const selectedItems = selectedIndices.map((i) => availableModels[i]).filter(Boolean);
        const pFee = isMixedMode
          ? selectedItems.reduce((sum, item) => sum + getItemMonthly(item) * getSubQty(item.quantity), 0)
          : selectedItems.reduce((sum, item) => sum + (item.rowMonthly || 0), 0);

        if (pFee < 70000) {
          if (isSpend70kOrMore(c.minSpend) || (Number(c.monthly) || 0) > 16000) {
            alert(`[삼성카드 실적 제한 오류]\n제휴카드 ${cardIdx + 1}번의 적용 구독 모델 월 구독료가 7만원 미만(${formatWon(pFee)})이므로 70만원 실적(26,000원 할인)을 적용할 수 없습니다.\n30만원 실적(16,000원 할인)으로 변경 후 다시 시도해주세요.`);
            return;
          }
        }
      }
    }

    setStep('result');
    window.scrollTo(0, 0);
  };

  // ============================================================================
  // 3. 혜택 조건 입력 화면 ('input')
  // ============================================================================
  return (
    <section className="container" style={{ paddingTop: '1.5rem', paddingBottom: '6rem', maxWidth: '1140px' }}>
      {/* 계산기 카테고리 전환 상단 탭 바 */}
      {renderModeTabs()}

      {/* 상단 내비게이션 & 잠금 버튼 & 견적서 출력 바로가기 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        {onBack ? (
          <button onClick={onBack} className="btn-back" style={{ marginBottom: 0 }}>
            <span>←</span> 홈으로 돌아가기
          </button>
        ) : (
          <div />
        )}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleGoToResult}
            className="btn-primary"
            title="현재 입력된 조건으로 A4 인쇄 / PDF 견적서를 확인합니다."
            style={{
              background: isMixedMode
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #d4af37, #b8860b)',
              color: '#ffffff',
              border: 'none',
              padding: '0.55rem 1.15rem',
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: '0.86rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: isMixedMode
                ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                : '0 4px 14px rgba(212, 175, 55, 0.35)'
            }}
          >
            <Printer size={15} /> {isMixedMode ? '스마트 견적서 보기 (A4 출력)' : '비교 결과 보기 (A4 출력)'}
          </button>
          <button
            type="button"
            onClick={handleSaveNewQuote}
            title="현재 입력된 견적을 보관함에 새로 저장합니다."
            style={{
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.55)',
              color: '#6ee7b7',
              padding: '0.55rem 0.95rem',
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Save size={15} /> 견적 저장
          </button>
          <button
            type="button"
            onClick={handleOverwriteActiveQuote}
            title={activeQuoteId ? '현재 선택된 보관 견적에 수정사항을 덮어씁니다.' : '보관 견적에 덮어쓰거나 수정 저장합니다.'}
            style={{
              background: activeQuoteId ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: activeQuoteId ? '1px solid var(--accent-gold)' : '1px solid var(--glass-border)',
              color: activeQuoteId ? 'var(--accent-gold-light)' : '#e2e8f0',
              padding: '0.55rem 0.95rem',
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <RotateCcw size={14} /> 덮어쓰기
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              padding: '0.55rem 1rem',
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <RotateCcw size={15} /> 초기화
          </button>
          <button
            type="button"
            onClick={handleLock}
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '0.55rem 1rem',
              borderRadius: '50px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Lock size={15} /> 잠금
          </button>
        </div>
      </div>

      {/* 타이틀 영역 */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 1rem',
            borderRadius: '100px',
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid var(--accent-gold)',
            color: 'var(--accent-gold-light)',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '0.75rem'
          }}
        >
          <Calculator size={15} /> JCC SMART BENEFIT CALCULATOR
        </div>
        <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          {isMixedMode ? (
            <>
              <span className="text-gradient">삼성 AI 가전</span> 스마트 견적기
            </>
          ) : (
            <>
              일반구매 vs <span className="text-gradient">삼성AI구독</span> 혜택 계산기
            </>
          )}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          고객 맞춤 상담을 위한 혜택 금액을 입력해 주세요. (숫자 입력 시 원 단위 금액이 자동 포맷됩니다)
        </p>
      </div>

      {/* 0) 견적 보관함 (저장 · 1클릭 불러오기 · 파일 백업/이동) */}
      <div
        className="glass-panel calc-no-hover"
        style={{
          padding: '1.25rem 1.4rem',
          marginBottom: '1.5rem',
          borderTop: '3px solid #10b981',
          background: 'rgba(15, 23, 42, 0.78)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.6rem',
            marginBottom: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderOpen size={19} style={{ color: '#34d399' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#a7f3d0', margin: 0 }}>
              {isMixedMode ? '2번 견적 보관함 (구독 포함 전용)' : '1번 견적 보관함 (구독 비교 전용)'}
            </h3>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.16rem 0.55rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.16)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#6ee7b7'
              }}
            >
              보관 {savedQuotes.length}건
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleExportQuoteFile}
              title={
                isMixedMode
                  ? "현재 입력된 2번 견적과 보관함 목록을 파일(.json)로 저장하여 다른 PC로 옮길 수 있습니다."
                  : "현재 입력된 1번 견적과 보관함 목록을 파일(.json)로 저장하여 다른 PC로 옮길 수 있습니다."
              }
              style={{
                background: 'rgba(59, 130, 246, 0.14)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#93c5fd',
                borderRadius: '8px',
                padding: '0.42rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Download size={14} /> {isMixedMode ? '2번 견적 파일로 내보내기 (.json)' : '1번 견적 파일로 내보내기 (.json)'}
            </button>
            <label
              title={isMixedMode ? "저장해둔 2번 견적 파일(.json)을 불러옵니다." : "저장해둔 1번 견적 파일(.json)을 불러옵니다."}
              style={{
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid var(--glass-border)',
                color: '#e2e8f0',
                borderRadius: '8px',
                padding: '0.42rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                margin: 0
              }}
            >
              <Upload size={14} /> {isMixedMode ? '2번 견적 파일 불러오기' : '1번 견적 파일 불러오기'}
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportQuoteFile}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* 현재 견적 저장 입력줄 */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            value={quoteTitleInput}
            onChange={(e) => setQuoteTitleInput(e.target.value)}
            placeholder="저장할 견적 이름 (비워두면 '고객성함 · 품목요약'으로 자동 저장됩니다)"
            style={{
              ...textInputStyle,
              flex: '1 1 260px',
              padding: '0.6rem 0.85rem',
              fontSize: '0.9rem'
            }}
          />
          <button
            type="button"
            onClick={handleSaveNewQuote}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: 'white',
              borderRadius: '10px',
              padding: '0.62rem 1.05rem',
              fontSize: '0.86rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.38rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Save size={15} /> 현재 견적 새로 저장
          </button>
          {activeQuoteId && (
            <button
              type="button"
              onClick={handleOverwriteActiveQuote}
              style={{
                background: 'rgba(212, 175, 55, 0.18)',
                border: '1px solid var(--accent-gold)',
                color: 'var(--accent-gold-light)',
                borderRadius: '10px',
                padding: '0.62rem 0.95rem',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap'
              }}
            >
              <Save size={14} /> 선택 견적 덮어쓰기
            </button>
          )}
        </div>

        {saveNotice && (
          <div
            style={{
              marginTop: '0.65rem',
              padding: '0.48rem 0.8rem',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              fontSize: '0.82rem',
              fontWeight: 700
            }}
          >
            {saveNotice}
          </div>
        )}

        {/* 저장된 견적 목록 */}
        {savedQuotes.length > 0 ? (
          <div
            style={{
              marginTop: '0.85rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '0.55rem',
              maxHeight: '220px',
              overflowY: 'auto',
              paddingRight: '0.2rem'
            }}
          >
            {savedQuotes.map((q) => {
              const isSelected = q.id === activeQuoteId;
              return (
                <div
                  key={q.id}
                  className="saved-quote-item"
                  data-quote-title={q.title}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected
                      ? '1px solid rgba(16, 185, 129, 0.6)'
                      : '1px solid rgba(255, 255, 255, 0.09)'
                  }}
                >
                  <div
                    onClick={() => handleLoadQuote(q)}
                    style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                    title="클릭하여 이 견적 불러오기"
                  >
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: isSelected ? '#6ee7b7' : '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {isSelected ? '● ' : ''}
                      {q.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {q.savedAt} ·{' '}
                      {isMixedMode
                        ? `실체감가 ${formatWon(q.summary?.mixedGrandFinal || 0)}`
                        : `구독 체감 ${formatWon(q.summary?.subFinalPrice || 0)}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleLoadQuote(q)}
                      style={{
                        background: isSelected ? '#10b981' : 'rgba(59, 130, 246, 0.2)',
                        border: isSelected ? 'none' : '1px solid rgba(59, 130, 246, 0.45)',
                        color: isSelected ? '#06281e' : '#93c5fd',
                        borderRadius: '6px',
                        padding: '0.32rem 0.58rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {isSelected ? '적용중' : '불러오기'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuote(q.id, q.title)}
                      title="삭제"
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5',
                        borderRadius: '6px',
                        padding: '0.32rem 0.45rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            💡 자주 상담하는 패키지(예: 신혼 4대 가전, 입주 풀패키지)나 고객별 견적을 입력 후 <strong>[현재 견적 새로 저장]</strong>을 눌러두시면 언제든 1클릭으로 불러올 수 있습니다. 다른 PC로 옮길 때는 우측 상단 <strong>[견적 파일로 내보내기]</strong>를 사용하세요.
          </div>
        )}
      </div>

      {/* 1) 고객 및 상담 기본 정보 패널 */}
      <div className="glass-panel calc-no-hover" style={{ padding: '1.5rem', marginBottom: '1.75rem', borderTop: '3px solid var(--accent-gold)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-gold-light)' }}>
          <FileCheck2 size={19} /> 상담 및 출력 기본 정보
        </h3>

        {/* 행사 유형 선택 (혼수 · 입주 · 이사 · 일반) */}
        <div style={{ marginBottom: '1.25rem', padding: '1rem 1.15rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.35)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-gold-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={16} /> 행사 유형 선택 (혼수 · 입주 · 이사 · 일반)
            </span>
            <span style={{ fontSize: '0.78rem', color: '#93c5fd' }}>
              ※ 서류 증빙 조건은 아래 각 혜택 정책(캐시백·상품권·특별할인)에서 개별 체크합니다.
            </span>
          </div>

          {/* 행사 유형 4버튼 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '0.65rem' }}>
            {[
              { key: 'wedding', icon: '💍', label: '혼수 (웨딩)' },
              { key: 'moving_in', icon: '🏢', label: '입주' },
              { key: 'moving', icon: '🚚', label: '이사' },
              { key: 'normal', icon: '🛍️', label: '일반' }
            ].map((t) => {
              const active = mixedEventType === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setMixedEventType(t.key);
                    if (t.key === 'wedding') setConsultType('신혼·혼수가전 맞춤설계');
                    else if (t.key === 'moving_in') setConsultType('입주가전 맞춤설계');
                    else if (t.key === 'moving') setConsultType('이사·교체가전 맞춤설계');
                    else setConsultType('단품·패키지 비교견적');
                  }}
                  style={{
                    padding: '0.7rem 0.6rem',
                    borderRadius: '9px',
                    border: active ? '2px solid var(--accent-gold)' : '1px solid var(--glass-border)',
                    background: active ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.28), rgba(15, 23, 42, 0.85))' : 'rgba(15, 23, 42, 0.6)',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: active ? 800 : 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: '1.05rem' }}>{t.icon}</span> {t.label}
                </button>
              );
            })}
          </div>

          {/* 행사 안내 문구 */}
          <div style={{ fontSize: '0.8rem', color: '#93c5fd', background: 'rgba(30, 58, 138, 0.35)', padding: '0.5rem 0.85rem', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '1rem' }}>ℹ️</span>
            <span>
              <strong>{EVENT_TYPE_INFO[mixedEventType]?.title || '선택 유형'}</strong>: {EVENT_TYPE_INFO[mixedEventType]?.desc || ''}
              {hasAnyProofPolicy && (
                <span style={{ color: '#6ee7b7', fontWeight: 800, marginLeft: '6px' }}>
                  (현재 증빙 필요 정책 포함됨)
                </span>
              )}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>고객 성함</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="예: 홍길동 (미입력 시 '소중한 고객님')"
              style={textInputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>상담 일자</label>
            <input
              type="date"
              value={consultDate}
              onChange={(e) => setConsultDate(e.target.value)}
              style={textInputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>상담 구분</label>
            <select
              value={consultType}
              onChange={(e) => setConsultType(e.target.value)}
              style={{ ...textInputStyle, background: '#0f172a' }}
            >
              <option value="입주가전 맞춤설계">입주가전 맞춤설계</option>
              <option value="신혼·혼수가전 맞춤설계">신혼·혼수가전 맞춤설계</option>
              <option value="이사·교체가전 맞춤설계">이사·교체가전 맞춤설계</option>
              <option value="단품·패키지 비교견적">단품·패키지 비교견적</option>
              <option value="VIP 특별 혜택 설계">VIP 특별 혜택 설계</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>매니저 연락처 (출력 명함용·자동저장)</label>
            <input
              type="tel"
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
              placeholder="예: 010-0000-0000"
              style={textInputStyle}
            />
          </div>
        </div>
        {!isMixedMode && (
          <div style={{ marginTop: '1rem' }}>
            <label style={labelStyle}>상담 구성 품목 요약 (선택 입력 · 출력물 상단에 표시)</label>
            <input
              type="text"
              value={productSummary}
              onChange={(e) => setProductSummary(e.target.value)}
              placeholder="예: TV 85인치 + 비스포크 AI 냉장고 + 김치냉장고 + 비스포크 AI 콤보 + 무풍에어컨"
              style={textInputStyle}
            />
          </div>
        )}
      </div>

      {/* 2) 결제 조건 입력 영역 (복합 모드: 단일 수직 배치 [상단 구독 -> 중간 일반 -> 하단 통합캐시백] / 비교 모드: 좌우 1:1 그리드) */}
      <div
        style={
          isMixedMode
            ? { display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.75rem' }
            : { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }
        }
      >
        {/* ==================== 일반구매 조건 카드 ==================== */}
        {isMixedMode ? (
          <div
            className="glass-panel calc-no-hover"
            style={{
              padding: '1.6rem',
              borderTop: '4px solid var(--accent-gold)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              order: 2
            }}
          >
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '1px' }}>PART 2 · 일반구매 모델</span>
                <h3 style={{ fontSize: '1.38rem', fontWeight: 800 }}>🛍️ 2. 일반구매 모델 &amp; 결제 조건</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  일시불 또는 제휴카드 무이자 할부로 진행할 품목을 입력하세요. 품목은 계속 추가할 수 있습니다.
                </p>
              </div>

              {/* 품목 목록: 모델명 · 수량 · 기준금액 · 할인된 금액 */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ ...labelStyle, fontSize: '0.93rem', color: 'white' }}>
                  일반구매 모델 목록 (모델명 · 수량 · 기준금액 · 할인된 금액)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {mixedLumpItems.map((item, idx) => {
                    const { qty, unitPrice, unitNetPrice, unitDiscount, gross, totalDiscount, net } = getMixedLumpItemCalc(item);

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(212, 175, 55, 0.28)',
                          borderRadius: '10px',
                          padding: '0.75rem 0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.55rem'
                        }}
                      >
                        {/* 1행: 번호 + 모델명 + 수량 + 삭제 버튼 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              background: 'rgba(212, 175, 55, 0.18)',
                              border: '1px solid rgba(212, 175, 55, 0.45)',
                              color: 'var(--accent-gold-light)',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              flexShrink: 0
                            }}
                          >
                            일반 {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleUpdateMixedLumpItem(item.id, 'name', e.target.value)}
                            placeholder="모델명 입력 (예: 비스포크 4도어 냉장고 RF85DB90F1AP)"
                            style={{ ...textInputStyle, padding: '0.45rem 0.65rem', fontSize: '0.86rem', flex: 1 }}
                          />
                          <div style={{ width: '75px', flexShrink: 0, position: 'relative' }}>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.quantity !== undefined ? item.quantity : 1}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                handleUpdateMixedLumpItem(item.id, 'quantity', raw === '' ? '' : parseInt(raw, 10));
                              }}
                              placeholder="1"
                              style={{ ...textInputStyle, padding: '0.45rem 1.4rem 0.45rem 0.45rem', fontSize: '0.86rem', textAlign: 'right' }}
                            />
                            <span style={{ position: 'absolute', right: '0.45rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.76rem', pointerEvents: 'none' }}>
                              대
                            </span>
                          </div>
                          {mixedLumpItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMixedLumpItem(item.id)}
                              title="이 모델 삭제"
                              style={{
                                width: '28px',
                                height: '28px',
                                padding: 0,
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#fca5a5',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* 2행: 기준금액 + 할인된 금액 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', alignItems: 'end' }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', color: '#fde68a', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                              기준금액 (1대 기준)
                            </label>
                            <MoneyInput
                              value={item.price}
                              onChange={(val) => handleUpdateMixedLumpItem(item.id, 'price', val)}
                              placeholder="기준금액"
                              compact
                              accentColor="#fcd34d"
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                              할인된 금액 (1대 기준)
                            </label>
                            <MoneyInput
                              value={item.discountedPrice || 0}
                              onChange={(val) => handleUpdateMixedLumpItem(item.id, 'discountedPrice', val)}
                              placeholder="할인된 금액 (할인가)"
                              compact
                              accentColor="#60a5fa"
                            />
                          </div>
                        </div>

                        {/* 3행: 개별 모델 실시간 산출 피드백 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#cbd5e1', paddingTop: '0.2rem', borderTop: '1px dashed rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '0.3rem' }}>
                          <span>
                            기준총액: <strong style={{ color: '#fde68a' }}>{formatWon(gross)}</strong>
                            {qty > 1 && ` (대당 ${formatWon(unitPrice)} × ${qty}대)`}
                          </span>
                          <span>
                            할인적용가: <strong style={{ color: 'var(--accent-gold-light)' }}>{formatWon(net)}</strong>
                            {totalDiscount > 0 && (
                              <span style={{ color: '#fca5a5', marginLeft: '4px' }}>
                                (-{formatWon(totalDiscount)} 할인{qty > 1 ? ` · 대당 -${formatWon(unitDiscount)}` : ''})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleAddMixedLumpItem}
                  style={{
                    marginTop: '0.55rem',
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px dashed rgba(212, 175, 55, 0.55)',
                    background: 'rgba(212, 175, 55, 0.08)',
                    color: 'var(--accent-gold-light)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Plus size={14} /> 일반구매 모델 추가
                </button>
              </div>

              {/* 특정 조건 할인: 백화점 OR 로드샵 결제조건 선택 및 각각의 할인 반영 */}
              <div
                style={{
                  marginTop: '0.9rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1.5px solid rgba(212, 175, 55, 0.45)'
                }}
              >
                {/* 상단: 채널 선택 헤더 및 토글 버튼 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.92rem', color: 'var(--accent-gold-light)', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0, fontWeight: 800 }}>
                      <Award size={15} style={{ color: 'var(--accent-gold)' }} /> 일반구매 특정 조건 할인 (백화점 OR 로드샵)
                    </label>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      직원이 두 채널의 조건을 모두 확인하고 선택할 수 있으며, <strong style={{ color: '#fde68a' }}>선택된 채널의 결제조건 할인만 견적서에 반영</strong>됩니다.
                    </span>
                  </div>

                  {/* 백화점 vs 로드샵 전환 탭 */}
                  <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.95)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(212, 175, 55, 0.5)' }}>
                    <button
                      type="button"
                      onClick={() => setMixedChannelType('dept')}
                      style={{
                        padding: '0.42rem 0.95rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: mixedChannelType === 'dept' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'transparent',
                        color: mixedChannelType === 'dept' ? 'white' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>🏬 갤러리아 백화점</span>
                      {mixedChannelType === 'dept' && (
                        <span style={{ fontSize: '0.68rem', background: 'rgba(0,0,0,0.35)', padding: '1px 5px', borderRadius: '4px', color: '#fde68a' }}>
                          반영 중
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMixedChannelType('road')}
                      style={{
                        padding: '0.42rem 0.95rem',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        background: mixedChannelType === 'road' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                        color: mixedChannelType === 'road' ? 'white' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>🏪 진주본점</span>
                      {mixedChannelType === 'road' && (
                        <span style={{ fontSize: '0.68rem', background: 'rgba(0,0,0,0.35)', padding: '1px 5px', borderRadius: '4px', color: '#93c5fd' }}>
                          반영 중
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 🏬 갤러리아 백화점 스마트 정산 & 결제 설계기 (직원 전용) */}
                <div
                  style={{
                    marginBottom: '1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(212, 175, 55, 0.45)',
                    background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                  }}
                >
                  {/* 접기/펼치기 헤더 */}
                  <div
                    onClick={() => setDeptCalcOpen(!deptCalcOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.15rem',
                      background: 'rgba(212, 175, 55, 0.12)',
                      cursor: 'pointer',
                      borderBottom: deptCalcOpen ? '1px solid rgba(212, 175, 55, 0.25)' : 'none',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calculator size={18} color="#f59e0b" />
                        <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#fde68a' }}>
                          🏬 갤러리아 백화점 스마트 정산 & 결제 설계기
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#b45309', color: '#fff', padding: '2px 7px', borderRadius: '4px' }}>
                          직원 전용
                        </span>
                      </div>
                      <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                        마지노선 방어 · 사은행사(11%/10%) 극대화 · 1인 3분할 & 2인 카드 슬라이더
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '3px 9px', borderRadius: '6px' }}>
                        {deptCalcOpen ? '▲ 접기' : '▼ 설계기 열기'}
                      </span>
                    </div>
                  </div>

                  {/* 펼쳐졌을 때의 계산기 바디 */}
                  {deptCalcOpen && (
                    <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* 1. 기준 결제 대상 금액 설정 */}
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>
                            1. 결제 대상 기준금액 설정
                          </span>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => setDeptCustomGross(null)}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '5px',
                                border: 'none',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: deptCustomGross === null ? '#0284c7' : 'rgba(255,255,255,0.08)',
                                color: deptCustomGross === null ? '#fff' : '#94a3b8'
                              }}
                            >
                              견적 품목 합계 ({formatWon(mixedLumpNet)}) 연동
                            </button>
                            <button
                              type="button"
                              onClick={() => { if (deptCustomGross === null) setDeptCustomGross(mixedLumpNet || 26008000); }}
                              style={{
                                padding: '3px 8px',
                                borderRadius: '5px',
                                border: 'none',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                background: deptCustomGross !== null ? '#0284c7' : 'rgba(255,255,255,0.08)',
                                color: deptCustomGross !== null ? '#fff' : '#94a3b8'
                              }}
                            >
                              수기 직접입력
                            </button>
                          </div>
                        </div>

                        {deptCustomGross !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                              <MoneyInput
                                value={deptCustomGross}
                                onChange={setDeptCustomGross}
                                placeholder="정산할 가전 결제 금액 입력 (예: 26,008,000)"
                                compact
                                accentColor="#38bdf8"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setDeptCustomGross(26008000)}
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid #38bdf8', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', cursor: 'pointer', fontWeight: 700 }}
                            >
                              예시 2,600.8만
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.86rem', color: '#93c5fd', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span>현재 가전 견적금액:</span>
                            <strong style={{ fontSize: '1.15rem', color: '#f8fafc' }}>{formatWon(mixedLumpNet)}</strong>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>(상단 일반구매 할인적용 합계와 실시간 동기화)</span>
                          </div>
                        )}

                        {/* 자급제폰 결제 체크박스 & 수수료 바코드 분리 안내 */}
                        <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={deptHasPhone}
                              onChange={(e) => setDeptHasPhone(e.target.checked)}
                              style={{ accentColor: '#10b981', width: '14px', height: '14px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: deptHasPhone ? '#6ee7b7' : '#cbd5e1' }}>
                              📱 자급제폰 결제 포함 (100만당 G캐시 40,000P 추가 적립)
                            </span>
                          </label>

                          {deptHasPhone && (
                            <div style={{ width: '220px' }}>
                              <MoneyInput
                                value={deptPhoneAmount}
                                onChange={setDeptPhoneAmount}
                                placeholder="자급제폰 결제액"
                                compact
                                accentColor="#10b981"
                              />
                            </div>
                          )}
                        </div>

                        {/* 바코드 수수료 분리 상태 뱃지 */}
                        <div style={{ marginTop: '0.45rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ color: '#38bdf8', fontWeight: 800 }}>
                            🏬 가전 바코드 (끝자리 907 · 수수료 A) 연동
                          </span>
                          {deptHasPhone && Number(deptPhoneAmount) > 0 && (
                            <span style={{ color: '#34d399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                              + 📱 자급제 바코드 (끝자리 606 · 수수료 B) 분리 적용
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2. 설계 옵션 그리드 */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                        {/* A. 사은행사 우대율 선택 (직접입력 + 원터치 프리셋) */}
                        <div style={{ background: 'rgba(0,0,0,0.22)', padding: '0.75rem', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#fde68a', marginBottom: '0.45rem' }}>
                            🎁 백화점 사은행사 우대율 (500만 이상)
                          </label>
                          {/* 직접 퍼센트 입력창 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.45rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="30"
                                value={deptRewardRate}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setDeptRewardRate(isNaN(val) ? 0 : Number(val.toFixed(2)));
                                }}
                                style={{
                                  width: '100%',
                                  background: 'rgba(15, 23, 42, 0.85)',
                                  border: '1.5px solid #f59e0b',
                                  borderRadius: '7px',
                                  padding: '0.45rem 1.6rem 0.45rem 0.65rem',
                                  color: '#fef08a',
                                  fontSize: '0.98rem',
                                  fontWeight: 800,
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                              <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b', fontWeight: 900, fontSize: '0.85rem' }}>
                                %
                              </span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              직접 입력 가능
                            </span>
                          </div>
                          {/* 빠른 원터치 프리셋 칩 */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.25rem' }}>
                            {[9.5, 10.0, 10.5, 11.0, 11.5].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setDeptRewardRate(rate)}
                                style={{
                                  padding: '0.4rem 0.15rem',
                                  borderRadius: '6px',
                                  border: Math.abs(deptRewardRate - rate) < 0.001 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                                  background: Math.abs(deptRewardRate - rate) < 0.001 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.03)',
                                  color: Math.abs(deptRewardRate - rate) < 0.001 ? '#fde68a' : '#cbd5e1',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                {rate.toFixed(1)}%{rate === 11.0 ? ' 🔥' : ''}
                              </button>
                            ))}
                          </div>
                          <div style={{ fontSize: '0.67rem', color: '#94a3b8', marginTop: '0.45rem', lineHeight: 1.4 }}>
                            <div>• <strong>400만 이하</strong>: 기본 6.5% 사은행사 고정 적용 (300만: 19.5만 / 400만: 26만)</div>
                            <div>• ⏱️ <strong>유효기간</strong>: 기본 6.5%는 <strong>5년</strong> / 9.5% 이상 우대 추가분은 <strong>60일(2개월)</strong></div>
                          </div>
                        </div>

                        {/* B. 카드 인원 모드 */}
                        <div style={{ background: 'rgba(0,0,0,0.22)', padding: '0.75rem', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#93c5fd', marginBottom: '0.45rem' }}>
                            💳 카드 소지 인원 설정
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setDeptCardCount(1)}
                              style={{
                                padding: '0.45rem 0.5rem',
                                borderRadius: '6px',
                                border: deptCardCount === 1 ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                                background: deptCardCount === 1 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.03)',
                                color: deptCardCount === 1 ? '#38bdf8' : '#cbd5e1',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              👤 1인 카드 (최적 분할 비기)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeptCardCount(2)}
                              style={{
                                padding: '0.45rem 0.5rem',
                                borderRadius: '6px',
                                border: deptCardCount === 2 ? '2px solid #ec4899' : '1px solid rgba(255,255,255,0.1)',
                                background: deptCardCount === 2 ? 'rgba(236, 72, 153, 0.25)' : 'rgba(255,255,255,0.03)',
                                color: deptCardCount === 2 ? '#f472b6' : '#cbd5e1',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              👥 2인 2카드 (신랑+신부)
                            </button>
                          </div>
                          <div style={{ fontSize: '0.67rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                            {deptCardCount === 1 ? '2,000만 상한 초과 시 2,000만(21,884,000원) + 400만(4,124,000원) 신규구간 지능형 자동 분할' : '부부 2명이 각각 카드를 발급하여 둘 다 5% 청구할인 극대화'}
                          </div>
                        </div>

                        {/* C. 혜택 처리 전략 */}
                        <div style={{ background: 'rgba(0,0,0,0.22)', padding: '0.75rem', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#6ee7b7', marginBottom: '0.45rem' }}>
                            🎯 G캐시 혜택 수령 방식 (3대 시나리오 선택)
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setDeptStrategy('reward')}
                              style={{
                                padding: '0.45rem 0.35rem',
                                borderRadius: '6px',
                                border: deptStrategy === 'reward' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                                background: deptStrategy === 'reward' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.03)',
                                color: deptStrategy === 'reward' ? '#6ee7b7' : '#cbd5e1',
                                fontSize: '0.73rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textAlign: 'center'
                              }}
                            >
                              💰 1. 전부 적립 (체감가 최저)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeptStrategy('partial')}
                              style={{
                                padding: '0.45rem 0.35rem',
                                borderRadius: '6px',
                                border: (deptStrategy === 'partial' || deptStrategy === 'instant') ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                                background: (deptStrategy === 'partial' || deptStrategy === 'instant') ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.03)',
                                color: (deptStrategy === 'partial' || deptStrategy === 'instant') ? '#7dd3fc' : '#cbd5e1',
                                fontSize: '0.73rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textAlign: 'center'
                              }}
                            >
                              🛡️ 2. 부분 차감 (마지노선 방어)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeptStrategy('full')}
                              style={{
                                padding: '0.45rem 0.35rem',
                                borderRadius: '6px',
                                border: deptStrategy === 'full' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                                background: deptStrategy === 'full' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.03)',
                                color: deptStrategy === 'full' ? '#fde68a' : '#cbd5e1',
                                fontSize: '0.73rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textAlign: 'center'
                              }}
                            >
                              ⚡ 3. 전부 차감 (G캐시 0원 올인)
                            </button>
                          </div>
                          <div style={{ fontSize: '0.67rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                            {deptStrategy === 'reward' && '💰 G캐시 100% 모바일 앱 적립 → 카드 원금 전체 청구할인 극대화로 실질 체감가 가장 저렴 (쇼핑 활용형)'}
                            {(deptStrategy === 'partial' || deptStrategy === 'instant') && '🛡️ 청구할인 마지노선(2,000만 등)을 완벽 방어하면서 가능한 여유분만 선차감 (안전 추천형)'}
                            {deptStrategy === 'full' && '⚡ G캐시를 1원도 남기지 않고(잔여 0원) 100% 현장에서 선차감하여 카드 승인금액 자체를 최소화 (카드값 절약형)'}
                          </div>
                        </div>
                      </div>

                      {/* 3. 2인 분할 슬라이더 (2인 모드 선택 시 활성화) */}
                      {deptCardCount === 2 && (
                        <div style={{ background: 'rgba(236, 72, 153, 0.08)', padding: '0.9rem', borderRadius: '10px', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Sliders size={16} color="#f472b6" />
                              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f472b6' }}>
                                👥 2인 카드 금액 배분 슬라이더 (신랑 {deptSplitSlider}% : 신부 {100 - deptSplitSlider}%)
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                              {[50, 60, 70, 80].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setDeptSplitSlider(preset)}
                                  style={{
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(244, 114, 182, 0.4)',
                                    background: deptSplitSlider === preset ? '#ec4899' : 'rgba(0,0,0,0.3)',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {preset}:{100 - preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          <input
                            type="range"
                            min="10"
                            max="90"
                            step="5"
                            value={deptSplitSlider}
                            onChange={(e) => setDeptSplitSlider(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer', height: '6px' }}
                          />

                          {/* 2인 카드 분할 결과 비교 카드 */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.65rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.65rem', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#93c5fd', fontWeight: 800, marginBottom: '0.3rem' }}>
                                <span>🤵 1번 카드 (신랑 - {deptSplitSlider}%)</span>
                                <span style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '1px 5px', borderRadius: '3px' }}>{deptEnginePlan.card1Tier}</span>
                              </div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.25rem' }}>
                                {formatWon(deptEnginePlan.card1Amount)}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                                청구할인: <strong style={{ color: '#fca5a5' }}>-{formatWon(deptEnginePlan.card1Discount)}</strong> | G캐시: <strong style={{ color: '#fde68a' }}>+{formatWon(deptEnginePlan.card1Gcash)}</strong>
                              </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.65rem', borderRadius: '8px', border: '1px solid rgba(244, 114, 182, 0.3)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#f472b6', fontWeight: 800, marginBottom: '0.3rem' }}>
                                <span>👰 2번 카드 (신부 - {100 - deptSplitSlider}%)</span>
                                <span style={{ background: 'rgba(244, 114, 182, 0.2)', padding: '1px 5px', borderRadius: '3px' }}>{deptEnginePlan.card2Tier}</span>
                              </div>
                              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc', marginBottom: '0.25rem' }}>
                                {formatWon(deptEnginePlan.card2Amount)}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                                청구할인: <strong style={{ color: '#fca5a5' }}>-{formatWon(deptEnginePlan.card2Discount)}</strong> | G캐시: <strong style={{ color: '#fde68a' }}>+{formatWon(deptEnginePlan.card2Gcash)}</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. 1인 3분할 비기 모드 안내 (2,000만 초과 시) */}
                      {deptCardCount === 1 && deptEnginePlan.mode === '1person_3split' && (
                        <div style={{ background: 'rgba(212, 175, 55, 0.08)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.35)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fde68a' }}>
                              {deptEnginePlan.step3BaseApproval > 0
                                ? '⚡ 1인 카드 3분할 결제 비기 작동 중 (2,000만 한도 초과 최적화)'
                                : `⚡ 1인 카드 2단계 최적 분할 (2,000만 + ${deptEnginePlan.step2Label || '400만'} 신규구간 완벽 매칭)`}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: deptEnginePlan.safeDeduct > 0 ? '#67e8f9' : '#6ee7b7', fontWeight: 700 }}>
                              {deptEnginePlan.safeDeduct > 0 ? `✓ G캐시 ${formatWon(deptEnginePlan.safeDeduct)} 즉시 선차감 적용` : '✓ 사은행사 2차/3차 전액 수령'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.76rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                              <div style={{ color: '#93c5fd', fontWeight: 700, fontSize: '0.85rem' }}>
                                1차 제휴카드: {formatWon(deptEnginePlan.step1Approval)}
                              </div>
                              <div style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>
                                5% 청구할인 ({formatWon(deptEnginePlan.step1Discount)}) + {deptRewardRate}% 우대 G캐시 ({formatWon(deptEnginePlan.step1Gcash)})
                                {deptEnginePlan.deduct1 > 0 && (
                                  <div style={{ color: '#67e8f9', fontWeight: 700, marginTop: '2px' }}>
                                    └ 마지노선(2,105.3만) 사수: G캐시 -{formatWon(deptEnginePlan.deduct1)} 선차감
                                  </div>
                                )}
                              </div>
                            </div>
                            {deptEnginePlan.step2BaseApproval > 0 && (
                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                                <div style={{ color: '#fde68a', fontWeight: 700, fontSize: '0.85rem' }}>
                                  2차 제휴카드: {formatWon(deptEnginePlan.step2Approval)} ({deptEnginePlan.step2Label || '400만'} 구간)
                                </div>
                                <div style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>
                                  {deptEnginePlan.step2Discount > 0
                                    ? `3% 청구할인 (${formatWon(deptEnginePlan.step2Discount)})`
                                    : '청구할인 미적용 (300만 이하)'} + 6.5% 일반 G캐시 ({formatWon(deptEnginePlan.step2Gcash)})
                                </div>
                              </div>
                            )}
                            {deptEnginePlan.step3BaseApproval > 0 && (
                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                                <div style={{ color: deptEnginePlan.step3Approval === 0 ? '#94a3b8' : '#6ee7b7', fontWeight: 700, fontSize: '0.85rem' }}>
                                  3차 일반/타카드: {formatWon(deptEnginePlan.step3Approval)}
                                </div>
                                <div style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>
                                  {deptEnginePlan.deduct3 > 0 ? (
                                    <span style={{ color: '#67e8f9', fontWeight: 700 }}>
                                      └ G캐시 {formatWon(deptEnginePlan.deduct3)} 선차감 결제로 카드승인 0원 대체 완료!
                                    </span>
                                  ) : (
                                    `6.5% 일반 G캐시 (${formatWon(deptEnginePlan.step3Gcash)})`
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 선차감 시 총 카드 결제 승인액 요약 */}
                          {deptEnginePlan.safeDeduct > 0 && (
                            <div style={{ marginTop: '0.5rem', padding: '0.45rem 0.75rem', background: 'rgba(14, 165, 233, 0.15)', borderRadius: '6px', border: '1px solid rgba(14, 165, 233, 0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                              <span style={{ color: '#e0f2fe' }}>
                                ⚡ 총 선차감액: <strong style={{ color: '#38bdf8' }}>-{formatWon(deptEnginePlan.safeDeduct)}</strong> {deptEnginePlan.deduct3 > 0 ? `(1차 ${formatWon(deptEnginePlan.deduct1)} + 3차 ${formatWon(deptEnginePlan.deduct3)})` : `(1차 ${formatWon(deptEnginePlan.deduct1)})`}
                              </span>
                              <span style={{ color: '#fef08a' }}>
                                실제 고객 카드 결제 총액: <strong style={{ color: '#ffffff', fontSize: '0.92rem' }}>{formatWon(deptEnginePlan.cardApproval)}</strong>
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 5. 실시간 업셀링 코칭 배너 (Jump Tip) */}
                      {deptEnginePlan.jumpTip && (
                        <div
                          style={{
                            background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.22), rgba(249, 115, 22, 0.22))',
                            border: '1px solid rgba(234, 179, 8, 0.55)',
                            padding: '0.7rem 0.95rem',
                            borderRadius: '9px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.65rem'
                          }}
                        >
                          <span style={{ fontSize: '1.25rem' }}>💡</span>
                          <div style={{ fontSize: '0.8rem', color: '#fef08a', lineHeight: 1.4 }}>
                            <strong>[업셀링 골든 코칭]</strong>{' '}
                            {deptEnginePlan.jumpTip.message || (
                              <>
                                고객님께 소형 가전이나 소모품 <strong>+{formatWon(deptEnginePlan.jumpTip.needMore)}</strong>만 추가 제안하시면{' '}
                                <span style={{ textDecoration: 'underline', fontWeight: 800 }}>[{deptEnginePlan.jumpTip.nextLabel}]</span> 구간으로 동시 승급되어 사은행사 혜택이 폭증합니다!
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* ⚖️ 5-1. [적립] vs [선차감] 실시간 유불리 비교 분석 카드 */}
                      <div
                        style={{
                          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
                          padding: '1rem 1.1rem',
                          borderRadius: '11px',
                          border: '1px solid rgba(212, 175, 55, 0.38)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.25)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <Scale size={18} color="#f59e0b" />
                            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fde68a' }}>
                              ⚖️ [1.전부적립] vs [2.부분차감] vs [3.전부차감] 3대 시나리오 실시간 유불리 비교
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            ※ 원하시는 플랜 카드를 클릭하시면 해당 수령 방식으로 즉시 전환됩니다.
                          </span>
                        </div>

                        {/* 3열 나란한 비교 카드 (전부적립 vs 부분차감 vs 전부차감) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '0.75rem' }}>
                          {/* 1) 💰 1. 전부 적립 플랜 */}
                          <div
                            onClick={() => {
                              setDeptStrategy('reward');
                              setMixedDeptVoucherMode('reward');
                              if (deptEnginePlan.effectiveGross > 0) {
                                setMixedChannelType('dept');
                                const cDisc = deptEnginePlan.rewardPlan?.totalCardDiscount ?? deptEnginePlan.rewardCardDiscount ?? 0;
                                setMixedDeptCardDiscount(cDisc);
                                setMixedDeptDiscount(cDisc);
                                setMixedDeptVoucherDiscount(deptEnginePlan.rewardPlan?.safeReward ?? deptEnginePlan.totalGcash ?? 0);
                              }
                            }}
                            style={{
                              background: deptStrategy === 'reward' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(0,0,0,0.28)',
                              border: deptStrategy === 'reward' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '9px',
                              padding: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#6ee7b7' }}>
                                    💰 1. 전부 적립 플랜
                                  </span>
                                  <span style={{ fontSize: '0.66rem', background: '#065f46', color: '#a7f3d0', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                    쇼핑 활용형 🔥
                                  </span>
                                </div>
                                {deptStrategy === 'reward' && (
                                  <span style={{ fontSize: '0.66rem', background: '#10b981', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                    ✓ 현재 선택됨
                                  </span>
                                )}
                              </div>

                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.6rem 0.75rem', borderRadius: '7px', marginBottom: '0.6rem', fontSize: '0.78rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#cbd5e1' }}>
                                  <span>카드 결제 승인 총액:</span>
                                  <strong style={{ color: '#ffffff' }}>{formatWon(deptEnginePlan.rewardPlan?.cardApproval || deptEnginePlan.effectiveGross)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#fde68a' }}>
                                  <span>G캐시 앱 적립 합계:</span>
                                  <strong style={{ color: '#fde68a' }}>+ {formatWon(deptEnginePlan.totalGcash)} (100% 지급)</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#fca5a5' }}>
                                  <span>제휴카드 청구할인:</span>
                                  <strong>- {formatWon(deptEnginePlan.rewardPlan?.totalCardDiscount || deptEnginePlan.rewardCardDiscount)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.35rem', borderTop: '1px dashed rgba(255,255,255,0.15)', color: '#6ee7b7', fontWeight: 800 }}>
                                  <span>고객 체감 최종가:</span>
                                  <strong style={{ fontSize: '0.96rem' }}>{formatWon(deptEnginePlan.rewardPlan?.finalPerceived || deptEnginePlan.rewardFinalPerceived)}</strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 2) 🛡️ 2. 부분 차감 플랜 (마지노선 방어) */}
                          <div
                            onClick={() => {
                              setDeptStrategy('partial');
                              setMixedDeptVoucherMode('partial');
                              if (deptEnginePlan.effectiveGross > 0) {
                                setMixedChannelType('dept');
                                const cDisc = deptEnginePlan.partialPlan?.totalCardDiscount ?? deptEnginePlan.instantCardDiscount ?? 0;
                                setMixedDeptCardDiscount(cDisc);
                                setMixedDeptDiscount(cDisc);
                                const deductAmt = deptEnginePlan.partialPlan?.safeDeduct ?? deptEnginePlan.instantSafeDeduct ?? 0;
                                setMixedDeptVoucherDiscount(deductAmt > 0 ? deductAmt : (deptEnginePlan.totalGcash ?? 0));
                              }
                            }}
                            style={{
                              background: (deptStrategy === 'partial' || deptStrategy === 'instant') ? 'rgba(56, 189, 248, 0.16)' : 'rgba(0,0,0,0.28)',
                              border: (deptStrategy === 'partial' || deptStrategy === 'instant') ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '9px',
                              padding: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#7dd3fc' }}>
                                    🛡️ 2. 부분 차감 플랜
                                  </span>
                                  <span style={{ fontSize: '0.66rem', background: '#0369a1', color: '#bae6fd', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                    안전 추천형 ⭐
                                  </span>
                                </div>
                                {(deptStrategy === 'partial' || deptStrategy === 'instant') && (
                                  <span style={{ fontSize: '0.66rem', background: '#0284c7', color: '#ffffff', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>
                                    ✓ 현재 선택됨
                                  </span>
                                )}
                              </div>

                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.6rem 0.75rem', borderRadius: '7px', marginBottom: '0.6rem', fontSize: '0.78rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#38bdf8' }}>
                                  <span style={{ fontWeight: 800 }}>실제 카드 승인 총액:</span>
                                  <strong style={{ color: '#67e8f9', fontSize: '0.88rem' }}>{formatWon(deptEnginePlan.partialPlan?.cardApproval || deptEnginePlan.instantCardApproval)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#34d399' }}>
                                  <span>현장 G캐시 부분 선차감:</span>
                                  <strong>- {formatWon(deptEnginePlan.partialPlan?.safeDeduct || deptEnginePlan.instantSafeDeduct)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#fca5a5' }}>
                                  <span>제휴카드 청구할인:</span>
                                  <strong>- {formatWon(deptEnginePlan.partialPlan?.totalCardDiscount || deptEnginePlan.instantCardDiscount)}</strong>
                                </div>
                                {(deptEnginePlan.partialPlan?.safeReward || deptEnginePlan.instantSafeReward) > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#fef08a', fontSize: '0.73rem' }}>
                                    <span>잔여 G캐시 앱 적립:</span>
                                    <strong>+ {formatWon(deptEnginePlan.partialPlan?.safeReward || deptEnginePlan.instantSafeReward)}</strong>
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.35rem', borderTop: '1px dashed rgba(255,255,255,0.15)', color: '#7dd3fc', fontWeight: 800 }}>
                                  <span>고객 체감 최종가:</span>
                                  <strong style={{ fontSize: '0.96rem' }}>{formatWon(deptEnginePlan.partialPlan?.finalPerceived || deptEnginePlan.instantFinalPerceived)}</strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 3) ⚡ 3. 전부 차감 플랜 (G캐시 0원 올인) */}
                          <div
                            onClick={() => {
                              setDeptStrategy('full');
                              setMixedDeptVoucherMode('full');
                              if (deptEnginePlan.effectiveGross > 0) {
                                setMixedChannelType('dept');
                                const cDisc = deptEnginePlan.fullPlan?.totalCardDiscount ?? 0;
                                setMixedDeptCardDiscount(cDisc);
                                setMixedDeptDiscount(cDisc);
                                setMixedDeptVoucherDiscount(deptEnginePlan.fullPlan?.safeDeduct ?? deptEnginePlan.totalGcash ?? 0);
                              }
                            }}
                            style={{
                              background: deptStrategy === 'full' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(0,0,0,0.28)',
                              border: deptStrategy === 'full' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '9px',
                              padding: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#fde68a' }}>
                                    ⚡ 3. 전부 차감 플랜
                                  </span>
                                  <span style={{ fontSize: '0.66rem', background: '#78350f', color: '#fde68a', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                    카드값 최소화형 💥
                                  </span>
                                </div>
                                {deptStrategy === 'full' && (
                                  <span style={{ fontSize: '0.66rem', background: '#f59e0b', color: '#0f172a', padding: '1px 6px', borderRadius: '4px', fontWeight: 900 }}>
                                    ✓ 현재 선택됨
                                  </span>
                                )}
                              </div>

                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.6rem 0.75rem', borderRadius: '7px', marginBottom: '0.6rem', fontSize: '0.78rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#fbbf24' }}>
                                  <span style={{ fontWeight: 800 }}>실제 카드 승인 총액:</span>
                                  <strong style={{ color: '#fef08a', fontSize: '0.88rem' }}>{formatWon(deptEnginePlan.fullPlan?.cardApproval)} (최저 승인액!)</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#fde68a' }}>
                                  <span>G캐시 발생 (결제금액 재판정):</span>
                                  <strong style={{ color: '#fde68a' }}>+ {formatWon(deptEnginePlan.fullPlan?.totalGcash)} (1차 2,000만 + 2차 {deptEnginePlan.fullPlan?.step2Label || '200만'})</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#34d399' }}>
                                  <span>현장 G캐시 전액 선차감:</span>
                                  <strong>- {formatWon(deptEnginePlan.fullPlan?.safeDeduct)} (100% 올인 차감)</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#fca5a5' }}>
                                  <span>제휴카드 청구할인:</span>
                                  <strong>- {formatWon(deptEnginePlan.fullPlan?.totalCardDiscount)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#94a3b8', fontSize: '0.73rem' }}>
                                  <span>잔여 G캐시 앱 적립:</span>
                                  <strong style={{ color: '#cbd5e1' }}>0원 (남김없이 올인 차감)</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.35rem', borderTop: '1px dashed rgba(255,255,255,0.15)', color: '#fde68a', fontWeight: 800 }}>
                                  <span>고객 체감 최종가:</span>
                                  <strong style={{ fontSize: '0.96rem' }}>{formatWon(deptEnginePlan.fullPlan?.finalPerceived)}</strong>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 1, 2, 3 플랜 최종가 및 차액 한눈에 비교 (설명 없이 금액과 차액만 집중) */}
                        <div style={{ marginTop: '0.75rem', padding: '0.8rem 1rem', background: 'rgba(15, 23, 42, 0.85)', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.35)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                            {/* 1번 플랜 최종가 */}
                            <div style={{ background: 'rgba(6, 95, 70, 0.25)', border: '1px solid #10b981', borderRadius: '8px', padding: '0.75rem 0.9rem' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#a7f3d0', marginBottom: '0.35rem' }}>
                                💰 1번 전부적립 최종가
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#6ee7b7' }}>
                                  {formatWon(deptEnginePlan.rewardPlan?.finalPerceived || deptEnginePlan.rewardFinalPerceived)}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                                  기준
                                </span>
                              </div>
                              <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#cbd5e1' }}>
                                <span>승인액: <strong>{formatWon(deptEnginePlan.rewardPlan?.cardApproval || deptEnginePlan.rewardCardApproval)}</strong></span>
                              </div>
                            </div>

                            {/* 2번 플랜 최종가 */}
                            <div style={{ background: 'rgba(3, 105, 161, 0.25)', border: '1px solid #38bdf8', borderRadius: '8px', padding: '0.75rem 0.9rem' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#bae6fd', marginBottom: '0.35rem' }}>
                                🛡️ 2번 부분차감 최종가
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>
                                  {formatWon(deptEnginePlan.partialPlan?.finalPerceived || deptEnginePlan.instantFinalPerceived)}
                                </span>
                                {(() => {
                                  const diff = (deptEnginePlan.partialPlan?.finalPerceived || deptEnginePlan.instantFinalPerceived) - (deptEnginePlan.rewardPlan?.finalPerceived || deptEnginePlan.rewardFinalPerceived);
                                  return (
                                    <span style={{ fontSize: '0.82rem', fontWeight: 900, padding: '2px 7px', borderRadius: '4px', background: diff >= 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)', color: diff >= 0 ? '#fca5a5' : '#6ee7b7' }}>
                                      {diff >= 0 ? `+${formatWon(diff)}` : `-${formatWon(Math.abs(diff))}`}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                                <span>승인액: <strong>{formatWon(deptEnginePlan.partialPlan?.cardApproval || deptEnginePlan.instantCardApproval)}</strong></span>
                                <span style={{ color: '#38bdf8', fontWeight: 800 }}>
                                  (-{formatWon((deptEnginePlan.rewardPlan?.cardApproval || deptEnginePlan.rewardCardApproval) - (deptEnginePlan.partialPlan?.cardApproval || deptEnginePlan.instantCardApproval))})
                                </span>
                              </div>
                            </div>

                            {/* 3번 플랜 최종가 */}
                            <div style={{ background: 'rgba(120, 53, 15, 0.25)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '0.75rem 0.9rem' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fde68a', marginBottom: '0.35rem' }}>
                                ⚡ 3번 전부차감 최종가
                              </div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fbbf24' }}>
                                  {formatWon(deptEnginePlan.fullPlan?.finalPerceived)}
                                </span>
                                {(() => {
                                  const diff = deptEnginePlan.fullPlan?.finalPerceived - (deptEnginePlan.rewardPlan?.finalPerceived || deptEnginePlan.rewardFinalPerceived);
                                  return (
                                    <span style={{ fontSize: '0.82rem', fontWeight: 900, padding: '2px 7px', borderRadius: '4px', background: diff >= 0 ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)', color: diff >= 0 ? '#fca5a5' : '#6ee7b7' }}>
                                      {diff >= 0 ? `+${formatWon(diff)}` : `-${formatWon(Math.abs(diff))}`}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div style={{ marginTop: '0.35rem', paddingTop: '0.35rem', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.75rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                                <span>승인액: <strong>{formatWon(deptEnginePlan.fullPlan?.cardApproval)}</strong></span>
                                <span style={{ color: '#fbbf24', fontWeight: 800 }}>
                                  (-{formatWon((deptEnginePlan.rewardPlan?.cardApproval || deptEnginePlan.rewardCardApproval) - deptEnginePlan.fullPlan?.cardApproval)})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 6. 종합 혜택 요약 & 2대 핵심 실행 버튼 */}
                      <div
                        style={{
                          background: 'rgba(15, 23, 42, 0.9)',
                          padding: '0.95rem 1.15rem',
                          borderRadius: '10px',
                          border: '1px solid rgba(212, 175, 55, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '0.85rem'
                        }}
                      >
                        {deptEnginePlan.safeDeduct > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: deptStrategy === 'full' ? '#f59e0b' : '#38bdf8', fontWeight: 800 }}>
                              {deptStrategy === 'full' ? '⚡ 전액 선차감(올인):' : '🛡️ 부분 선차감(방어):'}
                            </span>
                            <span style={{ fontSize: '0.84rem', color: '#93c5fd' }}>
                              실제 카드승인액 <strong style={{ color: '#38bdf8', fontSize: '1.05rem', fontWeight: 900 }}>{formatWon(deptEnginePlan.cardApproval)}</strong>
                              <span style={{ fontSize: '0.72rem', color: '#a7f3d0', marginLeft: '4px' }}>(G캐시 -{formatWon(deptEnginePlan.safeDeduct)} 즉시차감)</span>
                            </span>
                            <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>|</span>
                            <span style={{ fontSize: '0.82rem', color: '#fca5a5' }}>
                              청구할인 <strong style={{ color: '#fca5a5' }}>-{formatWon(deptEnginePlan.totalCardDiscount)}</strong>
                            </span>
                            {deptEnginePlan.safeReward > 0 ? (
                              <>
                                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>|</span>
                                <span style={{ fontSize: '0.82rem', color: '#fde68a' }}>
                                  잔여 G캐시 적립 <strong style={{ color: '#fde68a' }}>+{formatWon(deptEnginePlan.safeReward)}</strong>
                                </span>
                              </>
                            ) : (
                              <>
                                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>|</span>
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                  잔여 G캐시 <strong style={{ color: '#cbd5e1' }}>0원 (올인 차감)</strong>
                                </span>
                              </>
                            )}
                            <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>=</span>
                            <span style={{ fontSize: '0.92rem', color: 'var(--accent-gold-light)', fontWeight: 900 }}>
                              최종 체감가 {formatWon(deptEnginePlan.finalPerceived)}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>설계 산출 혜택:</span>
                            <span style={{ fontSize: '0.82rem', color: '#93c5fd' }}>
                              제휴카드 청구할인 <strong style={{ color: '#fca5a5', fontSize: '0.98rem' }}>-{formatWon(deptEnginePlan.totalCardDiscount)}</strong>
                            </span>
                            <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>+</span>
                            <span style={{ fontSize: '0.82rem', color: '#fde68a' }}>
                              백화점 G캐시 증정 <strong style={{ color: '#fde68a', fontSize: '0.98rem' }}>+{formatWon(deptEnginePlan.totalGcash)}</strong>
                              <span style={{ fontSize: '0.72rem', color: '#fef3c7', marginLeft: '6px', background: 'rgba(217, 119, 6, 0.35)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                                5년: {formatWon(deptEnginePlan.gcash5Year)}{deptEnginePlan.gcash60Day > 0 ? ` / 60일: ${formatWon(deptEnginePlan.gcash60Day)}` : ''}
                              </span>
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#cbd5e1', marginLeft: '0.2rem' }}>=</span>
                            <span style={{ fontSize: '0.92rem', color: 'var(--accent-gold-light)', fontWeight: 900 }}>
                              총 혜택 {formatWon(deptEnginePlan.totalCardDiscount + deptEnginePlan.totalGcash)}
                            </span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={handleApplyDeptEnginePlan}
                            style={{
                              padding: '0.6rem 1.1rem',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #d97706, #b45309)',
                              color: '#fff',
                              fontSize: '0.84rem',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)'
                            }}
                          >
                            <CheckCircle2 size={16} />
                            견적서에 자동 반영 (고객용 심플 견적)
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowPosCashierModal(true)}
                            style={{
                              padding: '0.6rem 1.1rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(56, 189, 248, 0.5)',
                              background: 'rgba(14, 165, 233, 0.18)',
                              color: '#38bdf8',
                              fontSize: '0.84rem',
                              fontWeight: 900,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem'
                            }}
                          >
                            <Receipt size={16} />
                            🖨️ 캐셔 POS 결제 지시서 출력
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 본문: 직원이 볼 수 있는 백화점 & 로드샵 2분할 조건 카드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {/* 카드 1: 백화점 결제조건 */}
                  <div
                    onClick={() => setMixedChannelType('dept')}
                    style={{
                      borderRadius: '10px',
                      padding: '0.85rem 0.95rem',
                      cursor: 'pointer',
                      background: mixedChannelType === 'dept' ? 'rgba(212, 175, 55, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      border: mixedChannelType === 'dept' ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: mixedChannelType === 'dept' ? '0 0 16px rgba(245, 158, 11, 0.2)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fde68a' }}>🏬 갤러리아 백화점 조건</span>
                        {mixedChannelType === 'dept' ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#b45309', color: 'white', padding: '1px 6px', borderRadius: '4px' }}>
                            ✓ 견적 반영
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>
                            클릭 시 전환
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 구조 1: 청구할인 */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: 'rgba(0,0,0,0.22)',
                        padding: '0.55rem 0.65rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.73rem', color: '#fde68a', fontWeight: 800 }}>
                          ① 제휴카드 청구할인
                        </label>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={mixedDeptDiscountProof}
                            onChange={(e) => setMixedDeptDiscountProof(e.target.checked)}
                            style={{ accentColor: '#10b981', cursor: 'pointer', width: '13px', height: '13px' }}
                          />
                          <span style={{ fontSize: '0.71rem', fontWeight: 700, color: mixedDeptDiscountProof ? '#6ee7b7' : '#94a3b8' }}>
                            제휴카드
                          </span>
                        </label>
                      </div>
                      <MoneyInput
                        value={mixedDeptCardDiscount}
                        onChange={(val) => {
                          setMixedDeptCardDiscount(val);
                          setMixedDeptDiscount(val);
                        }}
                        placeholder="청구할인 금액"
                        compact
                        accentColor="#fcd34d"
                      />
                    </div>

                    {/* 구조 2: 상품권(G캐시) */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: 'rgba(0,0,0,0.22)',
                        padding: '0.55rem 0.65rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.73rem', color: '#fde68a', fontWeight: 800 }}>
                          ② 상품권 (G캐시)
                        </label>
                        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setMixedDeptVoucherMode('instant');
                              if (deptStrategy === 'reward') setDeptStrategy('full');
                            }}
                            style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: 'none',
                              fontSize: '0.67rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              background: isDeptVoucherDeduct ? '#059669' : 'transparent',
                              color: isDeptVoucherDeduct ? '#ffffff' : '#94a3b8',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            결제 즉시차감
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMixedDeptVoucherMode('reward');
                              setDeptStrategy('reward');
                            }}
                            style={{
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: 'none',
                              fontSize: '0.67rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              background: !isDeptVoucherDeduct ? '#b45309' : 'transparent',
                              color: !isDeptVoucherDeduct ? '#ffffff' : '#94a3b8',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            적립 (5년/60일 적립)
                          </button>
                        </div>
                      </div>
                      <MoneyInput
                        value={mixedDeptVoucherDiscount}
                        onChange={setMixedDeptVoucherDiscount}
                        placeholder="상품권 / G캐시 금액"
                        compact
                        accentColor="#fcd34d"
                      />
                      <div style={{ fontSize: '0.68rem', color: isDeptVoucherDeduct ? '#a7f3d0' : '#fde68a' }}>
                        {isDeptVoucherDeduct
                          ? '⚡ 결제 시 즉시 차감되어 결제금액이 줄어듭니다.'
                          : '📱 결제 시 미차감 / 추후 고객에게 적립되어 사용합니다.'}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#cbd5e1', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '0.35rem' }}>
                      💳 결제: <strong style={{ color: '#fde68a' }}>갤러리아 제휴카드 {mixedDeptVoucherDiscount > 0 && isDeptVoucherDeduct ? '+ 상품권(G캐시) 즉시차감' : '(사은행사)'}</strong>
                    </div>
                  </div>

                  {/* 카드 2: 로드샵 결제조건 */}
                  <div
                    onClick={() => setMixedChannelType('road')}
                    style={{
                      borderRadius: '10px',
                      padding: '0.8rem 0.9rem',
                      cursor: 'pointer',
                      background: mixedChannelType === 'road' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: mixedChannelType === 'road' ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: mixedChannelType === 'road' ? '0 0 16px rgba(59, 130, 246, 0.2)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#93c5fd' }}>🏪 진주본점 결제조건</span>
                        {mixedChannelType === 'road' ? (
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#1d4ed8', color: 'white', padding: '1px 6px', borderRadius: '4px' }}>
                            ✓ 견적 반영
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>
                            클릭 시 전환
                          </span>
                        )}
                      </div>
                      <label
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={mixedRoadDiscountProof}
                          onChange={(e) => setMixedRoadDiscountProof(e.target.checked)}
                          style={{ accentColor: '#10b981', cursor: 'pointer', width: '13px', height: '13px' }}
                        />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: mixedRoadDiscountProof ? '#6ee7b7' : '#94a3b8' }}>
                          제휴카드
                        </span>
                      </label>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <label style={{ fontSize: '0.71rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                        로드샵 특정조건 할인 금액
                      </label>
                      <MoneyInput
                        value={mixedRoadDiscount}
                        onChange={setMixedRoadDiscount}
                        placeholder="로드샵 할인 금액"
                        compact
                        accentColor="#60a5fa"
                      />
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={mixedRoadDiscountNote}
                        onChange={(e) => setMixedRoadDiscountNote(e.target.value)}
                        placeholder={`할인 명칭 (미입력 시: ${effectiveRoadNote})`}
                        style={{ ...textInputStyle, padding: '0.42rem 0.65rem', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#cbd5e1', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '0.35rem' }}>
                      💳 결제: <strong style={{ color: '#93c5fd' }}>로드샵 제휴카드 일시불 / 플러스페이</strong>
                    </div>
                  </div>
                </div>

                {/* 견적서 실제 반영 요약 안내 */}
                <div style={{ marginTop: '0.7rem', fontSize: '0.79rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', background: 'rgba(0,0,0,0.25)', padding: '0.45rem 0.75rem', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--accent-gold-light)', fontWeight: 800 }}>
                    견적서 반영: [{mixedChannelType === 'dept' ? '🏬 갤러리아 백화점' : '🏪 진주본점'}]
                  </span>
                  <span>{effectiveSpecialDiscountNote}</span>
                  {mixedLumpSpecificDiscount > 0 ? (
                    <strong style={{ color: '#fca5a5' }}>-{formatWon(mixedLumpSpecificDiscount)}</strong>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>(할인금액 0원)</span>
                  )}
                  {mixedSpecialDiscountProof && (
                    <span className="a4-proof-tag" style={{ margin: 0 }}>제휴카드</span>
                  )}
                </div>
              </div>
            </div>

            {/* 일반구매 품목군 요약 */}
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.15rem',
                borderRadius: '14px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.35)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.28rem', color: '#cbd5e1' }}>
                <span>일반구매 기준금액{mixedLumpQtyTotal > 0 ? ` (총 ${mixedLumpQtyTotal}대)` : ''}</span>
                <span>{formatWon(mixedLumpGross)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.45rem', color: '#cbd5e1' }}>
                <span>총 할인 · 특정 조건 차감 합계</span>
                <strong style={{ color: '#fca5a5' }}>- {formatWon(mixedLumpDiscountTotal)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.55rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>일반구매 혜택가 소계</span>
                <strong style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--accent-gold-light)' }}>
                  {formatWon(mixedLumpBenefitSub)}
                </strong>
              </div>
              {mixedChannelType === 'dept' && deptVoucherDiscount > 0 && (
                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  실결제금액: <strong style={{ color: '#f8fafc' }}>{formatWon(mixedLumpPaySub)}</strong>{' '}
                  {isDeptVoucherDeduct ? (
                    <span style={{ color: '#34d399', fontWeight: 700 }}>↳ G캐시 {formatWon(deptVoucherDiscount)} 즉시차감 반영</span>
                  ) : (
                    <span style={{ color: '#fde68a', fontWeight: 700 }}>↳ 상품권(G캐시) {formatWon(deptVoucherDiscount)} 적립 지급</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
        <div
          className="glass-panel calc-no-hover"
          style={{
            padding: '1.6rem',
            borderTop: '4px solid var(--accent-gold)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            order: 1
          }}
        >
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '1px' }}>OPTION A</span>
              <h3 style={{ fontSize: '1.38rem', fontWeight: 800 }}>💳 일반구매 결제 조건</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                일시불 최종 체감가를 메인으로 표시하며, 하단에 동일기간({subMonths}개월) 장기할부 시 금액을 함께 안내합니다.
              </p>
            </div>

            {/* 1. 총 구매 기준금액 */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ ...labelStyle, fontSize: '0.93rem', color: 'white' }}>총 기준 구매금액</label>
              <MoneyInput value={lumpBasePrice} onChange={handleLumpBaseChange} placeholder="0" compact />
            </div>

            {/* 2. 총 할인·혜택 금액 (통합) */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ ...labelStyle, fontSize: '0.93rem', color: 'white' }}>일반구매 총 할인 · 혜택 금액 (통합)</label>
              <MoneyInput value={lumpTotalBenefit} onChange={handleLumpBenefitChange} placeholder="할인·캐시백·상품권 등 총합" compact />
            </div>

            {/* 3. 최종 체감가 직접 수정 연동 */}
            <div
              style={{
                padding: '0.85rem',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.07)',
                border: '1px dashed rgba(212, 175, 55, 0.35)',
                marginBottom: '1rem'
              }}
            >
              <label style={{ ...labelStyle, fontSize: '0.85rem', color: 'var(--accent-gold-light)' }}>
                일반구매 일시불 최종 체감가 (직접 입력 시 혜택금액 자동 역산)
              </label>
              <MoneyInput value={lumpFinalPrice} onChange={handleLumpFinalDirectChange} placeholder="0" compact />
            </div>

            {/* 4. 카드 최저금리 할부 참고 설정 */}
            <div
              style={{
                padding: '0.9rem',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.07)',
                border: '1px solid rgba(248, 113, 113, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Percent size={14} /> 하단 표시용 장기할부 최저금리 ({subMonths}개월 기준)
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {['4.9', '5.5', '5.9', '6.5', '7.0'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCardLowestRate(r)}
                    style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '6px',
                      border: cardLowestRate === r ? '1px solid #f87171' : '1px solid var(--glass-border)',
                      background: cardLowestRate === r ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.05)',
                      color: 'white',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    연 {r}%
                  </button>
                ))}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '0.28rem 0.55rem',
                    marginLeft: 'auto',
                    width: '105px'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '4px' }}>연</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={cardLowestRate}
                    onChange={(e) => setCardLowestRate(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      textAlign: 'right'
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '3px' }}>%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 일반구매 실시간 요약 박스 (메인: 일시불 크게 / 하단: 장기할부 작게) */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1.15rem',
              borderRadius: '14px',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.45rem', color: '#cbd5e1' }}>
              <span>총 할인 · 혜택 차감 합계</span>
              <strong style={{ color: '#fca5a5' }}>- {formatWon(lumpTotalBenefit)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.55rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>일반구매 최종 체감가 (일시불)</span>
              <strong style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--accent-gold-light)' }}>
                {formatWon(lumpFinalPrice)}
              </strong>
            </div>

            <div
              style={{
                marginTop: '0.55rem',
                paddingTop: '0.55rem',
                borderTop: '1px dashed rgba(255,255,255,0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.82rem',
                color: '#cbd5e1'
              }}
            >
              <span>동일기간({subMonths}개월 · 연 {numericCardRate}%) 장기할부 시</span>
              <strong style={{ color: '#fca5a5', fontSize: '0.88rem' }}>
                총 {formatWon(lumpInstallment.totalPayment)} (월 {formatWon(lumpInstallment.monthly)})
              </strong>
            </div>
          </div>
        </div>
        )}

        {/* ==================== 삼성AI구독 카드 ==================== */}
        <div
          className="glass-panel calc-no-hover"
          style={{
            padding: '1.6rem',
            borderTop: '4px solid var(--accent-blue)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            order: isMixedMode ? 1 : 2
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '1px' }}>
                  {isMixedMode ? 'PART 1 · 구독 모델 & 전용 서비스' : 'OPTION B'}
                </span>
                <h3 style={{ fontSize: '1.38rem', fontWeight: 800 }}>
                  {isMixedMode ? '✨ 1. 삼성AI구독 모델 & 전용 서비스' : '✨ 삼성AI구독 조건'}
                </h3>
              </div>
              {isMixedMode ? (
                <button
                  type="button"
                  onClick={handleGoToResult}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    color: '#6ee7b7',
                    padding: '0.45rem 1rem',
                    borderRadius: '50px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.28)';
                    e.currentTarget.style.borderColor = '#34d399';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.45)';
                  }}
                >
                  <Printer size={15} /> 견적서 바로보기
                </button>
              ) : (
                <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', padding: '3px', border: '1px solid var(--glass-border)' }}>
                  <button
                    type="button"
                    onClick={() => setSubInputMode('monthly')}
                    style={{
                      padding: '0.32rem 0.65rem',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: subInputMode === 'monthly' ? 'var(--accent-blue)' : 'transparent',
                      color: subInputMode === 'monthly' ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    월 구독료 입력
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubInputMode('total')}
                    style={{
                      padding: '0.32rem 0.65rem',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: subInputMode === 'total' ? 'var(--accent-blue)' : 'transparent',
                      color: subInputMode === 'total' ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    총액 기준 입력
                  </button>
                </div>
              )}
            </div>

            {isMixedMode ? (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label style={{ ...labelStyle, marginBottom: 0, color: '#93c5fd', fontSize: '0.88rem', fontWeight: 800 }}>
                    📦 개별 구독 모델 및 전용 서비스 상세 설정 (총 {mixedSubItems.length}개 모델)
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: '#a7f3d0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeServiceInFinal}
                      onChange={(e) => setIncludeServiceInFinal(e.target.checked)}
                    />
                    서비스 혜택 체감가 차감 반영
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {mixedSubItems.map((item, idx) => {
                    const {
                      qty: itemQty,
                      months: itemMonths,
                      baseMonthly: itemBase,
                      monthly: itemMonthly,
                      prepay: itemPrepay,
                      baseGross: itemGross,
                      discountedGross: itemDiscountedGross,
                      feeDiscount: itemFeeDiscount,
                      serviceTotal: itemServiceTotal,
                      serviceLabel: itemServiceLabel
                    } = getMixedSubItemCalc(item);

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'rgba(30, 58, 138, 0.22)',
                          border: '1px solid rgba(96, 165, 250, 0.4)',
                          borderRadius: '12px',
                          padding: '0.85rem 0.95rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.6rem'
                        }}
                      >
                        {/* 1행: 번호 뱃지 + 모델명 입력 + 수량 + 삭제 버튼 */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span
                            style={{
                              background: 'rgba(59, 130, 246, 0.3)',
                              border: '1px solid #60a5fa',
                              color: '#bfdbfe',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              flexShrink: 0
                            }}
                          >
                            구독 모델 {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={item.name || ''}
                            onChange={(e) => handleUpdateMixedSubItem(item.id, 'name', e.target.value)}
                            placeholder="모델명 입력 (예: 비스포크 AI 콤보 세탁건조기 WD25DB8995BZ)"
                            style={{ ...textInputStyle, padding: '0.45rem 0.65rem', fontSize: '0.86rem', flex: 1 }}
                          />
                          <div style={{ width: '75px', flexShrink: 0, position: 'relative' }}>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.quantity !== undefined ? item.quantity : 1}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                handleUpdateMixedSubItem(item.id, 'quantity', raw === '' ? '' : parseInt(raw, 10));
                              }}
                              placeholder="1"
                              style={{ ...textInputStyle, padding: '0.45rem 1.4rem 0.45rem 0.45rem', fontSize: '0.86rem', textAlign: 'right' }}
                            />
                            <span style={{ position: 'absolute', right: '0.45rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.76rem', pointerEvents: 'none' }}>
                              대
                            </span>
                          </div>
                          {mixedSubItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMixedSubItem(item.id)}
                              title="해당 구독 모델 삭제"
                              style={{
                                width: '30px',
                                height: '32px',
                                padding: 0,
                                borderRadius: '7px',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#fca5a5',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* 2행: 구독기간 (36~72) + 서비스주기 (6/12/36) + 기본구독료 + 할인구독료 + 선납금 */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem', alignItems: 'end' }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>구독기간</label>
                            <select
                              value={item.months}
                              onChange={(e) => handleUpdateMixedSubItem(item.id, 'months', Number(e.target.value))}
                              style={{
                                width: '100%',
                                height: '38px',
                                borderRadius: '8px',
                                background: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(96, 165, 250, 0.55)',
                                color: 'white',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                padding: '0 0.4rem',
                                cursor: 'pointer'
                              }}
                            >
                              {[72, 60, 48, 36].map((m) => (
                                <option key={m} value={m} style={{ background: '#0f172a', color: 'white' }}>
                                  {m}개월
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>서비스주기</label>
                            <select
                              value={item.serviceCycle === 0 || item.serviceCycle === null || item.serviceCycle === '' ? 0 : (item.serviceCycle || 12)}
                              onChange={(e) => handleUpdateMixedSubItem(item.id, 'serviceCycle', Number(e.target.value))}
                              style={{
                                width: '100%',
                                height: '38px',
                                borderRadius: '8px',
                                background: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(96, 165, 250, 0.55)',
                                color: (item.serviceCycle === 0 || item.serviceCycle === null || item.serviceCycle === '') ? '#94a3b8' : 'white',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                padding: '0 0.4rem',
                                cursor: 'pointer'
                              }}
                            >
                              <option value={0} style={{ background: '#0f172a', color: '#94a3b8' }}>
                                없음 (케어 미적용)
                              </option>
                              {[4, 6, 12, 36].map((c) => (
                                <option key={c} value={c} style={{ background: '#0f172a', color: 'white' }}>
                                  {c}개월마다
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>기본구독료 (월)</label>
                            <MoneyInput
                              value={item.baseMonthlyFee}
                              onChange={(val) => handleUpdateMixedSubItem(item.id, 'baseMonthlyFee', val)}
                              placeholder="기본 월구독료"
                              compact
                              accentColor="#93c5fd"
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 800, display: 'block', marginBottom: '0.2rem' }}>할인구독료 (월)</label>
                            <MoneyInput
                              value={item.discountMonthlyFee}
                              onChange={(val) => handleUpdateMixedSubItem(item.id, 'discountMonthlyFee', val)}
                              placeholder="할인 실납부액"
                              compact
                              accentColor="#60a5fa"
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>선납금 (선택)</label>
                            <MoneyInput
                              value={item.prepay}
                              onChange={(val) => handleUpdateMixedSubItem(item.id, 'prepay', val)}
                              placeholder="선납금"
                              compact
                              accentColor="#93c5fd"
                            />
                          </div>
                        </div>

                        {/* 3행: 전용 서비스 3종 (무상수리 이용금액, 소모품비용, 방문케어비용) */}
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '9px', padding: '0.55rem 0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', alignItems: 'end' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.71rem', color: '#6ee7b7', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}>
                                <ShieldCheck size={12} /> {item.isMobile ? '무상수리 + 파손보험(월)' : '무상수리 이용금액(월)'}
                              </label>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', fontSize: '0.68rem', color: item.isMobile ? '#38bdf8' : '#94a3b8', userSelect: 'none' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.isMobile)}
                                  onChange={(e) => handleUpdateMixedSubItem(item.id, 'isMobile', e.target.checked)}
                                  style={{ accentColor: '#38bdf8', cursor: 'pointer', width: '12px', height: '12px' }}
                                />
                                모바일
                              </label>
                            </div>
                            <MoneyInput
                              value={item.freeRepairFee}
                              onChange={(val) => handleUpdateMixedSubItem(item.id, 'freeRepairFee', val)}
                              placeholder={item.isMobile ? "월 케어+(파손보험)" : "월 무상수리액"}
                              compact
                              accentColor="#34d399"
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.71rem', color: '#6ee7b7', fontWeight: 800, display: 'block', marginBottom: '0.2rem' }}>
                              소모품 비용
                            </label>
                            <MoneyInput
                              value={item.selfCareFee}
                              onChange={(val) => handleUpdateMixedSubItem(item.id, 'selfCareFee', val)}
                              placeholder="소모품 총액"
                              compact
                              accentColor="#34d399"
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.71rem', color: '#6ee7b7', fontWeight: 800, display: 'block', margin: 0 }}>
                                방문케어 비용(전문가)
                              </label>
                              {!item.isMobile && (
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', fontSize: '0.68rem', color: item.hasReinstall ? '#a7f3d0' : '#94a3b8', userSelect: 'none' }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(item.hasReinstall)}
                                    onChange={(e) => handleUpdateMixedSubItem(item.id, 'hasReinstall', e.target.checked)}
                                    style={{ accentColor: '#10b981', cursor: 'pointer', width: '12px', height: '12px' }}
                                  />
                                  재설치서비스
                                </label>
                              )}
                            </div>
                            <MoneyInput
                              value={item.visitCareFee}
                              onChange={(val) => handleUpdateMixedSubItem(item.id, 'visitCareFee', val)}
                              placeholder="방문케어 총액"
                              compact
                              accentColor="#34d399"
                            />
                          </div>
                        </div>

                        {/* 4행: 개별 모델 실시간 산출 피드백 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#cbd5e1', paddingTop: '0.2rem', borderTop: '1px dashed rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: '0.35rem' }}>
                          <span>
                            기준총액: <strong style={{ color: '#bfdbfe' }}>{formatWon(itemGross)}</strong> (월 {formatWon(itemBase * itemQty)} × {itemMonths}개월)
                            {(itemFeeDiscount > 0 || itemPrepay > 0) && (
                              <span style={{ color: '#93c5fd', marginLeft: '5px' }}>
                                → 할인적용 총액: <strong style={{ color: '#ffffff' }}>{formatWon(itemDiscountedGross)}</strong>
                                {itemPrepay > 0 ? ` (선납 ${formatWon(itemPrepay)} + 월 ${formatWon(itemMonthly * itemQty)}×${itemMonths}개월)` : ''}
                              </span>
                            )}
                          </span>
                          <span>
                            실납부: <strong style={{ color: '#60a5fa' }}>월 {formatWon(itemMonthly * itemQty)}</strong>
                            {itemFeeDiscount > 0 && (
                              <span style={{ color: '#86efac', fontWeight: 700, marginLeft: '5px' }}>
                                (구독료 할인 -{formatWon(itemFeeDiscount)})
                              </span>
                            )}
                            {itemServiceTotal > 0 && (
                              <span style={{ color: '#6ee7b7', fontWeight: 700, marginLeft: '6px' }}>
                                · 구독 혜택 {formatWon(itemServiceTotal)} 상당
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddMixedSubItem}
                  style={{
                    marginTop: '0.65rem',
                    width: '100%',
                    padding: '0.52rem 0.8rem',
                    borderRadius: '9px',
                    border: '1px dashed rgba(96, 165, 250, 0.65)',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#93c5fd',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Plus size={15} /> 구독 모델 추가 (품목별 전용서비스 동시 설정)
                </button>
              </div>
            ) : (
              <>
                {/* 1. 맨 위칸: 선납금 합계 */}
                <div style={{ marginBottom: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0' }}>선납금 합계</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#64748b' }}>(선택 입력)</span>
                  </div>
                  <MoneyInput value={subPrepay} onChange={setSubPrepay} accentColor="#93c5fd" compact />
                </div>

                {/* 2. 두 번째 칸~: 품목별 통합 카드 (품목명 + 월구독료 + 약정기간 + 모바일체크 + 무상수리 + 케어서비스) */}
                <div style={{ marginBottom: '1rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.65rem',
                      flexWrap: 'wrap',
                      gap: '0.4rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                      <span style={{ color: '#93c5fd', fontSize: '0.9rem', fontWeight: 800 }}>
                        📦 구독 품목 및 전용 서비스 설정
                      </span>
                      {subPlans.length > 1 && (
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                          (총 {subPlans.length}개 품목)
                        </span>
                      )}
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: '#a7f3d0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={includeServiceInFinal}
                        onChange={(e) => setIncludeServiceInFinal(e.target.checked)}
                        style={{ accentColor: '#34d399', cursor: 'pointer', width: '13px', height: '13px' }}
                      />
                      서비스 혜택 최종 체감가에 차감 반영
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {subPlans.map((plan, idx) => {
                      const planMonths = Number(plan.months) || 72;
                      const planMonthly =
                        subInputMode === 'monthly'
                          ? Number(plan.monthlyFee) || 0
                          : Math.round((Number(plan.totalAmount) || 0) / planMonths);
                      const planGross = planMonthly * planMonths;
                      const freeRepairTotal = (Number(plan.freeRepairFee) || 0) * planMonths;
                      const planCareItems = Array.isArray(plan.careItems) ? plan.careItems : [];
                      const planCareTotal = planCareItems.reduce(
                        (sum, c) => sum + (Number(c.amount) || 0) * (c.count === '' || c.count === undefined ? 1 : Number(c.count) || 1),
                        0
                      ) + (Number(plan.careAmount) || 0);
                      const itemServiceBenefit = freeRepairTotal + planCareTotal;

                      return (
                        <div
                          key={plan.id}
                          style={{
                            background: plan.isMobile ? 'rgba(30, 58, 138, 0.28)' : 'rgba(30, 58, 138, 0.22)',
                            border: plan.isMobile ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(96, 165, 250, 0.4)',
                            borderRadius: '13px',
                            padding: '0.85rem 0.95rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                            position: 'relative'
                          }}
                        >
                          {/* 카드 헤더: 품목 번호 배지 + 모바일 배지 + 간이 요약 + 삭제 버튼 */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  background: plan.isMobile ? 'rgba(56, 189, 248, 0.25)' : 'rgba(59, 130, 246, 0.3)',
                                  border: `1px solid ${plan.isMobile ? '#38bdf8' : '#60a5fa'}`,
                                  color: plan.isMobile ? '#38bdf8' : '#bfdbfe',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  padding: '0.22rem 0.55rem',
                                  borderRadius: '6px'
                                }}
                              >
                                {idx + 1}번 품목
                              </span>

                              {plan.isMobile && (
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: '#38bdf8',
                                    background: 'rgba(56, 189, 248, 0.16)',
                                    border: '1px solid rgba(56, 189, 248, 0.45)',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '5px'
                                  }}
                                >
                                  📱 모바일
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>약정총액</span>
                                <span style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 800 }}>{formatWon(planGross)}</span>
                                {itemServiceBenefit > 0 && (
                                  <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700, marginLeft: '0.2rem' }}>
                                    (혜택 +{formatWon(itemServiceBenefit)})
                                  </span>
                                )}
                              </div>

                              {subPlans.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubPlan(plan.id)}
                                  title="이 품목 삭제"
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    padding: 0,
                                    borderRadius: '7px',
                                    border: '1px solid rgba(239, 68, 68, 0.4)',
                                    background: 'rgba(239, 68, 68, 0.15)',
                                    color: '#fca5a5',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 1) 품목명 입력 (전체 너비로 확장하여 긴 모델명도 깔끔하게 수용) */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.3rem' }}>
                              <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700 }}>품목명</span>
                              <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>(미입력 시 생략)</span>
                            </div>
                            <input
                              type="text"
                              value={plan.name || ''}
                              onChange={(e) => handleUpdateSubPlan(plan.id, { name: e.target.value })}
                              placeholder="예: 비스포크 AI 콤보 세탁건조기, 갤럭시 S25"
                              style={{
                                ...textInputStyle,
                                padding: '0.45rem 0.65rem',
                                fontSize: '0.84rem'
                              }}
                            />
                          </div>

                          {/* 2) 월 구독료 + 약정기간 (같은 줄에 나란히 배치 최적화) */}
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: '1 1 180px', minWidth: '130px' }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700 }}>
                                  {subInputMode === 'monthly' ? '월 구독료' : '약정 총 구독료'}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                                  {subInputMode === 'monthly' ? '(매월 납부금)' : '(약정 전체 금액)'}
                                </span>
                              </div>
                              <MoneyInput
                                value={subInputMode === 'monthly' ? plan.monthlyFee : plan.totalAmount}
                                onChange={(val) =>
                                  handleUpdateSubPlan(
                                    plan.id,
                                    subInputMode === 'monthly' ? { monthlyFee: val } : { totalAmount: val }
                                  )
                                }
                                placeholder={subInputMode === 'monthly' ? (idx === 0 ? '예: 72,000' : '예: 25,000') : '0'}
                                accentColor="#93c5fd"
                                compact
                              />
                            </div>

                            <div style={{ width: '96px', flexShrink: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700 }}>
                                  약정기간
                                </span>
                              </div>
                              <select
                                value={plan.months}
                                onChange={(e) => handleUpdateSubPlan(plan.id, { months: Number(e.target.value) })}
                                style={{
                                  width: '100%',
                                  height: '38px',
                                  boxSizing: 'border-box',
                                  borderRadius: '8px',
                                  background: 'rgba(15, 23, 42, 0.9)',
                                  border: '1px solid rgba(96, 165, 250, 0.55)',
                                  color: 'white',
                                  fontSize: '0.86rem',
                                  fontWeight: 800,
                                  padding: '0 0.35rem',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  textAlign: 'center'
                                }}
                              >
                                {[72, 60, 48, 36].map((m) => (
                                  <option key={m} value={m} style={{ background: '#0f172a', color: 'white' }}>
                                    {m}개월
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* 3) 전용 서비스 혜택 (모바일 체크 + 무상수리 약정일치 + 케어서비스 행추가) */}
                          <div
                            style={{
                              background: plan.isMobile ? 'rgba(56, 189, 248, 0.06)' : 'rgba(16, 185, 129, 0.05)',
                              border: plan.isMobile ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(52, 211, 153, 0.25)',
                              borderRadius: '10px',
                              padding: '0.75rem 0.85rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.65rem'
                            }}
                          >
                            {/* 상단 라벨 & 모바일 체크박스 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <ShieldCheck size={14} style={{ color: plan.isMobile ? '#38bdf8' : '#34d399' }} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: plan.isMobile ? '#7dd3fc' : '#a7f3d0' }}>
                                  {plan.isMobile ? '모바일 파손보험 + 무상수리' : '무상수리 연장 이용료'}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                                  (약정 {plan.months}개월 자동 연동)
                                </span>
                              </div>

                              {/* 모바일 체크박스 */}
                              <label
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: plan.isMobile ? '#38bdf8' : '#94a3b8',
                                  background: plan.isMobile ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                                  border: `1px solid ${plan.isMobile ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}`,
                                  borderRadius: '6px',
                                  padding: '0.18rem 0.45rem',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(plan.isMobile)}
                                  onChange={(e) => handleUpdateSubPlan(plan.id, { isMobile: e.target.checked })}
                                  style={{ accentColor: '#38bdf8', cursor: 'pointer', width: '12px', height: '12px' }}
                                />
                                모바일
                              </label>
                            </div>

                            {/* 무상수리 월 금액 입력 (약정기간 자동 일치 계산) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <div style={{ flex: '1 1 180px', minWidth: '130px' }}>
                                <MoneyInput
                                  value={plan.freeRepairFee}
                                  onChange={(val) => handleUpdateSubPlan(plan.id, { freeRepairFee: val })}
                                  placeholder={plan.isMobile ? "월 케어+(파손보험) 금액" : "월 무상수리 이용료 (원)"}
                                  compact
                                  accentColor={plan.isMobile ? '#38bdf8' : '#34d399'}
                                />
                              </div>
                              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                                {freeRepairTotal > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: plan.isMobile ? '#38bdf8' : '#6ee7b7' }}>
                                      = {formatWon(freeRepairTotal)} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a7f3d0' }}>상당</span>
                                    </div>
                                    <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 500 }}>
                                      월 {formatWon(plan.freeRepairFee || 0)} × {plan.months}개월
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    약정 {plan.months}개월 일치 연동
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 케어서비스 행추가 섹션: 한 세트당 2줄 배치 최적화 & 타이포그래피 계층화 */}
                            <div style={{ marginTop: '0.2rem', paddingTop: '0.55rem', borderTop: '1px dashed rgba(52, 211, 153, 0.25)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <Wrench size={13} style={{ color: '#34d399' }} />
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#a7f3d0' }}>
                                    케어서비스 혜택
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                                    (주기·횟수·비용 맞춤 설정)
                                  </span>
                                </div>
                                {planCareTotal > 0 && (
                                  <span style={{ fontSize: '0.82rem', color: '#6ee7b7', fontWeight: 800 }}>
                                    소계: {formatWon(planCareTotal)} 상당
                                  </span>
                                )}
                              </div>

                              {/* 케어서비스 행 목록: 기본 1칸 노출 (한 세트당 2줄 배치 최적화) */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.45rem' }}>
                                {planCareItems.map((care, cIdx) => {
                                  const careCount = care.count !== undefined && care.count !== '' ? Number(care.count) : 1;
                                  const careAmt = Number(care.amount) || 0;
                                  const careSubtotal = careCount * careAmt;

                                  return (
                                    <div
                                      key={care.id || cIdx}
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.45rem',
                                        background: 'rgba(15, 23, 42, 0.75)',
                                        border: '1px solid rgba(52, 211, 153, 0.35)',
                                        borderRadius: '8px',
                                        padding: '0.55rem 0.65rem'
                                      }}
                                    >
                                      {/* 1번째 줄: 종류 (방문케어) + 점검주기 (6,12,36개월) + 삭제 버튼 (글자 크기 축소 및 콤팩트 최적화) */}
                                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.35rem' }}>
                                        {/* 번호 배지 */}
                                        <div style={{ paddingBottom: '0.3rem', flexShrink: 0 }}>
                                          <span
                                            style={{
                                              fontSize: '0.67rem',
                                              fontWeight: 800,
                                              color: '#6ee7b7',
                                              background: 'rgba(52, 211, 153, 0.18)',
                                              padding: '0.15rem 0.35rem',
                                              borderRadius: '4px'
                                            }}
                                          >
                                            #{cIdx + 1}
                                          </span>
                                        </div>

                                        {/* 종류 */}
                                        <div style={{ flex: '1.2 1 85px', minWidth: '78px' }}>
                                          <label style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.18rem' }}>
                                            종류
                                          </label>
                                          <select
                                            value={care.type || 'visit'}
                                            onChange={(e) => handleUpdatePlanCareItem(plan.id, care.id, { type: e.target.value })}
                                            style={{
                                              width: '100%',
                                              height: '30px',
                                              borderRadius: '6px',
                                              background: '#0f172a',
                                              border: '1px solid rgba(52, 211, 153, 0.45)',
                                              color: '#f8fafc',
                                              fontSize: '0.72rem',
                                              fontWeight: 600,
                                              padding: '0 0.35rem',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            <option value="visit">방문케어</option>
                                            <option value="self">셀프케어</option>
                                            <option value="consumable">소모품</option>
                                            <option value="custom">직접입력</option>
                                          </select>
                                        </div>

                                        {/* 점검주기 */}
                                        <div style={{ width: '78px', flexShrink: 0 }}>
                                          <label style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.18rem', textAlign: 'center' }}>
                                            점검주기
                                          </label>
                                          <select
                                            value={care.cycle || 12}
                                            onChange={(e) => handleUpdatePlanCareItem(plan.id, care.id, { cycle: Number(e.target.value) })}
                                            style={{
                                              width: '100%',
                                              height: '30px',
                                              borderRadius: '6px',
                                              background: '#0f172a',
                                              border: '1px solid rgba(52, 211, 153, 0.45)',
                                              color: '#a7f3d0',
                                              fontSize: '0.72rem',
                                              fontWeight: 600,
                                              padding: '0 0.2rem',
                                              cursor: 'pointer',
                                              textAlign: 'center'
                                            }}
                                          >
                                            <option value={6}>6개월</option>
                                            <option value={12}>12개월</option>
                                            <option value={36}>36개월</option>
                                          </select>
                                        </div>

                                        {/* 삭제 버튼 (슬림 콤팩트 최적화) */}
                                        <div style={{ flexShrink: 0 }}>
                                          <button
                                            type="button"
                                            onClick={() => handleRemovePlanCareItem(plan.id, care.id)}
                                            title="이 케어서비스 항목 삭제"
                                            style={{
                                              width: '28px',
                                              height: '30px',
                                              padding: 0,
                                              borderRadius: '6px',
                                              border: '1px solid rgba(239, 68, 68, 0.4)',
                                              background: 'rgba(239, 68, 68, 0.12)',
                                              color: '#fca5a5',
                                              cursor: 'pointer',
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              transition: 'all 0.15s ease'
                                            }}
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </div>

                                      {/* 직접입력 명칭 필드 (custom 선택 시) */}
                                      {care.type === 'custom' && (
                                        <div style={{ width: '100%' }}>
                                          <label style={{ display: 'block', fontSize: '0.67rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.2rem' }}>
                                            직접입력 서비스 명칭
                                          </label>
                                          <input
                                            type="text"
                                            value={care.customName || ''}
                                            onChange={(e) => handleUpdatePlanCareItem(plan.id, care.id, { customName: e.target.value })}
                                            placeholder="예: 필터 교체 서비스, 안심 점검 케어"
                                            style={{
                                              ...textInputStyle,
                                              padding: '0.35rem 0.55rem',
                                              fontSize: '0.8rem'
                                            }}
                                          />
                                        </div>
                                      )}

                                      {/* 2번째 줄: 횟수 (축소 최적화) + 회당금액 (공간 확장 최적화) */}
                                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.45rem' }}>
                                        {/* 횟수 (1~2자리 숫자에 맞춰 58px로 축소) */}
                                        <div style={{ width: '58px', flexShrink: 0 }}>
                                          <label style={{ display: 'block', fontSize: '0.67rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.2rem', textAlign: 'center' }}>
                                            횟수
                                          </label>
                                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <input
                                              type="text"
                                              inputMode="numeric"
                                              value={care.count !== undefined ? care.count : 1}
                                              onChange={(e) => {
                                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                                handleUpdatePlanCareItem(plan.id, care.id, { count: raw === '' ? '' : parseInt(raw, 10) });
                                              }}
                                              placeholder="1"
                                              title="이용 횟수"
                                              style={{
                                                width: '100%',
                                                height: '34px',
                                                borderRadius: '6px',
                                                background: '#0f172a',
                                                border: '1px solid rgba(52, 211, 153, 0.45)',
                                                color: '#ffffff',
                                                fontSize: '0.86rem',
                                                fontWeight: 800,
                                                padding: '0 1.15rem 0 0.35rem',
                                                textAlign: 'right',
                                                outline: 'none',
                                                boxSizing: 'border-box'
                                              }}
                                            />
                                            <span style={{ position: 'absolute', right: '0.35rem', fontSize: '0.72rem', color: '#94a3b8', pointerEvents: 'none', fontWeight: 600 }}>
                                              회
                                            </span>
                                          </div>
                                        </div>

                                        {/* 곱하기 기호 */}
                                        <div style={{ paddingBottom: '0.45rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 700, flexShrink: 0 }}>
                                          ×
                                        </div>

                                        {/* 회당금액 (남은 전체 폭을 넉넉하게 사용하도록 확장) */}
                                        <div style={{ flex: 1, minWidth: '130px' }}>
                                          <label style={{ display: 'block', fontSize: '0.67rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.2rem' }}>
                                            회당금액
                                          </label>
                                          <MoneyInput
                                            value={care.amount}
                                            onChange={(val) => handleUpdatePlanCareItem(plan.id, care.id, { amount: val })}
                                            placeholder="회당 금액 (원)"
                                            compact
                                            accentColor="#34d399"
                                          />
                                        </div>
                                      </div>

                                      {/* 합계는 칸없이 아래에 보여주기만 하면 될 것 같다 */}
                                      {careSubtotal > 0 && (
                                        <div
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            alignItems: 'baseline',
                                            gap: '0.3rem',
                                            paddingTop: '0.2rem'
                                          }}
                                        >
                                          <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                                            합계:
                                          </span>
                                          <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#34d399' }}>
                                            {formatWon(careSubtotal)}
                                          </span>
                                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#a7f3d0' }}>
                                            상당
                                          </span>
                                          {careCount > 1 && (
                                            <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 500, marginLeft: '0.25rem' }}>
                                              ({careCount}회 × {formatWon(careAmt)})
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* + 케어서비스 추가 버튼 */}
                              <button
                                type="button"
                                onClick={() => handleAddPlanCareItem(plan.id)}
                                style={{
                                  width: '100%',
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '7px',
                                  border: '1px dashed rgba(52, 211, 153, 0.55)',
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  color: '#6ee7b7',
                                  fontSize: '0.77rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.3rem',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Plus size={13} /> 케어서비스 추가
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSubPlan}
                    style={{
                      marginTop: '0.65rem',
                      width: '100%',
                      padding: '0.55rem 0.85rem',
                      borderRadius: '10px',
                      border: '1px dashed rgba(96, 165, 250, 0.55)',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#93c5fd',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Plus size={16} /> 구독 품목 추가 (2번, 3번...)
                  </button>
                </div>
              </>
            )}

            {/* 제휴카드 할인 상세 설정 (복수 카드 추가 및 중복 혜택 지원) */}
            <div style={{ marginBottom: '0.95rem', padding: '0.9rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.28)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <label style={{ ...labelStyle, marginBottom: 0, color: '#93c5fd', fontSize: '0.88rem', fontWeight: 800 }}>
                    💳 제휴카드 할인 상세 설정 {subCards.length > 1 ? `(총 ${subCards.length}개 카드 중복할인)` : subCards.length === 0 ? '(미적용/제외)' : ''}
                  </label>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 800 }}>
                  총 할인 합계: - {formatWon(subCardTotalDiscount)}
                </span>
              </div>

              {/* 제휴카드 목록 렌더링 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {subCards.length === 0 ? (
                  <div
                    style={{
                      padding: '1.2rem',
                      borderRadius: '10px',
                      background: 'rgba(15, 23, 42, 0.55)',
                      border: '1px dashed rgba(148, 163, 184, 0.35)',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.6rem'
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>
                      제휴카드가 삭제되었습니다 (견적서 및 계산에서 카드 청구할인 제외)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddCard()}
                      style={{
                        padding: '0.35rem 0.85rem',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.22)',
                        border: '1px solid rgba(96, 165, 250, 0.55)',
                        color: '#93c5fd',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <Plus size={14} /> + 제휴카드 추가
                    </button>
                  </div>
                ) : (
                  subCards.map((cardItem, cardIdx) => {
                    const cardTrimmed = (cardItem.cardName || '').trim();
                    const isSamsung = checkIsSamsungCard(cardTrimmed);
                    const isNonSamsung = Boolean(cardTrimmed && !isSamsung);
                    const cardCompanyShort = getCardCompanyShort(cardTrimmed);
                    const matchedPlan = isMixedMode ? mixedSubItems[cardIdx] : subPlans[cardIdx];

                    return (
                      <div
                        key={cardItem.id}
                        className="card-item-box"
                        style={{
                          padding: '0.75rem 0.85rem',
                          borderRadius: '10px',
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: '1px solid rgba(96, 165, 250, 0.35)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem'
                        }}
                      >
                        {/* 제휴카드 카드 헤더 (카드 순번, 회사 배지, 삭제 버튼) */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#93c5fd' }}>
                              💳 제휴카드 {cardIdx + 1}
                            </span>
                            {cardCompanyShort && (
                              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.25)', border: '1px solid #60a5fa', color: '#dbeafe' }}>
                                {cardCompanyShort}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveCard(cardItem.id)}
                            title="해당 제휴카드 삭제 (카드 할인 제외)"
                            style={{
                              padding: '0.2rem 0.45rem',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(248, 113, 113, 0.4)',
                              color: '#fca5a5',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              fontSize: '0.7rem',
                              fontWeight: 700
                            }}
                          >
                            <Trash2 size={12} /> 삭제
                          </button>
                        </div>

                      {/* 적용 대상 구독 모델 선택 영역 (다중 선택 지원) */}
                      {(() => {
                        const availableModels = isMixedMode ? mixedSubItems : activePlans;
                        const totalModelsCount = availableModels.length;
                        const selectedIndices = getCardSelectedIndices(cardItem, cardIdx, totalModelsCount, subCards.length === 1);
                        const isAllSelected = selectedIndices.length === totalModelsCount;

                        const selectedItems = selectedIndices.map((i) => availableModels[i]).filter(Boolean);
                        const cardPlanMonthlyFee = isMixedMode
                          ? selectedItems.reduce((sum, item) => sum + getItemMonthly(item) * getSubQty(item.quantity), 0)
                          : selectedItems.reduce((sum, item) => sum + (item.rowMonthly || 0), 0);
                        const cardModelMonths = selectedItems.length > 0
                          ? Math.max(...selectedItems.map((item) => Number(item.months) || 72))
                          : subMonths;

                        const selectedModelTitle = isAllSelected
                          ? (subCards.length === 1 ? '전체 구독 모델 자동 반영' : `전체 모델 (${totalModelsCount}개 품목)`)
                          : selectedIndices.length === 1
                          ? ((selectedItems[0]?.name || '').trim() || `${selectedIndices[0] + 1}번 모델`)
                          : `${selectedIndices.map((i) => `${i + 1}번`).join('·')} 모델 (총 ${selectedIndices.length}개)`;

                        if (totalModelsCount <= 1) {
                          return (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'rgba(59, 130, 246, 0.12)',
                                border: '1px solid rgba(96, 165, 250, 0.35)',
                                borderRadius: '7px',
                                padding: '0.45rem 0.65rem',
                                flexWrap: 'wrap',
                                gap: '0.5rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
                                  🎯 적용 구독 모델:
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>
                                  1번 모델 자동 반영 (월 {formatWon(cardPlanMonthlyFee)})
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.74rem', color: '#93c5fd', fontWeight: 800 }}>약정기간:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="120"
                                  value={cardItem.months ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? null : Math.max(1, parseInt(e.target.value, 10) || 0);
                                    handleUpdateCard(cardItem.id, { months: val });
                                  }}
                                  placeholder={String(cardModelMonths)}
                                  style={{
                                    width: '54px',
                                    padding: '0.2rem 0.35rem',
                                    borderRadius: '5px',
                                    background: '#0f172a',
                                    border: cardItem.months ? '1.5px solid #60a5fa' : '1px solid rgba(255,255,255,0.2)',
                                    color: cardItem.months ? '#93c5fd' : '#cbd5e1',
                                    fontSize: '0.78rem',
                                    fontWeight: 800,
                                    textAlign: 'center'
                                  }}
                                />
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>개월</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.45rem',
                              background: 'rgba(59, 130, 246, 0.1)',
                              border: '1px solid rgba(96, 165, 250, 0.3)',
                              borderRadius: '8px',
                              padding: '0.55rem 0.7rem'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#38bdf8' }}>
                                  🎯 적용 구독 모델 선택 (다중 선택 가능):
                                </span>
                                <span style={{ fontSize: '0.70rem', color: '#93c5fd', fontWeight: 700 }}>
                                  {isAllSelected
                                    ? `(전체 ${totalModelsCount}개 모델 적용)`
                                    : `(${selectedIndices.map((i) => `${i + 1}번`).join('·')} 적용 · 총 ${selectedIndices.length}개)`}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allIndices = availableModels.map((_, i) => i);
                                    handleUpdateModelSelection(cardItem.id, allIndices);
                                  }}
                                  style={{
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '5px',
                                    border: isAllSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
                                    background: isAllSelected ? 'rgba(56, 189, 248, 0.28)' : 'rgba(255,255,255,0.06)',
                                    color: isAllSelected ? '#38bdf8' : '#cbd5e1',
                                    fontSize: '0.70rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isAllSelected ? '✓ 전체선택됨' : '전체선택'}
                                </button>

                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                  <span style={{ fontSize: '0.71rem', color: '#cbd5e1', fontWeight: 700 }}>약정기간:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={cardItem.months ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? null : Math.max(1, parseInt(e.target.value, 10) || 0);
                                      handleUpdateCard(cardItem.id, { months: val });
                                    }}
                                    placeholder={String(cardModelMonths)}
                                    title="제휴카드 약정개월수 직접 입력 (비워두면 선택 모델 최장기간 연동)"
                                    style={{
                                      width: '50px',
                                      padding: '0.18rem 0.35rem',
                                      borderRadius: '5px',
                                      background: '#0f172a',
                                      border: cardItem.months ? '1.5px solid #60a5fa' : '1px solid rgba(255,255,255,0.2)',
                                      color: cardItem.months ? '#93c5fd' : '#cbd5e1',
                                      fontSize: '0.76rem',
                                      fontWeight: 800,
                                      textAlign: 'center'
                                    }}
                                  />
                                  <span style={{ fontSize: '0.70rem', color: '#94a3b8' }}>개월</span>
                                </div>
                                <div style={{ display: 'inline-flex', gap: '0.18rem' }}>
                                  {[72, 60, 48, 36].map((m) => (
                                    <button
                                      key={m}
                                      type="button"
                                      onClick={() => handleUpdateCard(cardItem.id, { months: cardItem.months === m ? null : m })}
                                      style={{
                                        padding: '0.14rem 0.38rem',
                                        borderRadius: '4px',
                                        border: cardItem.months === m ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.12)',
                                        background: cardItem.months === m ? 'rgba(59, 130, 246, 0.28)' : 'rgba(255,255,255,0.05)',
                                        color: cardItem.months ? '#93c5fd' : '#cbd5e1',
                                        fontSize: '0.69rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {m}
                                    </button>
                                  ))}
                                  {cardItem.months && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCard(cardItem.id, { months: null })}
                                      title="모델 기본기간 자동 연동으로 초기화"
                                      style={{
                                        padding: '0.14rem 0.35rem',
                                        borderRadius: '4px',
                                        border: '1px solid rgba(248, 113, 113, 0.4)',
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: '#fca5a5',
                                        fontSize: '0.67rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      자동
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 개별 모델 선택 칩들 */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.1rem' }}>
                              {availableModels.map((p, pIdx) => {
                                const isSelected = selectedIndices.includes(pIdx);
                                const title = (p.name || '').trim() || (isMixedMode ? `구독 모델 ${pIdx + 1}` : `품목 ${pIdx + 1}`);
                                const m = Number(p.months) || 72;
                                const monthly = isMixedMode ? getItemMonthly(p) * getSubQty(p.quantity) : (p.rowMonthly || 0);

                                return (
                                  <button
                                    key={p.id || pIdx}
                                    type="button"
                                    onClick={() => {
                                      let nextIndices;
                                      if (isSelected) {
                                        if (selectedIndices.length <= 1) {
                                          alert('최소 1개 이상의 구독 모델이 선택되어야 합니다.');
                                          return;
                                        }
                                        nextIndices = selectedIndices.filter((i) => i !== pIdx);
                                      } else {
                                        nextIndices = [...selectedIndices, pIdx].sort((a, b) => a - b);
                                      }
                                      handleUpdateModelSelection(cardItem.id, nextIndices);
                                    }}
                                    style={{
                                      padding: '0.24rem 0.55rem',
                                      borderRadius: '6px',
                                      border: isSelected ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.14)',
                                      background: isSelected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(15, 23, 42, 0.55)',
                                      color: isSelected ? '#ffffff' : '#94a3b8',
                                      fontSize: '0.74rem',
                                      fontWeight: isSelected ? 800 : 500,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.3rem',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <span style={{ color: isSelected ? '#38bdf8' : '#64748b', fontSize: '0.8rem', fontWeight: 900 }}>
                                      {isSelected ? '☑' : '☐'}
                                    </span>
                                    <span>{pIdx + 1}번: {title}</span>
                                    <span style={{ fontSize: '0.68rem', color: isSelected ? '#bae6fd' : '#64748b' }}>
                                      ({m}개월 · 월 {formatWon(monthly)})
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* 선택 합계 안내 바 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#cbd5e1', paddingTop: '0.25rem', borderTop: '1px dashed rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: '0.3rem' }}>
                              <span>
                                선택 적용 모델: <strong style={{ color: '#38bdf8' }}>{selectedModelTitle}</strong>
                              </span>
                              <span>
                                해당 모델 월 구독료 합계: <strong style={{ color: '#6ee7b7' }}>월 {formatWon(cardPlanMonthlyFee)}</strong>
                                {isSamsung && (
                                  <span style={{ fontSize: '0.67rem', color: cardPlanMonthlyFee >= 70000 ? '#6ee7b7' : '#fde68a', marginLeft: '4px' }}>
                                    ({cardPlanMonthlyFee >= 70000 ? '7만원 이상: 최대 26,000원 할인' : '7만원 미만: 최대 16,000원 할인 한도'})
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 1번째: 카드 이름 직접 입력 및 프리셋 */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.28rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                          <span style={{ fontSize: '0.79rem', fontWeight: 700, color: '#dbeafe' }}>1. 카드 이름</span>
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {[
                              { label: '삼성카드', fullName: '삼성전자 AI구독 삼성카드' },
                              { label: 'KB카드', fullName: '삼성전자 AI구독 KB카드' },
                              { label: '우리카드', fullName: '삼성전자 AI구독 우리카드' },
                              { label: '하나카드', fullName: '삼성전자 AI구독 하나카드' },
                              { label: '롯데카드', fullName: '구독엔로카 AMEX' }
                            ].map((card) => (
                              <button
                                key={card.label}
                                type="button"
                                onClick={() => handleSelectCardPresetForCard(cardItem.id, card.fullName)}
                                style={{
                                  padding: '0.16rem 0.42rem',
                                  borderRadius: '5px',
                                  border: cardItem.cardName === card.fullName ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.12)',
                                  background: cardItem.cardName === card.fullName ? 'rgba(59, 130, 246, 0.35)' : 'rgba(255,255,255,0.04)',
                                  color: '#e2e8f0',
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                {card.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={cardItem.cardName}
                          onChange={(e) => handleUpdateCard(cardItem.id, { cardName: e.target.value })}
                          placeholder="카드 이름 직접 입력 (예: 삼성전자 AI구독 삼성카드 / 구독엔로카 AMEX)"
                          style={{
                            ...textInputStyle,
                            padding: '0.54rem 0.75rem',
                            fontSize: '0.88rem',
                            background: 'rgba(15, 23, 42, 0.75)'
                          }}
                        />

                        {isNonSamsung && (
                          <div
                            style={{
                              marginTop: '0.4rem',
                              padding: '0.55rem 0.7rem',
                              borderRadius: '9px',
                              background: 'rgba(245, 158, 11, 0.14)',
                              border: '1px solid rgba(251, 191, 36, 0.45)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.55rem'
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: '#fde68a',
                                fontWeight: 700,
                                lineHeight: 1.45
                              }}
                            >
                              <div>⚠️ <strong>카드 선택 시 주의사항:</strong> 삼성카드 외 타 카드사는 기존 카드 보유회원 혜택 제외</div>
                              <div style={{ color: '#fef08a', marginTop: '2px', textDecoration: 'underline' }}>
                                (비회원 또는 최근 6개월간 결제이력이 없는 고객에 한함)
                              </div>
                            </div>

                            {/* QR 이벤트 대상 확인 */}
                            {(() => {
                              const matchedItem = CARD_EVENT_QR_ITEMS.find((item) =>
                                cardTrimmed.includes(item.matchKeyword)
                              );
                              if (!matchedItem) return null;
                              return (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '0.65rem',
                                    padding: '0.55rem 0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(59, 130, 246, 0.18)',
                                    border: '1px solid rgba(96, 165, 250, 0.75)'
                                  }}
                                >
                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#93c5fd' }}>
                                      📱 {matchedItem.title}
                                    </div>
                                    <div style={{ fontSize: '0.71rem', color: '#cbd5e1', marginTop: '0.2rem', lineHeight: 1.35 }}>
                                      우측 QR코드를 스캔하시면 해당 카드의 프로모션 이벤트 대상 여부를 즉시 확인하실 수 있습니다.
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                                      <button
                                        type="button"
                                        onClick={() => setActiveQrModalItem(matchedItem)}
                                        style={{
                                          padding: '0.22rem 0.55rem',
                                          borderRadius: '5px',
                                          border: '1px solid rgba(96, 165, 250, 0.5)',
                                          background: 'rgba(59, 130, 246, 0.28)',
                                          color: '#dbeafe',
                                          fontSize: '0.72rem',
                                          fontWeight: 700,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        🔍 QR 크게보기
                                      </button>
                                      <a
                                        href={matchedItem.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                          padding: '0.22rem 0.5rem',
                                          fontSize: '0.72rem',
                                          color: '#60a5fa',
                                          fontWeight: 700,
                                          textDecoration: 'underline',
                                          display: 'inline-flex',
                                          alignItems: 'center'
                                        }}
                                      >
                                        링크 직접 열기 ↗
                                      </a>
                                    </div>
                                  </div>

                                  <div
                                    onClick={() => setActiveQrModalItem(matchedItem)}
                                    title="클릭하면 QR코드를 크게 볼 수 있습니다"
                                    style={{
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      gap: '0.2rem'
                                    }}
                                  >
                                    <CardEventQrSvg url={matchedItem.url} size={70} label={matchedItem.title} />
                                    <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>클릭 시 확대</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* 2번째 & 3번째: 필요 실적과 청구할인 나란히 배치 (화면 최적화) */}
                      {subCards.length === 1 && isMultiPeriod && isSamsung ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.1rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#dbeafe' }}>
                              2·3. 구간별 필요 실적 &amp; 월 청구할인 설정
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 600 }}>
                              {cardItem.months ? `직접 입력 (${cardItem.months}개월 적용)` : '약정기간 다구간 자동 계산'}
                            </span>
                          </div>

                          {subSegments.map((seg, idx) => {
                            const segSpendVal =
                              subSegmentSpendOverrides[seg.endMonth] !== undefined
                                ? subSegmentSpendOverrides[seg.endMonth]
                                : idx === 0
                                ? cardItem.minSpend
                                : isSamsung && seg.baseMonthly < 70000
                                ? '30만'
                                : cardItem.minSpend;
                            const deducted = getDeductedSpendDesc(segSpendVal, seg.baseMonthly, cardItem.cardName);
                            const cleanExpected = (segSpendVal && segSpendVal.startsWith('월') ? segSpendVal : `월 ${segSpendVal || ''}`).replace(/\s*사용$/, '') + ' 사용';
                            const isDeducted =
                              checkIsSubFeeRecognizedCard(cardItem.cardName) &&
                              deducted &&
                              deducted !== cleanExpected;
                            const segCardVal = Number(seg.targetCard) || 0;

                            return (
                              <div
                                key={seg.endMonth}
                                style={{
                                  background: 'rgba(15, 23, 42, 0.65)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  borderRadius: '8px',
                                  padding: '0.55rem 0.75rem'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#93c5fd' }}>
                                    {idx === 0
                                      ? `① ${seg.duration}개월간 (1~${seg.endMonth}개월)`
                                      : `② 나머지 ${seg.duration}개월 (${seg.startMonth}~${seg.endMonth}개월)`}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 600 }}>
                                    구독료: <strong style={{ color: '#ffffff' }}>{formatWon(seg.baseMonthly)}</strong>/월
                                  </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.65rem' }}>
                                  <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dbeafe', marginBottom: '0.2rem' }}>
                                      2. 필요 실적 (전월 실적)
                                    </div>
                                    <input
                                      type="text"
                                      value={segSpendVal}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (isSamsung && seg.baseMonthly < 70000 && isSpend70kOrMore(val)) {
                                          alert(`삼성카드는 해당 구간 월 구독료가 7만원 미만(${formatWon(seg.baseMonthly)})일 때 70만원 실적(26,000원 할인)을 적용할 수 없습니다.\n30만원 실적(16,000원 할인) 구간으로 적용됩니다.`);
                                          handleSegmentSpendOverride(seg.endMonth, '30만', idx === 0);
                                          handleSegmentCardOverride(seg.endMonth, 16000, idx === 0);
                                          return;
                                        }
                                        handleSegmentSpendOverride(seg.endMonth, val, idx === 0);
                                      }}
                                      placeholder={idx === 0 ? '예: 70만 / 50만' : '예: 30만 / 50만'}
                                      style={{
                                        ...textInputStyle,
                                        padding: '0.45rem 0.65rem',
                                        fontSize: '0.85rem',
                                        background: 'rgba(15, 23, 42, 0.85)',
                                        border: isSamsung && seg.baseMonthly < 70000 && isSpend70kOrMore(segSpendVal)
                                          ? '1px solid #ef4444'
                                          : textInputStyle.border
                                      }}
                                    />
                                    {isSamsung && seg.baseMonthly < 70000 && (
                                      <div style={{ fontSize: '0.71rem', color: '#f87171', marginTop: '0.2rem', fontWeight: 600 }}>
                                        ⚠️ 구독료 7만원 미만 구간: 70만원 실적 불가 (30만/1.6만 전용)
                                      </div>
                                    )}
                                    {isDeducted && (
                                      <div style={{ fontSize: '0.71rem', color: '#38bdf8', marginTop: '0.2rem', fontWeight: 600 }}>
                                        ✓ 실적인정 차감: {deducted}
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dbeafe', marginBottom: '0.2rem' }}>
                                      3. 월 청구할인 금액
                                    </div>
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={segCardVal === 0 ? '' : segCardVal.toLocaleString('ko-KR')}
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, '');
                                        const numVal = raw ? parseInt(raw, 10) : 0;
                                        if (isSamsung && seg.baseMonthly < 70000 && numVal > 16000) {
                                          alert(`삼성카드는 월 구독료가 7만원 미만(${formatWon(seg.baseMonthly)})일 때 최대 16,000원(30만원 실적)까지만 청구할인 가능합니다.`);
                                          handleSegmentCardOverride(seg.endMonth, 16000, idx === 0);
                                          return;
                                        }
                                        handleSegmentCardOverride(seg.endMonth, numVal, idx === 0);
                                      }}
                                      placeholder="예: 26,000 / 16,000"
                                      style={{
                                        ...textInputStyle,
                                        padding: '0.45rem 0.65rem',
                                        fontSize: '0.85rem',
                                        background: 'rgba(15, 23, 42, 0.85)',
                                        border: isSamsung && seg.baseMonthly < 70000 && segCardVal > 16000
                                          ? '1px solid #ef4444'
                                          : textInputStyle.border
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        (() => {
                          const availableModels = isMixedMode ? mixedSubItems : activePlans;
                          const totalModelsCount = availableModels.length;
                          const selectedIndices = getCardSelectedIndices(cardItem, cardIdx, totalModelsCount, isSingleCardMode);
                          const selectedItems = selectedIndices.map((i) => availableModels[i]).filter(Boolean);
                          const pFee = isMixedMode
                            ? selectedItems.reduce((sum, item) => sum + getItemMonthly(item) * getSubQty(item.quantity), 0)
                            : selectedItems.reduce((sum, item) => sum + (item.rowMonthly || 0), 0);
                          const isSamsungFeeUnder70k = isSamsung && pFee < 70000;
                          const deducted = getDeductedSpendDesc(cardItem.minSpend, pFee, cardItem.cardName);
                          const cleanExpected = (cardItem.minSpend && cardItem.minSpend.startsWith('월') ? cardItem.minSpend : `월 ${cardItem.minSpend || ''}`).replace(/\s*사용$/, '') + ' 사용';
                          const isDeducted =
                            checkIsSubFeeRecognizedCard(cardItem.cardName) &&
                            deducted &&
                            deducted !== cleanExpected;

                          return (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                              <div>
                                <div style={{ marginBottom: '0.28rem' }}>
                                  <span style={{ fontSize: '0.79rem', fontWeight: 700, color: '#dbeafe' }}>2. 필요 실적 (전월 실적)</span>
                                </div>
                                <input
                                  type="text"
                                  value={cardItem.minSpend}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (isSamsungFeeUnder70k && isSpend70kOrMore(val)) {
                                      alert(`삼성카드는 적용 모델의 월 구독료가 7만원 미만(${formatWon(pFee)})일 경우 70만원 실적(26,000원 할인)을 적용할 수 없습니다.\n30만원 실적(16,000원 할인)으로 자동 변경됩니다.`);
                                      handleUpdateCard(cardItem.id, {
                                        minSpend: '30만',
                                        monthly: Math.min(Number(cardItem.monthly) || 16000, 16000)
                                      });
                                      if (cardIdx === 0) setSubSegmentSpendOverrides({});
                                      return;
                                    }
                                    handleUpdateCard(cardItem.id, { minSpend: val });
                                    if (cardIdx === 0) setSubSegmentSpendOverrides({});
                                  }}
                                  placeholder="필요 실적 직접 입력 (예: 50만 / 30만원)"
                                  style={{
                                    ...textInputStyle,
                                    padding: '0.54rem 0.75rem',
                                    fontSize: '0.88rem',
                                    background: 'rgba(15, 23, 42, 0.75)',
                                    border: isSamsungFeeUnder70k && isSpend70kOrMore(cardItem.minSpend)
                                      ? '1px solid #ef4444'
                                      : textInputStyle.border
                                  }}
                                />
                                {isSamsungFeeUnder70k && (
                                  <div style={{ fontSize: '0.71rem', color: '#f87171', marginTop: '0.24rem', fontWeight: 600 }}>
                                    ⚠️ 적용 구독료 7만원 미만({formatWon(pFee)}): 70만원 실적 불가 (30만/1.6만 할인 제한)
                                  </div>
                                )}
                                {isDeducted && (
                                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '0.24rem', fontWeight: 600 }}>
                                    ✓ 구독료 실적 인정 반영(견적서 노출): {deducted}
                                  </div>
                                )}
                              </div>

                              <div>
                                <div style={{ marginBottom: '0.28rem' }}>
                                  <span style={{ fontSize: '0.79rem', fontWeight: 700, color: '#dbeafe' }}>3. 월 청구할인 금액</span>
                                </div>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={
                                    (Number(cardItem.monthly) || 0) === 0
                                      ? ''
                                      : (Number(cardItem.monthly) || 0).toLocaleString('ko-KR')
                                  }
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    const val = raw ? parseInt(raw, 10) : 0;
                                    if (isSamsungFeeUnder70k && val > 16000) {
                                      alert(`삼성카드는 적용 모델의 월 구독료가 7만원 미만(${formatWon(pFee)})일 경우 최대 16,000원(30만원 실적)까지만 청구할인 가능합니다.`);
                                      handleUpdateCard(cardItem.id, { monthly: 16000 });
                                      if (cardIdx === 0) setSubSegmentCardOverrides({});
                                      return;
                                    }
                                    handleUpdateCard(cardItem.id, { monthly: val });
                                    if (cardIdx === 0) setSubSegmentCardOverrides({});
                                  }}
                                  placeholder="월 청구할인 금액 직접 입력 (예: 26,000 / 16,000)"
                                  style={{
                                    ...textInputStyle,
                                    padding: '0.54rem 0.75rem',
                                    fontSize: '0.88rem',
                                    background: 'rgba(15, 23, 42, 0.75)',
                                    border: isSamsungFeeUnder70k && (Number(cardItem.monthly) || 0) > 16000
                                      ? '1px solid #ef4444'
                                      : textInputStyle.border
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  );
                }))}
              </div>

              {/* 제휴카드 수동 추가 버튼 (카드가 존재할 때 복수 카드 추가) */}
              {subCards.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleAddCard()}
                  style={{
                    marginTop: '0.65rem',
                    width: '100%',
                    padding: '0.52rem 0.8rem',
                    borderRadius: '9px',
                    border: '1px dashed rgba(96, 165, 250, 0.55)',
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#93c5fd',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Plus size={15} /> 제휴카드 추가 (품목별 제휴카드 중복할인 적용 시)
                </button>
              )}

              {/* 카드사 이벤트 대상 확인 QR 확대 모달 (전역 공통) */}
              {activeQrModalItem && (
                <div
                  onClick={() => setActiveQrModalItem(null)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    background: 'rgba(2, 6, 23, 0.82)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem'
                  }}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: '#0f172a',
                      border: '2px solid #60a5fa',
                      borderRadius: '18px',
                      padding: '1.6rem 1.8rem',
                      maxWidth: '360px',
                      width: '100%',
                      textAlign: 'center',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#60a5fa', marginBottom: '0.3rem' }}>
                      {activeQrModalItem.badge}
                    </div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', marginBottom: '0.4rem' }}>
                      {activeQrModalItem.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem', lineHeight: 1.45 }}>
                      스마트폰 카메라로 아래 QR코드를 스캔하시면<br />
                      <strong style={{ color: '#fde68a' }}>프로모션 이벤트 대상 여부</strong>를 즉시 확인하실 수 있습니다.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                      <CardEventQrSvg url={activeQrModalItem.url} size={210} label={activeQrModalItem.title} />
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '1rem' }}>
                      ※ 비회원 또는 최근 6개월간 해당 카드 결제이력이 없는 고객 한함
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <a
                        href={activeQrModalItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.55rem 1rem',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid #60a5fa',
                          color: '#93c5fd',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        페이지 직접 열기 ↗
                      </a>
                      <button
                        type="button"
                        onClick={() => setActiveQrModalItem(null)}
                        style={{
                          padding: '0.55rem 1.2rem',
                          borderRadius: '8px',
                          background: '#3b82f6',
                          border: 'none',
                          color: 'white',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 삼성AI구독 혜택(캐시백) - 특별 강조 UI */}
            {!isMixedMode && (
              <div
                style={{
                  marginBottom: '1rem',
                  padding: '0.9rem 1.05rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.35) 0%, rgba(14, 165, 233, 0.2) 100%)',
                  border: '2px solid #38bdf8',
                  boxShadow: '0 0 18px rgba(56, 189, 248, 0.25)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <Sparkles size={18} color="#fde68a" />
                    <label style={{ ...labelStyle, fontSize: '0.96rem', fontWeight: 900, color: '#f0f9ff', marginBottom: 0 }}>
                      🎁 삼성AI구독 혜택 (캐시백,차차월 5~7일)
                    </label>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '5px', background: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8', border: '1px solid #38bdf8' }}>
                      ★ 고객 체감가 직접 차감 혜택
                    </span>
                  </div>
                  {Number(subPurchaseBenefit) > 0 && (
                    <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#67e8f9' }}>
                      - {formatWon(subPurchaseBenefit)} 즉시 차감
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '0.5rem' }}>
                  <MoneyInput
                    value={subPurchaseBenefit}
                    onChange={setSubPurchaseBenefit}
                    placeholder="삼성AI구독 캐시백 금액 입력 (차차월 5~7일 지급, 예: 200,000)"
                    compact
                    accentColor="#38bdf8"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                    ※ 구독 가입 시 지급되는 현금성 캐시백(차차월 5~7일 지급) 혜택을 입력하시면 고객 체감가에서 즉시 차감됩니다.
                  </span>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {[100000, 200000, 300000, 500000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSubPurchaseBenefit((prev) => (Number(prev) || 0) + amt)}
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '5px',
                          border: '1px solid rgba(56, 189, 248, 0.45)',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#bae6fd',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        +{amt / 10000}만
                      </button>
                    ))}
                    {Number(subPurchaseBenefit) > 0 && (
                      <button
                        type="button"
                        onClick={() => setSubPurchaseBenefit(0)}
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '5px',
                          border: '1px solid rgba(248, 113, 113, 0.45)',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#fca5a5',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        초기화
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 구독 실시간 요약 박스 */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1.15rem',
              borderRadius: '14px',
              background: 'rgba(59, 130, 246, 0.14)',
              border: '1px solid rgba(96, 165, 250, 0.4)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.28rem', color: '#cbd5e1' }}>
              <span>{isMixedMode ? '1. 할인전 구독총금액' : '총 구독 기준금액'}</span>
              <span>{formatWon(isMixedMode ? mixedSubGrossTotal : subGrossTotal)}</span>
            </div>
            {isMixedMode ? (
              <>
                {mixedSubFeeDiscountTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.28rem', color: '#93c5fd' }}>
                    <span>2. 구독료 할인 (기준총액 대비 차액)</span>
                    <strong style={{ color: '#60a5fa' }}>- {formatWon(mixedSubFeeDiscountTotal)}</strong>
                  </div>
                )}
                {mixedSubPrepayTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.28rem', color: '#cbd5e1' }}>
                    <span>3. 선납금 합계 (초기 일시불)</span>
                    <strong style={{ color: '#fde68a' }}>{formatWon(mixedSubPrepayTotal)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.28rem', color: '#cbd5e1' }}>
                  <span>
                    {mixedSubPrepayTotal > 0 ? '4. ' : ''}구독료 합계 (월 {formatWon(mixedSubMonthlyFeeTotal)} × {mixedSubPeriodSummary}개월)
                  </span>
                  <strong style={{ color: '#e2e8f0' }}>
                    {formatWon(mixedSubMonthlyTotalSum)}
                    {mixedSubPrepayTotal > 0 ? ` (선납포함 ${formatWon(mixedSubDiscountedGrossTotal)})` : ''}
                  </strong>
                </div>
                {subCardTotalDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.28rem', color: '#93c5fd' }}>
                    <span>• 제휴카드 청구할인 ({cardCompanySummary || '제휴카드'})</span>
                    <strong style={{ color: '#60a5fa' }}>- {formatWon(subCardTotalDiscount)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.28rem', color: '#cbd5e1' }}>
                  <span>{subCardTotalDiscount > 0 ? '• 제휴카드 적용 월 실납부액' : '• 월 실납부액'}</span>
                  <strong style={{ color: 'white' }}>월 {formatWon(mixedSubMonthlyAfterCard)}</strong>
                </div>
                {mixedSubServiceBenefit > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: '0.45rem', color: '#6ee7b7' }}>
                    <span>
                      • 구독 혜택 {includeServiceInFinal ? '(체감가 반영)' : ''}
                    </span>
                    <strong>{formatWon(mixedSubServiceBenefit)} 상당</strong>
                  </div>
                )}
              </>
            ) : isMultiPeriod ? (
              subSegments.map((seg, idx) => (
                <div
                  key={seg.endMonth}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '0.24rem' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <strong style={{ color: '#f8fafc', fontWeight: 800 }}>
                      {idx === 0
                        ? `${seg.duration}개월간 월 실납부액`
                        : `나머지 ${seg.duration}개월 월 실납부액`}
                    </strong>
                    <span style={{ fontSize: '0.70rem', color: '#94a3b8', fontWeight: 500 }}>
                      ({idx === 0 ? `1~${seg.endMonth}개월` : `${seg.startMonth}~${seg.endMonth}개월`})
                    </span>
                  </span>
                  <strong style={{ color: 'white', fontSize: '0.94rem', fontWeight: 900 }}>월 {formatWon(seg.netMonthly)}</strong>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', marginBottom: '0.28rem' }}>
                <strong style={{ color: '#f8fafc', fontWeight: 800 }}>{subCardTotalDiscount > 0 ? '제휴카드 적용 월 실납부액' : '월 실납부액'}</strong>
                <strong style={{ color: 'white', fontSize: '0.94rem', fontWeight: 900 }}>월 {formatWon(subMonthlyAfterCard)}</strong>
              </div>
            )}
            {!isMixedMode && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', marginBottom: '0.45rem', color: '#cbd5e1' }}>
                  <strong style={{ color: '#cbd5e1', fontWeight: 700 }}>총 할인 합계</strong>
                  <strong style={{ color: '#93c5fd', fontSize: '0.94rem', fontWeight: 900 }}>- {formatWon(subTotalBenefitSum)}</strong>
                </div>
                {includeServiceInFinal && subServiceTotal > 0 && (
                  isCombinedFreeService ? (
                    <>
                      {applianceFreeServiceAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.81rem', marginBottom: '0.22rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <strong style={{ color: '#6ee7b7', fontWeight: 800 }}>• 무상수리 연장</strong>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>(가전 {applianceFreeServiceQuantity}대)</span>
                          </span>
                          <strong style={{ color: '#6ee7b7', fontWeight: 800 }}>{formatWon(applianceFreeServiceAmount)} 상당</strong>
                        </div>
                      )}
                      {mobileFreeServiceAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.81rem', marginBottom: '0.22rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <strong style={{ color: '#38bdf8', fontWeight: 800 }}>• 모바일 무상수리+파손보험</strong>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>({mobileFreeServiceQuantity}대)</span>
                          </span>
                          <strong style={{ color: '#38bdf8', fontWeight: 800 }}>{formatWon(mobileFreeServiceAmount)} 상당</strong>
                        </div>
                      )}
                      {subCareServiceAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.81rem', marginBottom: '0.45rem' }}>
                          <strong style={{ color: '#6ee7b7', fontWeight: 800 }}>• 케어서비스 혜택</strong>
                          <strong style={{ color: '#6ee7b7', fontWeight: 800 }}>{formatWon(subCareServiceAmount)} 상당</strong>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.81rem', marginBottom: '0.45rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <strong style={{ color: '#6ee7b7', fontWeight: 800 }}>무상·케어 서비스 혜택</strong>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>{hasAnyFreeServiceMobile ? '(무상수리+파손보험)' : '(체감가 반영)'}</span>
                      </span>
                      <strong style={{ color: '#6ee7b7', fontWeight: 800 }}>{formatWon(subServiceTotal)} 상당</strong>
                    </div>
                  )
                )}
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.55rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.25 }}>
                <span>{isMixedMode ? '구독 체감 소계 (기준가 - 혜택)' : '삼성AI구독 최종 체감가'}</span>
                {!isMixedMode && subPrepay > 0 && (
                  <span style={{ fontSize: '0.68rem', color: '#93c5fd', fontWeight: 600, marginTop: '2px' }}>
                    (선납금포함)
                  </span>
                )}
              </span>
              <strong style={{ fontSize: '1.55rem', fontWeight: 900, color: '#60a5fa' }}>
                {formatWon(isMixedMode ? mixedSubFinalPrice : subFinalPrice)}
              </strong>
            </div>
          </div>
        </div>

        {/* ==================== 3단계: 통합 캐시백 및 상품권 카드 (혼합 모드 전용) ==================== */}
        {isMixedMode && (
          <div
            className="glass-panel calc-no-hover"
            style={{
              padding: '1.6rem',
              borderTop: '4px solid #10b981',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(6, 78, 59, 0.25))',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              order: 3
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', letterSpacing: '1px' }}>
                PART 3 · 통합 공통 정책
              </span>
              <h3 style={{ fontSize: '1.38rem', fontWeight: 800, color: '#a7f3d0' }}>
                🎁 3. 통합 캐시백 &amp; 상품권 지급 설정
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                일반구매와 삼성AI구독을 복합 진행할 때 일괄 지급되는 전체 캐시백 및 상품권을 통합 관리합니다.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {/* 1) 캐시백 항목군 목록 */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  borderRadius: '12px',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <label style={{ ...labelStyle, fontSize: '0.92rem', color: '#93c5fa', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontWeight: 800 }}>
                    <Sparkles size={16} style={{ color: '#60a5fa' }} /> 캐시백 지급 항목 ({mixedCashbackItems.length}건)
                  </label>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#60a5fa' }}>
                    소계: {formatWon(mixedTotalCashback)}
                  </span>
                </div>

                {/* 캐시백 항목 리스트 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {mixedCashbackItems.map((cb, idx) => {
                    const defaultName = mixedEventType === 'normal' ? '통합 캐시백' : `${eventPrefix}캐시백`;
                    const currentTitle = (cb.name || '').trim() || defaultName;
                    return (
                      <div
                        key={cb.id}
                        style={{
                          background: 'rgba(30, 58, 138, 0.18)',
                          border: '1px solid rgba(59, 130, 246, 0.28)',
                          borderRadius: '10px',
                          padding: '0.65rem 0.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem'
                        }}
                      >
                        {/* 상단: 사유 입력 + 금액 입력 + 삭제 버튼 */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1.2 1 140px' }}>
                            <input
                              type="text"
                              value={cb.name}
                              onChange={(e) => handleUpdateMixedCashbackItem(cb.id, 'name', e.target.value)}
                              placeholder={`이벤트/사유 (예: ${idx === 0 ? defaultName : '카드 추가 캐시백'})`}
                              style={{ ...textInputStyle, padding: '0.45rem 0.7rem', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div style={{ flex: '1 1 130px' }}>
                            <MoneyInput
                              value={cb.amount}
                              onChange={(val) => handleUpdateMixedCashbackItem(cb.id, 'amount', val)}
                              placeholder="캐시백 금액"
                              compact
                              accentColor="#60a5fa"
                            />
                          </div>
                          {mixedCashbackItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMixedCashbackItem(cb.id)}
                              title="캐시백 항목 삭제"
                              style={{
                                width: '28px',
                                height: '28px',
                                padding: 0,
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#fca5a5',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* 하단: 서류 증빙 조건 체크박스 + 미리보기 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', paddingTop: '0.15rem' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', background: cb.hasProof ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.05)', border: cb.hasProof ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.15)', padding: '0.18rem 0.5rem', borderRadius: '5px' }}>
                            <input
                              type="checkbox"
                              checked={cb.hasProof}
                              onChange={(e) => handleUpdateMixedCashbackItem(cb.id, 'hasProof', e.target.checked)}
                              style={{ accentColor: '#10b981', cursor: 'pointer', width: '13px', height: '13px' }}
                            />
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: cb.hasProof ? '#6ee7b7' : '#94a3b8' }}>
                              ✓ 서류 증빙 조건 (증빙완료시)
                            </span>
                          </label>

                          {(Number(cb.amount) || 0) > 0 && (
                            <div style={{ fontSize: '0.76rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ color: '#60a5fa', fontWeight: 700 }}>견적서:</span>
                              <span>★ {currentTitle} -{formatWon(cb.amount)}</span>
                              {cb.hasProof && (
                                <span className="a4-proof-tag" style={{ margin: 0 }}>증빙완료시</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 캐시백 추가 버튼 */}
                <button
                  type="button"
                  onClick={handleAddMixedCashbackItem}
                  style={{
                    width: '100%',
                    padding: '0.48rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px dashed rgba(59, 130, 246, 0.5)',
                    background: 'rgba(59, 130, 246, 0.08)',
                    color: '#93c5fa',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s'
                  }}
                >
                  <Plus size={14} /> 캐시백 항목 추가
                </button>
              </div>

              {/* 2) 상품권 항목군 목록 */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(212, 175, 55, 0.35)',
                  borderRadius: '12px',
                  padding: '1.1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <label style={{ ...labelStyle, fontSize: '0.92rem', color: 'var(--accent-gold-light)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontWeight: 800 }}>
                    <Award size={16} style={{ color: 'var(--accent-gold)' }} /> 지급 상품권 항목 ({mixedVoucherItems.length}건)
                  </label>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--accent-gold-light)' }}>
                    소계: {formatWon(mixedTotalVoucher)}
                  </span>
                </div>

                {/* 상품권 항목 리스트 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {mixedVoucherItems.map((vc, idx) => {
                    const defaultName = mixedEventType === 'normal' ? '모바일/지류 상품권' : `${eventPrefix} 상품권`;
                    const currentTitle = (vc.name || '').trim() || defaultName;
                    return (
                      <div
                        key={vc.id}
                        style={{
                          background: 'rgba(212, 175, 55, 0.08)',
                          border: '1px solid rgba(212, 175, 55, 0.28)',
                          borderRadius: '10px',
                          padding: '0.65rem 0.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem'
                        }}
                      >
                        {/* 상단: 상품권 종류/사유 입력 + 금액 입력 + 삭제 버튼 */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1.2 1 140px' }}>
                            <input
                              type="text"
                              value={vc.name}
                              onChange={(e) => handleUpdateMixedVoucherItem(vc.id, 'name', e.target.value)}
                              placeholder={`상품권 종류/사유 (예: ${idx === 0 ? defaultName : '신세계/롯데 모바일상품권'})`}
                              style={{ ...textInputStyle, padding: '0.45rem 0.7rem', fontSize: '0.85rem' }}
                            />
                          </div>
                          <div style={{ flex: '1 1 130px' }}>
                            <MoneyInput
                              value={vc.amount}
                              onChange={(val) => handleUpdateMixedVoucherItem(vc.id, 'amount', val)}
                              placeholder="상품권 금액"
                              compact
                              accentColor="#fcd34d"
                            />
                          </div>
                          {mixedVoucherItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMixedVoucherItem(vc.id)}
                              title="상품권 항목 삭제"
                              style={{
                                width: '28px',
                                height: '28px',
                                padding: 0,
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#fca5a5',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* 하단: 서류 증빙 조건 체크박스 + 미리보기 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', paddingTop: '0.15rem' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', background: vc.hasProof ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.05)', border: vc.hasProof ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.15)', padding: '0.18rem 0.5rem', borderRadius: '5px' }}>
                            <input
                              type="checkbox"
                              checked={vc.hasProof}
                              onChange={(e) => handleUpdateMixedVoucherItem(vc.id, 'hasProof', e.target.checked)}
                              style={{ accentColor: '#10b981', cursor: 'pointer', width: '13px', height: '13px' }}
                            />
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: vc.hasProof ? '#6ee7b7' : '#94a3b8' }}>
                              ✓ 서류 증빙 조건 (증빙완료시)
                            </span>
                          </label>

                          {(Number(vc.amount) || 0) > 0 && (
                            <div style={{ fontSize: '0.76rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ color: '#fcd34d', fontWeight: 700 }}>견적서:</span>
                              <span>★ {currentTitle} +{formatWon(vc.amount)} 상당</span>
                              {vc.hasProof && (
                                <span className="a4-proof-tag" style={{ margin: 0 }}>증빙완료시</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 상품권 추가 버튼 */}
                <button
                  type="button"
                  onClick={handleAddMixedVoucherItem}
                  style={{
                    width: '100%',
                    padding: '0.48rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px dashed rgba(212, 175, 55, 0.5)',
                    background: 'rgba(212, 175, 55, 0.08)',
                    color: 'var(--accent-gold-light)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s'
                  }}
                >
                  <Plus size={14} /> 상품권 항목 추가
                </button>
              </div>
            </div>

            {/* 통합 혜택 합산 바 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.6rem',
                padding: '0.85rem 1.1rem',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.35)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.84rem', color: '#a7f3d0', fontWeight: 700 }}>
                  통합 현금성 혜택(캐시백 + 상품권) 합계:
                </span>
                <strong style={{ fontSize: '1.15rem', color: '#6ee7b7', fontWeight: 900, marginLeft: '8px' }}>
                  {formatWon(mixedTotalCashback + mixedTotalVoucher)}
                </strong>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                💡 초기 실결제액({formatWon(mixedInitialPayment)}) 산정 시 즉시 차감 반영됩니다.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3) 출력 옵션 & 상담 메모 영역 */}
      <div className="glass-panel calc-no-hover" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* 추천 플랜 강조 방식 */}
          {!isMixedMode && (
          <div>
            <label style={{ ...labelStyle, fontSize: '0.95rem', color: 'white', marginBottom: '0.65rem' }}>
              <Sparkles size={15} style={{ verticalAlign: 'middle', marginRight: '0.35rem', color: 'var(--accent-gold)' }} />
              비교 결과 상단 추천 플랜 강조 방식
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'auto', label: '자동 분석 (유리한 쪽 강조)' },
                { id: 'sub', label: '삼성AI구독 추천' },
                { id: 'lump', label: '일반구매 추천' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRecommendMode(opt.id)}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    border: recommendMode === opt.id ? '1px solid var(--accent-gold)' : '1px solid var(--glass-border)',
                    background: recommendMode === opt.id ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.04)',
                    color: recommendMode === opt.id ? 'var(--accent-gold-light)' : 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* 상담 메모 & 매장 주소 */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.85rem' }}>
            <div>
              <label style={{ ...labelStyle, fontSize: '0.95rem', color: 'white' }}>고객 맞춤 상담 메모 (출력물 하단 표시)</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 삼성 제휴카드 월 30만원 이용 기준 할인 적용 / 입주 예정일에 맞춰 희망 배송일 지정 가능"
                style={{
                  ...textInputStyle,
                  minHeight: '118px',
                  resize: 'vertical',
                  lineHeight: 1.6
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>하단 명함 매장 위치 문구 (자동저장)</label>
              <input
                type="text"
                value={storeInfo}
                onChange={(e) => setStoreInfo(e.target.value)}
                style={textInputStyle}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 실시간 하단 비교 요약 바 + 비교 결과 보기 CTA 버튼 */}
      <div
        className="glass-panel calc-no-hover"
        style={{
          padding: '1.4rem 1.8rem',
          border: '2px solid var(--accent-gold)',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.92))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.2rem'
        }}
      >
        <div>
          {isMixedMode ? (
            <>
              <div style={{ fontSize: '0.82rem', color: 'var(--accent-gold-light)', fontWeight: 700, marginBottom: '0.25rem' }}>
                실시간 복합 견적 요약 (일반구매 + 삼성AI구독)
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
                <span>
                  일반구매: <strong style={{ color: 'var(--accent-gold-light)' }}>{formatWon(mixedLumpSubFinal)}</strong>
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>+</span>
                <span>
                  삼성AI구독: <strong style={{ color: '#60a5fa' }}>{formatWon(mixedSubFinalPrice)}</strong>{' '}
                  <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>
                    (월 실납부 {formatWon(mixedSubMonthlyAfterCard)})
                  </span>
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>=</span>
                <span>
                  총 체감가: <strong style={{ color: 'white', fontSize: '1.25rem' }}>{formatWon(mixedGrandFinal)}</strong>
                </span>
                {mixedGrandBenefit > 0 && (
                  <span
                    style={{
                      padding: '0.25rem 0.7rem',
                      borderRadius: '100px',
                      background: 'rgba(16, 185, 129, 0.22)',
                      border: '1px solid #34d399',
                      fontSize: '0.84rem',
                      color: 'white'
                    }}
                  >
                    총 할인 합계 - {formatWon(mixedGrandBenefit)} ({mixedGrandBenefitRate}%)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.35rem' }}>
                초기 일시불 실결제: <strong>{formatWon(mixedInitialPayment)}</strong> (일반구매 {formatWon(mixedLumpSubFinal)}
                {mixedSubPrepayTotal > 0 ? ` + 선납금 ${formatWon(mixedSubPrepayTotal)}` : ''}
                {mixedTotalCashback > 0 ? ` - 캐시백 ${formatWon(mixedTotalCashback)}${validMixedCashbackItems.length > 1 ? `(${validMixedCashbackItems.length}건)` : ''}` : ''}
                {mixedTotalVoucher > 0 ? ` - 상품권 ${formatWon(mixedTotalVoucher)}${validMixedVoucherItems.length > 1 ? `(${validMixedVoucherItems.length}건)` : ''}` : ''})
              </div>
            </>
          ) : (
          <>
          <div style={{ fontSize: '0.82rem', color: 'var(--accent-gold-light)', fontWeight: 700, marginBottom: '0.25rem' }}>
            실시간 최종 체감가 비교 요약 (일반구매 일시불 조건 대비)
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
            <span>
              일반구매(일시불): <strong style={{ color: 'var(--accent-gold-light)' }}>{formatWon(lumpFinalPrice)}</strong>{' '}
              <span style={{ fontSize: '0.82rem', color: '#fca5a5' }}>
                ({subMonths}개월 할부 시 총 {formatWon(lumpInstallment.totalPayment)})
              </span>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>vs</span>
            <span>
              삼성AI구독: <strong style={{ color: '#60a5fa' }}>{formatWon(subFinalPrice)}</strong>{' '}
              <span style={{ fontSize: '0.85rem', color: '#93c5fd' }}>
                {isMultiPeriod
                  ? `(${subSegments
                      .map((seg, idx) =>
                        idx === 0
                          ? `${seg.duration}개월 월 ${formatWon(seg.netMonthly)}`
                          : `잔여 ${seg.duration}개월 월 ${formatWon(seg.netMonthly)}`
                      )
                      .join(' → ')})`
                  : `(월 실납부 ${formatWon(subMonthlyAfterCard)})`}
              </span>
            </span>
            {absDiff > 0 && (
              <span
                style={{
                  padding: '0.25rem 0.7rem',
                  borderRadius: '100px',
                  background: rawDiff > 0 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(212, 175, 55, 0.22)',
                  border: rawDiff > 0 ? '1px solid #60a5fa' : '1px solid var(--accent-gold)',
                  fontSize: '0.84rem',
                  color: 'white'
                }}
              >
                일시불 대비 차액 {formatWon(absDiff)}
              </span>
            )}
          </div>
          </>
          )}
        </div>

        {/* 삼성카드 실적 유효성 검사 및 견적서 이동 버튼 */}
        <button
          type="button"
          onClick={handleGoToResult}
          className="btn-primary pulse"
          style={{ padding: '1rem 2.2rem', fontSize: '1.1rem' }}
        >
          {isMixedMode ? '스마트 견적서 보기 (A4 출력)' : '비교 결과 보기 (A4 출력)'} <ChevronRight size={20} />
        </button>
      </div>

      {/* 화면 스크롤 시 화면 하단에 항상 따라다니는 플로팅 스마트견적보기 & 견적저장/덮어쓰기 팝업 바 */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: isMixedMode ? '1px solid rgba(16, 185, 129, 0.55)' : '1px solid rgba(212, 175, 55, 0.55)',
          borderRadius: '50px',
          padding: '0.45rem 0.65rem 0.45rem 1.15rem',
          boxShadow: isMixedMode
            ? '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(16, 185, 129, 0.3)'
            : '0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.3)',
          maxWidth: 'calc(100vw - 2rem)',
          width: 'max-content',
          flexWrap: 'wrap'
        }}
      >
        {/* 플로팅 바 상단 실시간 저장 안내 토스트 */}
        {saveNotice && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.96)',
              border: '1.5px solid #10b981',
              color: '#a7f3d0',
              padding: '0.45rem 1.15rem',
              borderRadius: '30px',
              fontSize: '0.82rem',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              boxShadow: '0 6px 22px rgba(0, 0, 0, 0.65), 0 0 16px rgba(16, 185, 129, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              pointerEvents: 'none',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            <CheckCircle2 size={15} style={{ color: '#34d399' }} />
            <span>{saveNotice}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: isMixedMode ? '#10b981' : '#d4af37',
              boxShadow: isMixedMode ? '0 0 8px #10b981' : '0 0 8px #d4af37',
              display: 'inline-block',
              flexShrink: 0
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
              {customerName ? `${customerName} 고객님` : (isMixedMode ? '2번 스마트 견적서' : '1번 구독비교 견적서')}
            </span>
            <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#f1f5f9' }}>
              {isMixedMode ? (
                <>
                  {validMixedSubItems.length > 0 && <span style={{ color: '#34d399', marginRight: '0.35rem' }}>구독 {validMixedSubItems.length}개</span>}
                  <span>월 실납 {formatWon(mixedMonthlyPayment)}</span>
                </>
              ) : (
                <span>실시간 견적 연동 중</span>
              )}
            </span>
          </div>
        </div>

        {/* 견적 저장 및 덮어쓰기 버튼 그룹 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={handleSaveNewQuote}
            title="현재 입력된 견적을 보관함에 새로 저장합니다."
            style={{
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.55)',
              color: '#6ee7b7',
              padding: '0.52rem 0.9rem',
              borderRadius: '50px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.32rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.28)';
              e.currentTarget.style.borderColor = '#34d399';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.16)';
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.55)';
            }}
          >
            <Save size={14} />
            <span>견적 저장</span>
          </button>

          <button
            type="button"
            onClick={handleOverwriteActiveQuote}
            title={activeQuoteId ? '현재 선택된 보관 견적에 수정사항을 덮어씁니다.' : '보관 견적에 덮어쓰거나 수정 저장합니다.'}
            style={{
              background: activeQuoteId ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: activeQuoteId ? '1px solid var(--accent-gold)' : '1px solid var(--glass-border)',
              color: activeQuoteId ? 'var(--accent-gold-light)' : '#e2e8f0',
              padding: '0.52rem 0.9rem',
              borderRadius: '50px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.32rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = activeQuoteId ? 'rgba(212, 175, 55, 0.32)' : 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = activeQuoteId ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.08)';
            }}
          >
            <RotateCcw size={13} />
            <span>덮어쓰기</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleGoToResult}
          className="btn-primary pulse"
          style={{
            background: isMixedMode
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'linear-gradient(135deg, #d4af37, #b8860b)',
            color: '#ffffff',
            border: 'none',
            padding: '0.62rem 1.25rem',
            borderRadius: '50px',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            boxShadow: isMixedMode
              ? '0 4px 14px rgba(16, 185, 129, 0.45)'
              : '0 4px 14px rgba(212, 175, 55, 0.45)',
            whiteSpace: 'nowrap'
          }}
        >
          <Printer size={16} />
          <span>{isMixedMode ? '스마트 견적서 보기 (A4 출력)' : '비교 결과 보기 (A4 출력)'}</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* 직원 전용 캐셔 POS 결제 및 사은행사 지시서 모달 */}
      {renderPosCashierModal()}
    </section>
  );
}

const labelStyle = {
  display: 'block',
  fontSize: '0.83rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '0.4rem'
};

const textInputStyle = {
  width: '100%',
  padding: '0.68rem 0.85rem',
  borderRadius: '10px',
  background: 'rgba(15, 23, 42, 0.75)',
  border: '1px solid var(--glass-border)',
  color: 'white',
  fontSize: '0.92rem',
  outline: 'none'
};
