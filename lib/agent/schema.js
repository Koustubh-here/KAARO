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
};

export function buildToolPrompt() {
  const defs = Object.values(toolSchemas).map(def => ({ name: def.name, description: def.description, schema: def.schema }));
  return `You are KAARO agent. If the user's request maps to a tool, output ONLY a single JSON object of the form { "tool": string, "args": object } that conforms exactly to one of these schemas. If no tool applies, output plain text only. Tools: ${JSON.stringify(defs)}`;
}


