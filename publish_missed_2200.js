const uploadInstagram = require('./insta_upload');
const { uploadFacebook } = require('./facebook_upload');
const path = require('path');

async function run() {
    const images = [
        path.resolve(__dirname, 'dashboard', 'images', 'I_NEW_SHINJEONG_04_IMG_01.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'I_NEW_SHINJEONG_04_IMG_02.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'I_NEW_SHINJEONG_04_IMG_03.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'I_NEW_SHINJEONG_04_IMG_04.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'I_NEW_SHINJEONG_04_IMG_05.png')
    ];
    
    const caption = `신정동 입주민 필독: 가전 졸업 시나리오 🏗️\n\n입주 전 평면도 사진 하나만 챙겨오세요.\n줄자 대신 19년 차 전문가의 데이터로 정밀 실측 끝내드립니다.\n\n📍 매장방문 -> 프로필 링크\n📩 카톡 채널 "진센조"\n\n#삼성AI가전 #BespokeAI #JCC #진센조 #JINCENCHO #입주가전 #신축아파트 #2026입주 #신정동입주 #울산이사 #진주통합매장 #부울경입주 #19년경력`;

    console.log('--- Retrying Missed 22:00 Slot ---');
    await uploadInstagram(images, caption, '어제 22:00 소급 발행');
    await uploadFacebook(images, caption, '어제 22:00 소급 발행');
}

run().catch(console.error);
