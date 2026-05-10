const fs = require('fs');
const path = require('path');
const { uploadNaverBlog } = require('./naver_blog_upload');

async function runDraft() {
    const contentPath = path.resolve(__dirname, 'naver_blog_draft_long.md');
    const fullContent = fs.readFileSync(contentPath, 'utf8');

    // Extract Title
    const titleMatch = fullContent.match(/# \[제목\] (.*)/);
    const title = titleMatch ? titleMatch[1].trim() : "울산 신정동 문수로 푸르지오 입주 가전 후기";

    // Extract Body (everything after the title line)
    const bodyStart = fullContent.indexOf('---');
    let body = fullContent.substring(bodyStart).trim();
    
    // Split body by double newlines to create blocks for Naver editor
    const bodyBlocks = body.split('\n\n').map(block => block.trim()).filter(block => block.length > 0);

    // Images
    const images = [
        path.resolve(__dirname, 'dashboard', 'images', 'B_WEEK_1_03_IMG_01.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'B_WEEK_1_03_IMG_02.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'B_WEEK_1_03_IMG_03.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'B_WEEK_1_03_IMG_04.png'),
        path.resolve(__dirname, 'dashboard', 'images', 'B_WEEK_1_03_IMG_05.png')
    ];

    console.log('--- Naver Blog Long Draft ---');
    console.log('Title:', title);
    console.log('Body Blocks:', bodyBlocks.length);
    console.log('Images:', images.length);
    console.log('----------------------------');

    // Execute Draft Upload
    await uploadNaverBlog(title, bodyBlocks, images, "네이버 블로그 1800자 후기", true);
}

runDraft().catch(err => {
    console.error('Execution Error:', err);
});
