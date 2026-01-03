// Quick test script to run in browser console
console.log("🧪 Testing conversation resume functionality...");

// Check if LZ-String is available
if (!window.LZString) {
  console.error("❌ LZ-String not available - loading from CDN...");
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js";
  document.head.appendChild(script);
  script.onload = () => {
    console.log("✅ LZ-String loaded, re-run this script");
  };
  return;
} else {
  console.log("✅ LZ-String available");
}

// Check current localStorage
const storageKey = "doodates_conversations";
let existingData = localStorage.getItem(storageKey);

console.log("📦 Current localStorage data:", existingData ? "Found" : "None");

if (existingData) {
  try {
    const decompressed = LZString.decompress(existingData);
    const parsed = JSON.parse(decompressed);
    const conversationIds = Object.keys(parsed.conversations || {});
    console.log("🔑 Existing conversation IDs:", conversationIds);

    if (conversationIds.length > 0) {
      const testId = conversationIds[0];
      console.log("🔗 Test resume URL:", `${window.location.origin}/chat?resume=${testId}`);
      // Don't auto-navigate, just log the URL
    }
  } catch (e) {
    console.error("❌ Error parsing existing data:", e.message);
  }
}

// Create a fresh test conversation
const testId = "local-" + Date.now() + "-quicktest";
console.log("🆕 Creating test conversation with ID:", testId);

const testData = {
  conversations: {},
  messages: {},
  metadata: {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isGuest: true,
  },
};

// Add existing conversations if any
if (existingData) {
  try {
    const decompressed = LZString.decompress(existingData);
    const existing = JSON.parse(decompressed);
    testData.conversations = existing.conversations || {};
    testData.messages = existing.messages || {};
  } catch (e) {
    console.log("⚠️ Using fresh data structure");
  }
}

// Add test conversation
testData.conversations[testId] = {
  id: testId,
  title: "Quick Test Resume Conversation",
  status: "active",
  firstMessage: "This is a quick test for resume functionality",
  messageCount: 1,
  isFavorite: false,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    pollGenerated: false,
    errorOccurred: false,
    aiModel: "gemini-pro",
    language: "fr",
  },
};

testData.messages[testId] = [
  {
    id: "msg-" + Date.now(),
    conversationId: testId,
    content: "This is a quick test for resume functionality",
    role: "user",
    timestamp: new Date().toISOString(),
  },
];

// Save to localStorage
const compressed = LZString.compress(JSON.stringify(testData));
localStorage.setItem(storageKey, compressed);

console.log("✅ Test conversation saved to localStorage");
console.log("🔗 Resume URL:", `${window.location.origin}/chat?resume=${testId}`);
console.log("📋 To test: Copy the URL above and navigate to it");

// Verify it was saved correctly
const verification = localStorage.getItem(storageKey);
if (verification) {
  const verifyDecompressed = LZString.decompress(verification);
  const verifyParsed = JSON.parse(verifyDecompressed);
  console.log(
    "✅ Verification: Conversation exists in storage:",
    testId in verifyParsed.conversations,
  );
}
