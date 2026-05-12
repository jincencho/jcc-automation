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
        const contentTitle = isSubscription 
            ? `${target.name}, 이제 전국 어디서나 비대면으로 스마트하게 가전 졸업하세요`
            : `${displayRegion} ${displayApartment || ''} ${target.name}의 해답은 결국 '진실'에 있습니다`;
        
        // [NAVER BLOG] - 상세 스토리텔링 & 신뢰도 중심
        results.naver_blog = {
            title: `[NAVER BLOG] ${contentTitle}`,
            body: this.buildTargetedDiary(targetType, target, displayRegion, displayApartment, randomTip) + 
                  `\n\n---\n\n✨ **가전 졸업 성지, 진센조 더 알아보기**\n🔗 [진센조 전용 홈페이지 바로가기](${this.strategy.homepage_url || 'https://jcc-band.vercel.app/'})`,
            hashtags: (() => {
                let tags = [];
                if (targetType === 'subscription' && this.strategy.hashtag_strategy) {
                    tags = [...this.strategy.hashtag_strategy.core, ...this.strategy.hashtag_strategy.experience, ...this.strategy.hashtag_strategy.lifestyle];
                } else if (targetType === 'move_in') {
                    tags = [
                        ...(this.strategy.regional_cafes[region] || this.strategy.regional_cafes['경남']),
                        ...(displayApartment ? [displayApartment.replace(/ /g, ''), `${displayApartment.replace(/ /g, '')}입주`] : []),
                        ...this.strategy.target_segments.move_in.hashtags,
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

        // [INSTAGRAM] - 감성적 태그 & 짧고 강렬한 훅
        results.instagram = {
            caption: `[INSTAGRAM]\n✨ ${target.hook_message}\n\n${(isSubscription || targetType === 'move_in') ? "🏠 집 안에서 편안하게 받는 전국 비대면 가전 컨설팅! 💎" : `${displayRegion} ${displayApartment || ''} 고객님들 주목! 💎`}\n\n왜 다들 '진센조'에서 가전졸업 할까요? 19년 마스터의 1:1 비대면 맞춤 큐레이션으로 전국 어디서나 가장 합리적인 가전 졸업을 시작하세요.\n\n#진센조 #가전구독 #비대면상담 #전국구 #가전졸업성지 #삼성가전`,
            image_hook: (isSubscription || targetType === 'move_in') ? `${displayApartment || target.name} 입주민만을 위한 공간 맞춤형 AI 가전 솔루션` : target.hook_message,
            carousel_hints: (isSubscription || targetType === 'move_in')
                ? ["비대면으로 완성하는 가전졸업", "입주 평면도 기반 공간 설계", "19년 마스터의 전담 케어", "카톡으로 5분 만에 견적 완료"]
                : [target.hook_message, "19년 경력 마스터의 정밀 설계", "오직 당신만을 위한 맞춤형 혜택", "가전 졸업의 성지, 진센조를 만나보세요"]
        };

        // [FACEBOOK] - 지역/전국 정보성 톤
        results.facebook = {
            text: `[FACEBOOK]\n📢 ${isSubscription ? "전국 어디서나 가능한 스마트한 가전 구매 정보!" : `${displayRegion} 지역 분들께 공유하는 가전 정보!`}\n\n${target.hook_message}\n\n19년 동안 가전 한 길만 걸어온 마스터가 제안하는 ${target.name} 맞춤 패키지. ${isSubscription ? "이제 매장 방문 없이 비대면으로 완벽한 견적을 받아보세요." : "공동구매보다 더 큰 혜택을 확인하세요."}\n\n#진센조 #가전구독 #비대면견적 #가전할인`
        };

        // [YOUTUBE SHORTS] - 자막 중심 숏폼 스크립트
        results.youtube_shorts = {
            shorts_script: `[YOUTUBE SHORTS]\n[00:00] (자막: ${isSubscription ? "전국 어디서나 비대면 가전구독 0원!" : target.hook_message})\n[00:05] "매장 가기 귀찮으시죠? 19년 경력이 알려주는 비대면 ${target.name} 꿀팁!"\n[00:10] (자막: 전국 어디서나 카톡 한 장으로 끝)\n[00:15] 안녕하세요 진센조입니다. 전국 어디든 정성을 다해 상담해 드립니다.`
        };

        // [THREADS] - 솔직하고 담백한 전문가 인사이트
        results.threads = {
            text: `[THREADS]\n가전, 굳이 멀리까지 가실 필요 없습니다. 🛋️\n\n${isSubscription ? "전국 어디서나 비대면으로 완벽하게 설계해 드립니다." : target.hook_message}\n\n19년 경력의 노하우를 담아 카톡 하나로 끝내는 비대면 가전 졸업. 궁금하시면 프로필 링크를 확인해 주세요. #비대면가전 #진센조 #가전구독`
        };

        return results;
    }

    // Alias for backward compatibility
    async generateManuscript(targetKey, region, apartmentName = "") {
        const contents = await this.generateMultiChannelContent(targetKey, region, apartmentName);
        return contents.naver_blog;
    }

    buildTargetedDiary(targetType, target, region, apartmentName, expertTip) {
        const career = this.strategy.expert_career;
        let content = `안녕하세요. 가전 그 이상의 가치를 설계하는 JCC 진센조입니다.\n\n`;
        content += `저는 단순히 가전을 판매하는 사람이 아닙니다. 2007년 삼성전자 서비스 입사 후 가전의 내부 구조를 수리하며 배우는 것부터 시작해, 기술경진대회 입상, 그리고 직접 배송과 설치를 설계하는 물류 전문가 과정까지 거쳤습니다.\n\n`;
        content += `이후 CS 마스터와 금상 수상을 거쳐 지금의 진센조가 되기까지, **서비스(수리)-물류(설치)-영업(설계)**을 모두 직접 경험한 19년 마스터의 시선으로 ${region} ${apartmentName || ''} ${target.name} 고객님께 가장 완벽한 해답을 드리고자 합니다.\n\n`;
        
        // Target specific storytelling
        if (targetType === 'wedding') {
            content += `가장 설레면서도 고민이 많은 시기, 인생의 새로운 시작을 준비하는 예비부부님들께 진심으로 축하의 인사를 올립니다.\n\n`;
            content += `혼수 가전을 준비하다 보면 '백화점의 프리미엄 모델'과 '로드샵의 실속형 모델' 사이에서 갈등하게 됩니다. 보통은 한쪽을 포기하고 발품을 팔아야 하지만, 저희는 다릅니다.\n\n`;
            content += `**전국 최초로 백화점 전용 모델과 로드샵 모델을 한 곳에서 동시에 비교하고, 필요한 품목별로 자유롭게 혼합하여 견적을 낼 수 있는 통합 시스템**을 갖추고 있습니다.\n\n`;
            content += `19년 마스터의 노하우로 '꼭 힘을 줘야 할 가전은 백화점 프리미엄으로, 실속을 챙길 가전은 로드샵 가성비 모델로' 완벽한 하이브리드 설계를 도와드리겠습니다. 이것이 진센조가 예비부부님들께 드리는 최고의 선물입니다.\n\n`;
        } else if (targetType === 'subscription') {
            content += `가전, 이제는 무거운 초기 비용 없이도 프리미엄의 가치를 누릴 수 있습니다. 특히 진센조가 제안하는 **'삼성 AI 가전 구독 클럽'**은 단순히 제품을 빌려 쓰는 렌탈을 넘어선 프리미엄 관리 서비스입니다.\n\n`;
            content += `왜 구독을 해야 할까요? 바로 **'블루패스(Blue Pass)'**라는 독보적인 케어 서비스 때문입니다. \n`;
            content += `1. **A/S 패스트트랙**: 고장이 나도 기다릴 필요 없이 전국 어디서나 우선적인 수리 서비스를 받으실 수 있습니다.\n`;
            content += `2. **AI 사전케어**: AI가 기기의 상태를 실시간으로 모니터링하여, 고장이 나기 전 미리 이상 징후를 알려드립니다.\n`;
            content += `3. **전문가 토탈 케어**: 혼자 하기 힘든 필터 교체부터 내부 분해 세척까지 가전 전문가가 주기적으로 직접 관리해 드립니다.\n`;
            content += `4. **라이프스타일 클럽 혜택**: 영화(CGV), 외식, 면세점 등 일상의 즐거움까지 챙겨드리는 바우처가 매월 제공됩니다.\n\n`;
            content += `이 모든 혜택, 진센조를 통해 **전국 어디서나 비대면으로** 단 5분 만에 설계받으실 수 있습니다. **단 한 개만 구독하셔도 진센조만의 특별한 추가 혜택**까지 더해드리니, 이제 가전은 고민 말고 구독하세요!\n\n`;
        } else if (targetType === 'move_in') {
            content += `새로운 보금자리로의 입주를 6개월 앞둔 설레는 시점, ${apartmentName} 입주민 여러분께 진심 어린 축하를 전합니다.\n\n`;
            content += `입주 6개월 전은 가전 졸업의 '골든타임'입니다. 이 시기에 평면도를 기반으로 가전을 설계해야 가구와의 조화는 물론, 가장 유리한 혜택을 선점할 수 있기 때문입니다.\n\n`;
            content += `영남권(부산·울산·경남·경북·대구) 가전 졸업의 성지인 **진주 통합매장**으로 주말 나들이를 계획해 보시는 건 어떨까요? 진주성 촉석루의 운치 있는 산책과 전국적으로 유명한 **진주 냉면/육전 맛집인 '하연옥'** 탐방까지, 진센조가 추천하는 '힐링 투어'와 함께 가전 고민을 완벽하게 해결해 드립니다.\n\n`;
            content += `가전 상담을 마치고 나서 시원한 진주냉면 한 그릇에 고소한 육전 한 접시를 곁들이면, 그야말로 완벽한 '입주 준비 데이트'가 완성될 것입니다.\n\n`;
            content += `### 📝 진센조가 알려드리는 '입주 전 필수 체크리스트'\n`;
            target.checklist.forEach(item => {
                content += `- ✅ ${item}\n`;
            });
            content += `\n입주를 준비하며 놓치기 쉬운 이 항목들을 미리 챙기시면 훨씬 수월한 시작이 되실 겁니다.\n\n`;
            content += `매장 방문이 어려우신 분들도 걱정 마세요. **공식 홈페이지(${this.strategy.homepage_url})**를 통해 비대면으로 평면도 기반의 정밀 상담을 받으실 수 있습니다. 19년 마스터의 시선으로 동선과 품격이 살아있는 공간을 완성해 드리겠습니다.\n\n`;
        } else if (targetType === 'moving') {
            content += `새 집으로의 설레는 이동, 가전 설치와 세팅만큼은 걱정 없으시도록 진센조가 끝까지 책임지고 설계해 드립니다.\n\n`;
        }

        // Add Regional Nuance (Jinju Integrated Store)
        if (region.includes("진주")) {
            content += `특히 진주 지역 고객님들께는 **백화점 에누리 최고 15%**와 로드샵의 유연한 정책을 결합한 통합 솔루션을 추천드립니다. 매장을 옮겨 다닐 필요 없이 한 곳에서 모든 고민을 끝내세요.\n\n`;
        }

        // Add Local Tour Table for specific targets
        if (targetType === 'move_in' || targetType === 'wedding') {
            content += `\n### 🗺️ 진센조 추천: 가전 졸업 후 즐기는 '진주 힐링 투어' 코스\n\n`;
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
