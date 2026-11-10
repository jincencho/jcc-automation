import React, { useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
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
  ShoppingBag
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
      {numericValue > 0 && (
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: accentColor, marginTop: '0.22rem', fontWeight: 600 }}>
          {formatKoreanCurrencyHint(numericValue)}
        </div>
      )}
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
  { id: 'cp1', text: '계약 기간 전 품목 무상 A/S 서비스 보장', checked: true },
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
      visitCareFee: 0
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

  // 일반구매 결제 채널 및 특정 조건 할인 정책 (백화점 vs 로드샵)
  const [mixedChannelType, setMixedChannelType] = useState('dept'); // 'dept': 백화점 | 'road': 로드샵
  const [mixedDeptDiscount, setMixedDeptDiscount] = useState(0);
  const [mixedDeptDiscountNote, setMixedDeptDiscountNote] = useState('');
  const [mixedDeptDiscountProof, setMixedDeptDiscountProof] = useState(true);

  const [mixedRoadDiscount, setMixedRoadDiscount] = useState(0);
  const [mixedRoadDiscountNote, setMixedRoadDiscountNote] = useState('');
  const [mixedRoadDiscountProof, setMixedRoadDiscountProof] = useState(true);

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
          visitCareFee: 0
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
    { id: 1, name: '', quantity: 1, months: 72, monthlyFee: 0, totalAmount: 0, policyNote: '', policyDiscount: 0 }
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
    { id: 1, monthlyFee: 0, quantity: 1, months: 72 }
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

  const handleAddCard = (defaultMonths) => {
    setSubCards((prev) => {
      const nextId = prev.reduce((maxId, c) => Math.max(maxId, c.id), 0) + 1;
      const targetIdx = prev.length;
      const targetModel = isMixedMode ? mixedSubItems[targetIdx] : subPlans[targetIdx];
      const m = defaultMonths || (targetModel ? Number(targetModel.months) || 72 : (subPlans[prev.length]?.months || 72));
      const firstIsSamsung = checkIsSamsungCard(prev[0]?.cardName || subCardName || '');
      const newCardName = firstIsSamsung ? '구독엔로카 AMEX' : '삼성전자 AI구독 삼성카드';
      const newSpend = firstIsSamsung ? '50만' : '70만';
      const newMonthly = firstIsSamsung ? 16000 : 26000;

      // 1개 카드에서 복수 카드로 확장될 때, 기존 1번 카드는 1번 모델(index 0)에 매핑
      const updatedPrev = prev.map((c, i) => {
        if (i === 0 && (c.targetModelIndex === -1 || c.targetModelIndex === undefined)) {
          const m0 = isMixedMode ? mixedSubItems[0] : subPlans[0];
          const m0Months = Number(m0?.months) || 72;
          return { ...c, targetModelIndex: 0, months: m0Months };
        }
        return c;
      });

      return [
        ...updatedPrev,
        {
          id: nextId,
          cardName: newCardName,
          minSpend: newSpend,
          monthly: newMonthly,
          months: m,
          targetModelIndex: targetIdx,
          segmentCardOverrides: {},
          segmentSpendOverrides: {}
        }
      ];
    });
  };

  const handleRemoveCard = (cardId) => {
    setSubCards((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((c) => c.id !== cardId);
      if (filtered.length === 1) {
        // 단일 카드로 복귀 시 전체 모델 자동 연동(-1)으로 복귀
        filtered[0] = {
          ...filtered[0],
          targetModelIndex: -1,
          months: subMonths
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
      return [...prev, { id: nextId, name: '', quantity: 1, months: nextDefaultMonths, monthlyFee: 0, totalAmount: 0, policyNote: '', policyDiscount: 0 }];
    });

    // 구독료 칸 추가 시: 제휴카드도 추가반영될 수 있도록 슬롯 자동 추가!
    handleAddCard(nextDefaultMonths);
  };

  const handleUpdateSubPlan = (id, patch) => {
    setSubPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
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
    let targetCard = hasManualCardOverride
      ? Number(subSegmentCardOverrides[endMonth]) || 0
      : cardMonthlyNum;

    // 삼성카드의 경우: 구독료 7만원 이상일 때 70만원 실적에 26,000원, 7만원 미만이면 30만원 구간에 16,000원 자동 반영 (70만원 구간 제한)
    if (isSamsungCard) {
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
    const targetIdx = isSingleCard
      ? -1
      : (cardItem?.targetModelIndex !== undefined && cardItem?.targetModelIndex !== null
          ? Number(cardItem.targetModelIndex)
          : (cardIdx < (isMixedMode ? mixedSubItems.length : activePlans.length) ? cardIdx : 0));

    let targetMonthly = 0;
    let targetMonths = subMonths;
    if (isMixedMode) {
      if (targetIdx >= 0 && mixedSubItems[targetIdx]) {
        targetMonthly = getItemMonthly(mixedSubItems[targetIdx]) * getSubQty(mixedSubItems[targetIdx].quantity);
        targetMonths = Number(mixedSubItems[targetIdx].months) || 72;
      } else {
        targetMonthly = mixedSubMonthlyFeeTotal;
        targetMonths = subMonths;
      }
    } else {
      if (targetIdx >= 0 && activePlans[targetIdx]) {
        targetMonthly = activePlans[targetIdx].rowMonthly || 0;
        targetMonths = Number(activePlans[targetIdx].months) || 72;
      } else {
        targetMonthly = effectiveMonthlyBase;
        targetMonths = subMonths;
      }
    }

    const defaultSpend = isSamsung ? (targetMonthly >= 70000 ? '70만' : '30만') : isLotte ? '50만' : '30만';
    const defaultMonthly = isSamsung ? (targetMonthly >= 70000 ? 26000 : 16000) : 16000;

    handleUpdateCard(cardId, {
      cardName: cardFullName,
      minSpend: defaultSpend,
      monthly: defaultMonthly,
      months: targetMonths,
      targetModelIndex: isSingleCard ? -1 : targetIdx,
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
    (c) => (c.cardName && c.cardName.trim()) || (Number(c.monthly) || 0) > 0
  );
  const effectiveCards = activeCards.length > 0 ? activeCards : [subCards[0]];
  const isSingleCardMode = effectiveCards.length === 1;

  // 복수 제휴카드 세부 정보 및 혜택 계산
  const cardDetails = effectiveCards.map((c, cardIdx) => {
    const trimmedName = (c.cardName || '').trim();
    const isSamsung = checkIsSamsungCard(trimmedName);
    const company = getCardCompanyShort(trimmedName);
    const policy = getAffiliateCardPolicy(trimmedName);

    // 대상 구독 모델 매칭 (단일 카드일 때는 전체 모델 자동 반영!)
    const targetIdx = isSingleCardMode
      ? -1
      : ((c.targetModelIndex !== undefined && c.targetModelIndex !== null && Number(c.targetModelIndex) >= 0)
          ? Number(c.targetModelIndex)
          : (cardIdx < (isMixedMode ? mixedSubItems.length : activePlans.length) ? cardIdx : 0));

    let targetModelTitle = '';
    let planMonthlyFee = 0;
    let modelMonths = subMonths;

    if (isMixedMode) {
      if (targetIdx >= 0 && mixedSubItems[targetIdx]) {
        const mItem = mixedSubItems[targetIdx];
        targetModelTitle = (mItem.name || '').trim() || `${targetIdx + 1}번 구독 모델`;
        planMonthlyFee = getItemMonthly(mItem) * getSubQty(mItem.quantity);
        modelMonths = Number(mItem.months) || 72;
      } else {
        targetModelTitle = isSingleCardMode ? '' : '전체 구독 모델';
        planMonthlyFee = mixedSubMonthlyFeeTotal;
        modelMonths = subMonths;
      }
    } else {
      if (targetIdx >= 0 && activePlans[targetIdx]) {
        const pItem = activePlans[targetIdx];
        targetModelTitle = (pItem.name || '').trim() || `품목 ${targetIdx + 1}`;
        planMonthlyFee = pItem.rowMonthly || 0;
        modelMonths = Number(pItem.months) || 72;
      } else {
        targetModelTitle = isSingleCardMode ? '' : '전체 품목';
        planMonthlyFee = effectiveMonthlyBase;
        modelMonths = subMonths;
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

    // 단일 삼성카드 다구간 모드일 때 (모드 1 및 모드 2 공통 지원!)
    if (isSingleCardMode && isSamsung && isMultiPeriod) {
      const segDiscounts = subSegments.reduce((sum, seg) => sum + seg.appliedCard * seg.duration, 0);
      return {
        card: c,
        company,
        isSamsung,
        isNonSamsung: Boolean(trimmedName && !isSamsung),
        policy,
        totalDiscount: segDiscounts,
        planMonthlyFee: isMixedMode ? mixedSubMonthlyFeeTotal : effectiveMonthlyBase,
        cardMonths: subMonths,
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

  const subCardTotalDiscount = isSingleCardMode && isSamsungCard && isMultiPeriod
    ? subSegments.reduce((sum, seg) => sum + seg.appliedCard * seg.duration, 0)
    : cardDetails.reduce((sum, d) => sum + d.totalDiscount, 0);

  const cardCompanySummary = [...new Set(cardDetails.map((d) => d.company).filter(Boolean))].join(' + ');

  const allCardSubLines = isSingleCardMode
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

  const hasAnyNonSamsungCard = cardDetails.some((d) => d.isNonSamsung);

  const startingTotalCardMonthly = isSingleCardMode
    ? (isMixedMode
        ? (cardDetails[0]?.isSamsung && (!subCards[0]?.monthly || Number(subCards[0]?.monthly) === 0 || Number(subCards[0]?.monthly) === 16000 || Number(subCards[0]?.monthly) === 26000)
            ? (subSegments[0]?.appliedCard || (cardDetails[0]?.planMonthlyFee >= 70000 ? 26000 : 16000))
            : (Number(subCards[0]?.monthly) || cardMonthlyNum))
        : (subSegments[0]?.appliedCard || cardMonthlyNum))
    : cardDetails.reduce((sum, d) => sum + (Number(d.card.monthly) || (d.isSamsung ? (d.planMonthlyFee >= 70000 ? 26000 : 16000) : 0)), 0);

  const subMonthlyAfterCard = Math.max(0, effectiveMonthlyBase - startingTotalCardMonthly);

  // 무상 A/S 연장 이용료 총액: 각 품목별 (월 이용료 × 대수 × 개월수) 합산
  const subFreeServiceAmount = subFreeServiceItems.reduce((sum, it) => {
    const fee = Number(it.monthlyFee) || 0;
    const qty = it.quantity === '' ? 1 : Number(it.quantity) || 1;
    const months = Number(it.months) || 72;
    return sum + fee * qty * months;
  }, 0);
  const validFreeServiceItems = subFreeServiceItems.filter((it) => (Number(it.monthlyFee) || 0) > 0);
  const validFreeServiceCount = validFreeServiceItems.length;
  const totalFreeServiceQuantity = validFreeServiceItems.reduce(
    (sum, it) => sum + (it.quantity === '' ? 1 : Number(it.quantity) || 1),
    0
  );

  // 케어서비스 혜택 총액: 각 항목별 (금액 × 갯수/횟수) 합산 (1번 소모품비용 갯수, 2번 방문케어 횟수 ...)
  const subCareServiceAmount = subCareServiceItems.reduce(
    (sum, it) => sum + (Number(it.amount) || 0) * (Number(it.count) || 1),
    0
  );
  const validCareServiceItems = subCareServiceItems.filter((it) => (Number(it.amount) || 0) > 0);
  const validCareServiceCount = validCareServiceItems.length;
  const hasCareService = subCareServiceAmount > 0;
  const subServiceTotal = (Number(subFreeServiceAmount) || 0) + (Number(subCareServiceAmount) || 0);
  const subCashBenefitTotal = subCardTotalDiscount + (Number(subPurchaseBenefit) || 0);
  const subTotalBenefitSum = subCashBenefitTotal + (includeServiceInFinal ? subServiceTotal : 0);

  const subFinalPrice = Math.max(0, subGrossTotal - subTotalBenefitSum);

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
  const mixedLumpQtyTotal = validMixedLumpItems.reduce((sum, it) => sum + getMixedLumpItemCalc(it).qty, 0);

  // 행사 접두사 (혼수 / 입주 / 이사 / 일반)
  const eventPrefix =
    mixedEventType === 'wedding'
      ? '혼수'
      : mixedEventType === 'moving_in'
        ? '입주'
        : mixedEventType === 'moving'
          ? '이사'
          : '일반';

  // 백화점 vs 로드샵 선택에 따른 특정조건 할인 반영 (선택된 채널의 결제조건만 반영)
  const mixedLumpSpecificDiscount =
    mixedChannelType === 'dept'
      ? Number(mixedDeptDiscount) || 0
      : Number(mixedRoadDiscount) || 0;

  const mixedSpecialDiscountProof =
    mixedChannelType === 'dept'
      ? mixedDeptDiscountProof
      : mixedRoadDiscountProof;

  const effectiveDeptNote =
    (mixedDeptDiscountNote || '').trim() ||
    (mixedEventType === 'normal' ? '백화점 제휴카드 사은행사 할인' : `백화점 ${eventPrefix} 특별할인`);

  const effectiveRoadNote =
    (mixedRoadDiscountNote || '').trim() ||
    (mixedEventType === 'normal' ? '로드샵 플러스페이 특별할인' : `로드샵 ${eventPrefix} 특별할인`);

  const effectiveSpecialDiscountNote =
    mixedChannelType === 'dept' ? effectiveDeptNote : effectiveRoadNote;

  const mixedLumpDiscountTotal = mixedLumpModelDiscountTotal + mixedLumpSpecificDiscount;
  const mixedLumpSubFinal = Math.max(0, mixedLumpGross - mixedLumpDiscountTotal);

  // ---------------- 스마트 견적기 구독 모델 및 전용 서비스 통합 계산 ----------------

  // 통합 구독 기준총액 (기본 월 구독료 × 개월수 × 수량)
  const mixedSubGrossTotal = mixedSubItems.reduce(
    (sum, it) => sum + getItemBaseMonthly(it) * (Number(it.months) || 72) * getSubQty(it.quantity),
    0
  );

  // 구독료 할인 혜택 총액 (기본구독료 - 할인구독료 차액 총합)
  const mixedSubFeeDiscountTotal = mixedSubItems.reduce((sum, it) => {
    const diff = getItemBaseMonthly(it) - getItemMonthly(it);
    return sum + (diff > 0 ? diff * (Number(it.months) || 72) * getSubQty(it.quantity) : 0);
  }, 0);

  // 해당 모델들 선납금 총액
  const mixedSubPrepayTotal = mixedSubItems.reduce(
    (sum, it) => sum + (Number(it.prepay) || 0),
    0
  );

  // 무상수리(A/S) 혜택 총액 (월 이용금액 × 개월수 × 대수)
  const mixedSubFreeRepairTotal = mixedSubItems.reduce(
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

  // 구독 총 혜택 (카드 청구할인 + 구독료 할인 + 무상수리 및 케어서비스)
  const mixedSubOnlyDiscount =
    subCardTotalDiscount +
    mixedSubFeeDiscountTotal +
    (includeServiceInFinal ? mixedSubServiceBenefit : 0);

  // 구독 월 납부 체감합계 (기준총액 - 혜택총액)
  const mixedSubPerceivedPrice = Math.max(0, mixedSubGrossTotal - mixedSubOnlyDiscount);

  // 구독 최종 체감 소계 (선납금액 합산!)
  const mixedSubFinalPrice = mixedSubPerceivedPrice + mixedSubPrepayTotal;

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

  const hasAnyProofPolicy = Boolean(
    mixedCashbackItems.some((it) => it.hasProof && (Number(it.amount) || 0) > 0) ||
    mixedVoucherItems.some((it) => it.hasProof && (Number(it.amount) || 0) > 0) ||
    (mixedSpecialDiscountProof && mixedLumpSpecificDiscount > 0)
  );

  // 전체 기준 총액 (일반 기준총액 + 구독 기준총액 + 구독 선납금)
  const mixedGrandGross = mixedLumpGross + mixedSubGrossTotal + mixedSubPrepayTotal;
  // 전체 총 혜택 = 구독 전용 혜택 + 일반 특정조건 할인 + 통합 캐시백 + 상품권 지급
  const mixedGrandBenefit = mixedSubOnlyDiscount + mixedLumpDiscountTotal + mixedTotalCashback + mixedTotalVoucher;
  // 고객 최종 실체감가 (일반구매 실결제액 + 구독 체감소계 - 캐시백 - 상품권)
  const mixedGrandFinal = Math.max(0, mixedLumpSubFinal + mixedSubFinalPrice - mixedTotalCashback - mixedTotalVoucher);
  const mixedGrandBenefitRate = mixedGrandGross > 0 ? ((mixedGrandBenefit / mixedGrandGross) * 100).toFixed(1) : '0.0';

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
      { id: 1, name: '', quantity: 1, months: 72, monthlyFee: 0, totalAmount: 0, policyNote: '', policyDiscount: 0 }
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
    setSubFreeServiceItems([{ id: 1, monthlyFee: 0, quantity: 1, months: 72 }]);
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
      const lastMonths = prev[prev.length - 1]?.months;
      const nextMonths = lastMonths === 72 ? 60 : lastMonths === 60 ? 72 : subMonths || 72;
      return [...prev, { id: nextId, monthlyFee: 0, quantity: 1, months: nextMonths }];
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
        mixedDeptDiscount,
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
        ? d.subPlans
        : [{ id: 1, months: 72, monthlyFee: 0, totalAmount: 0 }]
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
          quantity: it.quantity !== undefined ? (it.quantity === '' ? '' : Number(it.quantity) || 1) : 1
        }))
      );
    } else if (Number(d.subFreeServiceAmount) > 0) {
      setSubFreeServiceItems([
        { id: 1, monthlyFee: Math.round(Number(d.subFreeServiceAmount) / 72), quantity: 1, months: 72 }
      ]);
    } else {
      setSubFreeServiceItems([{ id: 1, monthlyFee: 0, quantity: 1, months: 72 }]);
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
      setMixedDeptDiscount(Number(d.mixedDeptDiscount) || 0);
      setMixedDeptDiscountNote(d.mixedDeptDiscountNote || '');
      setMixedDeptDiscountProof(d.mixedDeptDiscountProof !== false);
      setMixedRoadDiscount(Number(d.mixedRoadDiscount) || 0);
      setMixedRoadDiscountNote(d.mixedRoadDiscountNote || '');
      setMixedRoadDiscountProof(d.mixedRoadDiscountProof !== false);
    } else {
      setMixedChannelType('dept');
      setMixedDeptDiscount(Number(d.mixedSpecialDiscount) || 0);
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
    if (!activeQuoteId) {
      handleSaveNewQuote();
      return;
    }
    const snapshot = buildCurrentQuoteSnapshot();
    setSavedQuotes((prev) =>
      prev.map((q) => (q.id === activeQuoteId ? { ...snapshot, id: activeQuoteId } : q))
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

  const handleExportAsImage = async () => {
    const node = document.querySelector('.a4-print-sheet');
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
      const filename = `JCC_견적서_${safeCustomer}_${safeDate}.png`;

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
            title: `JCC 맞춤 견적서 (${safeCustomer} 고객님)`,
            text: `[JCC 진센조] ${safeCustomer} 고객님 맞춤 가전 혜택 견적서입니다.`
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

  const handlePrint = () => {
    window.print();
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
            <button
              type="button"
              onClick={handleExportAsImage}
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

            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary pulse"
              style={{ padding: '0.85rem 1.8rem', fontSize: '1rem' }}
            >
              <Printer size={19} /> A4 용지로 인쇄 / PDF 저장
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
            💡 <strong>인쇄 팁:</strong> 인쇄 설정(더보기)에서 <strong>&lsquo;배경 그래픽&rsquo;</strong>을 체크하고 <strong>&lsquo;머리글 및 바닥글&rsquo;</strong>을 해제하시면 A4 한 장에 가장 깔끔하게 출력됩니다.
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

        {/* ==================== A4 출력 시트 ==================== */}
        <div
          className="a4-sheet-wrapper"
          style={
            mobileFitMode && isSmallScreen
              ? {
                  overflow: 'hidden',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '0 0.5rem'
                }
              : undefined
          }
        >
          <div
            className="a4-print-sheet"
            style={
              mobileFitMode && isSmallScreen
                ? {
                    transform: `scale(${mobileSheetScale})`,
                    transformOrigin: 'top center',
                    marginBottom: `calc(-1 * (1 - ${mobileSheetScale}) * 800px)`
                  }
                : undefined
            }
          >
            {/* 1. 상단 리포트 헤더 */}
            <header className="a4-header">
              <div className="a4-header-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                  <img
                    src="/images/logo_new.png"
                    alt="JCC"
                    style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
                  />
                  <span className="a4-tag-gold">{isMixedMode ? 'SAMSUNG AI SMART QUOTE' : 'PAYMENT & BENEFIT COMPARISON'}</span>
                </div>
                <h1 className="a4-doc-title">{isMixedMode ? '삼성 AI 가전 스마트 견적서' : '일반구매 vs 삼성AI구독 결제조건 비교서'}</h1>
                <p className="a4-doc-subtitle">{isMixedMode ? '일반구매와 삼성AI구독의 최적 결합 맞춤 설계 및 최종 실체감가 안내' : '일반구매와 삼성AI구독의 적용 혜택 및 최종 체감금액 안내'}</p>
              </div>

              <div className="a4-header-right">
                <div className="a4-meta-row">
                  <span className="a4-meta-label">고객명</span>
                  <strong className="a4-meta-val">{customerName.trim() ? `${customerName.trim()} 고객님` : '소중한 고객님'}</strong>
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
                        <span style={{ fontSize: '0.72rem', color: '#a7f3d0', marginLeft: '3px' }}>· 증빙조건포함</span>
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

            {/* 품목 요약 바 (비교 모드에서 입력 시 표시) */}
            {!isMixedMode && productSummary.trim() && (
              <div className="a4-product-bar">
                <span className="a4-product-bar-label">상담 구성 품목</span>
                <span className="a4-product-bar-text">{productSummary.trim()}</span>
              </div>
            )}

            {/* 2. 최종 체감가 차이 강조 배너 (비교 모드 전용) */}
            {!isMixedMode && (
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
            )}

            {/* 3. 견적서 메인 카드 영역 */}
            {isMixedMode ? (
              /* 복합구매 단일 수직 카드 (좌우 분리 X: 1. 상단 구독 및 전용서비스 -> 2. 하단 일반모델 -> 3. 통합 캐시백·상품권·최종정산) */
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
                        const qty = getSubQty(p.quantity);
                        const itemMonths = Number(p.months) || 72;
                        const itemCycle = Number(p.serviceCycle) || 12;
                        const itemBase = getItemBaseMonthly(p);
                        const itemMonthly = getItemMonthly(p);
                        const diff = itemBase - itemMonthly;
                        const itemFreeRepair = (Number(p.freeRepairFee) || 0) * itemMonths * qty;
                        const itemCare = ((Number(p.selfCareFee) || 0) + (Number(p.visitCareFee) || 0)) * qty;
                        const feeDiscountTotal = diff > 0 ? diff * itemMonths * qty : 0;
                        const itemBenefitTotal = feeDiscountTotal + itemFreeRepair + itemCare;

                        // 혜택 구성 태그 (요금할인, 무상수리, 케어서비스)
                        const benefitParts = [];
                        if (diff > 0) benefitParts.push(`구독료 월 -${formatWon(diff * qty)} 추가할인`);
                        if (itemFreeRepair > 0) benefitParts.push('무상수리 연장');
                        if (itemCare > 0) {
                          const hasSelf = (Number(p.selfCareFee) || 0) > 0;
                          const hasVisit = (Number(p.visitCareFee) || 0) > 0;
                          benefitParts.push(hasSelf && hasVisit ? '소모품+방문케어' : hasSelf ? '소모품' : '방문케어');
                        }

                        return (
                          <div
                            key={p.id || idx}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.08rem',
                              paddingBottom: '0.2rem',
                              borderBottom: idx < validMixedSubItems.length - 1 ? '1px dashed rgba(37, 99, 235, 0.15)' : 'none'
                            }}
                          >
                            {/* 첫번째 줄: 1.모델명 (약정 무상수리 + 방문케어 주기) | (선납금액 00만) 월 기준료(취소선) 할인료 */}
                            <div className="a4-row" style={{ alignItems: 'baseline' }}>
                              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'normal', wordBreak: 'keep-all' }}>
                                {idx + 1}. <strong>{modelTitle}</strong>
                                {qty > 1 ? ` × ${qty}대` : ''}{' '}
                                <span style={{ color: '#475569', fontSize: '0.74rem', fontWeight: 500 }}>
                                  ({itemMonths}개월 무상수리 + 방문케어 주기 {itemCycle}개월)
                                </span>
                              </span>
                              <strong style={{ flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                {(Number(p.prepay) || 0) > 0 && (
                                  <span style={{ fontSize: '0.7rem', color: '#1e3a8a', fontWeight: 700, background: '#eff6ff', padding: '1px 5px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                                    (선납금액 {formatWon(p.prepay)})
                                  </span>
                                )}
                                {diff > 0 ? (
                                  <>
                                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textDecoration: 'line-through' }}>
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

                            {/* 두번째 줄: 구독 혜택 | 우측 끝에 혜택합계만 표시 */}
                            {itemBenefitTotal > 0 ? (
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.72rem',
                                  color: '#0369a1',
                                  paddingLeft: '0.85rem',
                                  paddingTop: '0.04rem'
                                }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <span style={{ color: '#2563eb', fontWeight: 800 }}>↳</span>
                                  <strong style={{ color: '#1e40af' }}>구독 혜택</strong>
                                  {benefitParts.length > 0 && (
                                    <span style={{ fontSize: '0.66rem', color: '#64748b' }}>
                                      ({benefitParts.join(' · ')})
                                    </span>
                                  )}
                                </span>
                                <strong style={{ color: '#2563eb', fontWeight: 800, fontSize: '0.76rem' }}>
                                  - {formatWon(itemBenefitTotal)}
                                </strong>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {/* 구독 전용 혜택 및 서비스 내역 (한 테두리 통합 박스) */}
                    <div
                      className="a4-benefit-list"
                      style={{
                        minHeight: 'auto',
                        padding: '0.48rem 0.65rem',
                        background: 'rgba(37, 99, 235, 0.035)',
                        border: '1px solid rgba(37, 99, 235, 0.22)',
                        borderRadius: '7px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.22rem'
                      }}
                    >
                      {/* 할인 전 구독 총금액 & 구독료 추가할인 합계 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                        <span style={{ color: '#1e3a8a', fontWeight: 800 }}>
                          할인 전 구독 총금액 (기준총액 합계)
                        </span>
                        <strong
                          style={{
                            color: '#64748b',
                            fontSize: '0.86rem',
                            fontWeight: 700,
                            textDecoration: 'line-through'
                          }}
                        >
                          {formatWon(mixedSubGrossTotal)}
                        </strong>
                      </div>
                      {mixedSubFeeDiscountTotal > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
                          <span style={{ color: '#2563eb', fontWeight: 700, paddingLeft: '0.25rem' }}>
                            ↳ 구독료 추가할인 합계 (약정기간 합산)
                          </span>
                          <strong style={{ color: '#2563eb', fontWeight: 800 }}>
                            - {formatWon(mixedSubFeeDiscountTotal)}
                          </strong>
                        </div>
                      )}

                      {/* 내부 구분선 */}
                      <div style={{ borderTop: '1px dashed rgba(37, 99, 235, 0.18)', margin: '0.12rem 0 0.08rem 0' }} />

                      {/* 제휴카드 혜택 */}
                      <div className="a4-benefit-row" style={{ alignItems: 'flex-start' }}>
                        <span style={{ flex: 1, wordBreak: 'keep-all' }}>
                          <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                          제휴카드 혜택 {cardCompanySummary ? `(${cardCompanySummary})` : !hasAnyCardDiscount ? '(미적용)' : ''}
                        </span>
                        <span className="a4-minus-blue">- {formatWon(subCardTotalDiscount)}</span>
                      </div>
                      {allCardSubLines.length > 0 && (
                        <div style={{ fontSize: '0.64rem', color: '#475569', fontWeight: 600, marginLeft: '9px', lineHeight: 1.3 }}>
                          {allCardSubLines.map((line, lIdx) => (
                            <div key={lIdx}>{line}</div>
                          ))}
                        </div>
                      )}

                      {/* 무상 A/S 연장 혜택 */}
                      {mixedSubFreeRepairTotal > 0 && (
                        <div className="a4-benefit-row">
                          <span>
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            무상 A/S 연장 이용료 (혜택)
                          </span>
                          <span className="a4-minus-blue">
                            {includeServiceInFinal ? `- ${formatWon(mixedSubFreeRepairTotal)}` : `+ ${formatWon(mixedSubFreeRepairTotal)} 상당`}
                          </span>
                        </div>
                      )}

                      {/* 케어서비스 혜택 */}
                      {mixedSubCareTotal > 0 && (
                        <div className="a4-benefit-row">
                          <span>
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            케어서비스 이용료 (소모품.방문 혜택)
                          </span>
                          <span className="a4-minus-blue">
                            {includeServiceInFinal ? `- ${formatWon(mixedSubCareTotal)}` : `+ ${formatWon(mixedSubCareTotal)} 상당`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 구독 소계 바: 좌측에 선납금액 & 구독 체감 소계(작은 크기), 우측에 월납입금 강조 */}
                    <div
                      className="a4-mixed-subtotal-bar subtotal-bar-sub"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.45rem 0.75rem',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '7px',
                        flexWrap: 'wrap',
                        gap: '0.4rem'
                      }}
                    >
                      {/* 좌측: 구독 체감 합계금액 (선납금 00만 포함) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.73rem', color: '#334155', flexWrap: 'wrap' }}>
                        <span>
                          구독 체감 합계금액
                          {mixedSubPrepayTotal > 0 ? ` (선납금 ${formatWon(mixedSubPrepayTotal)} 포함)` : ''}:
                        </span>
                        <strong style={{ color: '#1e40af', fontWeight: 800, fontSize: '0.78rem' }}>
                          {formatWon(mixedSubFinalPrice)}
                        </strong>
                      </div>

                      {/* 우측: 월납입금 강조 */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginLeft: 'auto' }}>
                        <span style={{ fontSize: '0.78rem', color: '#1e3a8a', fontWeight: 700 }}>
                          제휴카드 적용 월 실납부액:
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
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2) 중간: 일반구매 모델 및 할인 혜택 */}
                <div className="a4-mixed-sec a4-mixed-sec-lump">
                  <div className="a4-mixed-sec-header header-lump">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <ShoppingBag size={15} style={{ color: '#fcd34d' }} />
                      <span>2. 일반구매 모델 &amp; 결제 조건</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: mixedChannelType === 'dept' ? '#78350f' : '#1e3a8a', color: '#ffffff', fontWeight: 700 }}>
                        {mixedChannelType === 'dept' ? '🏬 백화점 결제조건' : '🏪 로드샵 결제조건'}
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
                        const { qty, unitPrice, unitNetPrice, unitDiscount, gross, totalDiscount, net } = getMixedLumpItemCalc(it);

                        return (
                          <div key={it.id} className="a4-row">
                            <span>
                              {idx + 1}. <strong>{(it.name || '').trim() || '일반구매 모델'}</strong>
                              {qty > 1 ? ` × ${qty}대` : ''}
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
                        <strong style={{ color: '#0f172a' }}>{formatWon(mixedLumpGross)}</strong>
                      </div>
                    </div>

                    {/* 일반구매 적용 혜택 & 특정 조건 할인 */}
                    <div className="a4-benefit-list" style={{ minHeight: 'auto', padding: '0.45rem 0.65rem' }}>
                      {(() => {
                        const discountedLumpItems = validMixedLumpItems
                          .map((it, idx) => ({ it, idx, calc: getMixedLumpItemCalc(it) }))
                          .filter(({ calc }) => calc.totalDiscount > 0);

                        if (mixedLumpModelDiscountTotal <= 0) return null;

                        const detailsStr = discountedLumpItems
                          .map(({ it, idx, calc }) => {
                            const name = (it.name || '').trim() || `모델 ${idx + 1}`;
                            const qtyText = calc.qty > 1 ? ` × ${calc.qty}대` : '';
                            const perUnitText = calc.qty > 1 ? ` · 대당 -${formatWon(calc.unitDiscount)}` : '';
                            return `${name}${qtyText}: -${formatWon(calc.totalDiscount)}${perUnitText}`;
                          })
                          .join(', ');

                        return (
                          <div className="a4-benefit-row" style={{ alignItems: 'baseline' }}>
                            <span style={{ flex: 1, minWidth: 0, paddingRight: '0.5rem', wordBreak: 'keep-all' }}>
                              <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <strong>모델별 할인</strong>
                              {detailsStr && (
                                <span style={{ color: '#78350f', fontSize: '0.73rem', fontWeight: 600, marginLeft: '6px' }}>
                                  ({detailsStr})
                                </span>
                              )}
                            </span>
                            <span className="a4-minus" style={{ whiteSpace: 'nowrap' }}>
                              - {formatWon(mixedLumpModelDiscountTotal)}
                            </span>
                          </div>
                        );
                      })()}
                      {mixedLumpSpecificDiscount > 0 ? (
                        <div className="a4-benefit-row">
                          <span>
                            <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong>[{mixedChannelType === 'dept' ? '백화점' : '로드샵'} 특정조건 할인]</strong> {effectiveSpecialDiscountNote}
                            {mixedSpecialDiscountProof && (
                              <span className="a4-proof-tag">(제휴카드 가입시)</span>
                            )}
                          </span>
                          <span className="a4-minus">- {formatWon(mixedLumpSpecificDiscount)}</span>
                        </div>
                      ) : (
                        mixedLumpModelDiscountTotal === 0 && (
                          <div className="a4-benefit-row">
                            <span>
                              <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                              일반구매 기본 결제 조건
                            </span>
                            <span className="a4-benefit-note">표준 결제 조건 적용</span>
                          </div>
                        )
                      )}
                    </div>

                    {/* 일반구매 소계 바 */}
                    <div className="a4-mixed-subtotal-bar subtotal-bar-lump">
                      <div>
                        <span>결제 방식: </span>
                        <strong style={{ color: mixedChannelType === 'dept' ? '#b45309' : '#1d4ed8' }}>
                          {mixedChannelType === 'dept'
                            ? '🏬 백화점 제휴카드 / 상품권 결제 (사은행사 적용)'
                            : '🏪 로드샵 제휴카드 일시불 / 플러스페이 (무이자 할부 가능)'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.74rem', color: '#78350f' }}>일반구매 실결제 소계: </span>
                        <strong style={{ fontSize: '0.98rem', fontWeight: 900, color: '#b45309' }}>{formatWon(mixedLumpSubFinal)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3) 하단: 통합 캐시백 · 상품권 지급 및 최종 정산 */}
                <div className="a4-mixed-sec a4-mixed-sec-grand">
                  <div className="a4-mixed-sec-header header-grand">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Award size={15} style={{ color: '#fde68a' }} />
                      <span>3. 통합 캐시백 · 상품권 지급 및 최종 실체감가</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>
                      총 혜택 합계: - {formatWon(mixedGrandBenefit)} ({mixedGrandBenefitRate}% 절감)
                    </span>
                  </div>

                  <div className="a4-mixed-sec-body" style={{ padding: '0.55rem 0.95rem' }}>
                    {/* 통합 캐시백 및 상품권 내역 (입력 시) */}
                    {(validMixedCashbackItems.length > 0 || validMixedVoucherItems.length > 0) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem', paddingBottom: '0.35rem', borderBottom: '1px dashed #cbd5e1' }}>
                        {validMixedCashbackItems.map((cb, idx) => (
                          <div className="a4-benefit-row" key={cb.id || idx}>
                            <span>
                              <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>★</span>
                              <strong>{(cb.name || '').trim() || (mixedEventType === 'normal' ? '통합 캐시백' : `${eventPrefix}캐시백`)}</strong>
                              {cb.hasProof && (
                                <span className="a4-proof-tag">(증빙완료시)</span>
                              )}
                            </span>
                            <span className="a4-minus-blue" style={{ fontSize: '0.84rem' }}>- {formatWon(cb.amount)}</span>
                          </div>
                        ))}
                        {validMixedVoucherItems.map((vc, idx) => (
                          <div className="a4-benefit-row" key={vc.id || idx}>
                            <span>
                              <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>★</span>
                              <strong>{(vc.name || '').trim() || (mixedEventType === 'normal' ? '모바일/지류 상품권' : `${eventPrefix} 상품권`)}</strong>
                              {vc.hasProof && (
                                <span className="a4-proof-tag">(증빙완료시)</span>
                              )}
                            </span>
                            <span className="a4-minus" style={{ fontSize: '0.84rem', color: '#d97706' }}>+ {formatWon(vc.amount)} 상당 증정</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 최종 정산 요약 박스 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.3rem' }}>
                      <div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                          총 기준금액 {formatWon(mixedGrandGross)} · 총 적용 혜택 - {formatWon(mixedGrandBenefit)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.15rem' }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>고객 최종 실체감가</span>
                          <strong style={{ fontSize: '1.42rem', fontWeight: 900, color: '#1e3a8a' }}>{formatWon(mixedGrandFinal)}</strong>
                        </div>
                      </div>

                      {/* 2-Track 결제 안내 칩 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-end', background: '#ffffff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.4rem 0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                          ① 초기 일시불 실결제: <strong style={{ color: '#b45309', fontWeight: 800 }}>{formatWon(mixedInitialPayment)}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#334155' }}>
                          ② 이후 구독 월 실납부: <strong style={{ color: '#2563eb', fontWeight: 800 }}>월 {formatWon(mixedSubMonthlyAfterCard)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            /* 3. 일반구매 vs 구독 좌우 1:1 비교 카드 영역 (4단 수평 정렬 구조) */
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
                        무상 A/S 보증
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
                    <span>총 혜택 합계</span>
                    <strong className="a4-minus">- {formatWon(lumpTotalBenefit)}</strong>
                  </div>
                </div>

                {/* 좌측 결과 푸터: 메인(일시불 크게) + 하단(동일기간 할부 작게) */}
                <div className="a4-plan-footer footer-lump">
                  <div className="a4-final-row">
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
                    <span>월 기본 구독료</span>
                    {isMultiPeriod ? (
                      <div style={{ textAlign: 'right', lineHeight: 1.38 }}>
                        {subSegments.map((seg, idx) => (
                          <div key={seg.endMonth} style={{ fontWeight: 700, color: '#0f172a' }}>
                            {idx === 0
                              ? `${seg.duration}개월간 월 ${formatWon(seg.baseMonthly)}`
                              : `잔여 ${seg.duration}개월 월 ${formatWon(seg.baseMonthly)}`}
                          </div>
                        ))}
                        {subPrepay > 0 && (
                          <div style={{ fontSize: '0.69rem', color: '#475569', fontWeight: 600, marginTop: '1px' }}>
                            선납금 {formatWon(subPrepay)} 별도
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right', lineHeight: 1.36 }}>
                        <strong style={{ display: 'block', color: '#0f172a' }}>월 {formatWon(effectiveMonthlyBase)}</strong>
                        {subPrepay > 0 && (
                          <span style={{ display: 'block', fontSize: '0.69rem', color: '#475569', fontWeight: 600 }}>
                            선납금 {formatWon(subPrepay)} 별도
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="a4-plan-middle">
                  <div className="a4-divider-label">적용 혜택 및 서비스</div>
                  <div className="a4-benefit-list">
                    <div>
                      <div
                        className="a4-benefit-row"
                        style={{
                          alignItems: 'flex-start',
                          lineHeight: 1.28
                        }}
                      >
                        <span
                          style={{
                            fontSize: cardCompanySummary && cardCompanySummary.length > 8 ? '0.70rem' : '0.76rem',
                            wordBreak: 'keep-all',
                            lineHeight: 1.25,
                            flex: 1
                          }}
                        >
                          <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                          제휴카드 혜택
                          {cardCompanySummary ? ` (${cardCompanySummary})` : !hasAnyCardDiscount ? ' (미적용)' : ''}
                        </span>
                        <span
                          className="a4-minus-blue"
                          style={{
                            flexShrink: 0,
                            marginLeft: '0.35rem',
                            whiteSpace: 'nowrap',
                            fontSize: '0.78rem'
                          }}
                        >
                          - {formatWon(subCardTotalDiscount)}
                        </span>
                      </div>
                      {allCardSubLines.length > 0 && (
                        <div
                          style={{
                            fontSize: '0.64rem',
                            color: '#475569',
                            fontWeight: 600,
                            marginTop: '2px',
                            marginLeft: '9px',
                            lineHeight: 1.32,
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
                            fontSize: '0.62rem',
                            color: '#dc2626',
                            fontWeight: 700,
                            marginTop: '2px',
                            marginLeft: '9px',
                            lineHeight: 1.25,
                            wordBreak: 'keep-all'
                          }}
                        >
                          <div>※ 주의: 기존 카드 보유회원 적용 제외</div>
                          <div style={{ color: '#b91c1c', fontWeight: 600 }}>
                            (비회원 또는 최근 6개월간 결제이력 없는 고객 한함)
                          </div>
                        </div>
                      )}
                    </div>
                    {!isMixedMode && (
                      <div className="a4-benefit-row">
                        <span>
                          <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                          삼성AI구독 혜택(캐시백)
                        </span>
                        <span className="a4-minus-blue">- {formatWon(subPurchaseBenefit)}</span>
                      </div>
                    )}
                    <div className="a4-benefit-row" style={{ alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
                        <span style={{ whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                          무상 A/S 연장 이용료(혜택)
                        </span>
                        {validFreeServiceCount > 0 && (
                          <span style={{ fontSize: '0.67rem', color: '#64748b', marginTop: '2px', marginLeft: '9px', whiteSpace: 'nowrap' }}>
                            (총 {validFreeServiceCount}개 품목 · {totalFreeServiceQuantity}대)
                          </span>
                        )}
                      </div>
                      <span className="a4-minus-blue" style={{ flexShrink: 0, marginTop: '1px' }}>
                        {subFreeServiceAmount > 0
                          ? includeServiceInFinal
                            ? `- ${formatWon(subFreeServiceAmount)}`
                            : `+ ${formatWon(subFreeServiceAmount)} 상당`
                          : '무상 보증 포함'}
                      </span>
                    </div>
                    {hasCareService && (
                      <div className="a4-benefit-row" style={{ alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.25 }}>
                          <span style={{ whiteSpace: 'nowrap' }}>
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            케어서비스 혜택(방문관리·소모품)
                          </span>
                          {validCareServiceCount > 0 && (
                            <span style={{ fontSize: '0.67rem', color: '#64748b', marginTop: '2px', marginLeft: '9px', whiteSpace: 'nowrap' }}>
                              ({validCareServiceCount <= 2
                                ? validCareServiceItems
                                    .map((it) => `${it.name?.trim() || '케어서비스'} ${it.count || 1}${it.unit || (it.name?.includes('소모품') ? '개' : '회')}`)
                                    .join(' · ')
                                : `총 ${validCareServiceCount}개 항목`})
                            </span>
                          )}
                        </div>
                        <span className="a4-minus-blue" style={{ flexShrink: 0, marginTop: '1px' }}>
                          {includeServiceInFinal
                            ? `- ${formatWon(subCareServiceAmount)}`
                            : `+ ${formatWon(subCareServiceAmount)} 상당`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="a4-row a4-benefit-total-row">
                    <span>총 혜택 합계</span>
                    <strong className="a4-minus-blue">- {formatWon(subTotalBenefitSum)}</strong>
                  </div>
                </div>

                {/* 우측 결과 푸터: 메인(최종 체감가 크게) + 하단(실제 월 납부액 작게) */}
                <div className="a4-plan-footer footer-sub">
                  <div className="a4-final-row">
                    <span className="a4-final-label">삼성AI구독 최종 체감가</span>
                    <strong className="a4-final-price price-blue">
                      {formatWon(subFinalPrice)}
                    </strong>
                  </div>

                  <div className="a4-footer-sub-box sub-box-blue">
                    {isMultiPeriod ? (
                      subSegments.map((seg, idx) => (
                        <div
                          key={seg.endMonth}
                          className="a4-footer-sub-main"
                          style={idx > 0 ? { marginTop: '0.14rem' } : undefined}
                        >
                          <span>
                            {idx === 0
                              ? `${seg.duration}개월간 월 실납부액 (1~${seg.endMonth}개월)`
                              : `잔여 ${seg.duration}개월 월 실납부액 (${seg.startMonth}~${seg.endMonth}개월)`}
                          </span>
                          <strong className="sub-strong-blue">월 {formatWon(seg.netMonthly)}</strong>
                        </div>
                      ))
                    ) : (
                      <div className="a4-footer-sub-main">
                        <span>제휴카드 적용 월 실납부액</span>
                        <strong className="sub-strong-blue">월 {formatWon(subMonthlyAfterCard)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* 4. 제휴카드 실적인정 기준 안내 & 메모 */}
            <div className="a4-info-box">
              {/* 고객이 선택한 제휴카드에 대한 실적인정 기준 가이드 카드 (카드 설정 시 자동 노출) */}
              {(() => {
                const uniquePolicies = [...new Set(cardDetails.map((d) => d.policy).filter(Boolean))];
                if (uniquePolicies.length === 0) return null;
                return (
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
                );
              })()}

              {memo.trim() && (
                <div className="a4-memo-box">
                  <div className="a4-memo-title">📋 맞춤 상담 메모 및 안내사항</div>
                  <div className="a4-memo-content">{memo.trim()}</div>
                </div>
              )}

              <p className="a4-disclaimer">
                * 본 비교서는 상담일 기준 프로모션·제휴카드 할인·카드 할부금리를 반영한 예상 안내 자료이며, 결제 시점 정책 및 카드 실적에 따라 변동될 수 있습니다.
              </p>
            </div>

            {/* 5. 조준석 매니저 하단 명함 영역 */}
            <footer className="a4-manager-card">
              <div className="a4-manager-left">
                <img
                  src="/images/profile.jpg"
                  alt="조준석 매니저"
                  className="a4-manager-photo"
                />
                <div>
                  <div className="a4-manager-badge-row">
                    <span className="a4-manager-role">19년 경력 가전 마스터 · 삼성 CS명장</span>
                  </div>
                  <div className="a4-manager-name">
                    조준석 매니저 <span className="a4-manager-brand">| JCC 진센조</span>
                  </div>
                  <div className="a4-manager-quote">
                    &ldquo;백화점과 로드샵 혜택을 한 곳에서 비교해<br />
                    고객님께 가장 유리한 조건만 제안합니다.&rdquo;
                  </div>
                </div>
              </div>

              <div className="a4-manager-right">
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
          </div>
        </div>

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
      </section>
    );
  }

  // ============================================================================
  // 3. 혜택 조건 입력 화면 ('input')
  // ============================================================================
  return (
    <section className="container" style={{ paddingTop: '1.5rem', paddingBottom: '6rem', maxWidth: '1140px' }}>
      {/* 계산기 카테고리 전환 상단 탭 바 */}
      {renderModeTabs()}

      {/* 상단 내비게이션 & 잠금 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        {onBack ? (
          <button onClick={onBack} className="btn-back" style={{ marginBottom: 0 }}>
            <span>←</span> 홈으로 돌아가기
          </button>
        ) : (
          <div />
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
                      <span>🏬 백화점</span>
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
                      <span>🏪 로드샵</span>
                      {mixedChannelType === 'road' && (
                        <span style={{ fontSize: '0.68rem', background: 'rgba(0,0,0,0.35)', padding: '1px 5px', borderRadius: '4px', color: '#93c5fd' }}>
                          반영 중
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* 본문: 직원이 볼 수 있는 백화점 & 로드샵 2분할 조건 카드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {/* 카드 1: 백화점 결제조건 */}
                  <div
                    onClick={() => setMixedChannelType('dept')}
                    style={{
                      borderRadius: '10px',
                      padding: '0.8rem 0.9rem',
                      cursor: 'pointer',
                      background: mixedChannelType === 'dept' ? 'rgba(212, 175, 55, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      border: mixedChannelType === 'dept' ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                      boxShadow: mixedChannelType === 'dept' ? '0 0 16px rgba(245, 158, 11, 0.2)' : 'none',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fde68a' }}>🏬 백화점 결제조건</span>
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
                      <label
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={mixedDeptDiscountProof}
                          onChange={(e) => setMixedDeptDiscountProof(e.target.checked)}
                          style={{ accentColor: '#10b981', cursor: 'pointer', width: '13px', height: '13px' }}
                        />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: mixedDeptDiscountProof ? '#6ee7b7' : '#94a3b8' }}>
                          제휴카드 가입시
                        </span>
                      </label>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <label style={{ fontSize: '0.71rem', color: '#cbd5e1', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>
                        백화점 특정조건 할인 금액
                      </label>
                      <MoneyInput
                        value={mixedDeptDiscount}
                        onChange={setMixedDeptDiscount}
                        placeholder="백화점 할인 금액"
                        compact
                        accentColor="#fcd34d"
                      />
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={mixedDeptDiscountNote}
                        onChange={(e) => setMixedDeptDiscountNote(e.target.value)}
                        placeholder={`할인 명칭 (미입력 시: ${effectiveDeptNote})`}
                        style={{ ...textInputStyle, padding: '0.42rem 0.65rem', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#cbd5e1', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '0.35rem' }}>
                      💳 결제: <strong style={{ color: '#fde68a' }}>백화점 제휴카드 / 상품권 결제 (사은행사)</strong>
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
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#93c5fd' }}>🏪 로드샵 결제조건</span>
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
                          제휴카드 가입시
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
                    견적서 반영: [{mixedChannelType === 'dept' ? '🏬 백화점' : '🏪 로드샵'}]
                  </span>
                  <span>{effectiveSpecialDiscountNote}</span>
                  {mixedLumpSpecificDiscount > 0 ? (
                    <strong style={{ color: '#fca5a5' }}>-{formatWon(mixedLumpSpecificDiscount)}</strong>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>(할인금액 0원)</span>
                  )}
                  {mixedSpecialDiscountProof && (
                    <span className="a4-proof-tag" style={{ margin: 0 }}>(제휴카드 가입시)</span>
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
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>일반구매 실결제 소계</span>
                <strong style={{ fontSize: '1.55rem', fontWeight: 900, color: 'var(--accent-gold-light)' }}>
                  {formatWon(mixedLumpSubFinal)}
                </strong>
              </div>
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
              {!isMixedMode && (
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
                    const itemQty = getSubQty(item.quantity);
                    const itemMonths = Number(item.months) || 72;
                    const itemBase = getItemBaseMonthly(item);
                    const itemMonthly = getItemMonthly(item);
                    const itemGross = itemBase * itemMonths * itemQty;
                    const itemFeeDiscount = itemBase - itemMonthly > 0 ? (itemBase - itemMonthly) * itemMonths * itemQty : 0;
                    const itemServiceTotal =
                      ((Number(item.freeRepairFee) || 0) * itemMonths +
                        (Number(item.selfCareFee) || 0) +
                        (Number(item.visitCareFee) || 0)) *
                      itemQty;

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
                              value={item.serviceCycle || 12}
                              onChange={(e) => handleUpdateMixedSubItem(item.id, 'serviceCycle', Number(e.target.value))}
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
                              {[6, 12, 36].map((c) => (
                                <option key={c} value={c} style={{ background: '#0f172a', color: 'white' }}>
                                  {c}개월 주기
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
                            <label style={{ fontSize: '0.71rem', color: '#6ee7b7', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                              <ShieldCheck size={12} /> 무상수리 이용금액(월)
                            </label>
                            <MoneyInput
                              value={item.freeRepairFee}
                              onChange={(val) => handleUpdateMixedSubItem(item.id, 'freeRepairFee', val)}
                              placeholder="월 A/S이용액"
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
                            <label style={{ fontSize: '0.71rem', color: '#6ee7b7', fontWeight: 800, display: 'block', marginBottom: '0.2rem' }}>
                              방문케어 비용(전문가)
                            </label>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', color: '#cbd5e1', paddingTop: '0.2rem', borderTop: '1px dashed rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: '0.3rem' }}>
                          <span>
                            기준총액: <strong style={{ color: '#bfdbfe' }}>{formatWon(itemGross)}</strong> (월 {formatWon(itemBase * itemQty)} × {itemMonths}개월)
                          </span>
                          <span>
                            실납부: <strong style={{ color: '#60a5fa' }}>월 {formatWon(itemMonthly * itemQty)}</strong>
                            {itemFeeDiscount > 0 && <span style={{ color: '#86efac', marginLeft: '3px' }}>(-{formatWon(itemFeeDiscount)} 할인)</span>}
                            {itemServiceTotal > 0 && <span style={{ color: '#6ee7b7', marginLeft: '4px' }}>· 서비스혜택 +{formatWon(itemServiceTotal)}</span>}
                            {(Number(item.prepay) || 0) > 0 && <span style={{ color: '#fde68a', marginLeft: '4px' }}>· 선납 {formatWon(item.prepay)}</span>}
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
                  <label style={labelStyle}>선납금 합계 (선택)</label>
                  <MoneyInput value={subPrepay} onChange={setSubPrepay} accentColor="#93c5fd" compact />
                </div>

                {/* 2. 두 번째 칸~: 구독료 합계 금액(넓게) + 약정기간(컴팩트) 일원화 목록 & 하단 추가 버튼 */}
                <div style={{ marginBottom: '0.95rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.4rem',
                      paddingRight: subPlans.length > 1 ? '2rem' : 0
                    }}
                  >
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'white' }}>
                      {subInputMode === 'monthly' ? '월 구독료 합계 금액' : '약정 구독료 합계 금액'}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#93c5fd', width: '82px', textAlign: 'center' }}>
                      약정기간
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {subPlans.map((plan, idx) => (
                      <div key={plan.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
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
                          />
                        </div>

                        <select
                          value={plan.months}
                          onChange={(e) => handleUpdateSubPlan(plan.id, { months: Number(e.target.value) })}
                          aria-label={`약정기간 선택 ${idx + 1}`}
                          style={{
                            width: '82px',
                            height: '46px',
                            flexShrink: 0,
                            borderRadius: '10px',
                            background: 'rgba(30, 58, 138, 0.45)',
                            border: '1px solid rgba(96, 165, 250, 0.55)',
                            color: 'white',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            padding: '0 0.35rem',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          {[72, 60, 48, 36].map((m) => (
                            <option key={m} value={m} style={{ background: '#0f172a', color: 'white' }}>
                              {m}개월
                            </option>
                          ))}
                        </select>

                        {subPlans.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubPlan(plan.id)}
                            title="해당 약정 칸 삭제"
                            style={{
                              width: '28px',
                              height: '46px',
                              flexShrink: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '9px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              border: '1px solid rgba(248, 113, 113, 0.35)',
                              color: '#fca5a5',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSubPlan}
                    style={{
                      marginTop: '0.55rem',
                      width: '100%',
                      padding: '0.48rem 0.75rem',
                      borderRadius: '9px',
                      border: '1px dashed rgba(96, 165, 250, 0.55)',
                      background: 'rgba(59, 130, 246, 0.1)',
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
                    <Plus size={15} /> 약정기간 · 구독료 칸 추가
                  </button>
                </div>
              </>
            )}

            {/* 제휴카드 할인 상세 설정 (복수 카드 추가 및 중복 혜택 지원) */}
            <div style={{ marginBottom: '0.95rem', padding: '0.9rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.28)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <label style={{ ...labelStyle, marginBottom: 0, color: '#93c5fd', fontSize: '0.88rem', fontWeight: 800 }}>
                    💳 제휴카드 할인 상세 설정 {subCards.length > 1 && `(총 ${subCards.length}개 카드 중복할인)`}
                  </label>
                </div>
                <span style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 800 }}>
                  총 할인 합계: - {formatWon(subCardTotalDiscount)}
                </span>
              </div>

              {/* 제휴카드 목록 렌더링 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {subCards.map((cardItem, cardIdx) => {
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

                        {subCards.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCard(cardItem.id)}
                            title="해당 제휴카드 삭제"
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
                        )}
                      </div>

                      {/* 적용 대상 구독 모델: 카드가 1개만 활성화되었을 때는 전체 모델 자동 반영 */}
                      {subCards.length === 1 ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(59, 130, 246, 0.12)',
                            border: '1px solid rgba(96, 165, 250, 0.35)',
                            borderRadius: '7px',
                            padding: '0.4rem 0.65rem',
                            flexWrap: 'wrap',
                            gap: '0.4rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8' }}>
                              🎯 적용 구독 모델:
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f1f5f9' }}>
                              전체 구독 모델 자동 반영 (총 {(isMixedMode ? validMixedSubItems : activePlans).length}개 모델 합산)
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>
                            약정기간: {isMultiPeriod ? `${periodSummaryLabel} 다구간 자동 계산` : `${subMonths}개월`}
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(96, 165, 250, 0.3)',
                            borderRadius: '7px',
                            padding: '0.35rem 0.55rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8' }}>
                            🎯 적용 구독 모델:
                          </span>
                          <select
                            value={cardItem.targetModelIndex !== undefined && cardItem.targetModelIndex !== null ? cardItem.targetModelIndex : cardIdx}
                            onChange={(e) => {
                              const selectedIdx = Number(e.target.value);
                              let targetMonths = 72;
                              let targetMonthly = 0;
                              if (isMixedMode) {
                                if (selectedIdx >= 0 && mixedSubItems[selectedIdx]) {
                                  targetMonths = Number(mixedSubItems[selectedIdx].months) || 72;
                                  targetMonthly = getItemMonthly(mixedSubItems[selectedIdx]) * getSubQty(mixedSubItems[selectedIdx].quantity);
                                } else {
                                  targetMonths = subMonths;
                                  targetMonthly = mixedSubMonthlyFeeTotal;
                                }
                              } else {
                                if (selectedIdx >= 0 && activePlans[selectedIdx]) {
                                  targetMonths = Number(activePlans[selectedIdx].months) || 72;
                                  targetMonthly = activePlans[selectedIdx].rowMonthly || 0;
                                } else {
                                  targetMonths = subMonths;
                                  targetMonthly = effectiveMonthlyBase;
                                }
                              }

                              const patch = {
                                targetModelIndex: selectedIdx,
                                months: targetMonths
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
                              handleUpdateCard(cardItem.id, patch);
                            }}
                            style={{
                              flex: 1,
                              minWidth: '180px',
                              padding: '0.24rem 0.5rem',
                              borderRadius: '6px',
                              background: '#0f172a',
                              border: '1px solid #38bdf8',
                              color: '#ffffff',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {isMixedMode ? (
                              <>
                                {mixedSubItems.map((p, pIdx) => {
                                  const title = (p.name || '').trim() || `구독 모델 ${pIdx + 1}`;
                                  const m = Number(p.months) || 72;
                                  const monthly = getItemMonthly(p) * getSubQty(p.quantity);
                                  return (
                                    <option key={p.id || pIdx} value={pIdx}>
                                      {pIdx + 1}번: {title} ({m}개월 · 월 {formatWon(monthly)})
                                    </option>
                                  );
                                })}
                                <option value={-1}>
                                  전체 구독 모델 합산 (월 {formatWon(mixedSubMonthlyFeeTotal)})
                                </option>
                              </>
                            ) : (
                              <>
                                {activePlans.map((p, pIdx) => (
                                  <option key={p.id || pIdx} value={pIdx}>
                                    {pIdx + 1}번: {p.name || `품목 ${pIdx + 1}`} ({p.months}개월 · 월 {formatWon(p.rowMonthly)})
                                  </option>
                                ))}
                                <option value={-1}>
                                  전체 품목 합산 (월 {formatWon(effectiveMonthlyBase)})
                                </option>
                              </>
                            )}
                          </select>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>약정기간:</span>
                            <select
                              value={cardItem.months || (isMixedMode ? (mixedSubItems[cardItem.targetModelIndex !== undefined ? cardItem.targetModelIndex : cardIdx]?.months || 72) : 72)}
                              onChange={(e) => handleUpdateCard(cardItem.id, { months: Number(e.target.value) })}
                              style={{
                                padding: '0.18rem 0.4rem',
                                borderRadius: '6px',
                                background: '#0f172a',
                                border: '1px solid #60a5fa',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {[72, 60, 48, 36].map((m) => (
                                <option key={m} value={m}>{m}개월</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

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
                              약정기간 다구간 자동 계산
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
                          const targetIdx = isSingleCardMode
                            ? -1
                            : (cardItem.targetModelIndex !== undefined && cardItem.targetModelIndex !== null && Number(cardItem.targetModelIndex) >= 0
                                ? Number(cardItem.targetModelIndex)
                                : (cardIdx < (isMixedMode ? mixedSubItems.length : activePlans.length) ? cardIdx : 0));
                          const pFee = isMixedMode
                            ? (targetIdx >= 0 && mixedSubItems[targetIdx]
                                ? getItemMonthly(mixedSubItems[targetIdx]) * getSubQty(mixedSubItems[targetIdx].quantity)
                                : mixedSubMonthlyFeeTotal)
                            : (targetIdx >= 0 && activePlans[targetIdx]
                                ? activePlans[targetIdx].rowMonthly || 0
                                : effectiveMonthlyBase);
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
                })}
              </div>

              {/* 제휴카드 수동 추가 버튼 */}
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

            {/* 삼성AI구독 혜택(캐시백) - 복합 모드일 때는 좌측 일반구매 쪽에 배치되므로 숨김 */}
            {!isMixedMode && (
              <div style={{ marginBottom: '0.95rem' }}>
                <label style={{ ...labelStyle, fontSize: '0.9rem', color: 'white' }}>
                  삼성AI구독 혜택(캐시백)
                </label>
                <MoneyInput value={subPurchaseBenefit} onChange={setSubPurchaseBenefit} compact accentColor="#93c5fd" />
              </div>
            )}

            {/* 구독 전용 서비스 혜택 금액: 맨 위칸(무상서비스 합계) + 두 번째 칸(케어서비스 합계) (비교 모드 전용, 복합 모드는 모델별로 설정) */}
            {!isMixedMode && (
            <div
              style={{
                padding: '0.9rem',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.07)',
                border: '1px solid rgba(52, 211, 153, 0.3)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#6ee7b7' }}>
                  구독 전용 서비스 혜택 금액
                </span>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.77rem', color: '#a7f3d0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeServiceInFinal}
                    onChange={(e) => setIncludeServiceInFinal(e.target.checked)}
                  />
                  최종 체감가에 차감 반영
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* 1) 무상 A/S 연장 이용료(혜택) - 1번 2900원 72개월, 2번 1900원 60개월 ... 간소화 입력 */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    borderRadius: '12px',
                    padding: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <label style={{ ...labelStyle, color: '#d1fae5', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0, fontWeight: 700, fontSize: '0.88rem' }}>
                      <ShieldCheck size={15} style={{ color: '#34d399' }} /> 무상 A/S 연장 이용료(혜택)
                    </label>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#6ee7b7' }}>
                      총 혜택 합계: - {formatWon(subFreeServiceAmount)}
                      {validFreeServiceCount > 0 && ` (총 ${validFreeServiceCount}개 품목 · ${totalFreeServiceQuantity}대)`}
                    </span>
                  </div>

                  {/* 품목별 목록 (1번 금액 x 대수 x 개월수 ...) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {subFreeServiceItems.map((item, idx) => {
                      const itemQty = item.quantity === '' ? 1 : Number(item.quantity) || 1;
                      const itemTotal = (Number(item.monthlyFee) || 0) * itemQty * (Number(item.months) || 72);
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(52, 211, 153, 0.2)',
                            borderRadius: '8px',
                            padding: '0.45rem 0.65rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          {/* 품목 번호 배지 */}
                          <span
                            style={{
                              background: 'rgba(52, 211, 153, 0.2)',
                              border: '1px solid rgba(52, 211, 153, 0.45)',
                              color: '#6ee7b7',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              flexShrink: 0
                            }}
                          >
                            {idx + 1}번
                          </span>

                          {/* 월 이용료 입력 */}
                          <div style={{ flex: '1 1 110px', minWidth: '105px' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={item.monthlyFee ? Number(item.monthlyFee).toLocaleString() : ''}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, '');
                                  handleUpdateFreeServiceItem(item.id, 'monthlyFee', raw ? parseInt(raw, 10) : 0);
                                }}
                                placeholder="월 금액 (예: 2,900)"
                                style={{
                                  ...textInputStyle,
                                  padding: '0.45rem 1.6rem 0.45rem 0.65rem',
                                  fontSize: '0.86rem',
                                  textAlign: 'right'
                                }}
                              />
                              <span style={{ position: 'absolute', right: '0.55rem', color: '#94a3b8', fontSize: '0.76rem', pointerEvents: 'none' }}>
                                원
                              </span>
                            </div>
                          </div>

                          {/* 곱하기 기호 × */}
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>×</span>

                          {/* 대수 입력 */}
                          <div style={{ width: '75px', flexShrink: 0 }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={item.quantity !== undefined ? item.quantity : 1}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, '');
                                  handleUpdateFreeServiceItem(item.id, 'quantity', raw === '' ? '' : parseInt(raw, 10));
                                }}
                                placeholder="1"
                                style={{
                                  ...textInputStyle,
                                  padding: '0.45rem 1.4rem 0.45rem 0.5rem',
                                  fontSize: '0.86rem',
                                  textAlign: 'right'
                                }}
                              />
                              <span style={{ position: 'absolute', right: '0.45rem', color: '#94a3b8', fontSize: '0.76rem', pointerEvents: 'none' }}>
                                대
                              </span>
                            </div>
                          </div>

                          {/* 곱하기 기호 × */}
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>×</span>

                          {/* 약정 개월수 선택/입력 */}
                          <div style={{ width: '95px', flexShrink: 0 }}>
                            <select
                              value={item.months || 72}
                              onChange={(e) => handleUpdateFreeServiceItem(item.id, 'months', parseInt(e.target.value, 10))}
                              style={{
                                ...textInputStyle,
                                padding: '0.45rem 0.5rem',
                                fontSize: '0.86rem',
                                background: '#0f172a',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="72">72개월</option>
                              <option value="60">60개월</option>
                              <option value="48">48개월</option>
                              <option value="36">36개월</option>
                            </select>
                          </div>

                          {/* 계산 금액 라벨 */}
                          <div style={{ minWidth: '95px', textAlign: 'right', fontSize: '0.8rem', color: '#a7f3d0', fontWeight: 700, flexShrink: 0 }}>
                            = {formatWon(itemTotal)}
                          </div>

                          {/* 삭제 버튼 */}
                          {subFreeServiceItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFreeServiceItem(item.id)}
                              title="이 품목 삭제"
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#fca5a5',
                                borderRadius: '6px',
                                padding: '0.35rem 0.45rem',
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
                      );
                    })}
                  </div>

                  {/* 품목 추가 버튼 */}
                  <button
                    type="button"
                    onClick={handleAddFreeServiceItem}
                    style={{
                      marginTop: '0.55rem',
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px dashed rgba(52, 211, 153, 0.55)',
                      background: 'rgba(16, 185, 129, 0.08)',
                      color: '#6ee7b7',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Plus size={14} /> 무상 A/S 연장 품목 추가 (2번, 3번...)
                  </button>
                </div>
                {/* 2) 케어서비스 혜택(방문관리·소모품) - 1번 소모품비용, 2번 방문케어 세부설정 */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    borderRadius: '12px',
                    padding: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <label style={{ ...labelStyle, color: '#d1fae5', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0, fontWeight: 700, fontSize: '0.88rem' }}>
                      <Wrench size={15} style={{ color: '#34d399' }} /> 케어서비스 혜택(방문관리·소모품)
                    </label>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#6ee7b7' }}>
                      총 혜택 합계: - {formatWon(subCareServiceAmount)}
                      {validCareServiceCount > 0 && ` (총 ${validCareServiceCount}개 항목)`}
                    </span>
                  </div>

                  {/* 케어서비스 항목 목록 (1번 소모품비용 갯수, 2번 방문케어 횟수 ...) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {subCareServiceItems.map((item, idx) => {
                      const itemUnit = item.unit || (item.name?.includes('소모품') ? '개' : '회');
                      const itemTotal = (Number(item.amount) || 0) * (Number(item.count) || 1);
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.45rem',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(52, 211, 153, 0.2)',
                            borderRadius: '8px',
                            padding: '0.45rem 0.65rem',
                            flexWrap: 'wrap'
                          }}
                        >
                          {/* 번호 배지 */}
                          <span
                            style={{
                              background: 'rgba(52, 211, 153, 0.2)',
                              border: '1px solid rgba(52, 211, 153, 0.45)',
                              color: '#6ee7b7',
                              fontSize: '0.76rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              flexShrink: 0
                            }}
                          >
                            {idx + 1}번
                          </span>

                          {/* 항목명 입력 (기본: 소모품비용, 방문케어) */}
                          <div style={{ flex: '1 1 100px', minWidth: '90px' }}>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateCareServiceItem(item.id, 'name', e.target.value)}
                              placeholder="항목명"
                              style={{
                                ...textInputStyle,
                                padding: '0.45rem 0.65rem',
                                fontSize: '0.85rem',
                                color: '#e2e8f0',
                                fontWeight: 600
                              }}
                            />
                          </div>

                          {/* 금액 (단가) 입력 */}
                          <div style={{ flex: '1.2 1 115px', minWidth: '105px' }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={item.amount ? Number(item.amount).toLocaleString() : ''}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, '');
                                  handleUpdateCareServiceItem(item.id, 'amount', raw ? parseInt(raw, 10) : 0);
                                }}
                                placeholder="금액 (예: 50,000)"
                                style={{
                                  ...textInputStyle,
                                  padding: '0.45rem 1.6rem 0.45rem 0.65rem',
                                  fontSize: '0.85rem',
                                  textAlign: 'right',
                                  color: '#a7f3d0',
                                  fontWeight: 700
                                }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  right: '0.55rem',
                                  fontSize: '0.78rem',
                                  color: '#94a3b8',
                                  pointerEvents: 'none'
                                }}
                              >
                                원
                              </span>
                            </div>
                          </div>

                          {/* 갯수 / 횟수 입력 */}
                          <div style={{ width: '82px', flexShrink: 0 }}>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={item.count !== undefined ? item.count : 1}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, '');
                                  handleUpdateCareServiceItem(item.id, 'count', raw ? parseInt(raw, 10) : '');
                                }}
                                placeholder="1"
                                title={itemUnit === '개' ? '소모품 갯수' : '방문케어 횟수'}
                                style={{
                                  ...textInputStyle,
                                  padding: '0.45rem 1.6rem 0.45rem 0.5rem',
                                  fontSize: '0.85rem',
                                  textAlign: 'center',
                                  color: '#e2e8f0',
                                  fontWeight: 700
                                }}
                              />
                              <span
                                style={{
                                  position: 'absolute',
                                  right: '0.5rem',
                                  fontSize: '0.78rem',
                                  color: '#34d399',
                                  fontWeight: 700,
                                  pointerEvents: 'none'
                                }}
                              >
                                {itemUnit}
                              </span>
                            </div>
                          </div>

                          {/* 계산 금액 라벨 */}
                          <div
                            style={{
                              minWidth: '95px',
                              textAlign: 'right',
                              fontSize: '0.82rem',
                              color: '#a7f3d0',
                              fontWeight: 700,
                              flexShrink: 0
                            }}
                          >
                            = {formatWon(itemTotal)}
                          </div>

                          {/* 삭제 버튼 */}
                          {subCareServiceItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCareServiceItem(item.id)}
                              title="이 항목 삭제"
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#fca5a5',
                                borderRadius: '6px',
                                padding: '0.35rem 0.45rem',
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
                      );
                    })}
                  </div>

                  {/* 항목 추가 버튼 */}
                  <button
                    type="button"
                    onClick={handleAddCareServiceItem}
                    style={{
                      marginTop: '0.55rem',
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px dashed rgba(52, 211, 153, 0.55)',
                      background: 'rgba(16, 185, 129, 0.08)',
                      color: '#6ee7b7',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Plus size={14} /> 케어서비스 항목 추가 (3번, 4번...)
                  </button>
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
              <span>총 구독 기준금액</span>
              <span>{formatWon(isMixedMode ? mixedSubGrossTotal : subGrossTotal)}</span>
            </div>
            {isMixedMode ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.28rem', color: '#cbd5e1' }}>
                  <span>제휴카드 적용 월 실납부액</span>
                  <strong style={{ color: 'white' }}>월 {formatWon(mixedSubMonthlyAfterCard)}</strong>
                </div>
                {mixedSubPrepayTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.28rem', color: '#cbd5e1' }}>
                    <span>선납금 합계 (초기 일시불)</span>
                    <strong style={{ color: '#fde68a' }}>{formatWon(mixedSubPrepayTotal)}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.45rem', color: '#cbd5e1' }}>
                  <span>총 혜택 합계 (할인 + 서비스)</span>
                  <strong style={{ color: '#93c5fd' }}>- {formatWon(mixedSubOnlyDiscount)}</strong>
                </div>
              </>
            ) : isMultiPeriod ? (
              subSegments.map((seg, idx) => (
                <div
                  key={seg.endMonth}
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.24rem', color: '#cbd5e1' }}
                >
                  <span>
                    {idx === 0
                      ? `${seg.duration}개월간 월 실납부액 (1~${seg.endMonth}개월)`
                      : `나머지 ${seg.duration}개월 월 실납부액 (${seg.startMonth}~${seg.endMonth}개월)`}
                  </span>
                  <strong style={{ color: 'white' }}>월 {formatWon(seg.netMonthly)}</strong>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.28rem', color: '#cbd5e1' }}>
                <span>제휴카드 적용 월 실납부액</span>
                <strong style={{ color: 'white' }}>월 {formatWon(subMonthlyAfterCard)}</strong>
              </div>
            )}
            {!isMixedMode && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.45rem', color: '#cbd5e1' }}>
                <span>총 혜택 합계 (할인·혜택 + 서비스)</span>
                <strong style={{ color: '#93c5fd' }}>- {formatWon(subTotalBenefitSum)}</strong>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.55rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                {isMixedMode ? '구독 체감 소계 (기준가 - 혜택)' : '삼성AI구독 최종 체감가'}
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
                                <span className="a4-proof-tag" style={{ margin: 0 }}>(증빙완료시)</span>
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
                                <span className="a4-proof-tag" style={{ margin: 0 }}>(증빙완료시)</span>
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
                    총 혜택 - {formatWon(mixedGrandBenefit)} ({mixedGrandBenefitRate}%)
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

        {/* 삼성카드 실적 유효성 검사 (구독료 7만원 미만 시 70만원 실적 입력 불가 및 2.6만원 할인 방지) */}
        <button
          type="button"
          onClick={() => {
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
                const targetIdx = isSingleCardMode
                  ? -1
                  : (c.targetModelIndex !== undefined && c.targetModelIndex !== null && Number(c.targetModelIndex) >= 0
                      ? Number(c.targetModelIndex)
                      : (cardIdx < (isMixedMode ? mixedSubItems.length : activePlans.length) ? cardIdx : 0));
                const pFee = isMixedMode
                  ? (targetIdx >= 0 && mixedSubItems[targetIdx]
                      ? getItemMonthly(mixedSubItems[targetIdx]) * getSubQty(mixedSubItems[targetIdx].quantity)
                      : mixedSubMonthlyFeeTotal)
                  : (targetIdx >= 0 && activePlans[targetIdx]
                      ? activePlans[targetIdx].rowMonthly || 0
                      : effectiveMonthlyBase);

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
          }}
          className="btn-primary pulse"
          style={{ padding: '1rem 2.2rem', fontSize: '1.1rem' }}
        >
          {isMixedMode ? '스마트 견적서 보기 (A4 출력)' : '비교 결과 보기 (A4 출력)'} <ChevronRight size={20} />
        </button>
      </div>
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
