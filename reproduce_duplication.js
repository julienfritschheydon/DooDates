// Mock data
const userId = "user-123";

const supabaseConv = {
  id: "uuid-456",
  title: "Poll Conversation",
  userId: userId,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
  firstMessage: "Hello",
  messageCount: 1,
  isFavorite: false,
  tags: [],
  metadata: {},
};

const localConv = {
  id: "local-123",
  title: "Poll Conversation",
  userId: userId,
  status: "active",
  createdAt: new Date(),
  updatedAt: new Date(),
  firstMessage: "Hello",
  messageCount: 1,
  isFavorite: false,
  tags: [],
  metadata: {
    supabaseId: "uuid-456", // Points to the Supabase version
  },
};

// Simulate useConversations merge logic
function mergeConversations(supabaseConvs, localConvs) {
  const mergedMap = new Map();

  // Add Supabase conversations first
  supabaseConvs.forEach((conv) => {
    mergedMap.set(conv.id, conv);
  });

  // Add local conversations if they're more recent or not in Supabase
  localConvs.forEach((localConv) => {
    if (localConv.userId === userId) {
      // Check if this local conversation has been migrated to Supabase
      // If so, we should ignore the local version if the Supabase version is present
      const supabaseId = localConv.metadata?.supabaseId;
      if (supabaseId && mergedMap.has(supabaseId)) {
        return;
      }

      const existing = mergedMap.get(localConv.id);
      if (!existing) {
        // Not in Supabase, add it
        mergedMap.set(localConv.id, localConv);
      } else {
        // Compare timestamps (omitted for brevity, assuming local is not newer enough to override ID check)
      }
    }
  });

  return Array.from(mergedMap.values());
}

const merged = mergeConversations([supabaseConv], [localConv]);

console.log("Merged count:", merged.length);
console.log(
  "Merged IDs:",
  merged.map((c) => c.id),
);

if (merged.length === 1 && merged[0].id === "uuid-456") {
  console.log("PASS: Duplicates removed!");
} else {
  console.log("FAIL: Duplicates still present or wrong item removed.");
}
