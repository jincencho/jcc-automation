const { chromium } = require('playwright');
const path = require('path');
const { execSync } = require('child_process');

(async () => {
    const userDataDir = path.resolve(__dirname, '../playwright_data');
    console.log('🚀 [Jincencho System] 궁극의 "복사/붙여넣기(Ctrl+V)" 업로드를 시작합니다...');

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: { width: 1280, height: 900 }
    });

    const page = context.pages()[0] || await context.newPage();

    try {
        await page.goto('https://www.instagram.com/');
        console.log('📸 인스타그램 접속 중...');

        // '만들기' 버튼 클릭
        const createBtn = page.locator('span:has-text("만들기"), span:has-text("Create"), svg[aria-label*="만들기"]').first();
        await createBtn.waitFor({ state: 'visible', timeout: 30000 });
        await createBtn.click();
        console.log('✅ 만들기 버튼 클릭 성공');

        // '게시물' 옵션 클릭 (나타날 경우)
        try {
            const postBtn = page.locator('span:has-text("게시물"), span:has-text("Post")').first();
            await postBtn.waitFor({ state: 'visible', timeout: 5000 });
            await postBtn.click();
            console.log('✅ 게시물 옵션 클릭 성공');
        } catch (e) {
            console.log('ℹ️ 게시물 옵션 생략 (이미 업로드 창일 수 있음)');
        }

        await page.waitForTimeout(3000);
        console.log('⏳ 업로드 창 로딩 대기...');

        // 파워쉘을 이용해 파일 5장을 윈도우 클립보드에 '복사'
        console.log('📋 시스템 클립보드에 이미지 5장 복사 중...');
        const image1 = path.resolve(__dirname, '../generated_hooks/carousel_gimhae_thesharp_greenity_1.png');
        const image2 = path.resolve(__dirname, '../generated_hooks/carousel_gimhae_thesharp_greenity_2.png');
        const image3 = path.resolve(__dirname, '../generated_hooks/carousel_gimhae_thesharp_greenity_3.png');
        const image4 = path.resolve(__dirname, '../generated_hooks/carousel_gimhae_thesharp_greenity_4.png');
        const image5 = path.resolve(__dirname, '../generated_hooks/carousel_gimhae_thesharp_greenity_5.png');

        const psCommand = `
            Add-Type -AssemblyName System.Windows.Forms;
            $files = New-Object System.Collections.Specialized.StringCollection;
            $files.Add('${image1}');
            $files.Add('${image2}');
            $files.Add('${image3}');
            $files.Add('${image4}');
            $files.Add('${image5}');
            [System.Windows.Forms.Clipboard]::SetFileDropList($files);
        `;

        execSync(`powershell -Command "${psCommand.replace(/\n/g, '')}"`);
        console.log('✅ 클립보드 복사 완료!');

        await page.waitForTimeout(1000);

        // 업로드 창에 포커스를 맞추고 Ctrl+V (붙여넣기) 시뮬레이션
        console.log('🎯 화면에 붙여넣기(Ctrl+V) 시전!');
        // 다이얼로그나 본문 영역 포커스
        const dialog = page.locator('div[role="dialog"]').first();
        if (await dialog.isVisible()) {
            await dialog.focus();
        } else {
            await page.focus('body');
        }

        await page.keyboard.press('Control+V');
        console.log('✨ 이미지 5장 붙여넣기 성공!');

        await page.waitForTimeout(3000);

        // '다음' 버튼 (필터 전)
        await page.locator('button:has-text("다음"), button:has-text("Next")').first().click();
        console.log('➡️ 다음 단계로 이동 (필터)');

        await page.waitForTimeout(2000);

        // '다음' 버튼 (필터 후)
        await page.locator('button:has-text("다음"), button:has-text("Next")').first().click();
        console.log('➡️ 다음 단계로 이동 (캡션)');

        // 캡션 입력
        const caption = `✨ 가전 잘 사고 잘 쓰는 법 \n\n경남 김해 더샵 신문그리니티 입주민 주목! \n\n왜 다들 '진센조'에서 가전졸업 할까요? 💎\n\n#비스포크AI #진센조 #인스타감성 #0원라이프 #김해입주 #신문그리니티 #더샵신문그리니티 #가전졸업 #진주통합매장`;
        await page.fill('div[role="textbox"]', caption);
        console.log('📝 캡션 입력 완료');

        await page.waitForTimeout(2000);

        // '공유하기' 버튼
        await page.locator('button:has-text("공유하기"), button:has-text("Share")').first().click();
        console.log('🚀 [성공] 최종 공유하기 버튼을 눌렀습니다!');

        // 완료 대기
        await page.waitForTimeout(10000);
        console.log('✅ 김해 더샵 인스타그램 업로드 완료!');

    } catch (error) {
        console.error('🔥 업로드 중 에러 발생:', error);
    } finally {
        console.log('작업이 완료되었습니다. 5초 후 브라우저를 닫습니다.');
        await page.waitForTimeout(5000);
        await context.close();
    }
})();
