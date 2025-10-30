#!/bin/bash

# Script de validation des workflows GitHub Actions
# Usage: ./scripts/validate-workflows.sh

set -e

echo "🔍 Validation des workflows GitHub Actions..."
echo ""

WORKFLOWS_DIR=".github/workflows"
ERRORS=0

# Fonction pour afficher les erreurs
error() {
  echo "❌ $1"
  ERRORS=$((ERRORS + 1))
}

# Fonction pour afficher les succès
success() {
  echo "✅ $1"
}

# Vérifier que le dossier existe
if [ ! -d "$WORKFLOWS_DIR" ]; then
  error "Le dossier $WORKFLOWS_DIR n'existe pas"
  exit 1
fi

# Compter les fichiers
WORKFLOW_COUNT=$(find "$WORKFLOWS_DIR" -name "*.yml" -o -name "*.yaml" | wc -l)
echo "📄 $WORKFLOW_COUNT fichiers workflow trouvés"
echo ""

# Vérifier chaque fichier
for file in "$WORKFLOWS_DIR"/*.yml "$WORKFLOWS_DIR"/*.yaml; do
  [ -f "$file" ] || continue
  
  filename=$(basename "$file")
  echo "Vérification de $filename..."
  
  # 1. Vérifier que le fichier n'est pas vide
  if [ ! -s "$file" ]; then
    error "$filename: Fichier vide"
    continue
  fi
  
  # 2. Vérifier les emojis problématiques dans body/title
  # Note: Checking for cross mark emoji (U+274C) using UTF-8 sequence
  if grep -q 'body:.*\xE2\x9D\x8C' "$file" || grep -q 'title:.*\xE2\x9D\x8C' "$file"; then
    error "$filename: Emoji cross mark trouvé dans body/title (utiliser du texte à la place)"
  fi
  
  # 3. Vérifier le markdown bold ** dans les body
  if grep -q 'body:.*\*\*' "$file"; then
    error "$filename: Markdown bold ** trouvé dans body (peut causer des erreurs YAML)"
  fi
  
  # 4. Vérifier les listes numérotées
  if grep -E 'body:.*^[[:space:]]*[0-9]+\.' "$file"; then
    error "$filename: Liste numérotée trouvée dans body (utiliser des puces - à la place)"
  fi
  
  # 5. Vérifier les backticks non échappés (désactivé - trop de faux positifs avec template literals JS)
  # Les template literals JavaScript multi-lignes sont valides, ne pas vérifier
  
  success "$filename: OK"
  echo ""
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
  success "Tous les workflows sont valides ! 🎉"
  exit 0
else
  error "$ERRORS erreur(s) trouvée(s)"
  echo ""
  echo "💡 Conseils pour corriger :"
  echo "  - Retirer les emojis ❌ des body/title"
  echo "  - Remplacer ** par du texte simple"
  echo "  - Utiliser des puces (-) au lieu de listes numérotées (1.)"
  echo "  - Vérifier que tous les backticks sont fermés"
  exit 1
fi
