import { supabase } from './lib/supabaseClient.js';
import { runAgent } from './lib/agent/agent.js';

// Test user object (replace with actual user ID from your database)
const testUser = {
  id: 'bbc0351a-0e4e-47c2-9c9a-615975aa2df4',
  email: 'nirbhaygupta4113@gmail.com',
  user_metadata: {
    full_name: 'Nirbhay Gupta'
  }
};

const testBusiness = {
  id: '10a9d656-9c95-49be-9fdd-e541e8db53ac',
  name: 'Nirbhay Gupta'
};

async function testMemoryAndConversation() {
  console.log('Testing memory and conversation...');
  
  // Test 1: Simple greeting
  console.log('\n=== Test 1: Greeting ===');
  const result1 = await runAgent({
    user: testUser,
    business: testBusiness,
    userText: 'Hi there!'
  });
  console.log('Response 1:', result1.reply);
  
  // Test 2: Identity question
  console.log('\n=== Test 2: Who am I? ===');
  const result2 = await runAgent({
    user: testUser,
    business: testBusiness,
    userText: 'Who am I?'
  });
  console.log('Response 2:', result2.reply);
  
  // Test 3: Save new detail
  console.log('\n=== Test 3: Save detail ===');
  const result3 = await runAgent({
    user: testUser,
    business: testBusiness,
    userText: 'My favorite color is blue'
  });
  console.log('Response 3:', result3.reply);
  
  // Test 4: Ask about saved detail
  console.log('\n=== Test 4: Recall detail ===');
  const result4 = await runAgent({
    user: testUser,
    business: testBusiness,
    userText: 'What is my favorite color?'
  });
  console.log('Response 4:', result4.reply);
  
  // Check database state
  console.log('\n=== Database State ===');
  const { data: memory } = await supabase
    .from('ai_memory')
    .select('key, value, updated_at')
    .eq('user_id', testUser.id)
    .order('updated_at', { ascending: false })
    .limit(5);
  console.log('Recent memory entries:', memory);
}

testMemoryAndConversation().catch(console.error);
