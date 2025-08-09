import { supabase } from '../supabaseClient';
import { makeTools, ToolNames } from './tools';
import { getOrCreateBusinessForUser, listProducts, fuzzyFindProducts } from '../db';
import { buildToolPrompt } from './schema';

export async function ensureConversation(userId, businessId) {
  const { data } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data) return data.id;
  const { data: created } = await supabase
    .from('ai_conversations')
    .insert({ user_id: userId, business_id: businessId, title: 'Assistant' })
    .select('id')
    .single();
  return created?.id;
}

export async function appendMessage(conversationId, role, content, tool_name = null) {
  await supabase.from('ai_messages').insert({ conversation_id: conversationId, role, content, tool_name });
}

async function loadRecentMessages(conversationId, limit = 10) {
  const { data } = await supabase
    .from('ai_messages')
    .select('role, content, tool_name, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  return data || [];
}

async function loadMemory(userId, businessId) {
  const { data } = await supabase
    .from('ai_memory')
    .select('key, value')
    .eq('user_id', userId);
  const memory = {};
  (data || []).forEach(row => { memory[row.key] = row.value; });
  return memory;
}

// Naive intent parser for demo: extract structured intents from free text
function parseIntent(text) {
  const lower = text.toLowerCase();
  const cleaned = lower.replace(/,/g, '');

  // Patterns for add transaction
  const patterns = [
    /(add|record|log)\s+(an?\s+)?(expense|income)\s+(of\s+)?([0-9]+(?:\.[0-9]+)?)\s*(rs|inr|₹)?/,
    /(add|record|log)\s+([0-9]+(?:\.[0-9]+)?)\s*(rs|inr|₹)?\s*(as\s+)?(an?\s+)?(expense|income)/,
    /^(expense|income)\s+([0-9]+(?:\.[0-9]+)?)/,
  ];
  for (const re of patterns) {
    const m = cleaned.match(re);
    if (m) {
      // Determine capture positions for type and amount across patterns
      let type = m[3] || m[6] || m[1];
      let amountStr = m[5] || m[2] || m[2];
      if (type === 'add' || type === 'record' || type === 'log') type = m[3] || m[6];
      const amount = parseFloat(amountStr);
      // Try category from "for <text>"
      const cat = cleaned.match(/for\s+([a-z0-9 ._\-]+)/i)?.[1];
      return {
        tool: ToolNames.ADD_TRANSACTION,
        args: {
          type,
          amount,
          description: text,
          category: cat ? cat.trim() : null,
        },
      };
    }
  }

  // Add product: "add product NAME, QTY" or "add product NAME qty QTY"
  const addProduct = cleaned.match(/add\s+product\s+([^,]+?)(?:,\s*(\d+)|\s+qty\s+(\d+))?/);
  if (addProduct) {
    return {
      tool: ToolNames.ADD_PRODUCT,
      args: { name: addProduct[1].trim(), stock: Number(addProduct[2] || addProduct[3] || 0) },
    };
  }

  // Update stock: allow spaces in name
  const updateStock = cleaned.match(/update\s+stock\s+of\s+(.+?)\s+to\s+(\d+)/);
  if (updateStock) {
    return {
      tool: ToolNames.UPDATE_STOCK,
      args: { product_name: updateStock[1].trim(), stock: Number(updateStock[2]) },
    };
  }
  return null;
}

export async function runAgent({ user, business, userText }) {
  // Ensure business exists
  let ensuredBusiness = business;
  if (!ensuredBusiness?.id) {
    const { data: b } = await getOrCreateBusinessForUser(user);
    ensuredBusiness = b || ensuredBusiness;
  }

  const conversationId = await ensureConversation(user.id, ensuredBusiness?.id || null);
  await appendMessage(conversationId, 'user', userText);

  const tools = makeTools({ business: ensuredBusiness, userId: user?.id || null });

  // 1) Ask LLM for structured tool call
  const toolPlan = await fetch('http://localhost:11434/api/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gemma3:12b', prompt: `${buildToolPrompt()}\nUser: ${userText}\nReturn only JSON if you choose a tool.`, stream: false })
  }).then(r => r.json()).catch(() => null);

  let planned = null;
  try {
    if (toolPlan?.response) {
      const firstBrace = toolPlan.response.indexOf('{');
      const lastBrace = toolPlan.response.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        planned = JSON.parse(toolPlan.response.slice(firstBrace, lastBrace + 1));
      }
    }
  } catch {}

  let intent = planned;
  if (!intent || !intent.tool || !tools[intent.tool]) {
    // 2) Fallback to regex intent
    intent = parseIntent(userText);
  }
  if (intent && tools[intent.tool]) {
    // Support name-based product lookup for UPDATE_STOCK
    if (intent.tool === ToolNames.UPDATE_STOCK && intent.args.product_name && !intent.args.product_id) {
      // Try fuzzy search first
      const { data: fuzzy } = await fuzzyFindProducts(ensuredBusiness?.id, intent.args.product_name);
      const candidate = (fuzzy && fuzzy.length > 0) ? fuzzy[0] : null;
      if (candidate) intent.args.product_id = candidate.id;
      else {
        const { data: prods } = await listProducts(ensuredBusiness?.id);
        const match = (prods || []).find(p => (p.name || '').toLowerCase() === intent.args.product_name.toLowerCase());
        if (match) intent.args.product_id = match.id;
      }
      delete intent.args.product_name;
    }
    // Special case: update stock by product name would need a lookup (omitted for brevity)
    const result = await tools[intent.tool](intent.args);
    const reply = result?.ok ? 'Done.' : 'I could not perform that action.';
    await appendMessage(conversationId, 'assistant', reply, intent.tool);
    return { reply };
  }

  // Fallback to LLM (Ollama) – keep local and simple
  // Load memory and short transcript
  const recent = await loadRecentMessages(conversationId, 12);
  const memory = user?.id ? await loadMemory(user.id, ensuredBusiness?.id) : {};
  const profile = `User: ${user?.user_metadata?.full_name || user?.email || user?.id}
Business: ${ensuredBusiness?.name || 'Unknown'} (${ensuredBusiness?.id || 'n/a'})`;
  const history = recent.map(m => `${m.role}: ${m.content}`).join('\n');

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma3:12b',
      prompt: `You are KAARO assistant. Use tools only if explicitly instructed in the app (the app handles actions).\n${profile}\nMemory: ${JSON.stringify(memory)}\n---\nRecent messages:\n${history}\n---\nUser: ${userText}\nAssistant:`,
      stream: false,
    }),
  }).then(r => r.json()).catch(() => ({ response: 'Sorry, I could not reach the AI service.' }));

  const reply = response?.response || 'Sorry, I had trouble answering.';
  await appendMessage(conversationId, 'assistant', reply);
  return { reply };
}


