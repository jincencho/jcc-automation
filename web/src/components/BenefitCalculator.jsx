import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Calculator,
  Printer,
  ArrowLeft,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Award,
  Phone,
  MapPin,
  MessageCircle,
  Globe,
  FileCheck2,
  ChevronRight
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
          padding: compact ? '0.45rem 0.65rem' : '0.65rem 0.85rem',
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
            fontSize: compact ? '0.98rem' : '1.1rem',
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
            padding: '0.22rem 0.45rem',
            fontSize: '0.75rem',
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
        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: accentColor, marginTop: '0.2rem', fontWeight: 600 }}>
          {formatKoreanCurrencyHint(numericValue)}
        </div>
      )}
    </div>
  );
}

const DEFAULT_LUMP_BENEFITS = [
  { id: 'l1', label: '즉시할인 / 다품목 할인', amount: 0 },
  { id: 'l2', label: '카드 청구할인 / 캐시백', amount: 0 },
  { id: 'l3', label: '백화점 상품권 증정', amount: 0 },
  { id: 'l4', label: '삼성 멤버십 포인트', amount: 0 },
  { id: 'l5', label: '웨딩·입주·특별 추가혜택', amount: 0 }
];

const DEFAULT_SUB_BENEFITS = [
  { id: 's1', label: '구독 캐시백 / 결제혜택', amount: 0 },
  { id: 's2', label: '백화점 상품권 증정', amount: 0 },
  { id: 's3', label: '삼성 멤버십 포인트', amount: 0 },
  { id: 's4', label: '다품목 구독 / 특별혜택', amount: 0 }
];

const DEFAULT_CHECKPOINTS = [
  { id: 'cp1', text: '계약 기간 전 품목 무상 A/S 보증 포함', checked: true },
  { id: 'cp2', text: '초기 목돈 지출 부담 ZERO (여유자금 활용)', checked: true },
  { id: 'cp3', text: '전문 엔지니어 케어 서비스 및 소모품 관리', checked: true },
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

  // 매니저 명함 정보 (localStorage 저장)
  const [managerPhone, setManagerPhone] = useState(() => localStorage.getItem('jcc_calc_manager_phone') || '');
  const [storeInfo, setStoreInfo] = useState(
    () => localStorage.getItem('jcc_calc_store_info') || '경남 진주시 동부로 79 (진주 백화점·로드샵 통합매장)'
  );

  useEffect(() => {
    localStorage.setItem('jcc_calc_manager_phone', managerPhone);
  }, [managerPhone]);

  useEffect(() => {
    localStorage.setItem('jcc_calc_store_info', storeInfo);
  }, [storeInfo]);

  // 1) 일시불 구매 상태
  const [lumpBasePrice, setLumpBasePrice] = useState(0);
  const [lumpBenefits, setLumpBenefits] = useState(DEFAULT_LUMP_BENEFITS);
  const [lumpDirectMode, setLumpDirectMode] = useState(false); // 체감가 직접 입력 모드
  const [lumpManualFinal, setLumpManualFinal] = useState(0);

  // 2) 삼성 AI 구독클럽 상태
  const [subMonths, setSubMonths] = useState(60);
  const [subInputMode, setSubInputMode] = useState('monthly'); // 'monthly' | 'total'
  const [subMonthlyFee, setSubMonthlyFee] = useState(0);
  const [subTotalInput, setSubTotalInput] = useState(0);
  const [subPrepay, setSubPrepay] = useState(0);
  const [subCardMonthly, setSubCardMonthly] = useState(0);
  const [subBenefits, setSubBenefits] = useState(DEFAULT_SUB_BENEFITS);
  const [subCareValue, setSubCareValue] = useState(0);
  const [includeCareInFinal, setIncludeCareInFinal] = useState(false);

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
  const lumpBenefitSum = lumpBenefits.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const lumpFinalPrice = lumpDirectMode
    ? Math.max(0, Number(lumpManualFinal) || 0)
    : Math.max(0, (Number(lumpBasePrice) || 0) - lumpBenefitSum);
  const lumpEffectiveBenefit = lumpDirectMode
    ? Math.max(0, (Number(lumpBasePrice) || 0) - lumpFinalPrice)
    : lumpBenefitSum;

  const effectiveMonthlyBase =
    subInputMode === 'monthly'
      ? Number(subMonthlyFee) || 0
      : subMonths > 0
        ? Math.round(Math.max(0, (Number(subTotalInput) || 0) - (Number(subPrepay) || 0)) / subMonths)
        : 0;

  const subGrossTotal =
    subInputMode === 'monthly'
      ? effectiveMonthlyBase * subMonths + (Number(subPrepay) || 0)
      : Number(subTotalInput) || 0;

  const subCardTotalDiscount = (Number(subCardMonthly) || 0) * subMonths;
  const subMonthlyAfterCard = Math.max(0, effectiveMonthlyBase - (Number(subCardMonthly) || 0));
  const subOneTimeBenefitSum = subBenefits.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const subTotalBenefitSum =
    subCardTotalDiscount + subOneTimeBenefitSum + (includeCareInFinal ? Number(subCareValue) || 0 : 0);

  const subFinalPrice = Math.max(0, subGrossTotal - subTotalBenefitSum);
  const subEffectiveMonthly = subMonths > 0 ? Math.round(subFinalPrice / subMonths) : 0;

  // 체감가 차이 분석
  const rawDiff = lumpFinalPrice - subFinalPrice; // 양수면 구독이 더 저렴, 음수면 일시불이 더 저렴
  const absDiff = Math.abs(rawDiff);

  const winner =
    recommendMode === 'sub'
      ? 'sub'
      : recommendMode === 'lump'
        ? 'lump'
        : rawDiff >= 0
          ? 'sub'
          : 'lump';

  // ---------------- 항목 수정 헬퍼 ----------------
  const updateBenefitItem = (setter, id, field, val) => {
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)));
  };

  const addBenefitItem = (setter, prefix) => {
    setter((prev) => [
      ...prev,
      { id: `${prefix}_${Date.now()}`, label: '추가 프로모션 혜택', amount: 0 }
    ]);
  };

  const removeBenefitItem = (setter, id) => {
    setter((prev) => prev.filter((item) => item.id !== id));
  };

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
    setLumpBenefits(DEFAULT_LUMP_BENEFITS.map((b) => ({ ...b, amount: 0 })));
    setLumpDirectMode(false);
    setLumpManualFinal(0);
    setSubMonths(60);
    setSubInputMode('monthly');
    setSubMonthlyFee(0);
    setSubTotalInput(0);
    setSubPrepay(0);
    setSubCardMonthly(0);
    setSubBenefits(DEFAULT_SUB_BENEFITS.map((b) => ({ ...b, amount: 0 })));
    setSubCareValue(0);
    setIncludeCareInFinal(false);
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
    const activeLumpBenefits = lumpBenefits.filter((b) => Number(b.amount) > 0);
    const activeSubBenefits = subBenefits.filter((b) => Number(b.amount) > 0);
    const checkedPoints = checkpoints.filter((c) => c.checked);

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
              color: '#bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <span>
              💡 <strong>인쇄 팁:</strong> 인쇄 설정(더보기)에서 <strong>&lsquo;배경 그래픽&rsquo;</strong>을 체크하고 <strong>&lsquo;머리글 및 바닥글&rsquo;</strong>을 해제하시면 A4 한 장에 가장 깔끔하게 출력됩니다.
            </span>
          </div>
        </div>

        {/* ==================== A4 출력 시트 ==================== */}
        <div className="a4-sheet-wrapper">
          <div className="a4-print-sheet">
            {/* 1. 상단 리포트 헤더 */}
            <header className="a4-header">
              <div className="a4-header-left">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                  <img
                    src="/images/logo_new.png"
                    alt="JCC"
                    style={{ height: '34px', width: 'auto', objectFit: 'contain' }}
                  />
                  <span className="a4-tag-gold">PREMIUM BENEFIT REPORT</span>
                </div>
                <h1 className="a4-doc-title">가전 구매 방식별 맞춤 혜택 비교 분석서</h1>
                <p className="a4-doc-subtitle">일시불 구매 vs 삼성 AI 구독클럽 실체감 혜택 비교</p>
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
              <div className="a4-highlight-badge-top">
                <Award size={16} />
                <span>JCC 진센조 맞춤 비교 분석 결과</span>
              </div>

              {rawDiff > 0 ? (
                <div className="a4-highlight-main">
                  <div className="a4-highlight-headline">
                    <strong>삼성 AI 구독클럽</strong> 선택 시 일시불 대비 최종 체감가가{' '}
                    <span className="a4-diff-pill">{formatWon(absDiff)} 더 유리</span>합니다!
                  </div>
                  <div className="a4-highlight-sub">
                    초기 목돈 <strong>{subPrepay > 0 ? `${formatWon(subPrepay)} 외 부담 ZERO` : '0원'}</strong> · 모든 혜택 반영 시{' '}
                    <strong>월 체감 {formatWon(subEffectiveMonthly)}</strong> ({subMonths}개월 무상 A/S 보증 포함)
                  </div>
                </div>
              ) : rawDiff < 0 ? (
                <div className="a4-highlight-main">
                  {winner === 'sub' ? (
                    <>
                      <div className="a4-highlight-headline">
                        <strong>삼성 AI 구독클럽</strong> 선택 시 초기 목돈 <strong>{formatWon(lumpFinalPrice)} 지출 없이</strong>{' '}
                        <span className="a4-diff-pill">월 체감 {formatWon(subEffectiveMonthly)}</span>으로 이용 가능!
                      </div>
                      <div className="a4-highlight-sub">
                        일시불 총액 대비 차이는 {formatWon(absDiff)}(월 약 {formatWon(Math.round(absDiff / subMonths))})이며,{' '}
                        <strong>{subMonths}개월 전 품목 무상 A/S 및 전문 케어</strong>가 기본 포함됩니다.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="a4-highlight-headline">
                        <strong>일시불 구매</strong> 선택 시 총 최종 체감가가{' '}
                        <span className="a4-diff-pill">{formatWon(absDiff)} 더 절감</span>됩니다!
                      </div>
                      <div className="a4-highlight-sub">
                        목돈 여유가 있으시면 <strong>일시불({formatWon(lumpFinalPrice)})</strong>이 유리하며, 초기 자금 확보 및{' '}
                        <strong>{subMonths}개월 무상 A/S</strong>를 원하시면 <strong>구독(월 체감 {formatWon(subEffectiveMonthly)})</strong>을 추천드립니다.
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="a4-highlight-main">
                  <div className="a4-highlight-headline">
                    일시불 구매와 삼성 AI 구독클럽의 최종 체감가가 <span className="a4-diff-pill">{formatWon(lumpFinalPrice)}으로 동일</span>합니다!
                  </div>
                  <div className="a4-highlight-sub">
                    초기 목돈 부담 없이 <strong>{subMonths}개월 무상 A/S</strong>까지 챙기실 수 있는 <strong>삼성 AI 구독클럽</strong> 또는 일시불 중 편하신 방식을 선택하세요.
                  </div>
                </div>
              )}
            </div>

            {/* 3. 좌우 1:1 비교 카드 영역 */}
            <div className="a4-compare-grid">
              {/* 좌측: 일시불 구매 */}
              <div className={`a4-plan-card ${winner === 'lump' ? 'a4-plan-recommended' : ''}`}>
                <div className="a4-plan-header plan-lump">
                  <div>
                    <span className="a4-plan-kicker">OPTION A · 일시불 / 일반결제</span>
                    <h2 className="a4-plan-title">일시불 구매 조건</h2>
                  </div>
                  {winner === 'lump' && <span className="a4-rec-chip">추천 플랜</span>}
                </div>

                <div className="a4-plan-body">
                  <div className="a4-row a4-row-base">
                    <span>총 기준 구매금액</span>
                    <strong>{formatWon(lumpBasePrice)}</strong>
                  </div>

                  <div className="a4-row">
                    <span>초기 결제 목돈 부담</span>
                    <strong style={{ color: '#b91c1c' }}>일시 전액 결제</strong>
                  </div>

                  <div className="a4-divider-label">적용 혜택 상세 내역</div>
                  <div className="a4-benefit-list">
                    {lumpDirectMode ? (
                      <div className="a4-benefit-row">
                        <span>통합 할인·캐시백·상품권 혜택 합계</span>
                        <span className="a4-minus">- {formatWon(lumpEffectiveBenefit)}</span>
                      </div>
                    ) : activeLumpBenefits.length > 0 ? (
                      activeLumpBenefits.map((item) => (
                        <div key={item.id} className="a4-benefit-row">
                          <span>{item.label}</span>
                          <span className="a4-minus">- {formatWon(item.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="a4-benefit-empty">입력된 추가 할인 내역 없음</div>
                    )}
                  </div>

                  <div className="a4-row a4-benefit-total-row">
                    <span>총 혜택 금액 합계</span>
                    <strong className="a4-minus">- {formatWon(lumpEffectiveBenefit)}</strong>
                  </div>

                  <div className="a4-row">
                    <span>무상 A/S 보증 기간</span>
                    <span>기본 보증 (품목별 1~2년)</span>
                  </div>
                </div>

                <div className="a4-plan-footer footer-lump">
                  <div className="a4-final-row">
                    <span className="a4-final-label">일시불 최종 체감가</span>
                    <strong className="a4-final-price">{formatWon(lumpFinalPrice)}</strong>
                  </div>
                  <div className="a4-final-sub">
                    {subMonths}개월 환산 시 월 약 {formatWon(subMonths > 0 ? Math.round(lumpFinalPrice / subMonths) : 0)} 수준
                  </div>
                </div>
              </div>

              {/* 우측: 삼성 AI 구독클럽 */}
              <div className={`a4-plan-card ${winner === 'sub' ? 'a4-plan-recommended-blue' : ''}`}>
                <div className="a4-plan-header plan-sub">
                  <div>
                    <span className="a4-plan-kicker">OPTION B · {subMonths}개월 약정 ({subMonths / 12}년)</span>
                    <h2 className="a4-plan-title">삼성 AI 구독클럽</h2>
                  </div>
                  {winner === 'sub' && <span className="a4-rec-chip chip-blue">추천 플랜</span>}
                </div>

                <div className="a4-plan-body">
                  <div className="a4-row a4-row-base">
                    <span>총 구독 약정 기준금액 ({subMonths}개월)</span>
                    <strong>{formatWon(subGrossTotal)}</strong>
                  </div>

                  <div className="a4-row">
                    <span>월 기본 구독료 / 초기비용</span>
                    <strong>
                      월 {formatWon(effectiveMonthlyBase)}
                      {subPrepay > 0 ? ` · 선납 ${formatWon(subPrepay)}` : ' · 초기 0원'}
                    </strong>
                  </div>

                  <div className="a4-divider-label">적용 혜택 상세 내역</div>
                  <div className="a4-benefit-list">
                    {subCardMonthly > 0 && (
                      <div className="a4-benefit-row">
                        <span>제휴카드 할인 (월 {formatWon(subCardMonthly)} × {subMonths}개월)</span>
                        <span className="a4-minus-blue">- {formatWon(subCardTotalDiscount)}</span>
                      </div>
                    )}
                    {activeSubBenefits.map((item) => (
                      <div key={item.id} className="a4-benefit-row">
                        <span>{item.label}</span>
                        <span className="a4-minus-blue">- {formatWon(item.amount)}</span>
                      </div>
                    ))}
                    {subCareValue > 0 && (
                      <div className="a4-benefit-row">
                        <span>
                          무상 A/S·케어 환산가치 {includeCareInFinal ? '(체감가 반영)' : '(추가 무상혜택)'}
                        </span>
                        <span className="a4-minus-blue">
                          {includeCareInFinal ? `- ${formatWon(subCareValue)}` : `+ ${formatWon(subCareValue)} 상당`}
                        </span>
                      </div>
                    )}
                    {subCardMonthly === 0 && activeSubBenefits.length === 0 && subCareValue === 0 && (
                      <div className="a4-benefit-empty">입력된 추가 할인 내역 없음</div>
                    )}
                  </div>

                  <div className="a4-row a4-benefit-total-row">
                    <span>총 구독 혜택 합계</span>
                    <strong className="a4-minus-blue">- {formatWon(subTotalBenefitSum)}</strong>
                  </div>

                  <div className="a4-row">
                    <span>무상 A/S · 케어서비스</span>
                    <strong style={{ color: '#1d4ed8' }}>{subMonths}개월 무상 A/S 보증 포함</strong>
                  </div>
                </div>

                <div className="a4-plan-footer footer-sub">
                  <div className="a4-monthly-summary">
                    <span>제휴카드 적용 월 실납부액</span>
                    <strong>월 {formatWon(subMonthlyAfterCard)}</strong>
                  </div>
                  <div className="a4-final-row">
                    <span className="a4-final-label">구독 최종 체감 총액</span>
                    <strong className="a4-final-price price-blue">{formatWon(subFinalPrice)}</strong>
                  </div>
                  <div className="a4-final-sub sub-blue">
                    모든 초기·카드 혜택 반영 시 <strong>월 최종 체감 {formatWon(subEffectiveMonthly)}</strong>
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
                      <CheckCircle2 size={14} style={{ color: '#1d4ed8', flexShrink: 0 }} />
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
                * 본 비교 분석서는 상담일 기준 프로모션 및 제휴카드 할인 조건을 바탕으로 산출된 고객 맞춤형 예상 혜택 안내 자료이며, 실제 결제 시점의 정책 및 전월 카드 이용실적 충족 여부에 따라 일부 혜택이 변동될 수 있습니다.
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
                    조준석 매니저 <span className="a4-manager-brand">| JCC 진센조 (JINJU CENTUM CHOJUNSEOK)</span>
                  </div>
                  <div className="a4-manager-quote">
                    &ldquo;백화점과 로드샵의 모든 혜택을 한 곳에서 비교하여 고객님께 가장 유리한 정답만 제안합니다.&rdquo;
                  </div>
                </div>
              </div>

              <div className="a4-manager-right">
                {managerPhone.trim() && (
                  <div className="a4-contact-item">
                    <Phone size={13} />
                    <strong>직통 문의: {managerPhone.trim()}</strong>
                  </div>
                )}
                <div className="a4-contact-item">
                  <MapPin size={13} />
                  <span>{storeInfo}</span>
                </div>
                <div className="a4-contact-item">
                  <MessageCircle size={13} />
                  <span>카카오톡 채널 검색: <strong>진센조</strong></span>
                </div>
                <div className="a4-contact-item">
                  <Globe size={13} />
                  <span>공식 홈페이지: jcc-band.vercel.app</span>
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
    <section className="container" style={{ paddingTop: '1.5rem', paddingBottom: '6rem', maxWidth: '1180px' }}>
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
          일시불 구매 vs <span className="text-gradient">삼성 AI 구독클럽</span> 혜택 계산기
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          숫자 입력 후 <strong style={{ color: 'var(--accent-gold-light)' }}>[×만]</strong> 버튼을 누르시면 만원 단위가 즉시 입력됩니다. (예: 1500 → ×만 → 15,000,000원)
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
        {/* ==================== 좌측: 일시불 구매 카드 ==================== */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '1px' }}>OPTION A</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>💳 일시불 구매 조건</h3>
              </div>
              <button
                type="button"
                onClick={() => setLumpDirectMode(!lumpDirectMode)}
                style={{
                  background: lumpDirectMode ? 'rgba(212, 175, 55, 0.22)' : 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--accent-gold)',
                  color: 'var(--accent-gold-light)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {lumpDirectMode ? '세부 할인별 입력으로 전환' : '체감가만 바로 입력'}
              </button>
            </div>

            {/* 총 구매 기준금액 */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ ...labelStyle, fontSize: '0.95rem', color: 'white' }}>총 구매 기준금액 (정상가/행사가 합계)</label>
              <MoneyInput value={lumpBasePrice} onChange={setLumpBasePrice} placeholder="0" />
            </div>

            {lumpDirectMode ? (
              <div style={{ marginBottom: '1.25rem', padding: '1rem', borderRadius: '12px', background: 'rgba(212, 175, 55, 0.08)', border: '1px dashed rgba(212, 175, 55, 0.4)' }}>
                <label style={{ ...labelStyle, fontSize: '0.95rem', color: 'var(--accent-gold-light)' }}>
                  일시불 최종 체감가 직접 입력
                </label>
                <MoneyInput value={lumpManualFinal} onChange={setLumpManualFinal} placeholder="최종 체감가 입력" />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  * 기준금액과의 차액({formatWon(lumpEffectiveBenefit)})이 총 혜택 금액으로 자동 계산됩니다.
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>할인 · 캐시백 · 상품권 혜택 입력</span>
                  <button
                    type="button"
                    onClick={() => addBenefitItem(setLumpBenefits, 'lump')}
                    style={miniAddBtnStyle}
                  >
                    <Plus size={14} /> 항목 추가
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {lumpBenefits.map((item) => (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.2fr auto', gap: '0.5rem', alignItems: 'start' }}>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateBenefitItem(setLumpBenefits, item.id, 'label', e.target.value)}
                        style={{ ...textInputStyle, padding: '0.55rem 0.65rem', fontSize: '0.85rem' }}
                      />
                      <MoneyInput
                        value={item.amount}
                        onChange={(val) => updateBenefitItem(setLumpBenefits, item.id, 'amount', val)}
                        compact
                      />
                      <button
                        type="button"
                        onClick={() => removeBenefitItem(setLumpBenefits, item.id)}
                        title="항목 삭제"
                        style={trashBtnStyle}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 일시불 실시간 요약 박스 */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1.15rem',
              borderRadius: '14px',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              <span>총 혜택 차감 합계</span>
              <strong style={{ color: '#fca5a5' }}>- {formatWon(lumpEffectiveBenefit)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>일시불 최종 체감가</span>
              <strong style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-gold-light)' }}>
                {formatWon(lumpFinalPrice)}
              </strong>
            </div>
          </div>
        </div>

        {/* ==================== 우측: 삼성 AI 구독클럽 카드 ==================== */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '1px' }}>OPTION B</span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>✨ 삼성 AI 구독클럽</h3>
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

            {/* 구독 기간 선택 */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>구독 약정 기간 선택</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[36, 48, 60, 72].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSubMonths(m)}
                    style={{
                      padding: '0.6rem 0.3rem',
                      borderRadius: '10px',
                      border: subMonths === m ? '2px solid #60a5fa' : '1px solid var(--glass-border)',
                      background: subMonths === m ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.04)',
                      color: subMonths === m ? 'white' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    {m}개월 ({m / 12}년)
                  </button>
                ))}
              </div>
            </div>

            {/* 월 기본 구독료 or 총 구독금액 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {subInputMode === 'monthly' ? (
                <div>
                  <label style={{ ...labelStyle, color: 'white' }}>월 기본 구독료 합계</label>
                  <MoneyInput value={subMonthlyFee} onChange={setSubMonthlyFee} accentColor="#93c5fd" />
                </div>
              ) : (
                <div>
                  <label style={{ ...labelStyle, color: 'white' }}>총 구독 약정금액 합계</label>
                  <MoneyInput value={subTotalInput} onChange={setSubTotalInput} accentColor="#93c5fd" />
                </div>
              )}
              <div>
                <label style={labelStyle}>선납금 (선택)</label>
                <MoneyInput value={subPrepay} onChange={setSubPrepay} accentColor="#93c5fd" />
              </div>
            </div>

            {/* 제휴카드 월 할인액 + 단축 버튼 */}
            <div style={{ marginBottom: '1rem', padding: '0.85rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.3rem' }}>
                <label style={{ ...labelStyle, marginBottom: 0, color: '#93c5fd' }}>제휴카드 월 청구할인</label>
                <span style={{ fontSize: '0.78rem', color: '#93c5fd', fontWeight: 700 }}>
                  {subMonths}개월 총 할인: - {formatWon(subCardTotalDiscount)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
                {[
                  { label: '미적용', val: 0 },
                  { label: '1.3만', val: 13000 },
                  { label: '1.5만', val: 15000 },
                  { label: '2만', val: 20000 },
                  { label: '2.3만', val: 23000 },
                  { label: '3만', val: 30000 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSubCardMonthly(preset.val)}
                    style={{
                      padding: '0.28rem 0.55rem',
                      borderRadius: '6px',
                      border: subCardMonthly === preset.val ? '1px solid #60a5fa' : '1px solid var(--glass-border)',
                      background: subCardMonthly === preset.val ? 'rgba(59, 130, 246, 0.35)' : 'rgba(255,255,255,0.05)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <MoneyInput value={subCardMonthly} onChange={setSubCardMonthly} compact accentColor="#93c5fd" />
            </div>

            {/* 구독 일시 혜택 리스트 */}
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-secondary)' }}>구독 가입 혜택 (캐시백·상품권·포인트)</span>
                <button
                  type="button"
                  onClick={() => addBenefitItem(setSubBenefits, 'sub')}
                  style={{ ...miniAddBtnStyle, borderColor: 'rgba(96, 165, 250, 0.5)', color: '#93c5fd' }}
                >
                  <Plus size={14} /> 항목 추가
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {subBenefits.map((item) => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.2fr auto', gap: '0.5rem', alignItems: 'start' }}>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateBenefitItem(setSubBenefits, item.id, 'label', e.target.value)}
                      style={{ ...textInputStyle, padding: '0.55rem 0.65rem', fontSize: '0.85rem' }}
                    />
                    <MoneyInput
                      value={item.amount}
                      onChange={(val) => updateBenefitItem(setSubBenefits, item.id, 'amount', val)}
                      compact
                      accentColor="#93c5fd"
                    />
                    <button
                      type="button"
                      onClick={() => removeBenefitItem(setSubBenefits, item.id)}
                      title="항목 삭제"
                      style={trashBtnStyle}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 무상 A/S · 케어서비스 환산 가치 (선택) */}
            <div style={{ paddingTop: '0.5rem', borderTop: '1px dashed var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>무상 A/S·케어서비스 환산 혜택 (선택)</label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#93c5fd', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeCareInFinal}
                    onChange={(e) => setIncludeCareInFinal(e.target.checked)}
                  />
                  최종 체감가에서 차감 반영
                </label>
              </div>
              <MoneyInput value={subCareValue} onChange={setSubCareValue} compact accentColor="#93c5fd" />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.3rem', color: '#cbd5e1' }}>
              <span>총 구독 기준액 ({subMonths}개월)</span>
              <span>{formatWon(subGrossTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.3rem', color: '#cbd5e1' }}>
              <span>제휴카드 적용 월 실납부액</span>
              <strong style={{ color: 'white' }}>월 {formatWon(subMonthlyAfterCard)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.45rem', color: '#cbd5e1' }}>
              <span>총 혜택 차감 합계</span>
              <strong style={{ color: '#93c5fd' }}>- {formatWon(subTotalBenefitSum)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.55rem', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '1rem', display: 'block' }}>구독 최종 체감 총액</span>
                <span style={{ fontSize: '0.8rem', color: '#93c5fd', fontWeight: 700 }}>
                  모든 혜택 반영 시 월 체감 {formatWon(subEffectiveMonthly)}
                </span>
              </div>
              <strong style={{ fontSize: '1.5rem', fontWeight: 900, color: '#60a5fa' }}>
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
                    fontSize: '0.88rem'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={cp.checked}
                    onChange={() => toggleCheckpoint(cp.id)}
                  />
                  <span>{cp.text}</span>
                </label>
              ))}
            </div>

            <label style={labelStyle}>비교 결과 상단 추천 플랜 강조 방식</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { id: 'auto', label: '자동 분석 (유리한 쪽 강조)' },
                { id: 'sub', label: '삼성 AI 구독클럽 추천' },
                { id: 'lump', label: '일시불 구매 추천' }
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
                placeholder="예: 삼성 제휴카드 월 30만원 이용 기준 할인 적용 / 입주 예정일에 맞춰 희망 배송일 지정 가능 / 추가 사은품 증정 포함"
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
            실시간 최종 체감가 비교 요약
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
            <span>일시불: <strong style={{ color: 'var(--accent-gold-light)' }}>{formatWon(lumpFinalPrice)}</strong></span>
            <span style={{ color: 'var(--text-secondary)' }}>vs</span>
            <span>
              AI 구독클럽: <strong style={{ color: '#60a5fa' }}>{formatWon(subFinalPrice)}</strong>{' '}
              <span style={{ fontSize: '0.88rem', color: '#93c5fd' }}>(월 체감 {formatWon(subEffectiveMonthly)})</span>
            </span>
            {absDiff > 0 && (
              <span
                style={{
                  padding: '0.25rem 0.7rem',
                  borderRadius: '100px',
                  background: rawDiff > 0 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(212, 175, 55, 0.22)',
                  border: rawDiff > 0 ? '1px solid #60a5fa' : '1px solid var(--accent-gold)',
                  fontSize: '0.85rem',
                  color: 'white'
                }}
              >
                차액 {formatWon(absDiff)} ({rawDiff > 0 ? '구독 유리' : '일시불 저렴'})
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

const miniAddBtnStyle = {
  background: 'rgba(212, 175, 55, 0.12)',
  border: '1px solid rgba(212, 175, 55, 0.45)',
  color: 'var(--accent-gold-light)',
  padding: '0.28rem 0.6rem',
  borderRadius: '6px',
  fontSize: '0.76rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem'
};

const trashBtnStyle = {
  background: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.25)',
  color: '#fca5a5',
  borderRadius: '8px',
  padding: '0.52rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
