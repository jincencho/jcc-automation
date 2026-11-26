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

// 1. Quotation 1 Option B cashback row
const q1Target = `                          <strong style={{ fontWeight: 900, color: '#0f172a' }}>삼성AI구독 캐시백</strong>
                          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>
                            (차차월 5~7일 지급)
                          </span>`;

const q1Replacement = `                          <strong style={{ fontWeight: 900, color: '#0f172a' }}>삼성AI구독 캐시백</strong>
                          <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 500, marginLeft: '4px' }}>
                            (설치후 차차월 5~7일 지급)
                          </span>`;

replaceExact(q1Target, q1Replacement, '1. Quotation 1 Option B cashback label');

// 2. Checkpoints in renderPage2ExtraInfo
const cp1Target = `행사 기준 증빙 완료 후 익월(삼성AI구독 캐시백은 차차월 5~7일) 지정 계좌 및 모바일 지급`;
const cp1Replacement = `행사 기준 증빙 완료 후 익월(삼성AI구독 캐시백은 설치후 차차월 5~7일) 지정 계좌 및 모바일 지급`;

replaceExact(cp1Target, cp1Replacement, '2. Checkpoint in renderPage2ExtraInfo');

// 3. Checkpoints in renderCardPolicyBox
const cp2Target = `행사 기준 증빙 완료 후 익월/차차월 지정 계좌 및 모바일 지급`;
const cp2Replacement = `행사 기준 증빙 완료 후 익월(설치후 차차월 5~7일) 지정 계좌 및 모바일 지급`;

replaceExact(cp2Target, cp2Replacement, '3. Checkpoint in renderCardPolicyBox');

// 4. Input UI section
const inputTitleTarget = `🎁 삼성AI구독 혜택 (캐시백,차차월 5~7일)`;
const inputTitleReplacement = `🎁 삼성AI구독 혜택 (캐시백, 설치후 차차월 5~7일)`;

replaceExact(inputTitleTarget, inputTitleReplacement, '4. Input title');

const inputPhTarget = `placeholder="삼성AI구독 캐시백 금액 입력 (차차월 5~7일 지급, 예: 200,000)"`;
const inputPhReplacement = `placeholder="삼성AI구독 캐시백 금액 입력 (설치후 차차월 5~7일 지급, 예: 200,000)"`;

replaceExact(inputPhTarget, inputPhReplacement, '5. Input placeholder');

const inputNoteTarget = `※ 구독 가입 시 지급되는 현금성 캐시백(차차월 5~7일 지급) 혜택을 입력하시면 고객 체감가에서 즉시 차감됩니다.`;
const inputNoteReplacement = `※ 구독 가입 시 지급되는 현금성 캐시백(설치후 차차월 5~7일 지급) 혜택을 입력하시면 고객 체감가에서 즉시 차감됩니다.`;

replaceExact(inputNoteTarget, inputNoteReplacement, '6. Input note');

fs.writeFileSync(filePath, content, 'utf8');
console.log('ALL CASHBACK LABELS UPDATED SUCCESSFULLY!');
