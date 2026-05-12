const { uploadNaverBlog } = require('../publishers/naver_publisher');
const path = require('path');

const title = "[진센조 일기] 세상에서 가장 아름다운 졸업, 가전 졸업을 축하드립니다";
const contentRaw = `안녕하세요. 가전 그 이상의 가치를 설계하는 JCC 진센조입니다.

오늘 매장에는 설레는 표정의 예비 부부 한 쌍이 방문하셨습니다. 결혼 준비로 지친 기색이 역력했지만, 비스포크 AI 가전의 세련된 디자인을 보시곤 금세 눈이 반짝이시더군요.

저는 그분들께 단순히 제품을 설명하지 않았습니다. 대신 질문을 던졌습니다. "두 분은 집에서 어떤 시간을 가장 소중히 여기시나요?"

혼수 가전은 단순한 가구가 아닙니다. 두 분이 함께 만들어갈 미래의 첫 단추이자, 매일 아침 눈을 떠서 마주할 라이프스타일의 기초입니다. 갤러리아 진주 백화점의 프리미엄 퀄리티와 로드샵의 압도적인 혜택을 결합한 진센조만의 큐레이션은 바로 이런 고민에서 시작되었습니다.

19년 동안 수많은 가전 졸업생들을 배출하며 깨달은 진실은 하나입니다. 최고의 가전은 '가장 비싼 것'이 아니라 '두 분의 삶에 가장 잘 스며드는 것'입니다. 

오늘도 진센조는 두 분의 설레는 시작을 완벽하게 설계합니다. 판매는 끝이 아니라 새로운 인연의 시작이니까요.

#진센조 #가전졸업 #혼수가전 #웨딩패키지 #진주가전 #갤러리아진주 #결혼준비 #비스포크AI`;

// 문단별로 나누어 배열로 변환
const bodyBlocks = contentRaw.split('\n').filter(line => line.trim().length > 0);

const images = [
    path.resolve(__dirname, '../generated_hooks/wedding_premium.png')
];

console.log("🚀 네이버 블로그 검증 업로드 시작 (혼수 패키지)...");
uploadNaverBlog(title, bodyBlocks, images, '혼수 가전 검증용')
    .then(() => console.log("✅ 업로드 프로세스 완료!"))
    .catch(err => {
        console.error("🔥 업로드 실패:", err);
        process.exit(1);
    });
