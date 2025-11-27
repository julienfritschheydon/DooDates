/**
 * Debug script to test localStorage operations directly
 */

// Test basic localStorage functionality
console.log('🧪 Testing localStorage operations...');

try {
  // Test basic set/get
  localStorage.setItem('test-key', 'test-value');
  const retrieved = localStorage.getItem('test-key');
  console.log('✅ Basic localStorage works:', retrieved);
  
  // Test DooDates storage key (correct key from ConversationStorageLocal)
  const storageKey = 'doodates_conversations';
  const existingData = localStorage.getItem(storageKey);
  console.log('🔍 Existing DooDates data:', existingData ? 'Found' : 'None');
  
  if (existingData) {
    console.log('📦 Raw data length:', existingData.length);
    try {
      // Try to decompress if it exists
      const LZString = window.LZString || require('lz-string');
      if (LZString) {
        const decompressed = LZString.decompress(existingData);
        if (decompressed) {
          const parsed = JSON.parse(decompressed);
          console.log('📦 Decompressed data structure:', {
            conversations: Object.keys(parsed.conversations || {}),
            messages: Object.keys(parsed.messages || {}),
            metadata: parsed.metadata
          });
          console.log('🔑 Available conversation IDs:', Object.keys(parsed.conversations || {}));
        } else {
          console.log('❌ Failed to decompress');
        }
      }
    } catch (e) {
      console.log('❌ Failed to decompress:', e.message);
    }
  }
  
  // Clean up test
  localStorage.removeItem('test-key');
  console.log('✅ localStorage test completed');
  
} catch (error) {
  console.error('❌ localStorage test failed:', error);
}

// Test conversation creation directly
console.log('🧪 Testing conversation creation directly...');

// Mock the conversation structure
const testConversation = {
  title: "Test Conversation",
  status: "active",
  firstMessage: "Test message content",
  messageCount: 1,
  isFavorite: false,
  tags: [],
  metadata: {
    pollGenerated: false,
    errorOccurred: false,
    aiModel: 'gemini-pro',
    language: 'fr',
    userAgent: navigator.userAgent,
  }
};

console.log('📝 Test conversation data:', testConversation);
console.log('🏁 Debug script completed');
