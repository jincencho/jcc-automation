const fs = require('fs');
const path = require('path');

const filePath = path.resolve('web/src/components/BenefitCalculator.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. handleApplyDeptEnginePlan
const oldApply = `  const handleApplyDeptEnginePlan = () => {
    setMixedChannelType('dept');
    setMixedDeptCardDiscount(deptEnginePlan.totalCardDiscount);
    setMixedDeptDiscount(deptEnginePlan.totalCardDiscount);
    const voucherAmt = deptStrategy === 'instant' && deptEnginePlan.safeDeduct > 0
      ? deptEnginePlan.safeDeduct
      : deptEnginePlan.totalGcash;
    setMixedDeptVoucherDiscount(voucherAmt);
    setMixedDeptVoucherMode(deptStrategy);
    setMixedDeptDiscountProof(true);
    showTempNotice(
      deptStrategy === 'instant'
        ? \`✓ 백화점 선차감 혜택(G캐시 선차감 \${formatWon(voucherAmt)}, 청구할인 \${formatWon(deptEnginePlan.totalCardDiscount)})이 견적서에 자동 반영되었습니다.\`
        : \`✓ 백화점 적립 혜택(청구할인 \${formatWon(deptEnginePlan.totalCardDiscount)}, G캐시 \${formatWon(deptEnginePlan.totalGcash)})이 견적서에 자동 반영되었습니다.\`
    );
  };`;

const newApply = `  const handleApplyDeptEnginePlan = () => {
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
        ? \`✓ 백화점 전액 선차감 혜택(G캐시 전액 차감 \${formatWon(voucherAmt)}, 청구할인 \${formatWon(deptEnginePlan.totalCardDiscount)})이 견적서에 자동 반영되었습니다.\`
        : isDeduct
          ? \`✓ 백화점 부분 선차감 혜택(G캐시 선차감 \${formatWon(voucherAmt)}, 청구할인 \${formatWon(deptEnginePlan.totalCardDiscount)})이 견적서에 자동 반영되었습니다.\`
          : \`✓ 백화점 전액 적립 혜택(청구할인 \${formatWon(deptEnginePlan.totalCardDiscount)}, G캐시 \${formatWon(deptEnginePlan.totalGcash)})이 견적서에 자동 반영되었습니다.\`
    );
  };`;

if (!code.includes(oldApply)) {
  console.error('Error: oldApply not found');
  process.exit(1);
}
code = code.replace(oldApply, newApply);

// 2. mixedLumpInstantPaymentDiscount
const oldInstantPay = `  const mixedLumpInstantPaymentDiscount = mixedChannelType === 'dept'
    ? (deptCardDiscount + (mixedDeptVoucherMode === 'instant' ? deptVoucherDiscount : 0))
    : roadSpecificDiscount;`;

const newInstantPay = `  const mixedLumpInstantPaymentDiscount = mixedChannelType === 'dept'
    ? (deptCardDiscount + ((mixedDeptVoucherMode === 'instant' || mixedDeptVoucherMode === 'partial' || mixedDeptVoucherMode === 'full') ? deptVoucherDiscount : 0))
    : roadSpecificDiscount;`;

if (!code.includes(oldInstantPay)) {
  console.error('Error: oldInstantPay not found');
  process.exit(1);
}
code = code.replace(oldInstantPay, newInstantPay);

// 3. POS modal top banner
const oldPosAccountHeader = `            {/* 매장 계좌 및 담당 매니저 정보 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem', gap: '0.5rem', flexWrap: 'wrap' }}>
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
            </div>`;

const newPosAccountHeader = `            {/* 매장 계좌 및 담당 매니저 정보 헤더 */}
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
                  border: \`1px solid \${deptStrategy === 'reward' ? '#6ee7b7' : deptStrategy === 'full' ? '#fde68a' : '#7dd3fc'}\`
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
            </div>`;

if (!code.includes(oldPosAccountHeader)) {
  console.error('Error: oldPosAccountHeader not found');
  process.exit(1);
}
code = code.replace(oldPosAccountHeader, newPosAccountHeader);

// 4. Upper 3-scenario buttons
const oldTopButtons = `                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#6ee7b7', marginBottom: '0.45rem' }}>
                            🎯 G캐시 혜택 수령 방식
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setDeptStrategy('reward')}
                              style={{
                                padding: '0.45rem 0.5rem',
                                borderRadius: '6px',
                                border: deptStrategy === 'reward' ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                                background: deptStrategy === 'reward' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255,255,255,0.03)',
                                color: deptStrategy === 'reward' ? '#6ee7b7' : '#cbd5e1',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              💰 적립 (5년/60일 적립 - 추천)
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeptStrategy('instant')}
                              style={{
                                padding: '0.45rem 0.5rem',
                                borderRadius: '6px',
                                border: deptStrategy === 'instant' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                                background: deptStrategy === 'instant' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.03)',
                                color: deptStrategy === 'instant' ? '#fde68a' : '#cbd5e1',
                                fontSize: '0.76rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              ⚡ 즉시 선차감 (마지노선 방어)
                            </button>
                          </div>
                          <div style={{ fontSize: '0.67rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                            {deptStrategy === 'reward' ? '사은행사 전액을 고객 앱 G캐시로 적립하여 다른 층 쇼핑에 활용' : '결제 시 G캐시를 바로 차감하되 청구할인 구간 마지노선을 절대 침범하지 않음'}
                          </div>`;

const newTopButtons = `                          <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: '#6ee7b7', marginBottom: '0.45rem' }}>
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
                          </div>`;

if (!code.includes(oldTopButtons)) {
  console.error('Error: oldTopButtons not found');
  process.exit(1);
}
code = code.replace(oldTopButtons, newTopButtons);

// 5. Comparison Cards and Coaching Banner (lines 6640 to 6800 approx)
const oldComparisonSectionStart = `                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <Scale size={18} color="#f59e0b" />
                            <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#fde68a' }}>
                              ⚖️ [적립] vs [선차감] 실시간 유불리 비교 분석
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            ※ 카드를 클릭하면 해당 방식으로 즉시 전환됩니다.
                          </span>
                        </div>`;

const newComparisonSection = `                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.4rem' }}>
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
                            onClick={() => setDeptStrategy('reward')}
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

                            <div style={{ fontSize: '0.71rem', color: '#a7f3d0', lineHeight: 1.45, background: 'rgba(6, 95, 70, 0.22)', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                              <div style={{ fontWeight: 800, color: '#6ee7b7', marginBottom: '2px' }}>👍 이런 고객에게 절대 유리:</div>
                              <div>• 백화점 명품/패션/식품관 쇼핑 계획이 있는 고객</div>
                              <div>• <strong>{formatWon(deptEnginePlan.totalGcash)}</strong> 전액을 백화점 내에서 1:1 현금처럼 사용 가능</div>
                              <div>• 카드 승인 원금이 보존되어 <strong>청구할인 극대화({formatWon(deptEnginePlan.rewardPlan?.totalCardDiscount || deptEnginePlan.rewardCardDiscount)}) → 체감가 최저!</strong></div>
                            </div>
                          </div>

                          {/* 2) 🛡️ 2. 부분 차감 플랜 (마지노선 방어) */}
                          <div
                            onClick={() => setDeptStrategy('partial')}
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

                            <div style={{ fontSize: '0.71rem', color: '#bae6fd', lineHeight: 1.45, background: 'rgba(3, 105, 161, 0.22)', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                              <div style={{ fontWeight: 800, color: '#38bdf8', marginBottom: '2px' }}>👍 이런 고객에게 절대 유리:</div>
                              <div>• 2,000만 등 청구할인 마지노선(영수증 20,000,350원) 완벽 사수</div>
                              <div>• 결제 승인금액을 <strong>-{formatWon(deptEnginePlan.partialPlan?.safeDeduct || deptEnginePlan.instantSafeDeduct)}</strong> 안전하게 경감</div>
                              <div>• 카드 승인액도 줄이고 청구할인도 지키는 가장 균형 잡힌 플랜</div>
                            </div>
                          </div>

                          {/* 3) ⚡ 3. 전부 차감 플랜 (G캐시 0원 올인) */}
                          <div
                            onClick={() => setDeptStrategy('full')}
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: '#34d399' }}>
                                  <span>현장 G캐시 전액 선차감:</span>
                                  <strong>- {formatWon(deptEnginePlan.fullPlan?.safeDeduct)} (100% 전액)</strong>
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

                            <div style={{ fontSize: '0.71rem', color: '#fef08a', lineHeight: 1.45, background: 'rgba(120, 53, 15, 0.28)', padding: '0.5rem 0.65rem', borderRadius: '6px' }}>
                              <div style={{ fontWeight: 800, color: '#fde68a', marginBottom: '2px' }}>👍 이런 고객에게 절대 유리:</div>
                              <div>• "백화점에서 다른 거 살 일 없고, 잔여 G캐시도 남기기 싫다"는 고객</div>
                              <div>• G캐시를 <strong>{formatWon(deptEnginePlan.fullPlan?.safeDeduct)} 남김없이 100% 즉시 차감</strong></div>
                              <div>• 이번 달 카드 승인액을 최저(<strong>{formatWon(deptEnginePlan.fullPlan?.cardApproval)}</strong>)로 압축</div>
                            </div>
                          </div>
                        </div>

                        {/* 하단 전문가 상담 코칭 팁 배너 */}
                        <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', background: 'rgba(217, 119, 6, 0.14)', borderRadius: '7px', border: '1px solid rgba(245, 158, 11, 0.3)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.74rem', color: '#fde68a', lineHeight: 1.45 }}>
                          <span style={{ fontSize: '1rem', flexShrink: 0 }}>🎯</span>
                          <div>
                            <strong>[매니저 3대 시나리오 상담 가이드]</strong>{' '}
                            <span>
                              ① <strong>[💰 1. 전부 적립]</strong>: 카드 승인원금 유지로 청구할인 극대화({formatWon(deptEnginePlan.rewardPlan?.totalCardDiscount || deptEnginePlan.rewardCardDiscount)}) → <strong>최종 체감가 {formatWon(deptEnginePlan.rewardPlan?.finalPerceived || deptEnginePlan.rewardFinalPerceived)}로 가장 저렴!</strong><br />
                              ② <strong>[🛡️ 2. 부분 차감]</strong>: 2,000만 마지노선(영수증 20,000,350원) 안전 사수 + 여유분 -{formatWon(deptEnginePlan.partialPlan?.safeDeduct || deptEnginePlan.instantSafeDeduct)} 선차감 → <strong>승인액 {formatWon(deptEnginePlan.partialPlan?.cardApproval || deptEnginePlan.instantCardApproval)} 경감 및 청구할인 사수(추천형)</strong><br />
                              ③ <strong>[⚡ 3. 전부 차감]</strong>: G캐시 0원 남김없이 -{formatWon(deptEnginePlan.fullPlan?.safeDeduct)} 전액 올인 차감 → <strong>실제 카드 결제 승인액을 {formatWon(deptEnginePlan.fullPlan?.cardApproval)} 최저로 최소화!</strong>
                            </span>
                          </div>
                        </div>`;

// Replace from oldComparisonSectionStart down to the closing tag of the coach banner
const startIndex = code.indexOf(oldComparisonSectionStart);
if (startIndex === -1) {
  console.error('Error: oldComparisonSectionStart not found');
  process.exit(1);
}

const coachBannerEnd = `                          </div>
                        </div>
                      </div>`;
// Find the coachBannerEnd after startIndex
const endIndex = code.indexOf(coachBannerEnd, startIndex);
if (endIndex === -1) {
  console.error('Error: coachBannerEnd not found');
  process.exit(1);
}

const sectionToReplace = code.slice(startIndex, endIndex + coachBannerEnd.length - '                      </div>'.length);
code = code.slice(0, startIndex) + newComparisonSection + '\n                      </div>' + code.slice(endIndex + coachBannerEnd.length);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated BenefitCalculator.jsx with 3-scenario UI!');
