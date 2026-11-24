const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'web', 'src', 'components', 'BenefitCalculator.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace the card model selection UI block in cardItem rendering:
// From: {/* 적용 대상 구독 모델: 카드가 1개만 활성화되었을 때는 전체 모델 자동 반영 */}
// To just before: {/* 1번째: 카드 이름 직접 입력 및 프리셋 */}

const startMarker = '{/* 적용 대상 구독 모델: 카드가 1개만 활성화되었을 때는 전체 모델 자동 반영 */}';
const endMarker = '{/* 1번째: 카드 이름 직접 입력 및 프리셋 */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found! startIndex:', startIndex, 'endIndex:', endIndex);
  process.exit(1);
}

const replacementUI = `{/* 적용 대상 구독 모델 선택 영역 (다중 선택 지원) */}
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
                          ? (subCards.length === 1 ? '전체 구독 모델 자동 반영' : \`전체 모델 (\${totalModelsCount}개 품목)\`)
                          : selectedIndices.length === 1
                          ? ((selectedItems[0]?.name || '').trim() || \`\${selectedIndices[0] + 1}번 모델\`)
                          : \`\${selectedIndices.map((i) => \`\${i + 1}번\`).join('·')} 모델 (총 \${selectedIndices.length}개)\`;

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
                                    ? \`(전체 \${totalModelsCount}개 모델 적용)\`
                                    : \`(\${selectedIndices.map((i) => \`\${i + 1}번\`).join('·')} 적용 · 총 \${selectedIndices.length}개)\`}
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
                                const title = (p.name || '').trim() || (isMixedMode ? \`구독 모델 \${pIdx + 1}\` : \`품목 \${pIdx + 1}\`);
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

                      `;

content = content.slice(0, startIndex) + replacementUI + content.slice(endIndex);

// 2. Also update pFee in the second section (필요 실적 input)
const oldPfeeBlock = `                          const targetIdx = isSingleCardMode
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
                                : effectiveMonthlyBase);`;

const newPfeeBlock = `                          const availableModels = isMixedMode ? mixedSubItems : activePlans;
                          const totalModelsCount = availableModels.length;
                          const selectedIndices = getCardSelectedIndices(cardItem, cardIdx, totalModelsCount, isSingleCardMode);
                          const selectedItems = selectedIndices.map((i) => availableModels[i]).filter(Boolean);
                          const pFee = isMixedMode
                            ? selectedItems.reduce((sum, item) => sum + getItemMonthly(item) * getSubQty(item.quantity), 0)
                            : selectedItems.reduce((sum, item) => sum + (item.rowMonthly || 0), 0);`;

if (content.includes(oldPfeeBlock)) {
  content = content.replace(oldPfeeBlock, newPfeeBlock);
  console.log('Successfully replaced input pFee block!');
} else {
  console.warn('Could not find exact oldPfeeBlock, checking partial match...');
}

// 3. Also update pFee in final validation before result
const oldValidationBlock = `                const targetIdx = isSingleCardMode
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
                      : effectiveMonthlyBase);`;

const newValidationBlock = `                const availableModels = isMixedMode ? mixedSubItems : activePlans;
                const totalModelsCount = availableModels.length;
                const selectedIndices = getCardSelectedIndices(c, cardIdx, totalModelsCount, isSingleCardMode);
                const selectedItems = selectedIndices.map((i) => availableModels[i]).filter(Boolean);
                const pFee = isMixedMode
                  ? selectedItems.reduce((sum, item) => sum + getItemMonthly(item) * getSubQty(item.quantity), 0)
                  : selectedItems.reduce((sum, item) => sum + (item.rowMonthly || 0), 0);`;

if (content.includes(oldValidationBlock)) {
  content = content.replace(oldValidationBlock, newValidationBlock);
  console.log('Successfully replaced validation pFee block!');
} else {
  console.warn('Could not find exact oldValidationBlock');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('All card multi-model selection updates applied successfully!');
