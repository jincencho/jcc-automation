const fs = require('fs');
const filePath = 'web/src/components/BenefitCalculator.jsx';
let content = fs.readFileSync(filePath, 'utf8');

function replaceExact(find, replace, label) {
  if (!content.includes(find)) {
    console.error('FAILED to find target for: ' + label);
    process.exit(1);
  }
  content = content.replace(find, replace);
  console.log('SUCCESS: ' + label);
}

// 1. Quotation 1 Option B - Add Sangjo and Telecom rows inside a4-benefit-list
const q1Target = `                    {/* ===== [다섯번째 혜택: 캐시백] ===== */}
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
                    )}`;

const q1Replacement = `                    {/* ===== [다섯번째 혜택: 캐시백] ===== */}
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
                    )}`;

replaceExact(q1Target, q1Replacement, '1. Quotation 1 Option B affiliate benefit rows');

// 2. Quotation 1 Option B - Footer badge
const q1BadgeTarget = `                        {includeServiceInFinal && subServiceTotal > 0 && (
                          <span style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 600, letterSpacing: '-0.2px' }}>
                            (서비스혜택 {formatWon(subServiceTotal)} 반영)
                          </span>
                        )}`;

const q1BadgeReplacement = `                        {includeServiceInFinal && subServiceTotal > 0 && (
                          <span style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 600, letterSpacing: '-0.2px' }}>
                            (서비스혜택 {formatWon(subServiceTotal)} 반영)
                          </span>
                        )}
                        {applyExtraToFinal && totalExtraAffiliateDiscount > 0 && (
                          <span style={{ fontSize: '0.65rem', color: '#7e22ce', fontWeight: 700, letterSpacing: '-0.2px' }}>
                            (제휴지원금 -{formatWon(totalExtraAffiliateDiscount)} 반영)
                          </span>
                        )}`;

replaceExact(q1BadgeTarget, q1BadgeReplacement, '2. Quotation 1 Option B badge');

// 3. Quotation 2 Section 3 - Add Sangjo and Telecom rows after vouchers
const q2Target = `                        {/* 상품권 혜택 (4번 숫자 제거) */}
                        {validMixedVoucherItems.map((vc, idx) => (
                          <div className="a4-benefit-row" key={vc.id || \`vc-\${idx}\`} style={{ fontSize: '0.77rem', alignItems: 'center' }}>
                            <span>
                              <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <span style={{ color: '#92400e', fontWeight: 700 }}>{cleanPrintText(vc.name) || (mixedEventType === 'normal' ? '모바일/지류 상품권' : \`\${eventPrefix} 상품권\`)}</span>
                              <span style={{ fontSize: '0.70rem', color: '#d97706', fontWeight: 600, marginLeft: '6px' }}>(모바일 상품권, 설치후 2주 뒤)</span>
                              {vc.hasProof && (
                                <span className="a4-proof-tag" style={{ marginLeft: '6px' }}>증빙완료시</span>
                              )}
                            </span>
                            <span className="a4-minus-blue" style={{ fontSize: '0.82rem', fontWeight: 800 }}>- {formatWon(vc.amount)}</span>
                          </div>
                        ))}`;

const q2Replacement = `                        {/* 상품권 혜택 (4번 숫자 제거) */}
                        {validMixedVoucherItems.map((vc, idx) => (
                          <div className="a4-benefit-row" key={vc.id || \`vc-\${idx}\`} style={{ fontSize: '0.77rem', alignItems: 'center' }}>
                            <span>
                              <span style={{ color: '#d97706', marginRight: '4px', fontWeight: 800 }}>•</span>
                              <span style={{ color: '#92400e', fontWeight: 700 }}>{cleanPrintText(vc.name) || (mixedEventType === 'normal' ? '모바일/지류 상품권' : \`\${eventPrefix} 상품권\`)}</span>
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
                        )}`;

replaceExact(q2Target, q2Replacement, '3. Quotation 2 Section 3 affiliate rows');

// 4. Quotation 2 Section 3 - Final price badge
const q2BadgeTarget = `                          {mixedSubServiceBenefit > 0 && (
                            <span style={{ fontSize: '0.69rem', color: '#0284c7', fontWeight: 700 }}>
                              (구독케어 비용 포함)
                            </span>
                          )}`;

const q2BadgeReplacement = `                          {mixedSubServiceBenefit > 0 && (
                            <span style={{ fontSize: '0.69rem', color: '#0284c7', fontWeight: 700 }}>
                              (구독케어 비용 포함)
                            </span>
                          )}
                          {applyExtraToFinal && totalExtraAffiliateDiscount > 0 && (
                            <span style={{ fontSize: '0.69rem', color: '#7e22ce', fontWeight: 700 }}>
                              (제휴 연계 추가 혜택 -{formatWon(totalExtraAffiliateDiscount)} 반영)
                            </span>
                          )}`;

replaceExact(q2BadgeTarget, q2BadgeReplacement, '4. Quotation 2 Section 3 badge');

// 5. Update renderPage2ExtraInfo (Quotation 1 footer notes)
const q1FooterTarget = `                {hasMemo && (
                  <div className="a4-memo-box" style={{ marginTop: hasCardPolicies ? '0.45rem' : '0' }}>`;

const q1FooterReplacement = `                {(extraSangjo.enabled || extraTelecom.enabled) && (
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
                  <div className="a4-memo-box" style={{ marginTop: (hasCardPolicies || extraSangjo.enabled || extraTelecom.enabled) ? '0.45rem' : '0' }}>`;

replaceExact(q1FooterTarget, q1FooterReplacement, '5. Quotation 1 footer notes');

// 6. Update renderPage2MemoInfo (Quotation 2 footer notes)
const q2FooterTarget = `          const renderPage2MemoInfo = () => {
            const hasMemo = Boolean(memo.trim());
            if (hasMemo) {
              return (
                <div className="a4-memo-box" style={{ marginTop: '0.35rem' }}>
                  <div className="a4-memo-title">맞춤 상담 메모 및 안내사항</div>
                  <div className="a4-memo-content">{memo.trim()}</div>
                </div>
              );
            }
            return null;
          };`;

const q2FooterReplacement = `          const renderPage2MemoInfo = () => {
            const hasMemo = Boolean(memo.trim());
            const hasAffiliate = Boolean(extraSangjo.enabled || extraTelecom.enabled);
            if (!hasMemo && !hasAffiliate) return null;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
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
          };`;

replaceExact(q2FooterTarget, q2FooterReplacement, '6. Quotation 2 footer notes');

// 7. Add Manager Affiliate Benefit Input UI right before {/* 구독 실시간 요약 박스 */}
const managerUiTarget = `          {/* 구독 실시간 요약 박스 */}
          <div
            style={{
              marginTop: '1.25rem',`;

const managerUiReplacement = `          {/* ✨ 제휴 연계 추가 혜택 (상조 제휴 / 통신사 IPTV) 매니저 설정 영역 */}
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
              marginTop: '1.25rem',`;

replaceExact(managerUiTarget, managerUiReplacement, '7. Manager Affiliate Benefit Input UI');

fs.writeFileSync(filePath, content, 'utf8');
console.log('ALL UI AND QUOTE REPLACEMENTS APPLIED SUCCESSFULLY!');

