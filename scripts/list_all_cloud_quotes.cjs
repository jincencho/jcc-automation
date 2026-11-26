const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../web/node_modules/@supabase/supabase-js'));
const supabase = createClient('https://nuptkcozqdwirafrbfyx.supabase.co', 'sb_publishable_qEjEObM6m8ICxhY2d62Nog_-WIVl4A5');

(async () => {
  const { data, error } = await supabase
    .from('saved_quotes')
    .select('id, mode, title, customer_name, saved_at, updated_at, data')
    .order('saved_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const nonSystem = data.filter(q => !q.id.startsWith('__jcc_'));
  console.log(`Total non-system quotes: ${nonSystem.length}`);
  nonSystem.forEach(q => {
    const creator = q.data?.creatorId || q.data?.creatorName || 'unknown';
    console.log(`[${q.mode}] id: ${q.id} | title: ${q.title} | saved_at: ${q.saved_at} | updated_at: ${q.updated_at} | creator: ${creator}`);
  });
})();
