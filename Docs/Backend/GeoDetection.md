# Geo Detection Architecture

## Overview

We use a dual-strategy approach to detect the user's geographic location (Country) to enable regional pricing and localized content.
The logic is hosted in a **Supabase Edge Function** to ensure integration with our serverless stack.

## Strategy

### 1. Primary: Cloudflare Headers (Zero Cost)

When deployed behind Cloudflare (Supabase Edge Functions are), we rely on the `CF-IPCountry` header. This is fast, free, and accurate.

### 2. Fallback: IPinfo (Free Tier)

If the Cloudflare header is missing (e.g., local development), we use the [IPinfo API](https://ipinfo.io).

- **Free Tier Limit**: 50,000 requests/month.
- **Token**: Set `IPINFO_TOKEN` in Supabase Secrets.

## Implementation

### Edge Function: `supabase/functions/geo-detection/index.ts`

- Handles the logic of checking headers and calling IPinfo.
- Returns JSON: `{ country: string, source: 'cloudflare' | 'ipinfo' | 'fallback', ... }`.

### Frontend Hook: `src/hooks/useGeoLocation.ts`

- Calls the Edge Function on app initialization.
- Stores the result in `localStorage` (`doodates_geo`) to avoid redundant calls.
- Provides `geo` object to the app.

## Local Development & Testing

### Testing the Edge Function

```bash
supabase functions serve geo-detection --no-verify-jwt
```

Then call:

```bash
curl http://localhost:54321/functions/v1/geo-detection
```

### Simulating Cloudflare

```bash
curl -H "CF-IPCountry: JP" http://localhost:54321/functions/v1/geo-detection
```
