window.__JCC_LATEST_OTA_META__ = {"version":"2026.11.25-125433","builtAt":"2026-11-25 12:54:33","chunkCount":4,"jsLength":1912865,"cssLength":39844};
if (typeof window.__JCC_HANDLE_REMOTE_META__ === 'function') {
  window.__JCC_HANDLE_REMOTE_META__(window.__JCC_LATEST_OTA_META__);
}
(function() {
  var m = window.__JCC_LATEST_OTA_META__;
  var cur = window.__JCC_ACTIVE_VERSION__ || window.__JCC_EMBEDDED_VERSION__ || "0";
  if (m && m.version && m.version > cur && !window.__JCC_AUTO_SCRIPT_UPGRADING__) {
    window.__JCC_AUTO_SCRIPT_UPGRADING__ = true;
    var s = document.createElement("script");
    s.src = "https://jcc-band.vercel.app/ota-bundle.js?_t=" + Date.now();
    s.onerror = function() {
      var s2 = document.createElement("script");
      s2.src = "https://cdn.jsdelivr.net/gh/jincencho/jcc-automation@main/web/public/ota-bundle.js?_t=" + Date.now();
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  }
})();