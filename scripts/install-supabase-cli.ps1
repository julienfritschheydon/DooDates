# Install Supabase CLI Script
# Run with: pwsh scripts/install-supabase-cli.ps1

Write-Host "Installing Supabase CLI..." -ForegroundColor Cyan

# Check if npm is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npm is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if Supabase CLI is already installed
if (Get-Command supabase -ErrorAction SilentlyContinue) {
    $version = supabase --version 2>$null
    Write-Host "Supabase CLI is already installed: $version" -ForegroundColor Yellow
    $response = Read-Host "Do you want to reinstall? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Installation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Install via npm
Write-Host "Installing Supabase CLI via npm..." -ForegroundColor Cyan
npm install -g supabase

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Supabase CLI installed successfully!" -ForegroundColor Green
    
    # Verify installation
    Write-Host "`nVerifying installation..." -ForegroundColor Cyan
    $version = supabase --version
    Write-Host "Installed version: $version" -ForegroundColor Green
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Link to your project: supabase link --project-ref <your-project-ref>" -ForegroundColor Yellow
    Write-Host "2. Run linter: npm run supabase:lint" -ForegroundColor Yellow
    Write-Host "3. Or run directly: supabase db lint" -ForegroundColor Yellow
    
    Write-Host "`nThe splinter.toml file in the project root will be used automatically." -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Installation failed. Please check the error messages above." -ForegroundColor Red
    Write-Host "You may need to run PowerShell as Administrator." -ForegroundColor Yellow
    exit 1
}

