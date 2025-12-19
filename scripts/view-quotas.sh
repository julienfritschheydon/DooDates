#!/bin/bash
# Script Bash pour visualiser les quotas utilisateurs depuis Supabase
# Usage: ./scripts/view-quotas.sh [--stats] [--top] [--detailed]

SUPABASE_URL="${SUPABASE_URL:-https://outmbbisrrdiumlweira.supabase.co}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

# Options
STATS=false
TOP=false
DETAILED=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --stats)
      STATS=true
      shift
      ;;
    --top)
      TOP=true
      shift
      ;;
    --detailed)
      DETAILED=true
      shift
      ;;
    *)
      echo "Usage: $0 [--stats] [--top] [--detailed]"
      exit 1
      ;;
  esac
done

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ Erreur: SUPABASE_SERVICE_ROLE_KEY manquant"
  echo "   Définissez la variable d'environnement: export SUPABASE_SERVICE_ROLE_KEY=..."
  exit 1
fi

echo "📊 Visualisation des quotas utilisateurs - DooDates"
echo ""

# Utiliser curl pour récupérer les données
REST_URL="${SUPABASE_URL}/rest/v1/quota_tracking?select=*,users:user_id(email,raw_user_meta_data)&order=total_credits_consumed.desc"

RESPONSE=$(curl -s -X GET "$REST_URL" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json")

if [ $? -ne 0 ] || [ -z "$RESPONSE" ]; then
  echo "❌ Erreur lors de la récupération des quotas"
  echo ""
  echo "💡 Alternative: Utilisez le script SQL directement dans Supabase Dashboard"
  echo "   Fichier: sql-scripts/view-user-quotas.sql"
  exit 1
fi

# Parser JSON avec jq si disponible, sinon utiliser Python
if command -v jq &> /dev/null; then
  if [ "$STATS" = true ]; then
    echo "📈 Statistiques globales"
    echo "=================================================="
    TOTAL_USERS=$(echo "$RESPONSE" | jq '. | length')
    TOTAL_CREDITS=$(echo "$RESPONSE" | jq '[.[].total_credits_consumed] | add')
    AVG_CREDITS=$(echo "$RESPONSE" | jq '[.[].total_credits_consumed] | add / length')
    MAX_CREDITS=$(echo "$RESPONSE" | jq '[.[].total_credits_consumed] | max')
    
    echo "Total utilisateurs: $TOTAL_USERS"
    echo "Total crédits consommés: $TOTAL_CREDITS"
    echo "Moyenne par utilisateur: $(printf "%.2f" $AVG_CREDITS)"
    echo "Maximum: $MAX_CREDITS"
    echo ""
  elif [ "$TOP" = true ]; then
    echo "🏆 Top 10 utilisateurs"
    echo "=================================================================================="
    printf "%-40s %10s %10s %10s %10s %10s %10s %10s %10s\n" "Email" "Total" "Convs" "Polls" "Date" "Form" "Quizz" "Avail" "IA Msg"
    echo "----------------------------------------------------------------------------------"
    
    echo "$RESPONSE" | jq -r '.[0:10] | .[] | "\(.users.email // "N/A") \(.total_credits_consumed) \(.conversations_created) \(((.date_polls_created // 0) + (.form_polls_created // 0) + (.quizz_created // 0) + (.availability_polls_created // 0))) \(.date_polls_created // 0) \(.form_polls_created // 0) \(.quizz_created // 0) \(.availability_polls_created // 0) \(.ai_messages)"' | \
    while read -r email total convs polls date form quizz avail ai; do
      printf "%-40s %10s %10s %10s %10s %10s %10s %10s %10s\n" "$email" "$total" "$convs" "$polls" "$date" "$form" "$quizz" "$avail" "$ai"
    done
    echo ""
  else
    echo "📋 Liste complète des quotas"
    echo "===================================================================================================="
    
    echo "$RESPONSE" | jq -r '.[] | 
      "👤 \(.users.email // "N/A")\n" +
      (if .users.raw_user_meta_data.full_name then "   Nom: \(.users.raw_user_meta_data.full_name)\n" else "" end) +
      "   Total crédits: \(.total_credits_consumed)\n" +
      "   ├─ Conversations: \(.conversations_created)\n" +
      "   ├─ Polls (Total): \(((.date_polls_created // 0) + (.form_polls_created // 0) + (.quizz_created // 0) + (.availability_polls_created // 0)))\n" +
      "   │  ├─ Date Polls: \(.date_polls_created // 0)\n" +
      "   │  ├─ Form Polls: \(.form_polls_created // 0)\n" +
      "   │  ├─ Quizz: \(.quizz_created // 0)\n" +
      "   │  └─ Availability: \(.availability_polls_created // 0)\n" +
      "   ├─ Messages IA: \(.ai_messages)\n" +
      "   ├─ Analytics: \(.analytics_queries)\n" +
      "   └─ Simulations: \(.simulations)\n" +
      (if "'"$DETAILED"'" == "true" then "   Dernière mise à jour: \(.updated_at)\n" else "" end) +
      ""'
  fi
else
  echo "⚠️  jq n'est pas installé. Installation recommandée pour un meilleur affichage."
  echo ""
  echo "💡 Alternative: Utilisez le script SQL directement dans Supabase Dashboard"
  echo "   Fichier: sql-scripts/view-user-quotas.sql"
fi

echo "✅ Affichage terminé"

