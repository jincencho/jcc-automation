import { supabase, isSupabaseConfigured } from '../supabase.js';

/**
 * 클라우드(Supabase)에서 견적 목록 불러오기
 * @param {'mixed' | 'compare'} mode
 */
export async function fetchCloudQuotes(mode) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, data: [], error: 'Supabase가 설정되지 않았습니다.' };
  }
  try {
    const { data, error } = await supabase
      .from('saved_quotes')
      .select('*')
      .eq('mode', mode)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[CloudQuotes] Fetch error:', error);
      return { success: false, data: [], error: error.message };
    }

    const formatted = (data || []).map((row) => ({
      id: row.id,
      mode: row.mode,
      title: row.title,
      customerName: row.customer_name || '',
      savedAt: row.saved_at || '',
      data: row.data || {},
      updatedAt: row.updated_at
    }));

    return { success: true, data: formatted };
  } catch (err) {
    console.error('[CloudQuotes] Fetch exception:', err);
    return { success: false, data: [], error: err.message };
  }
}

/**
 * 클라우드(Supabase)에 견적 저장 또는 덮어쓰기 (upsert)
 * @param {object} quoteSnapshot
 */
export async function saveCloudQuote(quoteSnapshot) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase 미설정' };
  }
  try {
    const payload = {
      id: quoteSnapshot.id,
      mode: quoteSnapshot.mode || 'mixed',
      title: quoteSnapshot.title || '견적서',
      customer_name: quoteSnapshot.customerName || '',
      saved_at: quoteSnapshot.savedAt || '',
      data: quoteSnapshot.data || {},
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('saved_quotes')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[CloudQuotes] Save error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[CloudQuotes] Save exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 클라우드(Supabase)에서 견적 삭제
 * @param {string} id
 */
export async function deleteCloudQuote(id) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase 미설정' };
  }
  try {
    const { error } = await supabase
      .from('saved_quotes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[CloudQuotes] Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[CloudQuotes] Delete exception:', err);
    return { success: false, error: err.message };
  }
}

const USER_ACCOUNTS_DOC_ID = '__jcc_user_accounts_v1__';
const AUTH_PW_SALT = 'JCC_AUTH_SECURE_SALT_2026_V2';
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function computeSha256Hex(str) {
  const bytes = new TextEncoder().encode(String(str));
  const bitLen = bytes.length * 8;
  const padLen = (bytes.length + 9 + 63) & ~63;
  const buf = new Uint8Array(padLen);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(padLen - 4, bitLen >>> 0, false);
  view.setUint32(padLen - 8, Math.floor(bitLen / 4294967296) >>> 0, false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let i = 0; i < padLen; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = view.getUint32(i + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const s0 = ((w[t - 15] >>> 7) | (w[t - 15] << 25)) ^ ((w[t - 15] >>> 18) | (w[t - 15] << 14)) ^ (w[t - 15] >>> 3);
      const s1 = ((w[t - 2] >>> 17) | (w[t - 2] << 15)) ^ ((w[t - 2] >>> 19) | (w[t - 2] << 13)) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA256_K[t] + w[t]) >>> 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>>0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7].map((v) => v.toString(16).padStart(8, '0')).join('');
}

function ensureHashedAccountList(accounts) {
  if (!Array.isArray(accounts)) return [];
  return accounts.map((acc) => {
    if (!acc || typeof acc !== 'object') return acc;
    const rawPw = String(acc.pw ?? '').trim();
    const isHashed = /^sha256\$[0-9a-f]{64}$/i.test(rawPw);
    const cleanId = String(acc.id ?? '').trim().toLowerCase();
    const safePw = isHashed
      ? rawPw.toLowerCase()
      : (rawPw ? `sha256$${computeSha256Hex(`${AUTH_PW_SALT}::${cleanId}::${rawPw}`)}` : '');
    return {
      ...acc,
      pw: safePw
    };
  });
}

/**
 * 클라우드(Supabase)에서 접속자 계정 및 권한(Lv.1 / Lv.2 / Admin) 설정 불러오기
 */
export async function fetchCloudUserAccounts() {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, accounts: null, error: 'Supabase 미설정' };
  }
  try {
    const { data, error } = await supabase
      .from('saved_quotes')
      .select('*')
      .eq('id', USER_ACCOUNTS_DOC_ID)
      .maybeSingle();

    if (error) {
      console.error('[CloudAuth] Fetch error:', error);
      return { success: false, accounts: null, error: error.message };
    }

    if (data && data.data && Array.isArray(data.data.accounts)) {
      return {
        success: true,
        accounts: data.data.accounts,
        updatedAt: data.updated_at
      };
    }

    return { success: true, accounts: null };
  } catch (err) {
    console.error('[CloudAuth] Fetch exception:', err);
    return { success: false, accounts: null, error: err.message };
  }
}

/**
 * 클라우드(Supabase)에 접속자 계정 및 권한 설정 저장 (로컬/HTML/온라인 실시간 통합 동기화)
 * @param {Array} accounts
 */
export async function saveCloudUserAccounts(accounts) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase 미설정' };
  }
  try {
    const nowIso = new Date().toISOString();
    const hashedAccounts = ensureHashedAccountList(accounts);
    const payload = {
      id: USER_ACCOUNTS_DOC_ID,
      mode: 'system_auth',
      title: 'JCC 계산기 접속 계정 및 레벨 권한 설정',
      customer_name: 'ADMIN_SYSTEM',
      saved_at: nowIso.slice(0, 16).replace('T', ' '),
      data: {
        accounts: hashedAccounts,
        updatedAt: nowIso
      },
      updated_at: nowIso
    };

    const { error } = await supabase
      .from('saved_quotes')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[CloudAuth] Save error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, updatedAt: nowIso };
  } catch (err) {
    console.error('[CloudAuth] Save exception:', err);
    return { success: false, error: err.message };
  }
}
