/*
 E2E memory test (Node)
 Usage:
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TEST_USER_ID=... node scripts/memory-e2e.js
 Requires:
   - Running Ollama at http://localhost:11434 with model nomic-embed-text pulled
   - TEST_USER_ID must exist in auth.users
*/

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const TEST_USER_ID = process.env.TEST_USER_ID;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}
if (!TEST_USER_ID) {
  console.error('Missing TEST_USER_ID in env. Provide an auth.users id to test against.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

async function embed(text) {
  const res = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'nomic-embed-text', input: text }),
  });
  const json = await res.json();
  const v = json?.embedding || json?.data?.[0]?.embedding;
  if (!Array.isArray(v)) throw new Error('Invalid embedding');
  return v;
}

async function run() {
  console.log('--- E2E Memory Test ---');
  const fact = 'My favorite color is red';
  const query = "What's my favorite color?";

  // Cleanup
  await supabase.from('ai_memory').delete().eq('user_id', TEST_USER_ID);
  await supabase.from('user_memories').delete().eq('user_id', TEST_USER_ID);

  // Write KV
  await supabase.from('ai_memory').upsert({ user_id: TEST_USER_ID, key: 'favorite_color', value: 'red' }, { onConflict: 'user_id,key' });

  // Write semantic
  const emb = await embed(fact);
  await supabase.from('user_memories').insert({ user_id: TEST_USER_ID, memory_text: fact, embedding: emb });

  // Read back KV
  const { data: kvRows } = await supabase.from('ai_memory').select('key, value').eq('user_id', TEST_USER_ID);
  console.log('KV rows:', kvRows);

  // Semantic match
  const { data: matches, error: matchErr } = await supabase.rpc('match_user_memories', {
    query_embedding: await embed(query),
    match_count: 3,
    p_user_id: TEST_USER_ID,
  });
  if (matchErr) throw matchErr;
  console.log('Semantic matches:', matches);

  const passKV = !!(kvRows || []).find(r => r.key === 'favorite_color' && (r.value === 'red' || r.value?.toString() === 'red'));
  const passSem = (matches || []).some(m => (m.memory_text || '').toLowerCase().includes('favorite color'));

  console.log('KV check:', passKV ? 'OK' : 'FAIL');
  console.log('Semantic check:', passSem ? 'OK' : 'FAIL');

  if (!passKV || !passSem) process.exit(2);
  console.log('E2E memory test passed.');
}

run().catch(e => { console.error(e); process.exit(1); });


