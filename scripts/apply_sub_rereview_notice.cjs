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

// 1. Add helper functions getSubReReviewInfo & renderSubReReviewNotice right before renderPage2ExtraInfo
const helperTarget = `          const renderPage2ExtraInfo = () => {`;

const helperReplacement = `          // 구매일자(consultDate) 기준 58일차 장기 미배송 재심사 예정일 계산
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
              dateStr: \`\${tYear}년 \${tMonth}월 \${tDay}일(\${dayOfWeek})\`,
              shortDate: \`\${tYear}.\${String(tMonth).padStart(2, '0')}.\${String(tDay).padStart(2, '0')}\`,
              dayCount: 58
            };
          };

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

          const renderPage2ExtraInfo = () => {`;

replaceExact(helperTarget, helperReplacement, '1. Helper functions');

// 2. Add notice to renderPage2ExtraInfo (Quotation 1)
const q1Target = `                    <div style={{ background: '#ffffff', padding: '0.45rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>[3] 구독 전용 케어 보장</strong>
                        계약 기간 무상수리 보증 및 전문 엔지니어 정기 케어
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          };`;

const q1Replacement = `                    <div style={{ background: '#ffffff', padding: '0.45rem', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
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
          };`;

replaceExact(q1Target, q1Replacement, '2. Add notice to renderPage2ExtraInfo');

// 3. Add notice to renderCardPolicyBox (Quotation 2 Page 1)
const q2p1Target = `                    <div style={{ background: '#ffffff', padding: '0.35rem', borderRadius: '5px', border: '1px solid #f1f5f9' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '1px' }}>[3] 구독 전용 케어 보장</strong>
                      계약 기간 무상수리 보증 및 정기 케어
                    </div>
                  </div>
                </div>
              );
            }`;

const q2p1Replacement = `                    <div style={{ background: '#ffffff', padding: '0.35rem', borderRadius: '5px', border: '1px solid #f1f5f9' }}>
                      <strong style={{ color: '#0f172a', display: 'block', marginBottom: '1px' }}>[3] 구독 전용 케어 보장</strong>
                      계약 기간 무상수리 보증 및 정기 케어
                    </div>
                  </div>
                  {/* 58일차 장기 미배송 재심사 필수 안내문 */}
                  {renderSubReReviewNotice({ marginTop: '0.35rem' })}
                </div>
              );
            }`;

replaceExact(q2p1Target, q2p1Replacement, '3. Add notice to renderCardPolicyBox');

// 4. Update renderPage2MemoInfo (Quotation 2 Page 2)
const q2p2Target = `          // 2번 스마트 견적서 2페이지 전용: 상담 메모 정보 박스
          const renderPage2MemoInfo = () => {
            const hasMemo = Boolean(memo.trim());
            const hasAffiliate = Boolean(extraSangjo.enabled || extraTelecom.enabled);
            if (!hasMemo && !hasAffiliate) return null;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>`;

const q2p2Replacement = `          // 2번 스마트 견적서 2페이지 전용: 상담 메모 정보 박스
          const renderPage2MemoInfo = () => {
            const hasMemo = Boolean(memo.trim());
            const hasAffiliate = Boolean(extraSangjo.enabled || extraTelecom.enabled);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
                {/* 58일차 장기 미배송 재심사 필수 안내문 */}
                {renderSubReReviewNotice()}`;

replaceExact(q2p2Target, q2p2Replacement, '4. Add notice to renderPage2MemoInfo');

// 5. Add 58-day notice pill to consultDate input in calculator
const dateInputTarget = `                cursor: 'pointer',
                colorScheme: themeMode === 'light' ? 'light' : 'dark',
                width: '100%'
              }}
            />
          </div>`;

const dateInputReplacement = `                cursor: 'pointer',
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
          </div>`;

replaceExact(dateInputTarget, dateInputReplacement, '5. Add date pill to consultDate input');

fs.writeFileSync(filePath, content, 'utf8');
console.log('ALL 58-DAY NOTICE UPDATES APPLIED SUCCESSFULLY!');
