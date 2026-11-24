function testScenario3(gross, rate) {
  const step1Gcash = Math.round(20000000 * (rate / 100)); // 2,200,000 at 11%, 2,000,000 at 10%
  
  // Available gross after keeping 1차 minSpend 21,053,000:
  // In 3번: 2차 candidate
  // If 2차 after full deduction can achieve >= 4,124,000 -> 400만 tier (3% discount, 26만 Gcash)
  // If 2차 after full deduction can achieve >= 3,093,000 -> 300만 tier (3% discount, 19.5만 Gcash)
  // Otherwise, 2차 drops below 300만: '300만원 이하 구간은 청구할인은 없어. 그렇다면 200만원만 결제하고 13만원 챙기고 자투리를 2000만원에 갖다 붙여서 계산'
  // So if surplusFor2 >= 2000000: 2차 is exactly 2,000,000 (0% discount, 13만 Gcash)
  // If surplusFor2 >= 1000000: 2차 is exactly 1,000,000 (0% discount, 6.5만 Gcash)
  // Otherwise 0.
  
  let step2Approval = 0;
  let step2Discount = 0;
  let step2Receipt = 0;
  let step2Gcash = 0;
  let step2Label = '';
  let step2DiscountRate = 0;
  
  if (gross - (step1Gcash + 260000) - 21053000 >= 4124000) {
    step2Approval = gross - (step1Gcash + 260000) - 21053000;
    step2DiscountRate = 0.03;
    step2Discount = Math.floor(step2Approval * 0.03);
    step2Receipt = step2Approval - step2Discount;
    step2Gcash = 260000;
    step2Label = '400만';
  } else if (gross - (step1Gcash + 195000) - 21053000 >= 3093000) {
    step2Approval = gross - (step1Gcash + 195000) - 21053000;
    step2DiscountRate = 0.03;
    step2Discount = Math.floor(step2Approval * 0.03);
    step2Receipt = step2Approval - step2Discount;
    step2Gcash = 195000;
    step2Label = '300만';
  } else if (gross - step1Gcash >= 21053000 + 2000000) {
    // Exactly 200만 payment, no card discount, 13만 Gcash, surplus to step 1!
    step2Approval = 2000000;
    step2DiscountRate = 0;
    step2Discount = 0;
    step2Receipt = 2000000;
    step2Gcash = 130000;
    step2Label = '200만';
  } else if (gross - step1Gcash >= 21053000 + 1000000) {
    step2Approval = 1000000;
    step2DiscountRate = 0;
    step2Discount = 0;
    step2Receipt = 1000000;
    step2Gcash = 65000;
    step2Label = '100만';
  } else {
    step2Approval = 0;
    step2DiscountRate = 0;
    step2Discount = 0;
    step2Receipt = 0;
    step2Gcash = 0;
    step2Label = '미달';
  }
  
  const totalGcash = step1Gcash + step2Gcash;
  // All remaining amount and all Gcash deduction go to Step 1!
  const step1Approval = (gross - step2Approval) - totalGcash;
  const step1Discount = Math.floor(step1Approval * 0.05);
  const step1Receipt = step1Approval - step1Discount;
  
  const totalApproval = step1Approval + step2Approval;
  const totalDiscount = step1Discount + step2Discount;
  const totalReceipt = step1Receipt + step2Receipt;
  const finalPerceived = gross - totalDiscount - totalGcash;
  
  console.log(`=== Gross: ${gross.toLocaleString()} (Rate ${rate}%) ===`);
  console.log(`  Step 1: 승인 ${step1Approval.toLocaleString()}원 | 청구할인 -${step1Discount.toLocaleString()}원 | 영수증 ${step1Receipt.toLocaleString()}원 (2,000만 상한 사수!)`);
  console.log(`  Step 2: 승인 ${step2Approval.toLocaleString()}원 | 청구할인 -${step2Discount.toLocaleString()}원 | 영수증 ${step2Receipt.toLocaleString()}원 (${step2Label} 구간 사은: ${step2Gcash.toLocaleString()}원)`);
  console.log(`  총 카드승인: ${totalApproval.toLocaleString()}원 + 선차감 ${totalGcash.toLocaleString()}원 = ${totalApproval + totalGcash}원`);
  console.log(`  총 청구할인: -${totalDiscount.toLocaleString()}원 | 영수증 총액: ${totalReceipt.toLocaleString()}원 | 최종 체감가: ${finalPerceived.toLocaleString()}원`);
}

testScenario3(26008000, 11.0);
testScenario3(26008000, 10.0);
testScenario3(24000000, 10.0);
testScenario3(28000000, 10.0);
