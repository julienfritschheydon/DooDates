# Script pour convertir markdown en HTML et ouvrir l'impression
param(
    [string]$MarkdownFile = "Docs\ANALYSE-REORGANISATION-SONDAGES.md"
)

# Vérifier si pandoc est disponible
$pandocPath = Get-Command pandoc -ErrorAction SilentlyContinue

if ($pandocPath) {
    # Utiliser pandoc pour une conversion de qualité
    Write-Host "Utilisation de pandoc pour la conversion..."
    $html = & pandoc $MarkdownFile --standalone --css=https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css
} else {
    # Fallback: conversion basique
    Write-Host "Pandoc non trouvé, utilisation de la conversion basique..."
    $content = Get-Content -Path $MarkdownFile -Raw -Encoding UTF8
    $html = $content
    
    # Convertir les titres
    $html = $html -replace '(?m)^# (.+)$', '<h1>$1</h1>'
    $html = $html -replace '(?m)^## (.+)$', '<h2>$1</h2>'
    $html = $html -replace '(?m)^### (.+)$', '<h3>$1</h3>'
    $html = $html -replace '(?m)^#### (.+)$', '<h4>$1</h4>'
    
    # Convertir le gras
    $html = $html -replace '\*\*(.+?)\*\*', '<strong>$1</strong>'
    
    # Convertir les listes (plus sophistiqué)
    $lines = $html -split "`n"
    $inList = $false
    $html = ($lines | ForEach-Object {
        $line = $_
        if ($line -match '^\s*[-*+]\s+(.+)$' -or $line -match '^\s*\d+\.\s+(.+)$') {
            if (-not $inList) {
                $inList = $true
                "<ul>`n<li>$($matches[1])</li>"
            } else {
                "<li>$($matches[1])</li>"
            }
        } elseif ($line.Trim() -eq '' -and $inList) {
            $inList = $false
            "</ul>`n"
        } elseif ($inList -and $line.Trim() -ne '') {
            $inList = $false
            "</ul>`n$line"
        } else {
            $line
        }
    }) -join "`n"
    if ($inList) { $html += "</ul>" }
    
    # Convertir les blocs de code
    $html = $html -replace '(?s)```(\w+)?\n(.*?)```', '<pre><code>$2</code></pre>'
    
    # Convertir les séparateurs
    $html = $html -replace '(?m)^---$', '<hr>'
    
    # Convertir les retours à la ligne doubles en paragraphes
    $paragraphs = $html -split "`n`n" | Where-Object { $_.Trim() -ne '' }
    $html = ($paragraphs | ForEach-Object {
        $para = $_.Trim()
        if ($para -notmatch '^<[h|u|l|p|h]' -and $para -notmatch '^```' -and $para -notmatch '^<pre>') {
            "<p>$para</p>"
        } else {
            $para
        }
    }) -join "`n"
}

# Créer le HTML complet
if ($pandocPath) {
    # Pandoc génère déjà un HTML complet, on ajoute juste le script d'impression
    if ($html -notmatch '<script') {
        $fullHtml = $html -replace '</body>', @"
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
"@
    } else {
        $fullHtml = $html
    }
} else {
    # Créer le HTML complet pour la conversion basique
    $fullHtml = @"
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analyse : Réorganisation "Tout en Sondages"</title>
    <style>
        @media print {
            body { margin: 0; padding: 20px; }
            @page { margin: 2cm; }
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            color: #333;
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; border-bottom: 2px solid #ecf0f1; padding-bottom: 5px; }
        h3 { color: #555; margin-top: 25px; }
        h4 { color: #666; margin-top: 20px; }
        ul, ol { margin: 15px 0; padding-left: 30px; }
        li { margin: 5px 0; }
        pre {
            background: #f4f4f4;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 15px;
            overflow-x: auto;
            font-family: 'Consolas', 'Monaco', monospace;
        }
        code { font-family: 'Consolas', 'Monaco', monospace; }
        hr { border: none; border-top: 2px solid #eee; margin: 30px 0; }
        p { margin: 10px 0; }
        strong { color: #2c3e50; }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #3498db;
            color: white;
        }
    </style>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</head>
<body>
$html
</body>
</html>
"@
}

# Créer un fichier temporaire
$tempFile = [System.IO.Path]::GetTempFileName() -replace '\.tmp$','.html'
$fullHtml | Out-File -FilePath $tempFile -Encoding UTF8

# Ouvrir dans le navigateur (qui déclenchera automatiquement l'impression)
Start-Process $tempFile

Write-Host "Document ouvert dans le navigateur. La boîte de dialogue d'impression devrait s'ouvrir automatiquement."
Write-Host "Fichier temporaire: $tempFile"

