const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nuptkcozqdwirafrbfyx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_qEjEObM6m8ICxhY2d62Nog_-WIVl4A5';

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'web/public');
const metaPath = path.join(publicDir, 'ota-meta.json');
const bundlePath = path.join(publicDir, 'ota-bundle.json');

async function upsertRow(rowPayload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/saved_quotes?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify(rowPayload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase upsert failed (${res.status}): ${errText}`);
  }
}

async function main() {
  if (!fs.existsSync(metaPath) || !fs.existsSync(bundlePath)) {
    console.error('OTA bundle files not found. Run build_offline_calculator.cjs first.');
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  const jsBundle = bundle.jsBundle || '';
  const css = bundle.css || '';

  const CHUNK_SIZE = 500000;
  const chunkCount = Math.ceil(jsBundle.length / CHUNK_SIZE);
  const nowIso = new Date().toISOString();

  console.log(`Publishing OTA Bundle v${meta.version} to Supabase Cloud (${chunkCount} chunks)...`);

  for (let i = 0; i < chunkCount; i++) {
    const jsChunk = jsBundle.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkId = `__jcc_ota_chunk_${String(i).padStart(2, '0')}__`;
    await upsertRow({
      id: chunkId,
      mode: 'system_ota_chunk',
      title: `JCC OTA Bundle Chunk #${i} (v${meta.version})`,
      customer_name: 'OTA_SYSTEM',
      saved_at: meta.builtAt,
      data: {
        version: meta.version,
        builtAt: meta.builtAt,
        index: i,
        totalChunks: chunkCount,
        css: i === 0 ? css : undefined,
        jsChunk
      },
      updated_at: nowIso
    });
    console.log(`  ✓ Uploaded chunk ${i + 1}/${chunkCount} (${(jsChunk.length / 1024).toFixed(1)} KB)`);
  }

  // 마지막으로 메타데이터 행 업데이트 (클라이언트가 모든 청크 업로드 완료 후 새 버전을 감지하도록)
  await upsertRow({
    id: '__jcc_ota_meta_v1__',
    mode: 'system_ota_meta',
    title: `JCC OTA Latest Metadata (v${meta.version})`,
    customer_name: 'OTA_SYSTEM',
    saved_at: meta.builtAt,
    data: {
      version: meta.version,
      builtAt: meta.builtAt,
      chunkCount,
      jsLength: jsBundle.length,
      cssLength: css.length,
      publishedAt: nowIso
    },
    updated_at: nowIso
  });

  console.log(`✅ Successfully published OTA Bundle v${meta.version} to Supabase Cloud!`);
}

main().catch((err) => {
  console.error('OTA Publish Error:', err.message);
  process.exit(1);
});
