# Fix for Gemini Test CONFIG_ERROR

## Problem
The Gemini API tests were failing with `CONFIG_ERROR` on the dev branch because the workflow was trying to use the Edge Function (SecureGeminiService) which requires Supabase configuration, instead of calling the Gemini API directly.

## Root Cause
1. The workflow `.github/workflows/7-monthly-gemini.yml` was not setting `VITE_USE_DIRECT_GEMINI=true`
2. Without this flag, the code defaulted to using the Edge Function path
3. The Edge Function path requires `VITE_SUPABASE_URL` and other Supabase config that aren't set in the test environment
4. This resulted in `CONFIG_ERROR` being returned

## Solution Implemented

### 1. Updated Workflow Configuration
**File:** `.github/workflows/7-monthly-gemini.yml`

Added `VITE_USE_DIRECT_GEMINI: "true"` to the environment variables:

```yaml
- name: Run Gemini tests
  env:
    VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
    VITE_USE_DIRECT_GEMINI: "true"  # ✅ NEW: Force direct API calls
  run: npm run test:gemini
```

### 2. Enhanced Error Diagnostics
**File:** `src/lib/gemini.ts`

Added better logging and error handling:

```typescript
if (USE_DIRECT_GEMINI) {
  logger.info("🔵 Mode DIRECT GEMINI API activé (bypass Edge Function)", "api");
  const apiKey = getEnv("VITE_GEMINI_API_KEY");
  if (!apiKey) {
    logger.error("VITE_GEMINI_API_KEY non configurée en mode direct", "api");
  } else {
    logger.info(`VITE_GEMINI_API_KEY configurée: ${apiKey.substring(0, 10)}...`, "api");
  }
} else {
  logger.info("🟢 Mode Edge Function activé", "api");
}
```

Added specific CONFIG_ERROR handling:

```typescript
if (secureResponse.error === "CONFIG_ERROR") {
  const apiKey = getEnv("VITE_GEMINI_API_KEY");
  logger.error("CONFIG_ERROR détectée", "api", {
    useDirectGemini: USE_DIRECT_GEMINI,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    errorMessage: secureResponse.message,
  });
  
  return {
    success: false,
    message: "Erreur de configuration: clé API Gemini introuvable ou invalide.",
    error: "CONFIG_ERROR",
  };
}
```

## Current Status

✅ **CONFIG_ERROR is resolved** - Tests now run in DIRECT mode
❌ **API Key Invalid** - All tests fail with: `"API key not valid. Please pass a valid API key."`

## Next Steps

### To Fix API Key Issue:

1. **Update GitHub Repository Secret:**
   - Go to: `Settings > Secrets and variables > Actions`
   - Update `VITE_GEMINI_API_KEY` with a valid Gemini API key
   - Get a valid key from: https://makersuite.google.com/app/apikey

2. **Update Local Environment (for local testing):**
   ```bash
   # In .env.local file
   VITE_GEMINI_API_KEY=your-valid-api-key-here
   VITE_USE_DIRECT_GEMINI=true
   ```

3. **Verify API Key:**
   - Make sure the key has proper permissions for the Gemini API
   - Check that it's not expired or revoked
   - Test it manually at: https://aistudio.google.com/

## Test Results After Fix

**Before:**
- Error: `CONFIG_ERROR`
- Reason: No Supabase configuration in test environment
- Mode: Edge Function (incorrect for tests)

**After:**
- Error: `API key not valid`
- Reason: Invalid/missing Gemini API key
- Mode: DIRECT (✅ correct)

## Files Changed

1. `.github/workflows/7-monthly-gemini.yml` - Added `VITE_USE_DIRECT_GEMINI=true`
2. `src/lib/gemini.ts` - Enhanced error diagnostics and CONFIG_ERROR handling

## Documentation

This fix ensures that:
- ✅ Tests always use direct Gemini API calls (not Edge Function)
- ✅ Better error messages for configuration issues
- ✅ Diagnostic logging to identify API key problems
- ✅ Clear separation between Edge Function and Direct API modes

