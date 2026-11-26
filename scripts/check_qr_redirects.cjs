const urls = {
  '세탁기': 'https://m.site.naver.com/2k7Vq',
  '정수기': 'https://m.site.naver.com/2k7Yz',
  'TV': 'https://m.site.naver.com/2k803',
  '로봇청소기': 'https://m.site.naver.com/2k81C',
  '에어드레서': 'https://m.site.naver.com/2k9J3',
  '냉장고': 'https://m.site.naver.com/2k9PF',
  '식기세척기': 'https://m.site.naver.com/2k9Kn',
  '에어컨': 'https://m.site.naver.com/2k9KJ',
  '시스템에어컨': 'https://m.site.naver.com/2k9L7',
  '공기청정기': 'https://m.site.naver.com/2k9MY',
  '인덕션': 'https://m.site.naver.com/2k9Nu',
  'AI구독': 'https://m.site.naver.com/2k9RA'
};

(async () => {
  for (const [key, url] of Object.entries(urls)) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      console.log(`[${key}] ${url} -> ${res.url}`);
    } catch (e) {
      console.log(`[${key}] ${url} -> Error: ${e.message}`);
    }
  }
})();
