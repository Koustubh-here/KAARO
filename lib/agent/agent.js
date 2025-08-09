import { supabase } from '../supabaseClient';
import { makeTools, ToolNames } from './tools';
import { getOrCreateBusinessForUser, listProducts, fuzzyFindProducts } from '../db';
import { buildToolPrompt } from './schema';

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
    .select('key, value')
    .eq('user_id', userId);
  const memory = {};
  (data || []).forEach(row => { memory[row.key] = row.value; });
  return memory;
}

// Only allow save_memory when the user explicitly states new personal/business facts
function isExplicitDetailUpdate(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  const patterns = [
    /\b(my name is|i am|call me)\b/,
    /\b(my (shop|store|business|company)( name)? is|call my (shop|store|business|company))\b/,
    /\b(my phone( number)? is|phone is|contact number is)\b/,
    /\b(my email is|email is)\b/,
    /\b(my address is|address is|located at)\b/,
    /\b(set|update)\s+my\s+(name|business|shop|store|company|phone|email|address)\b/,
  ];
  return patterns.some(re => re.test(t));
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

  // Upsert identity/business memory for first-class recall across all prompts
  try {
    await supabase.from('ai_memory').upsert(
      [
        { user_id: user.id, key: 'user_profile', value: { id: user.id, name: user?.user_metadata?.full_name || null, email: user?.email || null } },
        { user_id: user.id, key: 'business_profile', value: { id: ensuredBusiness?.id || null, name: ensuredBusiness?.name || null } },
      ],
      { onConflict: 'user_id,key' }
    );
  } catch {}

  // Load memory early so both tool planning and fallback can leverage it
  const memory = user?.id ? await loadMemory(user.id, ensuredBusiness?.id) : {};

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
  };

  // 1) Ask LLM for structured tool call
  const toolPlan = await fetch('http://localhost:11434/api/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      model: 'gemma3:12b', 
      prompt: `${buildToolPrompt(JSON.stringify(profileContext))}\nUser: ${userText}\nRespond with ONLY valid JSON for tool calls, or plain text if no tool applies. NO markdown, NO explanations.`, 
      stream: false 
    })
  }).then(r => r.json()).catch(() => null);

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

      // Refresh memory after saving details so reply reflects latest
      if (intent.tool === ToolNames.SAVE_MEMORY) {
        profileContext.memory = await loadMemory(user.id, ensuredBusiness?.id);
      }

      // Ask LLM to compose the final user-facing response (no hardcoded text)
      const recentForReply = await loadRecentMessages(conversationId, 30);
      const historyForReply = recentForReply.map(m => `${m.role}: ${m.content}`).join('\n');
      const toolSummary = { tool: intent.tool, args: intent.args, success: !!(result && result.ok) };

      const postTool = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:12b',
          prompt: `You are KAARO assistant. A tool was just executed. Compose a natural, conversational reply to the user about the completed action. Be concise and helpful. Use the user's name and business context when appropriate. NO markdown, NO code blocks.\n\nProfile: ${JSON.stringify(profileContext)}\n\nRecent conversation:\n${historyForReply}\n\nAction completed: ${JSON.stringify(toolSummary)}\n\nAssistant:`,
          stream: false,
        }),
      }).then(r => r.json()).catch(() => ({ response: toolSummary.success ? 'Done.' : 'Action failed.' }));

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

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma3:12b',
      prompt: `You are KAARO assistant helping ${user?.user_metadata?.full_name || 'the user'} with their business ${ensuredBusiness?.name || 'operations'}. Answer naturally and personally using the provided context. When users share new details about themselves or their business, suggest they can save it for future reference. NO markdown, NO code blocks.\n\nProfile: ${JSON.stringify(profileContext)}\n\nConversation history:\n${history}\n\nUser: ${userText}\nAssistant:`,
      stream: false,
    }),
  }).then(r => r.json()).catch(() => ({ response: 'Sorry, I could not reach the AI service.' }));

  const reply = response?.response || 'Sorry, I had trouble answering.';
  await appendMessage(conversationId, 'assistant', reply);
  return { reply };
}


