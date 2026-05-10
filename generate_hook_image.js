const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    // 인스타그램 1:1 비율
    const context = await browser.newContext({
        viewport: { width: 1080, height: 1080 },
        deviceScaleFactor: 1
    });
    const page = await context.newPage();

    // The background image path from the previous generation
    const bgImagePath = 'file:///C:/Users/user/.gemini/antigravity/brain/e91dc0a2-961d-4ea5-b8d4-3a061f816da7/sample_carousel_1_1778228526481.png';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet">
        <style>
            body {
                margin: 0;
                padding: 0;
                width: 1080px;
                height: 1080px;
                background-image: url('${bgImagePath}');
                background-size: cover;
                background-position: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                font-family: 'Pretendard', sans-serif;
            }
            .overlay {
                background: linear-gradient(to bottom, rgba(10, 25, 47, 0.4) 0%, rgba(10, 25, 47, 0.95) 100%); /* Deep Navy Gradient */
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
            }
            .content {
                position: relative;
                z-index: 2;
                text-align: center;
                padding: 0 80px;
            }
            h1 {
                font-size: 85px;
                font-weight: 800;
                color: #ffffff;
                line-height: 1.4;
                margin-bottom: 30px;
                word-break: keep-all;
                text-shadow: 0 10px 30px rgba(0,0,0,0.9);
                letter-spacing: -2px;
            }
            .highlight {
                color: #D4AF37; /* Luxury Gold */
                font-weight: 900;
            }
            p {
                font-size: 40px;
                font-weight: 500;
                color: #f0f0f0;
                margin-top: 0;
                text-shadow: 0 5px 15px rgba(0,0,0,0.8);
            }
            .badge {
                display: inline-block;
                background-color: #000000;
                color: #ffffff;
                font-size: 35px;
                font-weight: 700;
                padding: 15px 40px;
                border-radius: 50px;
                margin-bottom: 50px;
                border: 2px solid rgba(255,255,255,0.2);
            }
        </style>
    </head>
    <body>
        <div class="overlay"></div>
        <div class="content">
            <div class="badge">진주 통합매장 가이드</div>
            <h1>"가전 보러 부산에서<br><span class="highlight">1시간 반 걸려 진주</span>까지<br>온다고요..?" 🚗</h1>
            <p>네, 부산 예비부부 10쌍 중 7쌍의 진짜 이유</p>
        </div>
        <script>
            // Wait for fonts to be ready
            document.fonts.ready.then(() => {
                const div = document.createElement('div');
                div.id = 'ready';
                document.body.appendChild(div);
            });
        </script>
    </body>
    </html>
    `;

    await page.setContent(htmlContent);
    
    // Wait for the font to load
    await page.waitForSelector('#ready', { state: 'attached' });
    // Additional wait to ensure background image is fully loaded
    await page.waitForTimeout(1000);

    const outputPath = path.resolve(__dirname, 'hook_sample_final.png');
    await page.screenshot({ path: outputPath });
    console.log('Successfully created hook_sample_final.png at', outputPath);
    
    await browser.close();
})();
