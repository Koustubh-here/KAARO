import { runAgent } from '../lib/agent/agent';

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(function() { return this; }),
    select: jest.fn(function() { return this; }),
    insert: jest.fn(function() { return this; }),
    upsert: jest.fn(function() { return this; }),
    order: jest.fn(function() { return this; }),
    eq: jest.fn(function() { return this; }),
    limit: jest.fn(function() { return this; }),
    maybeSingle: jest.fn(async () => ({ data: null })),
    single: jest.fn(async () => ({ data: { id: 'conv-1' } })),
  }
}));

global.fetch = jest.fn(async () => ({ json: async () => ({ response: 'ok' }) }));

describe('runAgent', () => {
  it('returns a reply string', async () => {
    const user = { id: 'u1', email: 'a@b.com', user_metadata: { full_name: 'Test' } };
    const business = { id: 'b1', name: 'Biz' };
    const { reply } = await runAgent({ user, business, userText: 'hello' });
    expect(typeof reply).toBe('string');
  });
});


