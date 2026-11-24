function calc3Scenario(gross, rewardRate) {
  console.log(`\n========================================`);
  console.log(`GROSS: ${gross.toLocaleString()}원 | 사은율: ${rewardRate}%`);
  console.log(`========================================`);

  const step1MinSpend = 21053000;
  const step1UdaeGcash = Math.round(20000000 * (rewardRate / 100)); // 2,200,000 at 11%, 2,000,000 at 10%
  
  // 1) 전부 적립 (Scenario 1)
  let step2BaseApproval = 0;
  let step2BaseGcash = 0;
  let step2BaseLabel = '';
  if (gross - step1MinSpend >= 4124000) {
    step2BaseApproval = 4124000;
    step2BaseGcash = 260000;
    step2BaseLabel = '400만';
  } else if (gross - step1MinSpend >= 3093000) {
    step2BaseApproval = 3093000;
    step2BaseGcash = 195000;
    step2BaseLabel = '300만';
  }
  const step1BaseApproval = gross - step2BaseApproval; // 21,884,000
  const rewardTotalGcash = step1UdaeGcash + step2BaseGcash;
  const rewardStep1Discount = Math.floor(step1BaseApproval * 0.05);
  const rewardStep2Discount = Math.floor(step2BaseApproval * 0.03);
  const rewardTotalCardDiscount = rewardStep1Discount + rewardStep2Discount;
  const rewardFinalPerceived = gross - rewardTotalCardDiscount - rewardTotalGcash;

  console.log(`[1. 전부 적립 플랜]`);
  console.log(`- 1차 카드: ${step1BaseApproval.toLocaleString()}원 (청구할인 -${rewardStep1Discount.toLocaleString()}원) -> 영수증 ${(step1BaseApproval - rewardStep1Discount).toLocaleString()}원 (2,000만 달성 -> G캐시 ${step1UdaeGcash.toLocaleString()}원)`);
  console.log(`- 2차 카드: ${step2BaseApproval.toLocaleString()}원 (청구할인 -${rewardStep2Discount.toLocaleString()}원) -> 영수증 ${(step2BaseApproval - rewardStep2Discount).toLocaleString()}원 (${step2BaseLabel} 달성 -> G캐시 ${step2BaseGcash.toLocaleString()}원)`);
  console.log(`- 총 카드승인: ${gross.toLocaleString()}원 | 총 G캐시: ${rewardTotalGcash.toLocaleString()}원 | 청구할인: -${rewardTotalCardDiscount.toLocaleString()}원 | 체감가: ${rewardFinalPerceived.toLocaleString()}원`);

  // 2) 부분 차감 (Scenario 2 - 마지노선 방어)
  const partDeduct1 = step1BaseApproval - step1MinSpend; // 831,000
  const partApproval1 = step1MinSpend; // 21,053,000
  const partApproval2 = step2BaseApproval; // 4,124,000
  const partSafeDeduct = partDeduct1; // 831,000
  const partSafeReward = rewardTotalGcash - partSafeDeduct;
  const partDiscount1 = Math.floor(partApproval1 * 0.05);
  const partDiscount2 = Math.floor(partApproval2 * 0.03);
  const partTotalCardDiscount = partDiscount1 + partDiscount2;
  const partFinalPerceived = gross - partTotalCardDiscount - rewardTotalGcash;

  console.log(`\n[2. 부분 차감 플랜 (마지노선 방어)]`);
  console.log(`- 1차 카드: ${partApproval1.toLocaleString()}원 (선차감 -${partDeduct1.toLocaleString()}원, 청구할인 -${partDiscount1.toLocaleString()}원) -> 영수증 ${(partApproval1 - partDiscount1).toLocaleString()}원 (2,000만 달성 -> G캐시 ${step1UdaeGcash.toLocaleString()}원)`);
  console.log(`- 2차 카드: ${partApproval2.toLocaleString()}원 (선차감 0원, 청구할인 -${partDiscount2.toLocaleString()}원) -> 영수증 ${(partApproval2 - partDiscount2).toLocaleString()}원 (${step2BaseLabel} 달성 -> G캐시 ${step2BaseGcash.toLocaleString()}원)`);
  console.log(`- 총 카드승인: ${(partApproval1 + partApproval2).toLocaleString()}원 | 선차감: -${partSafeDeduct.toLocaleString()}원 | 잔여적립: +${partSafeReward.toLocaleString()}원 | 청구할인: -${partTotalCardDiscount.toLocaleString()}원 | 체감가: ${partFinalPerceived.toLocaleString()}원`);

  // 3) 전부 차감 (Scenario 3 - G캐시 0원 올인)
  // 1차는 2,000만 마지노선 사수: 21,053,000원 승인, 831,000원 선차감.
  // 2차 카드는 남은 원금 (gross - 21,053,000)에서 잔여 G캐시를 전액 차감!
  // 2차 카드의 실제 결제(승인) 금액에 따라 구간을 재판정!
  // 옵션 1: 100만원 단위 6.5% 적용
  // Let's test which tier 2차 actually lands in:
  let fullStep2Tier = null;
  const candidateTiers = [
    { label: '400만', minSpend: 4124000, minReceipt: 4000000, gcash: 260000 },
    { label: '300만', minSpend: 3093000, minReceipt: 3000000, gcash: 195000 },
    { label: '200만', minSpend: 2062000, minReceipt: 2000000, gcash: 130000 },
    { label: '100만', minSpend: 1031000, minReceipt: 1000000, gcash: 65000 },
    { label: '0원',   minSpend: 0,       minReceipt: 0,       gcash: 0 }
  ];

  for (const t of candidateTiers) {
    const candidateTotalGcash = step1UdaeGcash + t.gcash;
    const candidateDeduct2 = candidateTotalGcash - partDeduct1;
    const candidateStep2Approval = (gross - step1BaseApproval) - (candidateDeduct2 - partDeduct1);
    // Equivalently: gross - candidateTotalGcash - step1MinSpend
    const step2Approval = gross - candidateTotalGcash - step1MinSpend;
    const step2Receipt = Math.floor(step2Approval * (1 - 0.03));
    if (step2Receipt >= t.minReceipt) {
      fullStep2Tier = {
        ...t,
        totalGcash: candidateTotalGcash,
        step2Approval,
        step2Receipt,
        step2Deduct: candidateDeduct2
      };
      break;
    }
  }

  const fullStep1Approval = step1MinSpend;
  const fullStep1Discount = Math.floor(fullStep1Approval * 0.05);
  const fullStep2Approval = fullStep2Tier.step2Approval;
  const fullStep2Discount = Math.floor(fullStep2Approval * 0.03);
  const fullTotalCardDiscount = fullStep1Discount + fullStep2Discount;
  const fullTotalGcash = fullStep2Tier.totalGcash;
  const fullSafeDeduct = fullTotalGcash;
  const fullSafeReward = 0;
  const fullCardApproval = fullStep1Approval + fullStep2Approval;
  const fullFinalPerceived = gross - fullTotalCardDiscount - fullTotalGcash;

  console.log(`\n[3. 전부 차감 플랜 (G캐시 0원 올인 - 결제금액 기준 구간 재판정)]`);
  console.log(`- 1차 카드: ${fullStep1Approval.toLocaleString()}원 (선차감 -${partDeduct1.toLocaleString()}원, 청구할인 -${fullStep1Discount.toLocaleString()}원) -> 영수증 ${(fullStep1Approval - fullStep1Discount).toLocaleString()}원 (2,000만 달성 -> G캐시 ${step1UdaeGcash.toLocaleString()}원)`);
  console.log(`- 2차 카드: ${fullStep2Approval.toLocaleString()}원 (선차감 -${fullStep2Tier.step2Deduct.toLocaleString()}원, 청구할인 -${fullStep2Discount.toLocaleString()}원) -> 영수증 ${fullStep2Tier.step2Receipt.toLocaleString()}원 (${fullStep2Tier.label} 재판정 -> G캐시 ${fullStep2Tier.gcash.toLocaleString()}원)`);
  console.log(`- 총 카드승인: ${fullCardApproval.toLocaleString()}원 | 선차감: -${fullSafeDeduct.toLocaleString()}원 (100% 전액 차감) | 잔여적립: +${fullSafeReward}원 | 청구할인: -${fullTotalCardDiscount.toLocaleString()}원 | 체감가: ${fullFinalPerceived.toLocaleString()}원`);
}

calc3Scenario(26008000, 11.0);
calc3Scenario(26008000, 10.0);
