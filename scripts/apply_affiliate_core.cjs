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

// 1. Add states
const stateTarget = '  const [subPurchaseBenefit, setSubPurchaseBenefit] = useState(0); // 통합 구독 구매 혜택 금액';
const stateReplacement = `  const [subPurchaseBenefit, setSubPurchaseBenefit] = useState(0); // 통합 구독 구매 혜택 금액

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
  const [applyExtraToFinal, setApplyExtraToFinal] = useState(true); // 실체감가 차감 반영 여부`;

replaceExact(stateTarget, stateReplacement, '1. Add states');

// 2. Add extra affiliate benefit calculation & update subFinalPrice
const subFinalTarget = `  const subCashBenefitTotal = (subFeeDiscountTotal || 0) + subCardTotalDiscount + (Number(subPurchaseBenefit) || 0);
  // 총 혜택 합계: 구독료 즉시할인 + 제휴카드 청구할인 + 캐시백
  const subTotalBenefitSum = subCashBenefitTotal;

  // 삼성AI구독 최종 체감가: (선납금 + 월할인구독료 총액) - 제휴카드할인 - 캐시백 - (서비스 혜택 가치)
  const subFinalPrice = Math.max(
    0,
    subNetGrossTotal - subCardTotalDiscount - (Number(subPurchaseBenefit) || 0) - (includeServiceInFinal ? subServiceTotal : 0)
  );`;

const subFinalReplacement = `  // 제휴 연계 추가 혜택 (상조 / 통신사 IPTV) 계산
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
  );`;

replaceExact(subFinalTarget, subFinalReplacement, '2. Update subFinalPrice');

// 3. Update mixedGrandFinal calculation
const mixedFinalTarget = `  // 전체 총 혜택 = 구독 전용 직접할인 + 일반 특정조건 할인 + 통합 캐시백 + 상품권 지급 (무상/케어서비스 제외)
  const mixedGrandBenefit = mixedSubOnlyDiscount + mixedLumpDiscountTotal + mixedTotalCashback + mixedTotalVoucher;
  // 고객 최종 실체감가: 일반구매 혜택가 소계 + 구독 혜택가 소계 - 통합 캐시백/상품권
  const mixedGrandFinal = Math.max(
    0,
    mixedLumpBenefitSub + mixedSubFinalPrice - section3TotalBenefit
  );`;

const mixedFinalReplacement = `  // 전체 총 혜택 = 구독 전용 직접할인 + 일반 특정조건 할인 + 통합 캐시백 + 상품권 지급 + 제휴연계혜택 (무상/케어서비스 제외)
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
  );`;

replaceExact(mixedFinalTarget, mixedFinalReplacement, '3. Update mixedGrandFinal');

// 4. Update buildCurrentQuoteSnapshot
const snapshotTarget = `        includeServiceInFinal,
        recommendMode,`;

const snapshotReplacement = `        includeServiceInFinal,
        extraSangjo,
        extraTelecom,
        applyExtraToFinal,
        showExtraAffiliateSection,
        recommendMode,`;

replaceExact(snapshotTarget, snapshotReplacement, '4. Update buildCurrentQuoteSnapshot');

// 5. Update applyQuoteData
const applyQuoteTarget = `    setSubCardName(d.subCardName ?? '');
    setSubCardMinSpend(d.subCardMinSpend ?? '');`;

const applyQuoteReplacement = `    if (d.extraSangjo) {
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
    setSubCardMinSpend(d.subCardMinSpend ?? '');`;

replaceExact(applyQuoteTarget, applyQuoteReplacement, '5. Update applyQuoteData');

fs.writeFileSync(filePath, content, 'utf8');
console.log('ALL CORE REPLACEMENTS APPLIED!');
