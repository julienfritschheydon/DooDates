/**
 * Test Manuel Bug #1 - Parsing dates avec mois explicite
 * VRAI TEST: Appelle directement l'API Gemini pour tester la création
 */

import { GeminiService } from '../src/lib/gemini';

async function runTests() {
  console.log('🧪 Tests Bug #1: Parsing dates avec mois explicite (VRAIE API GEMINI)\n');
  console.log('='.repeat(60));
  
  const geminiService = GeminiService.getInstance();
  
  const tests = [
    {
      id: 1,
      name: 'Week-end jeux avec samedis de mars 2026',
      message: 'Crée un sondage pour un week-end jeux. Ajoute tous les samedis de mars 2026',
      expectedMonth: 3, // Mars
      expectedDay: 6, // Samedi
      minDates: 4 // Au moins 4 samedis en mars
    },
    {
      id: 2,
      name: 'Réunion le 7 mars 2026',
      message: 'Organise une réunion le 7 mars 2026',
      expectedDates: ['2026-03-07']
    },
    {
      id: 3,
      name: 'Événement tous les samedis de mai 2026',
      message: 'Planifie un événement tous les samedis de mai 2026',
      expectedMonth: 5, // Mai
      expectedDay: 6, // Samedi
      minDates: 4 // Au moins 4 samedis
    },
    {
      id: 4,
      name: 'Dimanches de décembre 2025',
      message: 'Crée un sondage pour les dimanches de décembre 2025',
      expectedMonth: 12, // Décembre
      expectedDay: 0, // Dimanche
      minDates: 4
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📝 Test ${test.id}: ${test.name}`);
    console.log(`   Message: "${test.message}"`);
    
    try {
      // Appel RÉEL à l'API Gemini
      const result = await geminiService.generatePollFromText(test.message);
      
      if (!result.success || !result.data) {
        console.log(`   ❌ ÉCHEC: ${result.message || 'Erreur API'}`);
        failed++;
        continue;
      }

      const pollData = result.data;
      
      // Vérifier que c'est un Date Poll
      if (pollData.type !== 'date' && pollData.type !== 'datetime') {
        console.log(`   ❌ ÉCHEC: Type incorrect - attendu 'date', obtenu '${pollData.type}'`);
        failed++;
        continue;
      }

      const dates = pollData.dates || [];
      console.log(`   ✅ Poll créé avec ${dates.length} date(s)`);
      
      // Vérifier les dates générées
      let allDatesCorrect = true;
      
      if (test.minDates && dates.length < test.minDates) {
        console.log(`   ❌ Pas assez de dates: attendu ${test.minDates}, obtenu ${dates.length}`);
        allDatesCorrect = false;
      }
      
      for (const dateStr of dates) {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDay();
        
        console.log(`      - Date: ${dateStr} (mois: ${month}, jour: ${day})`);
        
        if (test.expectedMonth && month !== test.expectedMonth) {
          console.log(`      ❌ Mois incorrect: attendu ${test.expectedMonth}, obtenu ${month}`);
          allDatesCorrect = false;
        }
        
        if (test.expectedDay !== undefined && day !== test.expectedDay) {
          console.log(`      ❌ Jour incorrect: attendu ${test.expectedDay}, obtenu ${day}`);
          allDatesCorrect = false;
        }
        
        if (test.expectedDates && !test.expectedDates.includes(dateStr)) {
          console.log(`      ❌ Date inattendue: ${dateStr}`);
          allDatesCorrect = false;
        }
      }
      
      if (allDatesCorrect) {
        console.log(`   ✅ SUCCÈS: Toutes les dates sont correctes`);
        passed++;
      } else {
        console.log(`   ❌ ÉCHEC: Certaines dates sont incorrectes`);
        failed++;
      }
      
    } catch (error) {
      console.log(`   ❌ ERREUR: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Résultats: ${passed}/${tests.length} tests réussis`);
  console.log(`   ✅ Succès: ${passed}`);
  console.log(`   ❌ Échecs: ${failed}`);
  
  if (passed === tests.length) {
    console.log('\n🎉 Tous les tests sont passés !');
    process.exit(0);
  } else {
    console.log('\n❌ Certains tests ont échoué');
    process.exit(1);
  }
}

// Lancer les tests
runTests().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
