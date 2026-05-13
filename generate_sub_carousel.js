const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    
    // The clean deep navy/gold abstract background
    const bgImagePath = 'file:///C:/Users/user/.gemini/antigravity/brain/e91dc0a2-961d-4ea5-b8d4-3a061f816da7/sub_carousel_1_1778229238030.png';

    const slidesData = [
        {
            badge: 'AI 구독 컨설팅',
            html: '로봇청소기 딱 한 대,<br>그냥 온라인으로 <span class="highlight">대충 구독</span>하하셨습니까?'
        },
        {
            badge: 'Problem',
            html: '우리 집 환경에 <span class="highlight">맞는 요금제</span>인지,<br>숨겨진 제휴 혜택은 없는지<br>누가 확인해 줍니까?'
        },
        {
            badge: 'Solution',
            html: '이리저리 비교하며<br><span class="highlight">시간 낭비</span>하지 마십시오.<br>19년 경력으로 완벽히 설계해 드립니다.'
        },
        {
            badge: 'VIP Care',
            html: '복잡한 스마트싱스 생태계 세팅부터<br><span class="highlight">VIP 사전 케어</span>까지<br>완벽하게 방어해 드립니다.'
        },
        {
            badge: 'Contact',
            html: '정답을 알려드릴 테니<br><span class="highlight">결정</span>만 하십시오.<br><br><span style="font-size:35px; font-weight:500; color:#cccccc;">📍 상담 신청은 프로필 링크를 클릭하세요</span>'
        }
    ];

    for (let i = 0; i < slidesData.length; i++) {
        const context = await browser.newContext({
            viewport: { width: 1080, height: 1080 },
            deviceScaleFactor: 1
        });
        const page = await context.newPage();

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
                    background: linear-gradient(to bottom, rgba(10, 25, 47, 0.5) 0%, rgba(10, 25, 47, 0.95) 100%);
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
                    font-size: 80px;
                    font-weight: 800;
                    color: #ffffff;
                    line-height: 1.5;
                    margin-bottom: 30px;
                    word-break: keep-all;
                    text-shadow: 0 10px 30px rgba(0,0,0,0.9);
                    letter-spacing: -2px;
                }
                .highlight {
                    color: #D4AF37; /* Luxury Gold */
                    font-weight: 900;
                }
                .badge {
                    display: inline-block;
                    background-color: transparent;
                    color: #D4AF37;
                    font-size: 35px;
                    font-weight: 700;
                    padding: 15px 40px;
                    border-radius: 50px;
                    margin-bottom: 50px;
                    border: 2px solid rgba(212, 175, 55, 0.5); /* Gold border */
                }
                .slide-number {
                    position: absolute;
                    bottom: 50px;
                    color: rgba(255, 255, 255, 0.3);
                    font-size: 30px;
                    font-weight: 600;
                    z-index: 2;
                    letter-spacing: 5px;
                }
            </style>
        </head>
        <body>
            <div class="overlay"></div>
            <div class="content">
                <div class="badge">${slidesData[i].badge}</div>
                <h1>${slidesData[i].html}</h1>
            </div>
            <div class="slide-number">${i + 1} / 5</div>
            <script>
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
        await page.waitForSelector('#ready', { state: 'attached' });
        await page.waitForTimeout(1000);

        const fileName = 'sub_carousel_final_' + (i + 1) + '.png';
        const outputPath = path.resolve(__dirname, fileName);
        await page.screenshot({ path: outputPath });
        console.log('Successfully created ' + fileName);
        
        await context.close();
    }
    await browser.close();
})();
