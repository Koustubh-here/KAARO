import { supabase } from '../supabaseClient';
import { PERPLEXITY_API_KEY } from '@env';
import { searchUserMemories, getUserProfile } from '../memory';
import { makeTools, ToolNames } from './tools';
import { getOrCreateBusinessForUser, listProducts, fuzzyFindProducts } from '../db';
import { buildToolPrompt } from './schema';
import { isExplicitDetailUpdate, extractKeyValueFromText } from './heuristics';

export async function ensureConversation(userId, businessId) {
  // Prefer a stable default conversation per user+business
  const { data: existing } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .eq('title', 'default')
    .maybeSingle();
  if (existing) return existing.id;

  // Fallback to most recent if any
  const { data: recent } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (recent) return recent.id;

  // Otherwise create default
  const { data: created } = await supabase
    .from('ai_conversations')
    .insert({ user_id: userId, business_id: businessId, title: 'default' })
    .select('id')
    .single();
  return created?.id;
}

export async function appendMessage(conversationId, role, content, tool_name = null) {
  await supabase.from('ai_messages').insert({ conversation_id: conversationId, role, content, tool_name });
}

async function loadRecentMessages(conversationId, limit = 30) {
  const { data } = await supabase
    .from('ai_messages')
    .select('role, content, tool_name, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []).reverse(); // Reverse to get chronological order
}

async function loadMemory(userId, businessId) {
  const { data } = await supabase
    .from('ai_memory')
    .select('key, value, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: true });
  const memory = {};
  (data || []).forEach(row => {
    let parsed = row.value;
    try { parsed = JSON.parse(row.value); } catch {}
    memory[row.key] = parsed;
  });
  return memory;
}

// Unified LLM caller: Prefer Perplexity (sonar) if API key is present; otherwise fallback to local Ollama
async function generateLLM(prompt, { model = 'gemma3:12b', temperature = 0.2, max_tokens = 512 } = {}) {
  // Try Perplexity first if key present
  if (PERPLEXITY_API_KEY) {
    try {
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            { role: 'system', content: 'You are KAARO assistant. Keep responses concise, plain text, no markdown.' },
            { role: 'user', content: prompt },
          ],
          temperature,
          max_tokens,
        }),
      });
      const json = await res.json().catch(() => null);
      const text = json?.choices?.[0]?.message?.content?.trim()
        || json?.choices?.[0]?.text?.trim()
        || json?.output?.trim()
        || json?.response
        || '';
      if (text) return { response: text };
    } catch (_) {
      // fall through to Ollama
    }
  }

  // Fallback to local Ollama-compatible endpoint (preserve previous behavior)
  try {
    const r = await fetch('http://localhost:11434/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false })
    });
    const j = await r.json().catch(() => null);
    if (j && (j.response || j.output)) {
      return { response: j.response || j.output };
    }
  } catch (_) {}
  return { response: '' };
}

// Only allow save_memory when the user explicitly states new personal/business facts
// isExplicitDetailUpdate imported from heuristics

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

  // Summarize transactions: phrases like "summarize today", "today's summary", "summary of transactions", "how did we do today"
  if (/summary|summarize|how did we do|how's today|overall/i.test(text)) {
    let scope = null;
    if (/today|today's|todays/i.test(text)) scope = 'today';
    else if (/overall|all|full/i.test(text)) scope = 'all';
    return { tool: ToolNames.SUMMARIZE_TRANSACTION, args: { scope } };
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

export async function runAgent({ user, business, userText, conversationId: providedConversationId = null }) {
  // Ensure business exists
  let ensuredBusiness = business;
  if (!ensuredBusiness?.id) {
    const { data: b } = await getOrCreateBusinessForUser(user);
    ensuredBusiness = b || ensuredBusiness;
  }

  const conversationId = providedConversationId || (await ensureConversation(user.id, ensuredBusiness?.id || null));
  await appendMessage(conversationId, 'user', userText);

  const tools = makeTools({ business: ensuredBusiness, userId: user?.id || null });

  // Upsert identity/business memory for first-class recall across all prompts
  try {
    await supabase.from('ai_memory').upsert([
      { user_id: user.id, key: 'user_profile', value: { id: user.id, name: user?.user_metadata?.full_name || null, email: user?.email || null } },
      { user_id: user.id, key: 'business_profile', value: { id: ensuredBusiness?.id || null, name: ensuredBusiness?.name || null } },
    ], { onConflict: 'user_id,key' });
  } catch {}

  // Load memory early so both tool planning and fallback can leverage it
  const memory = user?.id ? await loadMemory(user.id, ensuredBusiness?.id) : {};
  // Load structured profile (if any) and semantic memories relevant to this turn
  let structuredProfile = null;
  let semanticMemories = [];
    try {
      if (user?.id) {
        structuredProfile = await getUserProfile(user.id);
        semanticMemories = await searchUserMemories(user.id, userText, 8);
      }
    } catch {}

  // Build always-on profile context for LLM (no if/else identity answers)
  const profileContext = {
    user: {
      id: user?.id || null,
      name: user?.user_metadata?.full_name || null,
      email: user?.email || null,
    },
    business: {
      id: ensuredBusiness?.id || null,
      name: ensuredBusiness?.name || null,
    },
    memory,
    structuredProfile,
    semanticMemories,
  };

  // 1) Ask LLM for structured tool call
  const toolPlan = await generateLLM(
    `${buildToolPrompt(JSON.stringify(profileContext))}\nUser: ${userText}\nRespond with ONLY valid JSON for tool calls, or plain text if no tool applies. NO markdown, NO explanations.`,
    { model: 'gemma3:12b', temperature: 0 }
  );

  let planned = null;
  try {
  if (toolPlan?.response) {
      const response = toolPlan.response.trim();
      // First try direct JSON parsing
      try {
        planned = JSON.parse(response);
      } catch {
        // If that fails, look for JSON within the response
        const firstBrace = response.indexOf('{');
        const lastBrace = response.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const jsonStr = response.slice(firstBrace, lastBrace + 1);
          planned = JSON.parse(jsonStr);
        }
      }
    }
  } catch (e) {
    console.log('Tool planning JSON parse error:', e.message);
  }

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
    // Ignore over-eager save_memory suggestions unless the user explicitly provided details
    if (intent.tool === ToolNames.SAVE_MEMORY && !isExplicitDetailUpdate(userText)) {
      // fall through to normal conversational reply
    } else {
      // Execute tool
      const result = await tools[intent.tool](intent.args);

      // If summarization produced a textual summary, surface it directly
      if (intent.tool === ToolNames.SUMMARIZE_TRANSACTION && result?.summary) {
        const reply = result.summary;
        await appendMessage(conversationId, 'assistant', reply, intent.tool);
        return { reply };
      }

      // Dual-save: if the tool was save_memory or save_semantic_memory and the user explicitly provided details,
      // persist to the complementary store as well for robust cross-chat recall
      try {
        if (isExplicitDetailUpdate(userText)) {
          if (intent.tool === ToolNames.SAVE_MEMORY) {
            await tools[ToolNames.SAVE_SEMANTIC_MEMORY]({ text: userText });
          } else if (intent.tool === ToolNames.SAVE_SEMANTIC_MEMORY) {
            const kv = extractKeyValueFromText(userText);
            if (kv && kv.key) {
              await tools[ToolNames.SAVE_MEMORY]({ key: kv.key, value: kv.value });
            }
          }
        }
      } catch {}

      // Refresh memory after saving details so reply reflects latest
      if (intent.tool === ToolNames.SAVE_MEMORY) {
        profileContext.memory = await loadMemory(user.id, ensuredBusiness?.id);
      }

      // Ask LLM to compose the final user-facing response (no hardcoded text)
  const recentForReply = await loadRecentMessages(conversationId, 30);
  const historyForReply = recentForReply.map(m => `${m.role}: ${m.content}`).join('\n');
  const toolSummary = { tool: intent.tool, args: intent.args, success: !!(result && result.ok), result };

      const postTool = await generateLLM(
        `You are KAARO assistant. A tool was just executed. Compose a natural, conversational reply to the user about the completed action. Be concise and helpful. Use the user's name and business context when appropriate. If a tool returned a textual summary or concrete details, include those key points so the user sees what was summarized. NO markdown, NO code blocks.\n\nProfile: ${JSON.stringify(profileContext)}\n\nRecent conversation:\n${historyForReply}\n\nAction completed: ${JSON.stringify(toolSummary)}\n\nAssistant:`,
        { model: 'gemma3:12b' }
      ).catch(() => ({ response: toolSummary?.result?.summary || (toolSummary.success ? 'Done.' : 'Action failed.') }));

      const reply = postTool?.response || (toolSummary.success ? 'Done.' : 'Action failed.');
      await appendMessage(conversationId, 'assistant', reply, intent.tool);
      return { reply };
    }
  }

  // Fallback to LLM (Ollama) – keep local and simple, but with strong identity/business context
  // Load memory and short transcript
  const recent = await loadRecentMessages(conversationId, 30);
  const profile = `User: ${user?.user_metadata?.full_name || user?.email || user?.id}
Business: ${ensuredBusiness?.name || 'Unknown'} (${ensuredBusiness?.id || 'n/a'})`;
  const history = recent.map(m => `${m.role}: ${m.content}`).join('\n');

  const response = await generateLLM(
    `You are KAARO assistant helping ${user?.user_metadata?.full_name || 'the user'} with their business ${ensuredBusiness?.name || 'operations'}. Answer naturally and personally using the provided context. NO markdown, NO code blocks.\n\nProfile: ${JSON.stringify(profileContext)}\n\nConversation history:\n${history}\n\nUser: ${userText}\nAssistant:`,
    { model: 'gemma3:12b' }
  ).catch(() => ({ response: 'Sorry, I could not reach the AI service.' }));

  const reply = response?.response || 'Sorry, I had trouble answering.';
  // If user explicitly asked to remember/save this, write to semantic memory for persistence
  try {
    if (isExplicitDetailUpdate(userText) && user?.id) {
      const kv = extractKeyValueFromText(userText);
      const tools = makeTools({ business: ensuredBusiness, userId: user?.id || null });
      if (kv && kv.key) {
        await tools[ToolNames.SAVE_MEMORY]({ key: kv.key, value: kv.value });
      }
      await tools[ToolNames.SAVE_SEMANTIC_MEMORY]({ text: userText });
    }
  } catch {}
  await appendMessage(conversationId, 'assistant', reply);
  return { reply };
}


