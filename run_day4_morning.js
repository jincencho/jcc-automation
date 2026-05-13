const path = require('path');
const uploadInstagram = require('./insta_upload');
const { uploadFacebook } = require('./facebook_upload');

async function run() {
    const images = [
        path.resolve(__dirname, 'dashboard', 'images', 'I_SUB_BUWULGYEONG_04_IMG_01.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'I_SUB_BUWULGYEONG_04_IMG_02.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'I_SUB_BUWULGYEONG_04_IMG_03.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'I_SUB_BUWULGYEONG_04_IMG_04.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'I_SUB_BUWULGYEONG_04_IMG_05.png')
    ];

    const caption = `19년 차 매니저의 첫 질문 3가지 ❓\n\n가전 추천 전에 반드시 묻는 것.\n이 3가지 답이 달라지면 모델도 달라집니다.\n\n저장하시고 매장 방문 전에 답 정리해두세요.\n시간이 절반으로 줄어듭니다.\n\n📍 매장방문 → 프로필 링크\n📩 카톡 채널 "진센조"\n\n#삼성AI가전 #삼성구독 #BespokeAI #JCC #진센조 #JINCENCHO #가전구독 #1인가구가전 #자취가전 #구독꿀팁 #19년노하우 #가전팁 #부담없이 #부산구독 #울산구독 #경남구독 #진주통합매장 #부울경구독 #부울경가전 #스마트가전`;

    console.log('--- Day 4 Morning Upload (Slot 08:30) ---');
    
    // Upload to Instagram
    await uploadInstagram(images, caption, "Day 4 Instagram Morning");
    
    // Upload to Facebook
    await uploadFacebook(images, caption, "Day 4 Facebook Morning");
}

run().catch(err => {
    console.error('Upload Error:', err);
});
