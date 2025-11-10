#!/bin/bash
# Script de test direct de l'Edge Function Gemini avec curl
# Usage: bash scripts/test-edge-function-curl.sh

set -e

# Charger les variables d'environnement
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "🔍 Test Edge Function Gemini avec curl"
echo "========================================"
echo ""

# Vérifier les variables d'environnement
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "❌ VITE_SUPABASE_URL non définie"
  exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "❌ VITE_SUPABASE_ANON_KEY non définie"
  exit 1
fi

echo "✅ Configuration détectée:"
echo "  - VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:0:30}..."
echo "  - VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:20}..."
echo ""

EDGE_FUNCTION_URL="${VITE_SUPABASE_URL}/functions/v1/gemini"
echo "📡 URL Edge Function: $EDGE_FUNCTION_URL"
echo ""

# Test 1: Prompt simple
echo "📝 Test 1: Prompt simple (réunion lundi matin)"
echo "----------------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$EDGE_FUNCTION_URL" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Organise une réunion lundi matin"}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "📊 Statut HTTP: $HTTP_STATUS"
echo "📦 Réponse:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_STATUS" != "200" ]; then
  echo "❌ Test 1 échoué (HTTP $HTTP_STATUS)"
  exit 1
fi

# Vérifier que la réponse contient "success"
if echo "$BODY" | jq -e '.success' > /dev/null 2>&1; then
  SUCCESS=$(echo "$BODY" | jq -r '.success')
  if [ "$SUCCESS" = "true" ]; then
    echo "✅ Test 1 réussi - API fonctionnelle"
    TYPE=$(echo "$BODY" | jq -r '.data.type')
    TITLE=$(echo "$BODY" | jq -r '.data.title')
    echo "  - Type: $TYPE"
    echo "  - Titre: $TITLE"
  else
    echo "❌ Test 1 échoué - success=false"
    ERROR=$(echo "$BODY" | jq -r '.error')
    MESSAGE=$(echo "$BODY" | jq -r '.message')
    echo "  - Error: $ERROR"
    echo "  - Message: $MESSAGE"
    exit 1
  fi
else
  echo "❌ Test 1 échoué - Réponse JSON invalide"
  exit 1
fi

echo ""

# Test 2: Prompt vide (devrait échouer gracieusement)
echo "📝 Test 2: Gestion d'erreur (prompt vide)"
echo "----------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$EDGE_FUNCTION_URL" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": ""}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "📊 Statut HTTP: $HTTP_STATUS"
echo "📦 Réponse:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Vérifier que l'erreur est gérée
if echo "$BODY" | jq -e '.success' > /dev/null 2>&1; then
  SUCCESS=$(echo "$BODY" | jq -r '.success')
  if [ "$SUCCESS" = "false" ]; then
    echo "✅ Test 2 réussi - Erreur gérée correctement"
  else
    echo "⚠️ Test 2 - Prompt vide accepté (comportement inattendu)"
  fi
else
  echo "❌ Test 2 échoué - Réponse JSON invalide"
  exit 1
fi

echo ""

# Test 3: Form Poll
echo "📝 Test 3: Génération Form Poll"
echo "-------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$EDGE_FUNCTION_URL" \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Crée un questionnaire de satisfaction client avec 3 questions"}')

HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "📊 Statut HTTP: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "200" ]; then
  SUCCESS=$(echo "$BODY" | jq -r '.success')
  if [ "$SUCCESS" = "true" ]; then
    TYPE=$(echo "$BODY" | jq -r '.data.type')
    QUESTIONS_COUNT=$(echo "$BODY" | jq -r '.data.questions | length')
    echo "✅ Test 3 réussi"
    echo "  - Type: $TYPE"
    echo "  - Nombre de questions: $QUESTIONS_COUNT"
  else
    echo "❌ Test 3 échoué - success=false"
    echo "$BODY" | jq '.'
  fi
else
  echo "❌ Test 3 échoué (HTTP $HTTP_STATUS)"
fi

echo ""
echo "========================================"
echo "✅ Tests terminés avec succès"
