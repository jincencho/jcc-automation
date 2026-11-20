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
    const payload = {
      id: USER_ACCOUNTS_DOC_ID,
      mode: 'system_auth',
      title: 'JCC 계산기 접속 계정 및 레벨 권한 설정',
      customer_name: 'ADMIN_SYSTEM',
      saved_at: nowIso.slice(0, 16).replace('T', ' '),
      data: {
        accounts: Array.isArray(accounts) ? accounts : [],
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
