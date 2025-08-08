import { supabase } from './supabaseClient';

// Business
export async function getOrCreateBusinessForUser(user) {
  if (!user) return { data: null, error: new Error('No user') };
  const { data: existing, error: fetchError } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_user', user.id)
    .maybeSingle();
  if (fetchError && fetchError.code !== 'PGRST116') return { data: null, error: fetchError };
  if (existing) return { data: existing, error: null };
  const defaultName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'My Business';
  const { data, error } = await supabase
    .from('businesses')
    .insert({ owner_user: user.id, name: defaultName })
    .select()
    .single();
  return { data, error };
}

// Products
export async function listProducts(businessId) {
  return supabase.from('products').select('*').eq('business_id', businessId).order('created_at', { ascending: false });
}

export async function createProduct(businessId, payload) {
  const { name, stock, quantity, image } = payload || {};
  return supabase
    .from('products')
    .insert({ business_id: businessId, name, quantity: quantity ?? Number(stock || 0), image: image || null })
    .select()
    .single();
}

export async function updateProduct(productId, payload) {
  // Normalize stock -> quantity
  const normalized = { ...payload };
  if (typeof normalized.stock !== 'undefined') {
    normalized.quantity = Number(normalized.stock || 0);
    delete normalized.stock;
  }
  return supabase.from('products').update(normalized).eq('id', productId).select().single();
}

// Transactions
export async function listTransactions(businessId, { type } = {}) {
  let query = supabase.from('transactions').select('*').eq('business_id', businessId).order('date', { ascending: false });
  if (type) {
    query = query.eq('type', type);
  }
  return query;
}

export async function createTransaction(businessId, payload) {
  return supabase.from('transactions').insert({ business_id: businessId, ...payload }).select().single();
}

export async function sumTransactions(businessId) {
  const { data: income, error: incErr } = await supabase
    .from('transactions')
    .select('amount')
    .eq('business_id', businessId)
    .eq('type', 'income');
  const { data: expenses, error: expErr } = await supabase
    .from('transactions')
    .select('amount')
    .eq('business_id', businessId)
    .eq('type', 'expense');
  return {
    data: {
      income: (income || []).reduce((s, r) => s + Number(r.amount || 0), 0),
      expenses: (expenses || []).reduce((s, r) => s + Number(r.amount || 0), 0),
    },
    error: incErr || expErr || null,
  };
}


