const TargetManager = require('./engine/target_manager');
const ContentGenerator = require('./engine/content_generator');
const ImageEngine = require('./engine/image_engine');
const NaverPublisher = require('./publishers/naver_publisher');
const path = require('path');

/**
 * JCC 진센조 바이럴 자동화 마스터 엔진 (Refactored)
 */
async function runAutoViral() {
    console.log('🚀 [Jincencho System] 통합 자동화 프로세스를 시작합니다...');

    const targetManager = new TargetManager();
    const contentGenerator = new ContentGenerator();
    const imageEngine = new ImageEngine();
    const naverPublisher = new NaverPublisher();

    try {
        // 1. 오늘 날짜의 타겟 및 전략 선택
        const target = targetManager.getNextTarget();
        if (!target) {
            console.log('✅ 오늘 진행할 스케줄이 없거나 모든 타겟이 완료되었습니다.');
            return;
        }

        console.log(`🎯 선택된 타겟: ${target.name} (전략: ${target.strategyKey})`);

        // 2. 통합 원고 생성
        const manuscript = await contentGenerator.generateManuscript(
            target.strategyKey, 
            target.region, 
            target.name
        );

        // 3. 맞춤형 이미지 생성
        const hookImagePath = path.join(__dirname, `./generated_hooks/hook_${target.id}.png`);
        await imageEngine.generateHookImage(target, hookImagePath);
        console.log(`📸 이미지 생성 완료: ${hookImagePath}`);

        // 4. 네이버 블로그 발행 (이미지 포함)
        // Note: NaverPublisher.publish might need an images argument, 
        // but for now we follow the existing signature or update it.
        // Let's check NaverPublisher.publish again.
        
        const result = await naverPublisher.publish(
            manuscript.title, 
            manuscript.body, 
            manuscript.hashtags,
            [hookImagePath] // Pass the generated image
        );

        if (result.success) {
            console.log(`✨ 발행 성공! URL: ${result.url}`);
            targetManager.markCompleted(target.id);
        } else {
            console.error(`❌ 발행 실패: ${result.error}`);
        }

    } catch (error) {
        console.error('🔥 시스템 치명적 에러:', error);
    }
}

// 직접 실행 시
if (require.main === module) {
    runAutoViral();
}

module.exports = { runAutoViral };
