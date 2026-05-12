const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TOKEN = '8722162859:AAFXVsi2rRNaqybfb4h5CeD9eFme-APzlFQ';
const CHAT_ID = '1294140235';

console.log('🚀 [Jincencho System] 프리미엄 혼수/구독 패키지 전송 시작...');

const packages = [
    {
        id: 'wedding',
        name: '프리미엄 혼수/웨딩',
        image: 'wedding_premium_interior_1778494603788.png',
        blog_caption: `[진센조 일기] 세상에서 가장 아름다운 졸업, '가전 졸업'을 축하드립니다

안녕하세요. 가전 그 이상의 가치를 설계하는 JCC 진센조입니다.

오늘 매장에는 설레는 표정의 예비 부부 한 쌍이 방문하셨습니다. 결혼 준비로 지친 기색이 역력했지만, 비스포크 AI 가전의 세련된 디자인을 보시곤 금세 눈이 반짝이시더군요.

저는 그분들께 단순히 제품을 설명하지 않았습니다. 대신 질문을 던졌습니다. "두 분은 집에서 어떤 시간을 가장 소중히 여기시나요?"

혼수 가전은 단순한 가구가 아닙니다. 두 분이 함께 만들어갈 미래의 첫 단추이자, 매일 아침 눈을 떠서 마주할 라이프스타일의 기초입니다. 갤러리아 진주 백화점의 프리미엄 퀄리티와 로드샵의 압도적인 혜택을 결합한 진센조만의 큐레이션은 바로 이런 고민에서 시작되었습니다.

19년 동안 수많은 '가전 졸업생'들을 배출하며 깨달은 진실은 하나입니다. 최고의 가전은 '가장 비싼 것'이 아니라 '두 분의 삶에 가장 잘 스며드는 것'입니다. 

오늘도 진센조는 두 분의 설레는 시작을 완벽하게 설계합니다. 판매는 끝이 아니라 새로운 인연의 시작이니까요.

#진센조 #가전졸업 #혼수가전 #웨딩패키지 #진주가전 #갤러리아진주 #결혼준비 #비스포크AI`,
        insta_caption: `✨ 세상에서 가장 아름다운 졸업, '가전 졸업' 💎

인생의 새로운 시작, 설렘만큼이나 고민도 많으시죠?
진센조는 단순한 판매가 아닌, 두 분의 앞날을 빛낼 라이프스타일을 설계합니다.

🎁 갤러리아 진주 백화점의 프리미엄과 로드샵의 파격적인 혜택을 하나로!
조준석 매니저의 19년 내공이 담긴 큐레이션으로 완벽한 시작을 함께하세요.

#가전졸업 #혼수가전 #웨딩패키지 #진센조 #진주가전 #비스포크AI #신혼인테리어 #결혼준비`
    },
    {
        id: 'subscription',
        name: '트렌디 가전 구독',
        image: 'subscription_trendy_minimalist_1778494625447.png',
        blog_caption: `[진센조 일기] 소유의 시대를 넘어, 누림의 시대로! '0원 라이프'의 시작

안녕하세요, 진센조입니다. 요즘 MZ세대 고객님들을 만나면 확실히 달라진 흐름을 느낍니다. "굳이 목돈을 들여서 사야 할까요?"라는 질문이 늘었거든요.

그 답은 명쾌합니다. 바로 '가전 구독'입니다.

초기 비용 0원. 하지만 우리 집에 들어오는 건 최신형 비스포크 AI 냉장고와 TV입니다. 큰 지출 없이도 프리미엄 라이프스타일을 누릴 수 있는 것, 그것이 진센조가 제안하는 스마트 금융 설계의 핵심입니다.

많은 분이 걱정하십니다. "구독이면 더 비싼 거 아닌가요?" 
진센조는 숫자로 증명합니다. 제휴 혜택과 정기적인 관리 서비스, 그리고 5년 뒤 소유권 이전까지 따져보면 오히려 더 현명한 선택이 될 수 있습니다. 

저는 고객님의 통장 잔고가 아닌, 고객님의 '삶의 질'을 먼저 봅니다. 매일 아침 깨끗하게 관리된 에어컨 바람을 쐬고, AI가 알아서 관리해주는 냉장고를 사용하는 경험. 그 가치는 무엇보다 소중하기 때문입니다.

부담은 낮추고 감동은 높이는 방법, 진센조가 알려드립니다. 소유하지 않아도 충분히 아름다운 당신의 공간을 응원합니다.

#진센조 #가전구독 #0원라이프 #구독경제 #삼성가전구독 #비스포크AI #스마트홈 #라이프스타일`,
        insta_caption: `🚀 소유의 시대를 넘어, 누림의 시대로! '0원 라이프'의 시작 ✨

최신 AI 가전, 갖고는 싶은데 초기 비용이 부담되셨나요?
진센조의 스마트 구독 금융 설계라면 오늘 당장 가능합니다. 💎

부담은 0원, 감동은 100%. 정기적인 관리 서비스까지 한 번에!
트렌디한 당신을 위한 가장 현명한 가전 생활, 지금 진센조와 상담하세요.

#가전구독 #0원라이프 #비스포크구독 #진센조 #MZ트렌드 #스마트홈 #AI가전 #구독생활`
    }
];

try {
    for (const pkg of packages) {
        console.log(`🎯 [${pkg.name}] 전송 중...`);
        
        // 1. 이미지 전송
        const imgPath = path.resolve(__dirname, '..', pkg.image);
        if (fs.existsSync(imgPath)) {
            execSync(`curl.exe -s -X POST "https://api.telegram.org/bot${TOKEN}/sendPhoto" -F chat_id=${CHAT_ID} -F photo="@${imgPath}"`);
        }

        // 2. 블로그 원고 전송
        const blogText = `📗 [블로그용 장문 원고 - ${pkg.name}]\n\n${pkg.blog_caption}`;
        execSync(`curl.exe -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" -d "chat_id=${CHAT_ID}" -d "text=${encodeURIComponent(blogText)}"`);

        // 3. 인스타 캡션 전송
        const instaText = `📸 [인스타용 요약 캡션 - ${pkg.name}]\n\n${pkg.insta_caption}`;
        execSync(`curl.exe -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" -d "chat_id=${CHAT_ID}" -d "text=${encodeURIComponent(instaText)}"`);

        console.log(`✅ [${pkg.name}] 완료!`);
        execSync('powershell Start-Sleep -Seconds 2');
    }
    console.log('🏁 모든 프리미엄 패키지 전송 완료!');
} catch (error) {
    console.error('🔥 전송 오류:', error);
}
