const fs = require('fs');
const path = require('path');

const filePath = path.resolve('web/src/components/BenefitCalculator.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update DEPT_TIERS to include 100만 and 200만
const oldTiers = `  const DEPT_TIERS = [
    { label: '300만', minSpend: 3093000, targetReceipt: 3000000, cardDiscountRate: 0.03, normalGcash: 195000 },
    { label: '400만', minSpend: 4124000, targetReceipt: 4000000, cardDiscountRate: 0.03, normalGcash: 260000 },
    { label: '500만', minSpend: 5264000, targetReceipt: 5000000, cardDiscountRate: 0.05, normalGcash: 325000 },
    { label: '700만', minSpend: 7369000, targetReceipt: 7000000, cardDiscountRate: 0.05, normalGcash: 325000 },
    { label: '1000만', minSpend: 10527000, targetReceipt: 10000000, cardDiscountRate: 0.05, normalGcash: 650000 },
    { label: '1500만', minSpend: 15790000, targetReceipt: 15000000, cardDiscountRate: 0.05, normalGcash: 975000 },
    { label: '2000만', minSpend: 21053000, targetReceipt: 20000000, cardDiscountRate: 0.05, normalGcash: 1300000 }
  ];`;

const newTiers = `  const DEPT_TIERS = [
    { label: '100만', minSpend: 1031000, targetReceipt: 1000000, cardDiscountRate: 0.03, normalGcash: 65000 },
    { label: '200만', minSpend: 2062000, targetReceipt: 2000000, cardDiscountRate: 0.03, normalGcash: 130000 },
    { label: '300만', minSpend: 3093000, targetReceipt: 3000000, cardDiscountRate: 0.03, normalGcash: 195000 },
    { label: '400만', minSpend: 4124000, targetReceipt: 4000000, cardDiscountRate: 0.03, normalGcash: 260000 },
    { label: '500만', minSpend: 5264000, targetReceipt: 5000000, cardDiscountRate: 0.05, normalGcash: 325000 },
    { label: '700만', minSpend: 7369000, targetReceipt: 7000000, cardDiscountRate: 0.05, normalGcash: 325000 },
    { label: '1000만', minSpend: 10527000, targetReceipt: 10000000, cardDiscountRate: 0.05, normalGcash: 650000 },
    { label: '1500만', minSpend: 15790000, targetReceipt: 15000000, cardDiscountRate: 0.05, normalGcash: 975000 },
    { label: '2000만', minSpend: 21053000, targetReceipt: 20000000, cardDiscountRate: 0.05, normalGcash: 1300000 }
  ];`;

if (!code.includes(oldTiers)) {
  console.error('Error: oldTiers not found');
  process.exit(1);
}
code = code.replace(oldTiers, newTiers);

// 2. In 1person_3split, replace the calculation of fullPlan and the active binding
const old3SplitCalculationStart = `      // 3) 전부 차감 시뮬레이션 (G캐시 0원 올인)
      const fullDeduct3 = Math.min(step3Approval, totalGcash);
      let fullRem = totalGcash - fullDeduct3;
      const fullMargin = Math.max(0, step1Approval - 21053000);
      let fullDeduct1 = Math.min(fullMargin, fullRem);
      fullRem -= fullDeduct1;
      let fullDeduct2 = Math.min(step2Approval, fullRem);
      fullRem -= fullDeduct2;
      if (fullRem > 0) {
        fullDeduct1 += fullRem;
        fullRem = 0;
      }
      const fullSafeDeduct = totalGcash;
      const fullSafeReward = 0;
      const fullStep1Approval = step1Approval - fullDeduct1;
      const fullStep2Approval = step2Approval - fullDeduct2;
      const fullCardApproval = fullStep1Approval + fullStep2Approval + (step3Approval - fullDeduct3) + deptPhoneGross;
      const fullStep1Discount = Math.floor(fullStep1Approval * 0.05);
      const fullStep2Discount = fullStep2Approval > 0 ? Math.floor(fullStep2Approval * 0.03) : 0;
      const fullCardDiscount = fullStep1Discount + fullStep2Discount;
      const fullFinalPerceived = deptEffectiveGross - fullCardDiscount - totalGcash;

      // 현재 선택된 전략에 따른 active 값
      let deduct1 = 0;
      let deduct2 = 0;
      let deduct3 = 0;
      let safeDeduct = 0;
      let safeReward = totalGcash;
      let safeMode = 'reward_only';

      if (deptStrategy === 'full') {
        deduct1 = fullDeduct1;
        deduct2 = fullDeduct2;
        deduct3 = fullDeduct3;
        safeDeduct = fullSafeDeduct;
        safeReward = fullSafeReward;
        safeMode = 'full_instant';
      } else if (deptStrategy === 'partial' || deptStrategy === 'instant') {
        deduct1 = partDeduct1;
        deduct2 = 0;
        deduct3 = partDeduct3;
        safeDeduct = partialSafeDeduct;
        safeReward = partialSafeReward;
        safeMode = safeDeduct >= totalGcash ? 'full_instant' : (safeDeduct > 0 ? 'partial_instant' : 'reward_only');
      }

      const step1ActualApproval = step1Approval - deduct1;
      const step2ActualApproval = step2Approval - deduct2;
      const step3ActualApproval = step3Approval - deduct3;
      const cardApproval = step1ActualApproval + step2ActualApproval + step3ActualApproval + deptPhoneGross;

      // 실제 카드 청구할인 계산 (실제 카드 결제 승인액 기준!)
      const step1Discount = Math.floor(step1ActualApproval * 0.05);
      const step2Discount = step2ActualApproval > 0 ? Math.floor(step2ActualApproval * 0.03) : 0;
      const totalCardDiscount = step1Discount + step2Discount;
      const finalPerceived = deptEffectiveGross - totalCardDiscount - totalGcash;`;

const new3SplitCalculation = `      // 3) 전부 차감 시뮬레이션 (G캐시 0원 올인 - 결제금액 기준 구간 동적 재판정!)
      // 1차 카드는 2,000만 마지노선(21,053,000원)을 사수하여 2,000만 우대 사은 보존
      // 1차 여유분(step1Approval - 21053000) 및 3차 자투리(step3Approval)를 먼저 차감한 뒤,
      // 남은 G캐시를 2차 카드에서 차감하되 2차 카드의 실제 결제(승인) 금액에 따라 구간을 재판정!
      const fullCandidateTiers = [
        { label: '400만', minSpend: 4124000, targetReceipt: 4000000, gcash: 260000, rate: 0.03 },
        { label: '300만', minSpend: 3093000, targetReceipt: 3000000, gcash: 195000, rate: 0.03 },
        { label: '200만', minSpend: 2062000, targetReceipt: 2000000, gcash: 130000, rate: 0.03 },
        { label: '100만', minSpend: 1031000, targetReceipt: 1000000, gcash: 65000, rate: 0.03 },
        { label: '0원', minSpend: 0, targetReceipt: 0, gcash: 0, rate: 0 }
      ];

      let fullStep2Tier = null;
      let fullTotalGcash = 0;
      let fullStep2Approval = 0;
      let fullDeduct1 = Math.max(0, step1Approval - 21053000);
      let fullDeduct2 = 0;
      let fullDeduct3 = step3Approval;

      for (const t of fullCandidateTiers) {
        const candidateTotalGcash = step1Gcash + t.gcash + deptPhoneGcash;
        const d3 = Math.min(step3Approval, candidateTotalGcash);
        const d1 = Math.min(fullDeduct1, candidateTotalGcash - d3);
        const remFor2 = candidateTotalGcash - d3 - d1;
        const step2Actual = Math.max(0, deptApplianceGross - step3Approval - 21053000 - remFor2);
        const step2Receipt = Math.floor(step2Actual * (1 - t.rate));

        if (step2Receipt >= t.targetReceipt) {
          fullStep2Tier = t;
          fullTotalGcash = candidateTotalGcash;
          fullStep2Approval = step2Actual;
          fullDeduct2 = remFor2;
          fullDeduct1 = d1;
          fullDeduct3 = d3;
          break;
        }
      }

      if (!fullStep2Tier) {
        fullStep2Tier = fullCandidateTiers[fullCandidateTiers.length - 1];
        fullTotalGcash = step1Gcash + deptPhoneGcash;
        fullStep2Approval = Math.max(0, deptApplianceGross - fullTotalGcash - 21053000);
        fullDeduct2 = Math.max(0, fullTotalGcash - fullDeduct1 - fullDeduct3);
      }

      const fullStep1Approval = 21053000;
      const fullStep1Discount = Math.floor(fullStep1Approval * 0.05);
      const fullStep2Discount = Math.floor(fullStep2Approval * fullStep2Tier.rate);
      const fullTotalCardDiscount = fullStep1Discount + fullStep2Discount;
      const fullSafeDeduct = fullTotalGcash;
      const fullSafeReward = 0;
      const fullCardApproval = fullStep1Approval + fullStep2Approval + deptPhoneGross;
      const fullFinalPerceived = deptEffectiveGross - fullTotalCardDiscount - fullTotalGcash;

      // 현재 선택된 전략에 따른 active 값
      let deduct1 = 0;
      let deduct2 = 0;
      let deduct3 = 0;
      let safeDeduct = 0;
      let safeReward = totalGcash;
      let safeMode = 'reward_only';
      let activeTotalGcash = totalGcash;
      let activeStep2Gcash = step2Gcash;
      let activeStep2Label = step2Label || '400만';
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
        activeStep2Gcash = fullStep2Tier.gcash;
        activeStep2Label = fullStep2Tier.label;
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
        activeStep2Label = step2Label || '400만';
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
        activeStep2Label = step2Label || '400만';
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
      const currentGcash = activeTotalGcash;`;

if (!code.includes(old3SplitCalculationStart)) {
  console.error('Error: old3SplitCalculationStart not found');
  process.exit(1);
}
code = code.replace(old3SplitCalculationStart, new3SplitCalculation);

// 3. Update the return object of 1person_3split to use active / fullPlan properties
const old3SplitReturn = `      return {
        mode: '1person_3split',
        applianceGross: deptApplianceGross,
        phoneGross: deptPhoneGross,
        effectiveGross: deptEffectiveGross,
        step1Approval: step1ActualApproval,
        step1BaseApproval: step1Approval,
        step1Discount,
        step1Gcash,
        step2Approval: step2ActualApproval,
        step2BaseApproval: step2Approval,
        step2Discount,
        step2Gcash,
        step2Label: step2Label || '400만',
        step3Approval: step3ActualApproval,
        step3BaseApproval: step3Approval,
        step3Gcash,
        totalCardDiscount,
        totalGcash,
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
        },`;

const new3SplitReturn = `      return {
        mode: '1person_3split',
        applianceGross: deptApplianceGross,
        phoneGross: deptPhoneGross,
        effectiveGross: deptEffectiveGross,
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
          step2Label: step2Label || '400만',
          step2Gcash: step2Gcash,
          totalCardDiscount: rewardCardDiscount,
          finalPerceived: rewardFinalPerceived
        },
        partialPlan: {
          cardApproval: partialCardApproval,
          safeDeduct: partialSafeDeduct,
          safeReward: partialSafeReward,
          totalGcash: totalGcash,
          step2Label: step2Label || '400만',
          step2Gcash: step2Gcash,
          totalCardDiscount: partialCardDiscount,
          finalPerceived: partialFinalPerceived
        },
        fullPlan: {
          cardApproval: fullCardApproval,
          safeDeduct: fullSafeDeduct,
          safeReward: 0,
          totalGcash: fullTotalGcash,
          step2Label: fullStep2Tier.label,
          step2Gcash: fullStep2Tier.gcash,
          totalCardDiscount: fullTotalCardDiscount,
          finalPerceived: fullFinalPerceived
        },`;

if (!code.includes(old3SplitReturn)) {
  console.error('Error: old3SplitReturn not found');
  process.exit(1);
}
code = code.replace(old3SplitReturn, new3SplitReturn);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated BenefitCalculator.jsx with dynamic tier re-evaluation for scenario 3!');
