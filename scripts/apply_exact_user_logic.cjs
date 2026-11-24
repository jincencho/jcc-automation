const fs = require('fs');
const path = require('path');

const filePath = path.resolve('web/src/components/BenefitCalculator.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update DEPT_TIERS: 100만 & 200만 have cardDiscountRate: 0
const oldTiers = `  const DEPT_TIERS = [
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

const newTiers = `  const DEPT_TIERS = [
    { label: '100만', minSpend: 1000000, targetReceipt: 1000000, cardDiscountRate: 0, normalGcash: 65000 },
    { label: '200만', minSpend: 2000000, targetReceipt: 2000000, cardDiscountRate: 0, normalGcash: 130000 },
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

// 2. In 1person_3split, replace 3) 전부 차감 시뮬레이션
const oldSectionStart = `      // 3) 전부 차감 시뮬레이션 (G캐시 0원 올인 - 결제금액 기준 구간 동적 재판정!)`;
const oldSectionEnd = `      const finalPerceived = activeFinalPerceived;
      const currentGcash = activeTotalGcash;`;

const startIndex = code.indexOf(oldSectionStart);
if (startIndex === -1) {
  console.error('Error: oldSectionStart not found');
  process.exit(1);
}

const endIndex = code.indexOf(oldSectionEnd, startIndex);
if (endIndex === -1) {
  console.error('Error: oldSectionEnd not found');
  process.exit(1);
}

const newSection = `      // 3) 전부 차감 시뮬레이션 (G캐시 0원 올인):
      // [사용자 특명]: 300만원 이하 구간은 청구할인이 없음!
      // 따라서 300만원 미만 구간에서는 2차 카드는 딱 200만원만 결제하고 13만원 챙기고,
      // 나머지 모든 자투리는 5% 청구할인을 받을 수 있는 1차 카드(2,000만원 이상)에 갖다 붙여서 계산!
      let fullStep2Approval = 0;
      let fullStep2Discount = 0;
      let fullStep2Gcash = 0;
      let fullStep2Label = '';
      let fullStep2DiscountRate = 0;

      if ((deptApplianceGross - step3Approval) - (step1Gcash + 260000) - 21053000 >= 4124000) {
        fullStep2Approval = (deptApplianceGross - step3Approval) - (step1Gcash + 260000) - 21053000;
        fullStep2DiscountRate = 0.03;
        fullStep2Discount = Math.floor(fullStep2Approval * 0.03);
        fullStep2Gcash = 260000;
        fullStep2Label = '400만';
      } else if ((deptApplianceGross - step3Approval) - (step1Gcash + 195000) - 21053000 >= 3093000) {
        fullStep2Approval = (deptApplianceGross - step3Approval) - (step1Gcash + 195000) - 21053000;
        fullStep2DiscountRate = 0.03;
        fullStep2Discount = Math.floor(fullStep2Approval * 0.03);
        fullStep2Gcash = 195000;
        fullStep2Label = '300만';
      } else if (deptApplianceGross - step1Gcash >= 21053000 + 2000000) {
        // 딱 200만원 결제, 청구할인 0원, 13만원 사은 챙김, 나머지 자투리는 전부 1차 카드에 배정!
        fullStep2Approval = 2000000;
        fullStep2DiscountRate = 0;
        fullStep2Discount = 0;
        fullStep2Gcash = 130000;
        fullStep2Label = '200만';
      } else if (deptApplianceGross - step1Gcash >= 21053000 + 1000000) {
        fullStep2Approval = 1000000;
        fullStep2DiscountRate = 0;
        fullStep2Discount = 0;
        fullStep2Gcash = 65000;
        fullStep2Label = '100만';
      } else {
        fullStep2Approval = 0;
        fullStep2DiscountRate = 0;
        fullStep2Discount = 0;
        fullStep2Gcash = 0;
        fullStep2Label = '미달';
      }

      const fullTotalGcash = step1Gcash + fullStep2Gcash + deptPhoneGcash;
      const fullSafeDeduct = fullTotalGcash;
      const fullSafeReward = 0;

      // 1차 카드 승인: 전체 가전 원금에서 2차 승인액(200만)을 뺀 뒤, 총 G캐시를 전액 선차감!
      // (자투리 금액이 1차 카드에 다 붙어 2,000만 상한 마지노선을 완벽히 초과 수령!)
      const fullStep1Approval = Math.max(21053000, (deptApplianceGross - fullStep2Approval) - fullTotalGcash);
      const fullStep1Discount = Math.floor(fullStep1Approval * 0.05);
      const fullTotalCardDiscount = fullStep1Discount + fullStep2Discount;
      const fullCardApproval = fullStep1Approval + fullStep2Approval + deptPhoneGross;
      const fullFinalPerceived = deptEffectiveGross - fullTotalCardDiscount - fullTotalGcash;
      const fullDeduct1 = fullSafeDeduct;
      const fullDeduct2 = 0;
      const fullDeduct3 = 0;

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
      let activeStep2DiscountRate = 0.03;
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
        activeStep2Gcash = fullStep2Gcash;
        activeStep2Label = fullStep2Label;
        activeStep2DiscountRate = fullStep2DiscountRate;
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
        activeStep2DiscountRate = 0.03;
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
        activeStep2DiscountRate = 0.03;
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

code = code.slice(0, startIndex) + newSection + code.slice(endIndex + oldSectionEnd.length);

// 3. Update posSteps for step 2 note:
const oldStep2Note = `note: \`3% 청구할인 + 6.5% 일반 사은 (\${activeStep2Label} 구간 사은: \${formatWon(activeStep2Gcash)})\${deduct2 > 0 ? \` [G캐시 \${formatWon(deduct2)} 선차감 반영]\` : ''} [가전 수수료율]\``;

const newStep2Note = `discountRate: activeStep2DiscountRate,
            discountAmount: step2Discount,
            receiptAmount: Math.max(0, step2ActualApproval - step2Discount),
            note: activeStep2DiscountRate > 0
              ? \`3% 청구할인 + 6.5% 일반 사은 (\${activeStep2Label} 구간: \${formatWon(activeStep2Gcash)})\${deduct2 > 0 ? \` [G캐시 \${formatWon(deduct2)} 선차감]\` : ''} [가전 수수료율]\`
              : \`300만 미만 청구할인 미대상 (0원) + 6.5% 사은 (\${activeStep2Label} 딱 \${formatWon(step2ActualApproval)} 결제: 사은 \${formatWon(activeStep2Gcash)} 챙김) [가전 수수료율]\``;

const oldStep2FullBlock = `          step2ActualApproval > 0 ? {
            step: 2,
            label: '2차 제휴카드 결제 (가전)',
            amount: step2ActualApproval,
            barcodeType: 'appliance',
            barcodeTail: '907',
            barcodeBadge: '가전 907',
            discountRate: 0.03,
            discountAmount: step2Discount,
            receiptAmount: Math.max(0, step2ActualApproval - step2Discount),
            note: \`3% 청구할인 + 6.5% 일반 사은 (\${activeStep2Label} 구간 사은: \${formatWon(activeStep2Gcash)})\${deduct2 > 0 ? \` [G캐시 \${formatWon(deduct2)} 선차감 반영]\` : ''} [가전 수수료율]\`
          } : null,`;

const newStep2FullBlock = `          step2ActualApproval > 0 ? {
            step: 2,
            label: '2차 제휴카드 결제 (가전)',
            amount: step2ActualApproval,
            barcodeType: 'appliance',
            barcodeTail: '907',
            barcodeBadge: '가전 907',
            discountRate: activeStep2DiscountRate,
            discountAmount: step2Discount,
            receiptAmount: Math.max(0, step2ActualApproval - step2Discount),
            note: activeStep2DiscountRate > 0
              ? \`3% 청구할인 + 6.5% 일반 사은 (\${activeStep2Label} 구간: \${formatWon(activeStep2Gcash)})\${deduct2 > 0 ? \` [G캐시 \${formatWon(deduct2)} 선차감]\` : ''} [가전 수수료율]\`
              : \`300만 미만 청구할인 미대상 (0원) + 6.5% 사은 (\${activeStep2Label} \${formatWon(step2ActualApproval)} 결제: 사은 \${formatWon(activeStep2Gcash)} 챙김) [가전 수수료율]\`
          } : null,`;

if (!code.includes(oldStep2FullBlock)) {
  console.error('Error: oldStep2FullBlock not found');
  process.exit(1);
}
code = code.replace(oldStep2FullBlock, newStep2FullBlock);

// 4. Update step 1 note in posSteps:
const oldStep1Note = `note: \`5% 청구할인 + \${deptRewardRate}% 우대 사은 (2,000만 상한)\${deduct1 > 0 ? \` [마지노선 사수: G캐시 \${formatWon(deduct1)} 선차감 반영]\` : ''}\``;

const newStep1Note = `note: \`5% 청구할인 + \${deptRewardRate}% 우대 사은 (2,000만 상한 사수)\${deduct1 > 0 ? \` [자투리 합산 및 G캐시 \${formatWon(deduct1)} 선차감 반영]\` : ''}\``;

if (code.includes(oldStep1Note)) {
  code = code.replace(oldStep1Note, newStep1Note);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated BenefitCalculator.jsx with exact user logic!');
