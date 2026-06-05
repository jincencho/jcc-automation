function generatePromptPack(targetType, content, apartmentName = "") {
    let blogSection = "";

    if (targetType !== 'subscription') {
        let blogImage1, blogImage2, blogTargetPrompt;
        if (targetType === 'wedding') {
            blogImage1 = `### 📸 이미지 1: 혼수 상담의 시작 (도입부 배치)
**프롬프트:**
\`\`\`
A photorealistic, cinematic shot of a professional male consultant in his 40s presenting a beautifully organized appliance catalog to a young Korean couple across a sleek desk. Warm cafe-like ambiance with soft bokeh lights in the background. The couple looks engaged and excited. DSLR photography, 85mm lens, shallow depth of field. Do not include any text. Aspect ratio 16:9.
\`\`\``;
            blogImage2 = `### 📸 이미지 2: 프리미엄 신혼 인테리어 (본문 배치)
**프롬프트:**
\`\`\`
A photorealistic interior of a luxurious newlywed Korean apartment. A seamless built-in bespoke refrigerator in matte white beside a modern kitchen island. Fresh flowers in a vase on the counter, warm morning light through sheer curtains. Romantic, elegant, aspirational newlywed lifestyle. Interior design photography. Do not include any text. Aspect ratio 16:9.
\`\`\``;
            blogTargetPrompt = `[혼수 타겟용]
**프롬프트:**
\`\`\`
A photorealistic shot of a happy, stylish young Korean couple in their late 20s, holding hands and smiling warmly while standing in their newly furnished, modern bright living room in a high-end apartment. The room has elegant lighting and a premium smart TV on the wall. Emotional, joyful, warm sunlight, romantic and hopeful atmosphere. Do not include any text. Aspect ratio 16:9.
\`\`\``;
        } else {
            // move_in default
            blogImage1 = `### 📸 이미지 1: 입주 설계 전문가 (도입부 배치)
**프롬프트:**
\`\`\`
A highly photorealistic, cinematic shot of a professional male consultant in his 40s wearing a neat dark navy suit, standing in an empty unit of "${apartmentName}" apartment. He is holding a tablet displaying a detailed floor plan of "${apartmentName}", pointing at the kitchen area. Large floor-to-ceiling windows reveal a panoramic city view. Trustworthy, authoritative atmosphere. DSLR photography, 35mm wide lens. Do not include any text. Aspect ratio 16:9.
\`\`\``;
            blogImage2 = `### 📸 이미지 2: 새 아파트의 완벽한 빌트인 (본문 배치)
**프롬프트:**
\`\`\`
A photorealistic interior of a brand-new "${apartmentName}" high-rise apartment. Focus on the kitchen area with seamless built-in Samsung bespoke refrigerator and dishwasher, perfectly flush with premium cabinetry. Clean construction smell implied by pristine white walls. Bright natural light flooding in. New home excitement. Interior design photography. Do not include any text. Aspect ratio 16:9.
\`\`\``;
            blogTargetPrompt = `[신규입주 타겟용]
**프롬프트:**
\`\`\`
A wide, photorealistic shot of the stunning, newly built "${apartmentName}" apartment complex during the golden hour. The building exterior is modern and sophisticated, with beautifully landscaped gardens and a water feature in the foreground. Peaceful, premium residential, hopeful new beginning. Do not include any text. Aspect ratio 16:9.
\`\`\``;
        }

        blogSection = `## 📝 1. 네이버 블로그용 프롬프트 (가로형 16:9, 텍스트 없는 고급 이미지)
블로그 본문 중간에 배치하여 읽는 재미를 더하는 극사실주의 감성 이미지입니다.

${blogImage1}

${blogImage2}

### 📸 이미지 3: 타겟별 맞춤 감성 (결론부 배치)
${blogTargetPrompt}

---
`;
    }

    // --- 인스타용: 실제 원고에서 후킹 메시지 추출 ---
    const hookMsg = content.instagram.image_hook;
    const hints = content.instagram.carousel_hints || [];

    // 인스타 슬라이드별 장면 + 후킹 텍스트 조합 프롬프트 (타겟별 차별화)
    const instaScenes = [
        {
            title: `Slide 1: 표지 후킹 ⚡`,
            overlayText: hookMsg,
            scene: targetType === 'wedding'
                ? `A stylish Korean couple in their late 20s standing back-to-back, arms crossed confidently, in a bright modern showroom filled with premium home appliances. Cinematic lighting, trendy and aspirational.`
                : (targetType === 'move_in'
                    ? `A breathtaking aerial view of "${apartmentName}" luxury apartment complex, bathed in golden morning light. Sleek modern architecture, lush landscaping.`
                    : `A futuristic, glowing smart home appliance (refrigerator or washer) in a dark, premium studio setting with a subtle holographic '0 Won' badge floating. Dramatic rim lighting, high-tech aura.`)
        },
        {
            title: `Slide 2: 공감 유발`,
            overlayText: hints[0] || '가전 고민, 이제 끝내세요',
            scene: targetType === 'wedding'
                ? `A young Korean woman sitting at a cluttered desk with multiple wedding planning brochures and appliance catalogs spread out, looking overwhelmed. Warm but slightly stressed atmosphere, relatable wedding prep chaos.`
                : (targetType === 'move_in'
                    ? `A young Korean couple standing in an empty unit of "${apartmentName}", looking at the bare kitchen walls with measuring tape in hand. Slightly anxious but excited expressions. Bright daylight, realistic new apartment vibe.`
                    : `A photorealistic image of a young Korean professional looking slightly worried while staring at a broken old washing machine in a small apartment laundry room. Relatable everyday stress.`)
        },
        {
            title: `Slide 3: 해결책 제시`,
            overlayText: hints[1] || '19년 마스터의 비대면 컨설팅',
            scene: targetType === 'wedding'
                ? `A warm, bright image of a professional consultant video-calling a smiling couple on a large tablet screen. The consultant is showing a comparison chart of appliance packages. Modern office background with Samsung logo subtly visible. Trustworthy and helpful.`
                : (targetType === 'move_in'
                    ? `A dynamic split-screen: left side shows an architectural floor plan of "${apartmentName}" with furniture placement marks, right side shows the same room beautifully furnished with built-in appliances. Transformation concept, before-and-after. Bright and satisfying.`
                    : `A sleek, modern infographic-style scene showing a glowing 'Blue Pass' card emitting a soft blue aura over a brand new AI appliance, symbolizing premium care and zero maintenance stress.`)
        },
        {
            title: `Slide 4: 핵심 베네핏`,
            overlayText: hints[2] || '전국 어디서나 프리미엄 혜택',
            scene: targetType === 'wedding'
                ? `A beautifully arranged flat-lay on a white marble surface: a premium wedding invitation, a golden pen, a small gift box with a ribbon, and a sleek tablet showing an appliance catalog. Luxurious and aspirational.`
                : (targetType === 'move_in'
                    ? `A stunning, perfectly organized modern kitchen in "${apartmentName}" with seamlessly built-in Samsung appliances. Morning sunlight streaming through large windows. Interior magazine quality.`
                    : `A cozy, modern living room where a person is comfortably sitting on a stylish sofa, holding a smartphone showing a clean 1:1 KakaoTalk-style chat window, communicating with a consultant. A premium AI air purifier stands next to the sofa. Extremely convenient, comfortable digital lifestyle atmosphere.`)
        },
        {
            title: `Slide 5: 사회적 증거`,
            overlayText: hints[3] || '가전 졸업의 성지, 진센조',
            scene: targetType === 'wedding'
                ? `A warm, photorealistic shot of a newlywed Korean couple sitting on a modern sofa, toasting with champagne glasses. Behind them, a beautifully set up living room with premium appliances. Celebration mood, golden hour lighting.`
                : (targetType === 'move_in'
                    ? `A photorealistic shot of a happy Korean family (parents and a toddler) cooking together in their brand-new "${apartmentName}" kitchen. Built-in appliances gleaming. Warm overhead pendant lights, cozy family moment.`
                    : `A mosaic collage of 4 small images: a smiling customer giving thumbs up, a smartphone screen showing a '0 Won' subscription contract, a beautifully furnished room, and a close-up of a 1:1 KakaoTalk consultation. Trust-building.`)
        },
        {
            title: `Slide 6: CTA 행동 유도`,
            overlayText: hints[4] || '지금 바로 프로필 링크를 확인하세요!',
            scene: `A clean, modern graphic design background with soft gradient. A large 3D arrow pointing upward-right or a CTA button. Minimalist, trendy, Instagram-native aesthetic with space for text.`
        }
    ];

    let instaSection = '';
    instaScenes.forEach((slide, idx) => {
        instaSection += `### 🖼️ ${slide.title}
**📌 이미지 위에 들어갈 텍스트:** "${slide.overlayText}"
**프롬프트:**
\`\`\`
Create a premium social media image (Instagram post, 1:1 aspect ratio).
The image MUST include the following EXACT KOREAN TEXT as a stylish, bold overlay: '${slide.overlayText}'.
CRITICAL INSTRUCTION: You must verify the Korean spelling multiple times before rendering to ensure there are absolutely NO typos, missing letters, or errors in the text.
The text should be large, clearly readable, and use a modern sans-serif font.
Background scene: ${slide.scene}
The overall mood should be premium, clean, and eye-catching for social media.
\`\`\`

`;
    });

    return `# 🎨 JCC JINJU CENTUM CHOJUNSEOK Image Generation Prompt Pack

⚠️ **중요 알림:** 이 파일에는 여러 개의 프롬프트가 포함되어 있습니다. DALL-E 3의 품질을 높이기 위해, **아래 프롬프트들을 한 번에 하나씩 복사하여 ChatGPT에 입력**해 주세요.

원고 내용("${apartmentName || targetType}")과 완벽하게 매칭되는 고품질 이미지를 생성하기 위한 프롬프트입니다. 한글 오탈자 방지를 위한 강력한 지시가 포함되어 있습니다.

---
${blogSection}
## 📱 ${blogSection ? '2' : '1'}. 인스타그램용 프롬프트 (1:1, 후킹 텍스트 + 이미지 통합)
⚠️ **중요:** 아래 프롬프트는 이미지 안에 한국어 후킹 메시지가 직접 포함됩니다. 각 슬라이드별로 복사해서 사용하세요.

${instaSection}---
💡 **사용 팁:**
${blogSection ? '- 블로그용 이미지는 텍스트가 없는 순수 감성 이미지입니다.\n' : ''}- 인스타그램용 이미지는 후킹 메시지가 포함됩니다. 만약 한글 오탈자가 발생했다면 "텍스트에 오탈자가 있어. 내가 적어준 문구 그대로 단어 하나하나 다시 확인해서 정확하게 그려줘"라고 재요청하세요.
- 텍스트 폰트 분위기를 바꾸고 싶으면 프롬프트 끝에 "Use a bold, rounded Korean font like Noto Sans KR Black"을 추가하세요.
`;
}

module.exports = { generatePromptPack };
