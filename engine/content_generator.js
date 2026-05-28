const fs = require('fs');
const path = require('path');

class ContentGenerator {
    constructor() {
        this.strategy = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/marketing_strategy.json'), 'utf8'));
        this.templates = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/content_templates.json'), 'utf8'));
    }

    async generateMultiChannelContent(targetType, region, apartmentName = "") {
        const segments = this.strategy.target_segments;
        const target = segments[targetType] || segments['move_in'];
        const tips = this.strategy.expert_tips;
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        
        const isSubscription = targetType === 'subscription';
        const displayRegion = isSubscription ? "전국 어디서나" : region;
        const displayApartment = isSubscription ? "" : apartmentName;

        console.log(`[ContentEngine] Generating tailored content for target: ${target.name} in ${displayRegion}...`);

        const results = {};
        
        // Naver Blog Title Hooking Logic
        let blogTitle = isSubscription 
            ? `${target.name}, 이제 전국 어디서나 비대면으로 스마트하게 가전 졸업하세요`
            : `${displayRegion} ${displayApartment || ''} ${target.name}의 해답은 결국 '진실'에 있습니다`;
        
        if (!isSubscription && target.blog_hooks) {
            const randomHook = target.blog_hooks[Math.floor(Math.random() * target.blog_hooks.length)];
            blogTitle = randomHook
                .replace(/{region}/g, displayRegion)
                .replace(/{apartment}/g, displayApartment || target.name);
        }

        const contentTitle = blogTitle;
        
        // [NAVER BLOG] - 상세 스토리텔링 & 신뢰도 중심
        if (isSubscription) {
            results.naver_blog = null;
        } else {
            results.naver_blog = {
                title: `[NAVER BLOG] ${contentTitle}`,
                body: this.buildTargetedDiary(targetType, target, displayRegion, displayApartment, randomTip) + 
                      `\n\n---\n\n✨ **가전 졸업 성지, 진센조 더 알아보기**\n🔗 [진센조 전용 홈페이지 바로가기](${this.strategy.homepage_url || 'https://jcc-band.vercel.app/'})`,
                hashtags: (() => {
                    // 1. 브랜드 태그 (정확히 1개만 사용, 절대 규칙 고정)
                    const brandTag = '진센조';

                    // 2. 타겟과 지역에 맞는 인기 커뮤니티 풀 (20% => 2개 추출)
                    const broadRegion = region.split(' ')[0]; // '울산 남구' -> '울산'
                    let communityPool = [];

                    if (targetType === 'move_in') {
                        // 입주타겟: 부동산 인기카페와 지역인기 커뮤니티
                        communityPool = [
                            ...(this.strategy.regional_cafes[broadRegion] || this.strategy.regional_cafes[region] || []),
                            '부동산스터디', '아름다운내집갖기', '텐인텐', '레몬테라스', 
                            `${broadRegion}부동산카페`, `${region}부동산`, 
                            '부산맘', '부경맘', '울산맘', '경남맘', '진주맘', '창원맘', '김해맘'
                        ];
                    } else if (targetType === 'wedding') {
                        // 혼수타겟: 혼수준비 인기카페 커뮤니티명
                        communityPool = [
                            '다이렉트결혼준비', '메이크마이웨딩', '맥마웨', '레몬테라스', 
                            '신부공방', '웨딩공부', '은결준', '결준모'
                        ];
                    } else {
                        // 구독타겟 등: 기본 지역 맘카페 및 실속 소비 커뮤니티
                        communityPool = [
                            '부산맘', '부경맘', '울산맘', '경남맘', '진주맘', '창원맘', 
                            '자취생으로살아남기', '레몬테라스'
                        ];
                    }

                    communityPool = communityPool
                        .map(k => k.replace(/ /g, ''))
                        .filter(k => k !== brandTag);

                    const selectedCommunity = [...new Set(communityPool)]
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 2);

                    // 3. 맛집과 명소 풀 (20% => 2개 추출)
                    const foodAndPlaces = [
                        '하연옥', '제일식당', '살롱드인사', '진주맛집', '진주냉면', '육회비빔밥',
                        '진주성', '촉석루', '진양호', '은안재', '김시민호', '소망진산', '유등공원', '진주가볼만한곳'
                    ].map(k => k.replace(/ /g, '')).filter(k => k !== brandTag);
                    const selectedFoodPlaces = [...new Set(foodAndPlaces)]
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 2);

                    // 4. 타겟에 맞는 인기 검색어 풀 (40% => 4개 추출)
                    let searchKeywordsPool = [];
                    const targetHashtags = target.hashtags || [];
                    if (targetType === 'move_in') {
                        const liveMoves = this.strategy.live_search_keywords.move_in || [];
                        searchKeywordsPool = [
                            ...liveMoves,
                            ...(displayApartment ? [displayApartment, `${displayApartment}입주`] : []),
                            '입주가전', '입주가전리스트', '입주전체크리스트', '신축아파트입주'
                        ];
                    } else if (targetType === 'wedding') {
                        const liveWeddings = this.strategy.live_search_keywords.wedding || [];
                        searchKeywordsPool = [
                            ...liveWeddings,
                            '혼수가전', '신혼가전', '결혼준비', '가전졸업', '웨딩가전'
                        ];
                    } else {
                        const liveSubs = this.strategy.live_search_keywords.subscription || [];
                        searchKeywordsPool = [
                            ...liveSubs,
                            '가전구독', '삼성AI구독클럽', '비대면상담', '0원라이프', '가전구독서비스'
                        ];
                    }
                    searchKeywordsPool = [...searchKeywordsPool, ...targetHashtags]
                        .map(k => k.replace(/ /g, ''))
                        .filter(k => k !== brandTag);
                    
                    const selectedSearchKeywords = [...new Set(searchKeywordsPool)]
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 4);

                    // 5. 삼성전자 인기가전 풀 (20% => 2개 추출)
                    const samsungAppliancePool = [
                        '삼성스토어', '삼성스토어갤러리아진주', '삼성AI가전', '삼성가전', 
                        '가전성지', '가전졸업', '삼성전자'
                    ].map(k => k.replace(/ /g, '')).filter(k => k !== brandTag);
                    const selectedSamsungAppliance = [...new Set(samsungAppliancePool)]
                        .sort(() => 0.5 - Math.random())
                        .slice(0, 2);

                    // 각 카테고리 태그 결합 (진센조 제외 및 중복 차단)
                    const otherTags = [
                        ...selectedCommunity,
                        ...selectedFoodPlaces,
                        ...selectedSearchKeywords,
                        ...selectedSamsungAppliance
                    ].filter(t => t !== brandTag);

                    // 인기 커뮤니티(20%), 맛집/명소(20%), 인기검색어(40%), 삼성인기가전(20%)을 무작위 셔플링
                    const shuffledOthers = [...new Set(otherTags)].sort(() => 0.5 - Math.random());

                    // 최종 태그 리스트: 진센조는 맨 처음에 무조건 '1개만' 고정 배치
                    const finalTags = [brandTag, ...shuffledOthers];

                    let result = "";
                    for (const tag of finalTags) {
                        const nextTag = `#${tag} `;
                        // 네이버 블로그 해시태그 규정: 절대 규칙 100자 이내 (공백 포함 총 길이 기준)
                        if ((result + nextTag).trim().length <= 100) {
                            result += nextTag;
                        } else {
                            break;
                        }
                    }
                    return result.trim();
                })()
            };
        }

        // [INSTAGRAM] & [FACEBOOK] - 타겟별 동적 생성
        const cleanRegion = displayRegion || "전국";
        const cleanApartment = displayApartment || "신규아파트";

        const instaTemplates = this.templates.instagram_templates[targetType] || this.templates.instagram_templates['move_in'];
        const fbTemplates = this.templates.facebook_templates[targetType] || this.templates.facebook_templates['move_in'];

        const randomInsta = instaTemplates[Math.floor(Math.random() * instaTemplates.length)];
        const randomFb = fbTemplates[Math.floor(Math.random() * fbTemplates.length)];

        const formatSnsTemplate = (text) => {
            if (!text) return "";
            return text
                .replace(/{region}/g, cleanRegion)
                .replace(/{apartmentName}/g, cleanApartment)
                .replace(/{expertTip}/g, randomTip.tip)
                .replace(/{brand}/g, "진센조");
        };

        let instaCaption = formatSnsTemplate(randomInsta.caption);
        let fbText = formatSnsTemplate(randomFb.caption);

        // Generate dynamic hashtags
        const snsHashtags = this.generateSnsHashtags(targetType, region, apartmentName);

        // Append hashtags
        instaCaption += `\n\n${snsHashtags}`;
        fbText += `\n\n${snsHashtags}`;

        let instaHook = formatSnsTemplate(randomInsta.hook);
        let instaHints = randomInsta.hints.map(hint => formatSnsTemplate(hint));

        results.instagram = {
            caption: instaCaption,
            image_hook: instaHook,
            carousel_hints: instaHints
        };

        results.facebook = {
            text: fbText
        };

        // [THREADS] - 솔직하고 담백한 전문가 인사이트 (MZ 트렌드 반영)
        const trends = this.strategy.threads_trends || [
            { keyword: "갓생", template: "바쁜 직장인들, 가전은 알아서 케어받고 갓생 사세요! {main_msg}" },
            { keyword: "럭키비키", template: "초기비용 0원이라니 완전 럭키비키잖아🍀 {main_msg}" },
            { keyword: "폼미쳤다", template: "이번 진센조 구독 혜택 진짜 폼미쳤다 ㄷㄷ {main_msg}" }
        ];

        if (isSubscription) {
            let threadsText = `[THREADS]\n`;
            for (let i = 0; i < 3; i++) {
                const randomTrend = trends[Math.floor(Math.random() * trends.length)];
                let mainMsg = "";
                if (i === 0) mainMsg = "가전 1개만 필요해도 초기비용 0원으로 비대면 구독 가능!";
                if (i === 1) mainMsg = "고장 나면 블루패스로 바로바로 케어받으세요.";
                if (i === 2) mainMsg = "정기 필터 교체 및 전문 가전 케어가 무상 포함!";
                
                const variation = randomTrend.template.replace('{main_msg}', mainMsg);
                threadsText += `${i+1}️⃣ ${variation}\n\n`;
            }
            results.threads = { text: threadsText.trim() };
        } else {
            const randomTrend = trends[Math.floor(Math.random() * trends.length)];
            const mainMsg = targetType === 'move_in' ? "입주 6개월 전 1:1 평면도 맞춤 설계!" : "혼수가전은 백화점+로드샵 하이브리드가 진리!";
            const variation = randomTrend.template.replace('{main_msg}', mainMsg);
            
            results.threads = {
                text: `[THREADS]\n가전, 굳이 멀리까지 가실 필요 없습니다. 🛋️\n\n${variation}\n\n19년 경력 노하우로 카톡 하나로 끝내는 비대면 가전 졸업. 링크 확인해 주세요! #진센조`
            };
        }

        return results;
    }

    // Alias for backward compatibility
    async generateManuscript(targetKey, region, apartmentName = "") {
        const contents = await this.generateMultiChannelContent(targetKey, region, apartmentName);
        return contents.naver_blog;
    }

    buildTargetedDiary(targetType, target, region, apartmentName, expertTip) {
        // Fetch live keywords if available
        const liveKeywords = this.strategy.live_search_keywords || {};
        const keywordList = targetType === 'wedding' ? liveKeywords['wedding'] 
                          : targetType === 'move_in' ? liveKeywords['move_in'] 
                          : liveKeywords['subscription'];
        
        const randomLiveKeyword = (keywordList && keywordList.length > 0) 
            ? keywordList[Math.floor(Math.random() * keywordList.length)] 
            : (targetType === 'move_in' ? '입주가전 트렌드' : '가전졸업 꿀팁');

        // Fetch hot topics if available
        const hotTopics = target.hot_topics || [];
        const randomHotTopic = (targetType === 'move_in' && hotTopics.length > 0) 
            ? hotTopics[Math.floor(Math.random() * hotTopics.length)]
            : "";

        let content = `안녕하세요. 가전 그 이상의 가치를 설계하는 JCC 진센조입니다.\n\n`;
        
        const p1List = this.templates.phase1[targetType] || this.templates.phase1.default;
        const p2List = this.templates.phase2[targetType] || this.templates.phase2.default;
        const p3List = this.templates.phase3[targetType] || this.templates.phase3.default;
        const p4List = this.templates.phase4;

        const p1 = p1List[Math.floor(Math.random() * p1List.length)];
        const p2 = p2List[Math.floor(Math.random() * p2List.length)];
        const p3 = p3List[Math.floor(Math.random() * p3List.length)];
        const p4 = p4List[Math.floor(Math.random() * p4List.length)];

        let hotTopicText = "";
        if (randomHotTopic) {
            hotTopicText = `특히 최근 입주민들 사이에서는 **'${randomHotTopic}'**가 큰 화두가 되고 있습니다. `;
        }

        // Phase 1
        content += p1.replace(/\[\{randomLiveKeyword\}\]/g, `[${randomLiveKeyword}]`)
                     .replace(/\{hotTopicText\}/g, hotTopicText);

        // Phase 2: Region Story
        let regionStory = "";
        if (region.includes("울산")) {
            if(targetType === 'wedding') {
                regionStory = `사실 저도 **울산 토박이**입니다. 고향의 예비 부부님들이 왜 굳이 진주 매장까지 찾아오실까요? 바로 진주 매장이 전국적으로 보아도 **혼수가전 할인 혜택과 정책이 가장 압도적**이기 때문입니다. 고향 분들께 가장 유리한 신혼 살림을 만들어 드리기 위해 제가 직접 설계합니다.\n\n`;
            } else {
                regionStory = `사실 저도 **울산 토박이**입니다. 고향 분들이 왜 굳이 진주 매장까지 찾아오실까요? 바로 진주 매장이 전국적으로 보아도 **할인 혜택과 정책이 가장 압도적**이기 때문입니다. 고향 분들께 가장 유리한 조건을 만들어 드리기 위해 제가 직접 설계합니다.\n\n`;
            }
        } else if (region.includes("진주")) {
            if(targetType === 'wedding') {
                regionStory = `특히 진주 지역 예비 부부님들께는 **백화점 에누리 최고 15%**와 로드샵의 유연한 정책을 결합한 혼수 전용 통합 솔루션을 가장 빠르게 제공해 드립니다.\n\n`;
            } else {
                regionStory = `특히 진주 지역 고객님들께는 **백화점 에누리 최고 15%**와 로드샵의 유연한 정책을 결합한 통합 솔루션을 가장 빠르게 제공해 드립니다.\n\n`;
            }
        } else {
            if(targetType === 'wedding') {
                regionStory = `전국 어디서나 비대면 카톡 한 장으로 이 놀라운 혼수 혜택을 동일하게 받으실 수 있기 때문입니다.\n\n`;
            } else {
                regionStory = `전국 어디서나 비대면 카톡 한 장으로 이 놀라운 혜택을 동일하게 받으실 수 있기 때문입니다.\n\n`;
            }
        }

        content += p2.replace(/\{region\}/g, region)
                     .replace(/\{apartmentName\}/g, apartmentName ? apartmentName + ' ' : '')
                     .replace(/\{regionStory\}/g, regionStory);

        // Phase 3
        content += p3;
        
        // Phase 4
        content += p4;

        // Target Specific specifics
        if (targetType === 'move_in') {
            content += `### 📝 진센조가 알려드리는 '입주 전 필수 체크리스트'\n`;
            target.checklist.forEach(item => {
                content += `- ✅ ${item}\n`;
            });
            content += `\n입주를 준비하며 놓치기 쉬운 이 항목들을 미리 챙기시면 훨씬 수월한 시작이 되실 겁니다.\n\n`;
        }

        // Add Detailed Jinju Introduction (New Requirement)
        content += `### 🏯 가전 졸업의 성지, '진주'를 아시나요?\n`;
        content += `진주 통합매장이 왜 전국적인 가전 성지가 되었는지 이해하려면, 먼저 진주라는 도시의 매력을 알아야 합니다. 진주는 천년의 역사를 간직한 충절의 고장이자, 남강의 수려한 풍광을 품은 서부 경남의 중심지입니다.\n\n`;
        content += `**역사와 전통의 도시**: 임진왜란 3대 대첩 중 하나인 진주대첩의 현장 '진주성'과 남강 위에 우뚝 솟은 '촉석루'는 방문객들에게 깊은 감동을 선사합니다. 밤이면 화려한 조명과 함께 어우러지는 진주 남강 유등축제는 세계적인 축제로 자리 잡았죠.\n\n`;
        content += `**식지 않는 미식의 열기**: 진주하면 빼놓을 수 없는 것이 바로 '진주냉면'입니다. 해물 육수의 깊은 맛과 육전 고명의 고소함이 어우러진 맛은 전국 어디에서도 흉내 낼 수 없는 진주만의 자부심입니다. 또한, 중앙시장의 육회비빔밥은 80년 전통의 맛을 고스란히 간직하고 있습니다.\n\n`;
        content += `**가전 졸업의 성지**: 이런 전통과 자부심을 바탕으로, 진주 통합매장 진센조는 **전국 최고 수준의 할인 정책**을 운영하고 있습니다. 단순히 제품을 파는 곳이 아니라, 진주의 넉넉한 인심과 마스터의 꼼꼼한 설계를 결합하여 고객님께 최고의 만족을 드리는 공간입니다.\n\n`;

        // Add Local Tour Table for specific targets
        if (targetType === 'move_in' || targetType === 'wedding') {
            content += `### 🗺️ 진센조 추천: 가전 졸업 후 즐기는 '진주 힐링 투어' 코스\n`;
            content += `가전 졸업의 성지 진주 통합매장까지 오신 김에, 진센조가 추천하는 힐링 투어로 스트레스까지 모두 날려버리세요!\n\n`;
            content += this._generateLocalTourTable(targetType);
            content += `\n\n`;
        }

        const tipSection = `\n--- \n\n### 💡 진센조가 제안하는 전문가 팁 \n\n"${expertTip.tip}" \n\n**판매를 끝이 아닌 새로운 인연의 시작**으로 생각하는 진센조와 함께, 후회 없는 가전 졸업을 경험해 보세요.`;
        
        return content + tipSection;
    }

    _generateLocalTourTable(targetType) {
        if (targetType === 'move_in') {
            return `| 구분 | 장소/명칭 | 특징 |
| :--- | :--- | :--- |
| **맛집** | 하연옥 본점 | 진주냉면과 육전의 환상적인 조화 |
| **맛집** | 제일식당 | 중앙시장 내 전통 있는 육회비빔밥 |
| **명소** | 진주성 촉석루 | 역사와 남강의 운치를 동시에 느끼는 산책로 |
| **명소** | 진양호 노을공원 | 가전 상담 후 노을과 함께하는 힐링 타임 |`;
        } else if (targetType === 'wedding') {
            return `| 구분 | 장소/명칭 | 특징 |
| :--- | :--- | :--- |
| **분위기** | 살롱드 인사 | 인스타 감성 뿜뿜, 꽃분수와 스테이크 맛집 |
| **카페** | 은안재 | 신혼부부에게 어울리는 고즈넉한 한옥 감성 카페 |
| **야경** | 김시민호(유람선) | 남강 위에서 즐기는 로맨틱한 진주성 야경 |
| **산책** | 소망진산 유등공원 | 365일 빛나는 유등과 함께하는 야경 산책 |`;
        }
        return "";
    }

    generateSnsHashtags(targetType, region, apartmentName = "") {
        const brandTag = '진센조';
        const coreTags = ['가전성지', '가전졸업', '삼성가전', '비대면견적'];
        const broadRegion = region ? region.split(' ')[0] : '';
        
        let targetTags = [];
        if (targetType === 'move_in') {
            targetTags = ['입주가전', '입주가전리스트', '입주전체크리스트', '신축아파트입주', '새집인테리어', '공동구매'];
            if (apartmentName) {
                targetTags.push(apartmentName, `${apartmentName}입주`);
            }
            if (broadRegion) {
                targetTags.push(`${broadRegion}입주가전`, `${broadRegion}맘카페`);
            }
        } else if (targetType === 'wedding') {
            targetTags = ['혼수가전', '신혼가전', '결혼준비', '예비부부', '신혼집인테리어', '다이렉트결혼준비', '메이크마이웨딩'];
            if (broadRegion) {
                targetTags.push(`${broadRegion}결혼준비`, `${broadRegion}신혼가전`);
            }
        } else if (targetType === 'subscription') {
            targetTags = ['가전구독', '삼성가전구독', '삼성AI구독클럽', '0원라이프', '시성비', '가전구독서비스', '스마트홈'];
        }
        
        // Strategy tags
        const strategyTags = (this.strategy.target_segments[targetType] && this.strategy.target_segments[targetType].hashtags) || [];
        
        // Combine them
        const allPossibleTags = [
            ...coreTags,
            ...targetTags,
            ...strategyTags,
            '삼성AI가전', '삼성스토어', '비스포크AI'
        ].map(k => k.replace(/[\s/#]/g, '')).filter(k => k !== brandTag && k.length > 0);
        
        // Shuffle and take 12 tags
        const uniqueOthers = [...new Set(allPossibleTags)].sort(() => 0.5 - Math.random()).slice(0, 12);
        
        // Combine with brandTag
        const finalTags = [brandTag, ...uniqueOthers];
        return finalTags.map(tag => `#${tag}`).join(' ');
    }
}

module.exports = ContentGenerator;
