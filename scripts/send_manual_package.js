const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TOKEN = '8722162859:AAFXVsi2rRNaqybfb4h5CeD9eFme-APzlFQ';
const CHAT_ID = '1294140235';

console.log('🚀 [Jincencho System] 텔레그램 수동 업로드 패키지 전송 시작...');

const images = [
    'carousel_gimhae_thesharp_greenity_1.png',
    'carousel_gimhae_thesharp_greenity_2.png',
    'carousel_gimhae_thesharp_greenity_3.png',
    'carousel_gimhae_thesharp_greenity_4.png',
    'carousel_gimhae_thesharp_greenity_5.png'
];

try {
    // 1. 이미지 전송
    console.log('📸 이미지 5장 전송 중...');
    for (let i = 0; i < images.length; i++) {
        const imgPath = path.resolve(__dirname, '../generated_hooks', images[i]);
        if (fs.existsSync(imgPath)) {
            console.log(` - 슬라이드 ${i + 1} 전송 중...`);
            const cmd = `curl.exe -s -X POST "https://api.telegram.org/bot${TOKEN}/sendPhoto" -F chat_id=${CHAT_ID} -F photo="@${imgPath}"`;
            execSync(cmd);
        } else {
            console.log(` ⚠️ 파일을 찾을 수 없습니다: ${images[i]}`);
        }
    }

    // 2. 텍스트 전송 (복사하기 쉽게)
    console.log('📝 캡션 텍스트 전송 중...');
    const caption = `✨ 가전 잘 사고 잘 쓰는 법 \n\n경남 김해 더샵 신문그리니티 입주민 주목! \n\n왜 다들 '진센조'에서 가전졸업 할까요? 💎\n\n#비스포크AI #진센조 #인스타감성 #0원라이프 #김해입주 #신문그리니티 #더샵신문그리니티 #가전졸업 #진주통합매장`;
    
    // 파일로 저장해서 curl로 보내기 (줄바꿈 특수문자 오류 방지)
    const textPath = path.resolve(__dirname, 'temp_caption.txt');
    const header = "👇 아래 텍스트를 꾹 눌러 복사한 뒤 인스타그램에 붙여넣으세요 👇\n\n";
    fs.writeFileSync(textPath, header + caption, 'utf8');

    // curl 파일 전송 대신 URL 인코딩을 통해 안전하게 전송
    const urlEncodedText = encodeURIComponent(header + caption);
    const textCmd = `curl.exe -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" -d "chat_id=${CHAT_ID}" -d "text=${urlEncodedText}"`;
    execSync(textCmd);
    
    // 임시 파일 삭제
    fs.unlinkSync(textPath);

    console.log('✅ 모든 전송이 완료되었습니다! 폰에서 텔레그램을 확인해 주세요.');

} catch (error) {
    console.error('🔥 전송 중 오류 발생:', error);
}
