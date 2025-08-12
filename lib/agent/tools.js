export const ToolNames = {
  ADD_TRANSACTION: 'add_transaction',
  ADD_PRODUCT: 'add_product',
  UPDATE_STOCK: 'update_stock',
  SAVE_MEMORY: 'save_memory',
  SAVE_SEMANTIC_MEMORY: 'save_semantic_memory',
  SUMMARIZE_TRANSACTION: 'summarize_transaction',
};

import { createTransaction, createProduct, updateProduct } from '../db';
import { saveUserMemory } from '../memory';
import { supabase } from '../supabaseClient';

export function makeTools({ business, userId }, extraTools = {}) {
  const parseAmount = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[,\s₹rsinr]/gi, '');
      const num = Number(cleaned);
      if (!Number.isFinite(num)) throw new Error('Invalid amount');
      return num;
    }
    throw new Error('Invalid amount');
  };

  const builtIns = {
    [ToolNames.ADD_TRANSACTION]: async ({ type, amount, description, category, date }) => {
      if (!business?.id) throw new Error('No business selected');
      const normalizedType = (type || '').toString().toLowerCase().includes('exp') ? 'expense' : 'income';
      const amt = parseAmount(typeof amount === 'undefined' ? 0 : amount);
      const payload = {
        type: normalizedType,
        amount: amt,
        description: description || (type === 'expense' ? 'Expense' : 'Income'),
        category: category || null,
        date: date || new Date().toISOString().slice(0, 10),
      };
      const { data, error } = await createTransaction(business.id, payload);
      if (error) throw error;
      if (!data) throw new Error('Insert succeeded but row not visible (RLS select policy missing)');
      return { ok: true };
  },

    [ToolNames.ADD_PRODUCT]: async ({ name, stock, quantity, image }) => {
      if (!business?.id) throw new Error('No business selected');
      const { data, error } = await createProduct(business.id, { name, stock: Number(quantity ?? stock ?? 0), image: image || null });
      if (error) throw error;
      if (!data) throw new Error('Insert succeeded but row not visible (RLS select policy missing)');
      return { ok: true };
    },

    [ToolNames.UPDATE_STOCK]: async ({ product_id, stock, quantity }) => {
      const { data, error } = await updateProduct(product_id, { stock: Number(quantity ?? stock ?? 0) });
      if (error) throw error;
      if (!data) throw new Error('Update succeeded but row not visible (RLS select policy missing)');
      return { ok: true };
    },

    [ToolNames.SAVE_MEMORY]: async ({ key, value }) => {
      if (!userId) throw new Error('No user');
      const { error } = await supabase
        .from('ai_memory')
        .upsert({ user_id: userId, key, value }, { onConflict: 'user_id,key' });
      if (error) throw error;
      return { ok: true };
    },

    [ToolNames.SAVE_SEMANTIC_MEMORY]: async ({ text }) => {
      if (!userId) throw new Error('No user');
      await saveUserMemory(userId, text);
      return { ok: true };
    },

    // Summarize a transaction or list of transactions. If not provided, can fetch by scope: 'today' or 'all'.
    [ToolNames.SUMMARIZE_TRANSACTION]: async ({ transactions, scope } = {}) => {
      const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
      let tx = Array.isArray(transactions) ? transactions : null;
      if (!tx) {
        // Fetch based on scope if possible
        if (!business?.id) throw new Error('No business selected');
        let query = supabase
          .from('transactions')
          .select('id, type, amount, category, description, date, created_at')
          .eq('business_id', business.id)
          .order('date', { ascending: false });
        if ((scope || '').toLowerCase() === 'today') {
          const today = new Date();
          const d = today.toISOString().slice(0, 10);
          query = query.eq('date', d);
        }
        const { data, error } = await query;
        if (error) throw error;
        tx = data || [];
      }

      if (!tx.length) {
        const label = (scope || '').toLowerCase() === 'today' ? 'today' : 'so far';
        return { ok: true, summary: `No transactions ${label}.` };
      }

      // Compute totals and basic breakdown
      let income = 0, expense = 0;
      const byCategory = {};
      for (const t of tx) {
        const amt = Number(t.amount || 0);
        if ((t.type || '').toLowerCase() === 'income') income += amt; else expense += amt;
        const cat = (t.category || 'Uncategorized');
        byCategory[cat] = (byCategory[cat] || 0) + amt;
      }
      const net = income - expense;
      const topCats = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([c, v]) => `${c} (${fmtCurrency(v)})`)
        .join(', ');

      // Find last few items for flavor
      const recent = tx.slice(0, 3).map((t) => {
        const sign = (t.type || '').toLowerCase() === 'income' ? '+' : '-';
        const when = t.date || t.created_at;
        return `${sign}${fmtCurrency(t.amount)} ${t.description || t.category || ''} on ${new Date(when).toDateString()}`.trim();
      });

      const header = (scope || '').toLowerCase() === 'today' ? 'Today' : 'Overall';
      const summary = [
        `${header} summary: ${tx.length} transaction${tx.length > 1 ? 's' : ''}.`,
        `Income ${fmtCurrency(income)}, Expenses ${fmtCurrency(expense)}, Net ${fmtCurrency(net)}.`,
        topCats ? `Top categories: ${topCats}.` : null,
        recent.length ? `Recent: ${recent.join('; ')}.` : null,
      ].filter(Boolean).join(' ');

      return { ok: true, summary };
    },
  };
  // Hook: allow caller to extend or override tools
  return { ...builtIns, ...extraTools };
}


