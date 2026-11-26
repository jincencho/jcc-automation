const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const careVideos = [
  { id: 'washing_machine', name: '세탁기', shortUrl: 'https://m.site.naver.com/2k7Vq', fullUrl: 'https://www.youtube.com/watch?v=wFh0jGaajgk', keywords: ['세탁기', '건조기', '워시타워', '그랑데', '콤보', 'WF', 'WD', 'DV', 'WD25'] },
  { id: 'water_purifier', name: '정수기', shortUrl: 'https://m.site.naver.com/2k7Yz', fullUrl: 'https://www.youtube.com/watch?v=ctmvbdk66tQ', keywords: ['정수기', '비스포크 정수기', 'WP'] },
  { id: 'tv', name: 'TV', shortUrl: 'https://m.site.naver.com/2k803', fullUrl: 'https://www.youtube.com/watch?v=827y1cprQbg', keywords: ['TV', '사운드바', '모니터', '티비', 'KQ', 'KU', 'QN', 'HW'] },
  { id: 'robot_cleaner', name: '로봇청소기', shortUrl: 'https://m.site.naver.com/2k81C', fullUrl: 'https://www.youtube.com/watch?v=bXa-ip4RfkA', keywords: ['로봇청소기', '청소기', '스틱청소기', '제트', 'VR', 'VS'] },
  { id: 'airdresser', name: '에어드레서', shortUrl: 'https://m.site.naver.com/2k9J3', fullUrl: 'https://www.youtube.com/watch?v=DgRouzzseLM', keywords: ['에어드레서', '슈드레서', '스타일러', '의류관리기', 'DF', 'DJ'] },
  { id: 'refrigerator', name: '냉장고', shortUrl: 'https://m.site.naver.com/2k9PF', fullUrl: 'https://www.youtube.com/watch?v=XwPULRfQK9k', keywords: ['냉장고', '김치냉장고', '4도어', '키친핏', 'RF', 'RQ', 'RB'] },
  { id: 'dishwasher', name: '식기세척기', shortUrl: 'https://m.site.naver.com/2k9Kn', fullUrl: 'https://www.youtube.com/watch?v=Jt5-VzT99Pk', keywords: ['식기세척기', '식세기', 'DW'] },
  { id: 'air_conditioner', name: '에어컨', shortUrl: 'https://m.site.naver.com/2k9KJ', fullUrl: 'https://www.youtube.com/watch?v=jcif-HrIK3Q', keywords: ['에어컨', '에어컨 스탠드', '에어컨 벽걸이', '무풍', '제습기', 'AF', 'AR', 'AY'] },
  { id: 'system_air_conditioner', name: '시스템에어컨', shortUrl: 'https://m.site.naver.com/2k9L7', fullUrl: 'https://www.youtube.com/watch?v=yPngVJV_4MA', keywords: ['시스템에어컨', '시스템 에어컨', '천장형', '에어컨 천장형', 'DVM'] },
  { id: 'air_purifier', name: '공기청정기', shortUrl: 'https://m.site.naver.com/2k9MY', fullUrl: 'https://www.youtube.com/watch?v=mZwBznmYEkY', keywords: ['공기청정기', '큐브', '블루스카이', 'AX'] },
  { id: 'induction', name: '인덕션', shortUrl: 'https://m.site.naver.com/2k9Nu', fullUrl: 'https://www.youtube.com/watch?v=fAFHpII8okQ', keywords: ['인덕션', '전기레인지', '전자레인지', '오븐', '후드', '쿡탑', 'NZ', 'MC', 'NQ'] },
  { id: 'ai_subscription', name: 'AI구독', shortUrl: 'https://m.site.naver.com/2k9RA', fullUrl: 'https://www.youtube.com/playlist?list=PLV5m8T5m0A6anRaC7485y9lQslEd3ioz4', keywords: ['AI구독', '종합', '전체', '구독클럽'] }
];

(async () => {
  const itemsWithQr = [];
  for (const item of careVideos) {
    const qrB64 = await QRCode.toDataURL(item.shortUrl, {
      margin: 2,
      errorCorrectionLevel: 'M',
      width: 400,
      color: { dark: '#000000', light: '#ffffff' }
    });
    itemsWithQr.push({ ...item, qrB64 });
  }

  const fileContent = `/**
 * AI구독 제품별 케어서비스 영상 링크 및 고해상도 QR코드 데이터 (ver. 2026.10.23)
 * 직원(매니저) 전용 품목 안내 및 스마트폰 스캔용
 */

export const CARE_SERVICE_VIDEOS = ${JSON.stringify(itemsWithQr, null, 2)};

/**
 * 입력된 품목명, 카테고리, 또는 모델명으로부터 매칭되는 케어서비스 영상 정보 반환
 */
export function matchCareServiceVideo(query) {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().toUpperCase();
  if (!clean) return null;

  // 1. 직접 품목명 일치
  const direct = CARE_SERVICE_VIDEOS.find((v) => v.name.toUpperCase() === clean);
  if (direct) return direct;

  // 2. 키워드 일치 (긴 키워드 우선)
  for (const v of CARE_SERVICE_VIDEOS) {
    for (const kw of v.keywords) {
      if (clean.includes(kw.toUpperCase())) {
        return v;
      }
    }
  }

  return null;
}
`;

  fs.writeFileSync(path.resolve('web/src/constants/careServiceVideos.js'), fileContent, 'utf-8');
  console.log('Successfully generated web/src/constants/careServiceVideos.js with all 12 QR codes!');
})();
