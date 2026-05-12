const fs = require('fs');
const path = require('path');
const ContentGenerator = require('../engine/content_generator');
const ImageEngine = require('../engine/image_engine');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, ExternalHyperlink } = require("docx");

async function runDailyViral() {
    const today = new Date().toISOString().split('T')[0];
    const targetDir = path.join(__dirname, '../', today);
    
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
    }

    console.log(`🚀 [DailyTask] Starting viral automation for ${today}...`);
    console.log(`💡 [System Logic Update]
    - Storytelling: 19-year Master (Service-Logistics-Sales)
    - Subscription: Blue Pass, AI Care, 0-won Life
    - Strategy: Nationwide Non-face-to-face Consultation
    - Links: https://jcc-band.vercel.app/ (Auto-footer)
    - SNS: Instagram Carousel (6 slides) & Naver Blog
    - Hashtags: AI Care, Zero Labor, Time-saving (2026 Trend)
    ----------------------------------------------------------`);

    const generator = new ContentGenerator();
    const imageEngine = new ImageEngine();

    const targets = [
        { key: 'move_in', name: '신규입주', region: '부산', apartment: '에코델타시티 대성베르힐' },
        { key: 'wedding', name: '혼수웨딩', region: '경남/창원', apartment: '' },
        { key: 'moving', name: '이사고객', region: '울산', apartment: '문수푸르지오' },
        { key: 'subscription', name: '삼성 AI 가전 구독 클럽', region: '전국', apartment: '' }
    ];

    for (let target of targets) {
        console.log(`🎯 Processing target: ${target.name}`);
        
        // 1. Generate Content
        const content = await generator.generateMultiChannelContent(target.key, target.region, target.apartment);
        
        // 2. Generate Images (2 images: Hook + Jinju)
        const hookId = `${target.key}_${today}`;
        const targetData = { 
            id: hookId, 
            name: target.name, 
            region: target.region, 
            hook_message: content.instagram.image_hook 
        };
        const images = await imageEngine.generateDailyBlogImages(targetData, targetDir);

        // 3. Generate Instagram Carousel (5 Slides)
        console.log(`📸 [DailyTask] Generating Instagram Carousel for: ${target.name}`);
        const carouselSlides = [
            { badge: "JCC 진센조", html: `<span class="highlight">${content.instagram.image_hook}</span>` },
            ...content.instagram.carousel_hints.map(hint => ({
                badge: target.name,
                html: hint
            })),
            { badge: "상담 예약", html: "지금 바로 <span class=\"highlight\">프로필 링크</span>를 확인하세요!" }
        ];
        const instaImages = await imageEngine.generateCarouselImages(targetData, carouselSlides);
        
        // Move Carousel images to target directory with clear names
        instaImages.forEach((img, idx) => {
            const fileName = `insta_carousel_${target.key}_${idx + 1}.png`;
            fs.renameSync(img, path.join(targetDir, fileName));
        });

        // 4. Combine all channel contents for output (Polished for Direct Upload)
        const allChannelLines = [
            `# 🚀 [업로드용] JCC 진센조 ${target.name} 바이럴 패키지`,
            `---`,
            `## 📝 [NAVER BLOG] 원고 (복사하여 블로그에 붙여넣으세요)`,
            `**제목: ${content.naver_blog.title.replace('[NAVER BLOG] ', '')}**`,
            `\n`,
            ...content.naver_blog.body.split('\n'),
            `\n`,
            `**해시태그 (댓글이나 본문 하단에 넣으세요):**`,
            content.naver_blog.hashtags,
            `\n---`,
            `## 📸 [INSTAGRAM] 캡션`,
            content.instagram.caption.replace('[INSTAGRAM]\n', ''),
            `\n---`,
            `## 👥 [FACEBOOK] 게시글`,
            content.facebook.text.replace('[FACEBOOK]\n', ''),
            `\n---`,
            `## 🧵 [THREADS] 게시글`,
            content.threads.text.replace('[THREADS]\n', ''),
            `\n---`,
            `## 🎬 [YOUTUBE SHORTS] 스크립트`,
            content.youtube_shorts.shorts_script.replace('[YOUTUBE SHORTS]\n', '')
        ];

        // 4. Create DOCX (Clean Version)
        const fileNameBase = `[진센조_${target.name}]`;
        await createDocx(
            path.join(targetDir, `${fileNameBase}.docx`),
            `[JCC 진센조] ${target.name} 바이럴 패키지`,
            allChannelLines,
            images
        );
        
        // 5. Save MD for quick reference
        fs.writeFileSync(path.join(targetDir, `${fileNameBase}.md`), allChannelLines.join('\n'));
    }

    console.log(`✅ [DailyTask] All 4 targets completed for ${today}.`);
    
    // Notify Telegram (Optional dependency check)
    try {
        const { sendReport } = require('./telegram_report_util');
        await sendReport(today, targets.map(t => t.name));
    } catch (e) {
        console.log("Telegram report skipped (util not found or error).");
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

    // Add Images
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

    // Add Lines with Hyperlink Support
    for (const text of lines) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);
        
        const paragraphChildren = [];
        for (const part of parts) {
            if (part.match(urlRegex)) {
                // Remove trailing markdown brackets if any (e.g. from [link](url))
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
