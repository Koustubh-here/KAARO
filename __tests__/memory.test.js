import * as memory from '../lib/memory';

jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockResolvedValue({ data: [] }),
  }
}));

jest.mock('../lib/embeddingService', () => ({
  generateEmbedding: jest.fn().mockResolvedValue(Array(768).fill(0.02)),
}));

describe('memory utils', () => {
  it('searchUserMemories calls RPC', async () => {
    const results = await memory.searchUserMemories('user-1', 'blue');
    expect(Array.isArray(results)).toBe(true);
  });
});


