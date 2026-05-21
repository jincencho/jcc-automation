const { generatePromptPack } = require('./engine/prompt_generator');
const fs = require('fs');
const path = require('path');

const mockContent = {
    naver_blog: { title: "[NAVER BLOG] 울산 남구 문수로 푸르지오 어반피스 입주 가전 졸업 리얼 후기" },
    instagram: {
        image_hook: "문수로 푸르지오 어반피스 전용 혜택",
        carousel_hints: ["첫 번째 힌트", "두 번째 힌트", "세 번째 힌트", "네 번째 힌트", "다섯 번째 힌트"]
    },
    facebook: { text: "페이스북 내용" },
    threads: { text: "쓰레드 내용" }
};

const result = generatePromptPack('move_in', mockContent, "문수로 푸르지오 어반피스");
console.log(result);
fs.writeFileSync('test_prompt.md', result);
