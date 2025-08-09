export const ToolNames = {
  ADD_TRANSACTION: 'add_transaction',
  ADD_PRODUCT: 'add_product',
  UPDATE_STOCK: 'update_stock',
  SAVE_MEMORY: 'save_memory',
};

import { createTransaction, createProduct, updateProduct } from '../db';
import { supabase } from '../supabaseClient';

export function makeTools({ business, userId }) {
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

  return {
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
  };
}


