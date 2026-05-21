const path = require('path');
const uploadInstagram = require('../publishers/insta_publisher');
const { uploadNaverBlog } = require('../naver_blog_upload');

async function run() {
    console.log('🚀 [Jincencho System] 22시간 전 성공 로직으로 오늘 바이럴 업로드를 시작합니다...');

    // 1. 김해 더샵 신문그리니티 - 인스타그램 업로드
    const instaImages = [
        path.resolve(__dirname, '../generated_hooks/carousel_gimhae_thesharp_greenity_1.png'),
        path.resolve(__dirname, '../generated_hooks/carousel_gimhae_thesharp_greenity_2.png'),
        path.resolve(__dirname, '../generated_hooks/carousel_gimhae_thesharp_greenity_3.png'),
        path.resolve(__dirname, '../generated_hooks/carousel_gimhae_thesharp_greenity_4.png'),
        path.resolve(__dirname, '../generated_hooks/carousel_gimhae_thesharp_greenity_5.png')
    ];
    const instaCaption = `✨ 가전 잘 사고 잘 쓰는 법 \n\n경남 김해 더샵 신문그리니티 입주민 주목! \n\n왜 다들 '진센조'에서 가전졸업 할까요? 💎\n\n#비스포크AI #진센조 #인스타감성 #0원라이프 #김해입주 #신문그리니티 #더샵신문그리니티 #가전졸업 #진주통합매장`;

    console.log('\n--- [Step 1] 인스타그램 업로드 시작 (김해 더샵) ---');
    await uploadInstagram(instaImages, instaCaption, "김해 더샵 인스타그램");

    // 2. 김해 더샵 신문그리니티 - 네이버 블로그 업로드
    const blogTitle = "[진센조 일기] 경남 김해 더샵 신문그리니티 신규 입주 아파트의 해답은 결국 '진실'에 있습니다";
    const blogBody = [
        "안녕하세요. 가전 그 이상의 가치를 설계하는 JCC 진센조입니다.",
        "오늘은 경남 김해 더샵 신문그리니티 고객님과 함께한 가전 졸업 이야기를 들려드리려 합니다.",
        "가전의 가치는 단순히 기능에 있지 않습니다. 우리 집의 인테리어와 조화되고, 실제 사용자의 라이프스타일에 녹아들 때 진정한 가치가 발현됩니다.",
        "진센조는 단순 판매가 아닌, 고객님의 미래 공간을 함께 설계한다는 마음으로 상담에 임하고 있습니다.",
        "### 💡 진센조가 알려드리는 '가전 잘 쓰는 법'",
        "\"고객님, 혹시 냉장고 효율에 대해 들어보셨나요?\"",
        "냉장고 뒷면의 먼지를 1년에 한 번만 청소기로 습입해 주세요. 컴프레서의 과열을 막아 에너지 효율이 좋아지고 가전의 수명이 비약적으로 늘어납니다.",
        "아무도 말해주지 않는 이런 작은 차이가 소중한 가전의 수명을 결정합니다. 저 진센조는 판매를 끝이 아닌 새로운 인연의 시작으로 생각하기에, 이런 디테일까지 정중히 챙겨드리고 싶습니다.",
        "가전 잘 사고 잘 쓰는 법, 앞으로도 진센조가 끝까지 함께하겠습니다.",
        "#진센조 #가전졸업 #가전잘사고잘쓰는법 #인연의시작 #김해더샵 #신문그리니티"
    ];
    const blogImages = [
        path.resolve(__dirname, '../generated_hooks/hook_gimhae_thesharp_greenity.png')
    ];

    console.log('\n--- [Step 2] 네이버 블로그 업로드 시작 (김해 더샵) ---');
    await uploadNaverBlog(blogTitle, blogBody, blogImages, "김해 더샵 네이버 블로그");

    console.log('\n✅ [Jincencho System] 오늘의 모든 바이럴 업로드 시도가 완료되었습니다.');
}

run().catch(err => {
    console.error('🔥 실행 중 치명적 오류 발생:', err);
});
