const path = require('path');
const uploadInstagram = require('./insta_upload');
const { uploadFacebook } = require('./facebook_upload');

async function publishNow() {
    const images = [
        path.resolve(__dirname, 'sub_carousel_final_1.png'),
        path.resolve(__dirname, 'sub_carousel_final_2.png'),
        path.resolve(__dirname, 'sub_carousel_final_3.png'),
        path.resolve(__dirname, 'sub_carousel_final_4.png'),
        path.resolve(__dirname, 'sub_carousel_final_5.png')
    ];

    const caption = `[진센조 가전구독 특별 컨설팅] 🕴️\n\n로봇청소기 딱 한 대, 그냥 온라인으로 대충 구독하셨습니까?\n\n진주 통합매장 '진센조'는 다릅니다. 단 1대의 구독이라도 고객님의 라이프스타일을 분석해 최적의 요금제를 설계해 드립니다.\n\n📍 상담 신청은 프로필 링크를 클릭하세요!\n\n#가전구독 #삼성AI구독 #진센조 #통합진주 #진주가전 #비대면상담 #가전비교 #신혼가전 #이사가전`;

    console.log('🚀 인스타그램 & 페이스북 동시 발행 시작...');
    
    // 인스타 먼저
    await uploadInstagram(images, caption, "즉시 발행 - 인스타");
    
    // 페북 다음
    await uploadFacebook(images, caption, "즉시 발행 - 페북");
    
    console.log('✨ 모든 플랫폼에 발행이 완료되었습니다!');
}

publishNow();
