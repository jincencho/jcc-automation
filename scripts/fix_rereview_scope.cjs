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

// 1. Add getSubReReviewInfo at component top level
const topTarget = `  const handleConsultDateChange = (newVal) => {
    const curToday = getLocalTodayString();
    setConsultDate(newVal);
    // 사용자가 오늘 날짜를 선택했거나 빈 값이면 자동 추적 복귀, 그 외 과거 등 다른 날짜를 선택하면 수동 고정
    if (!newVal || newVal === curToday) {
      setIsManualConsultDate(false);
    } else {
      setIsManualConsultDate(true);
    }
  };`;

const topReplacement = `  const handleConsultDateChange = (newVal) => {
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
      dateStr: \`\${tYear}년 \${tMonth}월 \${tDay}일(\${dayOfWeek})\`,
      shortDate: \`\${tYear}.\${String(tMonth).padStart(2, '0')}.\${String(tDay).padStart(2, '0')}\`,
      dayCount: 58
    };
  };`;

replaceExact(topTarget, topReplacement, '1. getSubReReviewInfo at top level');

// 2. Remove duplicate getSubReReviewInfo from inner scope
const duplicateInner = `          // 구매일자(consultDate) 기준 58일차 장기 미배송 재심사 예정일 계산
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
          const renderSubReReviewNotice = (customStyle = {}) => {`;

const innerReplacement = `          // 구독 주문 시 필수 안내문 (장기 미배송 58일차 재심사 안내)
          const renderSubReReviewNotice = (customStyle = {}) => {`;

replaceExact(duplicateInner, innerReplacement, '2. Remove inner duplicate');

fs.writeFileSync(filePath, content, 'utf8');
console.log('SCOPE FIX APPLIED!');
