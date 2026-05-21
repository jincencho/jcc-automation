const fs = require('fs');
const path = require('path');
const ContentGenerator = require('../engine/content_generator');
const { generatePromptPack } = require('../engine/prompt_generator');
const updateTrends = require('../engine/trend_updater');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, ExternalHyperlink } = require("docx");

async function runDailyViral() {
    console.log("🔄 [DailyTask] Checking for live trend updates...");
    await updateTrends();

    // 0. Determine Target Date
    const args = process.argv.slice(2);
    // Use KST (Asia/Seoul) to ensure correct date even at 8 AM KST (which is 23:00 UTC previous day)
    const getKstDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
    const targetDate = args[0] || getKstDate();
    const baseDir = path.join(__dirname, '../', targetDate);
    
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir);
    }

    console.log(`🚀 [DailyTask] Starting organized viral automation for ${targetDate}...`);

    // 1. Load Main Target for the day (for region/apartment context)
    const targetsPath = path.join(__dirname, '../data/viral_targets.json');
    const allTargets = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
    const mainTarget = allTargets.find(t => t.scheduled_date === targetDate && t.status === 'active') || {
        name: '신규입주단지',
        region: '부산/경남',
        id: 'default_target'
    };

    // 2. Daily Multi-Target Strategy
    // ✅ 네이버 블로그: 매일 2개 (입주 + 혼수)
    // ✅ 인스타그램: 매일 3개 (입주 + 혼수 + 구독)
    const allCategories = [
        { key: 'move_in', folder: '입주', name: '신규입주', region: mainTarget.region, apartment: mainTarget.name, channels: ['blog', 'instagram'] },
        { key: 'wedding', folder: '혼수', name: '혼수웨딩', region: mainTarget.region, apartment: '', channels: ['blog', 'instagram'] },
        { key: 'subscription', folder: '구독', name: '삼성 AI 가전 구독 클럽', region: '전국', apartment: '', channels: ['instagram'] }
    ];

    console.log(`📅 [DailyTask] Generating ALL targets: 블로그 2개(입주+혼수) + 인스타 3개(입주+혼수+구독)`);

    const generator = new ContentGenerator();

    for (let cat of allCategories) {
        console.log(`🎯 Processing Category: ${cat.folder} (${cat.name}) [${cat.channels.join(', ')}]`);
        
        // Create Subfolder
        const subDir = path.join(baseDir, cat.folder);
        if (!fs.existsSync(subDir)) {
            fs.mkdirSync(subDir);
        }

        // 1. Generate Content for all channels
        const content = await generator.generateMultiChannelContent(cat.key, cat.region, cat.apartment);
        const images = [];

        // 2. Build output based on assigned channels
        const outputLines = [
            `# 🚀 [업로드용] JCC 진센조 ${cat.name} 바이럴 패키지`,
            `---`
        ];

        // --- NAVER BLOG (입주 + 혼수만) ---
        if (cat.channels.includes('blog')) {
            outputLines.push(
                `## 📝 [NAVER BLOG] 원고`,
                `**제목: ${content.naver_blog.title.replace('[NAVER BLOG] ', '')}**`,
                `\n`,
                ...content.naver_blog.body.split('\n'),
                `\n`,
                `**해시태그:**`,
                content.naver_blog.hashtags,
                `\n---`
            );
        }

        // --- INSTAGRAM (전 타겟) ---
        if (cat.channels.includes('instagram')) {
            outputLines.push(
                `## 📸 [INSTAGRAM] 캡션`,
                content.instagram.caption.replace('[INSTAGRAM]\n', ''),
                `\n---`
            );
        }

        // --- 보조 채널 (전 타겟 공통) ---
        outputLines.push(
            `## 👥 [FACEBOOK] 게시글`,
            content.facebook.text.replace('[FACEBOOK]\n', ''),
            `\n---`,
            `## 🧵 [THREADS] 게시글`,
            content.threads.text.replace(/\[THREADS\]\n/g, '')
        );

        // 3. Create DOCX
        const fileNameBase = `[진센조_${cat.folder}]`;
        await createDocx(
            path.join(subDir, `${fileNameBase}.docx`),
            `[JCC 진센조] ${cat.name} 바이럴 패키지`,
            outputLines,
            images
        );
        
        // 4. Save MD
        fs.writeFileSync(path.join(subDir, `${fileNameBase}.md`), outputLines.join('\n'));

        // 5. Generate and Save ChatGPT Prompt Pack (with actual hooking messages from content)
        console.log(`🤖 [DailyTask] Generating ChatGPT Prompts for: ${cat.folder}`);
        const promptText = generatePromptPack(cat.key, content, target.name);
        fs.writeFileSync(path.join(subDir, `[진센조_이미지프롬프트].md`), promptText);
    }

    console.log(`✅ [DailyTask] Completed multi-category package for ${targetDate}.`);
    
    // Notify Telegram
    try {
        const { sendReport } = require('./telegram_report_util');
        await sendReport(targetDate, allCategories.map(c => c.folder));
    } catch (e) {
        console.log("Telegram report skipped.");
    }
}

async function createDocx(filePath, title, lines, imagePaths) {
    let children = [
        new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        })
    ];

    for (const imgPath of imagePaths) {
        if (fs.existsSync(imgPath)) {
            children.push(
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync(imgPath),
                            transformation: { width: 500, height: 280 }
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 200 }
                })
            );
        }
    }

    for (const text of lines) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        const paragraphChildren = [];
        for (const part of parts) {
            if (part.match(urlRegex)) {
                const cleanUrl = part.replace(/[()\]]/g, '');
                paragraphChildren.push(new ExternalHyperlink({
                    children: [
                        new TextRun({
                            text: cleanUrl,
                            color: "0000FF",
                            underline: {},
                            size: 24,
                            font: "맑은 고딕"
                        })
                    ],
                    link: cleanUrl
                }));
            } else {
                paragraphChildren.push(new TextRun({ text: part, size: 24, font: "맑은 고딕" }));
            }
        }
        children.push(
            new Paragraph({
                children: paragraphChildren,
                spacing: { before: 120, after: 120, line: 360 },
            })
        );
    }

    const doc = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
}

// generatePromptPack logic is now imported from engine/prompt_generator.js

if (require.main === module) {
    runDailyViral().catch(async (err) => {
        console.error("❌ Daily viral task failed:", err.message);
        try {
            const { sendError } = require('./telegram_report_util');
            const todayKst = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
            await sendError(todayKst, err.message);
        } catch (e) {
            console.error("❌ Could not send error alert:", e.message);
        }
        process.exit(1);
    });
}
