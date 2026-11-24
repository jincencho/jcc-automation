const candidateTiers = [
  { label: '400만', minSpend: 4124000, targetReceipt: 4000000, gcash: 260000, rate: 0.03 },
  { label: '300만', minSpend: 3093000, targetReceipt: 3000000, gcash: 195000, rate: 0.03 },
  { label: '200만', minSpend: 2062000, targetReceipt: 2000000, gcash: 130000, rate: 0.03 },
  { label: '100만', minSpend: 1031000, targetReceipt: 1000000, gcash: 65000, rate: 0.03 },
  { label: '0원', minSpend: 0, targetReceipt: 0, gcash: 0, rate: 0 }
];

function testGross(gross, rewardRate) {
  const step1MinSpend = 21053000;
  const step1Gcash = Math.round(20000000 * (rewardRate / 100));
  
  let fullStep2Tier = null;
  let fullTotalGcash = 0;
  let fullStep2Approval = 0;
  let fullDeduct1 = Math.max(0, (gross - 4124000) - step1MinSpend);
  let fullDeduct2 = 0;
  
  for (const t of candidateTiers) {
    const candidateTotalGcash = step1Gcash + t.gcash;
    const d1 = Math.min(fullDeduct1, candidateTotalGcash);
    const remFor2 = candidateTotalGcash - d1;
    const step2Actual = Math.max(0, gross - candidateTotalGcash - step1MinSpend);
    const step2Receipt = Math.floor(step2Actual * (1 - t.rate));
    
    if (step2Receipt >= t.targetReceipt) {
      fullStep2Tier = t;
      fullTotalGcash = candidateTotalGcash;
      fullStep2Approval = step2Actual;
      fullDeduct2 = remFor2;
      break;
    }
  }
  
  const step1Approval = step1MinSpend;
  const step1Discount = Math.floor(step1Approval * 0.05);
  const step2Discount = Math.floor(fullStep2Approval * fullStep2Tier.rate);
  const totalCardDiscount = step1Discount + step2Discount;
  const cardApproval = step1Approval + fullStep2Approval;
  
  console.log(`Gross: ${gross.toLocaleString()} (Rate ${rewardRate}%)`);
  console.log(`  Tier: ${fullStep2Tier.label} (Gcash ${fullStep2Tier.gcash.toLocaleString()})`);
  console.log(`  Total Gcash: ${fullTotalGcash.toLocaleString()}`);
  console.log(`  Step 1: ${step1Approval.toLocaleString()} (Receipt: ${(step1Approval - step1Discount).toLocaleString()})`);
  console.log(`  Step 2: ${fullStep2Approval.toLocaleString()} (Receipt: ${(fullStep2Approval - step2Discount).toLocaleString()})`);
  console.log(`  Total Approval: ${cardApproval.toLocaleString()} + Gcash ${fullTotalGcash.toLocaleString()} = ${(cardApproval + fullTotalGcash).toLocaleString()}`);
}

testGross(26008000, 11.0);
testGross(26008000, 10.0);
testGross(24000000, 10.0);
testGross(28000000, 10.0);
