const fs = require('fs');
const path = require('path');
const ContentGenerator = require('../engine/content_generator');
const ImageEngine = require('../engine/image_engine');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, ExternalHyperlink } = require("docx");

async function runDailyViral() {
    // 0. Determine Target Date
    const args = process.argv.slice(2);
    const targetDate = args[0] || new Date().toISOString().split('T')[0];
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

    // 2. Define 3 Mandatory Categories
    const categories = [
        { key: 'move_in', folder: '입주', name: '신규입주', region: mainTarget.region, apartment: mainTarget.name },
        { key: 'wedding', folder: '혼수', name: '혼수웨딩', region: mainTarget.region, apartment: '' },
        { key: 'subscription', folder: '구독', name: '삼성 AI 가전 구독 클럽', region: '전국', apartment: '' }
    ];

    const generator = new ContentGenerator();
    const imageEngine = new ImageEngine();

    for (let cat of categories) {
        console.log(`🎯 Processing Category: ${cat.folder} (${cat.name})`);
        
        // Create Subfolder
        const subDir = path.join(baseDir, cat.folder);
        if (!fs.existsSync(subDir)) {
            fs.mkdirSync(subDir);
        }

        // 1. Generate Content
        const content = await generator.generateMultiChannelContent(cat.key, cat.region, cat.apartment);
        
        // 2. Generate Images (Hook + Jinju Local)
        const targetId = `${mainTarget.id}_${cat.key}`;
        const targetData = { 
            id: targetId, 
            name: cat.name, 
            region: cat.region, 
            hook_message: content.instagram.image_hook 
        };
        const images = await imageEngine.generateDailyBlogImages(targetData, subDir);

        // 3. Generate Instagram Carousel (6 Slides)
        console.log(`📸 [DailyTask] Generating Carousel for: ${cat.folder}`);
        const carouselSlides = [
            { badge: "JCC 진센조", html: `<span class="highlight">${content.instagram.image_hook}</span>` },
            ...content.instagram.carousel_hints.map(hint => ({
                badge: cat.name,
                html: hint
            })),
            { badge: "상담 예약", html: "지금 바로 <span class=\"highlight\">프로필 링크</span>를 확인하세요!" }
        ];
        const instaImages = await imageEngine.generateCarouselImages(targetData, carouselSlides, cat.key);
        
        // Move Carousel images to subfolder
        instaImages.forEach((img, idx) => {
            const fileName = `insta_carousel_${idx + 1}.png`;
            fs.renameSync(img, path.join(subDir, fileName));
        });

        // 4. Combine contents for output
        const allChannelLines = [
            `# 🚀 [업로드용] JCC 진센조 ${cat.name} 바이럴 패키지`,
            `---`,
            `## 📝 [NAVER BLOG] 원고`,
            `**제목: ${content.naver_blog.title.replace('[NAVER BLOG] ', '')}**`,
            `\n`,
            ...content.naver_blog.body.split('\n'),
            `\n`,
            `**해시태그:**`,
            content.naver_blog.hashtags,
            `\n---`,
            `## 📸 [INSTAGRAM] 캡션`,
            content.instagram.caption.replace('[INSTAGRAM]\n', ''),
            `\n---`,
            `## 👥 [FACEBOOK] 게시글`,
            content.facebook.text.replace('[FACEBOOK]\n', ''),
            `\n---`,
            `## 🎬 [YOUTUBE SHORTS] 스크립트`,
            content.youtube_shorts.shorts_script.replace('[YOUTUBE SHORTS]\n', '')
        ];

        // 4. Create DOCX
        const fileNameBase = `[진센조_${cat.folder}]`;
        await createDocx(
            path.join(subDir, `${fileNameBase}.docx`),
            `[JCC 진센조] ${cat.name} 바이럴 패키지`,
            allChannelLines,
            images
        );
        
        // 5. Save MD
        fs.writeFileSync(path.join(subDir, `${fileNameBase}.md`), allChannelLines.join('\n'));
    }

    console.log(`✅ [DailyTask] Completed multi-category package for ${targetDate}.`);
    
    // Notify Telegram
    try {
        const { sendReport } = require('./telegram_report_util');
        await sendReport(targetDate, categories.map(c => c.folder));
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

if (require.main === module) {
    runDailyViral().catch(console.error);
}
