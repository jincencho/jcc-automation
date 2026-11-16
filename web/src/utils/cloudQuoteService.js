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
