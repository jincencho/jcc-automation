const fs = require('fs');
const path = require('path');

const TARGETS_FILE = path.join(__dirname, '../data/viral_targets.json');
const TEMPLATE_FILE = path.join(__dirname, '../viral_hook_design.html');
const OUTPUT_DIR = path.join(__dirname, '../generated_hooks');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

function generateHook(tId) {
    const targets = JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
    const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

    let target;
    if (tId) {
        target = targets.find(t => t.id === Number(tId));
    } else {
        const today = new Date().toISOString().split('T')[0];
        target = targets.find(t => t.scheduled_date === today && t.status !== 'completed');
        if (!target) target = targets.find(t => t.status === 'active');
    }
    
    if (!target) {
        console.error('Target not found');
        return;
    }

    console.log(`🚀 Generating hook for: ${target.name} (${target.region})`);

    let updatedHtml = template.replace(
        /<div class="tag">.*?<\/div>/,
        `<div class="tag">${target.region} ${target.name} 필독</div>`
    ).replace(
        /<h1>.*?<\/h1>/,
        `<h1>왜 ${target.name} 입주민들은<br>삼성 가전을 <span class="highlight">'0원'</span>에 가져갈까요?</h1>`
    );

    const outputPath = path.join(OUTPUT_DIR, `hook_${target.id}.html`);
    fs.writeFileSync(outputPath, updatedHtml);
    console.log(`✅ Generated: ${outputPath}`);
    return target;
}

const argId = process.argv[2];
generateHook(argId);
