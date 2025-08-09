// Simple test script to test memory save/load without React Native dependencies
const testUserId = 'bbc0351a-0e4e-47c2-9c9a-615975aa2df4';

// Mock the save_memory functionality
async function testSaveMemory() {
  console.log('Testing save_memory functionality...');
  
  // Simulate tool execution
  const key = 'test_favorite_color';
  const value = 'blue';
  
  console.log(`Attempting to save: ${key} = ${value} for user ${testUserId}`);
  
  // This would be the actual save operation:
  // const { error } = await supabase
  //   .from('ai_memory')
  //   .upsert({ user_id: testUserId, key, value }, { onConflict: 'user_id,key' });
  
  console.log('Save would be executed here');
  
  // Mock loading
  console.log('Loading memory...');
  
  console.log('Test complete - check database manually');
}

testSaveMemory();
