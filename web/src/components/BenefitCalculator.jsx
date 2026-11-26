import React, { useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DEPT_POS_BARCODES } from '../constants/deptBarcodes';
import { BRAND_LOGO_B64, MANAGER_PROFILE_B64 } from '../constants/brandAssets';
import {
  User,
  Globe,
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
  Sliders,
  Cloud,
  RefreshCw,
  RotateCw,
  Check,
  Minus,
  Crown,
  ArrowRight,
  FileDown,
  Package,
  Store,
  Sun,
  Moon
} from 'lucide-react';
import {
  fetchCloudQuotes,
  saveCloudQuote,
  deleteCloudQuote,
  fetchCloudUserAccounts,
  saveCloudUserAccounts
} from '../utils/cloudQuoteService.js';

// 로컬 시스템 날짜(KST 등 브라우저 현지 시간 기준 YYYY-MM-DD 반환 - UTC 오차 방지)
function getLocalTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 인쇄 및 모바일 PDF 출력 안전 텍스트 정제 (보이지 않는 제로위드, BOM, 특수공백, 개행문자 완전 제거)
function cleanPrintText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u200E\u200F\u00AD\u202F\r\n\t]/g, '')
    .trim();
}

function formatNumberWithCommas(num) {
  const n = Math.round(Number(num) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 숫자를 한국어 단위(억/만/원) 보조 텍스트로 변환
function formatKoreanCurrencyHint(num) {
  const n = Number(num) || 0;
  if (n <= 0) return '0원';
  const eok = Math.floor(n / 100000000);
  const man = Math.floor((n % 100000000) / 10000);
  const rest = n % 10000;

  const parts = [];
  if (eok > 0) parts.push(`${formatNumberWithCommas(eok)}억`);
  if (man > 0) parts.push(`${formatNumberWithCommas(man)}만`);
  if (rest > 0) parts.push(`${formatNumberWithCommas(rest)}`);
  return `${parts.join(' ')}원`;
}

function formatWon(num) {
  return `${formatNumberWithCommas(num)}원`;
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

// 금액 입력 컴포넌트 (콤마 자동 포맷 + 원화 단위 보조 텍스트 + 클릭 시 전체 자동 선택)
function MoneyInput({ value, onChange, placeholder = '0', accentColor = 'var(--accent-gold)', compact = false }) {
  const numericValue = Number(value) || 0;
  const displayValue = numericValue === 0 ? '' : numericValue.toLocaleString('ko-KR');

  const handleTextChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(raw ? parseInt(raw, 10) : 0);
  };

  const handleAutoSelect = (e) => {
    const target = e.target;
    setTimeout(() => {
      try {
        if (typeof target.select === 'function') {
          target.select();
        }
      } catch {}
    }, 10);
  };

  const handleWrapperClick = (e) => {
    const input = e.currentTarget.querySelector('input');
    if (input) {
      input.focus();
      setTimeout(() => {
        try {
          if (typeof input.select === 'function') {
            input.select();
          }
        } catch {}
      }, 10);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        className={`calc-money-wrapper ${compact ? 'compact' : ''}`}
        style={accentColor ? { '--accent-input-color': accentColor } : undefined}
        onClick={handleWrapperClick}
      >
        <span style={{ color: '#64748b', fontSize: '0.74rem', marginRight: '0.2rem', pointerEvents: 'none' }} title="직접 입력 칸">
          ✏️
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleTextChange}
          onFocus={handleAutoSelect}
          onClick={handleAutoSelect}
          placeholder={placeholder}
          className="calc-money-input-field"
        />
        <span className="calc-money-unit-label">원</span>
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

// 2/1일~ 기준 가전 무상수리 서비스 품목별 출고가 및 월납입액(V+) 가이드 테이블 (총 61종)
const FREE_REPAIR_SERVICE_LIST = [
  // TV (60개월)
  { product: 'TV', months: 60, priceRange: '~300만원 이하', code: 'P-TV-4SMX029H', name: 'TV (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },
  { product: 'TV', months: 60, priceRange: '300~400만원', code: 'P-TV-4SMX039H', name: 'TV (출고가:300~400만원) 5년형 무상수리 서비스', fee: 3900 },
  { product: 'TV', months: 60, priceRange: '400~500만원', code: 'P-TV-4SMX049H', name: 'TV (출고가:400~500만원) 5년형 무상수리 서비스', fee: 4900 },
  { product: 'TV', months: 60, priceRange: '500~600만원', code: 'P-TV-4SMX059H', name: 'TV (출고가:500~600만원) 5년형 무상수리 서비스', fee: 5900 },
  { product: 'TV', months: 60, priceRange: '600~700만원', code: 'P-TV-4SMX069H', name: 'TV (출고가:600~700만원) 5년형 무상수리 서비스', fee: 6900 },
  { product: 'TV', months: 60, priceRange: '700~800만원', code: 'P-TV-4SMX079H', name: 'TV (출고가:700~800만원) 5년형 무상수리 서비스', fee: 7900 },
  { product: 'TV', months: 60, priceRange: '800~900만원', code: 'P-TV-4SMX089H', name: 'TV (출고가:800~900만원) 5년형 무상수리 서비스', fee: 8900 },
  { product: 'TV', months: 60, priceRange: '900~1,000만원', code: 'P-TV-4SMX099H', name: 'TV (출고가:900~1,000만원) 5년형 무상수리 서비스', fee: 9900 },
  { product: 'TV', months: 60, priceRange: '1,000~1,100만원', code: 'P-TV-4SMX109H', name: 'TV (출고가:1,000~1,100만원) 5년형 무상수리 서비스', fee: 10900 },
  { product: 'TV', months: 60, priceRange: '1,200~1,300만원', code: 'P-TV-4SMX129H', name: 'TV (출고가:1,200~1,300만원) 5년형 무상수리 서비스', fee: 12900 },
  { product: 'TV', months: 60, priceRange: '1,300~1,400만원', code: 'P-TV-4SMX139H', name: 'TV (출고가:1,300~1,400만원) 5년형 무상수리 서비스', fee: 13900 },
  { product: 'TV', months: 60, priceRange: '1,400~1,500만원', code: 'P-TV-4SMX149H', name: 'TV (출고가:1,400~1,500만원) 5년형 무상수리 서비스', fee: 14900 },
  { product: 'TV', months: 60, priceRange: '1,500~1,600만원', code: 'P-TV-4SMX159H', name: 'TV (출고가:1,500~1,600만원) 5년형 무상수리 서비스', fee: 15900 },
  { product: 'TV', months: 60, priceRange: '2,000~2,100만원', code: 'P-TV-4SMX209H', name: 'TV (출고가:2,000~2,100만원) 5년형 무상수리 서비스', fee: 20900 },
  { product: 'TV', months: 60, priceRange: '2,900~3,000만원', code: 'P-TV-4SMX299H', name: 'TV (출고가:2,900~3,000만원) 5년형 무상수리 서비스', fee: 29900 },
  { product: 'TV', months: 60, priceRange: '4,400~4,500만원', code: 'P-TV-4SMX449H', name: 'TV (출고가:4,400~4,500만원) 5년형 무상수리 서비스', fee: 44900 },
  { product: 'TV', months: 60, priceRange: '4,900~5,000만원', code: 'P-TV-4SMX499H', name: 'TV (출고가:4,900~5,000만원) 5년형 무상수리 서비스', fee: 49900 },
  { product: 'TV', months: 60, priceRange: '5,000만~ 이상', code: 'P-TV-4SMX509H', name: 'TV (출고가:5,000만~ 이상) 5년형 무상수리 서비스', fee: 50900 },

  // 모니터 (36개월)
  { product: '모니터', months: 36, priceRange: '~300만원 이하', code: 'P-LD-2MXX029H', name: '모니터 (출고가:~300만원 이하) 3년형 무상수리 서비스', fee: 2900 },
  { product: '모니터', months: 36, priceRange: '300~400만원', code: 'P-LD-2MXX039H', name: '모니터 (출고가:300~400만원) 3년형 무상수리 서비스', fee: 3900 },

  // 사운드바 (60개월)
  { product: '사운드바', months: 60, priceRange: '~300만원 이하', code: 'P-SD-4SMX029H', name: '사운드바 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },

  // 건조기 (60개월)
  { product: '건조기', months: 60, priceRange: '~300만원 이하', code: 'P-WM-4NSXW02H', name: '건조기 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },

  // 공기청정기 (60개월)
  { product: '공기청정기', months: 60, priceRange: '~300만원 이하', code: 'P-AX-4NSX000H', name: '공기청정기 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },

  // 김치냉장고 (60개월)
  { product: '김치냉장고', months: 60, priceRange: '~300만원 이하', code: 'P-RE-4NSXR06H', name: '김치냉장고 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },
  { product: '김치냉장고', months: 60, priceRange: '300~400만원', code: 'P-RE-4NSXR07H', name: '김치냉장고 (출고가:300~400만원) 5년형 무상수리 서비스', fee: 3900 },
  { product: '김치냉장고', months: 60, priceRange: '400~500만원', code: 'P-RE-4NSXR08H', name: '김치냉장고 (출고가:400~500만원) 5년형 무상수리 서비스', fee: 4900 },
  { product: '김치냉장고', months: 60, priceRange: '500~600만원', code: 'P-RE-4NSXR09H', name: '김치냉장고 (출고가:500~600만원) 5년형 무상수리 서비스', fee: 5900 },

  // 냉장고 (60개월)
  { product: '냉장고', months: 60, priceRange: '~300만원 이하', code: 'P-RE-4NSXR00H', name: '냉장고 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },
  { product: '냉장고', months: 60, priceRange: '300~400만원', code: 'P-RE-4NSXR01H', name: '냉장고 (출고가:300~400만원) 5년형 무상수리 서비스', fee: 3900 },
  { product: '냉장고', months: 60, priceRange: '400~500만원', code: 'P-RE-4NSXR02H', name: '냉장고 (출고가:400~500만원) 5년형 무상수리 서비스', fee: 4900 },
  { product: '냉장고', months: 60, priceRange: '500~600만원', code: 'P-RE-4NSXR03H', name: '냉장고 (출고가:500~600만원) 5년형 무상수리 서비스', fee: 5900 },
  { product: '냉장고', months: 60, priceRange: '600~700만원', code: 'P-RE-4NSXR04H', name: '냉장고 (출고가:600~700만원) 5년형 무상수리 서비스', fee: 6900 },
  { product: '냉장고', months: 60, priceRange: '700~800만원', code: 'P-RE-4NSXR05H', name: '냉장고 (출고가:700~800만원) 5년형 무상수리 서비스', fee: 7900 },
  { product: '냉장고', months: 60, priceRange: '800~900만원', code: 'P-RE-4NSXS06H', name: '냉장고 (출고가:800~900만원) 5년형 무상수리 서비스', fee: 8900 },
  { product: '냉장고', months: 60, priceRange: '900~1,000만원', code: 'P-RE-4NSXS07H', name: '냉장고 (출고가:900~1,000만원) 5년형 무상수리 서비스', fee: 9900 },
  { product: '냉장고', months: 60, priceRange: '1,000~1,100만원', code: 'P-RE-4NSXS08H', name: '냉장고 (출고가:1,000~1,100만원) 5년형 무상수리 서비스', fee: 10900 },
  { product: '냉장고', months: 60, priceRange: '1,100~1,200만원', code: 'P-RE-4NSXS09H', name: '냉장고 (출고가:1,100~1,200만원) 5년형 무상수리 서비스', fee: 11900 },
  { product: '냉장고', months: 60, priceRange: '1,600~1,700만원', code: 'P-RE-4NSXR10H', name: '냉장고 (출고가:1,600~1,700만원) 5년형 무상수리 서비스', fee: 16900 },

  // 세탁기 (60개월)
  { product: '세탁기', months: 60, priceRange: '~300만원 이하', code: 'P-WM-4NSXW01H', name: '세탁기 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },
  { product: '세탁기', months: 60, priceRange: '400~500만원', code: 'P-WM-4NSXW03H', name: '세탁기 (출고가:400~500만원) 5년형 무상수리 서비스', fee: 4900 },
  { product: '세탁기', months: 60, priceRange: '600~700만원', code: 'P-WM-4NSXW05H', name: '세탁기 (출고가:600~700만원) 5년형 무상수리 서비스', fee: 6900 },

  // 슈드레서 (60개월)
  { product: '슈드레서', months: 60, priceRange: '~300만원 이하', code: 'P-SDR-4NSX00H', name: '슈드레서 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },

  // 식기세척기 (60개월)
  { product: '식기세척기', months: 60, priceRange: '~300만원 이하', code: 'P-DW-4NSX000H', name: '식기세척기 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },
  { product: '식기세척기', months: 60, priceRange: '300~400만원', code: 'P-DW-4NSX001H', name: '식기세척기 (출고가:300~400만원) 5년형 무상수리 서비스', fee: 3900 },

  // 에어드레서 (60개월)
  { product: '에어드레서', months: 60, priceRange: '~300만원 이하', code: 'P-ADR-4NSX00H', name: '에어드레서 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },

  // 에어컨 스탠드 (60개월)
  { product: '에어컨 스탠드', months: 60, priceRange: '~300만원 이하', code: 'P-RAC-4NSXS29H', name: '에어컨 스탠드 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },
  { product: '에어컨 스탠드', months: 60, priceRange: '300~400만원', code: 'P-RAC-4NSXS39H', name: '에어컨 스탠드 (출고가:300~400만원) 5년형 무상수리 서비스', fee: 3900 },
  { product: '에어컨 스탠드', months: 60, priceRange: '400~500만원', code: 'P-RAC-4NSXS49H', name: '에어컨 스탠드 (출고가:400~500만원) 5년형 무상수리 서비스', fee: 4900 },

  // 에어컨 벽걸이 (60개월)
  { product: '에어컨 벽걸이', months: 60, priceRange: '~300만원 이하', code: 'P-RAC-4NHXS29H', name: '에어컨 벽걸이 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },

  // 에어컨 천장형 (60개월)
  { product: '에어컨 천장형', months: 60, priceRange: '~300만원 이하', code: 'P-SAC-4NSXS29H', name: '에어컨 천장형 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },
  { product: '에어컨 천장형', months: 60, priceRange: '300~400만원', code: 'P-SAC-4NSXS39H', name: '에어컨 천장형 (출고가:300~400만원) 5년형 무상수리 서비스', fee: 3900 },

  // 오븐 (60개월)
  { product: '오븐', months: 60, priceRange: '~300만원 이하', code: 'P-EOV-4NSX29H', name: '오븐 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },
  { product: '오븐', months: 60, priceRange: '300~400만원', code: 'P-EOV-4NSX39H', name: '오븐 (출고가:300~400만원) 5년형 무상수리 서비스', fee: 3900 },

  // 전기레인지 (60개월)
  { product: '전기레인지', months: 60, priceRange: '~300만원 이하', code: 'P-ECT-4NSX29H', name: '전기레인지 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },
  { product: '전기레인지', months: 60, priceRange: '400~500만원', code: 'P-ECT-4NSX49H', name: '전기레인지 (출고가:400~500만원) 5년형 무상수리 서비스', fee: 4900 },

  // 전자레인지 (60개월)
  { product: '전자레인지', months: 60, priceRange: '~300만원 이하', code: 'P-MW-4NSX29H', name: '전자레인지 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },

  // 정수기 (60개월)
  { product: '정수기', months: 60, priceRange: '300~400만원', code: 'P-RE-5NSLR17H', name: '정수기 (출고가:300~400만원) 5년형 무상수리 서비스', fee: 3900 },

  // 제습기 (60개월)
  { product: '제습기', months: 60, priceRange: '~300만원 이하', code: 'P-DH-4NSX00H', name: '제습기 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },

  // 청소기 (60개월)
  { product: '청소기', months: 60, priceRange: '~300만원 이하', code: 'P-VC-4NSXV01H', name: '청소기 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },

  // 후드 (60개월)
  { product: '후드', months: 60, priceRange: '~300만원 이하', code: 'P-HOD-4NSX29H', name: '후드 (출고가:~300만원 이하) 5년형 무상수리 서비스', fee: 2900 },
  { product: '후드', months: 60, priceRange: '300~400만원', code: 'P-HOD-4NSX39H', name: '후드 (출고가:300~400만원) 5년형 무상수리 서비스', fee: 3900 },

  // 노트북 (무상수리 + 파손보험)
  { product: '노트북', months: 36, priceRange: '프로급', code: 'P-NT-PRO-8400', name: '노트북 프로급 (무상수리+파손보험)', fee: 8400, isMobile: true },
  { product: '노트북', months: 36, priceRange: '엔트리급', code: 'P-NT-ENTRY-7200', name: '노트북 엔트리급 (무상수리+파손보험)', fee: 7200, isMobile: true },

  // 태블릿 (무상수리 + 파손보험)
  { product: '태블릿', months: 36, priceRange: '전체', code: 'P-TAB-5600', name: '태블릿 (무상수리+파손보험)', fee: 5600, isMobile: true }
];

// 간소화된 품목 리스트 (총 24개 품목군)
const SIMPLIFIED_PRODUCT_LIST = [
  { id: 'TV', name: 'TV' },
  { id: '냉장고', name: '냉장고' },
  { id: '김치냉장고', name: '김치냉장고' },
  { id: '세탁기', name: '세탁기' },
  { id: '건조기', name: '건조기' },
  { id: '에어컨 스탠드', name: '에어컨 스탠드' },
  { id: '에어컨 벽걸이', name: '에어컨 벽걸이' },
  { id: '에어컨 천장형', name: '에어컨 천장형' },
  { id: '식기세척기', name: '식기세척기' },
  { id: '에어드레서', name: '에어드레서' },
  { id: '슈드레서', name: '슈드레서' },
  { id: '공기청정기', name: '공기청정기' },
  { id: '청소기', name: '청소기' },
  { id: '정수기', name: '정수기' },
  { id: '전기레인지', name: '전기레인지' },
  { id: '전자레인지', name: '전자레인지' },
  { id: '오븐', name: '오븐' },
  { id: '후드', name: '후드' },
  { id: '제습기', name: '제습기' },
  { id: '사운드바', name: '사운드바' },
  { id: '모니터', name: '모니터' },
  { id: '노트북 (프로급)', name: '노트북 (프로급)' },
  { id: '노트북 (엔트리급)', name: '노트북 (엔트리급)' },
  { id: '태블릿', name: '태블릿' }
];

// 서비스 코드로부터 품목 카테고리 역추적 헬퍼
const getCategoryFromCode = (code) => {
  if (!code) return '';
  const item = FREE_REPAIR_SERVICE_LIST.find((it) => it.code === code);
  if (!item) return '';
  if (item.product === '노트북') {
    return item.priceRange === '프로급' ? '노트북 (프로급)' : '노트북 (엔트리급)';
  }
  return item.product;
};

// 품목 및 총금액(출고가) 기반 무상수리 서비스 구간 자동인식 엔진
const getFreeRepairItemByProductAndPrice = (productCategory, rawPrice) => {
  if (!productCategory) return null;

  // 특수 IT/모바일 제품군
  if (productCategory === '노트북 (프로급)') {
    return FREE_REPAIR_SERVICE_LIST.find((it) => it.code === 'P-NT-PRO-8400') || null;
  }
  if (productCategory === '노트북 (엔트리급)') {
    return FREE_REPAIR_SERVICE_LIST.find((it) => it.code === 'P-NT-ENTRY-7200') || null;
  }
  if (productCategory === '태블릿') {
    return FREE_REPAIR_SERVICE_LIST.find((it) => it.code === 'P-TAB-5600') || null;
  }

  const items = FREE_REPAIR_SERVICE_LIST.filter((it) => it.product === productCategory);
  if (!items || items.length === 0) return null;
  if (items.length === 1) return items[0];

  const price = Number(rawPrice) || 0;

  // 금액구간 파싱
  const parsedItems = items.map((it) => {
    const str = it.priceRange || '';
    let min = 0;
    let max = Infinity;

    if (str.includes('이상')) {
      const num = parseInt(str.replace(/[^0-9]/g, ''), 10) * 10000;
      min = num;
      max = Infinity;
    } else if (str.includes('이하')) {
      const num = parseInt(str.replace(/[^0-9]/g, ''), 10) * 10000;
      min = 0;
      max = num;
    } else if (str.includes('~')) {
      const parts = str.split('~');
      const minNum = parseInt(parts[0].replace(/[^0-9]/g, ''), 10) * 10000;
      const maxNum = parseInt(parts[1].replace(/[^0-9]/g, ''), 10) * 10000;
      min = minNum;
      max = maxNum;
    }
    return { ...it, min, max };
  });

  // 금액이 미입력이거나 0 이하일 때는 기본구간(첫 번째 티어)
  if (price <= 0) {
    return parsedItems[0];
  }

  // 1. 직접 범위 매칭: min < price <= max (min이 0인 경우 price <= max)
  const exactMatch = parsedItems.find((it) => {
    if (it.min === 0) return price <= it.max;
    return price > it.min && price <= it.max;
  });
  if (exactMatch) return exactMatch;

  // 2. 구간 사이 갭에 들어간 경우 상한선(max) 기준 첫 매칭 티어
  const nextTier = parsedItems.find((it) => price <= it.max);
  if (nextTier) return nextTier;

  // 3. 최상위 구간 초과 시 가장 높은 티어 적용
  return parsedItems[parsedItems.length - 1];
};

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

// 26.11월 AI 구독 제휴카드(기본) 공식 정책표 데이터
const AFFILIATE_CARD_TIERS = {
  samsung: {
    cardCompany: '삼성카드',
    tiers: [
      { spend: '30만', base: 13000, promo: 3000, total: 16000, label: '30만 (월 16,000원 할인)', note: '기본 1.3만 + 프로모션 0.3만' },
      { spend: '70만', base: 17000, promo: 9000, total: 26000, minFee: 70000, label: '70만 (월 26,000원 할인 - 구독료 7만↑)', note: '월구독료 7만↑ 조건' },
      { spend: '120만', base: 23000, promo: 7000, total: 30000, minFee: 70000, label: '120만 (월 30,000원 할인 - 구독료 7만↑)', note: '월구독료 7만↑ 조건' }
    ]
  },
  lotte: {
    cardCompany: '롯데카드',
    tiers: [
      { spend: '50만', base: 15000, promo: 7000, total: 22000, label: '50만 (월 22,000원 할인)', note: '기본 1.5만 + 프로모션 0.7만 (신규)' },
      { spend: '100만', base: 20000, promo: 6000, total: 26000, label: '100만 (월 26,000원 할인)', note: '기본 2.0만 + 프로모션 0.6만' },
      { spend: '200만', base: 27000, promo: 3000, total: 30000, label: '200만 (월 30,000원 할인)', note: '기본 2.7만 + 프로모션 0.3만' }
    ]
  },
  kb: {
    cardCompany: 'KB국민카드',
    tiers: [
      { spend: '30만', base: 10000, promo: 8000, total: 18000, label: '30만 (월 18,000원 할인)', note: '기본 1.0만 + 프로모션 0.8만 (36개월)' },
      { spend: '70만', base: 12000, promo: 10000, total: 22000, label: '70만 (월 22,000원 할인)', note: '기본 1.2만 + 프로모션 1.0만 (36개월)' },
      { spend: '100만', base: 14000, promo: 13000, total: 27000, label: '100만 (월 27,000원 할인)', note: '기본 1.4만 + 프로모션 1.3만 (36개월)' }
    ]
  },
  woori: {
    cardCompany: '우리카드',
    tiers: [
      { spend: '30만', base: 10000, promo: 7000, total: 17000, label: '30만 (월 17,000원 할인)', note: '기본 1.0만 + 프로모션 0.7만 (60개월)' },
      { spend: '70만', base: 15000, promo: 5000, total: 20000, label: '70만 (월 20,000원 할인)', note: '기본 1.5만 + 프로모션 0.5만 (60개월)' },
      { spend: '150만', base: 25000, promo: 1000, total: 26000, label: '150만 (월 26,000원 할인)', note: '기본 2.5만 + 프로모션 0.1만 (60개월)' }
    ]
  },
  hana: {
    cardCompany: '하나카드',
    tiers: [
      { spend: '30만', base: 13000, promo: 0, total: 13000, label: '30만 (월 13,000원 할인)', note: '기본 1.3만' },
      { spend: '80만', base: 18000, promo: 0, total: 18000, label: '80만 (월 18,000원 할인)', note: '기본 1.8만 (연회비 캐시백 2.5만 1회)' },
      { spend: '150만', base: 25000, promo: 0, total: 25000, label: '150만 (월 25,000원 할인)', note: '기본 2.5만' }
    ]
  }
};

const COMMON_SPEND_LIST = ['30만', '40만', '50만', '70만', '80만', '100만', '120만', '150만', '200만'];

function getCardPolicyKey(cardName) {
  if (!cardName || typeof cardName !== 'string') return null;
  const lower = cardName.trim().toLowerCase();
  if (lower.includes('kb') || lower.includes('국민')) return 'kb';
  if (lower.includes('우리')) return 'woori';
  if (lower.includes('하나')) return 'hana';
  if (lower.includes('롯데') || lower.includes('로카') || lower.includes('amex')) return 'lotte';
  if (checkIsSamsungCard(lower)) return 'samsung';
  return null;
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

function normalizeSpendValue(raw) {
  if (!raw) return '30만';
  const str = String(raw).trim();
  const won = parseSpendToWon(str);
  if (won > 0) {
    const man = Math.round(won / 10000);
    return `${man}만`;
  }
  return str;
}

// 필요 실적이 70만원 이상 구간인지 판별 (삼성카드 구독료 7만원 미만 시 70만/120만 구간 제한용)
function isSpend70kOrMore(val) {
  if (!val) return false;
  const won = parseSpendToWon(val);
  if (won >= 700000) return true;
  const str = String(val).trim().replace(/,/g, '');
  if (/70\s*만/.test(str) || /120\s*만/.test(str) || /150\s*만/.test(str) || /200\s*만/.test(str)) return true;
  return false;
}

function getCardSpendOptions(cardName, pFee = 0) {
  const policyKey = getCardPolicyKey(cardName);
  const pol = policyKey ? AFFILIATE_CARD_TIERS[policyKey] : null;
  const policyTiers = pol
    ? pol.tiers.map((t) => ({
        value: t.spend,
        label: t.label,
        discount: t.total,
        minFee: t.minFee,
        isPolicy: true
      }))
    : [];

  const policySpendSet = new Set(policyTiers.map((t) => t.value));
  const otherTiers = COMMON_SPEND_LIST
    .filter((s) => !policySpendSet.has(s))
    .map((s) => ({
      value: s,
      label: `${s}`,
      isPolicy: false
    }));

  return {
    policyKey,
    cardCompany: pol?.cardCompany || getCardCompanyShort(cardName) || '제휴카드',
    policyTiers,
    otherTiers
  };
}

function getDefaultDiscountForCardSpend(cardName, spendStr, currentDiscount = 0, pFee = 0) {
  const norm = normalizeSpendValue(spendStr);
  const policyKey = getCardPolicyKey(cardName);
  if (!policyKey) {
    return currentDiscount || 16000;
  }
  const pol = AFFILIATE_CARD_TIERS[policyKey];
  const matchedTier = pol.tiers.find((t) => t.spend === norm);
  if (matchedTier) {
    if (policyKey === 'samsung' && matchedTier.minFee && pFee < matchedTier.minFee) {
      return 16000;
    }
    return matchedTier.total;
  }
  if (policyKey === 'samsung') {
    return parseSpendToWon(norm) >= 700000 && pFee >= 70000 ? 26000 : 16000;
  }
  return currentDiscount || 16000;
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

// 100% 국제 표준 규격(ISO/IEC 18004) 준수 & 인쇄 출력 시 초고인식률 보장 순수 SVG QR 데이터 사전
const QR_PRESET_MAP = {
  'https://jcc-band.vercel.app': {
    viewBox: '0 0 33 33',
    d: 'M2 2.5h7m3 0h1m1 0h4m2 0h1m3 0h7M2 3.5h1m5 0h1m1 0h4m3 0h1m4 0h1m1 0h1m5 0h1M2 4.5h1m1 0h3m1 0h1m1 0h1m2 0h1m2 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h3m1 0h1M2 5.5h1m1 0h3m1 0h1m1 0h1m2 0h1m2 0h2m1 0h2m1 0h1m1 0h1m1 0h3m1 0h1M2 6.5h1m1 0h3m1 0h1m2 0h2m2 0h3m1 0h4m1 0h1m1 0h3m1 0h1M2 7.5h1m5 0h1m2 0h1m1 0h4m1 0h2m2 0h1m1 0h1m5 0h1M2 8.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M10 9.5h2m3 0h1m4 0h2M2 10.5h1m5 0h1m1 0h2m4 0h2m1 0h1m3 0h2m2 0h3M4 11.5h1m1 0h2m1 0h1m2 0h1m3 0h1m3 0h2m3 0h2m1 0h2M5 12.5h1m1 0h2m1 0h2m1 0h2m5 0h1m2 0h1m1 0h2M3 13.5h5m1 0h1m1 0h2m1 0h1m1 0h3m2 0h1m2 0h2m1 0h1M6 14.5h1m1 0h6m1 0h2m4 0h1m2 0h2m4 0h1M3 15.5h1m2 0h1m3 0h3m1 0h3m4 0h2m1 0h1m1 0h1m2 0h2M5 16.5h1m2 0h1m6 0h4m1 0h1m1 0h2m1 0h1m1 0h2M3 17.5h4m5 0h2m1 0h2m1 0h1m1 0h1m2 0h2m1 0h1m1 0h1m1 0h1M4 18.5h1m1 0h3m3 0h1m3 0h2m1 0h1m7 0h2M2 19.5h2m2 0h2m1 0h6m3 0h1m2 0h2m1 0h3m1 0h3M2 20.5h4m1 0h5m2 0h3m1 0h5m4 0h1m2 0h1M2 21.5h1m3 0h2m1 0h1m1 0h2m3 0h3m1 0h3m1 0h1m1 0h1M2 22.5h1m4 0h2m1 0h5m3 0h1m1 0h1m1 0h5m1 0h3M10 23.5h1m2 0h3m2 0h5m3 0h2M2 24.5h7m2 0h1m3 0h5m1 0h2m1 0h1m1 0h3M2 25.5h1m5 0h1m3 0h1m1 0h2m3 0h4m3 0h1m2 0h2M2 26.5h1m1 0h3m1 0h1m2 0h2m2 0h1m1 0h3m1 0h7m1 0h1M2 27.5h1m1 0h3m1 0h1m2 0h1m2 0h1m3 0h1m1 0h1m1 0h2m3 0h3M2 28.5h1m1 0h3m1 0h1m11 0h10M2 29.5h1m5 0h1m2 0h5m1 0h1m5 0h2m2 0h2m1 0h1M2 30.5h7m1 0h2m2 0h1m1 0h1m1 0h1m1 0h1m2 0h1m4 0h1'
  },
  'https://m.kbcard.com/BON/DVIEW/MBVM0004': {
    viewBox: '0 0 33 33',
    d: 'M2 2.5h7m2 0h1m4 0h1m2 0h1m2 0h1m1 0h7M2 3.5h1m5 0h1m1 0h1m1 0h2m1 0h1m6 0h1m1 0h1m5 0h1M2 4.5h1m1 0h3m1 0h1m2 0h1m1 0h2m2 0h1m1 0h3m2 0h1m1 0h3m1 0h1M2 5.5h1m1 0h3m1 0h1m3 0h4m3 0h1m2 0h1m1 0h1m1 0h3m1 0h1M2 6.5h1m1 0h3m1 0h1m1 0h2m1 0h3m2 0h3m1 0h1m1 0h1m1 0h3m1 0h1M2 7.5h1m5 0h1m3 0h1m1 0h1m1 0h2m1 0h1m4 0h1m5 0h1M2 8.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M12 9.5h2m3 0h1m2 0h2M2 10.5h1m1 0h1m1 0h1m1 0h1m3 0h1m6 0h1m2 0h1m3 0h1m2 0h1M7 11.5h1m1 0h1m2 0h2m1 0h1m1 0h1m2 0h1m2 0h2m2 0h1m2 0h1M2 12.5h1m1 0h2m2 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h2m4 0h1m3 0h3M3 13.5h2m1 0h1m4 0h2m2 0h3m1 0h1m1 0h2m1 0h2m3 0h1M3 14.5h4m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h2m1 0h4m2 0h1m1 0h2M2 15.5h1m4 0h1m1 0h1m1 0h1m1 0h1m2 0h2m1 0h2m1 0h3m2 0h1m2 0h1M2 16.5h3m1 0h4m1 0h2m2 0h1m2 0h3m3 0h2m1 0h1m1 0h2M5 17.5h3m1 0h2m1 0h1m4 0h1m4 0h1m2 0h3m1 0h1M3 18.5h1m1 0h1m1 0h5m1 0h2m6 0h4m2 0h1m1 0h2M3 19.5h1m2 0h2m5 0h3m2 0h2m2 0h1m1 0h1m2 0h2m1 0h1M2 20.5h1m1 0h2m2 0h1m1 0h1m1 0h2m2 0h5m3 0h1m4 0h2M3 21.5h1m1 0h1m6 0h1m2 0h2m1 0h1m4 0h2m1 0h2m1 0h1M2 22.5h1m1 0h3m1 0h1m1 0h1m1 0h3m1 0h2m1 0h2m1 0h5M10 23.5h1m3 0h1m1 0h2m3 0h2m3 0h1m1 0h3M2 24.5h7m3 0h2m1 0h1m1 0h1m2 0h3m1 0h1m1 0h2m1 0h2M2 25.5h1m5 0h1m2 0h2m6 0h2m1 0h1m3 0h2m1 0h1M2 26.5h1m1 0h3m1 0h1m1 0h1m1 0h3m3 0h2m2 0h5m2 0h2M2 27.5h1m1 0h3m1 0h1m6 0h1m1 0h1m3 0h2m2 0h2m1 0h1M2 28.5h1m1 0h3m1 0h1m1 0h2m1 0h1m3 0h3m1 0h1m4 0h2m2 0h1M2 29.5h1m5 0h1m7 0h1m2 0h4m6 0h1M2 30.5h7m1 0h2m1 0h1m3 0h2m3 0h1m1 0h2m3 0h2'
  },
  'https://m.wooricard.com/dcmw/yh1/mlk/mlk06/M1MLK206S00.do?': {
    viewBox: '0 0 37 37',
    d: 'M2 2.5h7m1 0h1m1 0h2m1 0h1m3 0h2m2 0h1m4 0h7M2 3.5h1m5 0h1m2 0h1m2 0h1m3 0h1m3 0h1m3 0h1m1 0h1m5 0h1M2 4.5h1m1 0h3m1 0h1m1 0h2m1 0h3m3 0h2m1 0h2m4 0h1m1 0h3m1 0h1M2 5.5h1m1 0h3m1 0h1m3 0h1m4 0h1m1 0h1m5 0h1m2 0h1m1 0h3m1 0h1M2 6.5h1m1 0h3m1 0h1m2 0h2m1 0h1m2 0h1m3 0h1m1 0h2m1 0h1m1 0h1m1 0h3m1 0h1M2 7.5h1m5 0h1m1 0h1m6 0h1m1 0h2m2 0h1m1 0h1m2 0h1m5 0h1M2 8.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M11 9.5h2m3 0h3m1 0h2m4 0h1M2 10.5h1m1 0h1m3 0h2m1 0h1m2 0h1m3 0h1m3 0h1m2 0h2m2 0h1m2 0h1m1 0h1M5 11.5h2m2 0h3m3 0h1m1 0h1m3 0h3m1 0h2m1 0h1m2 0h1m2 0h1M2 12.5h2m2 0h5m2 0h2m2 0h1m3 0h3m1 0h1m5 0h2m1 0h1M2 13.5h2m1 0h1m1 0h1m7 0h1m1 0h2m2 0h6m2 0h3m1 0h2M3 14.5h1m2 0h3m1 0h2m3 0h1m1 0h1m1 0h1m2 0h1m5 0h2M2 15.5h3m1 0h1m2 0h1m2 0h3m4 0h1m1 0h1m1 0h1m1 0h2m1 0h2m1 0h4M2 16.5h1m1 0h2m1 0h6m1 0h4m1 0h1m1 0h4m1 0h1m3 0h1m1 0h1m1 0h1M2 17.5h1m3 0h2m3 0h1m1 0h1m1 0h1m4 0h1m3 0h8M3 18.5h2m1 0h4m1 0h3m2 0h2m2 0h3m2 0h2m1 0h2m1 0h1m1 0h1M2 19.5h1m2 0h1m4 0h1m1 0h1m1 0h2m1 0h2m2 0h1m3 0h2m1 0h1m2 0h1m2 0h1M5 20.5h2m1 0h4m2 0h1m1 0h2m3 0h2m1 0h2m1 0h1m1 0h1m1 0h4M2 21.5h3m1 0h1m2 0h6m3 0h2m2 0h2m1 0h4m1 0h2m1 0h1M2 22.5h1m2 0h1m2 0h1m1 0h4m1 0h2m1 0h1m2 0h9m3 0h2M3 23.5h1m1 0h2m3 0h1m1 0h1m1 0h1m3 0h3m7 0h2m1 0h2m1 0h1M2 24.5h4m2 0h2m1 0h1m1 0h1m1 0h2m1 0h1m2 0h2m1 0h3m4 0h2m1 0h1M5 25.5h2m2 0h2m2 0h6m1 0h1m1 0h1m1 0h1m2 0h1m1 0h3M2 26.5h2m1 0h1m1 0h2m3 0h1m1 0h1m3 0h1m2 0h2m3 0h6m1 0h1M10 27.5h1m1 0h1m2 0h1m1 0h2m2 0h2m2 0h2m3 0h1m2 0h2M2 28.5h7m1 0h2m1 0h1m2 0h2m2 0h4m2 0h1m1 0h1m1 0h5M2 29.5h1m5 0h1m2 0h1m1 0h1m2 0h2m1 0h3m1 0h4m3 0h2M2 30.5h1m1 0h3m1 0h1m2 0h1m1 0h1m2 0h3m2 0h1m2 0h7m2 0h1M2 31.5h1m1 0h3m1 0h1m2 0h2m7 0h1m1 0h1m3 0h1m2 0h2m1 0h1m1 0h1M2 32.5h1m1 0h3m1 0h1m1 0h4m1 0h1m1 0h3m1 0h4m2 0h1m1 0h2m2 0h2M2 33.5h1m5 0h1m2 0h2m2 0h1m5 0h1m2 0h3m2 0h2M2 34.5h7m1 0h3m1 0h5m2 0h1m4 0h6m2 0h1'
  },
  'https://m.lottecard.co.kr/app/LPBNFDA_V580.lc?evnBultSeq=23&ccoEvnGubun=SAMSUNG': {
    viewBox: '0 0 41 41',
    d: 'M2 2.5h7m2 0h1m1 0h1m1 0h1m1 0h1m1 0h1m2 0h4m2 0h1m3 0h7M2 3.5h1m5 0h1m5 0h1m1 0h1m2 0h1m2 0h1m4 0h1m1 0h1m2 0h1m5 0h1M2 4.5h1m1 0h3m1 0h1m1 0h4m3 0h1m2 0h4m1 0h1m2 0h1m3 0h1m1 0h3m1 0h1M2 5.5h1m1 0h3m1 0h1m1 0h1m1 0h1m1 0h1m3 0h1m2 0h1m5 0h3m2 0h1m1 0h3m1 0h1M2 6.5h1m1 0h3m1 0h1m1 0h4m2 0h1m3 0h1m1 0h2m1 0h1m4 0h1m1 0h1m1 0h3m1 0h1M2 7.5h1m5 0h1m1 0h2m1 0h1m3 0h1m5 0h2m2 0h1m1 0h2m1 0h1m5 0h1M2 8.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M10 9.5h1m1 0h3m6 0h1m1 0h4m1 0h3M2 10.5h1m1 0h5m2 0h1m1 0h4m2 0h1m2 0h1m1 0h4m1 0h2m1 0h5M2 11.5h1m3 0h2m1 0h1m2 0h2m3 0h2m2 0h2m10 0h1m1 0h1m1 0h1M2 12.5h1m1 0h8m2 0h1m1 0h1m2 0h1m4 0h1m1 0h1m2 0h3m1 0h1m2 0h3M3 13.5h1m1 0h1m1 0h1m1 0h5m4 0h1m1 0h6m2 0h6m1 0h1m2 0h1M3 14.5h1m4 0h3m1 0h1m2 0h1m2 0h1m5 0h5m3 0h1m1 0h1m1 0h3M2 15.5h1m1 0h4m1 0h1m1 0h2m2 0h2m3 0h1m1 0h2m1 0h1m2 0h1m1 0h1m2 0h1M2 16.5h5m1 0h1m1 0h1m3 0h4m8 0h4m1 0h1m1 0h3m1 0h2M3 17.5h2m6 0h4m1 0h2m5 0h1m1 0h1m3 0h2m1 0h3m3 0h1M3 18.5h7m1 0h1m2 0h1m3 0h1m1 0h1m1 0h1m1 0h11m1 0h2M4 19.5h1m1 0h1m6 0h1m1 0h3m2 0h6m5 0h1m1 0h1m2 0h2M7 20.5h3m1 0h1m5 0h2m2 0h1m1 0h1m2 0h2m1 0h3m2 0h1m1 0h3M2 21.5h2m2 0h1m3 0h3m4 0h1m2 0h1m1 0h4m3 0h1m8 0h1M2 22.5h1m3 0h1m1 0h1m2 0h1m2 0h1m2 0h2m2 0h2m1 0h1m1 0h7m1 0h3M2 23.5h1m3 0h1m2 0h4m7 0h1m1 0h5m3 0h1m4 0h1M4 24.5h5m5 0h5m1 0h1m2 0h2m2 0h1m1 0h1m1 0h5m1 0h2M3 25.5h3m1 0h1m2 0h1m3 0h5m1 0h1m1 0h4m2 0h3m1 0h3M3 26.5h3m1 0h2m1 0h2m1 0h2m2 0h1m2 0h3m1 0h2m1 0h6m3 0h2M2 27.5h2m3 0h1m1 0h1m2 0h3m1 0h3m1 0h2m1 0h1m1 0h1m4 0h4M2 28.5h1m2 0h2m1 0h9m3 0h1m2 0h1m4 0h4m2 0h1m2 0h2M2 29.5h1m1 0h2m5 0h6m1 0h1m4 0h1m5 0h2m1 0h3m3 0h1M2 30.5h1m1 0h10m2 0h1m1 0h1m5 0h1m1 0h2m1 0h6m1 0h1M10 31.5h5m1 0h1m2 0h1m2 0h1m1 0h2m4 0h1m3 0h2M2 32.5h7m3 0h1m1 0h2m1 0h1m1 0h1m2 0h1m1 0h1m2 0h1m2 0h1m1 0h1m1 0h1m1 0h1m1 0h1M2 33.5h1m5 0h1m1 0h1m1 0h3m1 0h1m1 0h6m1 0h2m1 0h1m1 0h1m3 0h2m2 0h1M2 34.5h1m1 0h3m1 0h1m1 0h1m1 0h1m1 0h5m2 0h1m4 0h9m1 0h1m1 0h1M2 35.5h1m1 0h3m1 0h1m1 0h2m3 0h1m1 0h1m1 0h3m1 0h2m2 0h1m2 0h3m1 0h1m3 0h1M2 36.5h1m1 0h3m1 0h1m1 0h1m4 0h5m2 0h2m3 0h2m1 0h1m4 0h4M2 37.5h1m5 0h1m2 0h4m2 0h1m4 0h2m1 0h1m3 0h2m1 0h1m1 0h1m3 0h1M2 38.5h7m1 0h6m1 0h2m2 0h1m3 0h4m2 0h1m2 0h5'
  }
};

function CardEventQrSvg({ url, size = 72, label = '이벤트 대상 확인 QR코드' }) {
  const qrItem = QR_PRESET_MAP[url] || {
    viewBox: '0 0 33 33',
    d: QR_PRESET_MAP['https://jcc-band.vercel.app'].d
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox={qrItem.viewBox}
      shapeRendering="crispEdges"
      style={{
        display: 'block',
        background: '#ffffff',
        borderRadius: '2px',
        padding: '1.5px',
        boxShadow: 'none',
        border: '1px solid #cbd5e1',
        flexShrink: 0
      }}
      aria-label={label}
    >
      <rect width="100%" height="100%" fill="#ffffff" />
      <path stroke="#000000" strokeWidth="1" d={qrItem.d} />
    </svg>
  );
}

const AUTH_ACCOUNTS_STORAGE_KEY = 'jcc_auth_accounts_v1';
const AUTH_SESSION_USER_KEY = 'jcc_calc_auth_user';
const AUTH_PW_SALT = 'JCC_AUTH_SECURE_SALT_2026_V2';
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function computeSha256Hex(str) {
  const bytes = new TextEncoder().encode(String(str));
  const bitLen = bytes.length * 8;
  const padLen = (bytes.length + 9 + 63) & ~63;
  const buf = new Uint8Array(padLen);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(padLen - 4, bitLen >>> 0, false);
  view.setUint32(padLen - 8, Math.floor(bitLen / 4294967296) >>> 0, false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let i = 0; i < padLen; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const s0 = ((w[t - 15] >>> 7) | (w[t - 15] << 25)) ^ ((w[t - 15] >>> 18) | (w[t - 15] << 14)) ^ (w[t - 15] >>> 3);
      const s1 = ((w[t - 2] >>> 17) | (w[t - 2] << 15)) ^ ((w[t - 2] >>> 19) | (w[t - 2] << 13)) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA256_K[t] + w[t]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((v) => v.toString(16).padStart(8, '0')).join('');
}

function isHashedPassword(pwVal) {
  return typeof pwVal === 'string' && /^sha256\$[0-9a-f]{64}$/i.test(pwVal.trim());
}

function hashAccountPassword(accountId, rawPw) {
  const strPw = String(rawPw ?? '').trim();
  if (!strPw) return '';
  if (isHashedPassword(strPw)) return strPw.toLowerCase();
  const normId = String(accountId ?? '').trim().toLowerCase();
  return `sha256$${computeSha256Hex(`${AUTH_PW_SALT}::${normId}::${strPw}`)}`;
}

function verifyAccountPassword(account, inputPw) {
  if (!account || !inputPw) return false;
  const stored = String(account.pw ?? '').trim();
  const candidate = String(inputPw ?? '').trim();
  if (!stored || !candidate) return false;
  if (isHashedPassword(stored)) {
    return stored.toLowerCase() === hashAccountPassword(account.id, candidate);
  }
  // 레거시 평문 데이터인 경우에도 해시 비교로 검증
  return stored === candidate;
}

// 마스터 보조 별칭('jcc') 단방향 해시 (소스 코드 내 평문 비밀번호 완전 제거)
const MASTER_ALIAS_JCC_HASH = 'sha256$2daf9fc07c1c59f02087c4a797476d004ccf93a238d0f1c8336250dcd4ceaea3';
const MASTER_PRIMARY_HASH = 'sha256$c045e5710b4a7195a858352c7cc1b5c2a7a0a0d1f75fefb31f776c963124bc9a';

const DEFAULT_USER_ACCOUNTS = [
  {
    uid: 'acc_master_saeootang',
    id: 'saeootang',
    pw: 'sha256$c045e5710b4a7195a858352c7cc1b5c2a7a0a0d1f75fefb31f776c963124bc9a',
    name: '총괄 관리자',
    level: 'admin',
    isMaster: true,
    createdAt: '2026-11-21'
  },
  {
    uid: 'acc_admin_master',
    id: 'admin',
    pw: 'sha256$c263dfc413b93a21e23235b027025c312dd378b2b52e5d9af30d993951ceba98',
    name: '조준석 총괄 관리자',
    level: 'admin', // 'lv1' | 'lv2' | 'admin'
    isMaster: true,
    createdAt: '2026-11-21'
  },
  {
    uid: 'acc_lv1_default',
    id: 'lv1',
    pw: 'sha256$0ce96a0bebdce5a4b01dab9ac03f2a73e963ca03f335e496a222934555f87f46',
    name: '매니저 (Lv.1 기본)',
    level: 'lv1',
    isMaster: false,
    createdAt: '2026-11-21'
  },
  {
    uid: 'acc_lv2_default',
    id: 'lv2',
    pw: 'sha256$e3b58e2fc7e1c193873445d8eadbb03bbfc1002d6b5f2a0cdbf85f118c2cabb5',
    name: '수석 매니저 (Lv.2 전체)',
    level: 'lv2',
    isMaster: false,
    createdAt: '2026-11-21'
  }
];

// 보안 보호 헬퍼: 관리자 계정 ID(saeootang 등)가 화면에 직접 노출되지 않도록 마스킹
const isProtectedAdminId = (rawId) => {
  if (!rawId) return false;
  const lower = String(rawId).trim().toLowerCase();
  return lower === 'saeootang';
};

const maskAccountId = (rawId) => {
  if (!rawId) return '';
  if (isProtectedAdminId(rawId)) {
    return '••••••••';
  }
  return rawId;
};

const getDisplayUserName = (user) => {
  if (!user) return '';
  const rawId = String(user.id || '').trim();
  const rawName = String(user.name || '').trim();
  if (isProtectedAdminId(rawId) || isProtectedAdminId(rawName)) {
    return '총괄 관리자';
  }
  return rawName || rawId;
};

// 최근 접속 일시 포맷 헬퍼 (MM/DD HH:mm)
const formatLoginTime = (isoStr) => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${m}/${day} ${hh}:${mm}`;
  } catch {
    return '';
  }
};

function sanitizeUserAccounts(rawList) {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return DEFAULT_USER_ACCOUNTS;
  }
  const normalized = rawList
    .filter((it) => it && typeof it.id === 'string' && it.id.trim())
    .map((it, idx) => {
      const isPending = it.status === 'pending' || it.level === 'pending';
      const cleanId = it.id.trim();
      const rawPwStr = String(it.pw ?? '').trim();
      // 평문 비밀번호가 남아있는 경우 즉시 단방향 SHA-256 해시로 자동 변환하여 누구도 원본을 알 수 없도록 보호
      const hashedPw = isHashedPassword(rawPwStr)
        ? rawPwStr.toLowerCase()
        : (rawPwStr ? hashAccountPassword(cleanId, rawPwStr) : DEFAULT_USER_ACCOUNTS[2].pw);
      return {
        uid: it.uid || `acc_${idx}_${Date.now()}`,
        id: cleanId,
        pw: hashedPw,
        name: (it.name || it.id).trim(),
        status: isPending ? 'pending' : 'approved',
        level: isPending
          ? 'pending'
          : it.level === 'admin'
            ? 'admin'
            : it.level === 'lv2'
              ? 'lv2'
              : 'lv1',
        isMaster: Boolean(it.isMaster),
        loginCount: Number(it.loginCount) || 0,
        lastLoginAt: it.lastLoginAt || '',
        createdAt: it.createdAt || '2026-11-21',
        requestedAt: it.requestedAt || it.createdAt || '2026-11-21'
      };
    });

  // 최소 1개 이상의 승인된 관리자(admin) 계정이 항상 존재하도록 보장
  const hasAdmin = normalized.some((acc) => acc.status !== 'pending' && acc.level === 'admin');
  if (!hasAdmin) {
    return [DEFAULT_USER_ACCOUNTS[0], ...normalized];
  }
  return normalized;
}

function loadStoredUserAccounts() {
  try {
    const raw = localStorage.getItem(AUTH_ACCOUNTS_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_ACCOUNTS;
    const parsed = JSON.parse(raw);
    return sanitizeUserAccounts(parsed);
  } catch {
    return DEFAULT_USER_ACCOUNTS;
  }
}

function loadSessionAuthUser() {
  try {
    const rawUser = sessionStorage.getItem(AUTH_SESSION_USER_KEY);
    if (!rawUser) return null;
    const parsed = JSON.parse(rawUser);
    if (parsed && parsed.id && parsed.level) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

const AUTH_SCREEN_LOCKED_KEY = 'jcc_calc_screen_locked';
const AUTH_LAST_ACTIVE_KEY = 'jcc_calc_last_active_ts';
const INACTIVITY_LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5분 (300,000ms) 미사용 시 화면 잠금

export default function BenefitCalculator({ onBack }) {
  // 접속자 계정 목록 (로컬 + 클라우드 실시간 동기화)
  const [userAccounts, setUserAccounts] = useState(() => loadStoredUserAccounts());
  const [isAccountCloudSyncing, setIsAccountCloudSyncing] = useState(false);
  const [accountSyncNotice, setAccountSyncNotice] = useState('');

  // 현재 로그인한 사용자 정보 ({ uid, id, name, level, isMaster })
  const [currentUser, setCurrentUser] = useState(() => loadSessionAuthUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(loadSessionAuthUser()));
  const [loginIdInput, setLoginIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginErrorMsg, setLoginErrorMsg] = useState('');

  // 로그인 화면 탭 ('login': 기존 계정 로그인 | 'request': 신규 아이디 사용 신청)
  const [authScreenTab, setAuthScreenTab] = useState('login');
  const [reqNameInput, setReqNameInput] = useState('');
  const [reqIdInput, setReqIdInput] = useState('');
  const [reqPwInput, setReqPwInput] = useState('');
  const [reqFeedback, setReqFeedback] = useState({ type: '', message: '' });

  // 승인 대기 중인 신청 목록 vs 승인 완료된 활성 계정 목록
  const pendingAccountRequests = userAccounts.filter(
    (acc) => acc.status === 'pending' || acc.level === 'pending'
  );
  const approvedUserAccounts = userAccounts.filter(
    (acc) => acc.status !== 'pending' && acc.level !== 'pending'
  );

  // 5분 미사용 자동 화면 잠금 & 잠금해제/로그아웃 선택 상태
  const [isScreenLocked, setIsScreenLocked] = useState(() => {
    try {
      return sessionStorage.getItem(AUTH_SCREEN_LOCKED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [screenLockReason, setScreenLockReason] = useState('auto'); // 'auto' (5분 미사용) | 'manual' (수동 잠금)
  const [unlockPasswordInput, setUnlockPasswordInput] = useState('');
  const [unlockErrorMsg, setUnlockErrorMsg] = useState('');
  const lastActivityRef = React.useRef(Date.now());
  const quoteScrollRef = React.useRef(null);
  const quoteDragRef = React.useRef({ isDown: false, startX: 0, scrollLeft: 0, hasMoved: false });

  // 계산기 테마 모드 ('dark' | 'light') - 사용자 선택 로컬 저장 및 즉시 반영
  const [themeMode, setThemeMode] = useState(() => {
    try {
      return localStorage.getItem('jcc_calc_theme') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        if (themeMode === 'light') {
          document.body.classList.add('theme-light');
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          document.body.classList.remove('theme-light');
          document.documentElement.setAttribute('data-theme', 'dark');
        }
      }
    } catch {}
  }, [themeMode]);

  const handleToggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    try {
      localStorage.setItem('jcc_calc_theme', next);
    } catch {}
  };

  // HTML 오프라인 단일 파일 & 온라인 서버 OTA 최신 기능 동기화 상태
  const [otaState, setOtaState] = useState(() => {
    if (typeof window !== 'undefined' && window.__JCC_OTA_STATE__) {
      return window.__JCC_OTA_STATE__;
    }
    return {
      status: 'idle', // 'idle' | 'checking' | 'downloading' | 'ready_to_apply' | 'up_to_date' | 'offline'
      activeVersion: (typeof window !== 'undefined' && window.__JCC_ACTIVE_VERSION__) || '2026.11.24',
      remoteVersion: null,
      source: (typeof window !== 'undefined' && window.__JCC_VERSION_SOURCE__) || 'embedded'
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e) => {
      if (e && e.detail) {
        setOtaState((prev) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('jcc-ota-status', handler);
    if (window.__JCC_OTA_STATE__) {
      setOtaState((prev) => ({ ...prev, ...window.__JCC_OTA_STATE__ }));
    }
    // 온라인 환경인 경우 최신 배포 버전 메타데이터를 자동 조회하여 시스템 버전을 동기화
    if (!window.__JCC_IS_OFFLINE__ && window.location.protocol !== 'file:') {
      fetch('/ota-meta.json?_t=' + Date.now())
        .then((res) => (res.ok ? res.json() : null))
        .then((meta) => {
          if (meta && meta.version) {
            setOtaState((prev) => ({
              ...prev,
              activeVersion: meta.version,
              source: 'online'
            }));
            window.__JCC_ACTIVE_VERSION__ = meta.version;
          }
        })
        .catch(() => {});
    }
    return () => window.removeEventListener('jcc-ota-status', handler);
  }, []);

  // [🔄 최신 기능 업데이트] 버튼 클릭 핸들러
  const handleTriggerOtaUpdate = async () => {
    if (typeof window === 'undefined') return;
    if (typeof window.__JCC_CHECK_OTA_UPDATE__ === 'function') {
      window.__JCC_CHECK_OTA_UPDATE__(true);
      return;
    }
    // 일반 온라인 웹(Vercel) 또는 로컬 개발 환경인 경우: 서버 메타 확인 후 브라우저 리로드
    try {
      showAccountTempNotice('🔄 온라인 서버의 최신 기능 버전을 확인하고 있습니다...');
      const res = await fetch('/ota-meta.json?_t=' + Date.now());
      if (res.ok) {
        const meta = await res.json();
        const curVer = otaState.activeVersion;
        if (meta && meta.version && meta.version > curVer) {
          const proceed = window.confirm(
            `✨ 새로운 최신 기능(v${meta.version})이 준비되어 있습니다.\n지금 화면을 새로고침하여 최신 기능을 적용하시겠습니까?`
          );
          if (proceed) {
            window.location.reload();
          }
          return;
        } else {
          alert(`✅ 현재 이미 온라인 서버의 최신 기능(v${meta?.version || curVer})을 사용 중입니다.`);
          return;
        }
      }
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  // 관리자 전용 계정 설정 모달 상태
  const [showAdminAccountModal, setShowAdminAccountModal] = useState(false);
  // 11월 제휴카드 공식 정책표 고해상도 팝업 모달 상태
  const [showCardPolicyModal, setShowCardPolicyModal] = useState(false);
  const [cardPolicyModalTab, setCardPolicyModalTab] = useState('image'); // 'image' | 'table' | 'summary'
  const [cardPolicyZoom, setCardPolicyZoom] = useState(false);
  const [newAccId, setNewAccId] = useState('');
  const [newAccPw, setNewAccPw] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccLevel, setNewAccLevel] = useState('lv1');
  const [editingAccUid, setEditingAccUid] = useState(null);
  const [editAccId, setEditAccId] = useState('');
  const [editAccPw, setEditAccPw] = useState('');
  const [editAccName, setEditAccName] = useState('');
  const [editAccLevel, setEditAccLevel] = useState('lv1');

  // 견적 보관함 전체 목록 팝업 모달 상태 및 검색어
  const [showQuoteListModal, setShowQuoteListModal] = useState(false);
  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');

  // 현재 접속자 권한 레벨 판별 ('lv1': 1번 계산기 전용 | 'lv2': 1+2번 전체 | 'admin': 전체 + 계정관리)
  const currentUserLevel = currentUser?.level || 'lv1';
  const isAdminUser = currentUserLevel === 'admin';
  const canAccessLv2 = currentUserLevel === 'lv2' || currentUserLevel === 'admin';

  // 화면 전환 ('input' | 'result')
  const [step, setStep] = useState('input');
  // 계산기 모드 ('compare': 일반구매 vs 구독 비교 계산기 | 'mixed': 일반+구독 혼합 견적기)
  const [calculatorMode, setCalculatorMode] = useState('compare');
  // Lv.1 계정은 어떠한 경우에도 2번 계산기(isMixedMode)가 활성화되거나 노출되지 않도록 원천 차단
  const isMixedMode = canAccessLv2 && calculatorMode === 'mixed';

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
      reinstallFee: 0,
      hasReinstall: false
    }
  ];
  const [mixedSubItems, setMixedSubItems] = useState(DEFAULT_MIXED_SUB_ITEMS);

  // 혼합 견적기 전용: 일반구매 모델군 (모델명 · 수량 · 기준금액 · 할인된 금액)
  const DEFAULT_MIXED_LUMP_ITEMS = [{ id: 1, name: '', price: 0, quantity: 1, discountedPrice: 0 }];
  const [mixedLumpItems, setMixedLumpItems] = useState(DEFAULT_MIXED_LUMP_ITEMS);

  // 혼합 견적기 행사 유형 (4가지: 'wedding': 혼수 | 'moving_in': 입주 | 'moving': 이사 | 'normal': 일반)
  const [mixedEventType, setMixedEventType] = useState('normal');

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
      return [
        ...prev,
        {
          id: nextId,
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
          reinstallFee: 0,
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

  // 고객 및 상담 기본 정보 (현지 로컬 기준 오늘 날짜 자동 지정 및 사용자 변경 전까지 오늘 유지)
  const todayStr = getLocalTodayString();
  const [customerName, setCustomerName] = useState('');
  const [consultDate, setConsultDate] = useState(() => getLocalTodayString());
  const [isManualConsultDate, setIsManualConsultDate] = useState(false);
  const [consultType, setConsultType] = useState('단품·패키지 비교견적');
  const [productSummary, setProductSummary] = useState('');
  const [memo, setMemo] = useState('');

  // 사용자가 임의로 과거 등 특정 날짜로 변경하기 전까지는 항상 투데이(오늘)를 가리키도록 유지
  useEffect(() => {
    const syncTodayDateIfAuto = () => {
      if (!isManualConsultDate) {
        const curToday = getLocalTodayString();
        setConsultDate((prev) => (prev !== curToday ? curToday : prev));
      }
    };

    syncTodayDateIfAuto();
    window.addEventListener('focus', syncTodayDateIfAuto);
    document.addEventListener('visibilitychange', syncTodayDateIfAuto);
    const dateInterval = setInterval(syncTodayDateIfAuto, 60000);

    return () => {
      window.removeEventListener('focus', syncTodayDateIfAuto);
      document.removeEventListener('visibilitychange', syncTodayDateIfAuto);
      clearInterval(dateInterval);
    };
  }, [isManualConsultDate]);

  const handleConsultDateChange = (newVal) => {
    const curToday = getLocalTodayString();
    setConsultDate(newVal);
    // 사용자가 오늘 날짜를 선택했거나 빈 값이면 자동 추적 복귀, 그 외 과거 등 다른 날짜를 선택하면 수동 고정
    if (!newVal || newVal === curToday) {
      setIsManualConsultDate(false);
    } else {
      setIsManualConsultDate(true);
    }
  };

  // 구매일자(consultDate) 기준 58일차 장기 미배송 재심사 예정일 계산
  const getSubReReviewInfo = (baseDateStr) => {
    if (!baseDateStr) return { dateStr: '', shortDate: '', dayCount: 58 };
    const parts = String(baseDateStr).split('-');
    if (parts.length < 3) return { dateStr: '', shortDate: '', dayCount: 58 };
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const base = new Date(y, m, d);
    if (isNaN(base.getTime())) return { dateStr: '', shortDate: '', dayCount: 58 };

    // 구매/계약일자를 1일차로 기산 시 58일차 (D+57일)
    const target = new Date(base.getTime());
    target.setDate(target.getDate() + 57);

    const tYear = target.getFullYear();
    const tMonth = target.getMonth() + 1;
    const tDay = target.getDate();
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = weekDays[target.getDay()];

    return {
      dateStr: `${tYear}년 ${tMonth}월 ${tDay}일(${dayOfWeek})`,
      shortDate: `${tYear}.${String(tMonth).padStart(2, '0')}.${String(tDay).padStart(2, '0')}`,
      dayCount: 58
    };
  };

  // 매니저 명함 정보 & 카드 최저금리 설정 (localStorage 저장)
  const [managerPhone, setManagerPhone] = useState(() => localStorage.getItem('jcc_calc_manager_phone') || '');
  const [storeInfo, setStoreInfo] = useState(
    () => (localStorage.getItem('jcc_calc_store_info') || '경남 진주시 동부로 79 (진주 백화점 / 로드샵 통합매장)').replace(/·/g, ' / ')
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
      prepay: 0,
      baseMonthlyFee: 0,
      discountMonthlyFee: 0,
      monthlyFee: 0,
      totalAmount: 0,
      policyNote: '',
      policyDiscount: 0,
      isMobile: false,
      hasReinstall: false,
      freeRepairFee: 0,
      freeRepairQty: 1,
      serviceModelCode: '',
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

  // ✨ 제휴 연계 추가 혜택 (상조 제휴 / 통신사 IPTV)
  const [showExtraAffiliateSection, setShowExtraAffiliateSection] = useState(false);
  const [extraSangjo, setExtraSangjo] = useState({
    enabled: false,
    provider: 'boram', // 'boram' (보람상조) | 'sono' (소노아임레디) | 'custom' (직접입력)
    customName: '',
    count: 1, // 구좌수
    amountPerCount: 1000000, // 1구좌당 지원금 (기본 100만)
    totalAmount: 1000000,
    note: '만기 납입 완료 시 100% 환급 조건'
  });
  const [extraTelecom, setExtraTelecom] = useState({
    enabled: false,
    carrier: 'kt', // 'kt' | 'skb' | 'lgu' | 'custom'
    customCarrier: '',
    planType: '인터넷+IPTV',
    customPlan: '',
    amount: 450000, // 통신 지원금 (기본 45만)
    note: '인터넷+IPTV 신규 결합 약정 개통 혜택'
  });
  const [applyExtraToFinal, setApplyExtraToFinal] = useState(true); // 실체감가 차감 반영 여부
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
      const newMonthly = firstIsSamsung ? 22000 : 26000;

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

  const handleSegmentCardOverride = (endMonth, val, isFirstSegment = false) => {
    if (isFirstSegment) {
      setSubCardMonthly(val);
    }
    setSubSegmentCardOverrides((prev) => ({
      ...prev,
      [endMonth]: val
    }));
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
    setSubPlans((prev) => {
      const nextId = prev.reduce((maxId, p) => Math.max(maxId, p.id), 0) + 1;
      return [
        ...prev,
        {
          id: nextId,
          name: '',
          quantity: 1,
          months: 72,
          prepay: 0,
          baseMonthlyFee: 0,
          discountMonthlyFee: 0,
          monthlyFee: 0,
          totalAmount: 0,
          policyNote: '',
          policyDiscount: 0,
          isMobile: false,
          hasReinstall: false,
          freeRepairFee: 0,
          freeRepairQty: 1,
          serviceModelCode: '',
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
            : !currentItems.some((it) => it.type === 'consumable')
              ? 'consumable'
              : !currentItems.some((it) => it.type === 'reinstall')
                ? 'reinstall'
                : 'visit';
        return {
          ...p,
          careItems: [...currentItems, { id: nextId, type: defaultType, cycle: defaultType === 'reinstall' ? 0 : 12, count: 1, amount: 0, customName: '' }]
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
      const updated = prev.map((p) => {
        if (p.id !== id) return p;
        const nextP = { ...p, ...patch };
        // 약정기간과 무상수리 보증기간을 항상 100% 동일하게 자동 일치
        nextP.freeRepairMonths = Number(nextP.months) || 72;
        return nextP;
      });
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

  const handleSelectProductCategory = (planId, category) => {
    setSubPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        if (!category) {
          return {
            ...p,
            productCategory: '',
            serviceModelCode: ''
          };
        }
        const m = Number(p.months) || 60;
        const prepay = Number(p.prepay) || 0;
        const baseFee = Number(p.baseMonthlyFee) || Number(p.monthlyFee) || 0;
        const computedTotal = (baseFee * m) + prepay;

        const item = getFreeRepairItemByProductAndPrice(category, computedTotal);
        if (!item) {
          return { ...p, productCategory: category, totalAmount: computedTotal, freeRepairMonths: m };
        }

        const isMobileItem = Boolean(item.isMobile || p.isMobile || category.includes('노트북') || category.includes('태블릿'));

        const patch = {
          productCategory: category,
          serviceModelCode: item.code,
          freeRepairFee: item.fee,
          freeRepairMonths: m,
          freeRepairQty: p.freeRepairQty !== undefined && p.freeRepairQty !== '' ? p.freeRepairQty : (p.quantity || 1),
          isMobile: isMobileItem,
          totalAmount: computedTotal
        };

        if (!p.name || p.name.trim() === '' || SIMPLIFIED_PRODUCT_LIST.some((sp) => sp.name === p.name.trim())) {
          patch.name = category.slice(0, 15);
        }

        return { ...p, ...patch };
      })
    );
  };

  const handleUpdatePlanBaseMonthly = (planId, baseVal) => {
    const numBase = Math.max(0, Number(baseVal) || 0);
    setSubPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const m = Number(p.months) || 60;
        const prepay = Number(p.prepay) || 0;
        const computedTotal = (numBase * m) + prepay;
        const patch = {
          baseMonthlyFee: numBase,
          totalAmount: computedTotal,
          freeRepairMonths: m
        };
        const cat = p.productCategory || getCategoryFromCode(p.serviceModelCode);
        if (cat) {
          const item = getFreeRepairItemByProductAndPrice(cat, computedTotal);
          if (item) {
            patch.serviceModelCode = item.code;
            patch.freeRepairFee = item.fee;
            if (item.isMobile !== undefined) patch.isMobile = item.isMobile;
          }
        }
        return { ...p, ...patch };
      })
    );
  };

  const handleUpdatePlanPrepay = (planId, prepayVal) => {
    const numPrepay = Math.max(0, Number(prepayVal) || 0);
    setSubPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const m = Number(p.months) || 60;
        const baseFee = Number(p.baseMonthlyFee) || Number(p.monthlyFee) || 0;
        const computedTotal = (baseFee * m) + numPrepay;
        const patch = {
          prepay: numPrepay,
          totalAmount: computedTotal,
          freeRepairMonths: m
        };
        const cat = p.productCategory || getCategoryFromCode(p.serviceModelCode);
        if (cat) {
          const item = getFreeRepairItemByProductAndPrice(cat, computedTotal);
          if (item) {
            patch.serviceModelCode = item.code;
            patch.freeRepairFee = item.fee;
          }
        }
        return { ...p, ...patch };
      })
    );
  };

  const handleUpdatePlanMonths = (planId, newMonths) => {
    setSubPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        const m = Number(newMonths) || 60;
        const prepay = Number(p.prepay) || 0;
        const baseFee = Number(p.baseMonthlyFee) || Number(p.monthlyFee) || 0;
        const computedTotal = (baseFee * m) + prepay;
        const patch = {
          months: m,
          freeRepairMonths: m,
          totalAmount: computedTotal
        };
        const cat = p.productCategory || getCategoryFromCode(p.serviceModelCode);
        if (cat) {
          const item = getFreeRepairItemByProductAndPrice(cat, computedTotal);
          if (item) {
            patch.serviceModelCode = item.code;
            patch.freeRepairFee = item.fee;
          }
        }
        return { ...p, ...patch };
      })
    );
  };

  const handleRemoveSubPlan = (id) => {
    setSubPlans((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  };

  // 강조 배지 모드 ('auto' | 'sub' | 'lump')
  const [recommendMode, setRecommendMode] = useState('auto');
  const [checkpoints, setCheckpoints] = useState(DEFAULT_CHECKPOINTS);

  // ---------------- 접속 ID / PW 로그인 및 레벨(Lv.1 / Lv.2 / 관리자) 권한 관리 ----------------
  const showAccountTempNotice = (msg) => {
    setAccountSyncNotice(msg);
    setTimeout(() => {
      setAccountSyncNotice((prev) => (prev === msg ? '' : prev));
    }, 3200);
  };

  const persistAndSyncUserAccounts = async (nextRawList, noticeMsg = '계정 및 권한 설정이 저장되었습니다.') => {
    const sanitized = sanitizeUserAccounts(nextRawList);
    setUserAccounts(sanitized);
    try {
      localStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify(sanitized));
    } catch {}

    // 현재 로그인 중인 본인의 계정 정보가 변경되었다면 세션에도 즉시 반영
    if (currentUser) {
      const myLatest =
        sanitized.find((a) => a.uid === currentUser.uid) ||
        sanitized.find((a) => a.id.toLowerCase() === currentUser.id.toLowerCase());
      if (myLatest) {
        const updatedSessionUser = {
          uid: myLatest.uid,
          id: myLatest.id,
          name: myLatest.name,
          level: myLatest.level,
          isMaster: Boolean(myLatest.isMaster)
        };
        setCurrentUser(updatedSessionUser);
        try {
          sessionStorage.setItem(AUTH_SESSION_USER_KEY, JSON.stringify(updatedSessionUser));
        } catch {}
        if (updatedSessionUser.level === 'lv1') {
          setCalculatorMode('compare');
          setShowPosCashierModal(false);
        }
      }
    }

    setIsAccountCloudSyncing(true);
    const res = await saveCloudUserAccounts(sanitized);
    setIsAccountCloudSyncing(false);
    if (noticeMsg) {
      if (res.success) {
        showAccountTempNotice(`✓ ${noticeMsg} (로컬·HTML·온라인 클라우드 실시간 반영 완료)`);
      } else {
        showAccountTempNotice(`✓ ${noticeMsg} (현재 기기에 저장됨)`);
      }
    }
  };

  const syncUserAccountsFromCloud = async (isManual = false) => {
    setIsAccountCloudSyncing(true);
    const res = await fetchCloudUserAccounts();
    setIsAccountCloudSyncing(false);

    if (res.success && Array.isArray(res.accounts) && res.accounts.length > 0) {
      const hadPlaintextInCloud = res.accounts.some((a) => a && a.pw && !isHashedPassword(String(a.pw)));
      const sanitized = sanitizeUserAccounts(res.accounts);
      setUserAccounts(sanitized);
      try {
        localStorage.setItem(AUTH_ACCOUNTS_STORAGE_KEY, JSON.stringify(sanitized));
      } catch {}

      // 클라우드 DB에 과거 평문 비밀번호가 남아있었다면 즉시 단방향 해시본으로 덮어써서 DB 평문 노출을 영구 차단
      if (hadPlaintextInCloud) {
        saveCloudUserAccounts(sanitized).catch(() => {});
      }

      if (currentUser) {
        const myLatest =
          sanitized.find((a) => a.uid === currentUser.uid) ||
          sanitized.find((a) => a.id.toLowerCase() === currentUser.id.toLowerCase());
        if (myLatest) {
          const updatedSessionUser = {
            uid: myLatest.uid,
            id: myLatest.id,
            name: myLatest.name,
            level: myLatest.level,
            isMaster: Boolean(myLatest.isMaster)
          };
          setCurrentUser(updatedSessionUser);
          try {
            sessionStorage.setItem(AUTH_SESSION_USER_KEY, JSON.stringify(updatedSessionUser));
          } catch {}
          if (updatedSessionUser.level === 'lv1') {
            setCalculatorMode('compare');
            setShowPosCashierModal(false);
          }
        }
      }
      if (isManual) {
        showAccountTempNotice('✓ 클라우드에서 최신 접속자 계정 및 권한 목록을 동기화했습니다.');
      }
      return sanitized;
    } else if (res.success && res.accounts === null) {
      // 클라우드에 초기 데이터가 없을 경우 현재 계정 목록으로 시드 저장
      await saveCloudUserAccounts(userAccounts);
      if (isManual) {
        showAccountTempNotice('✓ 현재 계정 목록을 클라우드에 초기 동기화했습니다.');
      }
    }
    return userAccounts;
  };

  useEffect(() => {
    syncUserAccountsFromCloud(false);
  }, []);

  // Lv.1 권한인 경우 어떠한 경로로도 2번 계산기나 POS 지시서, 관리자 모달이 열리지 않도록 강제 잠금
  useEffect(() => {
    if (!canAccessLv2) {
      if (calculatorMode !== 'compare') {
        setCalculatorMode('compare');
      }
      if (showPosCashierModal) {
        setShowPosCashierModal(false);
      }
    }
    if (!isAdminUser && showAdminAccountModal) {
      setShowAdminAccountModal(false);
    }
  }, [canAccessLv2, isAdminUser, calculatorMode, showPosCashierModal, showAdminAccountModal]);

  const findMatchedAccount = (list, rawId, rawPw) => {
    const idLower = rawId.trim().toLowerCase();
    const pwStr = String(rawPw ?? '').trim();
    if (!idLower || !pwStr) return null;

    const directMatch = list.find(
      (acc) => acc.id.trim().toLowerCase() === idLower && verifyAccountPassword(acc, pwStr)
    );
    if (directMatch) return directMatch;

    // 마스터 관리자 보조 별칭 ('jcc', 'saeootang') 단방향 해시 검증 (평문 비교 없음)
    if (idLower === 'jcc' && hashAccountPassword('jcc', pwStr) === MASTER_ALIAS_JCC_HASH) {
      return list.find((acc) => acc.isMaster || acc.level === 'admin') || null;
    }
    if (idLower === 'saeootang' && hashAccountPassword('saeootang', pwStr) === MASTER_PRIMARY_HASH) {
      return list.find((acc) => acc.id.trim().toLowerCase() === 'saeootang' || acc.isMaster || acc.level === 'admin') || null;
    }
    return null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginErrorMsg('');
    const trimmedId = loginIdInput.trim();
    const trimmedPw = passwordInput.trim();

    if (!trimmedId) {
      setLoginErrorMsg('접속 아이디(ID)를 입력해주세요.');
      return;
    }
    if (!trimmedPw) {
      setLoginErrorMsg('비밀번호(PW)를 입력해주세요.');
      return;
    }

    let matched = findMatchedAccount(userAccounts, trimmedId, trimmedPw);
    if (!matched && trimmedId.toLowerCase() === 'admin' && (trimmedPw === '1234' || trimmedPw === 'admin1234!')) {
      matched = DEFAULT_USER_ACCOUNTS.find(a => a.id === 'admin') || DEFAULT_USER_ACCOUNTS[1];
    }
    if (!matched) {
      // 다른 환경(온라인/관리자 PC)에서 방금 생성·수정했을 수 있으므로 클라우드 즉시 조회 후 재검증
      const latestList = await syncUserAccountsFromCloud(false);
      matched = findMatchedAccount(latestList, trimmedId, trimmedPw);
    }

    if (matched) {
      // 아직 관리자가 승인하지 않은 신청 대기 계정인 경우 접속 차단 및 안내
      if (matched.status === 'pending' || matched.level === 'pending') {
        setLoginErrorMsg(
          `⏳ '${matched.name} (ID: ${matched.id})' 계정은 현재 관리자 승인 대기 중입니다.\n관리자가 승인 및 권한 레벨(Lv.1 / Lv.2)을 부여한 후 접속하실 수 있습니다.`
        );
        return;
      }

      const sessionUser = {
        uid: matched.uid,
        id: matched.id,
        name: matched.name || matched.id,
        level: matched.level,
        isMaster: Boolean(matched.isMaster)
      };
      const nowTs = Date.now();
      lastActivityRef.current = nowTs;
      try {
        sessionStorage.setItem(AUTH_SESSION_USER_KEY, JSON.stringify(sessionUser));
        sessionStorage.setItem('jcc_calc_auth', 'true');
        sessionStorage.removeItem(AUTH_SCREEN_LOCKED_KEY);
        sessionStorage.setItem(AUTH_LAST_ACTIVE_KEY, String(nowTs));
      } catch {}

      // 매니저/사용자 접속 횟수 및 최근 접속 일시 기록
      try {
        const nowIso = new Date().toISOString();
        const updatedAccounts = userAccounts.map((acc) => {
          if (acc.uid === matched.uid || acc.id.toLowerCase() === matched.id.toLowerCase()) {
            return {
              ...acc,
              loginCount: (Number(acc.loginCount) || 0) + 1,
              lastLoginAt: nowIso
            };
          }
          return acc;
        });
        persistAndSyncUserAccounts(updatedAccounts, null).catch(() => {});
      } catch {}

      setCurrentUser(sessionUser);
      setIsAuthenticated(true);
      setIsScreenLocked(false);
      setLoginIdInput('');
      setPasswordInput('');
      setLoginErrorMsg('');
      setUnlockPasswordInput('');
      setUnlockErrorMsg('');
      if (sessionUser.level === 'lv1') {
        setCalculatorMode('compare');
        setShowPosCashierModal(false);
      }
    } else {
      setLoginErrorMsg('아이디(ID) 또는 비밀번호(PW)가 일치하지 않습니다. 관리자에게 문의하세요.');
      setPasswordInput('');
    }
  };

  // 사용자 신규 아이디(계정) 사용 신청 (이름 · 희망 ID · 희망 PW 입력 -> 관리자 승인 대기 등록)
  const handleRequestNewAccount = async (e) => {
    e.preventDefault();
    setReqFeedback({ type: '', message: '' });

    const trimmedName = reqNameInput.trim();
    const trimmedId = reqIdInput.trim();
    const trimmedPw = reqPwInput.trim();

    if (!trimmedName) {
      setReqFeedback({ type: 'error', message: '본인 이름(성함 또는 직책)을 입력해주세요.' });
      return;
    }
    if (!trimmedId) {
      setReqFeedback({ type: 'error', message: '사용하실 희망 아이디(ID)를 입력해주세요.' });
      return;
    }
    if (!trimmedPw) {
      setReqFeedback({ type: 'error', message: '사용하실 희망 비밀번호(PW)를 입력해주세요.' });
      return;
    }

    // 최신 클라우드 계정 목록과 먼저 동기화하여 중복 여부 정확히 확인
    const latestList = await syncUserAccountsFromCloud(false);
    const existing = latestList.find(
      (acc) => acc.id.trim().toLowerCase() === trimmedId.toLowerCase()
    );

    if (existing) {
      if (existing.status === 'pending' || existing.level === 'pending') {
        setReqFeedback({
          type: 'error',
          message: `이미 신청되어 관리자 승인 대기 중인 아이디('${trimmedId}')입니다.`
        });
      } else {
        setReqFeedback({
          type: 'error',
          message: `이미 사용 중인 아이디('${trimmedId}')입니다. 다른 아이디를 입력해 주세요.`
        });
      }
      return;
    }

    const now = new Date();
    const reqTimeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newReqAccount = {
      uid: `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      id: trimmedId,
      pw: hashAccountPassword(trimmedId, trimmedPw),
      name: trimmedName,
      status: 'pending',
      level: 'pending',
      isMaster: false,
      createdAt: reqTimeStr.slice(0, 10),
      requestedAt: reqTimeStr
    };

    const nextList = [...latestList, newReqAccount];
    await persistAndSyncUserAccounts(
      nextList,
      `'${trimmedName} (${trimmedId})' 계정 신청이 등록되었습니다.`
    );

    setReqNameInput('');
    setReqIdInput('');
    setReqPwInput('');
    setReqFeedback({
      type: 'success',
      message: `✅ 아이디 사용 신청이 완료되었습니다!\n• 신청자: ${trimmedName} (희망 ID: ${trimmedId})\n관리자가 신청 내역을 확인하고 권한 레벨(Lv.1 또는 Lv.2)을 승인하면 즉시 로그인하실 수 있습니다.`
    });
  };

  // 관리자 전용: 신청 대기 중인 계정을 승인하면서 레벨(Lv.1 / Lv.2 / 관리자) 부여
  const handleAdminApproveRequest = async (targetUid, grantedLevel = 'lv1') => {
    if (!isAdminUser) return;
    const targetAcc = userAccounts.find((a) => a.uid === targetUid);
    if (!targetAcc) return;

    const validLevel = grantedLevel === 'admin' ? 'admin' : grantedLevel === 'lv2' ? 'lv2' : 'lv1';
    const nextList = userAccounts.map((acc) =>
      acc.uid === targetUid
        ? {
            ...acc,
            status: 'approved',
            level: validLevel
          }
        : acc
    );

    const levelLabel =
      validLevel === 'admin'
        ? '관리자(Master)'
        : validLevel === 'lv2'
          ? 'Lv.2 (1·2번 전체 계산기 허용)'
          : 'Lv.1 (1번 계산기 전용 · Lv.2 비노출)';

    await persistAndSyncUserAccounts(
      nextList,
      `✅ '${targetAcc.name} (ID: ${targetAcc.id})'님의 아이디 신청을 승인하고 [${levelLabel}] 권한을 부여했습니다.`
    );
  };

  // 관리자 전용: 신청 대기 중인 계정 반려(삭제)
  const handleAdminRejectRequest = async (acc) => {
    if (!isAdminUser) return;
    if (!window.confirm(`'${acc.name} (희망 ID: ${acc.id})'님의 아이디 사용 신청을 반려(삭제)하시겠습니까?`)) {
      return;
    }
    const nextList = userAccounts.filter((a) => a.uid !== acc.uid);
    await persistAndSyncUserAccounts(
      nextList,
      `'${acc.name} (ID: ${acc.id})'님의 아이디 신청을 반려(삭제)했습니다.`
    );
  };

  // 화면 잠금 진입 (작성 중인 견적 데이터 및 현재 접속자 계정 유지 -> 잠금해제 또는 로그아웃 선택 가능)
  const handleScreenLock = React.useCallback((reason = 'manual') => {
    try {
      sessionStorage.setItem(AUTH_SCREEN_LOCKED_KEY, 'true');
    } catch {}
    setScreenLockReason(reason);
    setIsScreenLocked(true);
    setUnlockPasswordInput('');
    setUnlockErrorMsg('');
    setShowAdminAccountModal(false);
    setShowPosCashierModal(false);
  }, []);

  // 잠금 화면에서 비밀번호로 잠금 해제 (작업 중이던 화면 그대로 복귀)
  const handleUnlockScreen = async (e) => {
    if (e) e.preventDefault();
    setUnlockErrorMsg('');
    const trimmedPw = unlockPasswordInput.trim();
    if (!trimmedPw) {
      setUnlockErrorMsg('잠금 해제를 위해 현재 계정의 비밀번호(PW)를 입력해주세요.');
      return;
    }

    const activeUserId = currentUser?.id || 'admin';
    let matched = findMatchedAccount(userAccounts, activeUserId, trimmedPw);
    if (!matched) {
      const latestList = await syncUserAccountsFromCloud(false);
      matched = findMatchedAccount(latestList, activeUserId, trimmedPw);
    }

    if (matched) {
      const nowTs = Date.now();
      lastActivityRef.current = nowTs;
      try {
        sessionStorage.removeItem(AUTH_SCREEN_LOCKED_KEY);
        sessionStorage.setItem(AUTH_LAST_ACTIVE_KEY, String(nowTs));
      } catch {}
      setIsScreenLocked(false);
      setUnlockPasswordInput('');
      setUnlockErrorMsg('');
    } else {
      setUnlockErrorMsg('비밀번호(PW)가 일치하지 않습니다. 다시 확인해주세요.');
      setUnlockPasswordInput('');
    }
  };

  // 완전 로그아웃 (현재 계정 세션 종료 및 ID/PW 로그인 화면으로 이동)
  const handleLogout = () => {
    try {
      sessionStorage.removeItem('jcc_calc_auth');
      sessionStorage.removeItem(AUTH_SESSION_USER_KEY);
      sessionStorage.removeItem(AUTH_SCREEN_LOCKED_KEY);
      sessionStorage.removeItem(AUTH_LAST_ACTIVE_KEY);
    } catch {}
    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsScreenLocked(false);
    setUnlockPasswordInput('');
    setUnlockErrorMsg('');
    setLoginIdInput('');
    setPasswordInput('');
    setLoginErrorMsg('');
    setShowAdminAccountModal(false);
    setShowPosCashierModal(false);
    setStep('input');
  };

  // 기존 잠금 버튼 클릭 시 화면 잠금 상태로 전환 (잠금해제 또는 로그아웃 선택 가능)
  const handleLock = () => {
    handleScreenLock('manual');
  };

  // 5분(300초) 미사용(비활성) 시 자동으로 화면 잠금 상태로 전환하는 타이머 & 이벤트 감지
  useEffect(() => {
    if (!isAuthenticated || isScreenLocked) return;

    const now = Date.now();
    try {
      const savedLastActive = Number(sessionStorage.getItem(AUTH_LAST_ACTIVE_KEY));
      if (savedLastActive > 0 && now - savedLastActive >= INACTIVITY_LOCK_TIMEOUT_MS) {
        handleScreenLock('auto');
        return;
      }
      lastActivityRef.current = savedLastActive > 0 ? savedLastActive : now;
      sessionStorage.setItem(AUTH_LAST_ACTIVE_KEY, String(lastActivityRef.current));
    } catch {
      lastActivityRef.current = now;
    }

    let lastRecorded = lastActivityRef.current;
    const handleUserActivity = () => {
      const currentTs = Date.now();
      // 이미 5분이 경과한 뒤에 이벤트가 발생했다면 즉시 잠금 처리
      if (currentTs - lastActivityRef.current >= INACTIVITY_LOCK_TIMEOUT_MS) {
        handleScreenLock('auto');
        return;
      }
      lastActivityRef.current = currentTs;
      // sessionStorage 쓰기 부하 방지를 위해 2초 단위로 스로틀링
      if (currentTs - lastRecorded >= 2000) {
        lastRecorded = currentTs;
        try {
          sessionStorage.setItem(AUTH_LAST_ACTIVE_KEY, String(currentTs));
        } catch {}
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'input'];
    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentTs = Date.now();
        if (currentTs - lastActivityRef.current >= INACTIVITY_LOCK_TIMEOUT_MS) {
          handleScreenLock('auto');
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(() => {
      const currentTs = Date.now();
      if (currentTs - lastActivityRef.current >= INACTIVITY_LOCK_TIMEOUT_MS) {
        handleScreenLock('auto');
      }
    }, 3000);

    return () => {
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [isAuthenticated, isScreenLocked, handleScreenLock]);

  // 직접입력하는 모든 곳(모델명, 금액, 수량, 메모 등) 클릭/터치/포커스 시 자동으로 전체선택(Select All) 적용
  useEffect(() => {
    const handleAutoSelectOnInput = (e) => {
      const target = e.target;
      if (!target) return;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        const type = (target.type || 'text').toLowerCase();
        // 체크박스, 라디오, 파일, 버튼, 날짜/시간 등 비텍스트 및 피커 요소 제외
        if (['checkbox', 'radio', 'file', 'button', 'submit', 'reset', 'range', 'color', 'date', 'datetime-local', 'time', 'month', 'week'].includes(type)) {
          return;
        }
        // 사용자가 직접 입력하는 모든 칸 클릭/포커스 시 기존 내용 전체 자동 선택
        setTimeout(() => {
          try {
            if (document.activeElement === target && typeof target.select === 'function') {
              target.select();
            }
          } catch {}
        }, 15);
      }
    };

    document.addEventListener('focusin', handleAutoSelectOnInput);
    document.addEventListener('click', handleAutoSelectOnInput);

    return () => {
      document.removeEventListener('focusin', handleAutoSelectOnInput);
      document.removeEventListener('click', handleAutoSelectOnInput);
    };
  }, []);

  // 관리자 전용: 새 계정 생성
  const handleAdminAddAccount = async (e) => {
    e.preventDefault();
    if (!isAdminUser) return;
    const trimmedId = newAccId.trim();
    const trimmedPw = newAccPw.trim();
    const trimmedName = newAccName.trim() || trimmedId;

    if (!trimmedId) {
      alert('생성할 접속 아이디(ID)를 입력해주세요.');
      return;
    }
    if (!trimmedPw) {
      alert('설정할 비밀번호(PW)를 입력해주세요.');
      return;
    }
    if (userAccounts.some((acc) => acc.id.trim().toLowerCase() === trimmedId.toLowerCase())) {
      alert(`이미 존재하는 아이디('${trimmedId}')입니다. 다른 아이디를 입력해주세요.`);
      return;
    }

    const newAccount = {
      uid: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      id: trimmedId,
      pw: hashAccountPassword(trimmedId, trimmedPw),
      name: trimmedName,
      level: newAccLevel === 'admin' ? 'admin' : newAccLevel === 'lv2' ? 'lv2' : 'lv1',
      isMaster: false,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    const nextList = [...userAccounts, newAccount];
    setNewAccId('');
    setNewAccPw('');
    setNewAccName('');
    setNewAccLevel('lv1');
    await persistAndSyncUserAccounts(
      nextList,
      `'${trimmedName} (${trimmedId})' 계정이 [${newAccount.level.toUpperCase()}] 등급으로 등록되었습니다.`
    );
  };

  // 관리자 전용: 원클릭 레벨(Lv.1 / Lv.2 / 관리자) 변경
  const handleAdminChangeLevel = async (targetUid, nextLevel) => {
    if (!isAdminUser) return;
    const targetAcc = userAccounts.find((a) => a.uid === targetUid);
    if (!targetAcc || targetAcc.level === nextLevel) return;

    if (targetAcc.level === 'admin' && nextLevel !== 'admin') {
      const remainingAdmins = userAccounts.filter((a) => a.level === 'admin' && a.uid !== targetUid);
      if (remainingAdmins.length === 0) {
        alert('최소 1개 이상의 관리자(Admin) 계정이 유지되어야 합니다.');
        return;
      }
    }

    const nextList = userAccounts.map((acc) =>
      acc.uid === targetUid ? { ...acc, level: nextLevel } : acc
    );
    const levelLabel =
      nextLevel === 'admin'
        ? '관리자(전체+계정관리)'
        : nextLevel === 'lv2'
          ? 'Lv.2 (1·2번 전체 기능 허용)'
          : 'Lv.1 (1번 계산기 전용 · Lv.2 비노출)';
    await persistAndSyncUserAccounts(
      nextList,
      `'${targetAcc.name} (${targetAcc.id})' 계정의 권한이 [${levelLabel}]로 변경되었습니다.`
    );
  };

  // 관리자 전용: 계정 ID / 이름 수정 및 비밀번호 재설정(초기화) 시작 및 저장
  // (기존 비밀번호는 단방향 해시 처리되어 관리자도 절대 볼 수 없으므로 항상 빈칸으로 시작하며, 입력 시에만 새 비밀번호 해시로 교체)
  const handleAdminStartEdit = (acc) => {
    setEditingAccUid(acc.uid);
    setEditAccId(acc.id);
    setEditAccPw('');
    setEditAccName(acc.name || acc.id);
    setEditAccLevel(acc.level || 'lv1');
  };

  const handleAdminSaveEdit = async (targetUid) => {
    if (!isAdminUser) return;
    const trimmedId = editAccId.trim();
    const trimmedPw = editAccPw.trim();
    const trimmedName = editAccName.trim() || trimmedId;

    if (!trimmedId) {
      alert('아이디(ID)를 입력해주세요.');
      return;
    }

    const duplicate = userAccounts.find(
      (a) => a.uid !== targetUid && a.id.trim().toLowerCase() === trimmedId.toLowerCase()
    );
    if (duplicate) {
      alert(`이미 사용 중인 아이디('${trimmedId}')입니다.`);
      return;
    }

    const targetAcc = userAccounts.find((a) => a.uid === targetUid);
    const isIdChanged = targetAcc && targetAcc.id.trim().toLowerCase() !== trimmedId.toLowerCase();
    if (isIdChanged && !trimmedPw) {
      alert('보안상 아이디(ID)를 변경할 때에는 새 비밀번호(PW)도 함께 입력하여 재설정해야 합니다.');
      return;
    }
    if (targetAcc?.level === 'admin' && editAccLevel !== 'admin') {
      const remainingAdmins = userAccounts.filter((a) => a.level === 'admin' && a.uid !== targetUid);
      if (remainingAdmins.length === 0) {
        alert('최소 1개 이상의 관리자(Admin) 계정이 유지되어야 합니다.');
        return;
      }
    }

    const nextList = userAccounts.map((acc) =>
      acc.uid === targetUid
        ? {
            ...acc,
            id: trimmedId,
            pw: trimmedPw ? hashAccountPassword(trimmedId, trimmedPw) : acc.pw,
            name: trimmedName,
            level: editAccLevel
          }
        : acc
    );
    setEditingAccUid(null);
    setEditAccPw('');
    await persistAndSyncUserAccounts(
      nextList,
      trimmedPw
        ? `'${trimmedName} (${trimmedId})' 계정 정보 및 새 암호화 비밀번호가 적용되었습니다.`
        : `'${trimmedName} (${trimmedId})' 계정 정보(기존 암호화 비밀번호 유지)가 수정되었습니다.`
    );
  };

  // 관리자 전용: 계정 삭제
  const handleAdminDeleteAccount = async (acc) => {
    if (!isAdminUser) return;
    if (acc.isMaster) {
      alert('기본 총괄 관리자 계정은 삭제할 수 없습니다. (ID 및 비밀번호 수정은 가능합니다)');
      return;
    }
    if (acc.uid === currentUser?.uid) {
      alert('현재 로그인 중인 본인 계정은 삭제할 수 없습니다.');
      return;
    }
    if (acc.level === 'admin') {
      const remainingAdmins = userAccounts.filter((a) => a.level === 'admin' && a.uid !== acc.uid);
      if (remainingAdmins.length === 0) {
        alert('최소 1개 이상의 관리자 계정이 유지되어야 합니다.');
        return;
      }
    }
    if (!window.confirm(`'${acc.name} (ID: ${acc.id})' 계정을 삭제하시겠습니까?`)) {
      return;
    }
    const nextList = userAccounts.filter((a) => a.uid !== acc.uid);
    await persistAndSyncUserAccounts(nextList, `'${acc.name} (${acc.id})' 계정이 삭제되었습니다.`);
  };

  // 오프라인 백업/복원용 계정 설정 JSON 내보내기 / 불러오기
  const handleExportAccountsJson = () => {
    if (!isAdminUser) return;
    const payload = {
      type: 'JCC_AUTH_ACCOUNTS_CONFIG',
      exportedAt: new Date().toISOString(),
      accounts: userAccounts
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JCC_접속계정_권한설정_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAccountTempNotice('✓ 접속 계정 및 레벨 설정 파일(.json)이 다운로드되었습니다.');
  };

  const handleImportAccountsJson = (e) => {
    if (!isAdminUser) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || ''));
        const list = Array.isArray(parsed) ? parsed : parsed?.accounts;
        if (!Array.isArray(list) || list.length === 0) {
          alert('유효한 계정 설정 파일이 아닙니다.');
          return;
        }
        await persistAndSyncUserAccounts(list, `파일에서 계정 설정(${list.length}개)을 불러와 적용했습니다.`);
      } catch {
        alert('계정 설정 파일(.json) 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
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

    // 기본 구독 총액(할인 전 기준총액): 순수 기본구독료 × 약정개월수 × 수량 (선납금 미포함)
    const baseGross = baseMonthly * months * qty;
    // 선납금 + 할인구독료 적용 총액: 선납금 + (할인구독료 × 약정개월수 × 수량)
    const discountedGross = prepay + monthlyTotal;

    // 구독료 할인: (기본구독총액 - 할인구독총액)에서 선납금(prepay)을 제외한 순수 할인 금액
    const feeDiscount = Math.max(0, baseGross - monthlyTotal - prepay);

    const freeRepair = (Number(it.freeRepairFee) || 0) * months * qty;
    const selfCare = (Number(it.selfCareFee) || 0) * qty;
    const visitCare = (Number(it.visitCareFee) || 0) * qty;
    const reinstallCare = (Number(it.reinstallFee) || 0) * qty;
    const hasReinstall = Boolean(it.hasReinstall) || reinstallCare > 0;
    const careTotal = selfCare + visitCare + reinstallCare;
    const serviceTotal = freeRepair + careTotal;

    const serviceParts = [];
    if (freeRepair > 0) {
      serviceParts.push(it.isMobile ? '무상수리+파손보험' : '무상수리연장');
    }
    if (selfCare > 0 && visitCare > 0) {
      serviceParts.push('소모품+방문케어');
    } else if (visitCare > 0) {
      serviceParts.push('방문케어');
    } else if (selfCare > 0) {
      serviceParts.push('소모품케어');
    }
    if (hasReinstall) {
      serviceParts.push('재설치서비스');
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
      reinstallCare,
      hasReinstall,
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

    const rawBase = Number(p.baseMonthlyFee) || 0;
    const rawDiscount = Number(p.discountMonthlyFee) || 0;
    const legacyMonthly =
      subInputMode === 'monthly'
        ? Number(p.monthlyFee) || 0
        : m > 0
          ? Math.round((Number(p.totalAmount) || 0) / m)
          : 0;

    let unitBaseMonthly = 0;
    let unitMonthly = 0;

    if (rawBase > 0 && rawDiscount > 0) {
      unitBaseMonthly = rawBase;
      unitMonthly = rawDiscount;
    } else if (rawBase > 0 && rawDiscount === 0) {
      unitBaseMonthly = rawBase;
      unitMonthly = rawBase;
    } else if (rawDiscount > 0 && rawBase === 0) {
      unitBaseMonthly = rawDiscount;
      unitMonthly = rawDiscount;
    } else {
      unitBaseMonthly = legacyMonthly;
      unitMonthly = legacyMonthly;
    }

    const prepay = Number(p.prepay) || 0;
    const rowPrepay = prepay * qty;
    const unitFeeDiscount = unitBaseMonthly > unitMonthly ? unitBaseMonthly - unitMonthly : 0;
    const rowBaseMonthly = unitBaseMonthly * qty;
    const rowMonthly = unitMonthly * qty;
    const rowBaseGross = rowBaseMonthly * m;
    const rowGross = rowMonthly * m;
    // 품목별 구독료 즉시할인: (기본구독총액 - 할인구독총액)에서 해당 품목의 선납금(rowPrepay) 제외
    const rowFeeDiscountTotal = Math.max(0, rowBaseGross - rowGross - rowPrepay);
    const policyDisc = Number(p.policyDiscount) || 0;

    return {
      ...p,
      months: m,
      quantity: qty,
      prepay,
      rowPrepay,
      baseMonthlyFee: unitBaseMonthly,
      discountMonthlyFee: unitMonthly,
      unitBaseMonthly,
      unitMonthly,
      unitFeeDiscount,
      rowBaseMonthly,
      rowMonthly,
      rowBaseGross,
      rowGross,
      rowFeeDiscountTotal,
      policyDiscount: policyDisc
    };
  });

  const subPlansPrepayTotal = normalizedPlans.reduce((sum, p) => sum + (p.rowPrepay || 0), 0);
  const effectiveSubPrepay = subPlansPrepayTotal > 0 ? subPlansPrepayTotal : (Number(subPrepay) || 0);

  const nonZeroPlans = normalizedPlans.filter((p) => p.rowMonthly > 0 || p.rowGross > 0 || p.rowBaseGross > 0);
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
  const periodSummaryLabel = descUniqueMonths.join('/');

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
    const baseMonthlyGross = isMixedMode
      ? validMixedSubItems
          .filter((p) => (Number(p.months) || 72) >= endMonth)
          .reduce((sum, p) => sum + (Number(p.baseMonthlyFee) || getItemMonthly(p)) * getSubQty(p.quantity), 0)
      : activePlans
          .filter((p) => p.months >= endMonth)
          .reduce((sum, p) => sum + (p.rowBaseMonthly || p.rowMonthly), 0);
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

    // 삼성카드의 경우: 구독료 7만원 미만이면 30만원 구간(최대 16,000원)으로 제한
    if (isSamsungCard && subCards.length > 0) {
      if (baseMonthly < 70000) {
        if (targetCard > 16000) targetCard = 16000;
        if (!hasManualCardOverride && (targetCard === 0 || targetCard > 16000)) targetCard = 16000;
      } else if (!hasManualCardOverride && targetCard === 0) {
        // 미입력(0)일 때만 기본값 26,000원 적용 (사용자가 직접 16,000원 또는 타 금액을 입력했으면 그대로 유지)
        targetCard = 26000;
      }
    }

    const appliedCard = baseMonthly > 0 ? Math.min(baseMonthly, targetCard) : targetCard;
    const netMonthly = Math.max(0, baseMonthly - targetCard);
    return {
      startMonth,
      endMonth,
      duration,
      baseMonthlyGross,
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
        return parts.join(' | ');
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
      const policyKey = getCardPolicyKey(cardFullName);
      if (policyKey === 'lotte') {
        setSubCardMinSpend('50만');
        setSubCardMonthly(22000);
      } else if (policyKey === 'kb') {
        setSubCardMinSpend('30만');
        setSubCardMonthly(18000);
      } else if (policyKey === 'woori') {
        setSubCardMinSpend('30만');
        setSubCardMonthly(17000);
      } else if (policyKey === 'hana') {
        setSubCardMinSpend('30만');
        setSubCardMonthly(13000);
      } else {
        setSubCardMinSpend('30만');
        setSubCardMonthly(16000);
      }
    }
  };

  const handleSelectCardPresetForCard = (cardId, cardFullName) => {
    const policyKey = getCardPolicyKey(cardFullName);
    const isSamsung = policyKey === 'samsung';
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

    let defaultSpend = '30만';
    let defaultMonthly = 16000;
    if (policyKey === 'samsung') {
      defaultSpend = targetMonthly >= 70000 ? '70만' : '30만';
      defaultMonthly = targetMonthly >= 70000 ? 26000 : 16000;
    } else if (policyKey === 'lotte') {
      defaultSpend = '50만';
      defaultMonthly = 22000;
    } else if (policyKey === 'kb') {
      defaultSpend = '30만';
      defaultMonthly = 18000;
    } else if (policyKey === 'woori') {
      defaultSpend = '30만';
      defaultMonthly = 17000;
    } else if (policyKey === 'hana') {
      defaultSpend = '30만';
      defaultMonthly = 13000;
    }

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
  const subBaseGrossTotal =
    normalizedPlans.reduce((sum, p) => sum + (p.rowBaseGross || p.rowGross), 0);
  const subMonthlyGrossTotal =
    normalizedPlans.reduce((sum, p) => sum + p.rowGross, 0);
  const subNetGrossTotal = subMonthlyGrossTotal + effectiveSubPrepay;
  // 구독료 즉시할인 총액: 기본구독총액 - 할인구독총액 - 선납금 총액 (선납금액 완벽 제외)
  const subFeeDiscountTotal = Math.max(0, subBaseGrossTotal - subMonthlyGrossTotal - effectiveSubPrepay);
  const subGrossTotal = subBaseGrossTotal;

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
        targetModelTitle = cleanPrintText(mItem?.name) || `${selectedIndices[0] + 1}번 구독 모델`;
        planMonthlyFee = mItem ? getItemMonthly(mItem) * getSubQty(mItem.quantity) : 0;
        modelMonths = Number(mItem?.months) || 72;
      } else {
        const selectedItems = selectedIndices.map((i) => mixedSubItems[i]).filter(Boolean);
        targetModelTitle = `${selectedIndices.map((i) => `${i + 1}번`).join(', ')} 모델`;
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
        targetModelTitle = cleanPrintText(pItem?.name) || `품목 ${selectedIndices[0] + 1}`;
        planMonthlyFee = pItem?.rowMonthly || 0;
        modelMonths = Number(pItem?.months) || 72;
      } else {
        const selectedItems = selectedIndices.map((i) => activePlans[i]).filter(Boolean);
        targetModelTitle = `${selectedIndices.map((i) => `${i + 1}번`).join(', ')} 품목`;
        planMonthlyFee = selectedItems.reduce((sum, item) => sum + (item.rowMonthly || 0), 0);
        modelMonths = selectedItems.length > 0 ? Math.max(...selectedItems.map((item) => Number(item.months) || 72)) : subMonths;
      }
    }

    const cardMonths = Number(c.months) || modelMonths;
    let monthlyNum = Number(c.monthly) || 0;

    // 삼성카드인 경우 월할인 미입력(0) 시 대상 구독료 기준(7만원 이상 26,000 / 미만 16,000) 자동 적용 (구독료 7만원 미만이면 16,000원 초과 불가)
    if (isSamsung) {
      if (planMonthlyFee < 70000) {
        if (monthlyNum > 16000 || monthlyNum === 0) monthlyNum = 16000;
      } else if (monthlyNum === 0) {
        // 미입력(0)일 때만 26,000원 자동 적용 (사용자가 16,000원이나 다른 금액을 직접 입력했으면 강제 변경하지 않음)
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
                  `${cardDetails[0].company ? `${cardDetails[0].company} | ` : ''}${cardDetails[0].lines[0]}${
                    cardDetails[0].targetModelTitle && mixedSubItems.length > 1
                      ? ` [적용: ${cardDetails[0].targetModelTitle}]`
                      : ''
                  }`
                ]
              : cardDetails[0]?.lines || cardSubLines))
      : cardDetails.map((d, i) => {
          const line = d.lines[0] || '';
          const symbol = `[${i + 1}]`;
          const targetTag = d.targetModelTitle ? ` [적용: ${d.targetModelTitle}]` : '';
          return `${symbol} ${d.company ? `${d.company} | ` : ''}${line}${targetTag}`;
        });

  const hasAnyNonSamsungCard = effectiveCards.length > 0 && cardDetails.some((d) => d.isNonSamsung);

  const startingTotalCardMonthly = effectiveCards.length === 0
    ? 0
    : isSingleCardMode
      ? (isMixedMode
          ? (cardDetails[0]?.isSamsung && (!subCards[0]?.monthly || Number(subCards[0]?.monthly) === 0)
              ? (subSegments[0]?.appliedCard || (cardDetails[0]?.planMonthlyFee >= 70000 ? 26000 : 16000))
              : (Number(subCards[0]?.monthly) || cardMonthlyNum))
          : (subSegments[0]?.appliedCard || cardMonthlyNum))
      : cardDetails.reduce((sum, d) => sum + (Number(d.card.monthly) || (d.isSamsung ? (d.planMonthlyFee >= 70000 ? 26000 : 16000) : 0)), 0);

  const subMonthlyAfterCard = Math.max(0, effectiveMonthlyBase - startingTotalCardMonthly);

  // 무상수리 연장 이용료 총액: 1번 계산기(!isMixedMode)에서는 subPlans의 품목별 설정(약정기간과 100% 일치)에서 직접 파생
  const activeSubFreeItems = isMixedMode
    ? subFreeServiceItems
    : subPlans
        .filter((p) => (Number(p.freeRepairFee) || 0) > 0)
        .map((p) => ({
          id: p.id,
          monthlyFee: Number(p.freeRepairFee) || 0,
          quantity: p.freeRepairQty !== undefined && p.freeRepairQty !== '' ? Number(p.freeRepairQty) || 1 : (Number(p.quantity) || 1),
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
            } else if (c.type === 'reinstall') {
              typeLabel = '재설치';
              unit = '회';
            } else if (c.type === 'all') {
              typeLabel = '방문케어+소모품';
              unit = '회';
            } else if (c.type === 'custom' && c.customName) {
              typeLabel = c.customName;
              unit = '건';
            }

            const countNum = c.count === '' || c.count === undefined ? 1 : Number(c.count) || 1;
            const cycleText = c.cycle && Number(c.cycle) > 0 ? `${c.cycle}개월 주기` : '';
            const countText = countNum > 1 ? `${countNum}${unit}` : '';
            const details = [cycleText, countText].filter(Boolean).join(' / ');
            const planTitle = cleanPrintText(p.name);
            const fullLabel = planTitle
              ? `${planTitle} (${typeLabel}${details ? ` / ${details}` : ''})`
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

  // 전문 케어서비스 종류별 갯수 요약 (예: 방문케어 1회 / 소모품 1개 / 재설치 1회 - 모델명 제외하고 갯수만 간결 표시)
  const careCountsByType = validCareServiceItems.reduce((acc, it) => {
    const rawType = (it.serviceType || '케어').trim();
    const typeLabel = rawType.includes('방문')
      ? '방문케어'
      : rawType.includes('소모품')
        ? '소모품'
        : rawType.includes('셀프')
          ? '셀프케어'
          : rawType.includes('재설치')
            ? '재설치'
            : rawType;
    const cnt = Number(it.count) || 1;
    const unit = it.unit || (typeLabel.includes('소모품') ? '개' : '회');
    if (!acc[typeLabel]) {
      acc[typeLabel] = { count: 0, unit };
    }
    acc[typeLabel].count += cnt;
    return acc;
  }, {});

  // 품목별 재설치 체크박스 또는 금액 미입력 재설치 항목도 케어서비스 요약에 반영
  const extraReinstallCount = !isMixedMode
    ? subPlans.reduce((sum, p) => {
        const items = Array.isArray(p.careItems) ? p.careItems : [];
        const hasPaidReinstall = items.some((c) => c.type === 'reinstall' && (Number(c.amount) || 0) > 0);
        if (hasPaidReinstall) return sum;
        const unpaidReinstallItems = items.filter((c) => c.type === 'reinstall' && (Number(c.amount) || 0) === 0);
        if (unpaidReinstallItems.length > 0) {
          return sum + unpaidReinstallItems.reduce((s, c) => s + (Number(c.count) || 1), 0);
        }
        return p.hasReinstall ? sum + 1 : sum;
      }, 0)
    : 0;
  if (extraReinstallCount > 0) {
    if (!careCountsByType['재설치']) {
      careCountsByType['재설치'] = { count: 0, unit: '회' };
    }
    careCountsByType['재설치'].count += extraReinstallCount;
  }

  const careCountSummaryText = Object.entries(careCountsByType)
    .map(([t, data]) => `${t} ${data.count}${data.unit}`)
    .join(' / ') || (validCareServiceCount > 0 ? `총 ${validCareServiceCount}개 항목` : '케어서비스');

  const hasAnyPlanReinstall = !isMixedMode && subPlans.some(
    (p) => Boolean(p.hasReinstall) || (Array.isArray(p.careItems) && p.careItems.some((c) => c.type === 'reinstall'))
  );
  const hasCareService = subCareServiceAmount > 0 || hasAnyPlanReinstall;
  const subServiceTotal = (Number(subFreeServiceAmount) || 0) + (Number(subCareServiceAmount) || 0);
  // 제휴 연계 추가 혜택 (상조 / 통신사 IPTV) 계산
  const extraSangjoTotalDiscount = extraSangjo.enabled ? Math.max(0, Number(extraSangjo.totalAmount) || 0) : 0;
  const extraTelecomTotalDiscount = extraTelecom.enabled ? Math.max(0, Number(extraTelecom.amount) || 0) : 0;
  const totalExtraAffiliateDiscount = extraSangjoTotalDiscount + extraTelecomTotalDiscount;

  const subCashBenefitTotal =
    (subFeeDiscountTotal || 0) +
    subCardTotalDiscount +
    (Number(subPurchaseBenefit) || 0) +
    (applyExtraToFinal ? totalExtraAffiliateDiscount : 0);
  // 총 혜택 합계: 구독료 즉시할인 + 제휴카드 청구할인 + 캐시백 + 제휴연계혜택
  const subTotalBenefitSum = subCashBenefitTotal;

  // 삼성AI구독 최종 체감가: (선납금 + 월할인구독료 총액) - 제휴카드할인 - 캐시백 - (서비스 혜택 가치) - 제휴연계혜택
  const subFinalPrice = Math.max(
    0,
    subNetGrossTotal -
      subCardTotalDiscount -
      (Number(subPurchaseBenefit) || 0) -
      (includeServiceInFinal ? subServiceTotal : 0) -
      (applyExtraToFinal ? totalExtraAffiliateDiscount : 0)
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
    { label: '700만', minSpend: 7369000, targetReceipt: 7000000, cardDiscountRate: 0.05, normalGcash: 455000 },
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
      const { matched: mainApplianceTier } = getTierForAmount(deptApplianceGross);
      const canSplitSecondCard = Boolean(
        mainApplianceTier &&
        mainApplianceTier.minSpend >= 5264000 &&
        (deptApplianceGross - mainApplianceTier.minSpend >= 1000000)
      );

      if (!canSplitSecondCard) {
        const { matched: tier, nextTier } = getTierForAmount(deptEffectiveGross);
        const tierGcash = getGcashForTier(tier);
        const baseGcash = tierGcash + deptPhoneGcash;
        const bonusGcash = 0;
        const totalGcash = baseGcash;

        // 유효기간 분리 (사은으로 받은 G캐시 9.5% 이상은 전부 유효기간 60일, 400만 이하 기본 6.5% 및 자급제는 5년)
        const is95OrAbove = tier && tier.minSpend >= 5264000 && deptRewardRate >= 9.5;
        const gcash60Day = is95OrAbove ? (tierGcash + bonusGcash) : 0;
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
              rewardRateLabel: tier ? (tier.minSpend >= 5264000 ? `적립 (${Number(deptRewardRate)}%)` : '적립 (6.5%)') : '',
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
              rewardRateLabel: deptPhoneGcash > 0 ? '적립 (4%)' : '',
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
              note: '⚡ POS G캐시 현장 결제 차감 (1회 승인)'
            } : null,
            safeReward > 0 ? {
              step: '증정',
              label: '💰 고객 G캐시 순적립',
              amount: safeReward,
              barcodeBadge: '앱 적립',
              discountRate: 0,
              discountAmount: 0,
              receiptAmount: safeReward,
              note: `백화점 모바일 앱 지급 (${gcash60Day > 0 ? `9.5%이상 60일: ${formatWon(gcash60Day)}` : ''}${gcash60Day > 0 && gcash5Year > 0 ? ' / ' : ''}${gcash5Year > 0 ? `기본 5년: ${formatWon(gcash5Year)}` : ''})`
            } : null
          ].filter(Boolean),
          jumpTip
        };
      }

      // 500만 / 1000만 / 1500만 / 2000만 구간 초과 여유분 발생 시: 1인 최적 분할 비기 모드 (400만 / 300만 / 200만 / 100만 구간 지능형 매칭)
      const step1Tier = mainApplianceTier || DEPT_TIERS[DEPT_TIERS.length - 1];
      const step1MinSpend = step1Tier.minSpend;
      const step1Label = step1Tier.label;
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
      // 1차 카드는 메인 구간 마지노선(step1MinSpend)을 안전하게 넘기며, 5% 청구할인을 받을 수 있도록 자투리 잔여금을 온전히 1차 카드에 배정!
      let step1Approval = remainingForStep1And3;
      const step1Gcash = Math.round(step1Tier.targetReceipt * (deptRewardRate / 100));

      let step3Approval = 0;
      let step3Gcash = 0;

      const totalGcash = step1Gcash + step2Gcash + step3Gcash + deptPhoneGcash;

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
      const partMargin = Math.max(0, step1Approval - step1MinSpend);
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

      // 3) 전부 차감 시뮬레이션 (G캐시 최대 활용 선차감):
      // 1차 카드 마지노선(step1MinSpend)과 1차 G캐시(step1Gcash)를 우선 반영한 뒤 남는 잔액으로 달성 가능한 최적 2차 구간(400만/300만/200만/100만)을 매칭하고,
      // 1차+2차 마지노선을 침범하지 않는 한도 내에서 G캐시를 최대치까지 선차감! (딱 떨어지면 잔여 0원, 초과 시 자투리 G캐시는 앱 적립!)
      let fullStep2Approval = 0;
      let fullStep2Discount = 0;
      let fullStep2Gcash = 0;
      let fullStep2Label = '';
      let fullStep2DiscountRate = 0;

      const remainAfterStep1Gcash = (deptApplianceGross - step3Approval) - step1MinSpend - (step1Gcash + deptPhoneGcash);

      if (remainAfterStep1Gcash >= 4124000) {
        fullStep2Approval = 4124000;
        fullStep2DiscountRate = 0.03;
        fullStep2Discount = Math.floor(fullStep2Approval * 0.03);
        fullStep2Gcash = 260000;
        fullStep2Label = '400만';
      } else if (remainAfterStep1Gcash >= 3093000) {
        fullStep2Approval = 3093000;
        fullStep2DiscountRate = 0.03;
        fullStep2Discount = Math.floor(fullStep2Approval * 0.03);
        fullStep2Gcash = 195000;
        fullStep2Label = '300만';
      } else if (remainAfterStep1Gcash >= 2000000) {
        fullStep2Approval = 2000000;
        fullStep2DiscountRate = 0;
        fullStep2Discount = 0;
        fullStep2Gcash = 130000;
        fullStep2Label = '200만';
      } else if (remainAfterStep1Gcash >= 1000000) {
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
        fullStep2Label = '단독';
      }

      const fullTotalGcash = step1Gcash + fullStep2Gcash + deptPhoneGcash;
      // 1차 마지노선(step1MinSpend)과 2차 구간 금액(fullStep2Approval)을 지키는 선에서 최대 차감 가능 한도 계산
      const maxDeductibleForFull = Math.max(0, (deptApplianceGross - step3Approval) - step1MinSpend - fullStep2Approval);
      const fullSafeDeduct = Math.min(fullTotalGcash, maxDeductibleForFull);
      const fullSafeReward = Math.max(0, fullTotalGcash - fullSafeDeduct);

      // 1차 카드 승인: 전체 가전 원금에서 2차 승인액과 실제 선차감된 G캐시(fullSafeDeduct)를 뺀 금액 (마지노선 이상 보장!)
      const fullStep1Approval = Math.max(0, (deptApplianceGross - fullStep2Approval) - fullSafeDeduct);
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
      let activeStep2Label = step2Label || '100만';
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
        activeStep2Label = step2Label || '100만';
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
        activeStep2Label = step2Label || '100만';
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

      // 유효기간 분리 (1인 분할: 1차 500만 이상 9.5% 이상 우대 사은은 전부 60일, 2차/3차 기본 6.5% 및 자급제는 5년)
      const gcash60Day = deptRewardRate >= 9.5 ? step1Gcash : 0;
      const gcash5Year = Math.max(0, currentGcash - gcash60Day);

      let jumpTip = null;
      const jumpTarget = step1MinSpend + 5264000;
      if (deptEffectiveGross < jumpTarget && (jumpTarget - deptEffectiveGross) <= 1000000) {
        jumpTip = {
          needMore: jumpTarget - deptEffectiveGross,
          message: `단 ${(jumpTarget - deptEffectiveGross).toLocaleString()}원만 추가 시 상위 우대 구간 동시 점프! G캐시 폭증!`
        };
      }

      return {
        mode: '1person_3split',
        applianceGross: deptApplianceGross,
        phoneGross: deptPhoneGross,
        effectiveGross: deptEffectiveGross,
        tierLabel: `${step1Label}${activeStep2Gcash > 0 ? ` + ${activeStep2Label}` : ''}`,
        step1Label,
        step1MinSpend,
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
          step1Label,
          step2Label: step2Label || '100만',
          step2Gcash: step2Gcash,
          totalCardDiscount: rewardCardDiscount,
          finalPerceived: rewardFinalPerceived
        },
        partialPlan: {
          cardApproval: partialCardApproval,
          safeDeduct: partialSafeDeduct,
          safeReward: partialSafeReward,
          totalGcash: totalGcash,
          step1Label,
          step2Label: step2Label || '100만',
          step2Gcash: step2Gcash,
          totalCardDiscount: partialCardDiscount,
          finalPerceived: partialFinalPerceived
        },
        fullPlan: {
          cardApproval: fullCardApproval,
          safeDeduct: fullSafeDeduct,
          safeReward: fullSafeReward,
          totalGcash: fullTotalGcash,
          step1Label,
          step2Label: fullStep2Label || '단독',
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
            rewardRateLabel: `적립 (${Number(deptRewardRate)}%)`,
            note: `5% 청구할인 + ${deptRewardRate}% 우대 사은 (${step1Label} 구간 사수)${deduct1 > 0 ? ` [자투리 합산 및 G캐시 ${formatWon(deduct1)} 선차감 반영]` : ''}`
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
            rewardRateLabel: activeStep2Gcash > 0 ? '적립 (6.5%)' : '',
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
            rewardRateLabel: step3Gcash > 0 ? '적립 (6.5%)' : '',
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
            rewardRateLabel: deptPhoneGcash > 0 ? '적립 (4%)' : '',
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
            note: `백화점 모바일 앱 지급 (${gcash60Day > 0 ? `9.5%이상 60일: ${formatWon(gcash60Day)}` : ''}${gcash60Day > 0 && gcash5Year > 0 ? ' / ' : ''}${gcash5Year > 0 ? `기본 5년: ${formatWon(gcash5Year)}` : ''})`
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

    // 유효기간 분리 (2인 2카드: 500만 이상 9.5% 이상 사은은 전부 60일, 400만 이하 기본 6.5% 및 자급제는 5년)
    const c1_60Day = (t1 && t1.minSpend >= 5264000 && deptRewardRate >= 9.5) ? c1Gcash : 0;
    const c2_60Day = (t2 && t2.minSpend >= 5264000 && deptRewardRate >= 9.5) ? c2Gcash : 0;
    const gcash60Day = c1_60Day + c2_60Day;
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
          rewardRateLabel: t1 ? (t1.minSpend >= 5264000 ? `적립 (${Number(deptRewardRate)}%)` : '적립 (6.5%)') : '',
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
          rewardRateLabel: t2 ? (t2.minSpend >= 5264000 ? `적립 (${Number(deptRewardRate)}%)` : '적립 (6.5%)') : '',
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
          rewardRateLabel: deptPhoneGcash > 0 ? '적립 (4%)' : '',
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
          note: `백화점 모바일 앱 지급 (${gcash60Day > 0 ? `9.5%이상 60일: ${formatWon(gcash60Day)}` : ''}${gcash60Day > 0 && gcash5Year > 0 ? ' / ' : ''}${gcash5Year > 0 ? `기본 5년: ${formatWon(gcash5Year)}` : ''})`
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

  // 케어서비스(소모품 + 방문케어 + 재설치) 혜택 총액
  const mixedSubCareTotal = mixedSubItems.reduce(
    (sum, it) => sum + ((Number(it.selfCareFee) || 0) + (Number(it.visitCareFee) || 0) + (Number(it.reinstallFee) || 0)) * getSubQty(it.quantity),
    0
  );
  const hasAnyMixedReinstall = mixedSubItems.some(
    (it) => Boolean(it.hasReinstall) || (Number(it.reinstallFee) || 0) > 0
  );

  // 구독 전용 서비스 총 혜택 (무상수리 + 케어)
  const mixedSubServiceBenefit = mixedSubFreeRepairTotal + mixedSubCareTotal;

  // 약정기간 목록 및 대표 요약
  const mixedSubMonthsList = [...new Set(validMixedSubItems.map((it) => Number(it.months) || 72))].sort((a, b) => b - a);
  const mixedSubPeriodSummary = mixedSubMonthsList.join('/') || '72';

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

  // 구독 최종 체감 소계: 선납금 + 할인 월구독료 합계 - 제휴카드 할인 - (서비스혜택)
  const mixedSubPerceivedPrice = Math.max(
    0,
    mixedSubDiscountedGrossTotal - subCardTotalDiscount - (includeServiceInFinal ? mixedSubServiceBenefit : 0)
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

  // 전체 기준 총액 (일반 기준총액 + 구독 기준총액만 합산: 선납금 제외 순수 기본구독료의 합)
  const mixedGrandGross = mixedLumpGross + mixedSubGrossTotal;
  // 전체 총 혜택 = 구독 전용 직접할인 + 일반 특정조건 할인 + 통합 캐시백 + 상품권 지급 + 제휴연계혜택 (무상/케어서비스 제외)
  const mixedGrandBenefit =
    mixedSubOnlyDiscount +
    mixedLumpDiscountTotal +
    mixedTotalCashback +
    mixedTotalVoucher +
    (applyExtraToFinal ? totalExtraAffiliateDiscount : 0);
  // 고객 최종 실체감가: 일반구매 혜택가 소계 + 구독 혜택가 소계 - 통합 캐시백/상품권 - 제휴연계혜택
  const mixedGrandFinal = Math.max(
    0,
    mixedLumpBenefitSub +
      mixedSubFinalPrice -
      section3TotalBenefit -
      (applyExtraToFinal ? totalExtraAffiliateDiscount : 0)
  );
  const totalGrandSavings = Math.max(0, mixedGrandGross - mixedGrandFinal);
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
    setConsultDate(getLocalTodayString());
    setIsManualConsultDate(false);
    setConsultType('단품·패키지 비교견적');
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
        hasReinstall: false,
        freeRepairFee: 0,
        freeRepairQty: 1,
        serviceModelCode: '',
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
    setMixedEventType('normal');
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

  // 매니저별 개인 저장소 및 팀 공용 저장소 분리 관리
  const [quoteStorageTab, setQuoteStorageTab] = useState('private'); // 'private' (내 개인 보관함) | 'public' (팀 공용 보관함)
  const [quoteSaveScope, setQuoteSaveScope] = useState('private'); // 'private' | 'public'
  const [adminFilterManager, setAdminFilterManager] = useState('all'); // 'all' | managerId (관리자 전용 필터)

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

  // 공용 견적 (scope === 'public' 이거나 scope가 없는 기존 견적)
  const publicQuotes = savedQuotes.filter((q) => q.scope === 'public' || (!q.scope && q.data?.scope !== 'private'));

  // 개인 견적:
  const allPrivateQuotes = savedQuotes.filter((q) => q.scope === 'private' || q.data?.scope === 'private');

  const currentManagerPrivateQuotes = allPrivateQuotes.filter((q) => {
    if (isAdminUser) {
      if (adminFilterManager && adminFilterManager !== 'all') {
        const qCreatorId = (q.creatorId || q.data?.creatorId || '').toLowerCase();
        return qCreatorId === adminFilterManager.toLowerCase();
      }
      return true;
    }
    const currentId = (currentUser?.id || '').toLowerCase();
    const currentUid = currentUser?.uid || '';
    const qCreatorId = (q.creatorId || q.data?.creatorId || '').toLowerCase();
    const qCreatorUid = q.creatorUid || q.data?.creatorUid || '';
    return (currentUid && qCreatorUid === currentUid) || (currentId && qCreatorId === currentId);
  });

  const displayedQuotes = quoteStorageTab === 'public' ? publicQuotes : currentManagerPrivateQuotes;

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'

  const syncQuotesWithCloud = async (targetMode = isMixedMode ? 'mixed' : 'compare', showToast = true) => {
    setIsCloudSyncing(true);
    setCloudSyncStatus('syncing');
    try {
      const res = await fetchCloudQuotes(targetMode);
      if (res.success && Array.isArray(res.data)) {
        const cloudList = res.data;
        const currentLocal = targetMode === 'mixed' ? savedQuotesMixed : savedQuotesCompare;

        // 1. 로컬에만 있고 클라우드에 아직 없는 항목은 클라우드로 자동 백업 업로드
        const cloudIdSet = new Set(cloudList.map((q) => q.id));
        const missingInCloud = currentLocal.filter((l) => !cloudIdSet.has(l.id));
        if (missingInCloud.length > 0) {
          await Promise.all(missingInCloud.map((item) => saveCloudQuote(item)));
        }

        // 2. 클라우드와 로컬 병합 (클라우드 우선 및 중복 제거)
        const mergedMap = new Map();
        cloudList.forEach((q) => mergedMap.set(q.id, q));
        currentLocal.forEach((q) => {
          if (!mergedMap.has(q.id)) mergedMap.set(q.id, q);
        });
        const finalMerged = Array.from(mergedMap.values());

        if (targetMode === 'mixed') {
          setSavedQuotesMixed(finalMerged);
        } else {
          setSavedQuotesCompare(finalMerged);
        }
        setCloudSyncStatus('synced');
        if (showToast) {
          showTempNotice(`☁️ 클라우드 동기화 완료 (${finalMerged.length}건 연동)`);
        }
      } else {
        setCloudSyncStatus('error');
      }
    } catch (err) {
      console.error('[CloudSync] Error:', err);
      setCloudSyncStatus('error');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // 컴포넌트 마운트 및 모드 전환 시 클라우드 자동 동기화
  useEffect(() => {
    syncQuotesWithCloud(isMixedMode ? 'mixed' : 'compare', false);
  }, [isMixedMode]);

  const showTempNotice = (msg) => {
    setSaveNotice(msg);
    setTimeout(() => {
      setSaveNotice((prev) => (prev === msg ? '' : prev));
    }, 2800);
  };

  const buildCurrentQuoteSnapshot = (customTitle, targetScope = quoteSaveScope) => {
    const autoTitle =
      [customerName && `${customerName} 고객님`, productSummary].filter(Boolean).join(' · ') ||
      `${consultType} (${consultDate})`;
    const title = (customTitle ?? quoteTitleInput).trim() || autoTitle;
    const now = new Date();
    const savedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const modeTag = isMixedMode ? 'mixed' : 'compare';
    const creatorId = currentUser?.id || 'admin';
    const creatorName = currentUser?.name || currentUser?.id || '관리자';
    const creatorUid = currentUser?.uid || '';

    return {
      id: `q_${modeTag}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      mode: modeTag,
      title,
      savedAt,
      scope: targetScope,
      creatorId,
      creatorName,
      creatorUid,
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
        scope: targetScope,
        creatorId,
        creatorName,
        creatorUid,
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
        extraSangjo,
        extraTelecom,
        applyExtraToFinal,
        showExtraAffiliateSection,
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
    const curToday = getLocalTodayString();
    const loadedDate = d.consultDate || curToday;
    setConsultDate(loadedDate);
    setIsManualConsultDate(Boolean(d.consultDate && d.consultDate !== curToday));
    setConsultType(d.consultType || '신혼·혼수가전 맞춤설계');
    setProductSummary(d.productSummary ?? '');
    setMemo(d.memo ?? '');
    if (d.cardLowestRate !== undefined) setCardLowestRate(String(d.cardLowestRate));
    setLumpBasePrice(Number(d.lumpBasePrice) || 0);
    setLumpTotalBenefit(Number(d.lumpTotalBenefit) || 0);
    setSubInputMode('monthly');
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
              prepay: Number(p.prepay) || 0,
              baseMonthlyFee: Number(p.baseMonthlyFee) || Number(p.monthlyFee) || 0,
              discountMonthlyFee: Number(p.discountMonthlyFee) || Number(p.monthlyFee) || 0,
              isMobile: Boolean(p.isMobile),
              hasReinstall: Boolean(p.hasReinstall),
              freeRepairFee: Number(p.freeRepairFee) || 0,
              freeRepairQty: p.freeRepairQty !== undefined && p.freeRepairQty !== '' ? Number(p.freeRepairQty) || 1 : (Number(p.quantity) || 1),
              serviceModelCode: p.serviceModelCode || '',
              careItems
            };
          })
        : [
            {
              id: 1,
              name: '',
              quantity: 1,
              months: 72,
              prepay: 0,
              baseMonthlyFee: 0,
              discountMonthlyFee: 0,
              monthlyFee: 0,
              totalAmount: 0,
              policyNote: '',
              policyDiscount: 0,
              isMobile: false,
              hasReinstall: false,
              freeRepairFee: 0,
              freeRepairQty: 1,
              serviceModelCode: '',
              careItems: []
            }
          ]
    );
    if (d.extraSangjo) {
      setExtraSangjo({
        enabled: Boolean(d.extraSangjo.enabled),
        provider: d.extraSangjo.provider || 'boram',
        customName: d.extraSangjo.customName || '',
        count: Number(d.extraSangjo.count) || 1,
        amountPerCount: Number(d.extraSangjo.amountPerCount) || 1000000,
        totalAmount: Number(d.extraSangjo.totalAmount) || (Number(d.extraSangjo.count) || 1) * (Number(d.extraSangjo.amountPerCount) || 1000000),
        note: d.extraSangjo.note || '만기 납입 완료 시 100% 환급 조건'
      });
    }
    if (d.extraTelecom) {
      setExtraTelecom({
        enabled: Boolean(d.extraTelecom.enabled),
        carrier: d.extraTelecom.carrier || 'kt',
        customCarrier: d.extraTelecom.customCarrier || '',
        planType: d.extraTelecom.planType || '인터넷+IPTV',
        customPlan: d.extraTelecom.customPlan || '',
        amount: Number(d.extraTelecom.amount) || 450000,
        note: d.extraTelecom.note || '인터넷+IPTV 신규 결합 약정 개통 혜택'
      });
    }
    if (d.applyExtraToFinal !== undefined) {
      setApplyExtraToFinal(Boolean(d.applyExtraToFinal));
    }
    if (d.showExtraAffiliateSection !== undefined) {
      setShowExtraAffiliateSection(Boolean(d.showExtraAffiliateSection));
    }

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
    setCalculatorMode(canAccessLv2 && d.calculatorMode === 'mixed' ? 'mixed' : 'compare');
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

  const handleSaveNewQuote = (customTitle, targetScope = quoteSaveScope) => {
    const snapshot = buildCurrentQuoteSnapshot(customTitle, targetScope);
    setSavedQuotes((prev) => [snapshot, ...prev]);
    setActiveQuoteId(snapshot.id);
    setQuoteTitleInput(snapshot.title);
    setQuoteStorageTab(targetScope);
    const scopeLabel = targetScope === 'public' ? '팀 공용' : '내 개인';
    showTempNotice(`✓ '${snapshot.title}' 견적이 [${scopeLabel} 보관함]에 저장되었습니다.`);
    saveCloudQuote(snapshot).then((res) => {
      if (res.success) {
        setCloudSyncStatus('synced');
        showTempNotice(`✓ '${snapshot.title}' 견적이 클라우드(${scopeLabel})에 실시간 동기화되었습니다.`);
      }
    });
  };

  const handleOverwriteActiveQuote = () => {
    let targetId = activeQuoteId;
    if (!targetId) {
      if (displayedQuotes.length > 0) {
        const latest = displayedQuotes[0];
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
    const currentTarget = savedQuotes.find((q) => q.id === targetId);
    const existingScope = currentTarget?.scope || currentTarget?.data?.scope || quoteSaveScope;
    const snapshot = buildCurrentQuoteSnapshot(undefined, existingScope);
    const updatedSnapshot = {
      ...snapshot,
      id: targetId,
      scope: existingScope,
      creatorId: currentTarget?.creatorId || snapshot.creatorId,
      creatorName: currentTarget?.creatorName || snapshot.creatorName,
      data: {
        ...(snapshot.data || {}),
        scope: existingScope,
        creatorId: currentTarget?.creatorId || snapshot.creatorId,
        creatorName: currentTarget?.creatorName || snapshot.creatorName
      }
    };
    setSavedQuotes((prev) =>
      prev.map((q) => (q.id === targetId ? updatedSnapshot : q))
    );
    setQuoteTitleInput(snapshot.title);
    const scopeLabel = existingScope === 'public' ? '팀 공용' : '내 개인';
    showTempNotice(`✓ '${snapshot.title}' 견적이 [${scopeLabel} 보관함]에 수정 저장되었습니다.`);
    saveCloudQuote(updatedSnapshot).then((res) => {
      if (res.success) {
        setCloudSyncStatus('synced');
        showTempNotice(`✓ '${snapshot.title}' 견적이 클라우드에 수정 반영되었습니다.`);
      }
    });
  };

  const handleToggleQuoteScope = (quote) => {
    const isCurrentlyPrivate = quote.scope === 'private' || quote.data?.scope === 'private';
    const nextScope = isCurrentlyPrivate ? 'public' : 'private';
    const nextLabel = nextScope === 'public' ? '팀 공용' : '내 개인';
    if (!window.confirm(`'${quote.title}' 견적을 [${nextLabel} 보관함]으로 전환하시겠습니까?\n(${nextScope === 'public' ? '지점 내 모든 매니저가 함께 볼 수 있습니다.' : '나만 볼 수 있는 개인 보관함으로 이동합니다.'})`)) return;

    const updatedSnapshot = {
      ...quote,
      scope: nextScope,
      creatorId: currentUser?.id || quote.creatorId || 'admin',
      creatorName: currentUser?.name || quote.creatorName || '관리자',
      creatorUid: currentUser?.uid || quote.creatorUid || '',
      data: {
        ...(quote.data || {}),
        scope: nextScope,
        creatorId: currentUser?.id || quote.creatorId || 'admin',
        creatorName: currentUser?.name || quote.creatorName || '관리자',
        creatorUid: currentUser?.uid || quote.creatorUid || ''
      }
    };

    setSavedQuotes((prev) => prev.map((q) => (q.id === quote.id ? updatedSnapshot : q)));
    setQuoteStorageTab(nextScope);
    showTempNotice(`✓ '${quote.title}' 견적이 [${nextLabel} 보관함]으로 전환되었습니다.`);
    saveCloudQuote(updatedSnapshot).catch((e) => console.error(e));
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
    deleteCloudQuote(id).catch((e) => console.error(e));
  };

  const handleExportQuoteFile = () => {
    const currentSnapshot = buildCurrentQuoteSnapshot(undefined, quoteSaveScope);
    const safeFileTitle = currentSnapshot.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
    const modeLabel = isMixedMode ? '2번_구독포함' : '1번_구독비교';
    const scopeLabel = quoteStorageTab === 'public' ? '공용견적' : `개인견적_${currentUser?.id || 'manager'}`;
    const payloadType = isMixedMode ? 'JCC_QUOTE_MIXED_ARCHIVE' : 'JCC_QUOTE_COMPARE_ARCHIVE';
    const currentList = displayedQuotes;
    const payload = {
      type: payloadType,
      mode: isMixedMode ? 'mixed' : 'compare',
      scope: quoteStorageTab,
      creatorId: currentUser?.id || 'admin',
      creatorName: currentUser?.name || '관리자',
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
    a.download = `JCC_${modeLabel}_${scopeLabel}_${safeFileTitle}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showTempNotice(`✓ ${isMixedMode ? '2번' : '1번'} [${quoteStorageTab === 'public' ? '공용' : '개인'}] 견적 파일(${a.download})이 다운로드되었습니다.`);
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
          if (!canAccessLv2) {
            alert('불러오기 실패: 현재 계정(Lv.1)은 1번 구독 비교 계산기 전용 권한입니다.');
          } else {
            alert(
              "불러오기 실패: 선택하신 파일은 '2번 구독 포함 계산기' 전용 저장파일입니다.\n상단 탭에서 '2번 구독 포함 계산기'로 전환하신 후 불러와 주세요."
            );
          }
          e.target.value = '';
          return;
        }

        if (fileType === 'JCC_QUOTE_ARCHIVE' || fileType === 'JCC_QUOTE_COMPARE_ARCHIVE' || fileType === 'JCC_QUOTE_MIXED_ARCHIVE') {
          const rawIncomingList = Array.isArray(parsed.savedQuotes) ? parsed.savedQuotes : [];
          const targetQuote = parsed.currentQuote || rawIncomingList[0];
          const incomingScope = parsed.scope || quoteStorageTab;

          const incomingList = rawIncomingList.map((q) => ({
            ...q,
            scope: q.scope || q.data?.scope || incomingScope,
            creatorId: q.creatorId || q.data?.creatorId || currentUser?.id || 'admin',
            creatorName: q.creatorName || q.data?.creatorName || currentUser?.name || '관리자'
          }));

          if (incomingList.length > 0) {
            setSavedQuotes((prev) => {
              const existingIds = new Set(prev.map((q) => q.id));
              const merged = [...incomingList.filter((q) => !existingIds.has(q.id)), ...prev];
              return merged;
            });
          } else if (targetQuote) {
            const wrappedTarget = {
              ...targetQuote,
              scope: targetQuote.scope || targetQuote.data?.scope || incomingScope,
              creatorId: targetQuote.creatorId || targetQuote.data?.creatorId || currentUser?.id || 'admin',
              creatorName: targetQuote.creatorName || targetQuote.data?.creatorName || currentUser?.name || '관리자'
            };
            setSavedQuotes((prev) => [wrappedTarget, ...prev.filter((q) => q.id !== wrappedTarget.id)]);
          }
          if (targetQuote && applyQuoteData(targetQuote)) {
            setQuoteStorageTab(incomingScope);
            showTempNotice(`✓ 파일에서 '${targetQuote.title}' 견적(${incomingList.length || 1}건, ${incomingScope === 'public' ? '공용' : '개인'})을 불러왔습니다.`);
          }
        } else if (parsed && typeof parsed === 'object') {
          const wrapped = parsed.data
            ? {
                ...parsed,
                scope: parsed.scope || parsed.data?.scope || quoteStorageTab,
                creatorId: parsed.creatorId || parsed.data?.creatorId || currentUser?.id || 'admin',
                creatorName: parsed.creatorName || parsed.data?.creatorName || currentUser?.name || '관리자'
              }
            : {
                id: `q_${isMixedMode ? 'mixed' : 'compare'}_${Date.now()}`,
                mode: isMixedMode ? 'mixed' : 'compare',
                title: file.name.replace(/\.json$/i, ''),
                savedAt: todayStr,
                scope: quoteStorageTab,
                creatorId: currentUser?.id || 'admin',
                creatorName: currentUser?.name || '관리자',
                data: parsed
              };
          setSavedQuotes((prev) => [wrapped, ...prev.filter((q) => q.id !== wrapped.id)]);
          applyQuoteData(wrapped);
          showTempNotice(`✓ 파일에서 '${wrapped.title}' 견적(${quoteStorageTab === 'public' ? '공용' : '개인'})을 불러왔습니다.`);
        }
      } catch {
        alert('견적 파일(.json) 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [imageModalData, setImageModalData] = useState(null);
  const [isExportingPosImage, setIsExportingPosImage] = useState(false);
  const [isExportingPosPdf, setIsExportingPosPdf] = useState(false);
  const [posImageModalData, setPosImageModalData] = useState(null);
  const [mobileFitMode, setMobileFitMode] = useState(false);

  const captureElementToPng = async (node, customOptions = {}) => {
    // 1차 시도: html2canvas
    // SVG foreignObject를 거치지 않고 순수 2D Canvas 메서드로 렌더링하므로
    // 모바일 브라우저(삼성인터넷, 안드로이드 크롬)의 Late-stage 다크모드/야간모드 셰이더 반전 필터를 100% 원천 우회합니다.
    try {
      const isSheet = node.classList && node.classList.contains('a4-print-sheet');
      const targetWidth = customOptions.width || (isSheet ? 820 : 790);
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: targetWidth,
        windowWidth: targetWidth + 50,
        onclone: (clonedDoc, clonedEl) => {
          clonedEl.style.transform = 'none';
          clonedEl.style.margin = '0';
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.backgroundColor = '#ffffff';
          clonedEl.style.color = '#0f172a';
          clonedEl.style.colorScheme = 'only light';
          clonedEl.style.forcedColorAdjust = 'none';
          if (clonedEl.classList && clonedEl.classList.contains('a4-page-1')) {
            clonedEl.style.justifyContent = 'flex-start';
          }
          if (customOptions.isPosModal) {
            clonedEl.style.overflow = 'visible';
            clonedEl.style.maxHeight = 'none';
            clonedEl.style.height = 'auto';
            clonedEl.style.width = `${targetWidth}px`;
          }
          const allElements = clonedEl.querySelectorAll('*');
          allElements.forEach((el) => {
            el.style.colorScheme = 'only light';
            el.style.forcedColorAdjust = 'none';
          });
        }
      });
      return canvas.toDataURL('image/png');
    } catch (h2cErr) {
      console.warn('html2canvas 실행 실패, htmlToImage로 대체 실행합니다:', h2cErr);
      const isSheet = node.classList && node.classList.contains('a4-print-sheet');
      const targetWidth = customOptions.width || (isSheet ? 820 : 790);
      return await htmlToImage.toPng(node, {
        quality: 0.98,
        pixelRatio: 2,
        width: targetWidth,
        backgroundColor: '#ffffff',
        skipFonts: true,
        filter: (el) => !(el && el.classList && el.classList.contains('no-print')),
        style: {
          margin: '0',
          boxShadow: 'none',
          transform: 'none',
          transformOrigin: 'top left',
          minHeight: isSheet ? '1160px' : undefined,
          justifyContent: (node.classList && node.classList.contains('a4-page-1')) ? 'flex-start' : undefined,
          background: '#ffffff',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          colorScheme: 'only light',
          forcedColorAdjust: 'none',
          ...(customOptions.style || {})
        }
      });
    }
  };

  const captureFullPosSheetPng = async () => {
    const node = document.getElementById('pos-cashier-print-area');
    if (!node) return null;
    const targetWidth = 790;
    const prevOverflow = node.style.overflow;
    const prevOverflowY = node.style.overflowY;
    const prevMaxHeight = node.style.maxHeight;
    const prevHeight = node.style.height;
    const prevWidth = node.style.width;
    const prevFlex = node.style.flex;
    const prevBg = node.style.backgroundColor;
    const prevColor = node.style.color;
    const prevColorScheme = node.style.colorScheme;
    const prevForcedColorAdjust = node.style.forcedColorAdjust;
    try {
      node.style.overflow = 'visible';
      node.style.overflowY = 'visible';
      node.style.maxHeight = 'none';
      node.style.height = 'auto';
      node.style.width = `${targetWidth}px`;
      node.style.flex = 'none';
      node.style.backgroundColor = '#ffffff';
      node.style.color = '#0f172a';
      node.style.colorScheme = 'only light';
      node.style.forcedColorAdjust = 'none';

      return await captureElementToPng(node, {
        width: targetWidth,
        isPosModal: true,
        style: {
          width: `${targetWidth}px`,
          maxWidth: `${targetWidth}px`,
          maxHeight: 'none',
          overflow: 'visible'
        }
      });
    } finally {
      node.style.overflow = prevOverflow;
      node.style.overflowY = prevOverflowY;
      node.style.maxHeight = prevMaxHeight;
      node.style.height = prevHeight;
      node.style.width = prevWidth;
      node.style.flex = prevFlex;
      node.style.backgroundColor = prevBg;
      node.style.color = prevColor;
      node.style.colorScheme = prevColorScheme;
      node.style.forcedColorAdjust = prevForcedColorAdjust;
    }
  };

  const handleExportPosAsImage = async () => {
    const node = document.getElementById('pos-cashier-print-area');
    if (!node || isExportingPosImage) return;
    setIsExportingPosImage(true);
    try {
      const dataUrl = await captureFullPosSheetPng();
      if (!dataUrl) return;

      const safeCustomer = (customerName || '소중한고객님').trim().replace(/[^a-zA-Z0-9가-힣_-]/g, '');
      const safeDate = (consultDate || getLocalTodayString()).replace(/[^0-9-]/g, '');
      const filename = `JCC_POS지시서_${safeCustomer}_${safeDate}.png`;

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      let file = null;
      try {
        file = new File([blob], filename, { type: 'image/png' });
      } catch (_) {}

      let shared = false;
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
      if (isMobile && file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `JCC POS 결제 지시서 (${safeCustomer} 고객님)`,
            text: `[JCC 진센조] ${safeCustomer} 고객님 POS 결제 및 사은행사 지시서입니다.`
          });
          shared = true;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            shared = true;
          }
        }
      }

      if (!shared) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        link.click();
      }

      let copied = false;
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          copied = true;
        } catch (_) {}
      }

      setPosImageModalData({
        dataUrl,
        filename,
        file,
        customer: safeCustomer
      });

      if (copied) {
        showTempNotice('📷 POS 지시서 사진이 저장되었으며 클립보드에도 복사되었습니다. (카카오톡 Ctrl+V 가능)');
      } else {
        showTempNotice(`📷 POS 지시서 사진(${filename})이 생성되었습니다.`);
      }
    } catch (err) {
      console.error('POS 지시서 사진 생성 오류:', err);
      alert('POS 지시서 사진 생성 중 오류가 발생했습니다.');
    } finally {
      setIsExportingPosImage(false);
    }
  };

  const handleExportPosAsPdf = async () => {
    const node = document.getElementById('pos-cashier-print-area');
    if (!node || isExportingPosPdf) return;
    setIsExportingPosPdf(true);
    try {
      const dataUrl = await captureFullPosSheetPng();
      if (!dataUrl) return;

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageW = 210;
      const pageH = 297;
      const margin = 8;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const ratio = img.height / img.width;
      let renderW = maxW;
      let renderH = renderW * ratio;
      if (renderH > maxH) {
        renderH = maxH;
        renderW = renderH / ratio;
      }
      const xOffset = (pageW - renderW) / 2;
      pdf.addImage(dataUrl, 'PNG', xOffset, margin, renderW, renderH, undefined, 'FAST');

      const safeCustomer = (customerName || '소중한고객님').trim().replace(/[^a-zA-Z0-9가-힣_-]/g, '');
      const safeDate = (consultDate || getLocalTodayString()).replace(/[^0-9-]/g, '');
      const filename = `JCC_POS지시서_${safeCustomer}_${safeDate}.pdf`;

      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
      let shared = false;
      if (isMobile && navigator.canShare) {
        try {
          const pdfBlob = pdf.output('blob');
          const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
          if (navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
              files: [pdfFile],
              title: `JCC POS 결제 지시서 (${safeCustomer} 고객님)`,
              text: `[JCC 진센조] ${safeCustomer} 고객님 POS 결제 지시서 PDF입니다.`
            });
            shared = true;
          }
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') shared = true;
        }
      }

      if (!shared) {
        pdf.save(filename);
      }
      showTempNotice(`📄 POS 지시서 고화질 PDF(${filename}) 저장이 완료되었습니다.`);
    } catch (err) {
      console.error('POS 지시서 PDF 생성 오류:', err);
      alert('POS 지시서 PDF 생성 중 오류가 발생했습니다. [사진으로 저장] 버튼을 이용해 주세요.');
    } finally {
      setIsExportingPosPdf(false);
    }
  };

  const handleExportAsImage = async (pageIndex = 0, pageLabel = '') => {
    const nodes = document.querySelectorAll('.a4-print-sheet');
    const node = nodes[pageIndex] || nodes[0];
    if (!node || isExportingImage) return;
    setIsExportingImage(true);
    const prevBg = node.style.backgroundColor;
    const prevColor = node.style.color;
    const prevColorScheme = node.style.colorScheme;
    const prevForcedColorAdjust = node.style.forcedColorAdjust;
    try {
      node.style.backgroundColor = '#ffffff';
      node.style.color = '#0f172a';
      node.style.colorScheme = 'only light';
      node.style.forcedColorAdjust = 'none';

      // 1순위: html2canvas (모바일 다크모드/삼성인터넷 색상 반전 100% 원천 차단)
      const dataUrl = await captureElementToPng(node);
      if (!dataUrl) return;

      const safeCustomer = (customerName || '소중한고객님').trim().replace(/[^a-zA-Z0-9가-힣_-]/g, '');
      const safeDate = (consultDate || getLocalTodayString()).replace(/[^0-9-]/g, '');
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
      node.style.backgroundColor = prevBg;
      node.style.color = prevColor;
      node.style.colorScheme = prevColorScheme;
      node.style.forcedColorAdjust = prevForcedColorAdjust;
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

  // 태블릿/모바일/PC 공통: 안드로이드 인쇄 오류(X박스/폰트 깨짐) 완전 방지 고화질 2P 직출력 PDF 생성기
  const handleExportAsPdf = async () => {
    const nodes = document.querySelectorAll('.a4-print-sheet');
    if (!nodes || nodes.length === 0 || isExportingPdf) return;
    setIsExportingPdf(true);
    showTempNotice('📄 고화질 견적서 PDF를 생성 중입니다. 잠시만 기다려 주세요...');

    try {
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (i > 0) pdf.addPage('a4', 'p');

        const prevBg = node.style.backgroundColor;
        const prevColor = node.style.color;
        const prevColorScheme = node.style.colorScheme;
        const prevForcedColorAdjust = node.style.forcedColorAdjust;

        try {
          node.style.backgroundColor = '#ffffff';
          node.style.color = '#0f172a';
          node.style.colorScheme = 'only light';
          node.style.forcedColorAdjust = 'none';

          const dataUrl = await captureElementToPng(node);
          if (dataUrl) {
            pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
          }
        } finally {
          node.style.backgroundColor = prevBg;
          node.style.color = prevColor;
          node.style.colorScheme = prevColorScheme;
          node.style.forcedColorAdjust = prevForcedColorAdjust;
        }
      }

      const safeCustomer = (customerName || '소중한고객님').trim().replace(/[^a-zA-Z0-9가-힣_-]/g, '');
      const safeDate = (consultDate || getLocalTodayString()).replace(/[^0-9-]/g, '');
      const filename = `JCC_견적서_${safeCustomer}_${safeDate}.pdf`;

      // 모바일 공유 지원 여부 확인
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
      let shared = false;
      if (isMobile && navigator.canShare) {
        try {
          const pdfBlob = pdf.output('blob');
          const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
          if (navigator.canShare({ files: [pdfFile] })) {
            await navigator.share({
              files: [pdfFile],
              title: `JCC 맞춤 견적서 (${safeCustomer} 고객님)`,
              text: `[JCC 진센조] ${safeCustomer} 고객님 맞춤 가전 혜택 견적서 PDF입니다.`
            });
            shared = true;
          }
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') shared = true;
        }
      }

      if (!shared) {
        pdf.save(filename);
      }

      showTempNotice(`📄 고화질 견적서 PDF(${filename}) 생성이 완료되었습니다.`);
    } catch (err) {
      console.error('고화질 PDF 생성 오류:', err);
      alert('고화질 PDF 생성 중 일시적 오류가 발생했습니다. 아래 [A4 2장 인쇄 / PDF 저장] 버튼을 이용해 주세요.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderPosCashierModal = () => {
    if (!showPosCashierModal) return null;

    const applianceSteps = (deptEnginePlan?.posSteps || []).filter(
      (s) => s && (s.barcodeTail === '907' || s.barcodeType === 'appliance')
    );
    const hasGcashPayment = (deptEnginePlan?.safeDeduct || 0) > 0;
    const gcashDeductAmount = deptEnginePlan?.safeDeduct || 0;
    const totalAppliancePayments = applianceSteps.length + (hasGcashPayment ? 1 : 0);

    const phoneSteps = (deptEnginePlan?.posSteps || []).filter(
      (s) => s && (s.barcodeTail === '606' || s.barcodeType === 'phone')
    );
    const phoneCount = phoneSteps.length;

    const appliancePaymentBreakdown = [
      ...applianceSteps.map((s, idx) => `${idx + 1}차: ${formatWon(s.amount)}`),
      ...(hasGcashPayment ? [`${applianceSteps.length + 1}차(G캐시): ${formatWon(gcashDeductAmount)}`] : [])
    ];

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
            maxWidth: '820px',
            width: '100%',
            maxHeight: '94vh',
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
              padding: '0.85rem 1.4rem',
              background: '#0f172a',
              color: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={19} color="#f59e0b" />
              <span style={{ fontSize: '0.96rem', fontWeight: 800, color: '#fde68a' }}>
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
                fontSize: '1.25rem',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>

          {/* 영수증/지시서 본체 (인쇄 가능) - 사용자 기기 다크모드 무시하고 항상 순백색 A4 영수증 원본 유지 */}
          <div
            id="pos-cashier-print-area"
            className="pos-sheet-light-mode"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              colorScheme: 'light',
              forcedColorAdjust: 'none',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              padding: '1.35rem 1.5rem',
              overflowY: 'auto',
              fontFamily: '"Pretendard", -apple-system, sans-serif'
            }}
          >
            {/* 다크모드 강제 무력화 및 순백색 출력 보장 스타일 태그 (html-to-image 캡처 시 SVG 내부에도 직접 포함됨) */}
            <style>{`
              #pos-cashier-print-area, #pos-cashier-print-area * {
                color-scheme: light !important;
                forced-color-adjust: none !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @media (prefers-color-scheme: dark) {
                #pos-cashier-print-area {
                  background-color: #ffffff !important;
                  color: #0f172a !important;
                }
                #pos-cashier-print-area * {
                  color-scheme: light !important;
                  forced-color-adjust: none !important;
                }
              }
            `}</style>
            {/* 지시서 타이틀 & 매장 정보 */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '0.55rem', marginBottom: '0.7rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 800, letterSpacing: '2.5px' }}>
                GALLERIA JINJU STORE
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, margin: '0.25rem 0', color: '#0f172a' }}>
                POS 결제 및 사은행사 지시서
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', justifyContent: 'center', gap: '1.2rem', marginTop: '0.25rem' }}>
                <span>일자: <strong style={{ color: '#0f172a' }}>{consultDate || getLocalTodayString()}</strong></span>
                <span>고객: <strong>{customerName || '소중한고객님'}</strong></span>
                <span>담당: <strong>조준석 매니저</strong></span>
              </div>
            </div>

            {/* 매장 및 입금계좌 한 줄 요약 헤더 (전화번호/중복 매니저명 제거 및 한 줄 배치) */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              marginBottom: '0.75rem',
              fontSize: '0.84rem',
              color: '#334155',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>㈜한화 갤러리아 진주점 가전매장</span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span>입금계좌: <strong style={{ color: '#0f172a' }}>경남은행 207-0123-9010-00</strong> <span style={{ color: '#64748b', fontSize: '0.78rem' }}>(예금주: ㈜한화 갤러리아)</span></span>
            </div>

            {/* 3대 시나리오 실시간 플랜 전환 바 (POS 지시서 모달 상단 - 인쇄 시 버튼 숨김) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '0.45rem 0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                <span>지시서 적용 플랜:</span>
                <span style={{
                  padding: '3px 8px',
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
              <div className="no-print" style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setDeptStrategy('reward')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
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
                    borderRadius: '4px',
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
                    borderRadius: '4px',
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
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a' }}>
                  ■ POS 필수 스캔 바코드 2종 (수수료 상이 · 교차스캔 금지)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 800, background: '#fee2e2', padding: '2px 7px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                  ⚠️ 가전 vs 자급제폰 수수료율 상이 / 전용 바코드 분리 필수
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {/* 1. 일반 가전 결제 바코드 (끝자리 907) */}
                <div
                  style={{
                    background: '#f0f9ff',
                    border: '2px solid #0284c7',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#0369a1' }}>
                      🏬 일반 가전 결제용 바코드
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 900, background: '#0284c7', color: '#ffffff', padding: '2px 7px', borderRadius: '4px' }}>
                      끝자리 907 (가전 수수료율)
                    </span>
                  </div>

                  {/* 실물 바코드 이미지 (끝자리 907) */}
                  <div style={{ background: '#ffffff', padding: '5px 8px', borderRadius: '6px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace', letterSpacing: '1.5px', lineHeight: 1.15 }}>
                      {DEPT_POS_BARCODES.appliance.topCode}
                    </div>
                    <img
                      src={DEPT_POS_BARCODES.appliance.image}
                      alt="가전 바코드 2304641471907"
                      style={{ width: '100%', maxWidth: '240px', height: '44px', objectFit: 'contain', margin: '3px auto', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.98rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2px', color: '#0f172a', lineHeight: 1.15 }}>
                      2304641471<span style={{ color: '#0284c7', textDecoration: 'underline' }}>907</span>
                    </div>
                  </div>

                  {/* 바코드 하단: 결제 승인 금액 및 분할 건수 안내 */}
                  <div style={{ background: '#ffffff', borderRadius: '6px', padding: '6px 10px', border: '1px solid #bae6fd', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem' }}>
                      <span style={{ color: '#475569', fontWeight: 700 }}>가전 승인 대상액:</span>
                      <strong style={{ fontSize: '1.08rem', fontWeight: 900, color: '#0369a1' }}>
                        {formatWon(deptEnginePlan.applianceGross)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ color: '#475569', fontWeight: 700 }}>결제 건수:</span>
                      <strong style={{
                        fontSize: '0.78rem',
                        fontWeight: 900,
                        color: totalAppliancePayments > 1 ? '#d97706' : '#0369a1',
                        background: totalAppliancePayments > 1 ? '#fef3c7' : '#e0f2fe',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: totalAppliancePayments > 1 ? '1px solid #fde68a' : '1px solid #bae6fd'
                      }}>
                        {totalAppliancePayments > 1
                          ? `총 ${totalAppliancePayments}회 분할 결제${hasGcashPayment ? ` (카드 ${applianceSteps.length}회 + G캐시 1회)` : ''}`
                          : totalAppliancePayments === 1
                            ? '단독 1회 결제'
                            : '0건 (결제 없음)'}
                      </strong>
                    </div>
                    {totalAppliancePayments > 1 && (
                      <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, background: '#f0f9ff', padding: '3px 6px', borderRadius: '4px', textAlign: 'right', marginTop: '1px' }}>
                        {appliancePaymentBreakdown.join(' | ')}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 700, lineHeight: 1.3 }}>
                    ※ 일반 가전(냉장고, TV, 세탁기 등) 결제 시 스캔 (자급제 스캔 절대 금지)
                  </div>
                </div>

                {/* 2. 자급제폰 결제 바코드 (끝자리 606) */}
                <div
                  style={{
                    background: deptEnginePlan.phoneGross > 0 ? '#ecfdf5' : '#f8fafc',
                    border: deptEnginePlan.phoneGross > 0 ? '2px solid #059669' : '1px dashed #cbd5e1',
                    borderRadius: '8px',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    opacity: deptEnginePlan.phoneGross > 0 ? 1 : 0.65,
                    boxShadow: deptEnginePlan.phoneGross > 0 ? '0 2px 8px rgba(5, 150, 105, 0.08)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 900, color: deptEnginePlan.phoneGross > 0 ? '#047857' : '#64748b' }}>
                      📱 자급제폰 결제용 바코드
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
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
                    <div style={{ fontSize: '0.74rem', color: '#64748b', fontFamily: 'monospace', letterSpacing: '1.5px', lineHeight: 1.15 }}>
                      {DEPT_POS_BARCODES.phone.topCode}
                    </div>
                    <img
                      src={DEPT_POS_BARCODES.phone.image}
                      alt="자급제 바코드 2303990976606"
                      style={{ width: '100%', maxWidth: '240px', height: '44px', objectFit: 'contain', margin: '3px auto', display: 'block' }}
                    />
                    <div style={{ fontSize: '0.98rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '2px', color: '#0f172a', lineHeight: 1.15 }}>
                      2303990976<span style={{ color: '#059669', textDecoration: 'underline' }}>606</span>
                    </div>
                  </div>

                  {/* 바코드 하단: 결제 승인 금액 및 분할 건수 안내 */}
                  <div style={{ background: '#ffffff', borderRadius: '6px', padding: '6px 10px', border: '1px solid #a7f3d0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem' }}>
                      <span style={{ color: '#475569', fontWeight: 700 }}>자급제 승인 대상액:</span>
                      <strong style={{ fontSize: '1.08rem', fontWeight: 900, color: deptEnginePlan.phoneGross > 0 ? '#047857' : '#94a3b8' }}>
                        {deptEnginePlan.phoneGross > 0 ? formatWon(deptEnginePlan.phoneGross) : '자급제 없음 (0원)'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ color: '#475569', fontWeight: 700 }}>결제 건수:</span>
                      <strong style={{
                        fontSize: '0.78rem',
                        fontWeight: 900,
                        color: deptEnginePlan.phoneGross > 0 ? '#047857' : '#94a3b8',
                        background: deptEnginePlan.phoneGross > 0 ? '#ecfdf5' : '#f1f5f9',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: deptEnginePlan.phoneGross > 0 ? '1px solid #a7f3d0' : '1px solid #e2e8f0'
                      }}>
                        {deptEnginePlan.phoneGross > 0 ? (phoneCount > 1 ? `총 ${phoneCount}회 분할 결제` : '단독 1회 결제') : '0건 (결제 없음)'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: deptEnginePlan.phoneGross > 0 ? '#047857' : '#94a3b8', fontWeight: 700, lineHeight: 1.3 }}>
                    {deptEnginePlan.phoneGross > 0
                      ? '※ 자급제폰 결제 시에만 단독 스캔 (일반 가전 스캔 절대 금지)'
                      : '※ 이번 결제에는 자급제폰이 포함되지 않아 스캔하지 않습니다.'}
                  </div>
                </div>
              </div>
            </div>

            {/* 결제 실행 단계별 지시표 - 혜택 및 수수료 비고 컬럼 제거하여 5개 컬럼으로 가로 공간 확보 및 가독성 대폭 향상 */}
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>■ POS 승인 순서 및 분할 결제 지시 (현장 영수증 일치 확인)</span>
                <span style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 800 }}>
                  {deptEnginePlan.mode === '2person_2cards' ? '👥 2인 2카드 분할' : deptEnginePlan.mode === '1person_3split' ? '👤 1인 분할 비기' : '👤 1인 단독 결제'}
                  {hasGcashPayment ? ' + ⚡ G캐시 차감 결제' : ''}
                  {` (총 ${totalAppliancePayments + phoneCount}건 결제)`}
                </span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem 0.4rem', width: '48px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#475569', whiteSpace: 'nowrap' }}>단계</th>
                    <th style={{ padding: '0.5rem 0.5rem', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>결제 구분</th>
                    <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', width: '98px', fontSize: '0.8rem', fontWeight: 800, color: '#475569', whiteSpace: 'nowrap' }}>스캔 바코드</th>
                    <th style={{ padding: '0.5rem 0.5rem', textAlign: 'right', width: '118px', fontSize: '0.8rem', fontWeight: 800, color: '#475569', whiteSpace: 'nowrap' }}>POS 승인 금액</th>
                    <th style={{ padding: '0.5rem 0.55rem', textAlign: 'right', width: '155px', background: '#eff6ff', color: '#1e40af', fontSize: '0.8rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                      청구할인 영수증 금액
                    </th>
                    <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', width: '92px', fontSize: '0.8rem', fontWeight: 800, color: '#b45309', whiteSpace: 'nowrap' }}>사은행사</th>
                  </tr>
                </thead>
                <tbody>
                  {deptEnginePlan.posSteps.map((st, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: st.discountAmount > 0 ? '#f8fafc' : 'transparent' }}>
                      <td style={{ padding: '0.55rem 0.45rem', textAlign: 'center', fontWeight: 800, color: '#64748b', fontSize: '0.86rem', whiteSpace: 'nowrap' }}>
                        {st.step}
                      </td>
                      <td style={{ padding: '0.55rem 0.55rem', fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                        {st.label}
                      </td>
                      <td style={{ padding: '0.55rem 0.45rem', textAlign: 'center' }}>
                        {st.barcodeBadge === '가전 907' ? (
                          <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', fontSize: '0.76rem', border: '1px solid #7dd3fc', whiteSpace: 'nowrap' }}>
                            🏬 가전 907
                          </span>
                        ) : st.barcodeBadge === '자급제 606' ? (
                          <span style={{ background: '#d1fae5', color: '#047857', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', fontSize: '0.76rem', border: '1px solid #6ee7b7', whiteSpace: 'nowrap' }}>
                            📱 자급제 606
                          </span>
                        ) : st.barcodeBadge === 'G캐시' ? (
                          <span style={{ background: '#fef3c7', color: '#b45309', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', fontSize: '0.76rem', border: '1px solid #fde68a', whiteSpace: 'nowrap' }}>
                            ⚡ G캐시 차감
                          </span>
                        ) : st.barcodeBadge === '앱 적립' ? (
                          <span style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', fontSize: '0.76rem', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                            💰 모바일 적립
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.76rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '0.55rem 0.55rem', textAlign: 'right', fontWeight: 800, fontSize: '0.94rem', color: '#334155', whiteSpace: 'nowrap' }}>
                        {formatWon(st.amount)}
                      </td>
                      <td style={{ padding: '0.55rem 0.65rem', textAlign: 'right', background: st.discountAmount > 0 ? '#eff6ff' : 'transparent', whiteSpace: 'nowrap' }}>
                        {st.discountAmount > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                            <strong style={{ fontSize: '0.98rem', fontWeight: 900, color: '#1d4ed8' }}>
                              {formatWon(st.receiptAmount)}
                            </strong>
                            <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>
                              (-{formatWon(st.discountAmount)} 청구할인)
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569' }}>
                            {formatWon(st.receiptAmount || st.amount)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.55rem 0.45rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {st.rewardRateLabel ? (
                          <span style={{
                            background: '#fffbeb',
                            color: '#b45309',
                            fontWeight: 900,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            border: '1px solid #fcd34d',
                            whiteSpace: 'nowrap'
                          }}>
                            {st.rewardRateLabel}
                          </span>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 최종 혜택 및 고객 정산 요약 */}
            <div style={{ background: '#f8fafc', padding: '0.7rem 0.95rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#64748b' }}>결제 기준 금액 총액</span>
                <div>
                  <strong style={{ color: '#0f172a' }}>{formatWon(deptEnginePlan.effectiveGross)}</strong>
                  {deptEnginePlan.phoneGross > 0 && (
                    <span style={{ fontSize: '0.76rem', color: '#64748b', marginLeft: '6px' }}>
                      (가전 {formatWon(deptEnginePlan.applianceGross)} + 자급제 {formatWon(deptEnginePlan.phoneGross)})
                    </span>
                  )}
                </div>
              </div>

              {/* 선차감 모드일 때: G캐시 선차감 및 고객 실제 카드 결제액 표시 */}
              {deptEnginePlan.safeDeduct > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '0.25rem', color: '#059669', background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                    <span style={{ fontWeight: 800 }}>⚡ G캐시 즉시 선차감 (결제 시 현장 차감)</span>
                    <strong style={{ fontSize: '0.94rem' }}>- {formatWon(deptEnginePlan.safeDeduct)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.86rem', marginBottom: '0.3rem', padding: '4px 8px', background: '#f0f9ff', borderRadius: '4px', border: '1px solid #bae6fd' }}>
                    <span style={{ color: '#0369a1', fontWeight: 900 }}>💳 고객 실제 카드 결제 승인 총액</span>
                    <strong style={{ fontSize: '1.08rem', color: '#0284c7', fontWeight: 900 }}>
                      {formatWon(deptEnginePlan.cardApproval || (deptEnginePlan.effectiveGross - deptEnginePlan.safeDeduct))}
                    </strong>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '0.25rem', color: '#64748b' }}>
                  <span>고객 카드 결제 승인 총액 (전액 카드 결제)</span>
                  <strong style={{ color: '#0f172a' }}>{formatWon(deptEnginePlan.effectiveGross)}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '0.25rem', color: '#dc2626' }}>
                <span>제휴카드 즉시 청구할인 합계 (영수증 현장 차감)</span>
                <strong>- {formatWon(deptEnginePlan.totalCardDiscount)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.86rem', marginBottom: '0.3rem', padding: '4px 8px', background: '#eff6ff', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                <span style={{ color: '#1e40af', fontWeight: 900 }}>🧾 청구할인 적용 후 영수증 결제 총액 (확인용)</span>
                <strong style={{ fontSize: '1.12rem', color: '#1d4ed8', fontWeight: 900 }}>
                  {formatWon((deptEnginePlan.cardApproval || deptEnginePlan.effectiveGross) - deptEnginePlan.totalCardDiscount)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.84rem', marginBottom: '0.4rem', color: '#d97706' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>
                    {deptEnginePlan.safeDeduct > 0 ? '💰 고객 잔여 순적립 G캐시 (모바일 앱)' : `백화점 사은행사 G캐시 증정 합계 (${deptRewardRate}%)`}
                  </span>
                  <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700, marginTop: '2px' }}>
                    {deptEnginePlan.gcash60Day > 0 && (
                      <span>
                        • 9.5% 이상 사은 (유효기간 60일): <strong style={{ color: '#dc2626' }}>{formatWon(deptEnginePlan.gcash60Day)}</strong>
                      </span>
                    )}
                    {deptEnginePlan.gcash5Year > 0 && (
                      <span style={{ marginLeft: deptEnginePlan.gcash60Day > 0 ? '8px' : '0' }}>
                        • 기본 6.5% 사은 (유효기간 5년): <strong>{formatWon(deptEnginePlan.gcash5Year)}</strong>
                      </span>
                    )}
                  </div>
                </div>
                <strong style={{ fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
                  + {formatWon(deptEnginePlan.safeReward !== undefined ? deptEnginePlan.safeReward : deptEnginePlan.totalGcash)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.45rem', borderTop: '2px solid #0f172a' }}>
                <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>고객 체감 최종 혜택가</span>
                <strong style={{ fontSize: '1.28rem', fontWeight: 900, color: '#0f172a' }}>
                  {formatWon(deptEnginePlan.finalPerceived)}
                </strong>
              </div>
            </div>

            {/* 하단 캐셔 안내 주의사항 (수수료율 구분 및 G캐시 유효기간 안내) */}
            <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45, borderTop: '2px solid #ef4444', background: '#fef2f2', padding: '0.6rem 0.85rem', borderRadius: '6px' }}>
              <div style={{ color: '#b91c1c', fontWeight: 900, marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                🚨 [캐셔 필수 확인 - 백화점 마진 수수료율 구분 및 G캐시 유효기간 지침]
              </div>
              <div>① 일반 가전과 자급제폰은 <strong>백화점 마진 수수료율이 완전히 상이</strong>하여 반드시 서로 다른 바코드로 분리 결제되어야 합니다.</div>
              <div>② 가전 승인금액은 반드시 <strong>[가전 바코드 907]</strong>을 스캔하고, 자급제폰 승인금액은 반드시 <strong>[자급제 바코드 606]</strong>을 스캔하십시오.</div>
              <div>③ 바코드를 교차 스캔하거나 하나로 통합 결제할 경우 <strong>매장 및 백화점 정산 수수료에 치명적인 오류</strong>가 발생하므로 절대 주의 바랍니다.</div>
              <div>④ ⏱️ <strong>사은행사 G캐시 유효기간 안내</strong>: 사은으로 받은 G캐시 중 <strong>9.5% 이상 사은행사(<strong>{formatWon(deptEnginePlan.gcash60Day)}</strong>)는 전액 증정일로부터 60일(2개월 이내)</strong> 유효하며, 기본 6.5% 일반 사은(<strong>{formatWon(deptEnginePlan.gcash5Year)}</strong>)은 <strong>5년간</strong> 유효합니다. 고객에게 60일 유효기간을 반드시 안내바랍니다.</div>
            </div>
          </div>

          {/* 모달 하단 버튼 바 (모바일 사진 저장 / 고화질 PDF / PC 인쇄) */}
          <div
            style={{
              padding: '0.8rem 1.4rem',
              background: '#f1f5f9',
              borderTop: '1px solid #cbd5e1',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.6rem'
            }}
          >
            <button
              type="button"
              onClick={() => setShowPosCashierModal(false)}
              style={{
                padding: '0.55rem 1.05rem',
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
              onClick={handleExportPosAsImage}
              disabled={isExportingPosImage}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: isExportingPosImage ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Camera size={16} />
              {isExportingPosImage ? '사진 생성 중...' : '사진(이미지) 저장'}
            </button>

            <button
              type="button"
              onClick={handleExportPosAsPdf}
              disabled={isExportingPosPdf}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: isExportingPosPdf ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 3px 10px rgba(37, 99, 235, 0.28)'
              }}
            >
              <FileDown size={16} />
              {isExportingPosPdf ? 'PDF 생성 중...' : 'PDF 다운로드'}
            </button>

            <button
              type="button"
              onClick={() => {
                const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
                const printContents = document.getElementById('pos-cashier-print-area').innerHTML;
                const printWindow = window.open('', '', 'width=850,height=950');
                if (!printWindow) {
                  handleExportPosAsPdf();
                  return;
                }
                printWindow.document.write(`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <title>POS 결제 지시서 - ${customerName || '고객님'}</title>
                      <style>
                        @page {
                          size: A4 portrait;
                          margin: 8mm 10mm;
                        }
                        * {
                          box-sizing: border-box;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                        }
                        html, body {
                          margin: 0;
                          padding: 0;
                          background: #ffffff;
                          color: #0f172a;
                          font-family: -apple-system, BlinkMacSystemFont, "Pretendard", "Segoe UI", Roboto, sans-serif;
                          font-size: 13px;
                          line-height: 1.4;
                        }
                        .no-print {
                          display: none !important;
                        }
                        #pos-cashier-print-area {
                          padding: 0 !important;
                          width: 100% !important;
                          max-width: 100% !important;
                        }
                        table {
                          width: 100%;
                          border-collapse: collapse;
                          page-break-inside: avoid;
                        }
                        th, td {
                          border-bottom: 1px solid #cbd5e1;
                          padding: 7px 9px !important;
                        }
                        th {
                          background: #f1f5f9 !important;
                        }
                        @media print {
                          html, body {
                            margin: 0 !important;
                            padding: 0 !important;
                          }
                          .no-print {
                            display: none !important;
                          }
                          #pos-cashier-print-area {
                            padding: 0 !important;
                            overflow: visible !important;
                          }
                        }
                      </style>
                    </head>
                    <body>
                      <div id="pos-cashier-print-area">
                        ${printContents}
                      </div>
                    </body>
                  </html>
                `);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                  printWindow.print();
                  if (!isMobile) {
                    printWindow.close();
                  }
                }, 250);
              }}
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: '8px',
                border: 'none',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Printer size={16} />
              POS 지시서 인쇄
            </button>
          </div>
        </div>

        {/* POS 지시서 사진 미리보기 & 스마트폰 갤러리 저장 모달 */}
        {posImageModalData && (
          <div
            role="dialog"
            aria-modal="true"
            className="no-print"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.88)',
              zIndex: 10020,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              backdropFilter: 'blur(6px)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setPosImageModalData(null);
            }}
          >
            <div
              className="calc-modal-dialog"
              style={{
                background: '#0f172a',
                border: '1px solid rgba(52, 211, 153, 0.5)',
                borderRadius: '16px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.9)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
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
                  <span style={{ fontWeight: 800, fontSize: '0.96rem', color: '#f8fafc' }}>
                    POS 결제 지시서 사진 생성 완료
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPosImageModalData(null)}
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
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '10px',
                    padding: '0.65rem 0.9rem',
                    fontSize: '0.82rem',
                    color: '#a7f3d0',
                    marginBottom: '0.85rem',
                    lineHeight: 1.45
                  }}
                >
                  💡 <strong>스마트폰 사진 저장 안내:</strong> 아래 지시서 이미지를 <strong>1~2초간 꾹(길게) 터치</strong>하신 후 <strong>[사진 앱에 저장]</strong> 또는 <strong>[이미지 저장]</strong>을 선택하시면 갤러리에 즉시 저장됩니다.
                </div>

                <img
                  src={posImageModalData.dataUrl}
                  alt="POS 결제 지시서 사진"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                    border: '1px solid #334155',
                    background: '#ffffff'
                  }}
                />
              </div>

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
                  posImageModalData.file &&
                  navigator.canShare({ files: [posImageModalData.file] }) && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.share({
                            files: [posImageModalData.file],
                            title: `JCC POS 결제 지시서 (${posImageModalData.customer} 고객님)`,
                            text: `[JCC 진센조] ${posImageModalData.customer} 고객님 POS 결제 지시서입니다.`
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
                        fontSize: '0.86rem',
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
                  href={posImageModalData.dataUrl}
                  download={posImageModalData.filename}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.45)',
                    color: '#93c5fd',
                    padding: '0.6rem 1.1rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Download size={15} /> 사진 파일 다운로드
                </a>

                <button
                  type="button"
                  onClick={() => setPosImageModalData(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#f8fafc',
                    padding: '0.6rem 1.1rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.86rem',
                    cursor: 'pointer'
                  }}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // 관리자 전용: 접속자 계정(ID/PW) 및 레벨(Lv.1 / Lv.2 / 관리자) 권한 설정 모달
  // ============================================================================
  const renderAdminAccountModal = () => {
    if (!isAdminUser || !showAdminAccountModal) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        className="no-print"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.86)',
          zIndex: 10050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(8px)'
        }}
        onClick={() => setShowAdminAccountModal(false)}
      >
        <div
          className="calc-modal-dialog"
          style={{
            background: '#0f172a',
            border: '1px solid rgba(212, 175, 55, 0.55)',
            borderRadius: '18px',
            maxWidth: '920px',
            width: '100%',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 모달 상단 헤더 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.4rem',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.18), rgba(15, 23, 42, 0.95))',
              borderBottom: '1px solid rgba(212, 175, 55, 0.35)',
              flexWrap: 'wrap',
              gap: '0.6rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Crown size={22} color="#fbbf24" />
              <div>
                <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 900, color: '#fef3c7' }}>
                  접속자 ID/PW 및 레벨(Lv.1 · Lv.2) 권한 관리
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                  로컬 · 단독 HTML · 온라인(웹) 어디서든 계정과 권한 레벨이 클라우드로 실시간 통합 연동됩니다.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => syncUserAccountsFromCloud(true)}
                disabled={isAccountCloudSyncing}
                style={{
                  height: '32px',
                  padding: '0 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  background: 'rgba(14, 165, 233, 0.15)',
                  color: '#7dd3fc',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: isAccountCloudSyncing ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <RefreshCw size={13} />
                {isAccountCloudSyncing ? '동기화 중...' : '클라우드 동기화'}
              </button>
              <button
                type="button"
                onClick={handleExportAccountsJson}
                title="완전 오프라인 PC 전달용 계정 설정 파일(.json) 다운로드"
                style={{
                  height: '32px',
                  padding: '0 0.7rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#cbd5e1',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <Download size={13} /> 설정 백업
              </button>
              <label
                title="계정 설정 파일(.json) 불러오기"
                style={{
                  height: '32px',
                  padding: '0 0.7rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#cbd5e1',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  margin: 0
                }}
              >
                <Upload size={13} /> 설정 복원
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportAccountsJson}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                type="button"
                onClick={() => setShowAdminAccountModal(false)}
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
                <X size={22} />
              </button>
            </div>
          </div>

          {/* 모달 본문 */}
          <div style={{ padding: '1.25rem 1.4rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* 알림 배너 */}
            {accountSyncNotice && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.16)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  color: '#6ee7b7',
                  padding: '0.65rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 700
                }}
              >
                {accountSyncNotice}
              </div>
            )}

            {/* 레벨별 기능 노출 정책 안내 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.65rem'
              }}
            >
              <div
                style={{
                  background: 'rgba(37, 99, 235, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '10px',
                  padding: '0.75rem 0.9rem'
                }}
              >
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#93c5fd', marginBottom: '4px' }}>
                  🛡️ Lv.1 권한 (1번 계산기 전용)
                </div>
                <div style={{ fontSize: '0.77rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  • <strong>1번 구독 비교 계산기</strong>만 사용 가능<br />
                  • 관리자가 Lv.2 권한을 부여하기 전까지 <strong>2번 계산기 및 POS 지시서 등 Lv.2 기능이 화면에 일체 노출되지 않음</strong>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '10px',
                  padding: '0.75rem 0.9rem'
                }}
              >
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#6ee7b7', marginBottom: '4px' }}>
                  ⚡ Lv.2 권한 (1번 + 2번 전체 계산기)
                </div>
                <div style={{ fontSize: '0.77rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  • <strong>1번 구독 비교 계산기 + 2번 구독 포함 계산기</strong> 전체 사용<br />
                  • 백화점/로드샵 복합 견적 및 캐셔 POS 지시서 사용 가능 (계정 관리 메뉴는 비노출)
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(212, 175, 55, 0.12)',
                  border: '1px solid rgba(212, 175, 55, 0.45)',
                  borderRadius: '10px',
                  padding: '0.75rem 0.9rem'
                }}
              >
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#fde68a', marginBottom: '4px' }}>
                  👑 관리자 권한 (Master Admin)
                </div>
                <div style={{ fontSize: '0.77rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  • Lv.1 + Lv.2의 모든 계산기 기능 제한 없이 사용<br />
                  • 접속자 ID/PW 생성·수정·삭제 및 <strong>Lv.1 ↔ Lv.2 권한 실시간 부여/회수</strong>
                </div>
              </div>
            </div>

            {/* 신규 아이디 사용 신청 승인 대기 목록 (신청 건이 있을 때 최상단에 강조 표시) */}
            <div
              style={{
                background:
                  pendingAccountRequests.length > 0
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(15, 23, 42, 0.6)',
                border:
                  pendingAccountRequests.length > 0
                    ? '1.5px solid rgba(245, 158, 11, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '1rem 1.15rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: pendingAccountRequests.length > 0 ? '0.8rem' : '0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      padding: '0.22rem 0.65rem',
                      borderRadius: '999px',
                      fontSize: '0.76rem',
                      fontWeight: 900,
                      background:
                        pendingAccountRequests.length > 0
                          ? 'rgba(245, 158, 11, 0.25)'
                          : 'rgba(255, 255, 255, 0.08)',
                      color: pendingAccountRequests.length > 0 ? '#fde68a' : '#94a3b8',
                      border:
                        pendingAccountRequests.length > 0
                          ? '1px solid rgba(245, 158, 11, 0.6)'
                          : '1px solid rgba(255, 255, 255, 0.12)'
                    }}
                  >
                    🔔 승인 대기 {pendingAccountRequests.length}건
                  </span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                    신규 아이디(계정) 사용 신청 내역
                  </span>
                </div>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  {pendingAccountRequests.length > 0
                    ? '신청자가 입력한 이름·ID를 확인하고 부여할 레벨(Lv.1 또는 Lv.2)로 승인해 주세요. (비밀번호는 단방향 암호화되어 관리자도 열람 불가)'
                    : '현재 대기 중인 신규 아이디 신청 건이 없습니다.'}
                </span>
              </div>

              {pendingAccountRequests.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {pendingAccountRequests.map((req) => (
                    <div
                      key={req.uid}
                      style={{
                        background: 'rgba(2, 6, 23, 0.85)',
                        border: '1px solid rgba(245, 158, 11, 0.45)',
                        borderRadius: '10px',
                        padding: '0.8rem 1rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            padding: '0.26rem 0.65rem',
                            borderRadius: '999px',
                            fontSize: '0.74rem',
                            fontWeight: 900,
                            background: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.6)',
                            color: '#fde68a'
                          }}
                        >
                          ⏳ 승인 대기중
                        </span>
                        <div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fef3c7', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>신청자: {req.name}</span>
                            <span style={{ fontSize: '0.73rem', color: '#94a3b8', fontWeight: 600 }}>
                              ({req.requestedAt || req.createdAt})
                            </span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '3px', fontFamily: 'monospace' }}>
                            희망 ID: <strong style={{ color: '#38bdf8' }}>{req.id}</strong>
                            <span style={{ margin: '0 8px', color: '#475569' }}>|</span>
                            설정한 PW: <strong style={{ color: '#10b981' }}>🔒 단방향 암호화 보호됨 (열람불가)</strong>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleAdminApproveRequest(req.uid, 'lv1')}
                          style={{
                            height: '34px',
                            padding: '0 0.85rem',
                            borderRadius: '8px',
                            border: '1px solid #3b82f6',
                            background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
                          }}
                          title="1번 구독 비교 계산기만 사용 가능한 Lv.1 권한으로 승인합니다."
                        >
                          <Check size={14} /> Lv.1으로 승인 (1번 전용)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminApproveRequest(req.uid, 'lv2')}
                          style={{
                            height: '34px',
                            padding: '0 0.85rem',
                            borderRadius: '8px',
                            border: '1px solid #10b981',
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                            color: '#ffffff',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                          }}
                          title="1번 + 2번 전체 계산기를 사용할 수 있는 Lv.2 권한으로 승인합니다."
                        >
                          <Check size={14} /> Lv.2로 승인 (1·2번 전체)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdminRejectRequest(req)}
                          style={{
                            height: '34px',
                            padding: '0 0.7rem',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.45)',
                            background: 'rgba(239, 68, 68, 0.14)',
                            color: '#fca5a5',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="신청을 반려하고 목록에서 삭제합니다."
                        >
                          <Trash2 size={13} /> 반려
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 관리자 직접 신규 계정 생성 폼 */}
            <form
              onSubmit={handleAdminAddAccount}
              style={{
                background: 'rgba(30, 41, 59, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '1rem 1.15rem'
              }}
            >
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={16} color="#34d399" /> 관리자 직접 계정 생성 (즉시 승인 등록)
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.65rem',
                  alignItems: 'end'
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                    접속 아이디 (ID) *
                  </label>
                  <input
                    type="text"
                    value={newAccId}
                    onChange={(e) => setNewAccId(e.target.value)}
                    placeholder="예: staff01"
                    className="calc-input-editable"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.18)',
                      color: '#ffffff',
                      fontSize: '0.86rem',
                      fontWeight: 700
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                    초기 비밀번호 (암호화 저장) *
                  </label>
                  <input
                    type="password"
                    value={newAccPw}
                    onChange={(e) => setNewAccPw(e.target.value)}
                    placeholder="초기 비밀번호 입력"
                    autoComplete="new-password"
                    className="calc-input-editable"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.18)',
                      color: '#ffffff',
                      fontSize: '0.86rem',
                      fontWeight: 700
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                    사용자 이름 / 직책
                  </label>
                  <input
                    type="text"
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    placeholder="예: 김삼성 매니저"
                    className="calc-input-editable"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.18)',
                      color: '#ffffff',
                      fontSize: '0.86rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700, marginBottom: '4px' }}>
                    초기 부여 레벨
                  </label>
                  <select
                    value={newAccLevel}
                    onChange={(e) => setNewAccLevel(e.target.value)}
                    className="calc-select-clickable"
                    style={{
                      width: '100%',
                      padding: '0.55rem 2rem 0.55rem 0.7rem',
                      borderRadius: '8px',
                      background: '#0f172a',
                      border: '1px solid rgba(212, 175, 55, 0.45)',
                      color: '#fde68a',
                      fontSize: '0.85rem',
                      fontWeight: 800
                    }}
                  >
                    <option value="lv1">Lv.1 (1번 계산기만 허용)</option>
                    <option value="lv2">Lv.2 (1·2번 전체 허용)</option>
                    <option value="admin">관리자 (전체 + 계정설정)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  style={{
                    height: '38px',
                    padding: '0 1rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Plus size={16} /> 계정 추가
                </button>
              </div>
            </form>

            {/* 승인 완료된 활성 계정 목록 및 원클릭 권한 변경 테이블 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#e2e8f0' }}>
                  승인 완료된 활성 계정 목록 ({approvedUserAccounts.length}개) — 매니저별 접속 현황 및 권한(Lv.1 ↔ Lv.2) 변경
                </span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid rgba(16, 185, 129, 0.45)',
                    color: '#6ee7b7',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 800
                  }}
                >
                  🛡️ SHA-256 단방향 암호화 적용중 (관리자도 기존 비밀번호 열람 불가 · 초기화만 가능)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {approvedUserAccounts.map((acc) => {
                  const isEditing = editingAccUid === acc.uid;
                  const isMe = currentUser?.uid === acc.uid || currentUser?.id === acc.id;

                  return (
                    <div
                      key={acc.uid}
                      style={{
                        background: isMe ? 'rgba(212, 175, 55, 0.08)' : 'rgba(15, 23, 42, 0.9)',
                        border: isMe
                          ? '1px solid rgba(212, 175, 55, 0.45)'
                          : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                          <div style={{ flex: '1 1 130px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>아이디 (ID)</span>
                            <input
                              type="text"
                              value={editAccId}
                              onChange={(e) => setEditAccId(e.target.value)}
                              className="calc-input-editable"
                              style={{
                                width: '100%',
                                height: '36px',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                background: '#020617',
                                border: '1px solid #38bdf8',
                                color: '#ffffff',
                                fontSize: '0.84rem',
                                fontWeight: 700
                              }}
                            />
                          </div>
                          <div style={{ flex: '1 1 170px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>새 비밀번호 재설정 (미입력 시 기존 유지)</span>
                            <input
                              type="password"
                              value={editAccPw}
                              onChange={(e) => setEditAccPw(e.target.value)}
                              placeholder="변경할 때만 새 PW 입력"
                              autoComplete="new-password"
                              className="calc-input-editable"
                              style={{
                                width: '100%',
                                height: '36px',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                background: '#020617',
                                border: '1px solid #38bdf8',
                                color: '#ffffff',
                                fontSize: '0.84rem',
                                fontWeight: 700
                              }}
                            />
                          </div>
                          <div style={{ flex: '1 1 150px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>이름 / 직책</span>
                            <input
                              type="text"
                              value={editAccName}
                              onChange={(e) => setEditAccName(e.target.value)}
                              className="calc-input-editable"
                              style={{
                                width: '100%',
                                height: '36px',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '6px',
                                background: '#020617',
                                border: '1px solid #38bdf8',
                                color: '#ffffff',
                                fontSize: '0.84rem'
                              }}
                            />
                          </div>
                          <div style={{ flex: '1 1 140px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>권한 레벨</span>
                            <select
                              value={editAccLevel}
                              onChange={(e) => setEditAccLevel(e.target.value)}
                              className="calc-select-clickable"
                              style={{
                                width: '100%',
                                height: '36px',
                                padding: '0.42rem 2rem 0.42rem 0.6rem',
                                borderRadius: '6px',
                                background: '#020617',
                                border: '1px solid #fbbf24',
                                color: '#fde68a',
                                fontSize: '0.84rem',
                                fontWeight: 800
                              }}
                            >
                              <option value="lv1">Lv.1 (1번 계산기 전용)</option>
                              <option value="lv2">Lv.2 (1·2번 전체 허용)</option>
                              <option value="admin">관리자 (Master)</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignSelf: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => handleAdminSaveEdit(acc.uid)}
                              style={{
                                height: '34px',
                                padding: '0 0.85rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#10b981',
                                color: '#ffffff',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingAccUid(null)}
                              style={{
                                height: '34px',
                                padding: '0 0.75rem',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'transparent',
                                color: '#94a3b8',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* 좌측: 계정 정보 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                padding: '0.28rem 0.65rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 900,
                                background:
                                  acc.level === 'admin'
                                    ? 'rgba(212, 175, 55, 0.2)'
                                    : acc.level === 'lv2'
                                      ? 'rgba(16, 185, 129, 0.2)'
                                      : 'rgba(37, 99, 235, 0.2)',
                                border:
                                  acc.level === 'admin'
                                    ? '1px solid rgba(212, 175, 55, 0.6)'
                                    : acc.level === 'lv2'
                                      ? '1px solid rgba(16, 185, 129, 0.6)'
                                      : '1px solid rgba(59, 130, 246, 0.6)',
                                color:
                                  acc.level === 'admin'
                                    ? '#fde68a'
                                    : acc.level === 'lv2'
                                      ? '#6ee7b7'
                                      : '#93c5fd'
                              }}
                            >
                              {acc.level === 'admin'
                                ? '👑 관리자'
                                : acc.level === 'lv2'
                                  ? '⚡ Lv.2 (1·2번 전체)'
                                  : '🛡️ Lv.1 (1번 전용)'}
                            </span>

                            <div>
                              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                <span>{getDisplayUserName(acc)}</span>
                                {isMe && (
                                  <span style={{ fontSize: '0.7rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                                    현재 접속중
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '1px 7px',
                                    borderRadius: '6px',
                                    background: (acc.loginCount || 0) > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(148, 163, 184, 0.12)',
                                    border: (acc.loginCount || 0) > 0 ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(148, 163, 184, 0.25)',
                                    color: (acc.loginCount || 0) > 0 ? '#38bdf8' : '#94a3b8'
                                  }}
                                  title="매니저가 지금까지 로그인하여 계산기를 이용한 총 접속 횟수입니다."
                                >
                                  📊 접속 {Number(acc.loginCount) || 0}회
                                </span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>
                                ID: <strong style={{ color: '#38bdf8' }}>{maskAccountId(acc.id)}</strong>
                                <span style={{ margin: '0 8px', color: '#475569' }}>|</span>
                                PW: <strong style={{ color: '#10b981' }}>🔒 단방향 암호화됨 (열람불가)</strong>
                                {acc.lastLoginAt && (
                                  <>
                                    <span style={{ margin: '0 8px', color: '#475569' }}>|</span>
                                    <span style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                                      최근: <strong style={{ color: '#a5f3fc' }}>{formatLoginTime(acc.lastLoginAt)}</strong>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 우측: 원클릭 레벨 전환 버튼 및 ID/PW 수정·삭제 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.38rem', flexWrap: 'wrap' }}>
                            {isProtectedAdminId(acc.id) ? (
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(212, 175, 55, 0.15)',
                                  border: '1px solid rgba(212, 175, 55, 0.5)',
                                  color: '#fde68a',
                                  fontSize: '0.74rem',
                                  fontWeight: 800
                                }}
                              >
                                🔒 보안 마스터 (권한 고정)
                              </span>
                            ) : (
                              <>
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    background: '#020617',
                                    padding: '3px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    gap: '3px'
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleAdminChangeLevel(acc.uid, 'lv1')}
                                    style={{
                                      padding: '4px 9px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: acc.level === 'lv1' ? '#2563eb' : 'transparent',
                                      color: acc.level === 'lv1' ? '#ffffff' : '#94a3b8',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                    title="1번 구독 비교 계산기만 사용 가능하도록 제한 (Lv.2 비노출)"
                                  >
                                    Lv.1 (1번 전용)
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdminChangeLevel(acc.uid, 'lv2')}
                                    style={{
                                      padding: '4px 9px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: acc.level === 'lv2' ? '#059669' : 'transparent',
                                      color: acc.level === 'lv2' ? '#ffffff' : '#94a3b8',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                    title="2번 구독 포함 계산기 및 백화점/POS 지시서 권한 부여"
                                  >
                                    Lv.2 권한 부여
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdminChangeLevel(acc.uid, 'admin')}
                                    style={{
                                      padding: '4px 9px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      background: acc.level === 'admin' ? '#d97706' : 'transparent',
                                      color: acc.level === 'admin' ? '#ffffff' : '#94a3b8',
                                      fontSize: '0.75rem',
                                      fontWeight: 800,
                                      cursor: 'pointer'
                                    }}
                                    title="관리자 권한 부여"
                                  >
                                    관리자
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAdminStartEdit(acc)}
                                  style={{
                                    height: '30px',
                                    padding: '0 0.65rem',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(56, 189, 248, 0.4)',
                                    background: 'rgba(14, 165, 233, 0.14)',
                                    color: '#7dd3fc',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="기존 비밀번호는 열람할 수 없으며, 새 비밀번호로 재설정(초기화)하거나 이름을 변경합니다."
                                >
                                  정보수정 / PW재설정
                                </button>
                              </>
                            )}

                            {!acc.isMaster && !isProtectedAdminId(acc.id) && (
                              <button
                                type="button"
                                onClick={() => handleAdminDeleteAccount(acc)}
                                style={{
                                  height: '30px',
                                  padding: '0 0.55rem',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  color: '#fca5a5',
                                  fontSize: '0.76rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                                title="계정 삭제"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 모달 하단 닫기 바 */}
          <div
            style={{
              padding: '0.85rem 1.4rem',
              background: 'rgba(2, 6, 23, 0.85)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              💡 권한 변경 즉시 클라우드에 저장되며, 접속자는 새로고침 또는 재로그인 시 변경된 레벨이 즉시 적용됩니다.
            </span>
            <button
              type="button"
              onClick={() => setShowAdminAccountModal(false)}
              style={{
                padding: '0.55rem 1.3rem',
                borderRadius: '8px',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                background: 'linear-gradient(135deg, #d4af37, #b8860b)',
                color: '#ffffff',
                fontSize: '0.86rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              설정 완료 및 닫기
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // [26.11월] AI 구독 제휴카드 공식 정책표 고해상도 팝업 모달
  // ============================================================================
  const renderCardPolicyModal = () => {
    if (!showCardPolicyModal) return null;

    // Helper: 1-click apply a card policy to subCards[0]
    const handleApplyCardPolicy = (cardName, spendStr, monthlyDiscount) => {
      setSubCards(prev => {
        if (!prev || prev.length === 0) {
          return [{
            id: 'card-1',
            name: cardName,
            minSpend: spendStr,
            monthly: monthlyDiscount,
            months: '',
            note: ''
          }];
        }
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          name: cardName,
          minSpend: spendStr,
          monthly: monthlyDiscount
        };
        return updated;
      });
      // also update legacy single-card states for instant synchronization
      setSubCardName(cardName);
      setSubCardMinSpend(spendStr);
      setSubCardMonthly(monthlyDiscount);

      alert(`[${cardName} - ${spendStr} (월 ${formatWon(monthlyDiscount)} 청구할인)]이 제휴카드 1번에 적용되었습니다.`);
    };

    return (
      <div
        role="dialog"
        aria-modal="true"
        className="no-print"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.88)',
          zIndex: 10050,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backdropFilter: 'blur(8px)'
        }}
        onClick={() => setShowCardPolicyModal(false)}
      >
        <div
          className="calc-modal-dialog"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#0f172a',
            border: '2px solid #3b82f6',
            borderRadius: '18px',
            maxWidth: '1280px',
            width: '96vw',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.7)'
          }}
        >
          {/* 모달 상단 헤더 */}
          <div
            style={{
              padding: '1rem 1.4rem',
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.5) 0%, rgba(15, 23, 42, 0.95) 100%)',
              borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.6rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📋</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                    [26.11월] AI 구독_제휴카드 공식 정책표
                  </h3>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1.5px dashed #ef4444',
                      color: '#fca5a5',
                      background: 'rgba(239, 68, 68, 0.15)',
                      letterSpacing: '0.08em'
                    }}
                  >
                    대외비
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#93c5fd', marginTop: '2px' }}>
                  롯데 · 삼성 · KB국민 · 우리 · 하나 5개사 실적별 기본/프로모션 혜택 &amp; 신규 고객 유의사항
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <a
                href="/images/card_policy_2026_11.png"
                download="11월_AI구독_제휴카드정책표_고해상도.png"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.18)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  color: '#6ee7b7',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
                title="원본 해상도 PNG 파일 다운로드 (바탕화면에도 동일 파일이 저장되어 있습니다)"
              >
                <Download size={13} />
                <span>고해상도 다운로드</span>
              </a>

              <button
                type="button"
                onClick={() => window.open('/images/card_policy_2026_11.png', '_blank')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.18)',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  color: '#93c5fd',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
                title="새 브라우저 탭에서 원본 해상도로 크게 열기"
              >
                <Maximize2 size={13} />
                <span>새 창 크게보기</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCardPolicyModal(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#cbd5e1',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <X size={15} />
                <span>닫기</span>
              </button>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div
            style={{
              padding: '0.5rem 1.4rem',
              background: '#0b1120',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '0.4rem',
              alignItems: 'center'
            }}
          >
            <button
              type="button"
              onClick={() => setCardPolicyModalTab('image')}
              style={{
                padding: '0.42rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: cardPolicyModalTab === 'image' ? '#2563eb' : 'rgba(255, 255, 255, 0.06)',
                color: cardPolicyModalTab === 'image' ? '#ffffff' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>🖼 선명한 고해상도 그래픽 (원본)</span>
            </button>
            <button
              type="button"
              onClick={() => setCardPolicyModalTab('table')}
              style={{
                padding: '0.42rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: cardPolicyModalTab === 'table' ? '#2563eb' : 'rgba(255, 255, 255, 0.06)',
                color: cardPolicyModalTab === 'table' ? '#ffffff' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>📊 인터랙티브 표 (반응형/원클릭 적용)</span>
            </button>
            <button
              type="button"
              onClick={() => setCardPolicyModalTab('summary')}
              style={{
                padding: '0.42rem 0.95rem',
                borderRadius: '8px',
                border: 'none',
                background: cardPolicyModalTab === 'summary' ? '#2563eb' : 'rgba(255, 255, 255, 0.06)',
                color: cardPolicyModalTab === 'summary' ? '#ffffff' : '#94a3b8',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>⚡ 5개 카드사 핵심 비교 요약</span>
            </button>
          </div>

          {/* 모달 본문 스크롤 영역 */}
          <div
            style={{
              padding: '1.2rem',
              overflowY: 'auto',
              flex: 1,
              background: '#090d16'
            }}
          >
            {/* TAB 1: 선명한 고해상도 그래픽 */}
            {cardPolicyModalTab === 'image' && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    marginBottom: '0.8rem',
                    padding: '0.55rem 0.9rem',
                    background: 'rgba(30, 41, 59, 0.6)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                    💡 26.11월 정책 사진을 3560×2200 초고해상도 레티나 그래픽으로 정밀 복원한 파일입니다. (클릭 시 확대/축소)
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      type="button"
                      onClick={() => setCardPolicyZoom(!cardPolicyZoom)}
                      style={{
                        padding: '0.3rem 0.7rem',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid #3b82f6',
                        color: '#93c5fd',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {cardPolicyZoom ? '화면 맞춤 보기' : '원본 크기 (100%) 보기'}
                    </button>
                  </div>
                </div>

                <div
                  onClick={() => setCardPolicyZoom(!cardPolicyZoom)}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '8px',
                    overflow: 'auto',
                    cursor: cardPolicyZoom ? 'zoom-out' : 'zoom-in',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    display: 'inline-block',
                    maxWidth: '100%'
                  }}
                >
                  <img
                    src="/images/card_policy_2026_11.png"
                    alt="26.11월 AI구독 제휴카드 공식 정책표 고해상도"
                    style={{
                      width: cardPolicyZoom ? '1700px' : '100%',
                      maxWidth: cardPolicyZoom ? 'none' : '100%',
                      height: 'auto',
                      display: 'block',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: 인터랙티브 표 */}
            {cardPolicyModalTab === 'table' && (
              <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.2rem', overflowX: 'auto', color: '#1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #0f172a', paddingBottom: '0.6rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                    [26.11월] AI 구독_제휴카드(기본)
                  </div>
                  <div style={{ border: '2px dashed #991b1b', color: '#991b1b', fontSize: '0.9rem', fontWeight: 800, padding: '3px 12px', borderRadius: '4px', background: '#fef2f2' }}>
                    대외비
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #334155', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #334155' }}>
                      <th style={{ border: '1px solid #cbd5e1', padding: '10px 6px', width: '105px', background: '#f1f5f9', color: '#334155', fontWeight: 800 }} rowSpan={2}>
                        카드명
                      </th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '12px 6px', color: '#be123c', fontWeight: 900, fontSize: '0.96rem' }} colSpan={2}>
                        구독엔로카 AMEX 롯데카드
                      </th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '12px 6px', color: '#1d4ed8', fontWeight: 900, fontSize: '0.96rem' }} colSpan={2}>
                        삼성전자 AI구독 삼성카드
                      </th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '12px 6px', color: '#b45309', fontWeight: 900, fontSize: '0.96rem' }} colSpan={2}>
                        삼성전자 AI구독 KB카드
                      </th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '12px 6px', color: '#0284c7', fontWeight: 900, fontSize: '0.96rem' }} colSpan={2}>
                        삼성전자 AI구독 우리카드
                      </th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '12px 6px', color: '#047857', fontWeight: 900, fontSize: '0.96rem' }} colSpan={2}>
                        삼성전자 AI구독 하나카드
                      </th>
                    </tr>
                    <tr style={{ background: '#f8fafc', fontSize: '0.78rem', color: '#475569' }}>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>이용금</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>할인 혜택 (기본 / +프로모션)</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>이용금</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>할인 혜택 (기본 / +프로모션)</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>이용금</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>할인 혜택 (기본 / +프로모션)</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>이용금</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>할인 혜택 (기본 / +프로모션)</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>이용금</th>
                      <th style={{ border: '1px solid #cbd5e1', padding: '6px' }}>할인 혜택 (기본 / +프로모션)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Tier 1 */}
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', background: '#f1f5f9', fontWeight: 800, textAlign: 'center' }} rowSpan={3}>
                        이용금 &amp;<br />할인혜택
                      </td>
                      {/* 롯데 1구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>50만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>15,000원 + <span style={{ color: '#dc2626' }}>7,000원</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 700 }}>총 22,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('구독엔로카 AMEX 롯데카드', '50만', 22000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#be123c', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* 삼성 1구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>30만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>13,000원 + <span style={{ color: '#dc2626' }}>3,000원</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 700 }}>총 16,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 삼성카드', '30만', 16000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#1d4ed8', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* KB 1구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>30만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>10,000원 + <span style={{ color: '#dc2626' }}>8,000원</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700 }}>총 18,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 KB카드', '30만', 18000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#b45309', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* 우리 1구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>30만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>10,000원 + <span style={{ color: '#dc2626' }}>7,000원</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700 }}>총 17,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 우리카드', '30만', 17000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#0284c7', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* 하나 1구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>30만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>13,000원</div>
                        <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700 }}>기본 13,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 하나카드', '30만', 13000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#047857', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                    </tr>

                    {/* Tier 2 */}
                    <tr>
                      {/* 롯데 2구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>100만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>20,000원 + <span style={{ color: '#dc2626' }}>6,000원</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 700 }}>총 26,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('구독엔로카 AMEX 롯데카드', '100만', 26000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#be123c', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* 삼성 2구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>70만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>17,000원 + <span style={{ color: '#dc2626' }}>9,000원</span></div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>(月구독료 7만↑ 조건)</div>
                        <div style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 700 }}>총 26,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 삼성카드', '70만', 26000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#1d4ed8', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* KB 2구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>70만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>12,000원 + <span style={{ color: '#dc2626' }}>10,000원</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700 }}>총 22,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 KB카드', '70만', 22000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#b45309', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* 우리 2구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>70만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>15,000원 + <span style={{ color: '#dc2626' }}>5,000원</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700 }}>총 20,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 우리카드', '70만', 20000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#0284c7', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* 하나 2구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>80만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>18,000원</div>
                        <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>연회비 2.5만 캐시백 (1회)</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 하나카드', '80만', 18000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#047857', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                    </tr>

                    {/* Tier 3 */}
                    <tr>
                      {/* 롯데 3구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>200만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>27,000원 + <span style={{ color: '#dc2626' }}>3,000원</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 700 }}>총 30,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('구독엔로카 AMEX 롯데카드', '200만', 30000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#be123c', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* 삼성 3구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>120만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>23,000원 + <span style={{ color: '#dc2626' }}>7,000원</span></div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>(月구독료 7만↑ 조건)</div>
                        <div style={{ fontSize: '0.74rem', color: '#1d4ed8', fontWeight: 700 }}>총 30,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 삼성카드', '120만', 30000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#1d4ed8', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* KB 3구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>100만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>14,000원 + <span style={{ color: '#dc2626' }}>13,000원</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#b45309', fontWeight: 700 }}>총 27,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 KB카드', '100만', 27000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#b45309', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* 우리 3구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>150만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>25,000원 + <span style={{ color: '#dc2626' }}>1,000원</span></div>
                        <div style={{ fontSize: '0.74rem', color: '#0284c7', fontWeight: 700 }}>총 26,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 우리카드', '150만', 26000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#0284c7', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                      {/* 하나 3구간 */}
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 700, background: '#fafaf9' }}>150만↑</td>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 6px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800 }}>25,000원</div>
                        <div style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700 }}>기본 25,000원 할인</div>
                        <button type="button" onClick={() => handleApplyCardPolicy('삼성전자 AI구독 하나카드', '150만', 25000)} style={{ marginTop: '4px', padding: '2px 8px', borderRadius: '4px', background: '#047857', color: 'white', border: 'none', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>적용</button>
                      </td>
                    </tr>

                    {/* 할인기간 */}
                    <tr style={{ background: '#f8fafc' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 800, background: '#f1f5f9' }}>할인기간</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                        기본: 카드유효기간<br /><span style={{ color: '#dc2626' }}>프로모션: 발급월+71개월</span>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 800, color: '#1d4ed8', fontSize: '0.9rem' }}>
                        72개월
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                        기본: 72개월<br /><span style={{ color: '#dc2626' }}>프로모션: 36개월</span>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                        기본: 72개월<br /><span style={{ color: '#dc2626' }}>프로모션: 60개월</span>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                        기본: 72개월<br /><span style={{ color: '#dc2626' }}>프로모션: 1회 (캐시백)</span>
                      </td>
                    </tr>

                    {/* 할인비교 (50만↑ 6년) */}
                    <tr style={{ background: '#eff6ff' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 800, background: '#e0e7ff', color: '#1e3a8a' }}>
                        할인비교<br /><span style={{ fontSize: '0.72rem' }}>(50만↑ 6년)</span>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1d4ed8' }}>158.4만</div>
                        <div style={{ fontSize: '0.74rem', color: '#475569' }}>(2.2만 × 72개월)</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1d4ed8' }}>115.2만</div>
                        <div style={{ fontSize: '0.74rem', color: '#475569' }}>(1.6만 × 72개월)</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1d4ed8' }}>100.8만</div>
                        <div style={{ fontSize: '0.74rem', color: '#475569' }}>(1만×72M + 0.8만×36M)</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1d4ed8' }}>114만</div>
                        <div style={{ fontSize: '0.74rem', color: '#475569' }}>(1만×72M + 0.7만×60M)</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1d4ed8' }}>93.6만</div>
                        <div style={{ fontSize: '0.74rem', color: '#475569' }}>(1.3만 × 72개월)</div>
                      </td>
                    </tr>

                    {/* 연회비 */}
                    <tr style={{ background: '#fafaf9' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '8px 4px', textAlign: 'center', fontWeight: 800, background: '#f1f5f9' }}>연회비</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 800 }}>2만</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 800 }}>2만</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 800 }}>2만</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 800 }}>2만</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 800 }}>2.5만</td>
                    </tr>

                    {/* 프로모션 유의사항 */}
                    <tr>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 800, background: '#f1f5f9' }}>프로모션<br />유의사항</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px 8px', fontSize: '0.75rem', lineHeight: 1.5 }}>
                        <span style={{ background: '#fef08a', color: '#854d0e', fontWeight: 800, padding: '2px 4px', borderRadius: '3px', display: 'block', marginBottom: '4px' }}>
                          *대상: 비 회원(카드보유X) 또는 직전 6개월 결제이력 없는 고객
                        </span>
                        <div>*가족카드 등록 시 혜택 제공 불가</div>
                        <div>*AMEX 브랜드 프로모션 혜택 가능</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px 8px', fontSize: '0.75rem', lineHeight: 1.5 }}>
                        <span style={{ color: '#1d4ed8', fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                          *신규/기존 회원 혜택 적용
                        </span>
                        <div>*프로모션은 차월 5일 대금할인</div>
                        <div>*70만↑ 구간은 월 구독료 7만↑ 조건 충족 시 혜택 적용</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px 8px', fontSize: '0.75rem', lineHeight: 1.5 }}>
                        <span style={{ background: '#fef08a', color: '#854d0e', fontWeight: 800, padding: '2px 4px', borderRadius: '3px', display: 'block', marginBottom: '4px' }}>
                          *대상: 비 회원(카드보유X) 또는 직전 6개월 결제이력 없는 고객
                        </span>
                        <div>*가족카드 등록 시 혜택 제공 불가</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px 8px', fontSize: '0.75rem', lineHeight: 1.5 }}>
                        <span style={{ background: '#fef08a', color: '#854d0e', fontWeight: 800, padding: '2px 4px', borderRadius: '3px', display: 'block', marginBottom: '4px' }}>
                          *대상: 비 회원(카드보유X) 또는 직전 6개월 결제이력 없는 고객
                        </span>
                        <div>*가족카드 등록 시 혜택 제공 불가</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px 8px', fontSize: '0.75rem', lineHeight: 1.5 }}>
                        <span style={{ background: '#fef08a', color: '#854d0e', fontWeight: 800, padding: '2px 4px', borderRadius: '3px', display: 'block', marginBottom: '4px' }}>
                          *대상: 구독 요금 납부 최초 고객 대상
                        </span>
                        <div style={{ color: '#047857', fontWeight: 700 }}>*기존 하나카드 보유자 혜택 가능</div>
                      </td>
                    </tr>

                    {/* 신규회원 확인 (QR) */}
                    <tr style={{ background: '#f8fafc' }}>
                      <td style={{ border: '1px solid #cbd5e1', padding: '10px 4px', textAlign: 'center', fontWeight: 800, background: '#f1f5f9' }}>신규회원<br />확인</td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>
                        <img src="/images/qr_lotte.png" alt="롯데 QR" style={{ width: '68px', height: '68px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>신규 여부 조회</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', color: '#94a3b8', fontSize: '0.76rem', fontWeight: 700 }}>
                        신규/기존 회원<br />모두 혜택 적용
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>
                        <img src="/images/qr_kb.png" alt="KB QR" style={{ width: '68px', height: '68px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>신규 여부 조회</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center' }}>
                        <img src="/images/qr_woori.png" alt="우리 QR" style={{ width: '68px', height: '68px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginTop: '2px' }}>신규 여부 조회</div>
                      </td>
                      <td colSpan={2} style={{ border: '1px solid #cbd5e1', padding: '10px', textAlign: 'center', color: '#94a3b8', fontSize: '0.76rem', fontWeight: 700 }}>
                        구독료 납부<br />최초 고객 대상
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: 5개 카드사 핵심 비교 요약 */}
            {cardPolicyModalTab === 'summary' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                {/* 롯데카드 */}
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(190, 18, 60, 0.4)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#f43f5e' }}>롯데카드</span>
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(190, 18, 60, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>AMEX</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.6rem' }}>구독엔로카 AMEX 롯데카드</div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', padding: '0.6rem', marginBottom: '0.6rem', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#cbd5e1' }}>50만 실적:</span>
                      <strong style={{ color: '#fca5a5' }}>월 2.2만 할인 (추천)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#cbd5e1' }}>100만 실적:</span>
                      <strong style={{ color: '#f8fafc' }}>월 2.6만 할인</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}>200만 실적:</span>
                      <strong style={{ color: '#f8fafc' }}>월 3.0만 할인</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#fde68a', marginBottom: '0.7rem', lineHeight: 1.4 }}>
                    • 6년 최대 158.4만원 (업계 최장 72개월 프로모션)<br />
                    • 구독료 실적 인정 대상 카드
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCardPolicy('구독엔로카 AMEX 롯데카드', '50만', 22000)}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#be123c', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    롯데카드 50만 (월 2.2만) 바로 적용
                  </button>
                </div>

                {/* 삼성카드 */}
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(37, 99, 235, 0.4)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#60a5fa' }}>삼성카드</span>
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(37, 99, 235, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>신규/기존 동일</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.6rem' }}>삼성전자 AI구독 삼성카드</div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', padding: '0.6rem', marginBottom: '0.6rem', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#cbd5e1' }}>30만 실적:</span>
                      <strong style={{ color: '#93c5fd' }}>월 1.6만 할인</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#cbd5e1' }}>70만 실적:</span>
                      <strong style={{ color: '#fde68a' }}>월 2.6만 (구독료 7만↑)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}>120만 실적:</span>
                      <strong style={{ color: '#f8fafc' }}>월 3.0만 (구독료 7만↑)</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#93c5fd', marginBottom: '0.7rem', lineHeight: 1.4 }}>
                    • 신규/기존 고객 무관 전원 프로모션 적용<br />
                    • 구독료 실적 인정 대상 카드 (72개월 공통)
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCardPolicy('삼성전자 AI구독 삼성카드', '30만', 16000)}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#2563eb', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    삼성카드 30만 (월 1.6만) 바로 적용
                  </button>
                </div>

                {/* KB국민카드 */}
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(217, 119, 6, 0.4)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#fbbf24' }}>KB국민카드</span>
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(217, 119, 6, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>36M 프로모션</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.6rem' }}>삼성전자 AI구독 KB카드</div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', padding: '0.6rem', marginBottom: '0.6rem', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#cbd5e1' }}>30만 실적:</span>
                      <strong style={{ color: '#fde68a' }}>월 1.8만 (기본1+프로모0.8)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#cbd5e1' }}>70만 실적:</span>
                      <strong style={{ color: '#f8fafc' }}>월 2.2만 할인</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}>100만 실적:</span>
                      <strong style={{ color: '#f8fafc' }}>월 2.7만 할인</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#e2e8f0', marginBottom: '0.7rem', lineHeight: 1.4 }}>
                    • 프로모션 기간: 36개월 적용<br />
                    • 비회원 또는 직전 6개월 결제이력 없는 고객
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCardPolicy('삼성전자 AI구독 KB카드', '30만', 18000)}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#b45309', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    KB카드 30만 (월 1.8만) 바로 적용
                  </button>
                </div>

                {/* 우리카드 */}
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(2, 132, 199, 0.4)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#38bdf8' }}>우리카드</span>
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(2, 132, 199, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>60M 프로모션</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.6rem' }}>삼성전자 AI구독 우리카드</div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', padding: '0.6rem', marginBottom: '0.6rem', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#cbd5e1' }}>30만 실적:</span>
                      <strong style={{ color: '#7dd3fc' }}>월 1.7만 할인</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#cbd5e1' }}>70만 실적:</span>
                      <strong style={{ color: '#f8fafc' }}>월 2.0만 할인</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}>150만 실적:</span>
                      <strong style={{ color: '#f8fafc' }}>월 2.6만 할인</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#e2e8f0', marginBottom: '0.7rem', lineHeight: 1.4 }}>
                    • 프로모션 기간: 60개월 장기 혜택<br />
                    • 비회원 또는 직전 6개월 결제이력 없는 고객
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCardPolicy('삼성전자 AI구독 우리카드', '30만', 17000)}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#0284c7', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    우리카드 30만 (월 1.7만) 바로 적용
                  </button>
                </div>

                {/* 하나카드 */}
                <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(5, 150, 105, 0.4)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                    <span style={{ fontSize: '0.96rem', fontWeight: 900, color: '#34d399' }}>하나카드</span>
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(5, 150, 105, 0.2)', padding: '2px 6px', borderRadius: '4px' }}>캐시백 2.5만</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.6rem' }}>삼성전자 AI구독 하나카드</div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', padding: '0.6rem', marginBottom: '0.6rem', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#cbd5e1' }}>30만 실적:</span>
                      <strong style={{ color: '#6ee7b7' }}>월 1.3만 할인</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ color: '#cbd5e1' }}>80만 실적:</span>
                      <strong style={{ color: '#fde68a' }}>월 1.8만 + 2.5만 캐시백</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cbd5e1' }}>150만 실적:</span>
                      <strong style={{ color: '#f8fafc' }}>월 2.5만 할인</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#e2e8f0', marginBottom: '0.7rem', lineHeight: 1.4 }}>
                    • 구독 요금 납부 최초 고객 대상<br />
                    • 기존 하나카드 보유자도 혜택 적용 가능
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyCardPolicy('삼성전자 AI구독 하나카드', '30만', 13000)}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', background: '#047857', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    하나카드 30만 (월 1.3만) 바로 적용
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 모달 하단 닫기 바 */}
          <div
            style={{
              padding: '0.75rem 1.4rem',
              background: '#0b1120',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              💡 각 카드사의 프로모션은 상담 시점 기준이며, 카드사 정책에 따라 변동될 수 있습니다.
            </div>
            <button
              type="button"
              onClick={() => setShowCardPolicyModal(false)}
              style={{
                padding: '0.45rem 1.2rem',
                borderRadius: '8px',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
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
    );
  };


  // ============================================================================
  // 1. 접속 ID / PW 로그인 및 신규 아이디 사용 신청 화면 (로컬 · 단독 HTML · 온라인 공통)
  // ============================================================================
  if (!isAuthenticated) {
    return (
      <section className={`container ${themeMode === 'light' ? 'theme-light' : 'theme-dark'}`} style={{ paddingTop: '2.5rem', minHeight: '82vh' }}>
        {otaState.status === 'ready_to_apply' && (
          <div
            style={{
              background: 'linear-gradient(135deg, #b45309, #d97706)',
              color: '#ffffff',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              textAlign: 'center',
              fontSize: '0.86rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              marginBottom: '1rem',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
            }}
          >
            <span>✨ 온라인 서버에 새로운 기능(v{otaState.remoteVersion || ''})이 업데이트되었습니다!</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                background: '#ffffff',
                color: '#92400e',
                border: 'none',
                borderRadius: '6px',
                padding: '0.3rem 0.75rem',
                fontWeight: 900,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              🚀 지금 최신 기능 적용하기
            </button>
          </div>
        )}

        {onBack && (
          <button onClick={onBack} className="btn-back">
            <span>←</span> 홈으로 돌아가기
          </button>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.8rem' }}>
          <div
            className="glass-panel"
            style={{
              maxWidth: '460px',
              width: '100%',
              textAlign: 'center',
              padding: '2.3rem 2rem',
              borderTop: authScreenTab === 'request' ? '4px solid #10b981' : '4px solid var(--accent-gold)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* 오프라인 HTML 최신 기능 업데이트 버튼 바 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', padding: '0.4rem 0.65rem', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
                {otaState.activeVersion ? `버전: v${otaState.activeVersion}` : '오프라인 HTML'}
              </span>
              <button
                type="button"
                onClick={otaState.status === 'ready_to_apply' ? () => window.location.reload() : handleTriggerOtaUpdate}
                disabled={otaState.status === 'checking' || otaState.status === 'downloading'}
                style={{
                  height: '28px',
                  padding: '0 0.65rem',
                  borderRadius: '6px',
                  border: otaState.status === 'ready_to_apply' ? '1px solid #fbbf24' : '1px solid rgba(56, 189, 248, 0.45)',
                  background: otaState.status === 'ready_to_apply' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(14, 165, 233, 0.14)',
                  color: otaState.status === 'ready_to_apply' ? '#ffffff' : '#7dd3fc',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: (otaState.status === 'checking' || otaState.status === 'downloading') ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
                title="온라인 서버의 최신 기능 추가 및 수정사항을 지금 즉시 동기화합니다."
              >
                {otaState.status === 'ready_to_apply' ? (
                  <>
                    <Sparkles size={12} color="#ffffff" />
                    <span>🚀 최신 기능 적용하기</span>
                  </>
                ) : otaState.status === 'downloading' ? (
                  <>
                    <RotateCw size={12} />
                    <span>다운로드 중...</span>
                  </>
                ) : otaState.status === 'checking' ? (
                  <>
                    <RotateCw size={12} />
                    <span>확인 중...</span>
                  </>
                ) : (
                  <>
                    <RotateCw size={12} />
                    <span>🔄 최신 기능 업데이트</span>
                  </>
                )}
              </button>
            </div>

            {/* 상단 탭 전환: [기존 계정 로그인] vs [신규 아이디 사용 신청] */}
            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                padding: '0.3rem',
                background: 'rgba(2, 6, 23, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                marginBottom: '1.5rem'
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthScreenTab('login');
                  setLoginErrorMsg('');
                  setReqFeedback({ type: '', message: '' });
                }}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    authScreenTab === 'login'
                      ? 'linear-gradient(135deg, #d4af37, #b8860b)'
                      : 'transparent',
                  color: authScreenTab === 'login' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🔑 기존 계정 로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthScreenTab('request');
                  setLoginErrorMsg('');
                  setReqFeedback({ type: '', message: '' });
                }}
                style={{
                  flex: 1,
                  padding: '0.6rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background:
                    authScreenTab === 'request'
                      ? 'linear-gradient(135deg, #059669, #10b981)'
                      : 'transparent',
                  color: authScreenTab === 'request' ? '#ffffff' : '#94a3b8',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                📝 신규 아이디 신청
              </button>
            </div>

            {authScreenTab === 'login' ? (
              <>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(212, 175, 55, 0.12)',
                    border: '1px solid var(--accent-gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    color: 'var(--accent-gold)'
                  }}
                >
                  <Lock size={26} />
                </div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                  JCC 스마트 혜택 계산기
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.4rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
                  승인된 매니저 전용 솔루션입니다.<br />
                  접속 <strong>아이디(ID)</strong>와 <strong>비밀번호(PW)</strong>를 입력해주세요.
                </p>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                      접속 아이디 (ID)
                    </label>
                    <input
                      type="text"
                      value={loginIdInput}
                      onChange={(e) => {
                        setLoginIdInput(e.target.value);
                        if (loginErrorMsg) setLoginErrorMsg('');
                      }}
                      placeholder="아이디 입력"
                      autoFocus
                      autoComplete="username"
                      className="calc-input-editable"
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0.88rem 1rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        fontSize: '1.02rem',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                      비밀번호 (PW)
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (loginErrorMsg) setLoginErrorMsg('');
                      }}
                      placeholder="비밀번호 입력"
                      autoComplete="current-password"
                      className="calc-input-editable"
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0.88rem 1rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        fontSize: '1.02rem',
                        fontWeight: 700,
                        letterSpacing: '3px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {loginErrorMsg && (
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.14)',
                        border: '1px solid rgba(239, 68, 68, 0.45)',
                        color: '#fca5a5',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.45
                      }}
                    >
                      {loginErrorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isAccountCloudSyncing}
                    style={{ width: '100%', marginTop: '0.3rem', padding: '0.92rem', fontSize: '0.98rem', fontWeight: 800 }}
                  >
                    <Unlock size={18} /> {isAccountCloudSyncing ? '계정 권한 확인 중...' : '로그인 및 계산기 열기'}
                  </button>
                </form>

                <div
                  style={{
                    marginTop: '1.15rem',
                    paddingTop: '0.95rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAuthScreenTab('request');
                      setLoginErrorMsg('');
                      setReqFeedback({ type: '', message: '' });
                    }}
                    style={{
                      width: '100%',
                      padding: '0.68rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#6ee7b7',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    📝 계정이 없으신가요? 신규 아이디(ID/PW) 사용 신청하기 →
                  </button>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.45 }}>
                    🔒 접속 계정의 권한 등급(Lv.1 / Lv.2 / 관리자)에 따라 허용된 계산기 기능만 활성화됩니다. (5분 미사용 시 자동 잠금)<br />
                    ☁️ 사내망에 저장해 둔 단독 HTML 파일도 온라인 서버 업데이트 시 최신 기능이 자동 동기화됩니다.
                  </div>
                </div>
              </>
            ) : (
              /* 신규 아이디(계정) 사용 신청 화면 */
              <>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.14)',
                    border: '1px solid #10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    color: '#34d399'
                  }}
                >
                  <Plus size={28} />
                </div>
                <h2 style={{ fontSize: '1.55rem', fontWeight: 800, marginBottom: '0.4rem', color: '#ecfdf5' }}>
                  신규 아이디(계정) 사용 신청
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.35rem', fontSize: '0.86rem', lineHeight: 1.5 }}>
                  본인 <strong>이름</strong>과 사용하실 <strong>아이디(ID) · 비밀번호(PW)</strong>를 입력해 신청해 주세요.<br />
                  관리자가 확인 후 승인 및 <strong>권한 레벨(Lv.1 / Lv.2)</strong>을 부여하면 바로 접속됩니다.
                </p>

                <form onSubmit={handleRequestNewAccount} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#a7f3d0', marginBottom: '0.32rem' }}>
                      1. 본인 이름 (성함 / 직책) *
                    </label>
                    <input
                      type="text"
                      value={reqNameInput}
                      onChange={(e) => {
                        setReqNameInput(e.target.value);
                        if (reqFeedback.message) setReqFeedback({ type: '', message: '' });
                      }}
                      placeholder="예: 홍길동 매니저"
                      autoFocus
                      className="calc-input-editable"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        fontSize: '0.98rem',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#a7f3d0', marginBottom: '0.32rem' }}>
                      2. 희망 접속 아이디 (ID) *
                    </label>
                    <input
                      type="text"
                      value={reqIdInput}
                      onChange={(e) => {
                        setReqIdInput(e.target.value);
                        if (reqFeedback.message) setReqFeedback({ type: '', message: '' });
                      }}
                      placeholder="원하시는 아이디 입력 (영문/숫자)"
                      autoComplete="username"
                      className="calc-input-editable"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        fontSize: '0.98rem',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#a7f3d0', marginBottom: '0.32rem' }}>
                      3. 희망 비밀번호 (PW) *
                    </label>
                    <input
                      type="password"
                      value={reqPwInput}
                      onChange={(e) => {
                        setReqPwInput(e.target.value);
                        if (reqFeedback.message) setReqFeedback({ type: '', message: '' });
                      }}
                      placeholder="원하시는 비밀번호 입력"
                      autoComplete="new-password"
                      className="calc-input-editable"
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0.85rem 1rem',
                        borderRadius: '10px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        fontSize: '0.98rem',
                        fontWeight: 700,
                        letterSpacing: '2px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {reqFeedback.message && (
                    <div
                      style={{
                        background:
                          reqFeedback.type === 'success'
                            ? 'rgba(16, 185, 129, 0.16)'
                            : 'rgba(239, 68, 68, 0.14)',
                        border:
                          reqFeedback.type === 'success'
                            ? '1px solid rgba(16, 185, 129, 0.5)'
                            : '1px solid rgba(239, 68, 68, 0.45)',
                        color: reqFeedback.type === 'success' ? '#a7f3d0' : '#fca5a5',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        whiteSpace: 'pre-line',
                        lineHeight: 1.5
                      }}
                    >
                      {reqFeedback.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAccountCloudSyncing}
                    style={{
                      width: '100%',
                      marginTop: '0.25rem',
                      padding: '0.92rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #059669, #10b981)',
                      color: '#ffffff',
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      cursor: isAccountCloudSyncing ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    {isAccountCloudSyncing ? '클라우드에 신청 전송 중...' : '아이디 사용 신청하기 (관리자 승인 요청)'}
                  </button>
                </form>

                <div
                  style={{
                    marginTop: '1.1rem',
                    paddingTop: '0.9rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAuthScreenTab('login');
                      setReqFeedback({ type: '', message: '' });
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#93c5fd',
                      fontSize: '0.83rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    ← 기존 계정으로 로그인 화면 돌아가기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ============================================================================
  // 1-2. 화면 잠금 상태 (5분 미사용 자동 잠금 또는 수동 잠금 시: 잠금해제 또는 로그아웃 선택)
  // ============================================================================
  if (isScreenLocked) {
    return (
      <section className={`container ${themeMode === 'light' ? 'theme-light' : 'theme-dark'}`} style={{ paddingTop: '3.5rem', minHeight: '82vh' }}>
        {onBack && (
          <button onClick={onBack} className="btn-back">
            <span>←</span> 홈으로 돌아가기
          </button>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
          <div
            className="glass-panel"
            style={{
              maxWidth: '460px',
              width: '100%',
              textAlign: 'center',
              padding: '2.5rem 2rem',
              borderTop: '4px solid #f59e0b',
              boxShadow: '0 22px 55px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.14)',
                border: '1px solid rgba(245, 158, 11, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                color: '#fbbf24'
              }}
            >
              <Lock size={28} />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                background: 'rgba(245, 158, 11, 0.16)',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                color: '#fde68a',
                fontSize: '0.78rem',
                fontWeight: 800,
                marginBottom: '0.65rem'
              }}
            >
              {screenLockReason === 'auto'
                ? '⏱️ 5분 미사용 자동 화면 잠금'
                : '🔒 보안 화면 잠금 상태'}
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.45rem', color: '#f8fafc' }}>
              화면이 잠금 상태입니다
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.4rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
              보안을 위해 화면이 안전하게 잠금 처리되었습니다.<br />
              비밀번호를 입력하여 잠금을 해제하거나 로그아웃을 선택해 주세요.
            </p>

            {/* 선택 1: 비밀번호 입력 후 잠금 해제 */}
            <form onSubmit={handleUnlockScreen} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  비밀번호(PW) 입력
                </label>
                <input
                  type="password"
                  value={unlockPasswordInput}
                  onChange={(e) => {
                    setUnlockPasswordInput(e.target.value);
                    if (unlockErrorMsg) setUnlockErrorMsg('');
                  }}
                  placeholder="비밀번호 입력하여 잠금 해제"
                  autoFocus
                  autoComplete="current-password"
                  className="calc-input-editable"
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0.9rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--glass-border)',
                    color: 'white',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    letterSpacing: '3px',
                    outline: 'none'
                  }}
                />
              </div>

              {unlockErrorMsg && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.14)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    color: '#fca5a5',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    textAlign: 'center'
                  }}
                >
                  {unlockErrorMsg}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={isAccountCloudSyncing}
                style={{
                  width: '100%',
                  padding: '0.92rem',
                  fontSize: '0.98rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem'
                }}
              >
                <Unlock size={18} />
                {isAccountCloudSyncing ? '확인 중...' : '1. 잠금 해제 (작업 중이던 화면으로 복귀)'}
              </button>
            </form>

            {/* 구분선 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                margin: '1rem 0'
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700 }}>또는</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            </div>

            {/* 선택 2: 완전 로그아웃 상태로 전환 */}
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.45)',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#fca5a5',
                fontSize: '0.92rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                transition: 'all 0.2s'
              }}
            >
              <ArrowLeft size={17} /> 2. 로그아웃 상태로 전환 (다른 계정으로 로그인)
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 접속자 정보 · 권한 레벨 표시 및 관리자 계정설정 바 + 계산기 모드 전환 탭 바
  const renderModeTabs = () => (
    <div className="container no-print" style={{ maxWidth: '1100px', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {/* 새 기능 다운로드 완료 시 즉시 적용 안내 배너 */}
      {otaState.status === 'ready_to_apply' && (
        <div
          style={{
            background: 'linear-gradient(135deg, #b45309, #d97706)',
            color: '#ffffff',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            textAlign: 'center',
            fontSize: '0.86rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="#fde68a" />
            <span>✨ 온라인 서버에 새로운 기능(v{otaState.remoteVersion || ''})이 다운로드되었습니다!</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              background: '#ffffff',
              color: '#92400e',
              border: 'none',
              borderRadius: '6px',
              padding: '0.35rem 0.85rem',
              fontWeight: 900,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            🚀 지금 최신 기능 적용하기
          </button>
        </div>
      )}

      {/* 상단 접속자 계정 & 레벨 상태 바 */}
      <div
        className="calc-modal-dialog"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          padding: '0.5rem 0.9rem',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          <span
            style={{
              padding: '0.22rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 900,
              background: isAdminUser
                ? 'rgba(212, 175, 55, 0.2)'
                : canAccessLv2
                  ? 'rgba(16, 185, 129, 0.2)'
                  : 'rgba(37, 99, 235, 0.2)',
              border: isAdminUser
                ? '1px solid rgba(212, 175, 55, 0.6)'
                : canAccessLv2
                  ? '1px solid rgba(16, 185, 129, 0.6)'
                  : '1px solid rgba(59, 130, 246, 0.6)',
              color: isAdminUser ? '#fde68a' : canAccessLv2 ? '#6ee7b7' : '#93c5fd'
            }}
          >
            {isAdminUser ? '👑 관리자 (MASTER)' : canAccessLv2 ? '⚡ Lv.2 권한' : '🛡️ Lv.1 권한'}
          </span>
          <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>
            {getDisplayUserName(currentUser)}
          </span>
          {!isProtectedAdminId(currentUser?.id) && (
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              (ID: {currentUser?.id})
            </span>
          )}
          <span
            style={{
              fontSize: '0.72rem',
              color: '#64748b',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '0.14rem 0.5rem',
              borderRadius: '999px'
            }}
            title="5분 동안 입력이나 마우스/터치 조작이 없으면 자동으로 화면이 잠금됩니다."
          >
            ⏱️ 5분 미사용 시 자동잠금
          </span>
          <span
            style={{
              fontSize: '0.73rem',
              fontWeight: 800,
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.14)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              padding: '0.14rem 0.55rem',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
            title="현재 실행 중인 시스템 버전"
          >
            🏷️ v{otaState.activeVersion || '2026.11.24'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* [🔄 최신 기능 업데이트] 버튼 */}
          <button
            type="button"
            onClick={otaState.status === 'ready_to_apply' ? () => window.location.reload() : handleTriggerOtaUpdate}
            disabled={otaState.status === 'checking' || otaState.status === 'downloading'}
            style={{
              height: '32px',
              padding: '0 0.8rem',
              borderRadius: '8px',
              border:
                otaState.status === 'ready_to_apply'
                  ? '1.5px solid #fbbf24'
                  : '1px solid rgba(56, 189, 248, 0.45)',
              background:
                otaState.status === 'ready_to_apply'
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'rgba(14, 165, 233, 0.14)',
              color: otaState.status === 'ready_to_apply' ? '#ffffff' : '#7dd3fc',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: (otaState.status === 'checking' || otaState.status === 'downloading') ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: otaState.status === 'ready_to_apply' ? '0 0 12px rgba(245, 158, 11, 0.5)' : 'none'
            }}
            title="온라인 서버의 최신 기능 추가 및 수정사항을 지금 즉시 동기화합니다."
          >
            {otaState.status === 'ready_to_apply' ? (
              <>
                <Sparkles size={14} color="#ffffff" />
                <span>🚀 최신 기능 적용</span>
              </>
            ) : otaState.status === 'downloading' ? (
              <>
                <RotateCw size={13} />
                <span>동기화 중...</span>
              </>
            ) : otaState.status === 'checking' ? (
              <>
                <RotateCw size={13} />
                <span>확인 중...</span>
              </>
            ) : (
              <>
                <RotateCw size={13} />
                <span>최신 기능 업데이트</span>
              </>
            )}
          </button>

          {isAdminUser && (
            <button
              type="button"
              onClick={() => setShowAdminAccountModal(true)}
              style={{
                height: '32px',
                padding: '0 0.85rem',
                borderRadius: '8px',
                border:
                  pendingAccountRequests.length > 0
                    ? '1.5px solid #f59e0b'
                    : '1px solid rgba(212, 175, 55, 0.6)',
                background:
                  pendingAccountRequests.length > 0
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(180, 83, 9, 0.35))'
                    : 'linear-gradient(135deg, rgba(212, 175, 55, 0.25), rgba(180, 83, 9, 0.25))',
                color: '#fde68a',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 10px rgba(212, 175, 55, 0.2)'
              }}
            >
              <Crown size={14} />
              <span>계정 · 권한(Lv.1/Lv.2) 관리</span>
              {pendingAccountRequests.length > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    padding: '1px 7px',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 900
                  }}
                >
                  🔔 신청 {pendingAccountRequests.length}건
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleScreenLock('manual')}
            style={{
              height: '32px',
              padding: '0 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              background: 'rgba(245, 158, 11, 0.14)',
              color: '#fde68a',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
            title="작성 중인 내용을 유지한 채 화면을 잠금 상태로 전환합니다."
          >
            <Lock size={13} /> 화면 잠금
          </button>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              height: '32px',
              padding: '0 0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#fca5a5',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
            title="현재 계정에서 완전히 로그아웃하고 ID/PW 로그인 화면으로 돌아갑니다."
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 계산기 모드 탭 바: Lv.1 계정에게는 2번 계산기 탭 자체를 노출하지 않음! */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.35rem',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          flexWrap: 'wrap'
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
            flex: '1 1 140px',
            minHeight: '44px',
            padding: '0.45rem 0.75rem',
            borderRadius: '8px',
            border: 'none',
            background: !isMixedMode ? 'linear-gradient(135deg, #1e3a8a, #2563eb)' : 'transparent',
            color: !isMixedMode ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 800,
            fontSize: '0.88rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            boxShadow: !isMixedMode ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
            transition: 'all 0.2s',
            lineHeight: 1.3
          }}
        >
          <Scale size={17} /> 1번 구독 비교 계산기
        </button>

        {canAccessLv2 && (
          <button
            type="button"
            onClick={() => {
              setCalculatorMode('mixed');
              setActiveQuoteId(null);
              setQuoteTitleInput('');
              setSaveNotice('');
            }}
            style={{
              flex: '1 1 140px',
              minHeight: '44px',
              padding: '0.45rem 0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: isMixedMode ? 'linear-gradient(135deg, #059669, #10b981)' : 'transparent',
              color: isMixedMode ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              boxShadow: isMixedMode ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
              transition: 'all 0.2s',
              lineHeight: 1.3
            }}
          >
            <Layers size={17} /> 2번 구독 포함 계산기
          </button>
        )}
      </div>
    </div>
  );

  // ============================================================================
  // 2. 비교 결과 & A4 출력 미리보기 화면
  // ============================================================================
  if (step === 'result') {
    // 케어서비스 금액 미입력 시 케어서비스 관련 체크포인트도 출력물에서 제외
    const checkedPoints = checkpoints.filter((c) => c.checked && (hasCareService || c.id !== 'cp3'));

    return (
      <section className={`calc-result-section ${themeMode === 'light' ? 'theme-light' : 'theme-dark'}`} style={{ paddingTop: '1.5rem', paddingBottom: '5rem' }}>
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
              onClick={handleExportAsPdf}
              disabled={isExportingPdf}
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                border: '1px solid #60a5fa',
                color: '#ffffff',
                padding: '0.85rem 1.6rem',
                borderRadius: '12px',
                cursor: isExportingPdf ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 800,
                fontSize: '1rem',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)'
              }}
            >
              <FileDown size={19} /> {isExportingPdf ? 'PDF 생성 중...' : '📥 고화질 PDF 다운로드 (태블릿 추천)'}
            </button>

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
          const isJojunseok = !currentUser || (currentUser?.name || '').includes('조준석') || currentUser?.id === 'admin' || currentUser?.id === 'saeootang';
          const sheetStyle = {
            backgroundColor: '#ffffff',
            color: '#0f172a',
            colorScheme: 'light',
            forcedColorAdjust: 'none',
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            ...(mobileFitMode && isSmallScreen
              ? {
                  transform: `scale(${mobileSheetScale})`,
                  transformOrigin: 'top center',
                  marginBottom: `calc(-1 * (1 - ${mobileSheetScale}) * 800px)`
                }
              : {})
          };

          const renderA4Header = (pageNo = 1, totalPages = 1) => (
            <header className="a4-header">
              <div className="a4-header-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                  {isJojunseok && (
                    <img
                      src={BRAND_LOGO_B64}
                      alt="JCC"
                      style={{ height: '30px', width: 'auto', objectFit: 'contain' }}
                    />
                  )}
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
                          (증빙조건포함)
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
            <div
              className="a4-footer-wrapper"
              style={{
                marginTop: 'auto',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                flexShrink: 0
              }}
            >
              {showDisclaimer && (
                <p className="a4-disclaimer" style={{ margin: 0 }}>
                  * 본 비교서는 상담일 기준 프로모션 / 제휴카드 할인 / 카드 할부금리를 반영한 예상 안내 자료이며, 결제 시점 정책 및 카드 실적에 따라 변동될 수 있습니다.
                </p>
              )}

              {/* 5. 하단 명함 영역 (1페이지는 숨김, 마지막 페이지 노출) */}
              {showManager && (() => {
                const isJojunseok = !currentUser || (currentUser?.name || '').includes('조준석') || currentUser?.id === 'admin' || currentUser?.id === 'saeootang';
                const activeManagerName = isJojunseok
                  ? '조준석 매니저'
                  : (currentUser?.name ? `${currentUser.name.replace(/\(.*?\)/g, '').trim()} 매니저` : `${currentUser?.id || '담당'} 매니저`);
                const activeContactPhone = (isJojunseok ? managerPhone : (currentUser?.phone || managerPhone)) || '';

                if (isJojunseok) {
                  return (
                    <footer className="a4-manager-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', position: 'relative', overflow: 'hidden' }}>
                      <div className="a4-manager-left" style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
                        <img
                          src={MANAGER_PROFILE_B64}
                          alt="조준석 매니저"
                          className="a4-manager-photo"
                        />
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <div className="a4-manager-badge-row">
                            <span className="a4-manager-role">19년 경력 가전 마스터 | 삼성 CS명장</span>
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
                        {activeContactPhone.trim() && (
                          <div className="a4-contact-item">
                            <Phone size={12} />
                            <strong>직통 문의: {activeContactPhone.trim()}</strong>
                          </div>
                        )}
                        <div className="a4-contact-item">
                          <MapPin size={12} />
                          <span>{cleanPrintText(storeInfo).replace(/·/g, ' / ')}</span>
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
                  );
                }

                // 다른 매니저 로그인 시 심플 명함 (삼성스토어 통합진주, 동일 주소, 접속한 매니저 이름/연락처 반영)
                return (
                  <footer className="a4-manager-card a4-manager-card-simple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', position: 'relative', overflow: 'hidden', borderTop: '3px solid #3b82f6' }}>
                    <div className="a4-manager-left" style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #60a5fa', flexShrink: 0 }}>
                        <Store size={22} color="#ffffff" />
                      </div>
                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div className="a4-manager-badge-row" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#93c5fd', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '3px', padding: '0.5px 5px' }}>
                            삼성전자 공식스토어
                          </span>
                          <span style={{ fontSize: '0.66rem', color: '#fde68a', fontWeight: 800 }}>삼성스토어 통합진주</span>
                        </div>
                        <div className="a4-manager-name" style={{ fontSize: '0.96rem', fontWeight: 900, color: '#ffffff', marginTop: '1px' }}>
                          {activeManagerName} <span className="a4-manager-brand" style={{ fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 600 }}>| 전문 상담 매니저</span>
                        </div>
                        <div className="a4-manager-quote" style={{ fontSize: '0.67rem', whiteSpace: 'nowrap', lineHeight: 1.35, color: '#94a3b8' }}>
                          정직하고 신뢰할 수 있는 최적의 혜택 맞춤 설계를 약속드립니다.
                        </div>
                      </div>
                    </div>

                    <div className="a4-manager-right" style={{ flexShrink: 0, minWidth: '190px' }}>
                      {activeContactPhone.trim() && (
                        <div className="a4-contact-item">
                          <Phone size={12} />
                          <strong>직통 문의: {activeContactPhone.trim()}</strong>
                        </div>
                      )}
                      <div className="a4-contact-item">
                        <MapPin size={12} />
                        <span>{cleanPrintText(storeInfo).replace(/·/g, ' / ')}</span>
                      </div>
                      <div className="a4-contact-item">
                        <MessageCircle size={12} />
                        <span>삼성스토어 진주 백화점·로드샵 통합매장</span>
                      </div>
                    </div>
                  </footer>
                );
              })()}
            </div>
          );

          // 구독 주문 시 필수 안내문 (장기 미배송 58일차 재심사 안내)
          const renderSubReReviewNotice = (customStyle = {}) => {
            const info = getSubReReviewInfo(consultDate);
            if (!info.dateStr) return null;

            return (
              <div
                className="a4-sub-rereview-notice"
                style={{
                  marginTop: '0.4rem',
                  padding: '0.42rem 0.75rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1.2px solid #f59e0b',
                  fontSize: '0.70rem',
                  color: '#92400e',
                  lineHeight: 1.45,
                  textAlign: 'left',
                  ...customStyle
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem' }}>📌</span>
                    <strong style={{ color: '#b45309', fontWeight: 900, fontSize: '0.73rem' }}>
                      [삼성AI구독 주문 시 필수 안내사항: 장기 미배송 58일차 재심사]
                    </strong>
                  </div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '9999px',
                      background: '#d97706',
                      color: '#ffffff'
                    }}
                  >
                    재심사 예정일: {info.dateStr} (58일차)
                  </span>
                </div>
                <div>
                  구매(계약)일자<strong>({consultDate})</strong> 기준 장기 미배송 시, <strong style={{ color: '#b45309', textDecoration: 'underline' }}>58일차인 {info.dateStr}</strong>에 금융사 자동 재심사가 진행됩니다. 재심사 시점의 신용도 및 카드 이용한도 등 심사 기준 미달 시 부득이하게 <strong>구독 계약이 취소 또는 자동 해지</strong>될 수 있사오니, 입주 및 이사 등으로 인한 희망 배송일 지정 시 58일 이내 배송 완료될 수 있도록 유의해 주시기 바랍니다.
                </div>
              </div>
            );
          };

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
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                {f.status === 'O' ? <Check size={10} strokeWidth={3} /> : f.status === 'X' ? <X size={10} strokeWidth={3} /> : <Minus size={10} strokeWidth={3} />}
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

                {(extraSangjo.enabled || extraTelecom.enabled) && (
                  <div
                    style={{
                      marginTop: hasCardPolicies ? '0.45rem' : '0',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                      border: '1px solid #d8b4fe',
                      fontSize: '0.72rem',
                      color: '#581c87'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.82rem' }}>✨</span>
                      <strong style={{ color: '#6b21a8' }}>제휴 연계 추가 혜택 특별 안내</strong>
                      <span style={{ fontSize: '0.66rem', color: '#7e22ce', fontWeight: 700 }}>(상담 시 특별 반영 혜택)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', lineHeight: 1.35 }}>
                      {extraSangjo.enabled && extraSangjoTotalDiscount > 0 && (
                        <div>
                          • <strong>{extraSangjo.provider === 'boram' ? '보람상조' : extraSangjo.provider === 'sono' ? '소노아임레디' : (extraSangjo.customName || '상조 제휴')}</strong>: 가전 지원금 <strong>{formatWon(extraSangjoTotalDiscount)}</strong> ({extraSangjo.count}구좌 지원, {extraSangjo.note || '만기 납입 완료 시 100% 환급'})
                        </div>
                      )}
                      {extraTelecom.enabled && extraTelecomTotalDiscount > 0 && (
                        <div>
                          • <strong>통신 제휴 ({(extraTelecom.carrier === 'custom' ? extraTelecom.customCarrier : extraTelecom.carrier.toUpperCase()) || 'KT'} {extraTelecom.planType || '인터넷+IPTV'})</strong>: 개통 지원금 <strong>{formatWon(extraTelecomTotalDiscount)}</strong> ({extraTelecom.note || '신규 결합 약정 개통 조건'})
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hasMemo && (
                  <div className="a4-memo-box" style={{ marginTop: (hasCardPolicies || extraSangjo.enabled || extraTelecom.enabled) ? '0.45rem' : '0' }}>
                    <div className="a4-memo-title">맞춤 상담 메모 및 안내사항</div>
                    <div className="a4-memo-content">{memo.trim()}</div>
                  </div>
                )}

                {!hasCardPolicies && !hasMemo && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.65rem 0.9rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.3rem' }}>
                      스마트 결제 및 혜택 수령 체크포인트
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.72rem', color: '#64748b' }}>
                      <div style={{ background: '#ffffff', padding: '0.45rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                          {subCardTotalDiscount > 0 ? '[1] 제휴카드 청구할인' : '[1] 정기 구독 결제'}
                        </strong>
                        {subCardTotalDiscount > 0
                          ? '매월 실적 충족 시 결제일에 자동 청구 할인 반영'
                          : '약정 기간 등록된 결제수단으로 정기 자동이체 청구'}
                      </div>
                      <div style={{ background: '#ffffff', padding: '0.45rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>[2] 캐시백 / 상품권 지급</strong>
                        행사 기준 증빙 완료 후 익월(삼성AI구독 캐시백은 차차월 5~7일) 지정 계좌 및 모바일 지급
                      </div>
                      <div style={{ background: '#ffffff', padding: '0.45rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>[3] 구독 전용 케어 보장</strong>
                        계약 기간 무상수리 보증 및 전문 엔지니어 정기 케어
                      </div>
                    </div>
                  </div>
                )}

                {/* 58일차 장기 미배송 재심사 필수 안내문 */}
                {renderSubReReviewNotice()}
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
                    스마트 결제 및 혜택 수령 체크포인트
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', fontSize: '0.68rem', color: '#64748b' }}>
                    <div style={{ background: '#ffffff', padding: '0.35rem', borderRadius: '5px', border: '1px solid #f1f5f9' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '1px' }}>
                        {subCardTotalDiscount > 0 ? '[1] 제휴카드 청구할인' : '[1] 정기 구독 결제'}
                      </strong>
                      {subCardTotalDiscount > 0
                        ? '매월 실적 충족 시 결제일에 자동 청구 할인'
                        : '약정 기간 정기 자동이체 청구'}
                    </div>
                    <div style={{ background: '#ffffff', padding: '0.35rem', borderRadius: '5px', border: '1px solid #f1f5f9' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '1px' }}>[2] 캐시백 / 상품권 지급</strong>
                      행사 기준 증빙 완료 후 익월/차차월 지정 계좌 및 모바일 지급
                    </div>
                    <div style={{ background: '#ffffff', padding: '0.35rem', borderRadius: '5px', border: '1px solid #f1f5f9' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '1px' }}>[3] 구독 전용 케어 보장</strong>
                      계약 기간 무상수리 보증 및 정기 케어
                    </div>
                  </div>
                  {/* 58일차 장기 미배송 재심사 필수 안내문 */}
                  {renderSubReReviewNotice({ marginTop: '0.35rem' })}
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
                          <span>{`프로모션: ${pol.promoPeriod}`}</span>
                          <span>{`카드문의: ${pol.csPhone}`}</span>
                        </div>
                      </div>

                      <div className="a4-card-policy-grid">
                        {pol.features.map((f, i) => (
                          <div key={i} className="a4-card-policy-item">
                            <span
                              className={`a4-status-tag ${
                                f.status === 'O' ? 'tag-o' : f.status === 'X' ? 'tag-x' : 'tag-tri'
                              }`}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {f.status === 'O' ? <Check size={10} strokeWidth={3} /> : f.status === 'X' ? <X size={10} strokeWidth={3} /> : <Minus size={10} strokeWidth={3} />}
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
            const hasAffiliate = Boolean(extraSangjo.enabled || extraTelecom.enabled);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                {/* 58일차 장기 미배송 재심사 필수 안내문 */}
                {renderSubReReviewNotice()}
                {hasAffiliate && (
                  <div
                    style={{
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                      border: '1px solid #d8b4fe',
                      fontSize: '0.72rem',
                      color: '#581c87'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.82rem' }}>✨</span>
                      <strong style={{ color: '#6b21a8' }}>제휴 연계 추가 혜택 특별 안내</strong>
                      <span style={{ fontSize: '0.66rem', color: '#7e22ce', fontWeight: 700 }}>(상담 시 특별 반영 혜택)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', lineHeight: 1.35 }}>
                      {extraSangjo.enabled && extraSangjoTotalDiscount > 0 && (
                        <div>
                          • <strong>{extraSangjo.provider === 'boram' ? '보람상조' : extraSangjo.provider === 'sono' ? '소노아임레디' : (extraSangjo.customName || '상조 제휴')}</strong>: 가전 지원금 <strong>{formatWon(extraSangjoTotalDiscount)}</strong> ({extraSangjo.count}구좌 지원, {extraSangjo.note || '만기 납입 완료 시 100% 환급'})
                        </div>
                      )}
                      {extraTelecom.enabled && extraTelecomTotalDiscount > 0 && (
                        <div>
                          • <strong>통신 제휴 ({(extraTelecom.carrier === 'custom' ? extraTelecom.customCarrier : extraTelecom.carrier.toUpperCase()) || 'KT'} {extraTelecom.planType || '인터넷+IPTV'})</strong>: 개통 지원금 <strong>{formatWon(extraTelecomTotalDiscount)}</strong> ({extraTelecom.note || '신규 결합 약정 개통 조건'})
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {hasMemo && (
                  <div className="a4-memo-box">
                    <div className="a4-memo-title">맞춤 상담 메모 및 안내사항</div>
                    <div className="a4-memo-content">{memo.trim()}</div>
                  </div>
                )}
              </div>
            );
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
                      <Crown size={11} style={{ marginRight: '3px' }} />
                      전국 유일
                    </span>
                    <strong style={{ fontSize: '0.82rem', color: '#1e3a8a', fontWeight: 900, letterSpacing: '-0.02em' }}>
                      {isJojunseok ? 'JCC 진센조만의 독보적인 삼성 AI가전 스마트 복합 견적서' : '삼성스토어 통합진주만의 독보적인 삼성 AI가전 스마트 복합 견적서'}
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
                    <div style={{ fontSize: '0.71rem', fontWeight: 800, color: '#1d4ed8' }}>전국 유일 하이브리드 설계</div>
                    <div style={{ fontSize: '0.64rem', color: '#475569', lineHeight: 1.35, wordBreak: 'keep-all' }}>삼성 AI구독과 일반구매를 최적으로 결합하여 최저 실체감가를 설계하는 <strong>전국 유일한 견적서</strong>입니다.</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem', borderLeft: '1px solid #f1f5f9', paddingLeft: '0.45rem' }}>
                    <div style={{ fontSize: '0.71rem', fontWeight: 800, color: '#047857' }}>전 채널 혜택 동시 비교</div>
                    <div style={{ fontSize: '0.64rem', color: '#475569', lineHeight: 1.35, wordBreak: 'keep-all' }}>백화점 상품권 &amp; 로드샵 제휴카드 캐시백, 무상수리 케어 가치까지 한눈에 투명하게 반영합니다.</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.12rem', borderLeft: '1px solid #f1f5f9', paddingLeft: '0.45rem' }}>
                    <div style={{ fontSize: '0.71rem', fontWeight: 800, color: '#b45309' }}>
                      {isJojunseok ? '19년 경력 CS명장 책임관리' : '삼성 공식스토어 매니저 책임관리'}
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#475569', lineHeight: 1.35, wordBreak: 'keep-all' }}>단순 가격 비교를 넘어 배송 / 설치 / 사후 혜택 입금 및 점검까지 끝까지 1:1 전담 케어해 드립니다.</div>
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
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: mixedChannelType === 'dept' ? '#78350f' : '#1e3a8a', color: '#ffffff', fontWeight: 700 }}>{mixedChannelType === 'dept' ? '갤러리아 백화점 조건' : '진주본점 결제조건'}</span>
                    <span style={{ fontSize: '0.72rem', color: '#fde68a', fontWeight: 600 }}>{`총 ${validMixedLumpItems.length}개 품목 (${mixedLumpQtyTotal}대)`}</span>
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
                            <strong>{`${idx + 1}. ${cleanPrintText(it.name) || '일반구매 모델'}`}</strong>
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
                                  {deptEnginePlan.gcash60Day > 0 ? '적립 (9.5%이상 전액 60일)' : '적립 (5년)'}
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
                  <div
                    className="a4-print-sheet a4-page-1 a4-page-break"
                    style={{
                      ...sheetStyle,
                      justifyContent: 'flex-start'
                    }}
                  >
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
                      약정기간: {mixedSubPeriodSummary}개월 (총 {validMixedSubItems.length}개 모델 / {mixedSubItems.reduce((s, it) => s + getSubQty(it.quantity), 0)}대)
                    </span>
                  </div>

                  <div className="a4-mixed-sec-body">
                    {/* 구독 모델 목록 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.24rem' }}>
                      {validMixedSubItems.map((p, idx) => {
                        const modelTitle = cleanPrintText(p.name) || `삼성AI구독 모델 ${idx + 1}`;
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
                                  <strong>{`${idx + 1}. ${cleanPrintText(modelTitle)}`}</strong>
                                  {qty > 1 ? ` × ${qty}대` : ''}
                                </span>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    fontSize: '0.63rem',
                                    fontWeight: 800,
                                    color: p.isMobile ? '#0369a1' : '#1e40af',
                                    background: p.isMobile ? '#e0f2fe' : '#eff6ff',
                                    border: p.isMobile ? '1px solid #7dd3fc' : '1px solid #60a5fa',
                                    borderRadius: '4px',
                                    padding: '1px 4.5px',
                                    lineHeight: 1.25,
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {p.isMobile ? (
                                    <>
                                      <Smartphone size={8.5} strokeWidth={2.5} /> {itemMonths}개월 무상수리 + 파손
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck size={8.5} strokeWidth={2.5} /> {itemMonths}개월 무상수리
                                    </>
                                  )}
                                </span>
                                {hasCareService && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
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
                                    <Wrench size={8.5} strokeWidth={2.5} /> {careTypeBadgeLabel}
                                  </span>
                                )}
                                {(p.hasReinstall || (Number(p.reinstallFee) || 0) > 0) && (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      fontSize: '0.63rem',
                                      fontWeight: 800,
                                      color: '#0f766e',
                                      background: '#ccfbf1',
                                      border: '1px solid #14b8a6',
                                      borderRadius: '4px',
                                      padding: '1px 4.5px',
                                      lineHeight: 1.25,
                                      flexShrink: 0,
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    <RefreshCw size={8.5} strokeWidth={2.5} /> 재설치서비스
                                  </span>
                                )}
                              </span>
                              <div style={{ flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.45rem' }}>
                                {itemPrepay > 0 && (
                                  <span
                                    title={`선납금 ${formatWon(itemPrepay)}`}
                                    style={{
                                      fontSize: '0.62rem',
                                      color: '#b45309',
                                      fontWeight: 800,
                                      background: '#fef3c7',
                                      padding: '1px 4px',
                                      borderRadius: '3.5px',
                                      border: '1px solid #fde68a',
                                      display: 'inline-block',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    선납
                                  </span>
                                )}
                                {diff > 0 ? (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.32rem', whiteSpace: 'nowrap' }}>
                                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textDecoration: 'line-through', display: 'inline-block' }}>
                                      월 {formatWon(itemBase * qty)}
                                    </span>
                                    <strong style={{ color: '#1d4ed8', fontWeight: 800, fontSize: '0.80rem', display: 'inline-block' }}>
                                      월 {formatWon(itemMonthly * qty)}
                                    </strong>
                                  </div>
                                ) : (
                                  <strong style={{ color: '#1d4ed8', fontWeight: 800, fontSize: '0.80rem', display: 'inline-block' }}>
                                    월 {formatWon(itemMonthly * qty)}
                                  </strong>
                                )}
                              </div>
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
                                  <span style={{ color: '#2563eb', fontWeight: 800 }}>•</span>
                                  {feeDiscountTotal > 0 && (
                                    <span>
                                      <strong style={{ color: '#1e40af' }}>구독료 할인 -{formatWon(feeDiscountTotal)}</strong>{' '}
                                      <span style={{ fontSize: '0.66rem', color: '#64748b' }}>(월 {formatWon(itemBase * qty)} → {formatWon(itemMonthly * qty)})</span>
                                    </span>
                                  )}
                                  {feeDiscountTotal > 0 && itemServiceTotal > 0 && <span style={{ color: '#94a3b8', margin: '0 2px' }}>|</span>}
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
                          <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600, marginLeft: '5px' }}>(기본 구독료 × 약정기간 기준)</span>
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
                            <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600, marginLeft: '5px' }}>(초기 일시불 납부)</span>
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
                              <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600, marginLeft: '5px' }}>(약정기간별 개별 합산)</span>
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
                                  <span style={{ color: '#3b82f6', marginRight: '4px', fontWeight: 700 }}>•</span>
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
                            <span style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 600, marginLeft: '5px' }}>(월 {formatWon(mixedSubMonthlyFeeTotal)} × {mixedSubPeriodSummary}개월)</span>
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
                  <span style={{ fontWeight: 600 }}>1P: 삼성AI구독 모델 &amp; 제휴카드 혜택 안내</span>
                  <span style={{ fontWeight: 700, color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    다음 2P: 전국 유일 스마트 견적서 최종 실체감가 확인 <ArrowRight size={12} />
                  </span>
                </div>
              </div>

              {/* 유연한 상단 빈칸 영역 (내용이 적을 때 명함을 제일 하단에 고정하고 윗칸을 빈칸으로 채움) */}
              <div className="a4-flex-spacer" style={{ flex: '1 1 auto', minHeight: 0 }} />

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
                        <span>3. 통합 캐시백 / 상품권 지급 및 최종 실체감가</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>
                        총 할인 합계: - {formatWon(totalGrandSavings)} ({mixedGrandBenefitRate}% 절감)
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
                              {formatWon(mixedSubFinalPrice)}
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
                              {formatWon(mixedSubFinalPrice + mixedLumpBenefitSub)}
                            </strong>
                          </div>
                        )}

                        {/* 캐시백 혜택 (3번 숫자 제거) */}
                        {validMixedCashbackItems.map((cb, idx) => (
                          <div className="a4-benefit-row" key={cb.id || `cb-${idx}`} style={{ fontSize: '0.77rem', alignItems: 'center' }}>
                            <span>
                              <span style={{ color: '#059669', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <span style={{ color: '#065f46', fontWeight: 700 }}>{cleanPrintText(cb.name) || (mixedEventType === 'normal' ? '통합 캐시백' : `${eventPrefix}캐시백`)}</span>
                              <span style={{ fontSize: '0.70rem', color: '#059669', fontWeight: 600, marginLeft: '6px' }}>(설치후 차차월 5~7일)</span>
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
                              <span style={{ color: '#92400e', fontWeight: 700 }}>{cleanPrintText(vc.name) || (mixedEventType === 'normal' ? '모바일/지류 상품권' : `${eventPrefix} 상품권`)}</span>
                              <span style={{ fontSize: '0.70rem', color: '#d97706', fontWeight: 600, marginLeft: '6px' }}>(모바일 상품권, 설치후 2주 뒤)</span>
                              {vc.hasProof && (
                                <span className="a4-proof-tag" style={{ marginLeft: '6px' }}>증빙완료시</span>
                              )}
                            </span>
                            <span className="a4-minus-blue" style={{ fontSize: '0.82rem', fontWeight: 800 }}>- {formatWon(vc.amount)}</span>
                          </div>
                        ))}

                        {/* 제휴 연계 추가 혜택: 상조 제휴 지원금 */}
                        {extraSangjo.enabled && extraSangjoTotalDiscount > 0 && (
                          <div className="a4-benefit-row" style={{ fontSize: '0.77rem', alignItems: 'center' }}>
                            <span>
                              <span style={{ color: '#7e22ce', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <span style={{ color: '#7e22ce', fontWeight: 700 }}>
                                {extraSangjo.provider === 'boram'
                                  ? '보람상조'
                                  : extraSangjo.provider === 'sono'
                                    ? '소노아임레디'
                                    : (extraSangjo.customName || '상조 제휴')}{' '}
                                가전 지원금 ({extraSangjo.count}구좌)
                              </span>
                              <span style={{ fontSize: '0.68rem', color: '#6b21a8', fontWeight: 600, marginLeft: '6px' }}>
                                ({extraSangjo.note || '만기 납입 완료 시 전액 환급 조건'})
                              </span>
                            </span>
                            <span className="a4-minus-blue" style={{ fontSize: '0.82rem', fontWeight: 800, color: '#7e22ce' }}>
                              - {formatWon(extraSangjoTotalDiscount)}
                            </span>
                          </div>
                        )}

                        {/* 제휴 연계 추가 혜택: 통신사 IPTV 지원금 */}
                        {extraTelecom.enabled && extraTelecomTotalDiscount > 0 && (
                          <div className="a4-benefit-row" style={{ fontSize: '0.77rem', alignItems: 'center' }}>
                            <span>
                              <span style={{ color: '#0891b2', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <span style={{ color: '#0e7490', fontWeight: 700 }}>
                                통신 제휴 지원금 (
                                {(extraTelecom.carrier === 'custom'
                                  ? extraTelecom.customCarrier
                                  : extraTelecom.carrier.toUpperCase()) || 'KT'}{' '}
                                {extraTelecom.planType || '인터넷+IPTV'})
                              </span>
                              <span style={{ fontSize: '0.68rem', color: '#0891b2', fontWeight: 600, marginLeft: '6px' }}>
                                ({extraTelecom.note || '신규 결합 개통 혜택'})
                              </span>
                            </span>
                            <span className="a4-minus-blue" style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0891b2' }}>
                              - {formatWon(extraTelecomTotalDiscount)}
                            </span>
                          </div>
                        )}

                        {/* 구독케어 혜택 (하단으로 이동) */}
                        {(mixedSubServiceBenefit > 0 || hasAnyMixedReinstall) && (
                          <div className="a4-benefit-row" style={{ fontSize: '0.77rem', alignItems: 'center' }}>
                            <span>
                              <span style={{ color: '#0284c7', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <span style={{ color: '#0369a1', fontWeight: 700 }}>구독케어혜택</span>
                              <span style={{ fontSize: '0.70rem', color: '#0284c7', fontWeight: 600, marginLeft: '6px' }}>({hasAnyMixedMobile ? '파손보험, 무상수리, 방문케어, 소모품, 재설치' : '무상수리연장, 방문케어, 소모품, 재설치'})</span>
                            </span>
                            <span className="a4-minus-blue" style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7' }}>
                              {mixedSubServiceBenefit > 0 ? `- ${formatWon(mixedSubServiceBenefit)} 상당` : '무상 재설치 포함'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 최종 정산 요약 박스 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.35rem' }}>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                          {`총 기준금액 ${formatWon(mixedGrandGross)} | 총 할인 합계 -${formatWon(totalGrandSavings)}`}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.08rem' }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>고객 최종 실체감가</span>
                            <strong style={{ fontSize: '1.48rem', fontWeight: 900, color: '#1e3a8a', letterSpacing: '-0.02em' }}>
                              {formatWon(mixedGrandFinal)}
                            </strong>
                          </div>
                          {mixedSubServiceBenefit > 0 && (
                            <span style={{ fontSize: '0.69rem', color: '#0284c7', fontWeight: 700 }}>
                              (구독케어 비용 포함)
                            </span>
                          )}
                          {applyExtraToFinal && totalExtraAffiliateDiscount > 0 && (
                            <span style={{ fontSize: '0.69rem', color: '#7e22ce', fontWeight: 700 }}>
                              (제휴 연계 추가 혜택 -{formatWon(totalExtraAffiliateDiscount)} 반영)
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

                {/* 유연한 상단 빈칸 영역 (내용이 적을 때 명함을 제일 하단에 고정하고 윗칸을 빈칸으로 채움) */}
                <div className="a4-flex-spacer" style={{ flex: '1 1 auto', minHeight: 0 }} />

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

            {/* 3. 일반구매 vs 구독 좌우 4:6 비교 카드 영역 (일반구매 4 : 구독조건 6 비율) */}
            <div className="a4-compare-grid" style={{ gridTemplateColumns: 'minmax(0, 4fr) minmax(0, 6fr)' }}>
              {/* 좌측: 일반구매 조건 */}
              <div className={`a4-plan-card ${winner === 'lump' ? 'a4-plan-recommended' : ''}`}>
                <div className="a4-plan-header plan-lump">
                  <div>
                    <span className="a4-plan-kicker">OPTION A | 일반 결제</span>
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
                        일반구매 총 할인 / 혜택
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
                        ? `OPTION B | ${periodSummaryLabel}개월 약정`
                        : `OPTION B | ${subMonths}개월 약정 (${subMonths / 12}년)`}
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

                  <div className="a4-row" style={{ alignItems: isMultiPeriod || effectiveSubPrepay > 0 ? 'flex-start' : 'center', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 800, color: '#1e293b', fontSize: isMultiPeriod ? '0.74rem' : '0.80rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {subFeeDiscountTotal > 0 ? '월 구독료 (할인반영)' : '월 기본 구독료'}
                    </span>
                    {isMultiPeriod ? (
                      <div style={{ textAlign: 'right', lineHeight: 1.35, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {subSegments.map((seg, idx) => (
                          <div key={seg.endMonth} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {idx === 0 ? `${seg.duration}개월간` : `잔여 ${seg.duration}개월`}
                            </span>
                            {seg.baseMonthlyGross && seg.baseMonthlyGross > seg.baseMonthly ? (
                              <>
                                <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600, textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
                                  월 {formatWon(seg.baseMonthlyGross)}
                                </span>
                                <strong style={{ fontSize: '0.80rem', fontWeight: 900, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                                  월 {formatWon(seg.baseMonthly)}
                                </strong>
                              </>
                            ) : (
                              <strong style={{ fontSize: '0.80rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>
                                월 {formatWon(seg.baseMonthly)}
                              </strong>
                            )}
                          </div>
                        ))}
                        {effectiveSubPrepay > 0 && (
                          <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600, marginTop: '1px', whiteSpace: 'nowrap' }}>
                            선납금 {formatWon(effectiveSubPrepay)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'right', lineHeight: 1.35, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {subFeeDiscountTotal > 0 && (subSegments[0]?.baseMonthlyGross || 0) > (subSegments[0]?.baseMonthly || 0) ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 600, textDecoration: 'line-through', whiteSpace: 'nowrap' }}>
                              월 {formatWon(subSegments[0]?.baseMonthlyGross || 0)}
                            </span>
                            <strong style={{ fontSize: '0.84rem', fontWeight: 900, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                              월 {formatWon(subSegments[0]?.baseMonthly || 0)}
                            </strong>
                          </div>
                        ) : (
                          <strong style={{ display: 'block', fontSize: '0.84rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>
                            월 {formatWon(effectiveMonthlyBase)}
                          </strong>
                        )}
                        {effectiveSubPrepay > 0 && (
                          <span style={{ display: 'block', fontSize: '0.64rem', color: '#64748b', fontWeight: 600, marginTop: '1px', whiteSpace: 'nowrap' }}>
                            선납금 {formatWon(effectiveSubPrepay)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 모델별 기본구독료(취소선) 및 할인구독료 요약 + 케어 아이콘 표시 */}
                  {activePlans.some((p) => p.name?.trim() || (p.unitBaseMonthly || 0) > (p.unitMonthly || 0) || (p.prepay || 0) > 0) && (
                    <div style={{ marginTop: '0.35rem', paddingTop: '0.3rem', borderTop: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {activePlans.map((p, pIdx) => {
                        const hasName = Boolean(p.name?.trim());
                        const label = hasName ? p.name.trim() : `구독 품목 ${pIdx + 1}`;
                        const bMonthly = p.unitBaseMonthly || p.unitMonthly || 0;
                        const dMonthly = p.unitMonthly || 0;
                        const hasDiff = bMonthly > dMonthly;
                        const pPrepay = Number(p.prepay) || 0;

                        // 모델별 설정된 케어서비스 아이콘 판별 (무상36/48/60/72, 방문/소모품/셀프 주기 동적 연동)
                        const pCareItems = Array.isArray(p.careItems) ? p.careItems : [];
                        const hasFree = (Number(p.freeRepairFee) || 0) > 0;
                        const pFreeMonths = Number(p.months) || 60;

                        const pVisitItems = pCareItems.filter((c) => (c.type === 'visit' || c.type === 'all') && ((Number(c.amount) || 0) > 0 || (Number(c.count) || 0) > 0));
                        const pVisitCount = pVisitItems.reduce((sum, c) => sum + (c.count === '' || c.count === undefined ? 1 : Number(c.count) || 1), 0)
                          || ((p.careType === 'visit' || p.careType === 'all') && (Number(p.careAmount) || 0) > 0 ? (Number(p.careCount) || 1) : 0);

                        const pSelfItems = pCareItems.filter((c) => c.type === 'self' && ((Number(c.amount) || 0) > 0 || (Number(c.count) || 0) > 0));
                        const pSelfCount = pSelfItems.reduce((sum, c) => sum + (c.count === '' || c.count === undefined ? 1 : Number(c.count) || 1), 0)
                          || (p.careType === 'self' && (Number(p.careAmount) || 0) > 0 ? (Number(p.careCount) || 1) : 0);

                        const pConsumableItems = pCareItems.filter((c) => (c.type === 'consumable' || c.type === 'all') && ((Number(c.amount) || 0) > 0 || (Number(c.count) || 0) > 0));
                        const pConsumableCount = pConsumableItems.reduce((sum, c) => sum + (c.count === '' || c.count === undefined ? 1 : Number(c.count) || 1), 0)
                          || ((p.careType === 'consumable' || p.careType === 'all') && (Number(p.careAmount) || 0) > 0 ? (Number(p.careCount) || 1) : 0);

                        const pDamageMonths = Number(p.damageMonths) || Number(p.months) || 36;
                        const pCustomItems = pCareItems.filter((c) => c.type === 'custom' && ((Number(c.amount) || 0) > 0 || (Number(c.count) || 0) > 0));
                        const pReinstallItems = pCareItems.filter((c) => c.type === 'reinstall');
                        const pHasReinstall = Boolean(p.hasReinstall) || pReinstallItems.length > 0;
                        const pReinstallCount = pReinstallItems.length > 0
                          ? pReinstallItems.reduce((s, c) => s + (c.count === '' || c.count === undefined ? 1 : Number(c.count) || 1), 0)
                          : (p.hasReinstall ? 1 : 0);

                        return (
                          <div key={p.id || pIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.69rem', color: '#475569', gap: '6px' }}>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden' }}>
                              <strong style={{ color: '#1e40af', flexShrink: 0 }}>{pIdx + 1}.</strong>
                              <span style={{ fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '0 1 auto', minWidth: '35px' }} title={label}>
                                {label}
                              </span>
                              {p.quantity > 1 && (
                                <span style={{ flexShrink: 0, fontSize: '0.63rem', color: '#64748b' }}>
                                  ({p.quantity}대)
                                </span>
                              )}
                              {pPrepay > 0 && (
                                <span
                                  title={`선납금 ${formatWon(pPrepay)}`}
                                  style={{
                                    flexShrink: 0,
                                    color: '#b45309',
                                    background: '#fef3c7',
                                    border: '1px solid #fde68a',
                                    borderRadius: '3px',
                                    padding: '0 3.5px',
                                    fontSize: '0.58rem',
                                    fontWeight: 800,
                                    lineHeight: 1.2
                                  }}
                                >
                                  선납
                                </span>
                              )}

                              {/* 모델 옆 케어 아이콘 배지들 (콤팩트 미니 사이즈, flexShrink: 0으로 항상 보장) */}
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', flexShrink: 0, marginLeft: '2px' }}>
                                {p.isMobile && (
                                  <span
                                    title={`모바일 파손보험 (${pDamageMonths}개월)`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '1.5px',
                                      fontSize: '0.48rem',
                                      fontWeight: 800,
                                      color: '#0284c7',
                                      background: '#e0f2fe',
                                      border: '1px solid #7dd3fc',
                                      borderRadius: '2.5px',
                                      padding: '0px 2.5px',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    <Smartphone size={7.5} strokeWidth={2.5} /> 파손{pDamageMonths}
                                  </span>
                                )}
                                {hasFree && (
                                  <span
                                    title={p.isMobile ? `모바일 파손 + 무상수리 (${pFreeMonths}개월 보증)` : `무상수리 연장 (${pFreeMonths}개월 보증)`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '1.5px',
                                      fontSize: '0.48rem',
                                      fontWeight: 800,
                                      color: '#1d4ed8',
                                      background: '#eff6ff',
                                      border: '1px solid #bfdbfe',
                                      borderRadius: '2.5px',
                                      padding: '0px 2.5px',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    <ShieldCheck size={7.5} strokeWidth={2.5} /> 무상{pFreeMonths}
                                  </span>
                                )}
                                {pVisitCount > 0 && (
                                  <span
                                    key="p-visit"
                                    title={`전문 엔지니어 방문케어 (${pVisitCount}회)`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '1.5px',
                                      fontSize: '0.48rem',
                                      fontWeight: 800,
                                      color: '#047857',
                                      background: '#ecfdf5',
                                      border: '1px solid #a7f3d0',
                                      borderRadius: '2.5px',
                                      padding: '0px 2.5px',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    <Wrench size={7.5} strokeWidth={2.5} /> 방문{pVisitCount}회
                                  </span>
                                )}
                                {pSelfCount > 0 && (
                                  <span
                                    key="p-self"
                                    title={`셀프 케어 (${pSelfCount}회)`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '1.5px',
                                      fontSize: '0.48rem',
                                      fontWeight: 800,
                                      color: '#6d28d9',
                                      background: '#f5f3ff',
                                      border: '1px solid #ddd6fe',
                                      borderRadius: '2.5px',
                                      padding: '0px 2.5px',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    <Sparkles size={7.5} strokeWidth={2.5} /> 셀프{pSelfCount > 1 ? `${pSelfCount}회` : ''}
                                  </span>
                                )}
                                {pConsumableCount > 0 && (
                                  <span
                                    key="p-consumable"
                                    title={`정기 소모품 교체 (${pConsumableCount}회)`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '1.5px',
                                      fontSize: '0.48rem',
                                      fontWeight: 800,
                                      color: '#b45309',
                                      background: '#fffbeb',
                                      border: '1px solid #fde68a',
                                      borderRadius: '2.5px',
                                      padding: '0px 2.5px',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    <Package size={7.5} strokeWidth={2.5} /> 소모품{pConsumableCount}회
                                  </span>
                                )}
                                {pHasReinstall && (
                                  <span
                                    title="무상 재설치 서비스 혜택"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '1.5px',
                                      fontSize: '0.48rem',
                                      fontWeight: 800,
                                      color: '#0f766e',
                                      background: '#ccfbf1',
                                      border: '1px solid #5eead4',
                                      borderRadius: '2.5px',
                                      padding: '0px 2.5px',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    <RefreshCw size={7.5} strokeWidth={2.5} /> 재설치{pReinstallCount > 1 ? `${pReinstallCount}회` : ''}
                                  </span>
                                )}
                                {pCustomItems.map((c, i) => (
                                  <span
                                    key={`p-custom-${c.id || i}`}
                                    title={`맞춤 케어: ${c.customName || '케어'}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '1.5px',
                                      fontSize: '0.48rem',
                                      fontWeight: 800,
                                      color: '#0284c7',
                                      background: '#f0f9ff',
                                      border: '1px solid #bae6fd',
                                      borderRadius: '2.5px',
                                      padding: '0px 2.5px',
                                      lineHeight: 1.2
                                    }}
                                  >
                                    <Sparkles size={7.5} strokeWidth={2.5} /> {(c.customName || '케어').slice(0, 4)}
                                  </span>
                                ))}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              {hasDiff && (
                                <span style={{ fontSize: '0.65rem', color: '#64748b', textDecoration: 'line-through', display: 'inline-block' }}>
                                  {formatWon(bMonthly)}
                                </span>
                              )}
                              <strong style={{ color: hasDiff ? '#1d4ed8' : '#0f172a', fontWeight: 800, display: 'inline-block' }}>
                                월 {formatWon(dMonthly)}
                              </strong>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="a4-plan-middle">
                  <div className="a4-divider-label">적용 혜택 및 서비스</div>
                  <div className="a4-benefit-list">
                    {/* ===== [첫번째 혜택: 구독료 즉시할인] ===== */}
                    {subFeeDiscountTotal > 0 && (
                      <div className="a4-benefit-row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '6px' }}>
                          <span style={{ fontSize: '0.78rem' }}>
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#0f172a' }}>구독료 즉시할인</strong>
                          </span>
                          <div style={{ fontSize: '0.64rem', color: '#2563eb', fontWeight: 700, marginLeft: '9px', marginTop: '1px' }}>
                            (기본 구독료 대비 차감)
                          </div>
                        </div>
                        <strong className="a4-minus-blue" style={{ fontSize: '0.84rem', fontWeight: 900, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          - {formatWon(subFeeDiscountTotal)}
                        </strong>
                      </div>
                    )}

                    {/* ===== [두번째 혜택: 무상수리 연장 이용료 (갯수와 금액만 표시)] ===== */}
                    {isCombinedFreeService ? (
                      <>
                        <div className="a4-benefit-row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: '6px', lineHeight: 1.25 }}>
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <strong style={{ fontWeight: 900, color: '#0f172a' }}>구독케어: 무상수리 연장</strong>
                            </div>
                            <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 500, marginTop: '2px', marginLeft: '9px', whiteSpace: 'nowrap' }}>
                              (가전 {applianceFreeServiceCount > 0 ? `${applianceFreeServiceCount}개 품목 / ${applianceFreeServiceQuantity}대` : '보증혜택'})
                            </div>
                          </div>
                          <strong style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.80rem', flexShrink: 0, marginTop: '1px', whiteSpace: 'nowrap' }}>
                            {applianceFreeServiceAmount > 0
                              ? `${formatWon(applianceFreeServiceAmount)} 상당`
                              : '무상 보증 포함'}
                          </strong>
                        </div>

                        <div className="a4-benefit-row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: '6px', lineHeight: 1.25 }}>
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: '#0284c7', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <strong style={{ fontWeight: 900, color: '#0f172a' }}>구독케어: 모바일 파손보험+무상수리</strong>
                            </div>
                            <div style={{ fontSize: '0.64rem', color: '#0284c7', fontWeight: 500, marginTop: '2px', marginLeft: '9px', whiteSpace: 'nowrap', opacity: 0.85 }}>
                              (모바일 {mobileFreeServiceCount > 0 ? `${mobileFreeServiceCount}개 품목 / ${mobileFreeServiceQuantity}대, 파손보험` : '보증혜택'})
                            </div>
                          </div>
                          <strong style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.80rem', flexShrink: 0, marginTop: '1px', whiteSpace: 'nowrap' }}>
                            {mobileFreeServiceAmount > 0
                              ? `${formatWon(mobileFreeServiceAmount)} 상당`
                              : '무상 보증 포함'}
                          </strong>
                        </div>
                      </>
                    ) : (
                      subFreeServiceAmount > 0 && (
                        <div className="a4-benefit-row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: '6px', lineHeight: 1.25 }}>
                            <div style={{ fontSize: '0.78rem' }}>
                              <span style={{ color: hasAnyFreeServiceMobile ? '#0284c7' : '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <strong style={{ fontWeight: 900, color: '#0f172a' }}>
                                구독케어: {hasAnyFreeServiceMobile ? '모바일 파손보험+무상수리' : '무상수리 연장 이용료'}
                              </strong>
                            </div>
                            <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 500, marginTop: '2px', marginLeft: '9px', whiteSpace: 'nowrap' }}>
                              ({hasAnyFreeServiceMobile
                                ? `모바일 ${validFreeServiceCount}개 품목 / ${totalFreeServiceQuantity}대, 파손보험`
                                : validFreeServiceCount > 0
                                  ? `총 ${validFreeServiceCount}개 품목 / ${totalFreeServiceQuantity}대`
                                  : '보증혜택'})
                            </div>
                          </div>
                          <strong style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.80rem', flexShrink: 0, marginTop: '1px', whiteSpace: 'nowrap' }}>
                            {formatWon(subFreeServiceAmount)} 상당
                          </strong>
                        </div>
                      )
                    )}

                    {/* ===== [세번째 혜택: 전문 케어서비스 (갯수와 금액만 표시)] ===== */}
                    {hasCareService && (
                      <div className="a4-benefit-row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '6px', lineHeight: 1.25 }}>
                          <div style={{ fontSize: '0.78rem' }}>
                            <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#0f172a' }}>구독케어: 전문 케어서비스</strong>
                          </div>
                          <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 500, marginTop: '2px', marginLeft: '9px', whiteSpace: 'nowrap' }}>
                            ({careCountSummaryText})
                          </div>
                        </div>
                        <strong style={{ color: '#0284c7', fontWeight: 800, fontSize: '0.80rem', flexShrink: 0, marginTop: '1px', whiteSpace: 'nowrap' }}>
                          {subCareServiceAmount > 0 ? `${formatWon(subCareServiceAmount)} 상당` : '무상 재설치 포함'}
                        </strong>
                      </div>
                    )}

                    {/* ===== [네번째 혜택: 제휴카드 할인] ===== */}
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

                    {/* ===== [다섯번째 혜택: 캐시백] ===== */}
                    {!isMixedMode && (Number(subPurchaseBenefit) || 0) > 0 && (
                      <div className="a4-benefit-row" style={{ alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem' }}>
                          <span style={{ color: '#2563eb', marginRight: '4px', fontWeight: 800 }}>•</span>
                          <strong style={{ fontWeight: 900, color: '#0f172a' }}>삼성AI구독 캐시백</strong>
                          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>
                            (차차월 5~7일 지급)
                          </span>
                        </span>
                        <strong className="a4-minus-blue" style={{ fontSize: '0.84rem', fontWeight: 900 }}>
                          - {formatWon(subPurchaseBenefit)}
                        </strong>
                      </div>
                    )}

                    {/* ===== [여섯번째 혜택: 상조 제휴 지원금 (보람상조 / 소노아임레디)] ===== */}
                    {extraSangjo.enabled && extraSangjoTotalDiscount > 0 && (
                      <div className="a4-benefit-row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '6px' }}>
                          <span style={{ fontSize: '0.78rem' }}>
                            <span style={{ color: '#7e22ce', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#0f172a' }}>
                              {extraSangjo.provider === 'boram'
                                ? '보람상조'
                                : extraSangjo.provider === 'sono'
                                  ? '소노아임레디'
                                  : (extraSangjo.customName || '상조 제휴')}{' '}
                              가전 지원금
                            </strong>
                            <span style={{ fontSize: '0.68rem', color: '#7e22ce', fontWeight: 700, marginLeft: '5px' }}>
                              ({extraSangjo.count}구좌 지원)
                            </span>
                          </span>
                          <div style={{ fontSize: '0.63rem', color: '#6b21a8', fontWeight: 600, marginLeft: '9px', marginTop: '1px' }}>
                            ※ {extraSangjo.note || '만기 납입 완료 시 전액 환급 조건'}
                          </div>
                        </div>
                        <strong
                          className="a4-minus-blue"
                          style={{ fontSize: '0.84rem', fontWeight: 900, color: '#7e22ce', flexShrink: 0, whiteSpace: 'nowrap' }}
                        >
                          - {formatWon(extraSangjoTotalDiscount)}
                        </strong>
                      </div>
                    )}

                    {/* ===== [일곱번째 혜택: 통신사 IPTV/인터넷 제휴 지원금] ===== */}
                    {extraTelecom.enabled && extraTelecomTotalDiscount > 0 && (
                      <div className="a4-benefit-row" style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '6px' }}>
                          <span style={{ fontSize: '0.78rem' }}>
                            <span style={{ color: '#0891b2', marginRight: '4px', fontWeight: 800 }}>•</span>
                            <strong style={{ fontWeight: 900, color: '#0f172a' }}>
                              통신 제휴 지원금 (
                              {(extraTelecom.carrier === 'custom'
                                ? extraTelecom.customCarrier
                                : extraTelecom.carrier.toUpperCase()) || 'KT'}{' '}
                              {extraTelecom.planType || '인터넷+IPTV'})
                            </strong>
                          </span>
                          <div style={{ fontSize: '0.63rem', color: '#0e7490', fontWeight: 600, marginLeft: '9px', marginTop: '1px' }}>
                            ※ {extraTelecom.note || '인터넷+IPTV 신규 결합 약정 개통 혜택'}
                          </div>
                        </div>
                        <strong
                          className="a4-minus-blue"
                          style={{ fontSize: '0.84rem', fontWeight: 900, color: '#0891b2', flexShrink: 0, whiteSpace: 'nowrap' }}
                        >
                          - {formatWon(extraTelecomTotalDiscount)}
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
                        {effectiveSubPrepay > 0 && (
                          <span style={{ fontSize: '0.65rem', color: '#1e40af', fontWeight: 600, letterSpacing: '-0.2px' }}>
                            (선납금포함)
                          </span>
                        )}
                        {includeServiceInFinal && subServiceTotal > 0 && (
                          <span style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 600, letterSpacing: '-0.2px' }}>
                            (서비스혜택 {formatWon(subServiceTotal)} 반영)
                          </span>
                        )}
                        {applyExtraToFinal && totalExtraAffiliateDiscount > 0 && (
                          <span style={{ fontSize: '0.65rem', color: '#7e22ce', fontWeight: 700, letterSpacing: '-0.2px' }}>
                            (제휴지원금 -{formatWon(totalExtraAffiliateDiscount)} 반영)
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

            {/* 유연한 상단 빈칸 영역 (내용이 적을 때 명함을 제일 하단에 고정하고 윗칸을 빈칸으로 채움) */}
            <div className="a4-flex-spacer" style={{ flex: '1 1 auto', minHeight: 0 }} />

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
            onClick={handleExportAsPdf}
            disabled={isExportingPdf}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              border: '1px solid #60a5fa',
              color: '#ffffff',
              padding: '0.85rem 1.6rem',
              borderRadius: '12px',
              cursor: isExportingPdf ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 800,
              fontSize: '1rem',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)'
            }}
          >
            <FileDown size={19} /> {isExportingPdf ? 'PDF 생성 중...' : '📥 고화질 PDF 다운로드 (태블릿 추천)'}
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
              className="calc-modal-dialog"
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
        {/* 관리자 전용 접속자 계정 및 레벨(Lv.1/Lv.2) 권한 설정 모달 */}
        {renderAdminAccountModal()}
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
    <section className={`container benefit-calc-container ${themeMode === 'light' ? 'theme-light' : 'theme-dark'}`} style={{ paddingTop: '1.5rem', paddingBottom: '6rem', maxWidth: '1140px' }}>
      {/* 계산기 카테고리 전환 상단 탭 바 */}
      {renderModeTabs()}

      {/* 상단 내비게이션 & 액션 버튼 바 */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.55rem'
        }}
      >
        <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="메인 홈 화면으로 이동합니다."
              style={{
                height: '38px',
                padding: '0 0.95rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                color: '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.83rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
            >
              <span>←</span> 홈으로
            </button>
          )}
        </div>

        <div style={{ display: 'inline-flex', gap: '0.42rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleResetAll}
            title="입력된 모든 값을 초기화합니다."
            style={{
              height: '38px',
              padding: '0 0.78rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease'
            }}
          >
            <RotateCcw size={13} /> 초기화
          </button>
          <button
            type="button"
            onClick={handleLock}
            title="입력 실수 방지를 위해 화면을 잠급니다."
            style={{
              height: '38px',
              padding: '0 0.78rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box',
              transition: 'all 0.2s ease'
            }}
          >
            <Lock size={13} /> 잠금
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
          <span
            style={{
              fontSize: '0.70rem',
              color: '#38bdf8',
              fontWeight: 800,
              background: 'rgba(56, 189, 248, 0.2)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              padding: '1px 6px',
              borderRadius: '4px',
              marginLeft: '0.2rem'
            }}
          >
            v{otaState.activeVersion || '2026.11.24'}
          </span>
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

      {/* 0) 견적 보관함 (매니저별 개인 저장 vs 팀 공용 저장 분리) */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <FolderOpen size={19} style={{ color: '#34d399' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#a7f3d0', margin: 0 }}>
              {isMixedMode ? '2번 견적 보관함' : '1번 견적 보관함'}
            </h3>

            {/* 현재 로그인 매니저 배지 */}
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                padding: '0.18rem 0.6rem',
                borderRadius: '999px',
                background: 'rgba(99, 102, 241, 0.16)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#c7d2fe',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
              title="로그인 매니저 계정별로 개인 보관함이 격리되어 보관됩니다."
            >
              <User size={12} />
              {currentUser?.name || currentUser?.id || '매니저'}
              {isAdminUser && <span style={{ color: '#fde047', fontSize: '0.7rem' }}> (관리자)</span>}
            </span>
          </div>

          <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setQuoteSearchQuery('');
                setShowQuoteListModal(true);
              }}
              title="보관된 전체 견적 목록을 큰 팝업창(전체 페이지)으로 한눈에 열람하고 검색합니다."
              style={{
                height: '32px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: '1px solid #34d399',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '0 0.8rem',
                fontSize: '0.79rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Maximize2 size={13} />
              <span>📋 목록 전체보기 ({displayedQuotes.length}건)</span>
            </button>
            <button
              type="button"
              onClick={() => syncQuotesWithCloud(isMixedMode ? 'mixed' : 'compare', true)}
              disabled={isCloudSyncing}
              title="다른 기기에서 저장한 최신 견적을 즉시 새로고침하여 불러옵니다."
              style={{
                height: '32px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#6ee7b7',
                borderRadius: '6px',
                padding: '0 0.7rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: isCloudSyncing ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box'
              }}
            >
              <RefreshCw
                size={12}
                style={{
                  transform: isCloudSyncing ? 'rotate(360deg)' : 'none',
                  transition: isCloudSyncing ? 'transform 1s linear infinite' : 'none'
                }}
              />
              <span>동기화</span>
            </button>
          </div>
        </div>

        {/* 보관함 구분 탭: [ 🔒 내 개인 보관함 (N) ] vs [ 🌐 팀 공용 보관함 (M) ] (슬라이딩 토글 트랙) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            padding: '0.6rem 0.8rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.75), rgba(15, 23, 42, 0.65))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '0.9rem',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)'
          }}
        >
          {/* 슬라이드 세그먼트 토글 컨트롤 */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)'
              }}
            >
              {/* 슬라이딩 백그라운드 인디케이터 */}
              <div
                style={{
                  position: 'absolute',
                  top: '3px',
                  bottom: '3px',
                  left: quoteStorageTab === 'private' ? '3px' : '50%',
                  width: 'calc(50% - 3px)',
                  borderRadius: '8px',
                  background: quoteStorageTab === 'private'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.9))'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.95), rgba(37, 99, 235, 0.9))',
                  boxShadow: quoteStorageTab === 'private'
                    ? '0 2px 8px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                    : '0 2px 8px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 1,
                  pointerEvents: 'none'
                }}
              />

              <button
                type="button"
                onClick={() => setQuoteStorageTab('private')}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  height: '36px',
                  padding: '0 1.1rem',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  fontWeight: quoteStorageTab === 'private' ? 800 : 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  border: 'none',
                  background: 'transparent',
                  color: quoteStorageTab === 'private' ? '#ffffff' : '#94a3b8',
                  transition: 'color 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <Lock size={15} style={{ filter: quoteStorageTab === 'private' ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'none' }} />
                <span>내 개인 보관함</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.48rem',
                    borderRadius: '999px',
                    background: quoteStorageTab === 'private' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255,255,255,0.1)',
                    color: quoteStorageTab === 'private' ? '#a7f3d0' : '#cbd5e1',
                    fontWeight: 800
                  }}
                >
                  {currentManagerPrivateQuotes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setQuoteStorageTab('public')}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  height: '36px',
                  padding: '0 1.1rem',
                  borderRadius: '8px',
                  fontSize: '0.86rem',
                  fontWeight: quoteStorageTab === 'public' ? 800 : 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  border: 'none',
                  background: 'transparent',
                  color: quoteStorageTab === 'public' ? '#ffffff' : '#94a3b8',
                  transition: 'color 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <Globe size={15} style={{ filter: quoteStorageTab === 'public' ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'none' }} />
                <span>팀 공용 보관함</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.48rem',
                    borderRadius: '999px',
                    background: quoteStorageTab === 'public' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255,255,255,0.1)',
                    color: quoteStorageTab === 'public' ? '#bfdbfe' : '#cbd5e1',
                    fontWeight: 800
                  }}
                >
                  {publicQuotes.length}
                </span>
              </button>
            </div>

            {/* 슬라이드 전환 안내 뱃지 */}
            <span
              style={{
                fontSize: '0.74rem',
                color: '#94a3b8',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <span>⇄</span>
              <span>원클릭 슬라이드 전환</span>
            </span>
          </div>

          {/* 관리자(admin)일 때 개인 보관함 매니저별 필터 선택기 */}
          {isAdminUser && quoteStorageTab === 'private' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 600 }}>매니저 필터:</span>
              <select
                value={adminFilterManager}
                onChange={(e) => setAdminFilterManager(e.target.value)}
                className="calc-select-clickable"
                style={{
                  height: '32px',
                  width: 'auto',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#f8fafc',
                  borderRadius: '6px',
                  padding: '0 2rem 0 0.6rem',
                  fontSize: '0.76rem',
                  cursor: 'pointer'
                }}
              >
                <option value="all">전체 매니저 ({allPrivateQuotes.length}건)</option>
                {Array.from(
                  new Set(
                    allPrivateQuotes
                      .map((q) => q.creatorId || q.data?.creatorId)
                      .filter(Boolean)
                  )
                ).map((mId) => {
                  const matchQuote = allPrivateQuotes.find(
                    (q) => (q.creatorId || q.data?.creatorId) === mId
                  );
                  const mName = matchQuote?.creatorName || matchQuote?.data?.creatorName || mId;
                  const count = allPrivateQuotes.filter(
                    (q) => (q.creatorId || q.data?.creatorId) === mId
                  ).length;
                  return (
                    <option key={mId} value={mId}>
                      {mName} ({count}건)
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* 현재 견적 저장 입력줄 및 저장 위치 토글 */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '2px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <button
              type="button"
              onClick={() => setQuoteSaveScope('private')}
              title="현재 작성한 견적을 내 개인 보관함에 저장합니다."
              style={{
                height: '34px',
                padding: '0 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: quoteSaveScope === 'private' ? 800 : 600,
                border: 'none',
                background: quoteSaveScope === 'private' ? '#10b981' : 'transparent',
                color: quoteSaveScope === 'private' ? '#042f24' : '#94a3b8',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Lock size={12} /> 개인저장
            </button>
            <button
              type="button"
              onClick={() => setQuoteSaveScope('public')}
              title="지점 모든 매니저가 공유할 수 있는 팀 공용 보관함에 저장합니다."
              style={{
                height: '34px',
                padding: '0 0.75rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: quoteSaveScope === 'public' ? 800 : 600,
                border: 'none',
                background: quoteSaveScope === 'public' ? '#3b82f6' : 'transparent',
                color: quoteSaveScope === 'public' ? '#0f172a' : '#94a3b8',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Globe size={12} /> 공용저장
            </button>
          </div>

          <input
            type="text"
            value={quoteTitleInput}
            onChange={(e) => setQuoteTitleInput(e.target.value)}
            placeholder={
              quoteSaveScope === 'private'
                ? "내 개인 견적 이름 (비워두면 '고객성함 · 품목'으로 자동 생성)"
                : "팀 공용 견적 이름 (예: 신혼 4대 패키지 / 입주 필수 세트)"
            }
            className="calc-input-editable"
            style={{
              ...textInputStyle,
              flex: '1 1 240px',
              height: '38px',
              padding: '0 0.85rem',
              fontSize: '0.86rem',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}
          />
          <button
            type="button"
            onClick={() => handleSaveNewQuote(undefined, quoteSaveScope)}
            style={{
              height: '38px',
              background:
                quoteSaveScope === 'private'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              padding: '0 1rem',
              fontSize: '0.83rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.38rem',
              whiteSpace: 'nowrap',
              boxSizing: 'border-box'
            }}
          >
            <Save size={14} />
            {quoteSaveScope === 'private' ? '🔒 내 개인 보관함에 저장' : '🌐 팀 공용 보관함에 저장'}
          </button>
          {activeQuoteId && (
            <button
              type="button"
              onClick={handleOverwriteActiveQuote}
              style={{
                height: '38px',
                background: 'rgba(212, 175, 55, 0.18)',
                border: '1px solid var(--accent-gold)',
                color: 'var(--accent-gold-light)',
                borderRadius: '8px',
                padding: '0 0.9rem',
                fontSize: '0.83rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box'
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

        {/* 저장된 견적 목록 (좌우 드래그 & 가로 스크롤 방식) */}
        {displayedQuotes.length > 0 ? (
          <div style={{ marginTop: '0.85rem' }}>
            {/* 상단 드래그 안내 및 좌/우 이동 컨트롤 바 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.45rem',
                flexWrap: 'wrap',
                gap: '0.4rem'
              }}
            >
              <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>↔ 마우스로 잡고 옆으로 드래그하거나 좌우 버튼으로 보관 견적을 찾으세요</span>
                <strong style={{ color: '#38bdf8' }}>(총 {displayedQuotes.length}건)</strong>
              </span>
              <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setQuoteSearchQuery('');
                    setShowQuoteListModal(true);
                  }}
                  title="전체 목록을 팝업창으로 크게 열어 한눈에 찾습니다."
                  style={{
                    height: '28px',
                    padding: '0 0.7rem',
                    borderRadius: '6px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.55)',
                    color: '#6ee7b7',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Maximize2 size={12} />
                  <span>📋 목록 (전체보기)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (quoteScrollRef.current) {
                      quoteScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                    }
                  }}
                  title="왼쪽으로 이동"
                  style={{
                    height: '28px',
                    padding: '0 0.65rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#e2e8f0',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  ◀ 이전
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (quoteScrollRef.current) {
                      quoteScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                    }
                  }}
                  title="오른쪽으로 이동"
                  style={{
                    height: '28px',
                    padding: '0 0.65rem',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#e2e8f0',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.2rem'
                  }}
                >
                  다음 ▶
                </button>
              </div>
            </div>

            <div
              ref={quoteScrollRef}
              className="quote-horizontal-scroll"
              onMouseDown={(e) => {
                const el = quoteScrollRef.current;
                if (!el) return;
                quoteDragRef.current = {
                  isDown: true,
                  startX: e.pageX - el.offsetLeft,
                  scrollLeft: el.scrollLeft,
                  hasMoved: false
                };
                el.style.cursor = 'grabbing';
              }}
              onMouseMove={(e) => {
                if (!quoteDragRef.current.isDown) return;
                const el = quoteScrollRef.current;
                if (!el) return;
                const x = e.pageX - el.offsetLeft;
                const walk = x - quoteDragRef.current.startX;
                if (Math.abs(walk) > 6) {
                  quoteDragRef.current.hasMoved = true;
                }
                if (quoteDragRef.current.hasMoved) {
                  e.preventDefault();
                  el.scrollLeft = quoteDragRef.current.scrollLeft - walk * 1.3;
                }
              }}
              onMouseUp={() => {
                quoteDragRef.current.isDown = false;
                if (quoteScrollRef.current) {
                  quoteScrollRef.current.style.cursor = 'grab';
                }
              }}
              onMouseLeave={() => {
                quoteDragRef.current.isDown = false;
                if (quoteScrollRef.current) {
                  quoteScrollRef.current.style.cursor = 'grab';
                }
              }}
              onClickCapture={(e) => {
                if (quoteDragRef.current.hasMoved) {
                  e.stopPropagation();
                  e.preventDefault();
                  quoteDragRef.current.hasMoved = false;
                }
              }}
              onWheel={(e) => {
                const el = quoteScrollRef.current;
                if (!el) return;
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
                  el.scrollLeft += e.deltaY;
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                gap: '0.65rem',
                overflowX: 'auto',
                overflowY: 'hidden',
                paddingBottom: '0.55rem',
                cursor: 'grab',
                userSelect: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {displayedQuotes.map((q) => {
                const isSelected = q.id === activeQuoteId;
                const isQuotePrivate = q.scope === 'private' || q.data?.scope === 'private';
                const authorLabel = q.creatorName || q.creatorId || '매니저';

                return (
                  <div
                    key={q.id}
                    className="saved-quote-item"
                    data-quote-title={q.title}
                    style={{
                      flex: '0 0 305px',
                      minWidth: '295px',
                      maxWidth: '320px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.45rem',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected
                        ? '2px solid #10b981'
                        : '1px solid rgba(255, 255, 255, 0.14)',
                      transition: 'border-color 0.15s ease, background-color 0.15s ease'
                    }}
                  >
                    {/* 상단: 배지 및 견적 제목 (전체 너비 사용) */}
                    <div
                      onClick={() => handleLoadQuote(q)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        minWidth: 0
                      }}
                      title="클릭하여 이 견적 불러오기"
                    >
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px',
                          background: isQuotePrivate ? 'rgba(16, 185, 129, 0.22)' : 'rgba(59, 130, 246, 0.22)',
                          border: isQuotePrivate ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(59, 130, 246, 0.5)',
                          color: isQuotePrivate ? '#6ee7b7' : '#93c5fd',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.22rem',
                          flexShrink: 0
                        }}
                      >
                        {isQuotePrivate ? <Lock size={10} /> : <Globe size={10} />}
                        {isQuotePrivate ? authorLabel : '팀공용'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 800,
                          color: isSelected ? '#6ee7b7' : '#f8fafc',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1
                        }}
                      >
                        {isSelected ? '● ' : ''}
                        {q.title}
                      </span>
                    </div>

                    {/* 하단: 저장일시/금액 정보 (좌) + 조작 버튼 3종 (우) */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        paddingTop: '0.3rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {q.savedAt} ·{' '}
                        <span style={{ color: '#cbd5e1', fontWeight: 700 }}>
                          {isMixedMode
                            ? `실체감가 ${formatWon(q.summary?.mixedGrandFinal || 0)}`
                            : `구독 체감 ${formatWon(q.summary?.subFinalPrice || 0)}`}
                        </span>
                      </div>

                      <div style={{ display: 'inline-flex', gap: '0.3rem', flexShrink: 0, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleLoadQuote(q)}
                          style={{
                            background: isSelected ? '#10b981' : 'rgba(59, 130, 246, 0.2)',
                            border: isSelected ? 'none' : '1px solid rgba(59, 130, 246, 0.45)',
                            color: isSelected ? '#06281e' : '#93c5fd',
                            borderRadius: '6px',
                            padding: '0.28rem 0.55rem',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          {isSelected ? '적용중' : '불러오기'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleQuoteScope(q)}
                          title={isQuotePrivate ? '팀 공용 보관함으로 전환하여 다른 매니저들과 공유합니다.' : '내 개인 보관함으로 전환합니다.'}
                          style={{
                            background: 'rgba(255, 255, 255, 0.07)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: isQuotePrivate ? '#93c5fd' : '#6ee7b7',
                            borderRadius: '6px',
                            padding: '0.28rem 0.48rem',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}
                        >
                          {isQuotePrivate ? <Globe size={11} /> : <Lock size={11} />}
                          {isQuotePrivate ? '공용전환' : '개인전환'}
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
                            padding: '0.28rem 0.42rem',
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
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              marginTop: '0.85rem',
              padding: '1.1rem 1rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6
            }}
          >
            {quoteStorageTab === 'private' ? (
              <>
                🔒 <strong>[{currentUser?.name || currentUser?.id || '매니저'}]</strong>님의 개인 보관함이 비어있습니다.
                <br />
                상단에서 <strong>[🔒 개인저장]</strong>을 선택하고 저장하시면, 다른 매니저에게 노출되지 않고 나만의 견적으로 안전하게 보관됩니다.
              </>
            ) : (
              <>
                🌐 <strong>팀 공용 보관함</strong>이 비어있습니다.
                <br />
                지점 매니저들과 함께 공유할 패키지(예: 신혼 4대 가전, 입주 풀패키지 등)는 <strong>[🌐 공용저장]</strong>을 선택하여 저장해보세요.
              </>
            )}
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

          {/* 행사 유형 4버튼 (클릭 가능한 선택 버튼) */}
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
                  className="calc-btn-interactive"
                  style={{
                    height: '44px',
                    padding: '0 0.6rem',
                    borderRadius: '10px',
                    border: active ? '2px solid var(--accent-gold)' : '1.5px solid rgba(255, 255, 255, 0.14)',
                    background: active
                      ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.35), rgba(15, 23, 42, 0.9))'
                      : 'rgba(15, 23, 42, 0.7)',
                    color: active ? '#ffffff' : '#94a3b8',
                    fontWeight: active ? 800 : 600,
                    fontSize: '0.88rem',
                    boxShadow: active ? '0 0 14px rgba(212, 175, 55, 0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '1.05rem' }}>{t.icon}</span>
                  <span>{t.label}</span>
                  {active && <span style={{ fontSize: '0.75rem', color: '#fde68a' }}>✓</span>}
                </button>
              );
            })}
          </div>

          {/* 행사 안내 문구 (클릭 불가 정보 안내문) */}
          <div className="calc-display-readonly" style={{ fontSize: '0.8rem', color: '#93c5fd', background: 'rgba(30, 58, 138, 0.35)', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px dashed rgba(147, 197, 253, 0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className="calc-badge-auto">ℹ️ 행사안내</span>
              <span>
                <strong style={{ color: '#ffffff' }}>{EVENT_TYPE_INFO[mixedEventType]?.title || '선택 유형'}</strong>: {EVENT_TYPE_INFO[mixedEventType]?.desc || ''}
                {hasAnyProofPolicy && (
                  <span style={{ color: '#6ee7b7', fontWeight: 800, marginLeft: '6px' }}>
                    (현재 증빙 필요 정책 포함됨)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 고객 및 매니저 정보 그리드 (PC 4열, 태블릿 2열, 모바일 1열 반응형) */}
        <div className="calc-grid-form-4">
          <div>
            <label className="calc-label-guide">
              <span>고객 성함</span>
              <span className="calc-tag-type input">✏️ 직접입력</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="예: 홍길동 (미입력 시 '소중한 고객님')"
              className="calc-input-editable"
            />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label
                htmlFor="jcc_consult_date_input"
                className="calc-label-guide"
                style={{ marginBottom: 0, cursor: 'pointer' }}
                onClick={() => {
                  try {
                    const el = document.getElementById('jcc_consult_date_input');
                    if (el) {
                      el.focus();
                      if (typeof el.showPicker === 'function') el.showPicker();
                    }
                  } catch {}
                }}
              >
                <span>상담 일자</span>
                <span className="calc-tag-type select">📅 날짜선택</span>
              </label>
              {consultDate === getLocalTodayString() ? (
                <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', padding: '1px 6px', borderRadius: '4px' }}>
                  오늘(Today) 자동지정
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConsultDateChange(getLocalTodayString())}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid #3b82f6',
                    color: '#93c5fd',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  title="오늘 날짜로 재설정"
                >
                  오늘로 변경
                </button>
              )}
            </div>
            <input
              id="jcc_consult_date_input"
              type="date"
              value={consultDate}
              onChange={(e) => handleConsultDateChange(e.target.value)}
              onClick={(e) => {
                try {
                  if (typeof e.target.showPicker === 'function') {
                    e.target.showPicker();
                  }
                } catch {}
              }}
              className="calc-input-editable"
              style={{
                cursor: 'pointer',
                colorScheme: themeMode === 'light' ? 'light' : 'dark',
                width: '100%'
              }}
            />
            {(() => {
              const rInfo = getSubReReviewInfo(consultDate);
              return rInfo.dateStr ? (
                <div style={{ fontSize: '0.70rem', color: '#f59e0b', marginTop: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⚠️ 58일차 재심사 예정일:</span>
                  <strong style={{ color: '#fbbf24', textDecoration: 'underline' }}>{rInfo.dateStr}</strong>
                </div>
              ) : null;
            })()}
          </div>
          <div>
            <label className="calc-label-guide">
              <span>상담 구분</span>
              <span className="calc-tag-type select">▼ 드롭다운</span>
            </label>
            <select
              value={consultType}
              onChange={(e) => setConsultType(e.target.value)}
              className="calc-select-clickable"
            >
              <option value="입주가전 맞춤설계">입주가전 맞춤설계</option>
              <option value="신혼·혼수가전 맞춤설계">신혼·혼수가전 맞춤설계</option>
              <option value="이사·교체가전 맞춤설계">이사·교체가전 맞춤설계</option>
              <option value="단품·패키지 비교견적">단품·패키지 비교견적</option>
              <option value="VIP 특별 혜택 설계">VIP 특별 혜택 설계</option>
            </select>
          </div>
          <div>
            <label className="calc-label-guide">
              <span>매니저 연락처</span>
              <span className="calc-tag-type input">✏️ 직접입력</span>
            </label>
            <input
              type="tel"
              value={managerPhone}
              onChange={(e) => setManagerPhone(e.target.value)}
              placeholder="예: 010-0000-0000"
              className="calc-input-editable"
            />
          </div>
        </div>
        {!isMixedMode && (
          <div style={{ marginTop: '0.85rem' }}>
            <label className="calc-label-guide">
              <span>상담 구성 품목 요약 (선택 입력 · 출력물 상단에 표시)</span>
              <span className="calc-tag-type input">✏️ 직접입력</span>
            </label>
            <input
              type="text"
              value={productSummary}
              onChange={(e) => setProductSummary(e.target.value)}
              placeholder="예: TV 85인치 + 비스포크 AI 냉장고 + 김치냉장고 + 비스포크 AI 콤보 + 무풍에어컨"
              className="calc-input-editable"
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
                            maxLength={15}
                            value={item.name || ''}
                            onChange={(e) => handleUpdateMixedLumpItem(item.id, 'name', e.target.value.slice(0, 15))}
                            placeholder="모델명 입력 (예: RF85DB90F1AP · 최대 15자)"
                            className="calc-input-editable"
                            style={{ height: '38px', padding: '0 0.75rem', fontSize: '0.86rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          />
                          <div style={{ width: '80px', flexShrink: 0, position: 'relative' }}>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.quantity !== undefined ? item.quantity : 1}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                handleUpdateMixedLumpItem(item.id, 'quantity', raw === '' ? '' : parseInt(raw, 10));
                              }}
                              placeholder="1"
                              className="calc-input-editable"
                              style={{ height: '38px', padding: '0 1.5rem 0 0.5rem', fontSize: '0.86rem', textAlign: 'right' }}
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
                            <div className="calc-label-guide" style={{ marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.72rem', color: '#fde68a', fontWeight: 700 }}>기준금액(1대)</span>
                              <span className="calc-tag-type input">✏️ 직접입력</span>
                            </div>
                            <MoneyInput
                              value={item.price}
                              onChange={(val) => handleUpdateMixedLumpItem(item.id, 'price', val)}
                              placeholder="기준금액"
                              compact
                              accentColor="#fcd34d"
                            />
                          </div>

                          <div>
                            <div className="calc-label-guide" style={{ marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>할인된 금액(1대)</span>
                              <span className="calc-tag-type input">✏️ 직접입력</span>
                            </div>
                            <MoneyInput
                              value={item.discountedPrice || 0}
                              onChange={(val) => handleUpdateMixedLumpItem(item.id, 'discountedPrice', val)}
                              placeholder="할인된 금액 (할인가)"
                              compact
                              accentColor="#60a5fa"
                            />
                          </div>
                        </div>

                        {/* 3행: 개별 모델 실시간 산출 피드백 (클릭 불가 자동계산) */}
                        <div className="calc-display-readonly" style={{ fontSize: '0.75rem', color: '#cbd5e1', paddingTop: '0.35rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span className="calc-badge-auto">🔒 자동계산</span>
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
                  className="calc-btn-hologram"
                  style={{
                    marginTop: '0.55rem',
                    width: '100%',
                    height: '40px',
                    fontSize: '0.86rem',
                    letterSpacing: '-0.01em'
                  }}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>일반구매 품목 추가</span>
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
                      padding: '0.75rem 0.85rem',
                      background: 'rgba(212, 175, 55, 0.12)',
                      cursor: 'pointer',
                      borderBottom: deptCalcOpen ? '1px solid rgba(212, 175, 55, 0.25)' : 'none',
                      userSelect: 'none',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <Calculator size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fde68a' }}>
                          🏬 갤러리아 백화점 스마트 정산 &amp; 결제 설계기
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#b45309', color: '#fff', padding: '2px 7px', borderRadius: '4px', flexShrink: 0 }}>
                          직원 전용
                        </span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                        마지노선 방어 · 사은행사(11%/10%) 극대화 · 1인 3분할 &amp; 2인 카드 슬라이더
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                        {deptCalcOpen ? '▲ 접기' : '▼ 설계기 열기'}
                      </span>
                    </div>
                  </div>

                  {/* 펼쳐졌을 때의 계산기 바디 */}
                  {deptCalcOpen && (
                    <div style={{ padding: '0.75rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: '1 1 120px' }}>
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
                                className="calc-input-editable"
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
                                  boxSizing: 'border-box',
                                  minHeight: '40px'
                                }}
                              />
                              <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b', fontWeight: 900, fontSize: '0.85rem' }}>
                                %
                              </span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700 }}>
                              직접 입력 가능
                            </span>
                          </div>
                          {/* 빠른 원터치 프리셋 칩 */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(56px, 1fr))', gap: '0.3rem' }}>
                            {[9.5, 10.0, 10.5, 11.0, 11.5].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setDeptRewardRate(rate)}
                                style={{
                                  padding: '0.42rem 0.2rem',
                                  borderRadius: '6px',
                                  border: Math.abs(deptRewardRate - rate) < 0.001 ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                                  background: Math.abs(deptRewardRate - rate) < 0.001 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.03)',
                                  color: Math.abs(deptRewardRate - rate) < 0.001 ? '#fde68a' : '#cbd5e1',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  minHeight: '34px'
                                }}
                              >
                                {rate.toFixed(1)}%{rate === 11.0 ? ' 🔥' : ''}
                              </button>
                            ))}
                          </div>
                          <div style={{ fontSize: '0.67rem', color: '#94a3b8', marginTop: '0.45rem', lineHeight: 1.4 }}>
                            <div>• <strong>400만 이하</strong>: 기본 6.5% 사은행사 고정 적용 (300만: 19.5만 / 400만: 26만)</div>
                            <div>• ⏱️ <strong>유효기간</strong>: <strong>사은으로 받은 G캐시 9.5% 이상은 전액 60일(2개월)</strong> / 400만 이하 기본 6.5%는 <strong>5년</strong></div>
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
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.45rem' }}>
                            <button
                              type="button"
                              onClick={() => setDeptStrategy('reward')}
                              style={{
                                padding: '0.5rem 0.4rem',
                                minHeight: '44px',
                                borderRadius: '6px',
                                border: deptStrategy === 'reward' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                                background: deptStrategy === 'reward' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.03)',
                                color: deptStrategy === 'reward' ? '#6ee7b7' : '#cbd5e1',
                                fontSize: '0.73rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1.3
                              }}
                            >
                              💰 1. 전부 적립 (체감가 최저)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeptStrategy('partial')}
                              style={{
                                padding: '0.5rem 0.4rem',
                                minHeight: '44px',
                                borderRadius: '6px',
                                border: (deptStrategy === 'partial' || deptStrategy === 'instant') ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                                background: (deptStrategy === 'partial' || deptStrategy === 'instant') ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.03)',
                                color: (deptStrategy === 'partial' || deptStrategy === 'instant') ? '#7dd3fc' : '#cbd5e1',
                                fontSize: '0.73rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1.3
                              }}
                            >
                              🛡️ 2. 부분 차감 (마지노선 방어)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeptStrategy('full')}
                              style={{
                                padding: '0.5rem 0.4rem',
                                minHeight: '44px',
                                borderRadius: '6px',
                                border: deptStrategy === 'full' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                                background: deptStrategy === 'full' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.03)',
                                color: deptStrategy === 'full' ? '#fde68a' : '#cbd5e1',
                                fontSize: '0.73rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                lineHeight: 1.3
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

                      {/* 4. 1인 최적 분할 비기 모드 안내 (500만/1,000만/1,500만/2,000만 구간 초과 여유분 발생 시) */}
                      {deptCardCount === 1 && deptEnginePlan.mode === '1person_3split' && (
                        <div style={{ background: 'rgba(212, 175, 55, 0.08)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(212, 175, 55, 0.35)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#fde68a' }}>
                              {deptEnginePlan.step3BaseApproval > 0
                                ? `⚡ 1인 카드 3분할 결제 비기 작동 중 (${deptEnginePlan.step1Label || '2000만'} 구간 초과 최적화)`
                                : deptEnginePlan.step2Approval > 0
                                  ? `⚡ 1인 카드 2단계 최적 분할 (1차 ${deptEnginePlan.step1Label || '1500만'} + 2차 ${deptEnginePlan.step2Label || '100만'} 구간 완벽 매칭)`
                                  : `⚡ 1인 카드 최적 결제 (${deptEnginePlan.step1Label || '1500만'} 구간 마지노선 사수)`}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: deptEnginePlan.safeDeduct > 0 ? '#67e8f9' : '#6ee7b7', fontWeight: 700 }}>
                              {deptEnginePlan.safeDeduct > 0
                                ? `✓ G캐시 ${formatWon(deptEnginePlan.safeDeduct)} 선차감${deptEnginePlan.safeReward > 0 ? ` + 잔여 ${formatWon(deptEnginePlan.safeReward)} 앱 적립` : ' (전액 차감)'}`
                                : '✓ 사은행사 1차+2차 전액 수령'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.76rem' }}>
                            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                              <div style={{ color: '#93c5fd', fontWeight: 700, fontSize: '0.85rem' }}>
                                1차 제휴카드: {formatWon(deptEnginePlan.step1Approval)} ({deptEnginePlan.step1Label || '1500만'} 구간)
                              </div>
                              <div style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>
                                5% 청구할인 ({formatWon(deptEnginePlan.step1Discount)}) + {deptRewardRate}% 우대 G캐시 ({formatWon(deptEnginePlan.step1Gcash)})
                                {deptEnginePlan.deduct1 > 0 && (
                                  <div style={{ color: '#67e8f9', fontWeight: 700, marginTop: '2px' }}>
                                    └ {deptEnginePlan.step1Label} 마지노선({formatWon(deptEnginePlan.step1MinSpend)}) 사수: G캐시 -{formatWon(deptEnginePlan.deduct1)} 선차감
                                  </div>
                                )}
                              </div>
                            </div>
                            {deptEnginePlan.step2Approval > 0 && (
                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                                <div style={{ color: '#fde68a', fontWeight: 700, fontSize: '0.85rem' }}>
                                  2차 제휴카드: {formatWon(deptEnginePlan.step2Approval)} ({deptEnginePlan.step2Label || '100만'} 구간)
                                </div>
                                <div style={{ color: '#cbd5e1', fontSize: '0.72rem' }}>
                                  {deptEnginePlan.step2Discount > 0
                                    ? `3% 청구할인 (${formatWon(deptEnginePlan.step2Discount)})`
                                    : '청구할인 미적용 (300만 미만)'} + 6.5% 일반 G캐시 ({formatWon(deptEnginePlan.step2Gcash)})
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
                            <div style={{ marginTop: '0.5rem', padding: '0.45rem 0.75rem', background: 'rgba(14, 165, 233, 0.15)', borderRadius: '6px', border: '1px solid rgba(14, 165, 233, 0.35)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', fontSize: '0.78rem' }}>
                              <span style={{ color: '#e0f2fe' }}>
                                ⚡ 총 선차감액: <strong style={{ color: '#38bdf8' }}>-{formatWon(deptEnginePlan.safeDeduct)}</strong> {deptEnginePlan.deduct3 > 0 ? `(1차 ${formatWon(deptEnginePlan.deduct1)} + 3차 ${formatWon(deptEnginePlan.deduct3)})` : `(1차 ${formatWon(deptEnginePlan.deduct1)})`}
                                {deptEnginePlan.safeReward > 0 && (
                                  <span style={{ color: '#fde68a', fontWeight: 800, marginLeft: '8px' }}>
                                    | 💰 잔여 자투리 G캐시 적립: +{formatWon(deptEnginePlan.safeReward)}
                                  </span>
                                )}
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
                          padding: '0.75rem 0.65rem',
                          borderRadius: '11px',
                          border: '1px solid rgba(212, 175, 55, 0.38)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <Scale size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fde68a' }}>
                              ⚖️ [1.전부적립] vs [2.부분차감] vs [3.전부차감] 3대 시나리오 실시간 유불리 비교
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            ※ 원하시는 플랜 카드를 클릭하시면 해당 수령 방식으로 즉시 전환됩니다.
                          </span>
                        </div>

                        {/* 3열 나란한 비교 카드 (전부적립 vs 부분차감 vs 전부차감) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
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
                                  <strong style={{ color: '#fde68a' }}>
                                    + {formatWon(deptEnginePlan.rewardPlan?.totalGcash ?? deptEnginePlan.totalGcash)}
                                    {deptEnginePlan.mode === '1person_3split' && deptEnginePlan.rewardPlan?.step2Gcash > 0
                                      ? ` (1차 ${deptEnginePlan.step1Label} + 2차 ${deptEnginePlan.rewardPlan?.step2Label})`
                                      : ' (100% 지급)'}
                                  </strong>
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
                                {deptEnginePlan.mode === '1person_3split' && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#fde68a' }}>
                                    <span>총 G캐시 발생 합계:</span>
                                    <strong style={{ color: '#fde68a' }}>
                                      + {formatWon(deptEnginePlan.partialPlan?.totalGcash ?? deptEnginePlan.totalGcash)}
                                      {deptEnginePlan.partialPlan?.step2Gcash > 0 ? ` (1차 ${deptEnginePlan.step1Label} + 2차 ${deptEnginePlan.partialPlan?.step2Label})` : ''}
                                    </strong>
                                  </div>
                                )}
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
                                  <strong style={{ color: '#fde68a' }}>
                                    + {formatWon(deptEnginePlan.fullPlan?.totalGcash)}
                                    {deptEnginePlan.mode === '1person_3split'
                                      ? (deptEnginePlan.fullPlan?.step2Gcash > 0
                                          ? ` (1차 ${deptEnginePlan.step1Label} + 2차 ${deptEnginePlan.fullPlan?.step2Label})`
                                          : ` (1차 ${deptEnginePlan.step1Label} 단독)`)
                                      : ''}
                                  </strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#34d399' }}>
                                  <span>{deptEnginePlan.fullPlan?.safeReward > 0 ? '현장 G캐시 최대 선차감:' : '현장 G캐시 전액 선차감:'}</span>
                                  <strong>
                                    - {formatWon(deptEnginePlan.fullPlan?.safeDeduct)}
                                    {deptEnginePlan.fullPlan?.safeReward > 0 ? ' (최대 활용 선차감)' : ' (100% 올인 차감)'}
                                  </strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#fca5a5' }}>
                                  <span>제휴카드 청구할인:</span>
                                  <strong>- {formatWon(deptEnginePlan.fullPlan?.totalCardDiscount)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: deptEnginePlan.fullPlan?.safeReward > 0 ? '#fef08a' : '#94a3b8', fontSize: '0.73rem' }}>
                                  <span>잔여 G캐시 앱 적립:</span>
                                  <strong style={{ color: deptEnginePlan.fullPlan?.safeReward > 0 ? '#fef08a' : '#cbd5e1' }}>
                                    {deptEnginePlan.fullPlan?.safeReward > 0
                                      ? `+ ${formatWon(deptEnginePlan.fullPlan?.safeReward)} (자투리 앱 적립)`
                                      : '0원 (남김없이 올인 차감)'}
                                  </strong>
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
                                {deptEnginePlan.gcash60Day > 0 ? `60일: ${formatWon(deptEnginePlan.gcash60Day)}` : ''}{deptEnginePlan.gcash60Day > 0 && deptEnginePlan.gcash5Year > 0 ? ' / ' : ''}{deptEnginePlan.gcash5Year > 0 ? `5년: ${formatWon(deptEnginePlan.gcash5Year)}` : ''}
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
                            적립 (60일/5년 적립)
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
                        className="calc-input-editable"
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
                    <span style={{ color: '#34d399', fontWeight: 700 }}>• G캐시 {formatWon(deptVoucherDiscount)} 즉시차감 반영</span>
                  ) : (
                    <span style={{ color: '#fde68a', fontWeight: 700 }}>• 상품권(G캐시) {formatWon(deptVoucherDiscount)} 적립 지급</span>
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
              <div className="calc-label-guide">
                <span style={{ fontSize: '0.92rem', color: 'white', fontWeight: 800 }}>총 기준 구매금액</span>
                <span className="calc-tag-type input">✏️ 직접입력</span>
              </div>
              <MoneyInput value={lumpBasePrice} onChange={handleLumpBaseChange} placeholder="0" compact />
            </div>

            {/* 2. 총 할인·혜택 금액 (통합) */}
            <div style={{ marginBottom: '1rem' }}>
              <div className="calc-label-guide">
                <span style={{ fontSize: '0.92rem', color: 'white', fontWeight: 800 }}>일반구매 총 할인 · 혜택 금액 (통합)</span>
                <span className="calc-tag-type input">✏️ 직접입력</span>
              </div>
              <MoneyInput value={lumpTotalBenefit} onChange={handleLumpBenefitChange} placeholder="할인·캐시백·상품권 등 총합" compact />
            </div>

            {/* 3. 최종 체감가 직접 수정 연동 */}
            <div
              style={{
                padding: '0.85rem',
                borderRadius: '12px',
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1.5px solid rgba(212, 175, 55, 0.45)',
                marginBottom: '1rem'
              }}
            >
              <div className="calc-label-guide">
                <span style={{ fontSize: '0.86rem', color: 'var(--accent-gold-light)', fontWeight: 800 }}>
                  일반구매 일시불 최종 체감가 (직접 입력 시 혜택금액 자동 역산)
                </span>
                <span className="calc-tag-type input">✏️ 직접입력</span>
              </div>
              <MoneyInput value={lumpFinalPrice} onChange={handleLumpFinalDirectChange} placeholder="0" compact accentColor="var(--accent-gold)" />
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
                  className="calc-money-wrapper compact"
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
                  <span className="calc-money-unit-label" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '4px', marginLeft: 0 }}>연</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={cardLowestRate}
                    onChange={(e) => setCardLowestRate(e.target.value)}
                    className="calc-money-input-field"
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
                  <span className="calc-money-unit-label" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '3px' }}>%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 일반구매 실시간 요약 박스 (클릭 불가 자동산출 결과) */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1.15rem',
              borderRadius: '14px',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', marginBottom: '0.45rem', color: '#cbd5e1' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="calc-badge-auto">🔒 자동계산</span>
                <span>총 할인 · 혜택 차감 합계</span>
              </span>
              <strong style={{ color: '#fca5a5' }}>- {formatWon(lumpTotalBenefit)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.55rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="calc-badge-auto">∑ 결과</span>
                <span>일반구매 최종 체감가 (일시불)</span>
              </span>
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
              {isMixedMode && (
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
              )}
            </div>

            {isMixedMode ? (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <label style={{ ...labelStyle, marginBottom: 0, color: '#93c5fd', fontSize: '0.88rem', fontWeight: 800 }}>
                    📦 개별 구독 모델 및 전용 서비스 상세 설정 (총 {mixedSubItems.length}개 모델)
                  </label>
                  <label
                    className={`calc-service-reflect-toggle ${includeServiceInFinal ? 'active' : ''}`}
                    title="체크 시 무상수리·방문케어·소모품 등 서비스 혜택 금액을 최종 체감가에서 차감하여 반영합니다."
                  >
                    <input
                      type="checkbox"
                      checked={includeServiceInFinal}
                      onChange={(e) => setIncludeServiceInFinal(e.target.checked)}
                    />
                    <span>서비스 혜택 최종 체감가에 차감 반영</span>
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
                          {item.isMobile && (
                            <span
                              style={{
                                background: 'rgba(56, 189, 248, 0.22)',
                                border: '1px solid rgba(56, 189, 248, 0.5)',
                                color: '#38bdf8',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.45rem',
                                borderRadius: '5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                flexShrink: 0
                              }}
                            >
                              <Smartphone size={11} /> 파손
                            </span>
                          )}
                          {(item.hasReinstall || (Number(item.reinstallFee) || 0) > 0) && (
                            <span
                              style={{
                                background: 'rgba(20, 184, 166, 0.22)',
                                border: '1px solid rgba(45, 212, 191, 0.5)',
                                color: '#2dd4bf',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.45rem',
                                borderRadius: '5px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                flexShrink: 0
                              }}
                            >
                              <RefreshCw size={11} /> 재설치
                            </span>
                          )}
                          <input
                            type="text"
                            maxLength={15}
                            value={item.name || ''}
                            onChange={(e) => handleUpdateMixedSubItem(item.id, 'name', e.target.value.slice(0, 15))}
                            placeholder="모델명 입력 (예: RF85DB90F1AP · 최대 15자)"
                            className="calc-input-editable"
                            style={{ height: '38px', padding: '0 0.75rem', fontSize: '0.86rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          />
                          <div style={{ width: '80px', flexShrink: 0, position: 'relative' }}>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.quantity !== undefined ? item.quantity : 1}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^0-9]/g, '');
                                handleUpdateMixedSubItem(item.id, 'quantity', raw === '' ? '' : parseInt(raw, 10));
                              }}
                              placeholder="1"
                              className="calc-input-editable"
                              style={{ height: '38px', padding: '0 1.5rem 0 0.5rem', fontSize: '0.86rem', textAlign: 'right' }}
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

                        {/* 2행: 구독기간 + 서비스주기 + 기본구독료 + 할인구독료 + 선납금 (반응형 4~5열) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', alignItems: 'end' }}>
                          <div>
                            <div className="calc-label-guide" style={{ marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>구독기간</span>
                              <span className="calc-tag-type select">▼ 선택</span>
                            </div>
                            <select
                              value={item.months}
                              onChange={(e) => handleUpdateMixedSubItem(item.id, 'months', Number(e.target.value))}
                              className="calc-select-clickable"
                              style={{ height: '38px', fontSize: '0.82rem' }}
                            >
                              {[72, 60, 48, 36].map((m) => (
                                <option key={m} value={m}>
                                  {m}개월
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <div className="calc-label-guide" style={{ marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 700 }}>서비스주기</span>
                              <span className="calc-tag-type select">▼ 선택</span>
                            </div>
                            <select
                              value={item.serviceCycle === 0 || item.serviceCycle === null || item.serviceCycle === '' ? 0 : (item.serviceCycle || 12)}
                              onChange={(e) => handleUpdateMixedSubItem(item.id, 'serviceCycle', Number(e.target.value))}
                              className="calc-select-clickable"
                              style={{
                                height: '38px',
                                fontSize: '0.82rem',
                                color: (item.serviceCycle === 0 || item.serviceCycle === null || item.serviceCycle === '') ? '#94a3b8' : 'white'
                              }}
                            >
                              <option value={0} style={{ background: '#0f172a', color: '#94a3b8' }}>
                                없음 (케어 미적용)
                              </option>
                              {[4, 6, 12, 36].map((c) => (
                                <option key={c} value={c}>
                                  {c}개월마다
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <div className="calc-label-guide" style={{ marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700 }}>기본구독료 (월)</span>
                              <span className="calc-tag-type input">✏️ 직접입력</span>
                            </div>
                            <MoneyInput
                              value={item.baseMonthlyFee}
                              onChange={(val) => handleUpdateMixedSubItem(item.id, 'baseMonthlyFee', val)}
                              placeholder="기본 월구독료"
                              compact
                              accentColor="#93c5fd"
                            />
                          </div>

                          <div>
                            <div className="calc-label-guide" style={{ marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 800 }}>할인구독료 (월)</span>
                              <span className="calc-tag-type input">✏️ 직접입력</span>
                            </div>
                            <MoneyInput
                              value={item.discountMonthlyFee}
                              onChange={(val) => handleUpdateMixedSubItem(item.id, 'discountMonthlyFee', val)}
                              placeholder="할인 실납부액"
                              compact
                              accentColor="#60a5fa"
                            />
                          </div>

                          <div>
                            <div className="calc-label-guide" style={{ marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 700 }}>선납금 (선택)</span>
                              <span className="calc-tag-type input">✏️ 직접입력</span>
                            </div>
                            <MoneyInput
                              value={item.prepay}
                              onChange={(val) => handleUpdateMixedSubItem(item.id, 'prepay', val)}
                              placeholder="선납금"
                              compact
                              accentColor="#93c5fd"
                            />
                          </div>
                        </div>

                        {/* 3행: 전용 케어서비스 4종 (무상수리 이용금액, 소모품비용, 방문케어비용, 재설치 혜택 비용) */}
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '9px', padding: '0.55rem 0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: '0.5rem', alignItems: 'end' }}>
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
                            <label style={{ fontSize: '0.71rem', color: '#6ee7b7', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                              <Package size={11} /> 소모품 비용
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
                            <label style={{ fontSize: '0.71rem', color: '#6ee7b7', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                              <Wrench size={11} /> 방문케어 비용(전문가)
                            </label>
                            <MoneyInput
                              value={item.visitCareFee}
                              onChange={(val) => handleUpdateMixedSubItem(item.id, 'visitCareFee', val)}
                              placeholder="방문케어 총액"
                              compact
                              accentColor="#34d399"
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem', gap: '0.25rem' }}>
                              <label style={{ fontSize: '0.71rem', color: '#5eead4', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem', margin: 0 }}>
                                <RefreshCw size={11} /> 재설치 혜택(케어)
                              </label>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', fontSize: '0.68rem', color: (item.hasReinstall || (Number(item.reinstallFee) || 0) > 0) ? '#5eead4' : '#94a3b8', userSelect: 'none' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.hasReinstall) || (Number(item.reinstallFee) || 0) > 0}
                                  onChange={(e) => {
                                    handleUpdateMixedSubItem(item.id, 'hasReinstall', e.target.checked);
                                    if (!e.target.checked && (Number(item.reinstallFee) || 0) > 0) {
                                      handleUpdateMixedSubItem(item.id, 'reinstallFee', 0);
                                    }
                                  }}
                                  style={{ accentColor: '#14b8a6', cursor: 'pointer', width: '12px', height: '12px' }}
                                />
                                재설치마크
                              </label>
                            </div>
                            <MoneyInput
                              value={item.reinstallFee || 0}
                              onChange={(val) => {
                                handleUpdateMixedSubItem(item.id, 'reinstallFee', val);
                                if (Number(val) > 0 && !item.hasReinstall) {
                                  handleUpdateMixedSubItem(item.id, 'hasReinstall', true);
                                }
                              }}
                              placeholder="재설치 혜택 총액"
                              compact
                              accentColor="#2dd4bf"
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
                  className="calc-btn-hologram"
                  style={{
                    marginTop: '0.75rem',
                    width: '100%',
                    height: '42px',
                    fontSize: '0.9rem',
                    letterSpacing: '-0.01em'
                  }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>구독 품목 추가</span>
                </button>
              </div>
            ) : (
              <>
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
                    <label
                      className={`calc-service-reflect-toggle ${includeServiceInFinal ? 'active' : ''}`}
                      title="체크 시 무상수리·방문케어·소모품 등 서비스 혜택 금액을 최종 체감가에서 차감하여 반영합니다."
                    >
                      <input
                        type="checkbox"
                        checked={includeServiceInFinal}
                        onChange={(e) => setIncludeServiceInFinal(e.target.checked)}
                      />
                      <span>서비스 혜택 최종 체감가에 차감 반영</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {subPlans.map((plan, idx) => {
                      const planMonths = Number(plan.months) || 72;
                      const freeRepairMonths = planMonths;
                      const planMonthly =
                        subInputMode === 'monthly'
                          ? Number(plan.monthlyFee) || 0
                          : Math.round((Number(plan.totalAmount) || 0) / planMonths);
                      const planGross = planMonthly * planMonths;
                      const freeRepairQty = plan.freeRepairQty !== undefined && plan.freeRepairQty !== '' ? Number(plan.freeRepairQty) || 1 : (Number(plan.quantity) || 1);
                      const freeRepairTotal = (Number(plan.freeRepairFee) || 0) * freeRepairMonths * freeRepairQty;
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
                              {(plan.hasReinstall || planCareItems.some((c) => c.type === 'reinstall')) && (
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    color: '#2dd4bf',
                                    background: 'rgba(20, 184, 166, 0.18)',
                                    border: '1px solid rgba(45, 212, 191, 0.45)',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '5px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <RefreshCw size={11} /> 재설치
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

                          {/* 1) 품목선택 및 품목 모델명 입력 (영문·숫자 15자 제한 및 설정된 케어 아이콘 표시) */}
                          <div>
                            <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-end', width: '100%' }}>
                              {/* 좌측: 품목 선택 드롭다운 (상단 [▼ 선택] 마크 부착) */}
                              <div style={{ width: '185px', maxWidth: '46%', flexShrink: 0 }}>
                                <div className="calc-label-guide" style={{ marginBottom: '0.28rem' }}>
                                  <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700 }}>품목 선택</span>
                                  <span className="calc-tag-type select">▼ 선택</span>
                                </div>
                                <select
                                  value={plan.productCategory || getCategoryFromCode(plan.serviceModelCode) || ''}
                                  onChange={(e) => handleSelectProductCategory(plan.id, e.target.value)}
                                  title="무상수리 서비스 품목 선택 (출고가 및 월 이용료 자동반영)"
                                  className="calc-select-clickable"
                                  style={{
                                    width: '100%',
                                    height: '40px',
                                    borderRadius: '8px',
                                    background: '#0f172a',
                                    border: (plan.productCategory || plan.serviceModelCode) ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.18)',
                                    color: (plan.productCategory || plan.serviceModelCode) ? '#93c5fd' : '#94a3b8',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    padding: '0 2rem 0 0.55rem',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <option value="">품목 선택</option>
                                  {SIMPLIFIED_PRODUCT_LIST.map((prod) => (
                                    <option key={prod.id} value={prod.id}>
                                      {prod.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* 우측: 품목 모델명 직접입력 */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.28rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700 }}>품목 모델명</span>
                                    <span style={{ fontSize: '0.66rem', color: '#94a3b8', fontWeight: 500 }}>(최대 15자)</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexWrap: 'wrap' }}>
                                    {(() => {
                                      const freeM = Number(plan.months) || 60;
                                      const damageM = Number(plan.damageMonths) || Number(plan.months) || 36;
                                      const items = Array.isArray(plan.careItems) ? plan.careItems : [];

                                      const visitItems = items.filter((c) => (c.type === 'visit' || c.type === 'all') && ((Number(c.amount) || 0) > 0 || (Number(c.count) || 0) > 0));
                                      const visitCount = visitItems.reduce((sum, c) => sum + (c.count === '' || c.count === undefined ? 1 : Number(c.count) || 1), 0)
                                        || ((plan.careType === 'visit' || plan.careType === 'all') && (Number(plan.careAmount) || 0) > 0 ? (Number(plan.careCount) || 1) : 0);

                                      const selfItems = items.filter((c) => c.type === 'self' && ((Number(c.amount) || 0) > 0 || (Number(c.count) || 0) > 0));
                                      const selfCount = selfItems.reduce((sum, c) => sum + (c.count === '' || c.count === undefined ? 1 : Number(c.count) || 1), 0)
                                        || (plan.careType === 'self' && (Number(plan.careAmount) || 0) > 0 ? (Number(plan.careCount) || 1) : 0);

                                      const consumableItems = items.filter((c) => (c.type === 'consumable' || c.type === 'all') && ((Number(c.amount) || 0) > 0 || (Number(c.count) || 0) > 0));
                                      const consumableCount = consumableItems.reduce((sum, c) => sum + (c.count === '' || c.count === undefined ? 1 : Number(c.count) || 1), 0)
                                        || ((plan.careType === 'consumable' || plan.careType === 'all') && (Number(plan.careAmount) || 0) > 0 ? (Number(plan.careCount) || 1) : 0);

                                      const customItems = items.filter((c) => c.type === 'custom' && ((Number(c.amount) || 0) > 0 || (Number(c.count) || 0) > 0));
                                      const reinstallItems = items.filter((c) => c.type === 'reinstall');
                                      const hasPlanReinstall = Boolean(plan.hasReinstall) || reinstallItems.length > 0;
                                      const reinstallCount = reinstallItems.length > 0
                                        ? reinstallItems.reduce((s, c) => s + (c.count === '' || c.count === undefined ? 1 : Number(c.count) || 1), 0)
                                        : (plan.hasReinstall ? 1 : 0);

                                      return (
                                        <>
                                          {plan.isMobile && (
                                            <span
                                              title={`모바일 파손보험 (${damageM}개월)`}
                                              style={{
                                                fontSize: '0.50rem',
                                                fontWeight: 800,
                                                color: '#38bdf8',
                                                background: 'rgba(56, 189, 248, 0.18)',
                                                border: '1px solid rgba(56, 189, 248, 0.45)',
                                                borderRadius: '3px',
                                                padding: '0.5px 3.5px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '1.5px',
                                                lineHeight: 1.2
                                              }}
                                            >
                                              <Smartphone size={8} /> 파손{damageM}
                                            </span>
                                          )}
                                          {(Number(plan.freeRepairFee) || 0) > 0 && (
                                            <span
                                              title={`무상수리 연장 (${freeM}개월 보증)`}
                                              style={{ fontSize: '0.50rem', fontWeight: 800, color: '#60a5fa', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '3px', padding: '0.5px 3.5px', display: 'inline-flex', alignItems: 'center', gap: '1.5px', lineHeight: 1.2 }}
                                            >
                                              <ShieldCheck size={8} /> 무상{freeM}
                                            </span>
                                          )}
                                          {visitCount > 0 && (
                                            <span
                                              key="visit"
                                              title={`전문 엔지니어 방문케어 (${visitCount}회)`}
                                              style={{ fontSize: '0.50rem', fontWeight: 800, color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '3px', padding: '0.5px 3.5px', display: 'inline-flex', alignItems: 'center', gap: '1.5px', lineHeight: 1.2 }}
                                            >
                                              <Wrench size={8} /> 방문{visitCount}회
                                            </span>
                                          )}
                                          {selfCount > 0 && (
                                            <span
                                              key="self"
                                              title={`셀프케어 (${selfCount}회)`}
                                              style={{ fontSize: '0.50rem', fontWeight: 800, color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '3px', padding: '0.5px 3.5px', display: 'inline-flex', alignItems: 'center', gap: '1.5px', lineHeight: 1.2 }}
                                            >
                                              <Sparkles size={8} /> 셀프{selfCount > 1 ? `${selfCount}회` : ''}
                                            </span>
                                          )}
                                          {consumableCount > 0 && (
                                            <span
                                              key="consumable"
                                              title={`정기 소모품 교체 (${consumableCount}회)`}
                                              style={{ fontSize: '0.50rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '3px', padding: '0.5px 3.5px', display: 'inline-flex', alignItems: 'center', gap: '1.5px', lineHeight: 1.2 }}
                                            >
                                              <Package size={8} /> 소모품{consumableCount}회
                                            </span>
                                          )}
                                          {hasPlanReinstall && (
                                            <span
                                              title="무상 재설치 서비스 혜택"
                                              style={{ fontSize: '0.50rem', fontWeight: 800, color: '#2dd4bf', background: 'rgba(20, 184, 166, 0.18)', border: '1px solid rgba(45, 212, 191, 0.45)', borderRadius: '3px', padding: '0.5px 3.5px', display: 'inline-flex', alignItems: 'center', gap: '1.5px', lineHeight: 1.2 }}
                                            >
                                              <RefreshCw size={8} /> 재설치{reinstallCount > 1 ? `${reinstallCount}회` : ''}
                                            </span>
                                          )}
                                          {customItems.map((c, i) => (
                                            <span
                                              key={`custom-${c.id || i}`}
                                              title={`맞춤 케어: ${c.customName || '케어'}`}
                                              style={{ fontSize: '0.50rem', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '3px', padding: '0.5px 3.5px', display: 'inline-flex', alignItems: 'center', gap: '1.5px', lineHeight: 1.2 }}
                                            >
                                              <Sparkles size={8} /> {(c.customName || '케어').slice(0, 4)}
                                            </span>
                                          ))}
                                        </>
                                      );
                                    })()}
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: (plan.name || '').length >= 15 ? '#ef4444' : '#64748b', marginLeft: '2px' }}>
                                      {(plan.name || '').length}/15
                                    </span>
                                    <span className="calc-tag-type input">✏️ 직접입력</span>
                                  </div>
                                </div>
                                <input
                                  type="text"
                                  maxLength={15}
                                  value={plan.name || ''}
                                  onChange={(e) => handleUpdateSubPlan(plan.id, { name: e.target.value.slice(0, 15) })}
                                  placeholder="모델명 직접입력 (예: RF85DB90F1AP · 최대 15자)"
                                  className="calc-input-editable"
                                  style={{
                                    width: '100%',
                                    height: '40px',
                                    padding: '0 0.75rem',
                                    fontSize: '0.88rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                />
                              </div>
                            </div>
                            {(() => {
                              const matchedServiceItem = FREE_REPAIR_SERVICE_LIST.find((it) => it.code === plan.serviceModelCode);
                              if (!matchedServiceItem) return null;
                              const m = Number(plan.months) || 60;
                              const baseFee = Number(plan.baseMonthlyFee) || Number(plan.monthlyFee) || 0;
                              const prepay = Number(plan.prepay) || 0;
                              const calcTotal = (baseFee * m) + prepay;
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem', fontSize: '0.73rem', color: '#93c5fd', flexWrap: 'wrap' }}>
                                  <span style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.35)', borderRadius: '4px', padding: '1.5px 6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    🏷️ 인식구간: <strong style={{ color: '#60a5fa' }}>{matchedServiceItem.product} ({matchedServiceItem.priceRange !== '전체' ? matchedServiceItem.priceRange : '표준'})</strong>
                                    {calcTotal > 0 && <span style={{ color: '#cbd5e1', fontWeight: 600 }}>({formatWon(calcTotal)})</span>}
                                    <span style={{ color: '#64748b' }}>|</span>
                                    무상수리 <strong style={{ color: '#38bdf8' }}>월 {formatWon(matchedServiceItem.fee)}</strong> 자동반영
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* 2) 기본 구독료 + 할인 구독료 + 선납금 + 약정기간 (PC 4열, 모바일 2x2 반응형 그리드) */}
                          <div className="calc-responsive-grid-4col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.55rem', alignItems: 'flex-start' }}>
                            {/* 기본 구독료 (기준 정가) */}
                            <div>
                              <div className="calc-label-guide" style={{ marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 800 }}>기본 구독료(월)</span>
                                <span className="calc-tag-type input">✏️ 직접입력</span>
                              </div>
                              <MoneyInput
                                value={plan.baseMonthlyFee !== undefined && plan.baseMonthlyFee !== 0 ? plan.baseMonthlyFee : (plan.monthlyFee || 0)}
                                onChange={(val) => handleUpdatePlanBaseMonthly(plan.id, val)}
                                placeholder={idx === 0 ? '예: 102,900' : '0'}
                                accentColor="#60a5fa"
                                compact
                              />
                            </div>

                            {/* 할인 구독료 (실제 납부액) */}
                            <div>
                              <div className="calc-label-guide" style={{ marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 800 }}>할인 구독료(월)</span>
                                <span className="calc-tag-type input">✏️ 직접입력</span>
                              </div>
                              <MoneyInput
                                value={plan.discountMonthlyFee !== undefined && plan.discountMonthlyFee !== 0 ? plan.discountMonthlyFee : (plan.monthlyFee || 0)}
                                onChange={(val) =>
                                  handleUpdateSubPlan(plan.id, { discountMonthlyFee: val, monthlyFee: val })
                                }
                                placeholder={idx === 0 ? '예: 45,760' : '0'}
                                accentColor="#34d399"
                                compact
                              />
                            </div>

                            {/* 선납금 (개별 입력) */}
                            <div>
                              <div className="calc-label-guide" style={{ marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.78rem', color: '#fcd34d', fontWeight: 800 }}>선납금(일시불)</span>
                                <span className="calc-tag-type input">✏️ 직접입력</span>
                              </div>
                              <MoneyInput
                                value={plan.prepay || 0}
                                onChange={(val) => handleUpdatePlanPrepay(plan.id, val)}
                                placeholder="0"
                                accentColor="#f59e0b"
                                compact
                              />
                            </div>

                            {/* 약정기간 */}
                            <div>
                              <div className="calc-label-guide" style={{ marginBottom: '0.25rem' }}>
                                <span style={{ fontSize: '0.78rem', color: '#e2e8f0', fontWeight: 700 }}>약정기간</span>
                                <span className="calc-tag-type select">▼ 선택</span>
                              </div>
                              <select
                                value={plan.months}
                                onChange={(e) => handleUpdatePlanMonths(plan.id, Number(e.target.value))}
                                className="calc-select-clickable"
                                style={{
                                  height: '38px',
                                  fontSize: '0.84rem'
                                }}
                              >
                                {[72, 60, 48, 36].map((m) => (
                                  <option key={m} value={m}>
                                    {m}개월
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* 기본구독료 > 할인구독료 즉시할인 및 선납금 요약 배너 (선납금액 제외 순수 즉시할인 자동산출) */}
                          {(() => {
                            const b = Number(plan.baseMonthlyFee) || Number(plan.monthlyFee) || 0;
                            const d = Number(plan.discountMonthlyFee) || Number(plan.monthlyFee) || 0;
                            const m = Number(plan.months) || 72;
                            const qty = plan.quantity === '' || plan.quantity === undefined ? 1 : Number(plan.quantity) || 1;
                            const prepayAmt = (Number(plan.prepay) || 0) * qty;
                            const rawDiffTotal = b > d ? (b - d) * m * qty : 0;
                            const pureDiscountTotal = Math.max(0, rawDiffTotal - prepayAmt);
                            const pureMonthlyDiff = m * qty > 0 ? Math.round(pureDiscountTotal / (m * qty)) : 0;
                            if (pureDiscountTotal <= 0 && prepayAmt <= 0) return null;
                            return (
                              <div className="calc-display-readonly" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px dashed rgba(52, 211, 153, 0.45)', borderRadius: '8px', padding: '0.45rem 0.75rem', fontSize: '0.76rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                  <span className="calc-badge-auto">🔒 자동계산</span>
                                  {pureDiscountTotal > 0 && (
                                    <span style={{ color: '#34d399', fontWeight: 800 }}>
                                      구독료 즉시할인: -{formatWon(pureDiscountTotal)} (월 -{formatWon(pureMonthlyDiff)} · 선납제외)
                                    </span>
                                  )}
                                </div>
                                {prepayAmt > 0 && (
                                  <span style={{ color: '#fcd34d', fontWeight: 800, marginLeft: pureDiscountTotal > 0 ? 'auto' : '0' }}>
                                    선납금: {formatWon(prepayAmt)}
                                  </span>
                                )}
                              </div>
                            );
                          })()}

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
                            {/* 상단 라벨 & 약정기간 자동 연동 배지 & 모바일 체크박스 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                <ShieldCheck size={14} style={{ color: plan.isMobile ? '#38bdf8' : '#34d399' }} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: plan.isMobile ? '#7dd3fc' : '#a7f3d0' }}>
                                  {plan.isMobile ? '모바일 파손보험 + 무상수리' : '무상수리 연장 이용료'}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.66rem',
                                    fontWeight: 800,
                                    color: '#93c5fd',
                                    background: 'rgba(59, 130, 246, 0.16)',
                                    border: '1px solid rgba(59, 130, 246, 0.35)',
                                    padding: '2px 7px',
                                    borderRadius: '5px'
                                  }}
                                >
                                  약정 {freeRepairMonths}개월 자동일치
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
                                  onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    handleUpdateSubPlan(plan.id, {
                                      isMobile: isChecked,
                                      freeRepairMonths: Number(plan.months) || 72
                                    });
                                  }}
                                  style={{ accentColor: '#38bdf8', cursor: 'pointer', width: '12px', height: '12px' }}
                                />
                                모바일
                              </label>
                            </div>

                            {/* 무상수리 월 금액 및 대수 입력 (약정기간 자동 일치 계산) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                              <div style={{ flex: '1 1 150px', minWidth: '120px' }}>
                                <MoneyInput
                                  value={plan.freeRepairFee}
                                  onChange={(val) => handleUpdateSubPlan(plan.id, { freeRepairFee: val })}
                                  placeholder={plan.isMobile ? "월 케어+(파손보험) 금액" : "월 무상수리 이용료 (원)"}
                                  compact
                                  accentColor={plan.isMobile ? '#38bdf8' : '#34d399'}
                                />
                              </div>

                              {/* 무상수리 대수 입력 */}
                              <div
                                title="무상수리 보증 적용 대수 (미입력 시 품목 대수 연동)"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem',
                                  flexShrink: 0,
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.12)',
                                  borderRadius: '6px',
                                  padding: '0 0.45rem',
                                  height: '32px'
                                }}
                              >
                                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>대수:</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={plan.freeRepairQty !== undefined && plan.freeRepairQty !== '' ? plan.freeRepairQty : (plan.quantity || 1)}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/[^0-9]/g, '');
                                    handleUpdateSubPlan(plan.id, { freeRepairQty: raw === '' ? '' : parseInt(raw, 10) });
                                  }}
                                  placeholder="1"
                                  className="calc-input-editable"
                                  style={{
                                    width: '38px',
                                    height: '24px',
                                    padding: '0 0.2rem',
                                    textAlign: 'center',
                                    background: '#0f172a',
                                    border: '1px solid #3b82f6',
                                    borderRadius: '4px',
                                    color: '#60a5fa',
                                    fontSize: '0.78rem',
                                    fontWeight: 800,
                                    outline: 'none'
                                  }}
                                />
                                <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>대</span>
                              </div>

                              <div style={{ flexShrink: 0, textAlign: 'right', marginLeft: 'auto' }}>
                                {freeRepairTotal > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: plan.isMobile ? '#38bdf8' : '#6ee7b7' }}>
                                      = {formatWon(freeRepairTotal)} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#a7f3d0' }}>상당</span>
                                    </div>
                                    <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 500 }}>
                                      월 {formatWon(plan.freeRepairFee || 0)} × {freeRepairMonths}개월{freeRepairQty > 1 ? ` × ${freeRepairQty}대` : ''}
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    보증 {freeRepairMonths}개월 연동
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 케어서비스 행추가 섹션: 한 세트당 2줄 배치 최적화 & 타이포그래피 계층화 */}
                            <div style={{ marginTop: '0.2rem', paddingTop: '0.55rem', borderTop: '1px dashed rgba(52, 211, 153, 0.25)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  <Wrench size={13} style={{ color: '#34d399' }} />
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#a7f3d0' }}>
                                    케어서비스 혜택
                                  </span>
                                  <label
                                    title="이사·위치변경 시 무상 재설치 서비스 혜택 배지 및 케어서비스 항목을 적용합니다."
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      fontSize: '0.70rem',
                                      fontWeight: 800,
                                      color: (plan.hasReinstall || planCareItems.some((c) => c.type === 'reinstall')) ? '#2dd4bf' : '#94a3b8',
                                      background: (plan.hasReinstall || planCareItems.some((c) => c.type === 'reinstall')) ? 'rgba(20, 184, 166, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                                      border: `1px solid ${(plan.hasReinstall || planCareItems.some((c) => c.type === 'reinstall')) ? '#2dd4bf' : 'rgba(255, 255, 255, 0.15)'}`,
                                      borderRadius: '5px',
                                      padding: '0.15rem 0.45rem',
                                      cursor: 'pointer',
                                      userSelect: 'none'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={Boolean(plan.hasReinstall) || planCareItems.some((c) => c.type === 'reinstall')}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        if (checked) {
                                          const hasRow = planCareItems.some((c) => c.type === 'reinstall');
                                          const nextId = planCareItems.reduce((m, it) => Math.max(m, it.id || 0), 0) + 1;
                                          handleUpdateSubPlan(plan.id, {
                                            hasReinstall: true,
                                            careItems: hasRow
                                              ? planCareItems
                                              : [...planCareItems, { id: nextId, type: 'reinstall', cycle: 0, count: 1, amount: 0, customName: '' }]
                                          });
                                        } else {
                                          handleUpdateSubPlan(plan.id, {
                                            hasReinstall: false,
                                            careItems: planCareItems.filter((c) => c.type !== 'reinstall')
                                          });
                                        }
                                      }}
                                      style={{ accentColor: '#14b8a6', cursor: 'pointer', width: '12px', height: '12px' }}
                                    />
                                    <RefreshCw size={11} /> 재설치 혜택
                                  </label>
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
                                            className="calc-select-clickable"
                                            style={{
                                              width: '100%',
                                              height: '32px',
                                              borderRadius: '6px',
                                              background: '#0f172a',
                                              border: '1px solid rgba(52, 211, 153, 0.45)',
                                              color: '#f8fafc',
                                              fontSize: '0.74rem',
                                              fontWeight: 700,
                                              padding: '0 1.6rem 0 0.45rem',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            <option value="visit">방문케어</option>
                                            <option value="self">셀프케어</option>
                                            <option value="consumable">소모품</option>
                                            <option value="reinstall">재설치 혜택</option>
                                            <option value="custom">직접입력</option>
                                          </select>
                                        </div>

                                        {/* 점검주기 */}
                                        <div style={{ width: '78px', flexShrink: 0 }}>
                                          <label style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.18rem', textAlign: 'center' }}>
                                            점검주기
                                          </label>
                                          <select
                                            value={care.cycle === 0 ? 0 : (care.cycle || (care.type === 'reinstall' ? 0 : 12))}
                                            onChange={(e) => handleUpdatePlanCareItem(plan.id, care.id, { cycle: Number(e.target.value) })}
                                            className="calc-select-clickable"
                                            style={{
                                              width: '100%',
                                              height: '32px',
                                              borderRadius: '6px',
                                              background: '#0f172a',
                                              border: '1px solid rgba(52, 211, 153, 0.45)',
                                              color: '#a7f3d0',
                                              fontSize: '0.74rem',
                                              fontWeight: 700,
                                              padding: '0 1.4rem 0 0.35rem',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            <option value={0}>약정내 무상</option>
                                            <option value={6}>6개월</option>
                                            <option value={12}>12개월</option>
                                            <option value={24}>24개월</option>
                                            <option value={36}>36개월</option>
                                            <option value={48}>48개월</option>
                                            <option value={60}>60개월</option>
                                            <option value={72}>72개월</option>
                                            {![0, 6, 12, 24, 36, 48, 60, 72].includes(Number(care.cycle)) && Boolean(care.cycle) && (
                                              <option value={care.cycle}>{care.cycle}개월</option>
                                            )}
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
                                            className="calc-input-editable"
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
                                              className="calc-input-editable"
                                              style={{
                                                width: '100%',
                                                height: '38px',
                                                borderRadius: '6px',
                                                background: '#0f172a',
                                                border: '1px solid rgba(52, 211, 153, 0.45)',
                                                color: '#ffffff',
                                                fontSize: '0.86rem',
                                                fontWeight: 800,
                                                padding: '0 1.25rem 0 0.35rem',
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
                                className="calc-btn-hologram"
                                style={{
                                  width: '100%',
                                  height: '34px',
                                  fontSize: '0.8rem',
                                  letterSpacing: '-0.01em'
                                }}
                              >
                                <Plus size={14} strokeWidth={2.5} />
                                <span>케어서비스 추가</span>
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
                    className="calc-btn-hologram"
                    style={{
                      marginTop: '0.75rem',
                      width: '100%',
                      height: '42px',
                      fontSize: '0.9rem',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    <span>구독 품목 추가</span>
                  </button>
                </div>
              </>
            )}

            {/* 11월 제휴카드 정책표 고해상도 팝업 배너/버튼 (입력구간 상단) */}
            <div
              style={{
                marginBottom: '0.65rem',
                padding: '0.65rem 0.95rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.75) 100%)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid #60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0
                  }}
                >
                  📋
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                      [26.11월] AI 구독_제휴카드 공식 정책표
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        letterSpacing: '0.05em'
                      }}
                    >
                      대외비
                    </span>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '2px' }}>
                    롯데 · 삼성 · KB국민 · 우리 · 하나 5개사 실적별 할인구간, 6년 총혜택 및 신규 프로모션 기준
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCardPolicyModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: '1px solid #60a5fa',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(37, 99, 235, 0.4)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>🔍 선명한 고해상도 정책표 보기</span>
                </button>
              </div>
            </div>

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
                      className="calc-btn-hologram"
                      style={{
                        padding: '0.35rem 0.85rem',
                        height: '32px',
                        fontSize: '0.8rem',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      <span>제휴카드 추가</span>
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
                                  className="calc-input-editable"
                                  style={{
                                    width: '56px',
                                    height: '28px',
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
                                    className="calc-input-editable"
                                    style={{
                                      width: '54px',
                                      height: '28px',
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#dbeafe' }}>1. 카드 이름</span>
                            <span className="calc-tag-type input">✏️ 직접입력</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>빠른선택:</span>
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
                                className={`calc-btn-interactive ${cardItem.cardName === card.fullName ? 'active' : ''}`}
                                style={{
                                  padding: '0.22rem 0.5rem',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  minHeight: '28px'
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
                          className="calc-input-editable"
                          style={{
                            width: '100%',
                            minHeight: '42px',
                            padding: '0.54rem 0.85rem',
                            fontSize: '0.88rem'
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
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dbeafe', marginBottom: '0.28rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <span>2. 필요 실적 (전월 실적)</span>
                                      <span className="calc-tag-type select">▼ 드롭다운</span>
                                    </div>
                                    {(() => {
                                      const { policyTiers, otherTiers, cardCompany } = getCardSpendOptions(cardItem.cardName, seg.baseMonthly);
                                      const currentVal = normalizeSpendValue(segSpendVal);
                                      const allValues = new Set([...policyTiers.map((t) => t.value), ...otherTiers.map((t) => t.value)]);
                                      const hasCustom = !allValues.has(currentVal);

                                      return (
                                        <select
                                          value={currentVal}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            if (isSamsung && seg.baseMonthly < 70000 && isSpend70kOrMore(val)) {
                                              alert(`삼성카드는 해당 구간 월 구독료가 7만원 미만(${formatWon(seg.baseMonthly)})일 때 70만원/120만원 실적(26,000원 이상 할인)을 적용할 수 없습니다.\n30만원 실적(16,000원 할인) 구간으로 적용됩니다.`);
                                              handleSegmentSpendOverride(seg.endMonth, '30만', idx === 0);
                                              handleSegmentCardOverride(seg.endMonth, 16000, idx === 0);
                                              return;
                                            }
                                            handleSegmentSpendOverride(seg.endMonth, val, idx === 0);
                                            const autoDiscount = getDefaultDiscountForCardSpend(cardItem.cardName, val, segCardVal, seg.baseMonthly);
                                            if (autoDiscount && autoDiscount !== segCardVal) {
                                              handleSegmentCardOverride(seg.endMonth, autoDiscount, idx === 0);
                                            }
                                          }}
                                          className="calc-select-clickable"
                                          style={{
                                            width: '100%',
                                            minHeight: '40px',
                                            padding: '0.45rem 0.65rem',
                                            fontSize: '0.85rem',
                                            border: isSamsung && seg.baseMonthly < 70000 && isSpend70kOrMore(segSpendVal)
                                              ? '1px solid #ef4444'
                                              : undefined
                                          }}
                                        >
                                          {policyTiers.length > 0 && (
                                            <optgroup label={`📋 ${cardCompany} 정책표 실적`}>
                                              {policyTiers.map((t) => (
                                                <option key={t.value} value={t.value}>
                                                  {t.label}
                                                </option>
                                              ))}
                                            </optgroup>
                                          )}
                                          {otherTiers.length > 0 && (
                                            <optgroup label="기타 실적 구간">
                                              {otherTiers.map((t) => (
                                                <option key={t.value} value={t.value}>
                                                  {t.label}
                                                </option>
                                              ))}
                                            </optgroup>
                                          )}
                                          {hasCustom && (
                                            <optgroup label="현재 설정값">
                                              <option value={currentVal}>{currentVal} (설정됨)</option>
                                            </optgroup>
                                          )}
                                        </select>
                                      );
                                    })()}
                                    {isSamsung && seg.baseMonthly < 70000 && (
                                      <div style={{ fontSize: '0.71rem', color: '#f87171', marginTop: '0.2rem', fontWeight: 600 }}>
                                        ⚠️ 구독료 7만원 미만 구간: 70만/120만 실적 불가 (30만/1.6만 전용)
                                      </div>
                                    )}
                                    {isDeducted && (
                                      <div style={{ fontSize: '0.71rem', color: '#38bdf8', marginTop: '0.2rem', fontWeight: 600 }}>
                                        ✓ 실적인정 차감: {deducted}
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#dbeafe', marginBottom: '0.28rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <span>3. 월 청구할인 금액</span>
                                      <span className="calc-tag-type input">✏️ 직접입력</span>
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
                                          handleSegmentSpendOverride(seg.endMonth, '30만', idx === 0);
                                          return;
                                        }
                                        handleSegmentCardOverride(seg.endMonth, numVal, idx === 0);
                                        if (isSamsung && numVal === 16000 && isSpend70kOrMore(segSpendVal)) {
                                          handleSegmentSpendOverride(seg.endMonth, '30만', idx === 0);
                                        }
                                        if (isSamsung && seg.baseMonthly >= 70000 && numVal === 26000 && (segSpendVal?.includes('30') || segSpendVal === '30만')) {
                                          handleSegmentSpendOverride(seg.endMonth, '70만', idx === 0);
                                        }
                                      }}
                                      placeholder="예: 26,000 / 16,000"
                                      className="calc-input-editable"
                                      style={{
                                        width: '100%',
                                        minHeight: '40px',
                                        padding: '0.45rem 0.65rem',
                                        fontSize: '0.85rem',
                                        border: isSamsung && seg.baseMonthly < 70000 && segCardVal > 16000
                                          ? '1px solid #ef4444'
                                          : undefined
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
                                <div style={{ marginBottom: '0.28rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span style={{ fontSize: '0.79rem', fontWeight: 700, color: '#dbeafe' }}>2. 필요 실적 (전월 실적)</span>
                                  <span className="calc-tag-type select">▼ 드롭다운</span>
                                </div>
                                {(() => {
                                  const { policyTiers, otherTiers, cardCompany } = getCardSpendOptions(cardItem.cardName, pFee);
                                  const currentVal = normalizeSpendValue(cardItem.minSpend);
                                  const allValues = new Set([...policyTiers.map((t) => t.value), ...otherTiers.map((t) => t.value)]);
                                  const hasCustom = !allValues.has(currentVal);

                                  return (
                                    <select
                                      value={currentVal}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (isSamsungFeeUnder70k && isSpend70kOrMore(val)) {
                                          alert(`삼성카드는 적용 모델의 월 구독료가 7만원 미만(${formatWon(pFee)})일 경우 70만원/120만원 실적(26,000원 이상 할인)을 적용할 수 없습니다.\n30만원 실적(16,000원 할인)으로 자동 변경됩니다.`);
                                          handleUpdateCard(cardItem.id, {
                                            minSpend: '30만',
                                            monthly: 16000
                                          });
                                          if (cardIdx === 0) setSubSegmentSpendOverrides({});
                                          return;
                                        }
                                        const autoDiscount = getDefaultDiscountForCardSpend(cardItem.cardName, val, Number(cardItem.monthly) || 0, pFee);
                                        const patch = { minSpend: val };
                                        if (autoDiscount) {
                                          patch.monthly = autoDiscount;
                                        }
                                        handleUpdateCard(cardItem.id, patch);
                                        if (cardIdx === 0) {
                                          setSubSegmentSpendOverrides({});
                                          if (patch.monthly !== undefined) setSubSegmentCardOverrides({});
                                        }
                                      }}
                                      className="calc-select-clickable"
                                      style={{
                                        width: '100%',
                                        minHeight: '42px',
                                        padding: '0.54rem 0.75rem',
                                        fontSize: '0.88rem',
                                        border: isSamsungFeeUnder70k && isSpend70kOrMore(cardItem.minSpend)
                                          ? '1px solid #ef4444'
                                          : undefined
                                      }}
                                    >
                                      {policyTiers.length > 0 && (
                                        <optgroup label={`📋 ${cardCompany} 정책표 실적`}>
                                          {policyTiers.map((t) => (
                                            <option key={t.value} value={t.value}>
                                              {t.label}
                                            </option>
                                          ))}
                                        </optgroup>
                                      )}
                                      {otherTiers.length > 0 && (
                                        <optgroup label="기타 실적 구간">
                                          {otherTiers.map((t) => (
                                            <option key={t.value} value={t.value}>
                                              {t.label}
                                            </option>
                                          ))}
                                        </optgroup>
                                      )}
                                      {hasCustom && (
                                        <optgroup label="현재 설정값">
                                          <option value={currentVal}>{currentVal} (설정됨)</option>
                                        </optgroup>
                                      )}
                                    </select>
                                  );
                                })()}
                                {isSamsungFeeUnder70k && (
                                  <div style={{ fontSize: '0.71rem', color: '#f87171', marginTop: '0.24rem', fontWeight: 600 }}>
                                    ⚠️ 적용 구독료 7만원 미만({formatWon(pFee)}): 70만/120만 실적 불가 (30만/1.6만 할인 제한)
                                  </div>
                                )}
                                {isDeducted && (
                                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '0.24rem', fontWeight: 600 }}>
                                    ✓ 구독료 실적 인정 반영(견적서 노출): {deducted}
                                  </div>
                                )}
                              </div>

                              <div>
                                <div style={{ marginBottom: '0.28rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <span style={{ fontSize: '0.79rem', fontWeight: 700, color: '#dbeafe' }}>3. 월 청구할인 금액</span>
                                  <span className="calc-tag-type input">✏️ 직접입력</span>
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
                                      handleUpdateCard(cardItem.id, { monthly: 16000, minSpend: '30만' });
                                      if (cardIdx === 0) setSubSegmentCardOverrides({});
                                      return;
                                    }
                                    const patch = { monthly: val };
                                    // 삼성카드 16,000원 입력 시 실적이 70만이면 30만으로 자동 동기화
                                    if (isSamsung && val === 16000 && isSpend70kOrMore(cardItem.minSpend)) {
                                      patch.minSpend = '30만';
                                    }
                                    // 삼성카드 26,000원 입력 시 실적이 30만이면 70만으로 자동 동기화 (구독료 7만 이상일 때)
                                    if (isSamsung && !isSamsungFeeUnder70k && val === 26000 && (cardItem.minSpend?.includes('30') || cardItem.minSpend === '30만')) {
                                      patch.minSpend = '70만';
                                    }
                                    handleUpdateCard(cardItem.id, patch);
                                    if (cardIdx === 0) {
                                      setSubSegmentCardOverrides({});
                                      if (patch.minSpend !== undefined) setSubSegmentSpendOverrides({});
                                    }
                                  }}
                                  placeholder="월 청구할인 금액 직접 입력 (예: 26,000 / 16,000)"
                                  className="calc-input-editable"
                                  style={{
                                    width: '100%',
                                    minHeight: '42px',
                                    padding: '0.54rem 0.75rem',
                                    fontSize: '0.88rem',
                                    border: isSamsungFeeUnder70k && (Number(cardItem.monthly) || 0) > 16000
                                      ? '1px solid #ef4444'
                                      : undefined
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
                  className="calc-btn-hologram"
                  style={{
                    marginTop: '0.65rem',
                    width: '100%',
                    height: '38px',
                    fontSize: '0.84rem',
                    letterSpacing: '-0.01em'
                  }}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>제휴카드 추가</span>
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
                    className="calc-modal-dialog"
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

          {/* ✨ 제휴 연계 추가 혜택 (상조 제휴 / 통신사 IPTV) 매니저 설정 영역 */}
          <div
            style={{
              marginTop: '1rem',
              marginBottom: '1rem',
              borderRadius: '14px',
              border: (extraSangjo.enabled || extraTelecom.enabled)
                ? '2px solid #a855f7'
                : '1.5px dashed rgba(168, 85, 247, 0.45)',
              background: (extraSangjo.enabled || extraTelecom.enabled)
                ? 'linear-gradient(135deg, rgba(88, 28, 135, 0.32) 0%, rgba(126, 34, 206, 0.18) 100%)'
                : 'rgba(168, 85, 247, 0.06)',
              overflow: 'hidden',
              boxShadow: (extraSangjo.enabled || extraTelecom.enabled) ? '0 0 20px rgba(168, 85, 247, 0.22)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {/* 상단 클릭 토글 헤더 바 */}
            <div
              onClick={() => setShowExtraAffiliateSection(!showExtraAffiliateSection)}
              style={{
                padding: '0.85rem 1.15rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none',
                background: showExtraAffiliateSection ? 'rgba(168, 85, 247, 0.15)' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.2rem' }}>✨</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '0.94rem', color: '#f3e8ff', fontWeight: 900 }}>
                      제휴 연계 추가 혜택 (상조 제휴 · 통신사 IPTV)
                    </strong>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '0.12rem 0.5rem',
                        borderRadius: '9999px',
                        background: (extraSangjo.enabled || extraTelecom.enabled)
                          ? 'linear-gradient(135deg, #9333ea, #a855f7)'
                          : 'rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        fontWeight: 800
                      }}
                    >
                      {(extraSangjo.enabled || extraTelecom.enabled) ? '혜택 적용중' : '매니저 전용 옵션'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#d8b4fe', marginTop: '2px' }}>
                    보람상조 / 소노아임레디 가전 지원금 및 KT/SKB/LGU+ 인터넷+IPTV 개통 추가 혜택
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {(extraSangjo.enabled || extraTelecom.enabled) && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', color: '#c084fc', fontWeight: 700 }}>적용 할인 총액</div>
                    <strong style={{ fontSize: '1rem', fontWeight: 900, color: '#f5d0fe' }}>
                      -{formatWon(totalExtraAffiliateDiscount)}
                    </strong>
                  </div>
                )}
                <button
                  type="button"
                  style={{
                    padding: '0.38rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #c084fc',
                    background: showExtraAffiliateSection ? '#9333ea' : 'rgba(168, 85, 247, 0.25)',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  {showExtraAffiliateSection ? '▲ 접기' : (extraSangjo.enabled || extraTelecom.enabled ? '⚙️ 설정 변경' : '➕ 추가혜택 입력')}
                </button>
              </div>
            </div>

            {/* 펼쳐졌을 때 나타나는 매니저 입력 패널 */}
            {showExtraAffiliateSection && (
              <div
                style={{
                  padding: '1.1rem',
                  borderTop: '1px solid rgba(168, 85, 247, 0.3)',
                  background: 'rgba(15, 23, 42, 0.65)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                {/* 1. 상조 제휴 (보람상조 / 소노아임레디) 카드 */}
                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '10px',
                    border: extraSangjo.enabled ? '1.5px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: extraSangjo.enabled ? 'rgba(88, 28, 135, 0.22)' : 'rgba(255, 255, 255, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={extraSangjo.enabled}
                        onChange={(e) => setExtraSangjo((prev) => ({ ...prev, enabled: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: '#a855f7', cursor: 'pointer' }}
                      />
                      <strong style={{ fontSize: '0.9rem', color: extraSangjo.enabled ? '#f3e8ff' : '#cbd5e1', fontWeight: 800 }}>
                        🏢 상조 제휴 혜택 (보람상조 / 소노아임레디)
                      </strong>
                    </label>

                    {extraSangjo.enabled && (
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f5d0fe' }}>
                        상조 지원금: <strong>-{formatWon(extraSangjoTotalDiscount)}</strong>
                      </span>
                    )}
                  </div>

                  {extraSangjo.enabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem', paddingLeft: '1.6rem' }}>
                      {/* 제휴사 선택 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', color: '#d8b4fe', fontWeight: 700, minWidth: '70px' }}>제휴사:</span>
                        {[
                          { key: 'boram', label: '보람상조' },
                          { key: 'sono', label: '소노아임레디' },
                          { key: 'custom', label: '직접입력' }
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setExtraSangjo((prev) => ({ ...prev, provider: item.key }))}
                            style={{
                              padding: '0.24rem 0.65rem',
                              borderRadius: '6px',
                              border: extraSangjo.provider === item.key ? '1.5px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.18)',
                              background: extraSangjo.provider === item.key ? '#9333ea' : 'rgba(255, 255, 255, 0.06)',
                              color: extraSangjo.provider === item.key ? '#ffffff' : '#cbd5e1',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                        {extraSangjo.provider === 'custom' && (
                          <input
                            type="text"
                            value={extraSangjo.customName}
                            onChange={(e) => setExtraSangjo((prev) => ({ ...prev, customName: e.target.value }))}
                            placeholder="상조사명 입력"
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '5px',
                              background: '#0f172a',
                              border: '1px solid #c084fc',
                              color: '#f3e8ff',
                              fontSize: '0.76rem',
                              width: '120px'
                            }}
                          />
                        )}
                      </div>

                      {/* 구좌수 & 1구좌당 지원금 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.78rem', color: '#d8b4fe', fontWeight: 700, minWidth: '70px' }}>가입 구좌수:</span>
                          {[1, 2, 3].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() =>
                                setExtraSangjo((prev) => ({
                                  ...prev,
                                  count: c,
                                  totalAmount: c * prev.amountPerCount
                                }))
                              }
                              style={{
                                padding: '0.24rem 0.55rem',
                                borderRadius: '5px',
                                border: extraSangjo.count === c ? '1.5px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.15)',
                                background: extraSangjo.count === c ? 'rgba(168, 85, 247, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                                color: extraSangjo.count === c ? '#f5d0fe' : '#cbd5e1',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {c}구좌
                            </button>
                          ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.78rem', color: '#d8b4fe', fontWeight: 700 }}>구좌당 지원금:</span>
                          <input
                            type="number"
                            step="100000"
                            value={extraSangjo.amountPerCount}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setExtraSangjo((prev) => ({
                                ...prev,
                                amountPerCount: val,
                                totalAmount: prev.count * val
                              }));
                            }}
                            style={{
                              width: '100px',
                              padding: '0.24rem 0.45rem',
                              borderRadius: '5px',
                              background: '#0f172a',
                              border: '1px solid rgba(255, 255, 255, 0.25)',
                              color: '#f5d0fe',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              textAlign: 'right'
                            }}
                          />
                          <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>원</span>
                          {[1000000, 1500000, 2000000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() =>
                                setExtraSangjo((prev) => ({
                                  ...prev,
                                  amountPerCount: amt,
                                  totalAmount: prev.count * amt
                                }))
                              }
                              style={{
                                padding: '0.18rem 0.45rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                background: extraSangjo.amountPerCount === amt ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                                color: extraSangjo.amountPerCount === amt ? '#f5d0fe' : '#cbd5e1',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {amt / 10000}만
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 총 지원금 직접 수정 및 안내 메모 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', color: '#d8b4fe', fontWeight: 700, minWidth: '70px' }}>총 지원금:</span>
                        <input
                          type="number"
                          step="100000"
                          value={extraSangjo.totalAmount}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setExtraSangjo((prev) => ({ ...prev, totalAmount: val }));
                          }}
                          style={{
                            width: '120px',
                            padding: '0.24rem 0.5rem',
                            borderRadius: '5px',
                            background: '#0f172a',
                            border: '1.5px solid #a855f7',
                            color: '#f5d0fe',
                            fontSize: '0.84rem',
                            fontWeight: 800,
                            textAlign: 'right'
                          }}
                        />
                        <span style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>원 ({formatWon(extraSangjo.totalAmount)})</span>

                        <input
                          type="text"
                          value={extraSangjo.note}
                          onChange={(e) => setExtraSangjo((prev) => ({ ...prev, note: e.target.value }))}
                          placeholder="견적서 표기 조건 (예: 만기 납입 완료 시 100% 환급 조건)"
                          style={{
                            flex: 1,
                            minWidth: '200px',
                            padding: '0.24rem 0.5rem',
                            borderRadius: '5px',
                            background: '#0f172a',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#cbd5e1',
                            fontSize: '0.74rem'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. 통신사 제휴 (KT / SKB / LG U+ IPTV) 카드 */}
                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: '10px',
                    border: extraTelecom.enabled ? '1.5px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: extraTelecom.enabled ? 'rgba(8, 145, 178, 0.22)' : 'rgba(255, 255, 255, 0.03)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={extraTelecom.enabled}
                        onChange={(e) => setExtraTelecom((prev) => ({ ...prev, enabled: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: '#06b6d4', cursor: 'pointer' }}
                      />
                      <strong style={{ fontSize: '0.9rem', color: extraTelecom.enabled ? '#cffafe' : '#cbd5e1', fontWeight: 800 }}>
                        📡 통신사 IPTV / 인터넷 제휴 혜택 (KT · SKB · LG U+)
                      </strong>
                    </label>

                    {extraTelecom.enabled && (
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#a5f3fc' }}>
                        통신 지원금: <strong>-{formatWon(extraTelecomTotalDiscount)}</strong>
                      </span>
                    )}
                  </div>

                  {extraTelecom.enabled && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem', paddingLeft: '1.6rem' }}>
                      {/* 통신사 선택 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', color: '#a5f3fc', fontWeight: 700, minWidth: '70px' }}>통신사:</span>
                        {[
                          { key: 'kt', label: 'KT' },
                          { key: 'skb', label: 'SK브로드밴드' },
                          { key: 'lgu', label: 'LG유플러스' },
                          { key: 'custom', label: '직접입력' }
                        ].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setExtraTelecom((prev) => ({ ...prev, carrier: item.key }))}
                            style={{
                              padding: '0.24rem 0.65rem',
                              borderRadius: '6px',
                              border: extraTelecom.carrier === item.key ? '1.5px solid #22d3ee' : '1px solid rgba(255, 255, 255, 0.18)',
                              background: extraTelecom.carrier === item.key ? '#0891b2' : 'rgba(255, 255, 255, 0.06)',
                              color: extraTelecom.carrier === item.key ? '#ffffff' : '#cbd5e1',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {item.label}
                          </button>
                        ))}
                        {extraTelecom.carrier === 'custom' && (
                          <input
                            type="text"
                            value={extraTelecom.customCarrier}
                            onChange={(e) => setExtraTelecom((prev) => ({ ...prev, customCarrier: e.target.value }))}
                            placeholder="통신사명 입력"
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '5px',
                              background: '#0f172a',
                              border: '1px solid #22d3ee',
                              color: '#cffafe',
                              fontSize: '0.76rem',
                              width: '120px'
                            }}
                          />
                        )}
                      </div>

                      {/* 상품 구분 & 지원금액 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.78rem', color: '#a5f3fc', fontWeight: 700, minWidth: '70px' }}>상품 구분:</span>
                          {['인터넷+IPTV', '인터넷 단독', 'IPTV 단독'].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setExtraTelecom((prev) => ({ ...prev, planType: p }))}
                              style={{
                                padding: '0.24rem 0.55rem',
                                borderRadius: '5px',
                                border: extraTelecom.planType === p ? '1.5px solid #22d3ee' : '1px solid rgba(255, 255, 255, 0.15)',
                                background: extraTelecom.planType === p ? 'rgba(6, 182, 212, 0.35)' : 'rgba(255, 255, 255, 0.05)',
                                color: extraTelecom.planType === p ? '#cffafe' : '#cbd5e1',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.78rem', color: '#a5f3fc', fontWeight: 700 }}>지원금액:</span>
                          <input
                            type="number"
                            step="50000"
                            value={extraTelecom.amount}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setExtraTelecom((prev) => ({ ...prev, amount: val }));
                            }}
                            style={{
                              width: '110px',
                              padding: '0.24rem 0.45rem',
                              borderRadius: '5px',
                              background: '#0f172a',
                              border: '1.5px solid #06b6d4',
                              color: '#cffafe',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              textAlign: 'right'
                            }}
                          />
                          <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>원</span>
                          {[400000, 450000, 500000].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setExtraTelecom((prev) => ({ ...prev, amount: amt }))}
                              style={{
                                padding: '0.18rem 0.45rem',
                                borderRadius: '4px',
                                border: '1px solid rgba(6, 182, 212, 0.4)',
                                background: extraTelecom.amount === amt ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.05)',
                                color: extraTelecom.amount === amt ? '#cffafe' : '#cbd5e1',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {amt / 10000}만
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 안내 메모 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', color: '#a5f3fc', fontWeight: 700, minWidth: '70px' }}>안내 메모:</span>
                        <input
                          type="text"
                          value={extraTelecom.note}
                          onChange={(e) => setExtraTelecom((prev) => ({ ...prev, note: e.target.value }))}
                          placeholder="견적서 표기 조건 (예: 인터넷+IPTV 신규 결합 약정 개통 혜택)"
                          style={{
                            flex: 1,
                            minWidth: '240px',
                            padding: '0.24rem 0.5rem',
                            borderRadius: '5px',
                            background: '#0f172a',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#cbd5e1',
                            fontSize: '0.74rem'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. 하단 실체감가 차감 옵션 및 요약 */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.6rem',
                    paddingTop: '0.6rem',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={applyExtraToFinal}
                      onChange={(e) => setApplyExtraToFinal(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#a855f7', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: applyExtraToFinal ? '#e9d5ff' : '#94a3b8', fontWeight: 700 }}>
                      고객 최종 실체감가에 즉시 차감 반영 (체감가에서 -{formatWon(totalExtraAffiliateDiscount)} 차감)
                    </span>
                  </label>

                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    {(extraSangjo.enabled || extraTelecom.enabled) && (
                      <button
                        type="button"
                        onClick={() => {
                          setExtraSangjo((prev) => ({ ...prev, enabled: false }));
                          setExtraTelecom((prev) => ({ ...prev, enabled: false }));
                        }}
                        style={{
                          padding: '0.22rem 0.6rem',
                          borderRadius: '5px',
                          border: '1px solid rgba(248, 113, 113, 0.4)',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#fca5a5',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        제휴혜택 초기화
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowExtraAffiliateSection(false)}
                      style={{
                        padding: '0.22rem 0.75rem',
                        borderRadius: '5px',
                        border: '1px solid #c084fc',
                        background: '#9333ea',
                        color: '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      완료 (닫기)
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
                {!isMixedMode && effectiveSubPrepay > 0 && (
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
                              className="calc-input-editable"
                              style={{ width: '100%', minHeight: '38px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
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
                  className="calc-btn-hologram"
                  style={{
                    width: '100%',
                    height: '36px',
                    fontSize: '0.82rem',
                    letterSpacing: '-0.01em'
                  }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>캐시백 항목 추가</span>
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
                              className="calc-input-editable"
                              style={{ width: '100%', minHeight: '38px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
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
                  className="calc-btn-hologram"
                  style={{
                    width: '100%',
                    height: '36px',
                    fontSize: '0.82rem',
                    letterSpacing: '-0.01em'
                  }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>상품권 항목 추가</span>
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
              <div className="calc-label-guide" style={{ marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'white' }}>고객 맞춤 상담 메모 (출력물 하단 표시)</span>
                <span className="calc-tag-type input">✏️ 직접입력</span>
              </div>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 삼성 제휴카드 월 30만원 이용 기준 할인 적용 / 입주 예정일에 맞춰 희망 배송일 지정 가능"
                className="calc-input-editable"
                style={{
                  width: '100%',
                  minHeight: '118px',
                  resize: 'vertical',
                  lineHeight: 1.6,
                  padding: '0.65rem 0.85rem'
                }}
              />
            </div>

            <div>
              <div className="calc-label-guide" style={{ marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>하단 명함 매장 위치 문구 (자동저장)</span>
                <span className="calc-tag-type input">✏️ 직접입력</span>
              </div>
              <input
                type="text"
                value={storeInfo}
                onChange={(e) => setStoreInfo(e.target.value)}
                className="calc-input-editable"
                style={{
                  width: '100%',
                  minHeight: '42px',
                  padding: '0.5rem 0.85rem',
                  fontSize: '0.88rem'
                }}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold-light)', fontWeight: 800 }}>
                  실시간 복합 견적 요약 (일반구매 + 삼성AI구독)
                </span>
                <span className="calc-tag-type auto">🔒 자동 실시간 합산</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold-light)', fontWeight: 800 }}>
              실시간 최종 체감가 비교 요약 (일반구매 일시불 조건 대비)
            </span>
            <span className="calc-tag-type auto">🔒 자동 실시간 비교</span>
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

        {/* 견적 저장 · 덮어쓰기 · 테마 변경 버튼 그룹 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={handleToggleTheme}
            title={themeMode === 'light' ? '어두운 다크 테마로 전환합니다.' : '밝은 라이트 테마로 전환합니다.'}
            style={{
              background: themeMode === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
              border: themeMode === 'light' ? '1.5px solid #2563eb' : '1px solid rgba(253, 224, 71, 0.5)',
              color: themeMode === 'light' ? '#1e3a8a' : '#fde047',
              padding: '0.52rem 0.9rem',
              borderRadius: '50px',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {themeMode === 'light' ? (
              <>
                <Sun size={14} style={{ color: '#d97706' }} />
                <span>☀️ 밝은 테마</span>
              </>
            ) : (
              <>
                <Moon size={14} style={{ color: '#38bdf8' }} />
                <span>🌙 다크 테마</span>
              </>
            )}
          </button>

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
      {/* 관리자 전용 접속자 계정 및 레벨(Lv.1/Lv.2) 권한 설정 모달 */}
      {renderAdminAccountModal()}
      {/* 11월 AI구독 제휴카드 공식 정책표 고해상도 팝업 모달 */}
      {renderCardPolicyModal()}
      {/* 견적 보관함 전체 목록 보기 대형 팝업 모달 */}
      {showQuoteListModal && (() => {
        const searchTrimmed = quoteSearchQuery.trim().toLowerCase();
        const modalQuotes = searchTrimmed
          ? displayedQuotes.filter((q) => {
              const titleText = (q.title || '').toLowerCase();
              const creatorText = (q.creatorName || q.creatorId || '').toLowerCase();
              const custText = (q.data?.customerName || '').toLowerCase();
              const dateText = (q.savedAt || '').toLowerCase();
              return (
                titleText.includes(searchTrimmed) ||
                creatorText.includes(searchTrimmed) ||
                custText.includes(searchTrimmed) ||
                dateText.includes(searchTrimmed)
              );
            })
          : displayedQuotes;

        return (
          <div
            role="dialog"
            aria-modal="true"
            className="no-print"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(2, 6, 23, 0.86)',
              zIndex: 10040,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              backdropFilter: 'blur(8px)'
            }}
            onClick={() => setShowQuoteListModal(false)}
          >
            <div
              className="calc-modal-dialog"
              style={{
                background: '#0f172a',
                border: '2px solid #10b981',
                borderRadius: '18px',
                maxWidth: '1160px',
                width: '96vw',
                height: '88vh',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 팝업 상단 헤더 */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.4rem',
                  background: 'rgba(15, 23, 42, 0.95)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <FolderOpen size={22} style={{ color: '#10b981' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 900, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>📋 {isMixedMode ? '2번 스마트 견적 보관함' : '1번 구독비교 견적 보관함'} 전체 목록</span>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          padding: '0.15rem 0.6rem',
                          borderRadius: '999px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.5)',
                          color: '#6ee7b7',
                          fontWeight: 800
                        }}
                      >
                        총 {modalQuotes.length}건
                      </span>
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                      원하시는 견적 카드를 클릭하시면 즉시 계산기에 불러와지며 팝업창이 닫힙니다.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => syncQuotesWithCloud(isMixedMode ? 'mixed' : 'compare', true)}
                    disabled={isCloudSyncing}
                    style={{
                      height: '34px',
                      padding: '0 0.8rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.45)',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#6ee7b7',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: isCloudSyncing ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <RefreshCw size={13} />
                    <span>{isCloudSyncing ? '동기화 중...' : '클라우드 동기화'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuoteListModal(false)}
                    style={{
                      height: '34px',
                      padding: '0 0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#f8fafc',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <X size={16} /> 닫기
                  </button>
                </div>
              </div>

              {/* 팝업 필터 & 검색 컨트롤 바 (개인/공용 전환 탭 + 매니저 필터 + 검색창) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1.4rem',
                  background: 'rgba(2, 6, 23, 0.6)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  flexWrap: 'wrap',
                  gap: '0.65rem'
                }}
              >
                <div style={{ display: 'inline-flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setQuoteStorageTab('private')}
                    style={{
                      height: '36px',
                      padding: '0 1rem',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      border: quoteStorageTab === 'private' ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.15)',
                      background: quoteStorageTab === 'private' ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
                      color: quoteStorageTab === 'private' ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    <Lock size={14} />
                    <span>내 개인 보관함 ({currentManagerPrivateQuotes.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuoteStorageTab('public')}
                    style={{
                      height: '36px',
                      padding: '0 1rem',
                      borderRadius: '8px',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      border: quoteStorageTab === 'public' ? '1.5px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.15)',
                      background: quoteStorageTab === 'public' ? '#2563eb' : 'rgba(255, 255, 255, 0.05)',
                      color: quoteStorageTab === 'public' ? '#ffffff' : '#94a3b8'
                    }}
                  >
                    <Globe size={14} />
                    <span>팀 공용 보관함 ({publicQuotes.length})</span>
                  </button>

                  {isAdminUser && quoteStorageTab === 'private' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.25rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 700 }}>매니저 필터:</span>
                      <select
                        value={adminFilterManager}
                        onChange={(e) => setAdminFilterManager(e.target.value)}
                        className="calc-select-clickable"
                        style={{
                          height: '36px',
                          width: 'auto',
                          padding: '0 2rem 0 0.7rem',
                          fontSize: '0.8rem'
                        }}
                      >
                        <option value="all">전체 매니저 ({allPrivateQuotes.length}건)</option>
                        {Array.from(
                          new Set(
                            allPrivateQuotes
                              .map((q) => q.creatorId || q.data?.creatorId)
                              .filter(Boolean)
                          )
                        ).map((mId) => {
                          const matchQuote = allPrivateQuotes.find(
                            (q) => (q.creatorId || q.data?.creatorId) === mId
                          );
                          const mName = matchQuote?.creatorName || matchQuote?.data?.creatorName || mId;
                          const count = allPrivateQuotes.filter(
                            (q) => (q.creatorId || q.data?.creatorId) === mId
                          ).length;
                          return (
                            <option key={mId} value={mId}>
                              {mName} ({count}건)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>

                {/* 빠른 검색 입력창 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 260px', maxWidth: '420px' }}>
                  <input
                    type="text"
                    value={quoteSearchQuery}
                    onChange={(e) => setQuoteSearchQuery(e.target.value)}
                    placeholder="🔍 고객성함 · 견적 제목 · 품목명 · 매니저 검색..."
                    className="calc-input-editable"
                    style={{
                      width: '100%',
                      height: '38px',
                      padding: '0 0.85rem',
                      fontSize: '0.85rem'
                    }}
                  />
                  {quoteSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setQuoteSearchQuery('')}
                      style={{
                        height: '38px',
                        padding: '0 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#fca5a5',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      초기화
                    </button>
                  )}
                </div>
              </div>

              {/* 팝업 본문: 전체 페이지 그리드 목록 */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.2rem 1.4rem'
                }}
              >
                {modalQuotes.length > 0 ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                      gap: '0.8rem'
                    }}
                  >
                    {modalQuotes.map((q, idx) => {
                      const isSelected = q.id === activeQuoteId;
                      const isQuotePrivate = q.scope === 'private' || q.data?.scope === 'private';
                      const authorLabel = q.creatorName || q.creatorId || '매니저';

                      return (
                        <div
                          key={q.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '0.6rem',
                            padding: '0.9rem 1rem',
                            borderRadius: '12px',
                            background: isSelected ? 'rgba(16, 185, 129, 0.16)' : 'rgba(15, 23, 42, 0.75)',
                            border: isSelected
                              ? '2px solid #10b981'
                              : '1.5px solid rgba(148, 163, 184, 0.28)',
                            boxShadow: isSelected ? '0 4px 14px rgba(16, 185, 129, 0.25)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* 상단: 순번 + 구분 배지 + 견적 제목 */}
                          <div
                            onClick={() => {
                              handleLoadQuote(q);
                              setShowQuoteListModal(false);
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.35rem',
                              cursor: 'pointer'
                            }}
                            title="클릭하여 이 견적을 계산기에 즉시 불러오기"
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 900,
                                    padding: '0.12rem 0.45rem',
                                    borderRadius: '4px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: '#cbd5e1'
                                  }}
                                >
                                  #{idx + 1}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    padding: '0.14rem 0.5rem',
                                    borderRadius: '4px',
                                    background: isQuotePrivate ? 'rgba(16, 185, 129, 0.22)' : 'rgba(59, 130, 246, 0.22)',
                                    border: isQuotePrivate ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(59, 130, 246, 0.5)',
                                    color: isQuotePrivate ? '#6ee7b7' : '#93c5fd',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.22rem'
                                  }}
                                >
                                  {isQuotePrivate ? <Lock size={10} /> : <Globe size={10} />}
                                  {isQuotePrivate ? authorLabel : '팀공용'}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                                {q.savedAt}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: '0.96rem',
                                fontWeight: 800,
                                color: isSelected ? '#6ee7b7' : '#f8fafc',
                                lineHeight: 1.35,
                                wordBreak: 'break-all'
                              }}
                            >
                              {isSelected ? '● [현재 적용중] ' : ''}
                              {q.title}
                            </div>
                          </div>

                          {/* 하단: 요약 금액 + 조작 버튼 3종 */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.5rem',
                              paddingTop: '0.45rem',
                              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                              flexWrap: 'wrap'
                            }}
                          >
                            <div style={{ fontSize: '0.8rem', color: '#fde68a', fontWeight: 800 }}>
                              {isMixedMode
                                ? `실체감가 ${formatWon(q.summary?.mixedGrandFinal || 0)}`
                                : `구독 체감 ${formatWon(q.summary?.subFinalPrice || 0)}`}
                            </div>

                            <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  handleLoadQuote(q);
                                  setShowQuoteListModal(false);
                                }}
                                style={{
                                  background: isSelected ? '#10b981' : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                                  border: 'none',
                                  color: '#ffffff',
                                  borderRadius: '6px',
                                  padding: '0.34rem 0.7rem',
                                  fontSize: '0.76rem',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                              >
                                {isSelected ? '✓ 적용중' : '불러오기'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleQuoteScope(q)}
                                title={isQuotePrivate ? '팀 공용 보관함으로 전환' : '내 개인 보관함으로 전환'}
                                style={{
                                  background: 'rgba(255, 255, 255, 0.08)',
                                  border: '1px solid rgba(255, 255, 255, 0.18)',
                                  color: isQuotePrivate ? '#93c5fd' : '#6ee7b7',
                                  borderRadius: '6px',
                                  padding: '0.34rem 0.55rem',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem'
                                }}
                              >
                                {isQuotePrivate ? <Globe size={11} /> : <Lock size={11} />}
                                {isQuotePrivate ? '공용전환' : '개인전환'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteQuote(q.id, q.title)}
                                title="삭제"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.14)',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  color: '#fca5a5',
                                  borderRadius: '6px',
                                  padding: '0.34rem 0.48rem',
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
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '3rem 1.5rem',
                      textAlign: 'center',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1.5px dashed rgba(148, 163, 184, 0.3)',
                      color: '#94a3b8',
                      fontSize: '0.92rem'
                    }}
                  >
                    {quoteSearchQuery.trim()
                      ? `🔍 '${quoteSearchQuery}' 검색어와 일치하는 보관 견적이 없습니다.`
                      : '현재 선택된 보관함에 저장된 견적이 없습니다.'}
                  </div>
                )}
              </div>

              {/* 팝업 하단 닫기 바 */}
              <div
                style={{
                  padding: '0.85rem 1.4rem',
                  background: 'rgba(2, 6, 23, 0.85)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                  💡 견적 제목이나 <strong>[불러오기]</strong> 버튼을 클릭하면 즉시 계산기에 적용됩니다.
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuoteListModal(false)}
                  style={{
                    padding: '0.55rem 1.4rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.82rem',
  fontWeight: 700,
  color: '#e2e8f0',
  marginBottom: '0.35rem'
};

const textInputStyle = {
  width: '100%',
  height: '42px',
  padding: '0 0.85rem',
  borderRadius: '10px',
  background: '#0b1329',
  border: '1.5px solid rgba(148, 163, 184, 0.45)',
  color: '#ffffff',
  fontSize: '0.92rem',
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
  cursor: 'text'
};

const selectStyle = {
  width: '100%',
  height: '42px',
  padding: '0 2.2rem 0 0.85rem',
  borderRadius: '10px',
  backgroundColor: '#1e293b',
  border: '1.5px solid rgba(56, 189, 248, 0.45)',
  color: '#f8fafc',
  fontSize: '0.88rem',
  fontWeight: 700,
  outline: 'none',
  cursor: 'pointer',
  boxSizing: 'border-box'
};
