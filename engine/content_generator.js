const fs = require('fs');
const path = require('path');

class ContentGenerator {
    constructor() {
        this.strategy = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/marketing_strategy.json'), 'utf8'));
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
                    let tags = [];
                    if (targetType === 'move_in') {
                        const broadRegion = region.split(' ')[0]; // '울산 남구' -> '울산'
                        const liveMoves = this.strategy.live_search_keywords.move_in || [];
                        const randomLiveTags = liveMoves.sort(() => 0.5 - Math.random()).slice(0, 3).map(k => k.replace(/ /g, ''));
                        
                        tags = [
                            ...(this.strategy.regional_cafes[broadRegion] || this.strategy.regional_cafes[region] || this.strategy.regional_cafes['경남']),
                            ...(displayApartment ? [displayApartment.replace(/ /g, ''), `${displayApartment.replace(/ /g, '')}입주`] : []),
                            ...this.strategy.target_segments.move_in.hashtags,
                            ...randomLiveTags,
                            '진센조', '가전졸업'
                        ];
                    } else {
                        tags = ['진센조', '가전졸업', target.name, `${region}가전`, '삼성스토어갤러리아진주'];
                    }

                    // Optimization: Max 30 tags, Max 100 characters total
                    const uniqueTags = [...new Set(tags)].slice(0, 30);
                    let result = "";
                    for (const tag of uniqueTags) {
                        const nextTag = `#${tag} `;
                        if ((result + nextTag).length <= 100) {
                            result += nextTag;
                        } else {
                            break;
                        }
                    }
                    return result.trim();
                })()
            };
        }

        // [INSTAGRAM] & [FACEBOOK] - 타겟별 완전 맞춤형 멘트 생성
        let instaCaption, instaHook, instaHints;
        let fbText;

        switch (targetType) {
            case 'wedding':
                instaHook = `혼수 가전, 백화점과 로드샵 모델을 한 곳에서 비교하세요`;
                instaCaption = `[INSTAGRAM]\n✨ 예비 부부님들 축하드립니다! 가장 설레는 혼수 준비 💍\n\n백화점 모델과 로드샵 실속형 모델 사이에서 고민 중이신가요? 전국 유일무이! 진주 통합 매장 진센조에서는 프리미엄과 가성비 라인업을 한 곳에서 비교하고 혼합 설계할 수 있습니다.\n\n✅ 19년 마스터의 1:1 완벽한 하이브리드 설계\n✅ 필요한 품목별 맞춤 조합으로 최적의 견적\n✅ 진주 살롱드 인사 투어와 함께하는 로맨틱한 상담\n\n발품 팔 필요 없이 비대면으로도 가장 유리한 견적을 확인하세요.\n\n#혼수가전 #진센조 #가전성지 #신혼부부 #결혼준비 #가전졸업`;
                instaHints = ["혼수가전, 발품 팔지 말고 한 곳에서", "백화점 프리미엄 + 로드샵 가성비의 결합", "오직 예비부부만을 위한 1:1 맞춤 조합", "19년 마스터의 전국구 비대면 견적"];
                fbText = `[FACEBOOK]\n📢 예비 부부님들을 위한 혼수가전 특급 정보! 🎉\n\n백화점과 로드샵 모델을 섞어서 사고 싶으셨나요? 진센조 통합 솔루션에서는 가능합니다. 19년 마스터가 고객님의 예산과 라이프스타일에 맞게 백화점 에누리와 로드샵 혜택을 결합하여 최적의 하이브리드 견적을 설계해 드립니다. 지금 바로 확인하세요!\n\n#혼수가전 #진센조 #하이브리드설계 #가전졸업`;
                break;

            case 'subscription':
                instaHook = `단 1개라도 상담 가능! 삼성 AI 가전 구독으로 시작하는 0원 라이프`;
                instaCaption = `[INSTAGRAM]\n✨ 가전, 이제 초기 비용 없이 똑똑하게 구독하세요 💎\n\n매장 방문? 큰 목돈? 이제 필요 없습니다! 전국 어디서나 카톡 한 장으로 시작하는 삼성 AI 가전 구독클럽. 19년 마스터 진센조가 고객님 댁에 딱 맞는 구독 모델을 1:1로 큐레이션 해드립니다.\n\n✅ 초기 비용 0원, 부담 없는 시작\n✅ 365일 안심! 블루패스 무상 케어 서비스\n✅ SmartThings를 통한 자동 에너지 절감 및 기기 연동\n\n지금 바로 프로필 링크 클릭하고 1:1 비대면 구독 상담을 신청하세요.\n\n#진센조 #가전구독 #삼성AI구독클럽 #비대면상담 #가전졸업 #0원라이프`;
                instaHints = ["초기 비용 0원으로 만나는 프리미엄 가전", "고장 걱정 끝! 블루패스 무상 케어", "단 1개라도 전국 비대면 1:1 상담", "에너지 모니터링 및 스마트홈 자동화"];
                fbText = `[FACEBOOK]\n📢 전국 어디서나 카톡 하나로 끝내는 스마트 가전 구독!\n\n가전, 이젠 목돈 들여 사지 말고 똑똑하게 구독하세요. 19년 마스터가 최적의 요금제와 혜택을 조합하여 전국 비대면으로 맞춤 설계해 드립니다. 고장 걱정 없는 AI 사전 진단과 블루패스 케어까지 한 번에 챙겨가세요! 🎁\n\n#가전구독 #삼성스토어 #진센조 #비대면상담 #AI가전`;
                break;

            case 'move_in':
            default:
                instaHook = `${displayApartment || target.name} 입주민만을 위한 공간 맞춤형 AI 가전 솔루션`;
                instaCaption = `[INSTAGRAM]\n✨ 입주 6개월 전, 가장 설레는 가전 졸업의 시작 🏠\n\n${displayRegion} ${displayApartment || ''} 입주를 앞둔 고객님들 축하드립니다! 가전은 '언제, 누구에게' 설계 받느냐가 평면도 속 인테리어와 할인 혜택을 결정합니다. 진주 통합 매장 진센조만의 압도적인 혜택을 확인하세요.\n\n✅ 입주 평면도 기반 1:1 맞춤 배치
✅ 입주 공동구매 이상의 개별 혜택
✅ 19년 마스터의 프리미엄 현장 정밀 검수

전용 홈페이지를 통해 비대면으로도 완벽한 입주 큐레이션을 받아보실 수 있습니다.

#입주가전 #진센조 #가전성지 #신규입주 #랜선집들이 #인테리어완성`;
                instaHints = ["입주 가전, 6개월 전이 골든타임", "평면도 맞춤형 1:1 큐레이션", "입주민을 위한 특별 우대 혜택", "19년 마스터의 완벽한 공간 설계", "매장 방문 없이 비대면 5분 견적"];
                fbText = `[FACEBOOK]\n📢 ${displayRegion} ${displayApartment || ''} 입주민 여러분 주목! 🎉\n\n입주 지정 매장보다 더 앞서가는 혜택, 진센조 통합 솔루션을 만나보세요. 단순한 가전 배치가 아닌, 평면도 기반의 인테리어 맞춤 설계와 사후 관리까지 책임집니다. 전국 어디서나 비대면 상담 가능!\n\n#입주가전 #진센조 #비대면견적 #입주할인`;
                break;
        }

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
        
        // Phase 1: ELM (이성적 중심 경로 자극 - 정교화 가능성 모델)
        content += `요즘 가장 핫한 검색어인 **[${randomLiveKeyword}]**, 혹시 찾아보셨나요?\n`;
        if (randomHotTopic) {
            content += `특히 최근 입주민들 사이에서는 **'${randomHotTopic}'**가 큰 화두가 되고 있습니다. `;
        }
        content += `많은 분들이 단순히 카탈로그 스펙이나 인터넷 최저가만 보고 가전을 결정합니다. 하지만 아파트의 평면도, 가족의 라이프스타일, 그리고 숨겨진 통합 할인 정책을 모르면 결국 10년 내내 후회하게 됩니다. 진짜 중요한 건 제품이 아니라 **'공간에 맞는 정확한 설계'**입니다.\n\n`;

        // Phase 2: Social Proof (사회적 증거 효과) & Regional Story
        content += `이미 ${region} ${apartmentName ? apartmentName + ' ' : ''}입주민 및 수많은 고객의 30% 이상이 진센조의 맞춤 설계를 선택하신 진짜 이유가 있습니다.\n`;
        if (region.includes("울산")) {
            content += `사실 저도 **울산 토박이**입니다. 고향 분들이 왜 굳이 진주 매장까지 찾아오실까요? 바로 진주 매장이 전국적으로 보아도 **할인 혜택과 정책이 가장 압도적**이기 때문입니다. 고향 분들께 가장 유리한 조건을 만들어 드리기 위해 제가 직접 설계합니다.\n\n`;
        } else if (region.includes("진주")) {
            content += `특히 진주 지역 고객님들께는 **백화점 에누리 최고 15%**와 로드샵의 유연한 정책을 결합한 통합 솔루션을 가장 빠르게 제공해 드립니다.\n\n`;
        } else {
            content += `전국 어디서나 비대면 카톡 한 장으로 이 놀라운 혜택을 동일하게 받으실 수 있기 때문입니다.\n\n`;
        }

        // Phase 3: Paradox of Choice (선택의 역설 방지)
        content += `**너무 많은 옵션에 지치셨죠?** 인터넷의 수많은 가전 리스트와 복잡한 견적서에 피로감을 느끼셨다면 이제 멈추셔도 됩니다.\n`;
        content += `19년 마스터의 노하우로 고객님 댁에 최적화된 **딱 2가지 솔루션**만 깔끔하게 제안해 드립니다. 백화점의 프리미엄 모델과 로드샵의 실속형 모델을 결합한 하이브리드 설계로 비용은 낮추고 만족도는 극대화합니다.\n\n`;

        // Phase 4: Perceived Risk 관리 (지각된 위험 방어)
        content += `**"혹시 설치하다 문제가 생기면 어떡하지?"** 이런 불안감도 완벽히 지워드립니다.\n`;
        content += `2007년 삼성전자 서비스 입사 후 수리, 배송, 설치, 영업까지 모두 직접 경험한 마스터로서, 현장에서 발생할 수 있는 단 1mm의 단차나 변수조차 사전에 원천 차단합니다. 10년을 쓰는 고관여 제품, 대충 고르고 후회하는 비용이 지금 아끼는 몇십만 원보다 훨씬 큽니다.\n\n`;

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
}

module.exports = ContentGenerator;
