import { supabase } from './supabaseClient';
import { generateEmbedding } from './embeddingService';

export async function saveUserMemory(userId, memoryText) {
  if (!userId) throw new Error('userId required');
  if (!memoryText) throw new Error('memoryText required');
  const embedding = await generateEmbedding(memoryText);
  const { data, error } = await supabase
    .from('user_memories')
    .insert([{ user_id: userId, memory_text: memoryText, embedding }])
    .select()
    .single();
  if (error) throw error;
  // Log write (best-effort)
  try { await supabase.from('ai_memory_logs').insert({ user_id: userId, action: 'write', key: 'user_memories' }); } catch {}
  return data;
}

export async function searchUserMemories(userId, query, limit = 5) {
  if (!userId) throw new Error('userId required');
  if (!query) return [];
  const queryEmbedding = await generateEmbedding(query);
  const { data, error } = await supabase.rpc('match_user_memories', {
    query_embedding: queryEmbedding,
    match_count: limit,
    p_user_id: userId,
  });
  if (error) throw error;
  try { await supabase.from('ai_memory_logs').insert({ user_id: userId, action: 'read', key: 'user_memories' }); } catch {}
  return data || [];
}

export async function getUserProfile(userId) {
  if (!userId) throw new Error('userId required');
  const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function upsertUserProfile(userId, payload) {
  if (!userId) throw new Error('userId required');
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({ user_id: userId, ...payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function exportAllMemories(userId) {
  if (!userId) throw new Error('userId required');
  const [{ data: kv }, { data: semantic }] = await Promise.all([
    supabase.from('ai_memory').select('key, value').eq('user_id', userId),
    supabase.from('user_memories').select('memory_text, created_at').eq('user_id', userId),
  ]);
  return { kv: kv || [], semantic: semantic || [] };
}

export async function deleteAllMemories(userId) {
  if (!userId) throw new Error('userId required');
  await supabase.from('ai_memory').delete().eq('user_id', userId);
  await supabase.from('user_memories').delete().eq('user_id', userId);
  return { ok: true };
}


