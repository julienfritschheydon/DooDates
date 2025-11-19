# Script PowerShell pour convertir le Markdown en PDF via HTML
# Utilise base64 encoding pour intégrer le contenu directement

$markdownFile = "Docs\ANALYSE-REORGANISATION-SONDAGES.md"
$htmlFile = "Docs\ANALYSE-REORGANISATION-SONDAGES.html"

Write-Host "Conversion du Markdown en HTML..." -ForegroundColor Cyan

# Lire le contenu Markdown
$markdownContent = Get-Content -Path $markdownFile -Raw -Encoding UTF8

# Encoder en base64 pour éviter les problèmes d'échappement
$bytes = [System.Text.Encoding]::UTF8.GetBytes($markdownContent)
$base64Content = [Convert]::ToBase64String($bytes)

# Template HTML avec styles d'impression
$htmlContent = @"
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analyse : Réorganisation "Tout en Sondages"</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <style>
        @page {
            margin: 2cm;
            size: A4;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            page-break-after: avoid;
            font-size: 2em;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            page-break-after: avoid;
            font-size: 1.5em;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 5px;
        }
        h3 {
            color: #555;
            margin-top: 20px;
            page-break-after: avoid;
            font-size: 1.2em;
        }
        h4 {
            color: #666;
            margin-top: 15px;
            font-size: 1.1em;
        }
        code {
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
            color: #e74c3c;
        }
        pre {
            background-color: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            page-break-inside: avoid;
            border-left: 4px solid #3498db;
        }
        pre code {
            background-color: transparent;
            padding: 0;
            color: inherit;
        }
        ul, ol {
            margin-left: 20px;
            margin-bottom: 15px;
        }
        li {
            margin-bottom: 8px;
        }
        li > p {
            margin: 0;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            page-break-inside: avoid;
            font-size: 0.9em;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #3498db;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        blockquote {
            border-left: 4px solid #3498db;
            margin: 20px 0;
            padding-left: 20px;
            color: #666;
            font-style: italic;
            background-color: #f8f9fa;
            padding: 15px 20px;
        }
        hr {
            border: none;
            border-top: 2px solid #eee;
            margin: 30px 0;
        }
        strong {
            color: #2c3e50;
            font-weight: 600;
        }
        em {
            color: #555;
        }
        a {
            color: #3498db;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .header-info {
            background-color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
            border-left: 4px solid #3498db;
        }
        .loading {
            text-align: center;
            padding: 50px;
            color: #666;
        }
        @media print {
            body {
                padding: 0;
            }
            h1, h2, h3, h4 {
                page-break-after: avoid;
            }
            pre, table, blockquote {
                page-break-inside: avoid;
            }
            a {
                color: #2c3e50;
            }
        }
    </style>
</head>
<body>
    <div id="content">
        <div class="loading">Chargement du document...</div>
    </div>
    <script>
        // Décoder le contenu base64
        function decodeBase64(base64) {
            try {
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                return new TextDecoder('utf-8').decode(bytes);
            } catch (e) {
                console.error('Erreur de décodage:', e);
                return '';
            }
        }
        
        // Contenu Markdown encodé en base64
        const base64Content = '$base64Content';
        const markdown = decodeBase64(base64Content);
        
        // Fonction pour rendre le Markdown
        function renderMarkdown() {
            const contentDiv = document.getElementById('content');
            if (typeof marked !== 'undefined') {
                contentDiv.innerHTML = marked.parse(markdown);
            } else {
                // Attendre le chargement de marked
                const checkMarked = setInterval(() => {
                    if (typeof marked !== 'undefined') {
                        clearInterval(checkMarked);
                        contentDiv.innerHTML = marked.parse(markdown);
                    }
                }, 100);
                
                // Timeout après 5 secondes
                setTimeout(() => {
                    clearInterval(checkMarked);
                    if (typeof marked === 'undefined') {
                        contentDiv.innerHTML = '<pre>' + markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
                    }
                }, 5000);
            }
        }
        
        // Charger le document quand la page est prête
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', renderMarkdown);
        } else {
            renderMarkdown();
        }
    </script>
</body>
</html>
"@

# Écrire le fichier HTML
$htmlContent | Out-File -FilePath $htmlFile -Encoding UTF8

Write-Host "Fichier HTML créé : $htmlFile" -ForegroundColor Green

# Ouvrir dans le navigateur
Write-Host "Ouverture du fichier HTML dans le navigateur..." -ForegroundColor Cyan
Write-Host "Utilisez Ctrl+P puis 'Enregistrer en PDF' pour créer le PDF" -ForegroundColor Yellow

$browser = $null
$chromePath = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

foreach ($path in $chromePath) {
    if (Test-Path $path) {
        $browser = $path
        break
    }
}

if (-not $browser) {
    if (Test-Path "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") {
        $browser = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
    }
}

if ($browser) {
    Start-Process $htmlFile
} else {
    Start-Process $htmlFile
}

