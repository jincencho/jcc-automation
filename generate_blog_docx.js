const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require("docx");
const fs = require("fs");
const path = require("path");

/**
 * .docx 파일 생성 함수
 */
async function createBlogDocx(fileName, title, bodyParagraphs) {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        text: title,
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),
                    ...bodyParagraphs.map(text => 
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: text,
                                    size: 24, // 12pt
                                }),
                            ],
                            spacing: { before: 200, after: 200, line: 360 },
                        })
                    ),
                    new Paragraph({
                        text: "\n--- [JCC 진센조 | 19년 경력 가전 전문가 조준석] ---",
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 400 },
                    }),
                ],
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    const dir = path.join(__dirname, "blog_drafts");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ 파일 생성 완료: ${filePath}`);
}

/**
 * 마크다운 파일을 파싱하여 제목과 본문을 추출하는 함수
 */
function parseMarkdown(mdPath) {
    const content = fs.readFileSync(mdPath, "utf8");
    const lines = content.split("\n").filter(line => line.trim() !== "");
    
    // 첫 번째 줄(#으로 시작)을 제목으로 사용
    let title = "Naver Blog Draft";
    let body = [];
    
    if (lines[0].startsWith("# ")) {
        title = lines[0].replace("# ", "").trim();
        body = lines.slice(1);
    } else {
        body = lines;
    }
    
    // 마크다운 문법(##, ---, *, **) 제거
    const cleanBody = body.map(line => 
        line.replace(/^##\s+/, "")
            .replace(/^---\s+/, "")
            .replace(/^\*\s+/, "")
            .replace(/^\d+\.\s+/, "")
            .replace(/\*\*/g, "")
            .trim()
    ).filter(line => line.length > 0);
    
    return { title, body: cleanBody };
}

const run = async () => {
    const args = process.argv.slice(2);
    const inputMd = args[0];
    
    if (inputMd) {
        const mdPath = path.resolve(__dirname, "blog_drafts", inputMd);
        if (fs.existsSync(mdPath)) {
            console.log(`📖 ${inputMd} 파일을 읽어 워드로 변환합니다...`);
            const { title, body } = parseMarkdown(mdPath);
            const fileName = inputMd.replace(".md", ".docx");
            await createBlogDocx(fileName, title, body);
            return;
        }
    }
    
    console.error("❌ 입력 파일을 찾을 수 없습니다. 예: node generate_blog_docx.js Saturday_Special_Draft.md");
};

run().catch(console.error);
