const fs = require('fs');
const path = require('path');
const esbuild = require(path.join(__dirname, '../web/node_modules/esbuild'));

const rootDir = path.resolve(__dirname, '..');
const webDir = path.join(rootDir, 'web');
const logoPath = path.join(webDir, 'public/images/logo_new.png');
const logoB64 = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
  : '';

// KST 기준 버전 타임스탬프 생성 (예: 2026.11.21-092530)
const now = new Date();
const kstOffsetMs = 9 * 60 * 60 * 1000;
const kstDate = new Date(now.getTime() + kstOffsetMs);
const yyyy = kstDate.getUTCFullYear();
const mm = String(kstDate.getUTCMonth() + 1).padStart(2, '0');
const dd = String(kstDate.getUTCDate()).padStart(2, '0');
const hh = String(kstDate.getUTCHours()).padStart(2, '0');
const mi = String(kstDate.getUTCMinutes()).padStart(2, '0');
const ss = String(kstDate.getUTCSeconds()).padStart(2, '0');

const buildVersion = `${yyyy}.${mm}.${dd}-${hh}${mi}${ss}`;
const builtAtStr = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;

const tempEntry = path.join(webDir, 'src/.standalone_entry_temp.jsx');
const entryCode = `
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import BenefitCalculator from './components/BenefitCalculator.jsx';

const LOGO_SRC = ${JSON.stringify(logoB64)};
const BUNDLE_VERSION = ${JSON.stringify(buildVersion)};
const BUNDLE_BUILT_AT = ${JSON.stringify(builtAtStr)};

function StandaloneApp() {
  const [otaState, setOtaState] = useState(() => window.__JCC_OTA_STATE__ || {
    status: 'checking', // 'checking' | 'up_to_date' | 'downloading' | 'ready_to_apply' | 'offline'
    activeVersion: window.__JCC_ACTIVE_VERSION__ || BUNDLE_VERSION,
    remoteVersion: null,
    source: window.__JCC_VERSION_SOURCE__ || 'embedded',
    route: '',
    message: '온라인 서버 최신 기능 확인 중...'
  });

  useEffect(() => {
    const handler = (e) => {
      if (e && e.detail) {
        setOtaState((prev) => ({ ...prev, ...e.detail }));
      }
    };
    window.addEventListener('jcc-ota-status', handler);
    if (window.__JCC_OTA_STATE__) {
      setOtaState((prev) => ({ ...prev, ...window.__JCC_OTA_STATE__ }));
    }
    return () => window.removeEventListener('jcc-ota-status', handler);
  }, []);

  const handleManualSync = () => {
    if (typeof window.__JCC_CHECK_OTA_UPDATE__ === 'function') {
      window.__JCC_CHECK_OTA_UPDATE__(true);
    }
  };

  const handleSaveUpdatedHtmlFile = () => {
    if (typeof window.__JCC_SAVE_UPDATED_HTML_FILE__ === 'function') {
      window.__JCC_SAVE_UPDATED_HTML_FILE__();
    }
  };

  const handleApplyImmediate = () => {
    window.location.reload();
  };

  const isCheckingOrDownloading = otaState.status === 'checking' || otaState.status === 'downloading';

  return (
    <div className="app-container">
      <nav
        className="site-nav no-print"
        style={{
          padding: '0.7rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.6rem',
          borderBottom: '1px solid var(--glass-border)',
          background: 'var(--bg-color)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {LOGO_SRC && (
            <img
              src={LOGO_SRC}
              alt="JINCENCHO"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
          )}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--accent-gold-light)',
              background: 'rgba(212, 175, 55, 0.14)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px'
            }}
          >
            사내망·오프라인 HTML (v{BUNDLE_VERSION})
          </span>

          {/* 실시간 기능 자동동기화 상태 배지 */}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.22rem 0.68rem',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background:
                otaState.status === 'ready_to_apply'
                  ? 'rgba(245, 158, 11, 0.22)'
                  : otaState.status === 'downloading'
                    ? 'rgba(59, 130, 246, 0.22)'
                    : otaState.status === 'up_to_date'
                      ? 'rgba(16, 185, 129, 0.18)'
                      : 'rgba(148, 163, 184, 0.15)',
              border:
                otaState.status === 'ready_to_apply'
                  ? '1px solid #f59e0b'
                  : otaState.status === 'downloading'
                    ? '1px solid #3b82f6'
                    : otaState.status === 'up_to_date'
                      ? '1px solid rgba(16, 185, 129, 0.5)'
                      : '1px solid rgba(148, 163, 184, 0.35)',
              color:
                otaState.status === 'ready_to_apply'
                  ? '#fde68a'
                  : otaState.status === 'downloading'
                    ? '#93c5fd'
                    : otaState.status === 'up_to_date'
                      ? '#6ee7b7'
                      : '#cbd5e1'
            }}
            title="외부 홈페이지가 차단된 사내망에서도 클라우드 DB/CDN 우회 경로를 통해 온라인 서버의 최신 기능이 이 HTML 파일에 자동 동기화됩니다."
          >
            {otaState.status === 'up_to_date' && '🟢 서버 최신 기능 자동동기화됨'}
            {otaState.status === 'checking' && '🔄 서버 최신 기능 확인 중...'}
            {otaState.status === 'downloading' && \`⚡ 신규 기능(v\${otaState.remoteVersion || ''}) 자동 업데이트 중...\`}
            {otaState.status === 'ready_to_apply' && \`✨ 신규 기능(v\${otaState.remoteVersion || ''}) 다운로드 완료!\`}
            {otaState.status === 'offline' && '🛡️ 오프라인 모드 (저장된 최신 기능 실행 중)'}
            {otaState.source === 'ota_cloud' && otaState.status === 'up_to_date' && ' (클라우드 최신패치 적용본)'}
          </span>
        </div>

        {/* 우측 동기화 제어 버튼 그룹 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          {otaState.status === 'ready_to_apply' && (
            <button
              type="button"
              onClick={handleApplyImmediate}
              style={{
                height: '30px',
                padding: '0 0.8rem',
                borderRadius: '6px',
                border: '1px solid #fbbf24',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🚀 지금 최신 기능 적용하기
            </button>
          )}

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isCheckingOrDownloading}
            style={{
              height: '30px',
              padding: '0 0.7rem',
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              background: 'rgba(14, 165, 233, 0.14)',
              color: '#7dd3fc',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: isCheckingOrDownloading ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
            title="온라인 서버에 업데이트된 최신 계산기 기능과 계정을 지금 즉시 동기화합니다."
          >
            🔄 기능 동기화 확인
          </button>

          <button
            type="button"
            onClick={handleSaveUpdatedHtmlFile}
            style={{
              height: '30px',
              padding: '0 0.7rem',
              borderRadius: '6px',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              background: 'rgba(16, 185, 129, 0.14)',
              color: '#6ee7b7',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
            title="동기화된 최신 기능이 영구 포함된 HTML 파일로 덮어쓰기 저장합니다."
          >
            💾 최신 HTML 파일 저장
          </button>
        </div>
      </nav>

      {/* 새 기능 업데이트 완료 알림 바 */}
      {otaState.status === 'ready_to_apply' && (
        <div
          className="no-print"
          style={{
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.22), rgba(245, 158, 11, 0.22))',
            borderBottom: '1px solid rgba(16, 185, 129, 0.5)',
            padding: '0.55rem 1.25rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.8rem',
            flexWrap: 'wrap',
            fontSize: '0.83rem',
            color: '#ecfdf5',
            fontWeight: 700
          }}
        >
          <span>
            ✨ 온라인 서버의 새로운 기능 업데이트(<strong>v{otaState.remoteVersion}</strong>)가 이 HTML에 자동 동기화되었습니다!
          </span>
          <button
            type="button"
            onClick={handleApplyImmediate}
            style={{
              padding: '3px 12px',
              borderRadius: '999px',
              border: 'none',
              background: '#10b981',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            지금 새로고침하여 적용
          </button>
        </div>
      )}

      <main>
        <BenefitCalculator />
      </main>
      <footer
        className="site-footer no-print"
        style={{
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          color: 'var(--text-secondary)',
          borderTop: '1px solid var(--glass-border)',
          marginTop: '3.5rem',
          fontSize: '0.82rem'
        }}
      >
        <p>&copy; 2026 JCC (JINJU CENTUM CHOJUNSEOK). All rights reserved. (Auto-Sync Engine v{BUNDLE_VERSION})</p>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<StandaloneApp />);
`;

fs.writeFileSync(tempEntry, entryCode, 'utf8');

try {
  console.log(`Bundling BenefitCalculator with esbuild (Version: ${buildVersion})...`);
  const result = esbuild.buildSync({
    entryPoints: [tempEntry],
    bundle: true,
    minify: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    loader: {
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.svg': 'dataurl'
    },
    write: false
  });

  // </script> 태그가 문자열 내부에 존재할 경우 HTML 파서 오작동 방지
  const jsBundle = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  const css = fs.readFileSync(path.join(webDir, 'src/index.css'), 'utf8');

  // 1) 온라인/CDN/클라우드 동기화용 OTA 메타데이터 및 번들 파일 생성 (web/public/)
  const publicDir = path.join(webDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const CHUNK_SIZE = 500000; // 500KB 단위 분할 (사내망 방화벽 및 클라우드 DB 패킷 제한 완벽 우회)
  const chunkCount = Math.ceil(jsBundle.length / CHUNK_SIZE);

  const otaMeta = {
    version: buildVersion,
    builtAt: builtAtStr,
    chunkCount,
    jsLength: jsBundle.length,
    cssLength: css.length
  };

  const otaBundle = {
    version: buildVersion,
    builtAt: builtAtStr,
    css,
    jsBundle
  };

  fs.writeFileSync(path.join(publicDir, 'ota-meta.json'), JSON.stringify(otaMeta, null, 2), 'utf8');
  fs.writeFileSync(path.join(publicDir, 'ota-bundle.json'), JSON.stringify(otaBundle), 'utf8');
  console.log(`Generated OTA metadata and bundle in web/public/ (chunks: ${chunkCount})`);

  // 2) 오프라인 단독 HTML 파일 생성 (자동 OTA 부트로더 + IndexedDB 캐시 + 다중 우회 경로 동기화 엔진 내장)
  const bootloaderScript = `
(function() {
  var SUPABASE_URL = "https://nuptkcozqdwirafrbfyx.supabase.co";
  var SUPABASE_KEY = "sb_publishable_qEjEObM6m8ICxhY2d62Nog_-WIVl4A5";
  var DB_NAME = "jcc_ota_engine_v1";
  var STORE_NAME = "bundles";
  var BUNDLE_KEY = "latest_bundle";

  var META_ENDPOINTS = [
    {
      name: "supabase_api",
      url: SUPABASE_URL + "/rest/v1/saved_quotes?id=eq.__jcc_ota_meta_v1__&select=data,updated_at",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      },
      parseMeta: function(json) {
        return Array.isArray(json) && json[0] && json[0].data ? json[0].data : null;
      }
    },
    {
      name: "jsdelivr_cdn",
      url: "https://cdn.jsdelivr.net/gh/jincencho/jcc-automation@main/web/public/ota-meta.json",
      headers: {},
      parseMeta: function(json) { return json && json.version ? json : null; }
    },
    {
      name: "github_raw",
      url: "https://raw.githubusercontent.com/jincencho/jcc-automation/main/web/public/ota-meta.json",
      headers: {},
      parseMeta: function(json) { return json && json.version ? json : null; }
    },
    {
      name: "vercel_prod",
      url: "https://jcc-band.vercel.app/ota-meta.json",
      headers: {},
      parseMeta: function(json) { return json && json.version ? json : null; }
    }
  ];

  function emitOtaStatus(patch) {
    window.__JCC_OTA_STATE__ = Object.assign({}, window.__JCC_OTA_STATE__ || {}, patch);
    try {
      window.dispatchEvent(new CustomEvent("jcc-ota-status", { detail: window.__JCC_OTA_STATE__ }));
    } catch (e) {}
  }

  function openOtaDb() {
    return new Promise(function(resolve) {
      if (typeof indexedDB === "undefined") {
        resolve(null);
        return;
      }
      try {
        var req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = function(ev) {
          var db = ev.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = function(ev) { resolve(ev.target.result); };
        req.onerror = function() { resolve(null); };
      } catch (e) {
        resolve(null);
      }
    });
  }

  function getCachedOtaBundle() {
    return openOtaDb().then(function(db) {
      if (!db) return null;
      return new Promise(function(resolve) {
        try {
          var tx = db.transaction(STORE_NAME, "readonly");
          var store = tx.objectStore(STORE_NAME);
          var getReq = store.get(BUNDLE_KEY);
          getReq.onsuccess = function() { resolve(getReq.result || null); };
          getReq.onerror = function() { resolve(null); };
        } catch (e) {
          resolve(null);
        }
      });
    });
  }

  function saveCachedOtaBundle(bundleObj) {
    return openOtaDb().then(function(db) {
      if (!db) return false;
      return new Promise(function(resolve) {
        try {
          var tx = db.transaction(STORE_NAME, "readwrite");
          var store = tx.objectStore(STORE_NAME);
          var putReq = store.put(bundleObj, BUNDLE_KEY);
          putReq.onsuccess = function() { resolve(true); };
          putReq.onerror = function() { resolve(false); };
        } catch (e) {
          resolve(false);
        }
      });
    });
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    return new Promise(function(resolve, reject) {
      var timer = setTimeout(function() { reject(new Error("timeout")); }, timeoutMs || 6000);
      fetch(url, Object.assign({ cache: "no-store" }, options || {}))
        .then(function(res) {
          clearTimeout(timer);
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json();
        })
        .then(resolve)
        .catch(function(err) {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  async function findLatestRemoteMeta() {
    for (var i = 0; i < META_ENDPOINTS.length; i++) {
      var ep = META_ENDPOINTS[i];
      try {
        var sep = ep.url.indexOf("?") >= 0 ? "&" : "?";
        var json = await fetchWithTimeout(ep.url + sep + "_t=" + Date.now(), { headers: ep.headers }, 5000);
        var meta = ep.parseMeta(json);
        if (meta && meta.version) {
          return { meta: meta, route: ep.name };
        }
      } catch (e) {}
    }
    return null;
  }

  async function downloadFullBundleFromSupabase(expectedMeta) {
    var url = SUPABASE_URL + "/rest/v1/saved_quotes?mode=eq.system_ota_chunk&select=id,data&order=id.asc&_t=" + Date.now();
    var rows = await fetchWithTimeout(url, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY
      }
    }, 12000);

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("No OTA chunks in Supabase");
    }

    var sorted = rows
      .filter(function(r) { return r && r.data && r.data.version === expectedMeta.version; })
      .sort(function(a, b) { return (a.data.index || 0) - (b.data.index || 0); });

    if (sorted.length === 0) {
      throw new Error("Chunk version mismatch");
    }

    var jsParts = [];
    var cssText = "";
    for (var i = 0; i < sorted.length; i++) {
      jsParts.push(sorted[i].data.jsChunk || "");
      if (sorted[i].data.css) {
        cssText = sorted[i].data.css;
      }
    }
    var fullJs = jsParts.join("");
    if (fullJs.length < 100000) {
      throw new Error("Incomplete JS bundle from chunks");
    }
    return {
      version: expectedMeta.version,
      builtAt: expectedMeta.builtAt || "",
      css: cssText,
      jsBundle: fullJs
    };
  }

  async function downloadFullBundleFromCdnOrWeb() {
    var urls = [
      "https://cdn.jsdelivr.net/gh/jincencho/jcc-automation@main/web/public/ota-bundle.json",
      "https://raw.githubusercontent.com/jincencho/jcc-automation/main/web/public/ota-bundle.json",
      "https://jcc-band.vercel.app/ota-bundle.json"
    ];
    for (var i = 0; i < urls.length; i++) {
      try {
        var json = await fetchWithTimeout(urls[i] + "?_t=" + Date.now(), {}, 12000);
        if (json && json.version && json.jsBundle && json.jsBundle.length > 100000) {
          return json;
        }
      } catch (e) {}
    }
    throw new Error("All bundle download routes failed");
  }

  var isCheckingNow = false;
  window.__JCC_CHECK_OTA_UPDATE__ = async function(isManual) {
    if (isCheckingNow) return;
    isCheckingNow = true;
    emitOtaStatus({ status: "checking" });

    try {
      var found = await findLatestRemoteMeta();
      if (!found || !found.meta) {
        emitOtaStatus({ status: "offline" });
        if (isManual) {
          alert("현재 외부 네트워크 연결이 제한되어 저장된 오프라인 최신 버전(v" + window.__JCC_ACTIVE_VERSION__ + ")으로 동작 중입니다.");
        }
        isCheckingNow = false;
        return;
      }

      var remoteMeta = found.meta;
      var currentVer = window.__JCC_ACTIVE_VERSION__ || window.__JCC_EMBEDDED_VERSION__;

      if (remoteMeta.version <= currentVer) {
        emitOtaStatus({
          status: "up_to_date",
          activeVersion: currentVer,
          route: found.route
        });
        if (isManual) {
          alert("✅ 현재 온라인 서버의 최신 기능 버전(v" + currentVer + ")과 이미 완벽하게 동기화되어 있습니다.");
        }
        isCheckingNow = false;
        return;
      }

      // 온라인 서버에 더 새로운 버전이 존재함 -> 즉시 자동 다운로드!
      emitOtaStatus({
        status: "downloading",
        remoteVersion: remoteMeta.version,
        route: found.route
      });

      var newBundle = null;
      try {
        newBundle = await downloadFullBundleFromSupabase(remoteMeta);
      } catch (supaErr) {
        newBundle = await downloadFullBundleFromCdnOrWeb();
      }

      if (newBundle && newBundle.jsBundle) {
        await saveCachedOtaBundle(newBundle);
        window.__JCC_CACHED_OTA_BUNDLE__ = newBundle;
        emitOtaStatus({
          status: "ready_to_apply",
          remoteVersion: newBundle.version
        });

        if (isManual) {
          var applyNow = window.confirm(
            "✨ 온라인 서버의 최신 기능(v" + newBundle.version + ") 동기화가 완료되었습니다!\\n지금 즉시 화면을 새로고침하여 최신 기능을 적용하시겠습니까?"
          );
          if (applyNow) {
            window.location.reload();
          }
        } else {
          // 사용자가 아직 로그인 전이거나 폼 입력 전이라면 0.4초 후 즉시 자동 리로드하여 최신 버전 적용
          var hasAuth = sessionStorage.getItem("jcc_calc_auth") === "true";
          if (!hasAuth) {
            setTimeout(function() {
              window.location.reload();
            }, 400);
          }
        }
      }
    } catch (err) {
      emitOtaStatus({ status: "up_to_date" });
      if (isManual) {
        alert("최신 기능 동기화 확인 중 일시적 오류가 발생했습니다: " + (err && err.message ? err.message : err));
      }
    } finally {
      isCheckingNow = false;
    }
  };

  // 현재 동기화된 최신 버전(내장 또는 클라우드 패치본)을 영구 반영한 단독 HTML 파일로 저장/덮어쓰기
  window.__JCC_SAVE_UPDATED_HTML_FILE__ = async function() {
    var activeBundle = window.__JCC_CACHED_OTA_BUNDLE__;
    var ver = (activeBundle && activeBundle.version) || window.__JCC_ACTIVE_VERSION__ || window.__JCC_EMBEDDED_VERSION__;
    var builtAt = (activeBundle && activeBundle.builtAt) || window.__JCC_ACTIVE_BUILT_AT__ || window.__JCC_EMBEDDED_BUILT_AT__;
    var cssContent = (activeBundle && activeBundle.css) || document.getElementById("jcc-app-style").textContent;
    var jsContent = (activeBundle && activeBundle.jsBundle) || window.__JCC_RAW_EMBEDDED_JS__;

    if (!jsContent) {
      alert("저장할 애플리케이션 번들을 찾을 수 없습니다.");
      return;
    }

    var safeJs = jsContent.replace(/<\\/script/gi, "<\\\\/script");
    var bootSrc = document.getElementById("jcc-ota-bootloader").textContent;

    var fullHtml = [
      "<!DOCTYPE html>",
      "<html lang=\\"ko\\">",
      "<head>",
      "  <meta charset=\\"UTF-8\\" />",
      "  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\" />",
      "  <meta name=\\"color-scheme\\" content=\\"only light\\" />",
      "  <title>JCC 진센조 | 일반구매 vs 삼성AI구독 혜택 계산기 (v" + ver + ")</title>",
      "  <link rel=\\"preconnect\\" href=\\"https://fonts.googleapis.com\\" />",
      "  <link rel=\\"preconnect\\" href=\\"https://fonts.gstatic.com\\" crossorigin />",
      "  <link href=\\"https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap\\" rel=\\"stylesheet\\" />",
      "  <style id=\\"jcc-app-style\\">",
      cssContent,
      "  </style>",
      "</head>",
      "<body>",
      "  <div id=\\"root\\"></div>",
      "  <script id=\\"jcc-embedded-bundle\\">",
      "    window.__JCC_EMBEDDED_VERSION__ = " + JSON.stringify(ver) + ";",
      "    window.__JCC_EMBEDDED_BUILT_AT__ = " + JSON.stringify(builtAt) + ";",
      "    window.__JCC_RUN_EMBEDDED_APP__ = function() {",
      safeJs,
      "    };",
      "    window.__JCC_RAW_EMBEDDED_JS__ = window.__JCC_RUN_EMBEDDED_APP__.toString().replace(/^function\\s*\\(\\)\\s*\\{/, '').replace(/\\}\\s*$/, '');",
      "  <\\/script>",
      "  <script id=\\"jcc-ota-bootloader\\">",
      bootSrc,
      "  <\\/script>",
      "</body>",
      "</html>"
    ].join("\\n");

    try {
      if (typeof window.showSaveFilePicker === "function") {
        var handle = await window.showSaveFilePicker({
          suggestedName: "JCC_혜택계산기.html",
          types: [{
            description: "JCC 스마트 혜택 계산기 HTML 파일",
            accept: { "text/html": [".html"] }
          }]
        });
        var writable = await handle.createWritable();
        await writable.write(fullHtml);
        await writable.close();
        alert("✅ 최신 기능(v" + ver + ")이 영구 반영된 HTML 파일 저장이 완료되었습니다!");
        return;
      }
    } catch (pickerErr) {
      if (pickerErr && pickerErr.name === "AbortError") return;
    }

    var blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "JCC_혜택계산기.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 부팅 시퀀스: IndexedDB에 내장 버전보다 더 최신인 클라우드 OTA 번들이 있으면 그것을 우선 실행!
  getCachedOtaBundle().then(function(cached) {
    var embeddedVer = window.__JCC_EMBEDDED_VERSION__ || "0";
    if (cached && cached.version && cached.version > embeddedVer && cached.jsBundle) {
      try {
        window.__JCC_ACTIVE_VERSION__ = cached.version;
        window.__JCC_ACTIVE_BUILT_AT__ = cached.builtAt || "";
        window.__JCC_VERSION_SOURCE__ = "ota_cloud";
        window.__JCC_CACHED_OTA_BUNDLE__ = cached;
        if (cached.css) {
          var styleEl = document.getElementById("jcc-app-style");
          if (styleEl) styleEl.textContent = cached.css;
        }
        var fn = new Function(cached.jsBundle);
        fn();
      } catch (otaExecErr) {
        console.error("[JCC OTA] Cached bundle execution failed, falling back to embedded:", otaExecErr);
        window.__JCC_ACTIVE_VERSION__ = embeddedVer;
        window.__JCC_VERSION_SOURCE__ = "embedded";
        window.__JCC_RUN_EMBEDDED_APP__();
      }
    } else {
      window.__JCC_ACTIVE_VERSION__ = embeddedVer;
      window.__JCC_ACTIVE_BUILT_AT__ = window.__JCC_EMBEDDED_BUILT_AT__ || "";
      window.__JCC_VERSION_SOURCE__ = "embedded";
      window.__JCC_RUN_EMBEDDED_APP__();
    }

    // 앱 마운트 직후 백그라운드에서 온라인 서버 최신 기능 확인 및 3분 주기 자동 체크
    setTimeout(function() {
      window.__JCC_CHECK_OTA_UPDATE__(false);
    }, 300);

    setInterval(function() {
      window.__JCC_CHECK_OTA_UPDATE__(false);
    }, 3 * 60 * 1000);
  });
})();
`;

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="only light" />
  <title>JCC 진센조 | 일반구매 vs 삼성AI구독 혜택 계산기 (v${buildVersion})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
  <style id="jcc-app-style">
${css}
  </style>
</head>
<body>
  <div id="root"></div>
  <script id="jcc-embedded-bundle">
    window.__JCC_EMBEDDED_VERSION__ = ${JSON.stringify(buildVersion)};
    window.__JCC_EMBEDDED_BUILT_AT__ = ${JSON.stringify(builtAtStr)};
    window.__JCC_RUN_EMBEDDED_APP__ = function() {
${jsBundle}
    };
    window.__JCC_RAW_EMBEDDED_JS__ = window.__JCC_RUN_EMBEDDED_APP__.toString().replace(/^function\\s*\\(\\)\\s*\\{/, '').replace(/\\}\\s*$/, '');
  </script>
  <script id="jcc-ota-bootloader">
${bootloaderScript}
  </script>
</body>
</html>
`;

  const outputPath = path.join(rootDir, 'JCC_혜택계산기.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`Success! Auto-syncing Offline HTML generated: ${outputPath} (${(html.length / 1024).toFixed(1)} KB, v${buildVersion})`);
} finally {
  if (fs.existsSync(tempEntry)) {
    fs.unlinkSync(tempEntry);
  }
}
