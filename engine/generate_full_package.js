const ContentGenerator = require('./content_generator');
const ImageEngine = require('./image_engine');
const { generatePromptPack } = require('./prompt_generator');
const updateTrends = require('./trend_updater');
const fs = require('fs');
const path = require('path');

async function generateFullPackage() {
    console.log("🔄 [Full Package] Checking for live trend updates...");
    await updateTrends();

    const contentGenerator = new ContentGenerator();
    const imageEngine = new ImageEngine();

    // 0. Load Targets and pick the first active one for today
    const targetsPath = path.join(__dirname, '../data/viral_targets.json');
    const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
    
    // Pick the first target that is 'active' and scheduled for today or earliest
    const target = targets.find(t => t.status === 'active');

    if (!target) {
        console.log("✅ No active targets found to process.");
        return;
    }

    console.log(`🚀 [Full Package] Generating for priority target: ${target.name} (${target.region})...`);
    
    // 1. Content Generation for all three core targets
    const targetTypes = [
        { key: 'move_in', title: '신규입주' },
        { key: 'wedding', title: '혼수(Wedding)' },
        { key: 'subscription', title: 'AI 가전 구독' }
    ];

    const allContents = {};
    for (const t of targetTypes) {
        allContents[t.title] = await contentGenerator.generateMultiChannelContent(t.key, target.region, target.name);
    }

    // 2. Image Generation - Hook Image (Naver/FB)
    console.log('[Full Package] Generating Hook Image...');
    const hookPath = await imageEngine.generateHookImage(target);

    // 3. Image Generation - Instagram Carousel
    console.log('[Full Package] Generating Instagram Carousel...');
    const carouselData = [
        { badge: "인기 폭발", html: "왜 <span class='highlight'>가전 졸업</span>은<br>결국 진센조일까요?" },
        { badge: "팩트 체크", html: "단순한 할인이 아닙니다.<br><span class='highlight'>통합 정책</span>의 힘입니다." },
        { badge: "입주민 혜택", html: `${target.name}만을 위한<br>특별 큐레이션 공개` },
        { badge: "사후 관리", html: "판매는 끝이 아니라<br><span class='highlight'>인연의 시작</span>이니까요." },
        { badge: "상담 예약", html: "프로필 링크 클릭으로<br><span class='highlight'>0원 라이프</span> 시작하기" }
    ];
    const carouselPaths = await imageEngine.generateCarouselImages(target, carouselData);

    // 4. Save Report to Vault
    let report = `# 📅 5월 11일(월) JCC 진센조 바이럴 마케팅 패키지\n\n`;
    report += `## 🎯 타겟: ${target.region} ${target.name}\n\n`;
    report += `### 🖼️ 생성된 이미지 자산\n`;
    report += `- **메인 훅**: [hook_${target.id}.png](file:///${hookPath.replace(/\\/g, '/')})\n`;
    for (let i = 0; i < carouselPaths.length; i++) {
        report += `- **인스타 슬라이드 ${i+1}**: [carousel_${target.id}_${i+1}.png](file:///${carouselPaths[i].replace(/\\/g, '/')})\n`;
    }
    report += `\n---\n\n`;

    for (const t of targetTypes) {
        const contents = allContents[t.title];
        if (!contents) continue;
        report += `## 💡 [${t.title}] 전용 콘텐츠\n\n`;
        for (const [platform, content] of Object.entries(contents)) {
            if (!content) continue;
            report += `### 📱 [${platform.toUpperCase()}] 채널\n`;
            if (content.title) report += `**제목**: ${content.title}\n\n`;
            if (content.body) report += `**본문**:\n${content.body}\n\n`;
            if (content.caption) report += `**캡션**: ${content.caption}\n\n`;
            if (content.text) report += `**내용**: ${content.text}\n\n`;
            if (content.shorts_script) report += `**영상 스크립트**: ${content.shorts_script}\n\n`;
            if (content.hashtags) report += `**해시태그**: ${content.hashtags}\n\n`;
            report += `---\n\n`;
        }
        report += `## 🎨 [${t.title}] 전용 이미지 프롬프트\n\n`;
        report += generatePromptPack(t.key, contents);
        report += `\n---\n\n`;
    }

    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const fileName = `${localDate}_Package_${target.id}.md`;
    const outputPath = path.join(__dirname, '../marketing_vault/Calendar', fileName);
    fs.writeFileSync(outputPath, report);
    
    console.log(`✅ Full Package completed for ${target.name}!`);
    console.log(`📂 Report: ${outputPath}`);
}

generateFullPackage().catch(console.error);
