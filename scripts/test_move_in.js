const ContentGenerator = require('../engine/content_generator');

async function runTest() {
    console.log("🚀 입주(move_in) 원고 단일 생성 테스트를 시작합니다...\n");
    const generator = new ContentGenerator();
    
    // 부산/경남, 테스트 아파트
    const content = await generator.generateMultiChannelContent('move_in', '부산/경남', '테스트 아파트');
    
    console.log("===============================");
    console.log("📝 [NAVER BLOG] 제목:");
    console.log(content.naver_blog.title);
    console.log("\n📝 [NAVER BLOG] 본문:");
    console.log(content.naver_blog.body);
    console.log("===============================\n");
    
    console.log("📸 [INSTAGRAM] 캡션:");
    console.log(content.instagram.caption);
    console.log("===============================\n");
}

runTest().catch(console.error);
