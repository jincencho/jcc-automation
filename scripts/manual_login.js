const { chromium } = require('playwright');
const path = require('path');

async function manualLogin() {
    const userDataDir = path.resolve(__dirname, '../playwright_data');
    console.log(`🚀 Opening browser with session storage: ${userDataDir}`);
    
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: { width: 1200, height: 900 },
        args: ['--start-maximized']
    });

    const page = await context.newPage();
    
    // Open Instagram
    console.log('👉 Navigating to Instagram...');
    await page.goto('https://www.instagram.com/accounts/login/');
    
    // Open Naver in a new tab
    const page2 = await context.newPage();
    console.log('👉 Navigating to Naver...');
    await page2.goto('https://nid.naver.com/nidlogin.login');

    console.log('✅ Browser opened. Please LOGIN to both sites.');
    console.log('⚠️ IMPORTANT: Close the browser window manually when you are finished logging in.');

    // Wait for the browser to be closed manually
    await new Promise((resolve) => {
        context.on('close', resolve);
    });
    
    console.log('🔒 Browser closed. Session saved.');
}

manualLogin().catch(console.error);
