export const toolSchemas = {
  add_transaction: {
    name: 'add_transaction',
    description: 'Add an income or expense transaction',
    schema: {
      type: 'object',
      required: ['type', 'amount'],
      properties: {
        type: { type: 'string', enum: ['income', 'expense'] },
        amount: { type: 'number', minimum: 0 },
        description: { type: 'string' },
        category: { type: 'string' },
        date: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  add_product: {
    name: 'add_product',
    description: 'Create a new product',
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1 },
        quantity: { type: 'number', minimum: 0 },
        stock: { type: 'number', minimum: 0 },
        image: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  update_stock: {
    name: 'update_stock',
    description: 'Update product stock by id or name',
    schema: {
      type: 'object',
      properties: {
        product_id: { type: 'string' },
        product_name: { type: 'string' },
        quantity: { type: 'number', minimum: 0 },
        stock: { type: 'number', minimum: 0 },
      },
      additionalProperties: false,
    },
  },
  save_memory: {
    name: 'save_memory',
    description: 'Save a key/value into user memory',
    schema: {
      type: 'object',
      required: ['key', 'value'],
      properties: {
        key: { type: 'string', minLength: 1 },
        value: {},
      },
      additionalProperties: false,
    },
  },
  save_semantic_memory: {
    name: 'save_semantic_memory',
    description: 'Save a free-text memory to the user\'s semantic memory store',
    schema: {
      type: 'object',
      required: ['text'],
      properties: {
        text: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
    },
  },
  summarize_transaction: {
    name: 'summarize_transaction',
    description: 'Summarize transactions for today or overall; can accept a provided list or fetch from DB using scope',
    schema: {
      type: 'object',
      properties: {
        transactions: { type: 'array', items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            amount: { type: 'number' },
            category: { type: 'string' },
            description: { type: 'string' },
            date: { type: 'string' },
          },
        }},
        scope: { type: 'string', enum: ['today', 'all', 'overall', 'full'] },
      },
      additionalProperties: false,
    },
  },
};

// Hook: allow extending the available tool schemas at runtime
export function getToolSchemas(extra = {}) {
  return { ...toolSchemas, ...extra };
}

export function buildToolPrompt(context = null, extraSchemas = {}) {
  const defs = Object.values(getToolSchemas(extraSchemas)).map(def => ({ name: def.name, description: def.description, schema: def.schema }));
  const base = `You are KAARO agent. IMPORTANT: If the user's request maps to a tool action, respond ONLY with valid JSON like this example:
{"tool": "save_memory", "args": {"key": "friend_name", "value": "John"}}

Do NOT use markdown, code blocks, or explanations. Output ONLY the JSON or plain conversational text.

Available tools: ${JSON.stringify(defs, null, 2)}

ONLY use save_memory when user explicitly provides NEW personal/business details to save.`;
  return context ? `${base}\nContext: ${context}` : base;
}


