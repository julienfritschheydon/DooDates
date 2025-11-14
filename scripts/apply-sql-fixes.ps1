# PowerShell script to apply SQL fixes
# Requires psql to be installed and accessible in PATH

Write-Host "📝 Applying SQL fixes for linter warnings..." -ForegroundColor Cyan
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ psql is not installed or not in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please use the Supabase Dashboard SQL Editor instead:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://supabase.com/dashboard/project/outmbbisrrdiumlweira/sql" -ForegroundColor Yellow
    Write-Host "2. Copy contents of: sql-scripts/fix-linter-warnings.sql" -ForegroundColor Yellow
    Write-Host "3. Paste and click 'Run'" -ForegroundColor Yellow
    exit 1
}

# Get SQL file path
$sqlFile = Join-Path $PSScriptRoot "..\sql-scripts\fix-linter-warnings.sql"
$sqlFile = Resolve-Path $sqlFile

Write-Host "📄 SQL file: $sqlFile" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  To execute this SQL, you need your Supabase database connection string." -ForegroundColor Yellow
Write-Host ""
Write-Host "You can find it in:" -ForegroundColor Cyan
Write-Host "  Supabase Dashboard → Project Settings → Database → Connection String" -ForegroundColor White
Write-Host ""
Write-Host "Then run:" -ForegroundColor Cyan
Write-Host "  psql `"your-connection-string`" -f `"$sqlFile`"" -ForegroundColor White
Write-Host ""
Write-Host "Or use the Supabase Dashboard SQL Editor (easier):" -ForegroundColor Cyan
Write-Host "  https://supabase.com/dashboard/project/outmbbisrrdiumlweira/sql" -ForegroundColor White

