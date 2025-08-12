import { generateEmbedding } from '../lib/embeddingService';

describe('embeddingService', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ embedding: Array(768).fill(0.01) }),
    });
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns an embedding array', async () => {
    const v = await generateEmbedding('hello world');
    expect(Array.isArray(v)).toBe(true);
    expect(v.length).toBeGreaterThan(10);
  });
});


