const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } = require("docx");
const fs = require("fs");
const path = require("path");

const DATE_FOLDER = "2026-05-12";
const INPUT_FILE = "tuesday_viral_package.md";
const BASE_DIR = path.join(__dirname, "..");
const TARGET_DIR = path.join(BASE_DIR, DATE_FOLDER);

async function createDocx(fileName, title, lines, imageFileName) {
    let children = [
        new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
        })
    ];

    if (imageFileName) {
        const imgPath = path.join(TARGET_DIR, imageFileName);
        if (fs.existsSync(imgPath)) {
            children.push(
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: fs.readFileSync(imgPath),
                            transformation: {
                                width: 500,
                                height: 500
                            }
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                })
            );
        }
    }

    children.push(...lines.map(text => 
        new Paragraph({
            children: [
                new TextRun({
                    text: text,
                    size: 24, // 12pt
                    font: "맑은 고딕",
                }),
            ],
            spacing: { before: 200, after: 200, line: 360 },
        })
    ));
    children.push(
        new Paragraph({
            text: "\n--- [JCC 진센조 | 19년 경력 가전 전문가 조준석] ---",
            alignment: AlignmentType.RIGHT,
            spacing: { before: 400 },
        })
    );

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: children,
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    const filePath = path.join(TARGET_DIR, fileName);
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ ${fileName} 생성 완료`);
}

function processMarkdown() {
    const mdPath = path.join(TARGET_DIR, INPUT_FILE);
    const content = fs.readFileSync(mdPath, "utf8");
    
    const sections = content.split(/^##\s+/gm);
    
    // Section 1: [신규 입주] 에코델타시티 대성베르힐
    // Section 2: [혼수] 예비 신혼부부 타겟
    // Section 3: [구독] 가전 구독 (MZ 타겟)
    
    sections.forEach(section => {
        if (section.includes("[신규 입주]")) {
            const title = "에코델타시티 대성베르힐 블로그 원고";
            const body = extractBlogBody(section);
            createDocx("01_에코델타시티_블로그_최종본.docx", title, body, "blog_eco_delta_kitchen.png");
        } else if (section.includes("[혼수]")) {
            const title = "신혼부부 혼수 가전 블로그 원고";
            const body = extractBlogBody(section);
            createDocx("02_혼수가전_블로그_최종본.docx", title, body, "blog_wedding_consulting.png");
        } else if (section.includes("[구독]")) {
            const title = "삼성 가전 구독 SNS 원고";
            const body = extractSNSBody(section);
            createDocx("03_가전구독_SNS_최종본.docx", title, body, "sns_subscription_mz.png");
        }
    });
}

function extractBlogBody(text) {
    return text.split("\n")
        .map(line => line.replace(/^###\s+/, "").replace(/---/g, "").replace(/\*\*(.*?)\*\*/g, "$1").trim())
        .filter(line => line.length > 0);
}

function extractSNSBody(text) {
    return text.split("\n")
        .map(line => line.replace(/^###\s+/, "").replace(/---/g, "").replace(/\*\*(.*?)\*\*/g, "$1").trim())
        .filter(line => line.length > 0);
}

processMarkdown();
