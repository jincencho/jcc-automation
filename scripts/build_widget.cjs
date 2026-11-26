const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';
const b64Expanded = fs.readFileSync(path.join(dir, 'screenshot_affiliate_expanded.png')).toString('base64');
const b64Quote1 = fs.readFileSync(path.join(dir, 'screenshot_quote1_view.png')).toString('base64');
const b64Quote2 = fs.readFileSync(path.join(dir, 'screenshot_quote2_page2.png')).toString('base64');
const b64Notice = fs.readFileSync(path.join(dir, 'screenshot_rereview_notice_box.png')).toString('base64');

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .tab-btn.active { background: #d97706; color: white; border-color: #f59e0b; }
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-0 m-0">
  <div class="py-2 space-y-2 max-w-full">
    <!-- Header -->
    <div class="flex items-center justify-between pb-2 border-b border-[var(--card-border)]">
      <div class="flex items-center gap-2">
        <span class="text-base">📌</span>
        <strong class="text-sm text-[var(--foreground)]">58일차 재심사 필수 안내문 & 제휴혜택 뷰어</strong>
      </div>
      <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">실시간 58일차 계산 연동</span>
    </div>

    <!-- Tab navigation -->
    <div class="flex gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
      <button id="tab1" onclick="switchTab(1)" class="tab-btn active px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] whitespace-nowrap">
        ⚠️ 1. 58일차 필수 안내문 (신규)
      </button>
      <button id="tab2" onclick="switchTab(2)" class="tab-btn px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] whitespace-nowrap">
        ✨ 2. 제휴 연계 매니저 설정
      </button>
      <button id="tab3" onclick="switchTab(3)" class="tab-btn px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] whitespace-nowrap">
        📄 3. 1번 비교견적서
      </button>
      <button id="tab4" onclick="switchTab(4)" class="tab-btn px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] whitespace-nowrap">
        📄 4. 2번 복합견적서 (2P)
      </button>
    </div>

    <!-- View 1: 58-Day Notice Box -->
    <div id="view1" class="space-y-1.5">
      <div class="text-xs text-[var(--muted-foreground)] flex items-center justify-between">
        <span>견적서 하단 및 계약일자 아래 실시간 자동 계산 노출</span>
        <span class="text-amber-400 font-bold">2027년 1월 22일(금) (58일차)</span>
      </div>
      <div class="rounded-xl overflow-hidden border border-amber-500/40 bg-black/40 shadow-lg p-1">
        <img src="data:image/png;base64,${b64Notice}" class="w-full object-contain" alt="58일차 재심사 안내문" />
      </div>
      <div class="text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 rounded-lg p-2 leading-relaxed">
        💡 <strong>계약일자 실시간 연동:</strong> 계약(구매)일자가 변경되면 58일차 날짜가 요일까지 자동으로 즉시 재계산되어 견적서 하단에 정중한 안내 문구와 함께 인쇄됩니다.
      </div>
    </div>

    <!-- View 2: Manager UI -->
    <div id="view2" class="space-y-1.5 hidden">
      <div class="text-xs text-[var(--muted-foreground)] flex items-center justify-between">
        <span>🏢 보람상조/소노아임레디(100만) + 📡 KT IPTV(45만) 설정 패널</span>
        <span class="text-purple-400 font-bold">총 -1,450,000원 할인</span>
      </div>
      <div class="rounded-xl overflow-hidden border border-[var(--border)] bg-black/40 shadow-lg max-h-[380px] overflow-y-auto">
        <img src="data:image/png;base64,${b64Expanded}" class="w-full object-contain" alt="매니저 설정 UI" />
      </div>
    </div>

    <!-- View 3: Quote 1 -->
    <div id="view3" class="space-y-1.5 hidden">
      <div class="text-xs text-[var(--muted-foreground)] flex items-center justify-between">
        <span>Option B 혜택 내역(상조/통신) 및 하단 58일차 필수 안내문 출력</span>
        <span class="text-blue-400 font-bold">체감가 즉시 차감 반영</span>
      </div>
      <div class="rounded-xl overflow-hidden border border-[var(--border)] bg-black/40 shadow-lg max-h-[380px] overflow-y-auto">
        <img src="data:image/png;base64,${b64Quote1}" class="w-full object-contain" alt="1번 비교견적서" />
      </div>
    </div>

    <!-- View 4: Quote 2 -->
    <div id="view4" class="space-y-1.5 hidden">
      <div class="text-xs text-[var(--muted-foreground)] flex items-center justify-between">
        <span>2번 복합견적서 2페이지 3번 섹션(통합 캐시백/상품권/제휴) 및 안내문</span>
        <span class="text-emerald-400 font-bold">2P 실체감가 차감 완료</span>
      </div>
      <div class="rounded-xl overflow-hidden border border-[var(--border)] bg-black/40 shadow-lg max-h-[380px] overflow-y-auto">
        <img src="data:image/png;base64,${b64Quote2}" class="w-full object-contain" alt="2번 복합견적서" />
      </div>
    </div>
  </div>

  <script>
    function switchTab(idx) {
      [1, 2, 3, 4].forEach(function(i) {
        document.getElementById('view' + i).classList.toggle('hidden', i !== idx);
        document.getElementById('tab' + i).classList.toggle('active', i === idx);
      });
    }
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(dir, 'local_page_widget.html'), html, 'utf8');
console.log('local_page_widget.html updated with 58-day notice!');
