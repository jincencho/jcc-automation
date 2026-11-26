const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../web/node_modules/@supabase/supabase-js'));
const supabase = createClient('https://nuptkcozqdwirafrbfyx.supabase.co', 'sb_publishable_qEjEObM6m8ICxhY2d62Nog_-WIVl4A5');

(async () => {
  console.log('1. Cleaning up test quotes from Supabase...');
  
  // Find test quotes
  const { data: allQuotes, error: fetchErr } = await supabase
    .from('saved_quotes')
    .select('id, mode, title, customer_name, saved_at, updated_at');
    
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    return;
  }

  const testIds = [];
  for (const q of allQuotes) {
    if (q.id.startsWith('__jcc_')) continue;
    const title = q.title || '';
    const cust = q.customer_name || '';
    if (
      title.includes('테스트') ||
      title.toLowerCase().includes('test') ||
      title.includes('홍길동') ||
      cust.includes('테스트') ||
      cust.includes('홍길동')
    ) {
      testIds.push(q.id);
      console.log(`- Deleting test quote: [${q.id}] ${q.title} (${q.customer_name})`);
    }
  }

  if (testIds.length > 0) {
    const { error: delErr } = await supabase
      .from('saved_quotes')
      .delete()
      .in('id', testIds);
    if (delErr) console.error('Delete error:', delErr);
    else console.log(`✓ Deleted ${testIds.length} test quotes.`);
  } else {
    console.log('No test quotes found to delete.');
  }

  // 2. Fix updated_at for quotes from 2026-11-08 / 2026-11-09 / 2026-11-12 / etc. that got wrongly bumped to 2026-11-26
  console.log('\n2. Restoring original updated_at timestamps for older quotes...');
  for (const q of allQuotes) {
    if (q.id.startsWith('__jcc_')) continue;
    if (testIds.includes(q.id)) continue;

    // Check if saved_at is in mid-November but updated_at was bumped to 2026-11-26
    if (q.saved_at && q.saved_at.startsWith('2026-11-0') || q.saved_at.startsWith('2026-11-1')) {
      if (q.updated_at && q.updated_at.startsWith('2026-11-26')) {
        // Convert '2026-11-08 17:41' to ISO '2026-11-08T08:41:00.000Z'
        const parts = q.saved_at.split(' ');
        const datePart = parts[0];
        const timePart = parts[1] || '12:00';
        const originalIso = new Date(`${datePart}T${timePart}:00+09:00`).toISOString();
        console.log(`- Restoring timestamp for [${q.id}] ${q.title}: ${q.updated_at} -> ${originalIso}`);
        const { error: updateErr } = await supabase
          .from('saved_quotes')
          .update({ updated_at: originalIso })
          .eq('id', q.id);
        if (updateErr) console.error(`Error updating [${q.id}]:`, updateErr);
      }
    }
  }

  console.log('\n✓ Supabase database cleanup & timestamp restoration complete!');
})();
