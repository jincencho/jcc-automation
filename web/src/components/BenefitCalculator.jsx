import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Calculator,
  Printer,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Award,
  Phone,
  MapPin,
  MessageCircle,
  Globe,
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
  Upload
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
  const [subPlans, setSubPlans] = useState([{ id: 1, months: 72, monthlyFee: 0, totalAmount: 0 }]);
  const [subCardName, setSubCardName] = useState(''); // 제휴카드 이름 (직접 입력)
  const [subCardMinSpend, setSubCardMinSpend] = useState(''); // 제휴카드 필요 전월실적 (직접 입력)
  const [subCardMonthly, setSubCardMonthly] = useState(0); // 제휴카드 월 청구할인 금액
  const [activeQrModalItem, setActiveQrModalItem] = useState(null); // 확대 모달에 표시할 카드 QR 아이템
  const [subCardAuto70k, setSubCardAuto70k] = useState(true); // 구독료 7만원 이상 시 2.6만 / 미만 시 1.6만 자동 전환
  const [subSegmentCardOverrides, setSubSegmentCardOverrides] = useState({}); // 구간별 청구할인 수동 조정값
  const [subSegmentSpendOverrides, setSubSegmentSpendOverrides] = useState({}); // 구간별 필요실적 수동 조정값
  const [subPurchaseBenefit, setSubPurchaseBenefit] = useState(0); // 통합 구독 구매 혜택 금액
  const [subFreeServiceAmount, setSubFreeServiceAmount] = useState(0); // 무상서비스 금액 합계
  const [subCareServiceAmount, setSubCareServiceAmount] = useState(0); // 케어서비스 합계 금액
  const [includeServiceInFinal, setIncludeServiceInFinal] = useState(true); // 무상·케어 금액을 최종 체감가에 반영

  // 복수 제휴카드 목록 상태 (구독 품목 증가 시 제휴카드 복수 등록 및 중복할인 지원)
  const [subCards, setSubCards] = useState([
    {
      id: 1,
      cardName: '',
      minSpend: '',
      monthly: 0,
      months: null,
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
      const m = defaultMonths || subPlans[prev.length]?.months || 72;
      const firstIsSamsung = checkIsSamsungCard(prev[0]?.cardName || subCardName || '');
      const newCardName = firstIsSamsung ? '구독엔로카 AMEX' : '삼성전자 AI구독 삼성카드';
      const newSpend = firstIsSamsung ? '50만' : '70만';
      const newMonthly = firstIsSamsung ? 16000 : 26000;
      return [
        ...prev,
        {
          id: nextId,
          cardName: newCardName,
          minSpend: newSpend,
          monthly: newMonthly,
          months: m,
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
      return [...prev, { id: nextId, months: nextDefaultMonths, monthlyFee: 0, totalAmount: 0 }];
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
    if (passwordInput === '1207') {
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

  // ---------------- 계산 로직 ----------------
  const normalizedPlans = subPlans.map((p) => {
    const m = Number(p.months) || 72;
    const rowMonthly =
      subInputMode === 'monthly'
        ? Number(p.monthlyFee) || 0
        : m > 0
          ? Math.round((Number(p.totalAmount) || 0) / m)
          : 0;
    const rowGross = subInputMode === 'monthly' ? rowMonthly * m : Number(p.totalAmount) || 0;
    return { ...p, months: m, rowMonthly, rowGross };
  });

  const nonZeroPlans = normalizedPlans.filter((p) => p.rowMonthly > 0 || p.rowGross > 0);
  const activePlans = nonZeroPlans.length > 0 ? nonZeroPlans : [normalizedPlans[0]];
  const sortedUniqueMonths = [...new Set(activePlans.map((p) => p.months))].sort((a, b) => a - b);
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
    const baseMonthly = activePlans
      .filter((p) => p.months >= endMonth)
      .reduce((sum, p) => sum + p.rowMonthly, 0);

    const hasManualCardOverride = Object.prototype.hasOwnProperty.call(subSegmentCardOverrides, endMonth);
    let targetCard = hasManualCardOverride
      ? Number(subSegmentCardOverrides[endMonth]) || 0
      : cardMonthlyNum;

    // 삼성카드의 경우: 구독료 7만원 이상일 때 70만원 실적에 26,000원, 7만원 미만이면 30만원 구간에 16,000원 자동 반영 (수동 조정 없을 시)
    if (!hasManualCardOverride && isSamsungCard) {
      if (baseMonthly >= 70000 && (targetCard === 0 || targetCard === 16000)) {
        targetCard = 26000;
      } else if (baseMonthly < 70000 && targetCard > 16000) {
        targetCard = 16000;
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
        // 삼성카드의 경우 2구간 이후 구독료가 7만원 미만이면 30만원 구간 자동 반영
        if (isSamsungCard && seg?.baseMonthly < 70000) {
          rawSpend = '30만';
        } else {
          rawSpend = trimmedCardSpend;
        }
      }
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
        if (effectiveMonthlyBase >= 70000) {
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
    const defaultSpend = isSamsung ? '70만' : isLotte ? '50만' : '30만';
    const defaultMonthly = isSamsung ? 26000 : 16000;

    handleUpdateCard(cardId, {
      cardName: cardFullName,
      minSpend: defaultSpend,
      monthly: defaultMonthly,
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
    const matchedPlan = activePlans[cardIdx] || activePlans[activePlans.length - 1];
    const planMonthlyFee = matchedPlan?.rowMonthly || effectiveMonthlyBase;
    const cardMonths = Number(c.months) || (matchedPlan ? matchedPlan.months : subMonths);
    const monthlyNum = Number(c.monthly) || 0;

    const isEligible = Boolean(
      (policy && policy.features.some((f) => f.label.includes('구독료') && f.status === 'O')) ||
      isSamsung ||
      trimmedName.includes('롯데') ||
      trimmedName.includes('로카')
    );

    if (isSingleCardMode && isSamsung && isMultiPeriod) {
      const segDiscounts = subSegments.reduce((sum, seg) => sum + seg.appliedCard * seg.duration, 0);
      return {
        card: c,
        company,
        isSamsung,
        isNonSamsung: Boolean(trimmedName && !isSamsung),
        policy,
        totalDiscount: segDiscounts,
        lines: cardSubLines,
        isMultiLine: true
      };
    }

    const totalDiscount = monthlyNum * cardMonths;

    const spendDesc = getDeductedSpendDesc(c.minSpend, planMonthlyFee, trimmedName);

    const discountText = monthlyNum > 0 ? `(-${formatWon(monthlyNum)} X ${cardMonths}개월)` : '';
    const lineText = [spendDesc, discountText].filter(Boolean).join(' ');

    return {
      card: c,
      company,
      isSamsung,
      isNonSamsung: Boolean(trimmedName && !isSamsung),
      policy,
      totalDiscount,
      lines: lineText ? [lineText] : [],
      isMultiLine: false
    };
  });

  const subCardTotalDiscount = isSingleCardMode && isSamsungCard && isMultiPeriod
    ? subSegments.reduce((sum, seg) => sum + seg.appliedCard * seg.duration, 0)
    : cardDetails.reduce((sum, d) => sum + d.totalDiscount, 0);

  const cardCompanySummary = [...new Set(cardDetails.map((d) => d.company).filter(Boolean))].join(' + ');

  const allCardSubLines = isSingleCardMode
    ? cardDetails[0]?.lines || cardSubLines
    : cardDetails.map((d, i) => {
        const line = d.lines[0] || '';
        const symbol = ['①', '②', '③', '④', '⑤'][i] || `[${i + 1}]`;
        return `${symbol} ${d.company ? `${d.company} · ` : ''}${line}`;
      });

  const hasAnyNonSamsungCard = cardDetails.some((d) => d.isNonSamsung);

  const startingTotalCardMonthly = isSingleCardMode
    ? subSegments[0]?.appliedCard || cardMonthlyNum
    : cardDetails.reduce((sum, d) => sum + (Number(d.card.monthly) || 0), 0);

  const subMonthlyAfterCard = Math.max(0, effectiveMonthlyBase - startingTotalCardMonthly);

  const hasCareService = (Number(subCareServiceAmount) || 0) > 0;
  const subServiceTotal = (Number(subFreeServiceAmount) || 0) + (Number(subCareServiceAmount) || 0);
  const subCashBenefitTotal = subCardTotalDiscount + (Number(subPurchaseBenefit) || 0);
  const subTotalBenefitSum = subCashBenefitTotal + (includeServiceInFinal ? subServiceTotal : 0);

  const subFinalPrice = Math.max(0, subGrossTotal - subTotalBenefitSum);

  // 최종 차이가격: 일반구매 일시불 조건(lumpFinalPrice) 대비 비교
  const rawDiff = lumpFinalPrice - subFinalPrice; // 양수면 삼성AI구독이 일시불보다도 더 저렴
  const absDiff = Math.abs(rawDiff);

  const winner =
    recommendMode === 'sub'
      ? 'sub'
      : recommendMode === 'lump'
        ? 'lump'
        : rawDiff >= 0
          ? 'sub'
          : 'lump';

  const toggleCheckpoint = (id) => {
    setCheckpoints((prev) => prev.map((cp) => (cp.id === id ? { ...cp, checked: !cp.checked } : cp)));
  };

  const handleResetAll = () => {
    if (!window.confirm('입력하신 모든 계산 내역을 초기화하시겠습니까?')) return;
    setCustomerName('');
    setConsultDate(todayStr);
    setConsultType('입주가전 맞춤설계');
    setProductSummary('');
    setMemo('');
    setLumpBasePrice(0);
    setLumpTotalBenefit(0);
    setSubInputMode('monthly');
    setSubPrepay(0);
    setSubPlans([{ id: 1, months: 72, monthlyFee: 0, totalAmount: 0 }]);
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
    setSubFreeServiceAmount(0);
    setSubCareServiceAmount(0);
    setIncludeServiceInFinal(true);
    setRecommendMode('auto');
    setCheckpoints(DEFAULT_CHECKPOINTS);
    setActiveQuoteId(null);
    setQuoteTitleInput('');
    setStep('input');
  };

  // ---------------- 견적 보관함 (저장 / 불러오기 / 파일 내보내기·가져오기) ----------------
  const [savedQuotes, setSavedQuotes] = useState(() => {
    try {
      const raw = localStorage.getItem('jcc_calc_saved_quotes');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [quoteTitleInput, setQuoteTitleInput] = useState('');
  const [activeQuoteId, setActiveQuoteId] = useState(null);
  const [saveNotice, setSaveNotice] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('jcc_calc_saved_quotes', JSON.stringify(savedQuotes));
    } catch {
      // localStorage 용량 초과 등 예외 무시
    }
  }, [savedQuotes]);

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

    return {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      savedAt,
      summary: {
        lumpFinalPrice,
        subFinalPrice,
        subMonthlyAfterCard
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
        subFreeServiceAmount,
        subCareServiceAmount,
        includeServiceInFinal,
        recommendMode,
        checkpoints
      }
    };
  };

  const applyQuoteData = (quoteObj) => {
    const d = quoteObj?.data || quoteObj;
    if (!d || typeof d !== 'object') return false;

    setCustomerName(d.customerName ?? '');
    setConsultDate(d.consultDate || todayStr);
    setConsultType(d.consultType || '입주가전 맞춤설계');
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
    setSubFreeServiceAmount(Number(d.subFreeServiceAmount) || 0);
    setSubCareServiceAmount(Number(d.subCareServiceAmount) || 0);
    setIncludeServiceInFinal(d.includeServiceInFinal !== undefined ? Boolean(d.includeServiceInFinal) : true);
    setRecommendMode(d.recommendMode || 'auto');
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
    showTempNotice(`✓ '${snapshot.title}' 견적이 보관함에 저장되었습니다.`);
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
    showTempNotice(`✓ '${snapshot.title}' 견적이 수정 저장되었습니다.`);
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
    const payload = {
      type: 'JCC_QUOTE_ARCHIVE',
      exportedAt: new Date().toISOString(),
      currentQuote: currentSnapshot,
      savedQuotes: savedQuotes.some((q) => q.id === activeQuoteId)
        ? savedQuotes
        : [currentSnapshot, ...savedQuotes]
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JCC_견적_${safeFileTitle}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showTempNotice(`✓ 견적 파일(JCC_견적_${safeFileTitle}.json)이 다운로드되었습니다.`);
  };

  const handleImportQuoteFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || ''));
        if (parsed?.type === 'JCC_QUOTE_ARCHIVE') {
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
                id: `q_${Date.now()}`,
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
              <Save size={16} /> {activeQuoteId ? '현재 견적 수정저장' : '이 견적 보관함에 저장'}
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
              <Download size={16} /> 견적 파일저장
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="btn-primary pulse"
            style={{ padding: '0.85rem 1.8rem', fontSize: '1rem' }}
          >
            <Printer size={19} /> A4 용지로 인쇄 / PDF 저장
          </button>
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

        {/* ==================== A4 출력 시트 ==================== */}
        <div className="a4-sheet-wrapper">
          <div className="a4-print-sheet">
            {/* 1. 상단 리포트 헤더 */}
            <header className="a4-header">
              <div className="a4-header-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                  <img
                    src="/images/logo_new.png"
                    alt="JCC"
                    style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
                  />
                  <span className="a4-tag-gold">PAYMENT &amp; BENEFIT COMPARISON</span>
                </div>
                <h1 className="a4-doc-title">일반구매 vs 삼성AI구독 결제조건 비교서</h1>
                <p className="a4-doc-subtitle">일반구매와 삼성AI구독의 적용 혜택 및 최종 체감금액 안내</p>
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
                <div className="a4-meta-row">
                  <span className="a4-meta-label">상담구분</span>
                  <span className="a4-meta-badge">{consultType}</span>
                </div>
              </div>
            </header>

            {/* 품목 요약 바 (입력 시 표시) */}
            {productSummary.trim() && (
              <div className="a4-product-bar">
                <span className="a4-product-bar-label">상담 구성 품목</span>
                <span className="a4-product-bar-text">{productSummary.trim()}</span>
              </div>
            )}

            {/* 2. 최종 체감가 차이 강조 배너 */}
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

            {/* 3. 좌우 1:1 비교 카드 영역 (4단 수평 정렬 구조) */}
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
                      <span>일반구매 총 할인·혜택</span>
                      <span className="a4-minus">- {formatWon(lumpTotalBenefit)}</span>
                    </div>
                    <div className="a4-benefit-row">
                      <span>무상 A/S 보증</span>
                      <span className="a4-benefit-note">기본 보증만 적용</span>
                    </div>
                    {hasCareService && (
                      <div className="a4-benefit-row">
                        <span>전문 케어서비스</span>
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
                    <div className="a4-benefit-row">
                      <span>삼성AI구독 혜택(캐시백)</span>
                      <span className="a4-minus-blue">- {formatWon(subPurchaseBenefit)}</span>
                    </div>
                    <div className="a4-benefit-row">
                      <span>무상 A/S 보증 이용료(약정기간)</span>
                      <span className="a4-minus-blue">
                        {subFreeServiceAmount > 0
                          ? includeServiceInFinal
                            ? `- ${formatWon(subFreeServiceAmount)}`
                            : `+ ${formatWon(subFreeServiceAmount)} 상당`
                          : '무상 보증 포함'}
                      </span>
                    </div>
                    {hasCareService && (
                      <div className="a4-benefit-row">
                        <span>케어서비스 혜택(방문관리·소모품)</span>
                        <span className="a4-minus-blue">
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
                    <strong className="a4-final-price price-blue">{formatWon(subFinalPrice)}</strong>
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
                <div className="a4-contact-item">
                  <Globe size={12} />
                  <span>홈페이지: jcc-band.vercel.app</span>
                </div>
              </div>

              <div className="a4-manager-qr">
                <a
                  href="https://jcc-band.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="JCC 진센조 공식 홈페이지 바로가기"
                >
                  <CardEventQrSvg url="https://jcc-band.vercel.app" size={44} label="JCC 진센조 공식 홈페이지 QR코드" />
                  <span className="a4-manager-qr-label">
                    홈페이지 QR
                  </span>
                </a>
              </div>
            </footer>
          </div>
        </div>
      </section>
    );
  }

  // ============================================================================
  // 3. 혜택 조건 입력 화면 ('input')
  // ============================================================================
  return (
    <section className="container" style={{ paddingTop: '1.5rem', paddingBottom: '6rem', maxWidth: '1140px' }}>
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
          일반구매 vs <span className="text-gradient">삼성AI구독</span> 혜택 계산기
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
              견적 보관함 (저장 · 1클릭 불러오기)
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
              title="현재 입력된 견적과 보관함 목록을 파일(.json)로 저장하여 다른 PC(사내 PC 등)로 옮길 수 있습니다."
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
              <Download size={14} /> 견적 파일로 내보내기 (.json)
            </button>
            <label
              title="저장해둔 견적 파일(.json)을 불러옵니다."
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
              <Upload size={14} /> 견적 파일 불러오기
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
                      {q.savedAt} · 구독 체감 {formatWon(q.summary?.subFinalPrice || 0)}
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
      </div>

      {/* 2) 좌우 비교 입력 영역 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* ==================== 좌측: 일반구매 조건 카드 ==================== */}
        <div
          className="glass-panel calc-no-hover"
          style={{
            padding: '1.6rem',
            borderTop: '4px solid var(--accent-gold)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
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

        {/* ==================== 우측: 삼성AI구독 카드 ==================== */}
        <div
          className="glass-panel calc-no-hover"
          style={{
            padding: '1.6rem',
            borderTop: '4px solid var(--accent-blue)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '1px' }}>OPTION B</span>
                <h3 style={{ fontSize: '1.38rem', fontWeight: 800 }}>✨ 삼성AI구독 조건</h3>
              </div>
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
            </div>

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
                  const matchedPlan = subPlans[cardIdx];

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
                      {/* 제휴카드 카드 헤더 (카드 순번, 품목 연동, 적용 약정기간, 삭제 버튼) */}
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
                          {matchedPlan && (
                            <span style={{ fontSize: '0.69rem', color: '#94a3b8' }}>
                              (품목 {cardIdx + 1}: {matchedPlan.months}개월 · {formatWon(matchedPlan.rowMonthly)})
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>적용 약정:</span>
                          <select
                            value={cardItem.months || (matchedPlan ? matchedPlan.months : subMonths)}
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
                      </div>

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

                      {/* 2번째: 필요 실적 직접 입력 */}
                      <div>
                        <div style={{ marginBottom: '0.28rem' }}>
                          <span style={{ fontSize: '0.79rem', fontWeight: 700, color: '#dbeafe' }}>2. 필요 실적 (전월 실적)</span>
                        </div>
                        {subCards.length === 1 && isMultiPeriod && isSamsung ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {subSegments.map((seg, idx) => {
                              const segVal =
                                subSegmentSpendOverrides[seg.endMonth] !== undefined
                                  ? subSegmentSpendOverrides[seg.endMonth]
                                  : idx === 0
                                  ? cardItem.minSpend
                                  : isSamsung && seg.baseMonthly < 70000
                                  ? '30만'
                                  : cardItem.minSpend;
                              const deducted = getDeductedSpendDesc(segVal, seg.baseMonthly, cardItem.cardName);
                              const cleanExpected = (segVal && segVal.startsWith('월') ? segVal : `월 ${segVal || ''}`).replace(/\s*사용$/, '') + ' 사용';
                              const isDeducted =
                                checkIsSubFeeRecognizedCard(cardItem.cardName) &&
                                deducted &&
                                deducted !== cleanExpected;
                              return (
                                <div key={seg.endMonth}>
                                  <div style={{ fontSize: '0.76rem', marginBottom: '0.22rem', color: '#cbd5e1' }}>
                                    {idx === 0
                                      ? `${seg.duration}개월간 (1~${seg.endMonth}개월 · 구독료 ${formatWon(seg.baseMonthly)})`
                                      : `나머지 ${seg.duration}개월 (${seg.startMonth}~${seg.endMonth}개월 · 구독료 ${formatWon(seg.baseMonthly)})`}
                                  </div>
                                  <input
                                    type="text"
                                    value={segVal}
                                    onChange={(e) => handleSegmentSpendOverride(seg.endMonth, e.target.value, idx === 0)}
                                    placeholder={idx === 0 ? '필요 실적 직접 입력 (예: 70만 / 50만)' : '필요 실적 직접 입력 (예: 30만 / 50만)'}
                                    style={{
                                      ...textInputStyle,
                                      padding: '0.54rem 0.75rem',
                                      fontSize: '0.88rem',
                                      background: 'rgba(15, 23, 42, 0.75)'
                                    }}
                                  />
                                  {isDeducted && (
                                    <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '0.24rem', fontWeight: 600 }}>
                                      ✓ 구독료 실적 인정 반영(견적서 노출): {deducted}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div>
                            <input
                              type="text"
                              value={cardItem.minSpend}
                              onChange={(e) => {
                                handleUpdateCard(cardItem.id, { minSpend: e.target.value });
                                if (cardIdx === 0) setSubSegmentSpendOverrides({});
                              }}
                              placeholder="필요 실적 직접 입력 (예: 50만 / 30만원)"
                              style={{
                                ...textInputStyle,
                                padding: '0.54rem 0.75rem',
                                fontSize: '0.88rem',
                                background: 'rgba(15, 23, 42, 0.75)'
                              }}
                            />
                            {(() => {
                              const matchedPlan = activePlans[cardIdx] || activePlans[activePlans.length - 1];
                              const pFee = matchedPlan?.rowMonthly || effectiveMonthlyBase;
                              const deducted = getDeductedSpendDesc(cardItem.minSpend, pFee, cardItem.cardName);
                              const cleanExpected = (cardItem.minSpend && cardItem.minSpend.startsWith('월') ? cardItem.minSpend : `월 ${cardItem.minSpend || ''}`).replace(/\s*사용$/, '') + ' 사용';
                              const isDeducted =
                                checkIsSubFeeRecognizedCard(cardItem.cardName) &&
                                deducted &&
                                deducted !== cleanExpected;
                              if (!isDeducted) return null;
                              return (
                                <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '0.24rem', fontWeight: 600 }}>
                                  ✓ 구독료 실적 인정 반영(견적서 노출): {deducted}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* 3번째: 월 청구할인 금액 직접 입력 */}
                      <div>
                        <div style={{ marginBottom: '0.28rem' }}>
                          <span style={{ fontSize: '0.79rem', fontWeight: 700, color: '#dbeafe' }}>3. 월 청구할인 금액</span>
                        </div>

                        {subCards.length === 1 && isMultiPeriod && isSamsung ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {subSegments.map((seg, idx) => {
                              const segVal = Number(seg.targetCard) || 0;
                              return (
                                <div key={seg.endMonth}>
                                  <div
                                    style={{
                                      fontSize: '0.76rem',
                                      marginBottom: '0.22rem',
                                      color: '#cbd5e1'
                                    }}
                                  >
                                    {idx === 0
                                      ? `${seg.duration}개월간 (1~${seg.endMonth}개월 · 구독료 ${formatWon(seg.baseMonthly)})`
                                      : `나머지 ${seg.duration}개월 (${seg.startMonth}~${seg.endMonth}개월 · 구독료 ${formatWon(seg.baseMonthly)})`}
                                  </div>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={segVal === 0 ? '' : segVal.toLocaleString('ko-KR')}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/[^0-9]/g, '');
                                      handleSegmentCardOverride(seg.endMonth, raw ? parseInt(raw, 10) : 0, idx === 0);
                                    }}
                                    placeholder="월 청구할인 금액 직접 입력 (예: 26,000 / 16,000)"
                                    style={{
                                      ...textInputStyle,
                                      padding: '0.54rem 0.75rem',
                                      fontSize: '0.88rem',
                                      background: 'rgba(15, 23, 42, 0.75)'
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
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
                              handleUpdateCard(cardItem.id, { monthly: val });
                              if (cardIdx === 0) setSubSegmentCardOverrides({});
                            }}
                            placeholder="월 청구할인 금액 직접 입력 (예: 26,000 / 16,000)"
                            style={{
                              ...textInputStyle,
                              padding: '0.54rem 0.75rem',
                              fontSize: '0.88rem',
                              background: 'rgba(15, 23, 42, 0.75)'
                            }}
                          />
                        )}
                      </div>
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

            {/* 삼성AI구독 혜택(캐시백) */}
            <div style={{ marginBottom: '0.95rem' }}>
              <label style={{ ...labelStyle, fontSize: '0.9rem', color: 'white' }}>
                삼성AI구독 혜택(캐시백)
              </label>
              <MoneyInput value={subPurchaseBenefit} onChange={setSubPurchaseBenefit} compact accentColor="#93c5fd" />
            </div>

            {/* 구독 전용 서비스 혜택 금액: 맨 위칸(무상서비스 합계) + 두 번째 칸(케어서비스 합계) */}
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
                <div>
                  <label style={{ ...labelStyle, color: '#d1fae5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <ShieldCheck size={14} style={{ color: '#34d399' }} /> 무상 A/S 보증 이용료(약정기간) 합계
                  </label>
                  <MoneyInput value={subFreeServiceAmount} onChange={setSubFreeServiceAmount} compact accentColor="#6ee7b7" />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: '#d1fae5', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Wrench size={14} style={{ color: '#34d399' }} /> 케어서비스 합계 금액 (미입력 시 출력 제외)
                  </label>
                  <MoneyInput value={subCareServiceAmount} onChange={setSubCareServiceAmount} compact accentColor="#6ee7b7" />
                </div>
              </div>
            </div>
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
              <span>{formatWon(subGrossTotal)}</span>
            </div>
            {isMultiPeriod ? (
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '0.45rem', color: '#cbd5e1' }}>
              <span>총 혜택 합계 (할인·혜택 + 서비스)</span>
              <strong style={{ color: '#93c5fd' }}>- {formatWon(subTotalBenefitSum)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.55rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>삼성AI구독 최종 체감가</span>
              <strong style={{ fontSize: '1.55rem', fontWeight: 900, color: '#60a5fa' }}>
                {formatWon(subFinalPrice)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3) 출력 옵션 & 상담 메모 영역 */}
      <div className="glass-panel calc-no-hover" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* 추천 플랜 강조 방식 */}
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
        </div>

        <button
          type="button"
          onClick={() => {
            setStep('result');
            window.scrollTo(0, 0);
          }}
          className="btn-primary pulse"
          style={{ padding: '1rem 2.2rem', fontSize: '1.1rem' }}
        >
          비교 결과 보기 (A4 출력) <ChevronRight size={20} />
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
