const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'web', 'src', 'components', 'BenefitCalculator.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add state isLongTermDelivery
const stateTarget = `  const [customerName, setCustomerName] = useState('');
  const [consultDate, setConsultDate] = useState(() => getLocalTodayString());
  const [isManualConsultDate, setIsManualConsultDate] = useState(false);
  const [consultType, setConsultType] = useState('단품·패키지 비교견적');`;

const stateReplacement = `  const [customerName, setCustomerName] = useState('');
  const [consultDate, setConsultDate] = useState(() => getLocalTodayString());
  const [isManualConsultDate, setIsManualConsultDate] = useState(false);
  const [isLongTermDelivery, setIsLongTermDelivery] = useState(false); // 🚚 장기미배송(58일차 재심사 대상) 여부
  const [consultType, setConsultType] = useState('단품·패키지 비교견적');`;

if (!content.includes(stateTarget)) {
  console.error('Failed to locate stateTarget');
  process.exit(1);
}
content = content.replace(stateTarget, stateReplacement);

// 2. buildCurrentQuoteSnapshot
const snapshotTarget = `        customerName,
        consultDate,
        consultType,`;

const snapshotReplacement = `        customerName,
        consultDate,
        consultType,
        isLongTermDelivery,`;

if (!content.includes(snapshotTarget)) {
  console.error('Failed to locate snapshotTarget');
  process.exit(1);
}
content = content.replace(snapshotTarget, snapshotReplacement);

// 3. applyQuoteData
const applyTarget = `    setConsultType(d.consultType || '신혼·혼수가전 맞춤설계');`;
const applyReplacement = `    setConsultType(d.consultType || '신혼·혼수가전 맞춤설계');
    if (d.isLongTermDelivery !== undefined) setIsLongTermDelivery(Boolean(d.isLongTermDelivery));`;

if (!content.includes(applyTarget)) {
  console.error('Failed to locate applyTarget');
  process.exit(1);
}
content = content.replace(applyTarget, applyReplacement);

// 4. renderSubReReviewNotice
const noticeTarget = `          // 구독 주문 시 필수 안내문 (장기 미배송 58일차 재심사 안내)
          const renderSubReReviewNotice = (customStyle = {}) => {
            const info = getSubReReviewInfo(consultDate);
            if (!info.dateStr) return null;`;

const noticeReplacement = `          // 구독 주문 시 필수 안내문 (장기 미배송 58일차 재심사 안내 - 장기미배송 체크 시에만 노출)
          const renderSubReReviewNotice = (customStyle = {}) => {
            if (!isLongTermDelivery) return null;
            const info = getSubReReviewInfo(consultDate);
            if (!info.dateStr) return null;`;

if (!content.includes(noticeTarget)) {
  console.error('Failed to locate noticeTarget');
  process.exit(1);
}
content = content.replace(noticeTarget, noticeReplacement);

// 5. Basic Info UI - Prominent Checkbox
const uiTarget = `          {/* 행사 안내 문구 (클릭 불가 정보 안내문) */}
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

        {/* 고객 및 매니저 정보 그리드 (PC 4열, 태블릿 2열, 모바일 1열 반응형) */}`;

const checkboxCard = `          {/* 행사 안내 문구 (클릭 불가 정보 안내문) */}
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

        {/* 🚚 장기 미배달(미배송) 고객 전용 설정 바 (상단 눈에 띄는 체크박스) */}
        <div
          style={{
            marginBottom: '1.25rem',
            padding: '0.9rem 1.15rem',
            borderRadius: '12px',
            border: isLongTermDelivery
              ? '2px solid #f59e0b'
              : '1.5px dashed rgba(245, 158, 11, 0.5)',
            background: isLongTermDelivery
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.22) 0%, rgba(180, 83, 9, 0.3) 100%)'
              : 'rgba(245, 158, 11, 0.05)',
            boxShadow: isLongTermDelivery
              ? '0 0 18px rgba(245, 158, 11, 0.3)'
              : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
            transition: 'all 0.2s ease'
          }}
        >
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              userSelect: 'none',
              margin: 0
            }}
          >
            <input
              type="checkbox"
              checked={isLongTermDelivery}
              onChange={(e) => setIsLongTermDelivery(e.target.checked)}
              style={{
                width: '22px',
                height: '22px',
                accentColor: '#f59e0b',
                cursor: 'pointer',
                flexShrink: 0
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong
                  style={{
                    fontSize: '0.98rem',
                    color: isLongTermDelivery ? '#fef08a' : '#f8fafc',
                    fontWeight: 800,
                    letterSpacing: '-0.2px'
                  }}
                >
                  🚚 장기 미배달(미배송) 예정 고객 (입주 · 이사 등 58일차 신용 재심사 대상)
                </strong>
                {isLongTermDelivery ? (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: '#d97706',
                      color: '#ffffff',
                      padding: '0.15rem 0.6rem',
                      borderRadius: '9999px',
                      boxShadow: '0 2px 6px rgba(217, 119, 6, 0.4)'
                    }}
                  >
                    견적서 안내문 노출 활성화됨
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      background: 'rgba(148, 163, 184, 0.2)',
                      color: '#94a3b8',
                      padding: '0.15rem 0.6rem',
                      borderRadius: '9999px'
                    }}
                  >
                    미체크 시 견적서에 노출 안 됨 (일반 즉시배송 고객)
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.77rem',
                  color: isLongTermDelivery ? '#fde68a' : '#94a3b8',
                  marginTop: '0.25rem',
                  lineHeight: 1.35
                }}
              >
                ※ 체크 시 견적서 하단에 <strong>[구매일자 기준 58일차 재심사 필수 안내문 및 예정일자]</strong>가 자동 노출됩니다.
              </div>
            </div>
          </label>

          {isLongTermDelivery && (() => {
            const rInfo = getSubReReviewInfo(consultDate);
            return (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1.5px solid #f59e0b',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '10px'
                }}
              >
                <span style={{ fontSize: '0.76rem', color: '#fef08a', fontWeight: 700 }}>
                  📅 재심사 예정일:
                </span>
                <strong style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 900 }}>
                  {rInfo.dateStr || '상담일자 확인'}
                </strong>
                <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>(58일차)</span>
              </div>
            );
          })()}
        </div>

        {/* 고객 및 매니저 정보 그리드 (PC 4열, 태블릿 2열, 모바일 1열 반응형) */}`;

if (!content.includes(uiTarget)) {
  console.error('Failed to locate uiTarget');
  process.exit(1);
}
content = content.replace(uiTarget, checkboxCard);

// 6. Consult date pill condition
const consultPillTarget = `            {(() => {
              const rInfo = getSubReReviewInfo(consultDate);
              return rInfo.dateStr ? (
                <div style={{ fontSize: '0.70rem', color: '#f59e0b', marginTop: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⚠️ 58일차 재심사 예정일:</span>
                  <strong style={{ color: '#fbbf24', textDecoration: 'underline' }}>{rInfo.dateStr}</strong>
                </div>
              ) : null;
            })()}`;

const consultPillReplacement = `            {isLongTermDelivery && (() => {
              const rInfo = getSubReReviewInfo(consultDate);
              return rInfo.dateStr ? (
                <div style={{ fontSize: '0.70rem', color: '#f59e0b', marginTop: '4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>⚠️ 58일차 재심사 예정일:</span>
                  <strong style={{ color: '#fbbf24', textDecoration: 'underline' }}>{rInfo.dateStr}</strong>
                </div>
              ) : null;
            })()}`;

if (!content.includes(consultPillTarget)) {
  console.error('Failed to locate consultPillTarget');
  process.exit(1);
}
content = content.replace(consultPillTarget, consultPillReplacement);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Successfully patched BenefitCalculator.jsx for isLongTermDelivery');
