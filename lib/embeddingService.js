// Embedding service using Ollama local API
// Model: nomic-embed-text (768 dims)

export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') throw new Error('Text required for embedding');
  // Ollama embeddings endpoint
  const body = {
    model: 'nomic-embed-text',
    input: text, // Ollama embeddings expects `input`, not `prompt`
  };
  const res = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!res) throw new Error('Embedding service not reachable');
  const json = await res.json();
  const vector = json?.embedding || json?.data?.[0]?.embedding || null;
  if (!Array.isArray(vector) || vector.length === 0) throw new Error('Invalid embedding response');
  return vector;
}


