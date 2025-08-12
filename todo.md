SYSTEM / TASK:
You are an autonomous coding agent. Implement a production-ready, ully-tested feature set so the chatbot "always knows" the user (global memory) and automatically injects that knowledge into every LLM request (no ad-hoc if/else checks required in prompts). Use Supabase for DB/storage and Ollama for inference. Deliver code, migrations, tests



High-level goals:
 Give the chatbot a friendly ChatGPT-like UX.
1. Global persistent memory (semantic + structured) for each user.(Always know the user’s key details (name, business name, location, preferences, etc.) and automatically inject them into every LLM call without manual if/else checks.)
2. Conversation sessions with a "new chat" (fresh context window) while still having access to global memory.
3. Chat history, message DB, product DB, transactions DB access and clear APIs.(Store and retrieve chat history per user.)
4. Automatic memory retrieval & injection middleware so LLM sees user data as context without per-prompt if/else logic.
5. Save logic heuristics:
    - If user says “save this” or “remember this” etc → store it.
    - Proactively store info when clearly useful for personalization.
   - user profile (global memory)
   - product database
   - transactions databasev other usefull info





Constraints:
- Use pgvector for semantic memory; embedding dim configurable.
- Memory injection must be middleware-level; do not require manual `if`/`else` in prompt logic.
- Encrypt sensitive fields at rest (e.g., tokens).

Start by producing a step-by-step implementation plan, then create the first branch and scaffold code, migrations, and tests. After each milestone, output a concise status and next steps. If any decision is unclear, pick sensible defaults and document them.



IMPLEMENTATION STEPS:
1. **Schema**: Create/alter tables above in Supabase (with pgvector enabled).
2. **Embedding Service**: Implement a function to create embeddings for memory values (use local LLM or remote API).
4. **Middleware**:
   - Before sending to LLM, fetch profile + relevant memories + recent conversation messages for the same chat.
   - Inject them into the system prompt automatically.
5. **Save Logic**:
   - On explicit “save” commands, persist to memories/profile.
   - For new detected user info
6. **Frontend**:
   - “New Chat” button → new conversation in DB, clears local context but still uses global memory in prompts.
   - Chat history view.
   - Memory management page (view/edit/delete/export).
7. **Privacy**:
   - Allow user to export/delete all stored memories.
   - Log memory writes/reads.


ACTION:
Start by updating Supabase schema via MCP, then implement backend memory service, then middleware, then frontend UI changes. 
At each stage run tests to ensure everything is working.







Embedding Model Choice

We’ll use nomic-embed-text because:
	•	Works locally via Ollama.
	•	768-dimensional vectors (good trade-off between performance & accuracy).




optional reference you may have to change these codes
'''
2. Supabase / pgvector Schema
-- Enable pgvector if not already
create extension if not exists vector;

-- Global persistent semantic memory
create table user_memories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    memory_text text not null,
    embedding vector(768), -- matches nomic-embed-text dimension
    created_at timestamptz default now()
);

-- Structured profile memory (no embeddings)
create table user_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    name text,
    business_name text,
    location text,
    preferences jsonb,
    updated_at timestamptz default now()
);
Embedding Service (Node.js example)
import { execSync } from "child_process";

export async function generateEmbedding(text) {
  // Runs Ollama locally to get embedding
  const command = `ollama run nomic-embed-text --prompt "${text.replace(/"/g, '\\"')}"`;
  const output = execSync(command, { encoding: "utf-8" });

  try {
    const parsed = JSON.parse(output);
    return parsed.embedding; // returns array[768]
  } catch (err) {
    console.error("Failed to parse embedding:", err);
    throw err;
  }
}
Storing Memory
import { supabase } from "./supabaseClient.js";
import { generateEmbedding } from "./embeddingService.js";

export async function saveUserMemory(userId, memoryText) {
  const embedding = await generateEmbedding(memoryText);

  const { data, error } = await supabase
    .from("user_memories")
    .insert([{ user_id: userId, memory_text: memoryText, embedding }]);

  if (error) throw error;
  return data;
}
Retrieving Memory (Semantic Search)
export async function searchUserMemories(userId, query, limit = 5) {
  const queryEmbedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("match_user_memories", {
    query_embedding: queryEmbedding,
    match_count: limit,
    user_id: userId
  });

  if (error) throw error;
  return data;
}
create or replace function match_user_memories(
  query_embedding vector(768),
  match_count int,
  user_id uuid
)
returns table(
  id uuid,
  memory_text text,
  similarity float
)
language sql stable as $$
  select
    id,
    memory_text,
    1 - (embedding <=> query_embedding) as similarity
  from user_memories
  where user_memories.user_id = match_user_memories.user_id
  order by embedding <=> query_embedding
  limit match_count;
$$;

Middleware for Automatic Injection

Before every LLM call, middleware will:
	1.	Get structured profile.
	2.	Get top semantic memories for the conversation.
	3.	Inject them into the system prompt automatically.

'''