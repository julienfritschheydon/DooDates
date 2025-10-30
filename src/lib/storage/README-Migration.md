# Conversation Migration Service

This document provides comprehensive documentation for the conversation migration system that handles the seamless transition from localStorage to Supabase storage.

## Overview

The migration system consists of three main components:

1. **ConversationMigrationService** - Core migration logic with validation, error handling, and rollback
2. **useMigration** - React hook for managing migration state and progress
3. **MigrationProgress** - UI component for displaying migration status to users

## Features

### ✅ **Transparent Migration**

- Automatic detection of migration needs
- Background processing with minimal user interruption
- Graceful fallback to localStorage on failures

### ✅ **Data Integrity**

- Full Zod schema validation before upload
- Orphaned message detection
- Verification of migration completeness
- Rollback capability on failures

### ✅ **User Experience**

- Real-time progress tracking
- Detailed status updates
- Error reporting with retry options
- Cancellation support

### ✅ **Performance**

- Batch processing for large datasets
- Configurable batch sizes
- Retry logic with exponential backoff
- Non-blocking UI during migration

## Usage

### Basic Migration Setup

```typescript
import { ConversationMigrationService } from "../lib/storage/ConversationMigrationService";

// Check if migration is needed
const migrationNeeded = await ConversationMigrationService.isMigrationNeeded();

if (migrationNeeded) {
  // Create migration service
  const migrationService = new ConversationMigrationService(
    "https://your-project.supabase.co",
    "your-anon-key",
    {
      batchSize: 5,
      validateBeforeUpload: true,
      enableRollback: true,
      onProgress: (progress) => {
        console.log(
          `Migration: ${progress.currentStep} (${progress.completedSteps}/${progress.totalSteps})`,
        );
      },
    },
  );

  // Start migration
  const result = await migrationService.migrate();

  if (result.success) {
    console.log(`Successfully migrated ${result.migratedConversations} conversations`);
  } else {
    console.error("Migration failed:", result.errors);
  }
}
```

### Using the React Hook

```typescript
import { useMigration } from '../lib/storage/useMigration';

function MyComponent() {
  const {
    isInitialized,
    migrationNeeded,
    progress,
    isInProgress,
    progressPercentage,
    startMigration,
    cancelMigration
  } = useMigration('https://your-project.supabase.co', 'your-anon-key');

  // Auto-start migration when component mounts
  useEffect(() => {
    if (isInitialized && migrationNeeded) {
      startMigration();
    }
  }, [isInitialized, migrationNeeded, startMigration]);

  if (!isInitialized) {
    return <div>Initializing...</div>;
  }

  if (!migrationNeeded) {
    return <div>No migration needed</div>;
  }

  return (
    <div>
      <h2>Migrating Conversations</h2>
      <div>Progress: {progressPercentage}%</div>
      <div>Status: {progress?.currentStep}</div>

      {isInProgress && (
        <button onClick={cancelMigration}>Cancel Migration</button>
      )}
    </div>
  );
}
```

### Using the UI Component

```typescript
import { MigrationProgress } from '../components/MigrationProgress';
import { useMigration } from '../lib/storage/useMigration';

function MigrationDialog() {
  const { progress, cancelMigration, startMigration } = useMigration(
    'https://your-project.supabase.co',
    'your-anon-key'
  );

  return (
    <MigrationProgress
      progress={progress}
      onCancel={cancelMigration}
      onRetry={startMigration}
      className="max-w-lg mx-auto"
    />
  );
}
```

## Configuration Options

### MigrationOptions

```typescript
interface MigrationOptions {
  batchSize: number; // Number of items to process per batch (default: 5)
  validateBeforeUpload: boolean; // Validate data before upload (default: true)
  enableRollback: boolean; // Enable rollback on failure (default: true)
  retryAttempts: number; // Number of retry attempts (default: 3)
  retryDelay: number; // Delay between retries in ms (default: 1000)
  onProgress?: (progress: MigrationProgress) => void;
  onError?: (error: string) => void;
  onComplete?: (result: MigrationResult) => void;
}
```

### Recommended Settings

**For Small Datasets (< 10 conversations)**

```typescript
{
  batchSize: 10,
  validateBeforeUpload: true,
  enableRollback: true,
  retryAttempts: 3,
  retryDelay: 500
}
```

**For Large Datasets (> 100 conversations)**

```typescript
{
  batchSize: 5,
  validateBeforeUpload: true,
  enableRollback: true,
  retryAttempts: 5,
  retryDelay: 2000
}
```

**For Production (High Reliability)**

```typescript
{
  batchSize: 3,
  validateBeforeUpload: true,
  enableRollback: true,
  retryAttempts: 5,
  retryDelay: 3000
}
```

## Migration Process

### Step-by-Step Flow

1. **Initialization** - Check if migration is needed
2. **Export** - Extract data from localStorage with compression
3. **Validation** - Validate all conversations and messages using Zod schemas
4. **Setup** - Establish Supabase connection and handle authentication
5. **Upload** - Batch upload conversations and messages with retry logic
6. **Verification** - Verify data integrity and completeness
7. **Completion** - Mark migration as complete and cleanup

### Data Validation

The migration service performs comprehensive validation:

- **Schema Validation** - All data validated against Zod schemas
- **Foreign Key Integrity** - Messages must reference existing conversations
- **UUID Format** - All IDs must be valid UUIDs
- **Date Validation** - Timestamps must be valid dates
- **Content Validation** - Required fields must be present and non-empty

### Error Handling

**Validation Errors**

```typescript
// Invalid conversation schema
"Invalid conversation 123e4567-e89b-12d3-a456-426614174000: Invalid UUID format";

// Orphaned message
"Orphaned message abc-123 references non-existent conversation xyz-456";
```

**Upload Errors**

```typescript
// Network issues
"Failed to upload conversation batch after 3 attempts: Network error";

// Database constraints
"Failed to upload message batch: Foreign key constraint violation";
```

**Verification Errors**

```typescript
// Count mismatch
"Migration verification failed - data count mismatch";
```

## User Experience Guidelines

### Migration States

1. **Not Started** - Migration hasn't begun
2. **In Progress** - General migration activity
3. **Validating** - Data validation phase
4. **Uploading** - Data upload phase
5. **Verifying** - Verification phase
6. **Completed** - Migration successful
7. **Failed** - Migration failed
8. **Rolled Back** - Migration failed and rolled back

### UI Recommendations

**Progress Indicators**

- Show overall progress (0-100%)
- Display current step description
- Show detailed progress for conversations and messages
- Include time estimates when possible

**Error Handling**

- Display clear error messages
- Provide retry options for recoverable errors
- Show rollback status when applicable
- Offer support contact for persistent issues

**Success States**

- Confirm successful migration
- Show migration statistics (conversations, messages migrated)
- Provide next steps or call-to-action

## Testing

### Unit Tests

Run the migration service tests:

```bash
npm test ConversationMigrationService.test.ts
```

### Integration Testing

Test with real Supabase instance:

```typescript
// Set up test environment
const testSupabaseUrl = "https://test-project.supabase.co";
const testSupabaseKey = "test-anon-key";

// Create test data in localStorage
const testData = {
  conversations: [
    /* test conversations */
  ],
  messages: {
    /* test messages */
  },
};

// Run migration
const migrationService = new ConversationMigrationService(testSupabaseUrl, testSupabaseKey);
const result = await migrationService.migrate();

// Verify results
expect(result.success).toBe(true);
expect(result.migratedConversations).toBe(testData.conversations.length);
```

### Performance Testing

Test with large datasets:

```typescript
// Generate large test dataset
const largeDataset = generateTestData({
  conversationCount: 1000,
  messagesPerConversation: 50,
});

// Measure migration performance
const startTime = Date.now();
const result = await migrationService.migrate();
const duration = Date.now() - startTime;

console.log(`Migrated ${result.migratedConversations} conversations in ${duration}ms`);
```

## Troubleshooting

### Common Issues

**Migration Not Starting**

- Check if `ConversationMigrationService.isMigrationNeeded()` returns `true`
- Verify localStorage contains conversation data
- Ensure migration hasn't already been completed

**Validation Failures**

- Check conversation and message data formats
- Verify all required fields are present
- Ensure UUIDs are valid format
- Check for orphaned messages

**Upload Failures**

- Verify Supabase URL and API key
- Check network connectivity
- Ensure database schema is properly set up
- Verify RLS policies allow data insertion

**Verification Failures**

- Check if data was actually inserted into Supabase
- Verify count queries are working
- Ensure RLS policies allow data reading

### Debug Mode

Enable detailed logging:

```typescript
const migrationService = new ConversationMigrationService(supabaseUrl, supabaseKey, {
  onProgress: (progress) => {
    console.log("Migration Progress:", progress);
  },
  onError: (error) => {
    console.error("Migration Error:", error);
  },
});
```

### Recovery Procedures

**Failed Migration Recovery**

1. Check localStorage - original data should still be intact
2. Review error messages for specific issues
3. Fix underlying problems (network, database, etc.)
4. Retry migration with adjusted settings
5. Contact support if issues persist

**Partial Migration Recovery**

1. Check what data was successfully migrated
2. Clear migration completion flag if needed: `localStorage.removeItem('doodates_migration_completed')`
3. Re-run migration (it will skip already migrated data)

## Security Considerations

### Data Protection

- All data validated before transmission
- No sensitive data logged in production
- Secure transmission via HTTPS
- Proper authentication handling

### Access Control

- Respects Supabase RLS policies
- Guest session handling for unauthenticated users
- Service role access for maintenance operations

### Privacy

- No data sent to external services during migration
- Local data remains on device until explicitly migrated
- User consent should be obtained before migration

## Performance Optimization

### Batch Size Tuning

- Smaller batches: More reliable, slower overall
- Larger batches: Faster overall, higher failure risk
- Recommended: 3-10 items per batch depending on data size

### Network Optimization

- Retry logic with exponential backoff
- Connection pooling via Supabase client
- Compression of large text content

### Memory Management

- Process data in batches to avoid memory issues
- Clean up temporary objects during migration
- Monitor memory usage for large datasets

## Monitoring and Analytics

### Migration Metrics

- Success/failure rates
- Average migration duration
- Common error patterns
- Data volume statistics

### Performance Metrics

- Batch processing times
- Network request latencies
- Validation performance
- Memory usage patterns

### User Experience Metrics

- Migration abandonment rates
- User satisfaction scores
- Support ticket volume
- Feature adoption post-migration

## Future Enhancements

### Planned Features

- **Incremental Migration** - Migrate only new/changed data
- **Background Sync** - Continuous synchronization between localStorage and Supabase
- **Conflict Resolution** - Handle data conflicts during migration
- **Migration Scheduling** - Allow users to schedule migrations
- **Data Compression** - Compress data during transmission

### API Improvements

- **Streaming Migration** - Stream large datasets for better performance
- **Parallel Processing** - Process multiple batches simultaneously
- **Smart Retry** - Intelligent retry logic based on error types
- **Migration Analytics** - Detailed migration analytics and reporting
