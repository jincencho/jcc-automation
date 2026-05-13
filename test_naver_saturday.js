const fs = require('fs');
const path = require('path');
const { uploadNaverBlog } = require('./naver_blog_upload');

async function run() {
    const mdPath = path.resolve(__dirname, 'blog_drafts', 'Saturday_Special_Draft.md');
    const content = fs.readFileSync(mdPath, 'utf8');
    
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const title = lines[0].replace('# ', '').trim();
    const bodyBlocks = lines.slice(1).map(l => l.trim()).filter(l => l.length > 0);
    
    // 이미지 (오늘 생성한 이미지 중 하나를 대표로 사용)
    const imagePath = path.resolve(__dirname, 'dashboard', 'images', 'I_SUB_BUWULGYEONG_04_IMG_01.png');

    console.log('--- Saturday Special Naver Blog Auto-Upload ---');
    console.log('제목:', title);
    
    // 실제 발행 모드로 실행 (isDraft = false)
    await uploadNaverBlog(title, bodyBlocks, [imagePath], "토요일 특별 발행", false);
}

run().catch(err => {
    console.error('Upload Error:', err);
});
