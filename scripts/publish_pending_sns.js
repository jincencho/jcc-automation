const SNSPublisher = require('../publishers/sns_publisher');
const ContentGenerator = require('../engine/content_generator');
const fs = require('fs');
const path = require('path');

async function publishPendingSNS() {
    const snsPublisher = new SNSPublisher();
    const contentGenerator = new ContentGenerator();
    
    const targetsPath = path.join(__dirname, '../data/viral_targets.json');
    const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));

    const pendingTargets = targets.filter(t => t.id === 'gimhae_thesharp_greenity' || t.id === 'busan_ecodelta_daeseong');

    for (const target of pendingTargets) {
        console.log(`🚀 [Orchestrator] Starting SNS upload for: ${target.name}`);
        
        const targetType = target.id === 'gimhae_thesharp_greenity' ? 'wedding' : 'move_in';
        const contents = await contentGenerator.generateMultiChannelContent(targetType, target.region, target.name);
        const caption = contents.instagram.caption;

        const images = [];
        for (let i = 1; i <= 5; i++) {
            const imgPath = path.resolve(__dirname, `../generated_hooks/carousel_${target.id}_${i}.png`);
            if (fs.existsSync(imgPath)) images.push(imgPath);
        }

        if (images.length > 0) {
            console.log(`📸 Found ${images.length} images. Uploading to Instagram...`);
            const success = await snsPublisher.publishToInstagram(target, caption, images);
            
            if (success) {
                console.log(`✅ Success: ${target.name} is now live on Instagram.`);
            } else {
                console.error(`❌ Failed: ${target.name} upload aborted.`);
            }
        } else {
            console.warn(`⚠️ Skipping ${target.name}: No images found in generated_hooks/`);
        }

        console.log("⏳ Waiting 30 seconds before next upload...");
        await new Promise(r => setTimeout(r, 30000));
    }
}

publishPendingSNS().catch(console.error);
