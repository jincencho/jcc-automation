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
  Trash2
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

// 빠른 금액 입력 컴포넌트 (콤마 자동 포맷 + '×만' 단축 버튼)
function MoneyInput({ value, onChange, placeholder = '0', accentColor = 'var(--accent-gold)', compact = false }) {
  const numericValue = Number(value) || 0;
  const displayValue = numericValue === 0 ? '' : numericValue.toLocaleString('ko-KR');

  const handleTextChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(raw ? parseInt(raw, 10) : 0);
  };

  const multiplyMan = () => {
    if (numericValue > 0 && numericValue < 1000000) {
      onChange(numericValue * 10000);
    }
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
          padding: compact ? '0.5rem 0.7rem' : '0.68rem 0.85rem',
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
        <button
          type="button"
          onClick={multiplyMan}
          title="입력한 숫자에 만원 단위(×10,000) 적용 (예: 1500 → 1,500만원)"
          style={{
            background: 'rgba(212, 175, 55, 0.16)',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            color: 'var(--accent-gold-light)',
            borderRadius: '6px',
            padding: '0.24rem 0.48rem',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
        >
          ×만
        </button>
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
  const [subCardMonthly, setSubCardMonthly] = useState(0);
  const [subCardAuto70k, setSubCardAuto70k] = useState(true); // 구독료 7만원 이상 시 2.6만 / 미만 시 1.6만 자동 전환
  const [subSegmentCardOverrides, setSubSegmentCardOverrides] = useState({}); // 구간별 청구할인 수동 조정값
  const [subPurchaseBenefit, setSubPurchaseBenefit] = useState(0); // 통합 구독 구매 혜택 금액
  const [subFreeServiceAmount, setSubFreeServiceAmount] = useState(0); // 무상서비스 금액 합계
  const [subCareServiceAmount, setSubCareServiceAmount] = useState(0); // 케어서비스 합계 금액
  const [includeServiceInFinal, setIncludeServiceInFinal] = useState(true); // 무상·케어 금액을 최종 체감가에 반영

  const handleSelectCardPreset = (val) => {
    setSubCardMonthly(val);
    setSubSegmentCardOverrides({});
    if (val === 26000) {
      setSubCardAuto70k(true);
    }
  };

  const handleDirectSingleCardChange = (val) => {
    setSubCardMonthly(val);
    setSubSegmentCardOverrides({});
  };

  const handleSegmentCardOverride = (endMonth, val) => {
    setSubSegmentCardOverrides((prev) => ({ ...prev, [endMonth]: val }));
  };

  const handleAddSubPlan = () => {
    setSubPlans((prev) => {
      const usedMonths = prev.map((p) => p.months);
      const nextDefaultMonths = !usedMonths.includes(60)
        ? 60
        : !usedMonths.includes(72)
          ? 72
          : !usedMonths.includes(48)
            ? 48
            : 36;
      const nextId = prev.reduce((maxId, p) => Math.max(maxId, p.id), 0) + 1;
      return [...prev, { id: nextId, months: nextDefaultMonths, monthlyFee: 0, totalAmount: 0 }];
    });
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

  const cardMonthlyNum = Number(subCardMonthly) || 0;
  const subSegments = sortedUniqueMonths.map((endMonth, idx) => {
    const startMonth = idx === 0 ? 1 : sortedUniqueMonths[idx - 1] + 1;
    const duration = endMonth - startMonth + 1;
    const baseMonthly = activePlans
      .filter((p) => p.months >= endMonth)
      .reduce((sum, p) => sum + p.rowMonthly, 0);

    const hasManualOverride = Object.prototype.hasOwnProperty.call(subSegmentCardOverrides, endMonth);
    const isAutoAdjustedUnder70k =
      !hasManualOverride && subCardAuto70k && cardMonthlyNum === 26000 && baseMonthly > 0 && baseMonthly < 70000;
    const targetCard = hasManualOverride
      ? Number(subSegmentCardOverrides[endMonth]) || 0
      : isAutoAdjustedUnder70k
        ? 16000
        : cardMonthlyNum;

    const appliedCard = baseMonthly > 0 ? Math.min(baseMonthly, targetCard) : targetCard;
    const netMonthly = Math.max(0, baseMonthly - targetCard);
    return {
      startMonth,
      endMonth,
      duration,
      baseMonthly,
      targetCard,
      appliedCard,
      netMonthly,
      isAutoAdjustedUnder70k
    };
  });

  const uniqueAppliedCards = [...new Set(subSegments.map((s) => s.appliedCard))];
  const isSteppedCardDiscount = uniqueAppliedCards.length > 1;
  const hasAnyCardDiscount = subSegments.some((s) => s.appliedCard > 0);

  const lumpFinalPrice = Math.max(0, (Number(lumpBasePrice) || 0) - (Number(lumpTotalBenefit) || 0));
  const numericCardRate = Math.max(0, parseFloat(cardLowestRate) || 0);
  const lumpInstallment = calculateCardInstallment(lumpFinalPrice, numericCardRate, subMonths);

  const effectiveMonthlyBase = subSegments[0]?.baseMonthly || 0;
  const subGrossTotal =
    normalizedPlans.reduce((sum, p) => sum + p.rowGross, 0) + (Number(subPrepay) || 0);

  const subCardTotalDiscount = subSegments.reduce((sum, seg) => sum + seg.appliedCard * seg.duration, 0);
  const subMonthlyAfterCard = subSegments[0]?.netMonthly || 0;

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
    setSubCardMonthly(0);
    setSubCardAuto70k(true);
    setSubSegmentCardOverrides({});
    setSubPurchaseBenefit(0);
    setSubFreeServiceAmount(0);
    setSubCareServiceAmount(0);
    setIncludeServiceInFinal(true);
    setRecommendMode('auto');
    setCheckpoints(DEFAULT_CHECKPOINTS);
    setStep('input');
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
                      <div className="a4-benefit-row">
                        <span>
                          제휴카드 청구할인{' '}
                          {!hasAnyCardDiscount
                            ? '(미적용)'
                            : !isSteppedCardDiscount
                              ? `(월 ${formatWon(uniqueAppliedCards[0])}×${subMonths}개월)`
                              : ''}
                        </span>
                        <span className="a4-minus-blue">- {formatWon(subCardTotalDiscount)}</span>
                      </div>
                      {hasAnyCardDiscount && isSteppedCardDiscount && (
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: '#64748b',
                            fontWeight: 600,
                            marginTop: '1px',
                            lineHeight: 1.3
                          }}
                        >
                          {subSegments
                            .map((seg, idx) =>
                              idx === 0
                                ? `${seg.duration}개월 월 ${formatWon(seg.appliedCard)}`
                                : `잔여 ${seg.duration}개월 월 ${formatWon(seg.appliedCard)}`
                            )
                            .join(' · ')}
                        </div>
                      )}
                    </div>
                    <div className="a4-benefit-row">
                      <span>구독시 할인 혜택(캐시백)</span>
                      <span className="a4-minus-blue">- {formatWon(subPurchaseBenefit)}</span>
                    </div>
                    <div className="a4-benefit-row">
                      <span>무상수리 혜택(약정기간 동안)</span>
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
                    <div className="a4-footer-sub-note note-blue">
                      {subPrepay > 0 ? `선납 ${formatWon(subPrepay)} 외 초기부담 없음` : '초기 목돈 부담 0원'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. 핵심 체크 포인트 & 상담 메모 */}
            <div className="a4-info-box">
              {checkedPoints.length > 0 && (
                <div className="a4-checkpoints-grid">
                  {checkedPoints.map((cp) => (
                    <div key={cp.id} className="a4-checkpoint-item">
                      <CheckCircle2 size={13} style={{ color: '#1d4ed8', flexShrink: 0 }} />
                      <span>{cp.text}</span>
                    </div>
                  ))}
                </div>
              )}

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
          숫자 입력 후 <strong style={{ color: 'var(--accent-gold-light)' }}>[×만]</strong> 버튼을 누르시면 만원 단위가 즉시 적용됩니다. (예: 1500 → ×만 → 15,000,000원)
        </p>
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

            {/* 제휴카드 월 할인액 (구독료 7만원 이상 26,000원 / 미만 16,000원 자동 전환 및 구간별 조정 지원) */}
            <div style={{ marginBottom: '0.95rem', padding: '0.85rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                <label style={{ ...labelStyle, marginBottom: 0, color: '#93c5fd' }}>제휴카드 월 청구할인</label>
                <span style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 700 }}>
                  {isMultiPeriod ? `최대 ${subMonths}개월` : `${subMonths}개월`} 총 할인: - {formatWon(subCardTotalDiscount)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.32rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
                {[
                  { label: '미적용', val: 0 },
                  { label: '1.3만', val: 13000 },
                  { label: '1.6만', val: 16000 },
                  { label: '2만', val: 20000 },
                  { label: '2.3만', val: 23000 },
                  { label: '2.6만 (구독7만↑)', val: 26000 },
                  { label: '3만', val: 30000 }
                ].map((preset) => {
                  const isActive =
                    Object.keys(subSegmentCardOverrides).length === 0 && subCardMonthly === preset.val;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectCardPreset(preset.val)}
                      style={{
                        padding: '0.26rem 0.52rem',
                        borderRadius: '6px',
                        border: isActive ? '1px solid #60a5fa' : '1px solid var(--glass-border)',
                        background: isActive ? 'rgba(59, 130, 246, 0.38)' : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {subCardMonthly === 26000 && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.74rem',
                    color: '#bfdbfe',
                    marginBottom: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={subCardAuto70k}
                    onChange={(e) => setSubCardAuto70k(e.target.checked)}
                  />
                  월 구독료 7만원 미만 구간은 16,000원으로 자동 전환 적용
                </label>
              )}

              {isMultiPeriod ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {subSegments.map((seg, idx) => (
                    <div key={seg.endMonth}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.76rem',
                          marginBottom: '0.22rem',
                          color: '#cbd5e1',
                          gap: '0.4rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span>
                          {idx === 0
                            ? `${seg.duration}개월간 (1~${seg.endMonth}개월 · 구독료 ${formatWon(seg.baseMonthly)})`
                            : `나머지 ${seg.duration}개월 (${seg.startMonth}~${seg.endMonth}개월 · 구독료 ${formatWon(seg.baseMonthly)})`}
                        </span>
                        {seg.isAutoAdjustedUnder70k ? (
                          <span style={{ color: '#fcd34d', fontWeight: 700, fontSize: '0.72rem' }}>
                            7만원 미만 → 1.6만 자동적용
                          </span>
                        ) : (
                          idx > 0 &&
                          seg.targetCard > 16000 && (
                            <button
                              type="button"
                              onClick={() => handleSegmentCardOverride(seg.endMonth, 16000)}
                              style={{
                                background: 'rgba(251, 191, 36, 0.14)',
                                border: '1px solid rgba(251, 191, 36, 0.45)',
                                color: '#fde68a',
                                borderRadius: '5px',
                                padding: '0.1rem 0.4rem',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              1.6만 전환
                            </button>
                          )
                        )}
                      </div>
                      <MoneyInput
                        value={seg.targetCard}
                        onChange={(val) => handleSegmentCardOverride(seg.endMonth, val)}
                        compact
                        accentColor="#93c5fd"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <MoneyInput
                    value={subSegments[0]?.targetCard ?? subCardMonthly}
                    onChange={handleDirectSingleCardChange}
                    compact
                    accentColor="#93c5fd"
                  />
                  {subSegments[0]?.isAutoAdjustedUnder70k && (
                    <div style={{ fontSize: '0.73rem', color: '#fcd34d', marginTop: '0.3rem', fontWeight: 600 }}>
                      ※ 월 구독료가 7만원 미만이어서 16,000원 청구할인으로 자동 전환되었습니다.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 구독시 할인 혜택(캐시백) */}
            <div style={{ marginBottom: '0.95rem' }}>
              <label style={{ ...labelStyle, fontSize: '0.9rem', color: 'white' }}>
                구독시 할인 혜택(캐시백)
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
                    <ShieldCheck size={14} style={{ color: '#34d399' }} /> 무상서비스 금액 합계
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
          {/* 체크 포인트 & 추천 배지 */}
          <div>
            <label style={{ ...labelStyle, fontSize: '0.95rem', color: 'white', marginBottom: '0.65rem' }}>
              <Sparkles size={15} style={{ verticalAlign: 'middle', marginRight: '0.35rem', color: 'var(--accent-gold)' }} />
              비교 결과지 강조 포인트 선택
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {checkpoints.map((cp) => (
                <label
                  key={cp.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.55rem 0.8rem',
                    borderRadius: '8px',
                    background: cp.checked ? 'rgba(59, 130, 246, 0.14)' : 'rgba(255,255,255,0.03)',
                    border: cp.checked ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    opacity: cp.id === 'cp3' && !hasCareService ? 0.5 : 1
                  }}
                >
                  <input
                    type="checkbox"
                    checked={cp.checked}
                    onChange={() => toggleCheckpoint(cp.id)}
                  />
                  <span>
                    {cp.text}
                    {cp.id === 'cp3' && !hasCareService ? ' (케어서비스 미입력 시 출력 제외)' : ''}
                  </span>
                </label>
              ))}
            </div>

            <label style={labelStyle}>비교 결과 상단 추천 플랜 강조 방식</label>
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
