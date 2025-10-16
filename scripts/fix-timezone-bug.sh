#!/bin/bash
# Script de correction semi-automatique du bug de fuseau horaire
# Usage: ./scripts/fix-timezone-bug.sh [--all|--critical]

set -e

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Recherche des usages problématiques de toISOString().split()...${NC}\n"

# Fichiers critiques (impact UX direct)
CRITICAL_FILES=(
  "src/lib/gemini.ts"
  "src/lib/temporal-parser.ts"
  "src/lib/enhanced-gemini.ts"
  "src/services/PollCreationBusinessLogic.ts"
)

# Tous les fichiers avec le pattern
ALL_FILES=(
  "${CRITICAL_FILES[@]}"
  "src/components/TemporalTestInterface.tsx"
  "src/lib/calendar-generator.ts"
  "src/lib/progressive-calendar.ts"
)

MODE=${1:-"--critical"}

if [ "$MODE" = "--all" ]; then
  echo -e "${YELLOW}Mode: TOUS les fichiers${NC}"
  FILES=("${ALL_FILES[@]}")
else
  echo -e "${YELLOW}Mode: Fichiers CRITIQUES uniquement${NC}"
  FILES=("${CRITICAL_FILES[@]}")
fi

echo -e "\nFichiers à analyser:"
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    count=$(grep -c "toISOString()\.split(" "$file" 2>/dev/null || echo "0")
    echo -e "  - ${GREEN}$file${NC} (${count} usages)"
  else
    echo -e "  - ${RED}$file${NC} (fichier non trouvé)"
  fi
done

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  ATTENTION: Ce script NE FAIT PAS de remplacement automatique${NC}"
echo -e "${YELLOW}   Il affiche seulement les occurrences à corriger manuellement.${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

read -p "Continuer l'analyse? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Annulé."
  exit 0
fi

echo -e "\n${GREEN}📊 Détail des occurrences:${NC}\n"

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}Fichier: $file${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    
    # Afficher les lignes avec contexte
    grep -n -B 1 -A 1 "toISOString()\.split(" "$file" || echo "  (Aucune occurrence)"
    
    echo -e "\n"
  fi
done

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Analyse terminée!${NC}\n"

echo -e "${YELLOW}📝 Instructions de correction:${NC}"
echo -e "1. Ajouter l'import: ${GREEN}import { formatDateLocal, getTodayLocal } from '@/lib/date-utils';${NC}"
echo -e "2. Remplacer ${RED}date.toISOString().split('T')[0]${NC} par ${GREEN}formatDateLocal(date)${NC}"
echo -e "3. Remplacer ${RED}today.toISOString().split('T')[0]${NC} par ${GREEN}getTodayLocal()${NC}"
echo -e "4. Tester les changements\n"

echo -e "${YELLOW}📚 Voir le détail complet: ${GREEN}Docs/Bug-Fuseau-Horaire-TODO.md${NC}\n"
