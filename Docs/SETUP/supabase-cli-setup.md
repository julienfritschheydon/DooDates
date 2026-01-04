# Supabase CLI Setup Guide

## Installation

**Note**: Supabase CLI cannot be installed globally via npm (`npm install -g supabase`). You have two options:

1. **Install globally** using one of the supported package managers below (recommended for command-line usage)
2. **Install locally** as a dev dependency and use via `npx` or npm scripts (already done in this project)

### Option 1: Install via winget (Windows - Recommended)

```powershell
winget install Supabase.CLI
```

### Option 2: Install via Scoop (Windows)

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option 3: Install via Chocolatey (Windows)

```powershell
choco install supabase
```

### Option 4: Direct Download (Windows)

1. Download from [Supabase CLI Releases](https://github.com/supabase/cli/releases)
2. Extract and add to PATH

### Option 5: Use via npx (Local Installation)

If you've installed `supabase` as a dev dependency (already done in this project), you can use it via:

```bash
# Direct npx usage
npx supabase --version
npx supabase login
npx supabase link --project-ref outmbbisrrdiumlweira
npx supabase db lint

# Or use npm scripts (recommended)
npm run supabase:login
npm run supabase:link -- --project-ref outmbbisrrdiumlweira
npm run supabase:lint
```

**Note**: You must authenticate first using `npm run supabase:login` before linking or running other commands.

## Verify Installation

```bash
# If installed globally
supabase --version

# If using local installation (recommended for this project)
npx supabase --version
```

## Authentication

Before linking to your project or running CLI commands, you need to authenticate with Supabase:

```bash
# If installed globally
supabase login

# If using local installation (recommended for this project)
npx supabase login

# Or use npm script
npm run supabase:login
```

This will:

1. Open your browser to authenticate with Supabase
2. Save your access token locally for future CLI operations

**Alternative: Set Access Token Manually**

You can also set the `SUPABASE_ACCESS_TOKEN` environment variable:

```powershell
# PowerShell (temporary for current session)
$env:SUPABASE_ACCESS_TOKEN = "your-access-token-here"

# Or set it permanently in your system environment variables
```

To get your access token:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Account Settings → Access Tokens
3. Create a new access token if needed

## Configuration

### 1. Link to Your Supabase Project

```bash
# If installed globally
supabase link --project-ref outmbbisrrdiumlweira

# If using local installation (recommended for this project)
npx supabase link --project-ref outmbbisrrdiumlweira

# Or use npm script
npm run supabase:link -- --project-ref outmbbisrrdiumlweira
```

You can find your project ref in your Supabase dashboard URL:

- URL: `https://supabase.com/dashboard/project/abcdefghijklmnop`
- Project ref: `abcdefghijklmnop`

### 2. Set Up Database Connection

After linking, the CLI will prompt you for:

- Database password (found in Project Settings → Database)
- Or use the access token from authentication

## Using the Database Linter

### Run Linter

**Linting Remote Database (Linked Project):**

```bash
# If installed globally
supabase db lint --linked

# If using local installation (recommended for this project)
npx supabase db lint --linked

# Or use npm script (recommended)
npm run supabase:lint
```

**Linting Local Database:**

If you have a local Supabase instance running (`supabase start`), you can lint it without the `--linked` flag:

```bash
# Lint local database
npx supabase db lint

# Only show errors (ignore warnings/info)
npm run supabase:lint:check
```

**Note**: By default, `supabase db lint` tries to connect to a local database. Use `--linked` flag to lint your remote linked project instead.

### Linter Configuration

The `splinter.toml` file in the project root configures the linter:

```toml
[linter]
enabled = true

[linter.rules]
unused_index = "off"  # Suppresses unused index warnings
```

This file is automatically picked up by the Supabase CLI when running `supabase db lint`.

## Dashboard vs CLI

### Dashboard Linter

The Supabase dashboard linter **should automatically pick up** the `splinter.toml` file if:

1. The file is in your project root
2. Your project is linked to the Supabase dashboard
3. The dashboard has access to your repository (if using GitHub integration)

However, dashboard linter configuration may vary. If the warnings persist in the dashboard:

1. Check if there's a "Linter Settings" section in Database → Settings
2. Manually configure ignore rules if available
3. Use the CLI for local linting instead

### CLI Linter (Recommended)

The CLI linter **definitely** uses `splinter.toml`:

```bash
# Run locally
supabase db lint

# This will use splinter.toml configuration
```

## Troubleshooting

### CLI Not Found

If `supabase` command is not found:

**If using local installation (npx):**

- Use `npx supabase` instead of `supabase`
- Or use the npm scripts: `npm run supabase:lint`, `npm run supabase:link`, etc.

**If installed globally:**

1. **Windows**: Restart PowerShell/terminal after installation
2. **Check PATH**: Verify the installation directory is in your PATH
   - For winget: Usually `C:\Users\<username>\AppData\Local\Microsoft\WinGet\Packages\`
   - For Scoop: Usually `C:\Users\<username>\scoop\shims\`
   - For Chocolatey: Usually `C:\ProgramData\chocolatey\bin\`
3. **Reinstall**: Use the same package manager you used for installation

   ```powershell
   # For winget
   winget uninstall Supabase.CLI
   winget install Supabase.CLI

   # For Scoop
   scoop uninstall supabase
   scoop install supabase

   # For Chocolatey
   choco uninstall supabase
   choco install supabase
   ```

### Failed to Connect to Local Database

If you see an error like: `failed to connect to postgres: failed to connect to host=127.0.0.1:54322`

**Problem**: The linter is trying to connect to a local Supabase instance that isn't running.

**Solutions**:

1. **Lint Remote Database** (recommended if you just want to lint your linked project):

   ```powershell
   # Use --linked flag
   npm run supabase:lint

   # Or directly
   npx supabase db lint --linked
   ```

2. **Start Local Supabase Instance** (if you want to develop locally):
   ```powershell
   npx supabase start
   # Then run lint without --linked flag
   npm run supabase:lint:local
   ```

### Linter Not Using Configuration

1. Verify `splinter.toml` is in project root
2. Check file syntax (should be valid TOML)
3. Run `supabase db lint --help` to see available options

### Access Token Not Provided

If you see the error: `Access token not provided. Supply an access token by running supabase login...`

**Solution:**

1. **Login via CLI** (recommended):

   ```powershell
   # Using local installation
   npm run supabase:login

   # Or directly
   npx supabase login
   ```

2. **Set Environment Variable**:

   ```powershell
   $env:SUPABASE_ACCESS_TOKEN = "your-access-token"
   ```

3. **Get Access Token**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Account Settings → Access Tokens
   - Create or copy your access token

### Dashboard Still Shows Warnings

The dashboard may not immediately pick up `splinter.toml`. Options:

1. **Wait**: Dashboard may sync periodically
2. **Use CLI**: Run `supabase db lint` locally instead
3. **Contact Support**: If warnings persist, contact Supabase support

## Useful Commands

```bash
# Check Supabase CLI version
supabase --version

# Authenticate with Supabase
supabase login

# Link to project
supabase link --project-ref <project-ref>

# Run database linter (remote linked project)
supabase db lint --linked

# Run database linter (local instance)
supabase db lint

# Run linter with specific level (remote)
supabase db lint --linked --level error

# Get help
supabase db lint --help
```

**Using npm scripts (with local installation):**

```bash
npm run supabase:login              # Authenticate
npm run supabase:link               # Link to project
npm run supabase:lint               # Lint remote database (linked project)
npm run supabase:lint:check         # Lint remote database (errors only)
npm run supabase:lint:local         # Lint local database (requires supabase start)
npm run supabase:lint:local:check  # Lint local database (errors only)
```

## Related Files

- `splinter.toml` - Linter configuration file
- `sql-scripts/add-foreign-key-indexes.sql` - Creates FK indexes
- `Docs/Database/supabase-linter-config.md` - Detailed linter documentation

## References

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Splinter Documentation](https://supabase.github.io/splinter/)
- [Supabase Database Linter Guide](https://supabase.com/docs/guides/database/database-linter)
