const fs = require('fs');
const path = require('path');

async function fetchGoogleTrends(query) {
    try {
        const url = `http://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data[1] && Array.isArray(data[1])) {
            // Filter out '디시', '클리앙' and other community names for cleaner marketing keywords
            const filtered = data[1].filter(k => !k.includes('디시') && !k.includes('뽐뿌') && !k.includes('클리앙'));
            return filtered;
        }
        return [];
    } catch (e) {
        console.error(`[TrendUpdater] Failed to fetch for query: ${query}`, e.message);
        return [];
    }
}

async function updateTrends() {
    console.log("🔍 [TrendUpdater] Starting live search trends collection...");
    
    // Offline / Sandboxed mode check: use cached keywords if available
    {
        const strategyPath = path.join(__dirname, '../data/marketing_strategy.json');
        const strategy = JSON.parse(fs.readFileSync(strategyPath, 'utf8'));
        if (strategy.live_search_keywords && Object.keys(strategy.live_search_keywords).length > 0) {
            console.log("ℹ️ [TrendUpdater] Offline mode: Using cached live keywords in marketing_strategy.json");
            return;
        }
    }

    const config = {
        'wedding': ['신혼가전 졸업', '혼수가전 견적', '신혼가전 혜택'],
        'wedding_communities': ['다이렉트결혼준비', '메이크마이웨딩', '밀리마니아', '레몬테라스'],
        'samsung_ai': ['삼성 비스포크 AI', '삼성 AI 세탁건조기', '삼성 AI 콤보', 'AI 가전은 삼성'],
        'move_in': ['입주가전', '아파트 사전점검', '입주청소 비용', '줄눈시공'],
        'subscription': ['가전구독 서비스', '삼성 가전 구독'],
        'brand': ['삼성스토어', '삼성 비대면 상담'],
        'mz': ['최신 유행어', '신조어']
    };

    const liveKeywords = {};

    for (const [key, searchSeeds] of Object.entries(config)) {
        let categoryKeywords = [];
        for (const seed of searchSeeds) {
            console.log(`fetching trends for: ${seed}...`);
            const keywords = await fetchGoogleTrends(seed);
            categoryKeywords = categoryKeywords.concat(keywords);
        }
        // Remove duplicates and keep top 15
        liveKeywords[key] = [...new Set(categoryKeywords)].slice(0, 20);
    }

    // Save to marketing_strategy.json
    const strategyPath = path.join(__dirname, '../data/marketing_strategy.json');
    const strategy = JSON.parse(fs.readFileSync(strategyPath, 'utf8'));
    
    strategy.live_search_keywords = liveKeywords;
    
    fs.writeFileSync(strategyPath, JSON.stringify(strategy, null, 4));
    console.log("✅ [TrendUpdater] Successfully updated live search keywords in marketing_strategy.json");
}

if (require.main === module) {
    updateTrends();
}

module.exports = updateTrends;
