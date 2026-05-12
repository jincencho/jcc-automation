const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const TextValidator = require('./text_validator');

class ImageEngine {
    constructor() {
        this.outputDir = path.join(__dirname, '../generated_hooks');
        if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir);
        this.validator = new TextValidator();
    }

    async generateHookImage(target, customFileName = null) {
        console.log(`🚀 [ImageEngine] Generating and verifying hook image for: ${target.name}`);
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1200, height: 630 });

        const html = this._getHookTemplate(target);
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000); // Wait for fonts

        const fileName = customFileName || `hook_${target.id || 'temp'}.png`;
        const outputPath = path.join(this.outputDir, fileName);
        await page.screenshot({ path: outputPath });
        await browser.close();

        // Cross-check Korean text via OCR
        await this.validator.verifyImageText(outputPath, target.hook_message);

        return outputPath;
    }

    async generateJinjuImage(target, customFileName = null) {
        console.log(`🚀 [ImageEngine] Generating Jinju local image for: ${target.name}`);
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1200, height: 630 });

        const html = this._getJinjuTemplate(target);
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000); 

        const fileName = customFileName || `jinju_${target.id || 'temp'}.png`;
        const outputPath = path.join(this.outputDir, fileName);
        await page.screenshot({ path: outputPath });
        await browser.close();

        return outputPath;
    }

    async generateFoodImage(target, customFileName = null) {
        console.log(`🚀 [ImageEngine] Generating realistic food image for: ${target.name}`);
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.setViewportSize({ width: 1200, height: 630 });

        const html = this._getFoodTemplate(target);
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000); 

        const fileName = customFileName || `food_${target.id || 'temp'}.png`;
        const outputPath = path.join(this.outputDir, fileName);
        await page.screenshot({ path: outputPath });
        await browser.close();

        return outputPath;
    }

    async generateDailyBlogImages(target, targetDir) {
        const hookName = `01_appliance_hook_${target.id}.png`;
        const jinjuName = `02_jinju_local_${target.id}.png`;
        const foodName = `03_jinju_food_${target.id}.png`;
        
        const hookPath = path.join(targetDir, hookName);
        const jinjuPath = path.join(targetDir, jinjuName);
        const foodPath = path.join(targetDir, foodName);

        await this.generateHookImage(target, hookName);
        await this.generateJinjuImage(target, jinjuName);
        await this.generateFoodImage(target, foodName);

        // Move files to target directory
        fs.renameSync(path.join(this.outputDir, hookName), hookPath);
        fs.renameSync(path.join(this.outputDir, jinjuName), jinjuPath);
        fs.renameSync(path.join(this.outputDir, foodName), foodPath);

        return [hookPath, jinjuPath, foodPath];
    }

    async generateCarouselImages(target, slidesData) {
        console.log(`🚀 [ImageEngine] Generating and verifying ${slidesData.length} carousel slides for: ${target.name}`);
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 1080, height: 1080 },
            deviceScaleFactor: 1
        });
        
        const generatedFiles = [];
        for (let i = 0; i < slidesData.length; i++) {
            const page = await context.newPage();
            const html = this._getCarouselTemplate(target, slidesData[i]);
            
            await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(2000); // Wait for fonts

            const fileName = `carousel_${target.id || 'temp'}_${i + 1}.png`;
            const outputPath = path.join(this.outputDir, fileName);
            await page.screenshot({ path: outputPath });
            
            // Cross-check (for the first slide which usually has the main hook)
            if (i === 0) {
                await this.validator.verifyImageText(outputPath, slidesData[i].html.replace(/<[^>]*>/g, ''));
            }

            generatedFiles.push(outputPath);
            await page.close();
        }
        
        await browser.close();
        return generatedFiles;
    }

    _getHookTemplate(target) {
        const hookMessage = target.hook_message || "가전 졸업의 새로운 기준, 진센조";
        return `
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body { 
                        width: 1200px; height: 630px; margin: 0; 
                        background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
                        display: flex; flex-direction: column; justify-content: center; align-items: center;
                        color: white; font-family: 'Noto Sans KR', sans-serif; text-align: center;
                    }
                    .badge { 
                        background: #d4af37; color: black; padding: 10px 20px; 
                        font-weight: bold; border-radius: 50px; margin-bottom: 30px; font-size: 24px;
                    }
                    .hook-text { 
                        font-size: 58px; font-weight: 700; line-height: 1.4; 
                        max-width: 1000px; word-break: keep-all; 
                        text-shadow: 2px 2px 10px rgba(0,0,0,0.5);
                    }
                    .sub-text {
                        margin-top: 30px; font-size: 28px; opacity: 0.8;
                    }
                    .footer { margin-top: 50px; font-size: 20px; color: #d4af37; letter-spacing: 5px; }
                </style>
            </head>
            <body>
                <div class="badge">${target.region} ${target.name || ''}</div>
                <div class="hook-text">${hookMessage}</div>
                <div class="sub-text">19년 경력 전문가가 설계하는 프리미엄 통합 솔루션</div>
                <div class="footer">JCC JINCENCHO PREMIUM</div>
            </body>
            </html>
        `;
    }

    _getCarouselTemplate(target, slide) {
        // Target-specific background images (High-quality Unsplash)
        const bgImages = {
            'move_in': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1080',
            'moving': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1080',
            'wedding': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1080',
            'subscription': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1080'
        };
        const bgUrl = bgImages[target.id?.split('_')[0]] || bgImages['subscription'];

        return `
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
                <style>
                    body { 
                        width: 1080px; height: 1080px; margin: 0; 
                        background-color: #0A0E1A;
                        color: white; font-family: 'Noto Sans KR', sans-serif;
                        display: flex; flex-direction: column; justify-content: center; align-items: center;
                        position: relative; overflow: hidden;
                    }
                    .bg-image {
                        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                        background: url('${bgUrl}') no-repeat center center;
                        background-size: cover; filter: brightness(0.3) saturate(0.8);
                        z-index: 1;
                    }
                    .overlay {
                        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                        background: radial-gradient(circle at center, rgba(10, 14, 26, 0.4) 0%, rgba(10, 14, 26, 0.9) 100%);
                        z-index: 2;
                    }
                    .content-wrapper {
                        position: relative; z-index: 10; width: 880px; height: 880px;
                        display: flex; flex-direction: column; justify-content: center; align-items: center;
                        border: 1px solid rgba(212, 175, 55, 0.3);
                        padding: 60px; text-align: center;
                    }
                    .badge { 
                        color: #D4AF37; font-weight: 700; font-size: 28px; margin-bottom: 40px;
                        letter-spacing: 4px; text-transform: uppercase;
                        border-top: 1px solid #D4AF37; border-bottom: 1px solid #D4AF37;
                        padding: 10px 20px;
                    }
                    .main-content { 
                        font-size: 68px; font-weight: 700; line-height: 1.4; 
                        word-break: keep-all; text-shadow: 0 4px 15px rgba(0,0,0,0.5);
                    }
                    .highlight { 
                        background: linear-gradient(135deg, #D4AF37 0%, #F5E6AD 50%, #B8860B 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        font-weight: 900;
                    }
                    .footer { 
                        position: absolute; bottom: 60px; font-size: 22px; 
                        color: rgba(255,255,255,0.4); letter-spacing: 2px;
                        font-weight: 300;
                    }
                    .corner {
                        position: absolute; width: 40px; height: 40px; border-color: #D4AF37; border-style: solid;
                    }
                    .top-left { top: 40px; left: 40px; border-width: 2px 0 0 2px; }
                    .top-right { top: 40px; right: 40px; border-width: 2px 2px 0 0; }
                    .bottom-left { bottom: 40px; left: 40px; border-width: 0 0 2px 2px; }
                    .bottom-right { bottom: 40px; right: 40px; border-width: 0 2px 2px 0; }
                </style>
            </head>
            <body>
                <div class="bg-image"></div>
                <div class="overlay"></div>
                <div class="top-left class corner"></div><div class="top-right class corner"></div>
                <div class="bottom-left class corner"></div><div class="bottom-right class corner"></div>
                <div class="content-wrapper">
                    <div class="badge">${slide.badge}</div>
                    <div class="main-content">${slide.html}</div>
                    <div class="footer">JCC JINCENCHO PREMIUM DESIGN</div>
                </div>
            </body>
            </html>
        `;
    }

    _getJinjuTemplate(target) {
        // High-end imagery for Jinju (Castle / Premium Food)
        const jinjuImages = [
            'https://images.unsplash.com/photo-1590424753062-3251f1c803bc?auto=format&fit=crop&q=80&w=1200', // Traditional Architecture
            'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=1200'  // Premium Gourmet Style
        ];
        const bgUrl = jinjuImages[Math.floor(Math.random() * jinjuImages.length)];

        return `
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700&family=Nanum+Myeongjo:wght@700&display=swap" rel="stylesheet">
                <style>
                    body { 
                        width: 1200px; height: 630px; margin: 0; 
                        background: url('${bgUrl}') no-repeat center center;
                        background-size: cover;
                        display: flex; justify-content: center; align-items: center;
                        color: white; font-family: 'Noto Sans KR', sans-serif;
                        overflow: hidden;
                    }
                    .overlay {
                        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                        background: radial-gradient(circle at center, rgba(10, 14, 26, 0.4) 0%, rgba(10, 14, 26, 0.8) 100%);
                    }
                    .glass-card {
                        position: relative; z-index: 10;
                        width: 900px; padding: 60px;
                        background: rgba(10, 14, 26, 0.6);
                        backdrop-filter: blur(15px);
                        border: 1px solid rgba(212, 175, 55, 0.3);
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                        text-align: center;
                    }
                    .jinju-badge { 
                        font-family: 'Nanum Myeongjo', serif; font-size: 28px; color: #D4AF37; margin-bottom: 25px;
                        letter-spacing: 6px; font-weight: 700;
                    }
                    .main-text { 
                        font-size: 56px; font-weight: 700; line-height: 1.4; 
                        word-break: keep-all; 
                        background: linear-gradient(135deg, #FFFFFF 0%, #E5E7EB 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                    .gold-line {
                        width: 100px; height: 2px; background: #D4AF37; margin: 30px auto;
                    }
                    .footer { font-size: 20px; color: rgba(255,255,255,0.5); letter-spacing: 2px; }
                </style>
            </head>
            <body>
                <div class="overlay"></div>
                <div class="glass-card">
                    <div class="jinju-badge">JINJU HEALING TOUR</div>
                    <div class="main-text">가전 졸업하고 즐기는<br/>진주성 촉석루와 시원한 진주냉면 한 그릇</div>
                    <div class="gold-line"></div>
                    <div class="footer">JCC JINCENCHO PREMIUM EXPERIENCE</div>
                </div>
            </body>
            </html>
        `;
    }

    _getFoodTemplate(target) {
        // High-end Korean food photography (Authentic Naengmyeon/Yukjeon style)
        const foodImages = [
            'https://images.unsplash.com/photo-1598511726623-d3062f682662?auto=format&fit=crop&q=80&w=1200', // Meat/Korean style
            'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=1200'  // Clean Gourmet style
        ];
        const bgUrl = foodImages[0]; 

        return `
            <html>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700&family=Nanum+Myeongjo:wght@700&display=swap" rel="stylesheet">
                <style>
                    body { 
                        width: 1200px; height: 630px; margin: 0; 
                        background: url('${bgUrl}') no-repeat center center;
                        background-size: cover;
                        display: flex; justify-content: flex-end; align-items: center;
                        color: white; font-family: 'Noto Sans KR', sans-serif;
                        overflow: hidden; padding-right: 80px;
                    }
                    .overlay {
                        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                        background: linear-gradient(to left, rgba(10, 14, 26, 0.95) 0%, rgba(10, 14, 26, 0.4) 100%);
                    }
                    .food-card {
                        position: relative; z-index: 10;
                        width: 550px; text-align: right;
                        background: rgba(10, 14, 26, 0.5);
                        backdrop-filter: blur(10px);
                        padding: 40px;
                        border-right: 5px solid #D4AF37;
                    }
                    .badge { 
                        font-family: 'Nanum Myeongjo', serif; font-size: 26px; color: #D4AF37; margin-bottom: 20px;
                        letter-spacing: 4px; border-bottom: 1px solid rgba(212, 175, 55, 0.3);
                        display: inline-block; padding-bottom: 10px;
                    }
                    .food-name { 
                        font-size: 60px; font-weight: 700; line-height: 1.2; 
                        margin-bottom: 30px; color: #FFFFFF;
                        text-shadow: 0 4px 10px rgba(0,0,0,0.5);
                    }
                    .description {
                        font-size: 26px; color: rgba(255,255,255,0.9); line-height: 1.6;
                        word-break: keep-all;
                    }
                </style>
            </head>
            <body>
                <div class="overlay"></div>
                <div class="food-card">
                    <div class="badge">JINJU GOURMET TOUR</div>
                    <div class="food-name">전통의 깊이,<br/>진주냉면과 육전</div>
                    <div class="description">19년 마스터가 자신 있게 추천하는<br/>진주에서의 정갈한 한 끼</div>
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = ImageEngine;
