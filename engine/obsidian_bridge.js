const ContentGenerator = require('./content_generator');
const ImageEngine = require('./image_engine');
const fs = require('fs');
const path = require('path');

// Usage: node engine/obsidian_bridge.js [target_id]
async function bridge(targetId) {
    if (!targetId) {
        console.error("❌ Target ID is required.");
        process.exit(1);
    }

    const targetsPath = path.join(__dirname, '../data/viral_targets.json');
    const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
    const target = targets.find(t => t.id === targetId);

    if (!target) {
        console.error(`❌ Target with ID '${targetId}' not found.`);
        process.exit(1);
    }

    const contentGenerator = new ContentGenerator();
    const imageEngine = new ImageEngine();

    console.log(`🚀 [Obsidian Bridge] Generating package for: ${target.name}...`);
    
    // 1. Content Generation
    const contents = await contentGenerator.generateMultiChannelContent(target.key || 'new_apartment', target.region, target.name);

    // 2. Image Generation
    const hookPath = await imageEngine.generateHookImage(target);
    const carouselPaths = await imageEngine.generateCarouselImages(target, [
        { badge: "인기 폭발", html: "왜 <span class='highlight'>가전 졸업</span>은<br>결국 진센조일까요?" },
        { badge: "팩트 체크", html: "단순한 할인이 아닙니다.<br><span class='highlight'>통합 정책</span>의 힘입니다." },
        { badge: "입주민 혜택", html: `${target.name}만을 위한<br>특별 큐레이션 공개` },
        { badge: "사후 관리", html: "판매는 끝이 아니라<br><span class='highlight'>인연의 시작</span>이니까요." },
        { badge: "상담 예약", html: "프로필 링크 클릭으로<br><span class='highlight'>0원 라이프</span> 시작하기" }
    ]);

    // 3. Save Report
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const fileName = `${localDate}_Package_${target.id}.md`;
    const outputPath = path.join(__dirname, '../marketing_vault/Calendar', fileName);
    
    let report = `# 📅 ${localDate} JCC 바이럴 패키지 - ${target.name}\n\n`;
    report += `### 🎯 타겟: ${target.region} ${target.name}\n\n`;
    report += `### 🖼️ 생성된 이미지 자산\n`;
    report += `- **메인 훅**: [hook_${target.id}.png](file:///${hookPath.replace(/\\/g, '/')})\n`;
    for (let i = 0; i < carouselPaths.length; i++) {
        report += `- **인스타 슬라이드 ${i+1}**: [carousel_${target.id}_${i+1}.png](file:///${carouselPaths[i].replace(/\\/g, '/')})\n`;
    }
    report += `\n---\n\n`;

    for (const [platform, content] of Object.entries(contents)) {
        report += `### 📱 [${platform.toUpperCase()}] 채널\n`;
        if (content.title) report += `**제목**: ${content.title}\n\n`;
        if (content.body) report += `**본문**:\n${content.body}\n\n`;
        if (content.caption) report += `**캡션**: ${content.caption}\n\n`;
        if (content.text) report += `**내용**: ${content.text}\n\n`;
        if (content.shorts_script) report += `**영상 스크립트**: ${content.shorts_script}\n\n`;
        if (content.hashtags) report += `**해시태그**: ${content.hashtags}\n\n`;
        report += `---\n\n`;
    }

    fs.writeFileSync(outputPath, report);

    // 4. Update Obsidian Target File Status
    const vaultTargetFile = path.join(__dirname, `../marketing_vault/Targets/${target.name}.md`);
    if (fs.existsSync(vaultTargetFile)) {
        let md = fs.readFileSync(vaultTargetFile, 'utf8');
        md = md.replace(/status: .*/, 'status: completed');
        md = md.replace(/현재 상태: .*/, '현재 상태: ✅ 완료');
        fs.writeFileSync(vaultTargetFile, md);
    }

    // 5. Update JSON status
    target.status = 'completed';
    fs.writeFileSync(targetsPath, JSON.stringify(targets, null, 2));

    console.log(`✅ Package generated and Obsidian synced for ${target.name}!`);
}

const targetId = process.argv[2];
bridge(targetId).catch(console.error);
