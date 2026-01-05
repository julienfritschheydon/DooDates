$files = Get-ChildItem -Path 'tests' -Recurse -Include *.ts, *.js, *.cjs
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace '/DooDates/', '/'
    Set-Content $file.FullName -Value $newContent -NoNewline
}
Write-Host "✅ Replaced /DooDates/ with / in $($files.Count) files"
