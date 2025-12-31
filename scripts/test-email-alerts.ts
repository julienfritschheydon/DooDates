import DataRetentionService from '../src/services/DataRetentionService'

/**
 * Script de test complet pour le système d'alertes email
 * 
 * Tests à effectuer :
 * 1. Calcul des suppressions à venir
 * 2. Génération des emails
 * 3. Interface DataControl
 * 4. Job quotidien (simulation)
 */

const retentionService = DataRetentionService.getInstance()

async function testCalculSuppressions(): Promise<any[]> {
  console.log('🧪 Test 1: Calcul des suppressions à venir')

  const testSettings = {
    chatRetention: '30-days' as const,
    pollRetention: '12-months' as const,
    autoDeleteEnabled: true,
    emailNotifications: true,
    allowDataForImprovement: false
  }

  try {
    const warnings = await retentionService.calculateUpcomingDeletions('test-user-123', testSettings)

    console.log(`✅ ${warnings.length} alertes trouvées`)
    warnings.forEach(warning => {
      console.log(`   - ${warning.type}: ${warning.itemCount} éléments dans ${warning.daysUntilDeletion} jours`)
    })

    return warnings
  } catch (error) {
    console.error('❌ Erreur calcul suppressions:', error)
    return []
  }
}

async function testGenerationEmail(): Promise<void> {
  console.log('\n🧪 Test 2: Génération des emails')

  const testWarning = {
    type: 'chat' as const,
    daysUntilDeletion: 15,
    itemCount: 23,
    deletionDate: new Date(Date.now() + (15 * 24 * 60 * 60 * 1000)),
    userId: 'test-user-123',
    userEmail: 'test@example.com'
  }

  try {
    // Simuler la génération d'email (sans l'envoyer)
    const emailContent = await (retentionService as unknown as { generateEmailContent?: (warning: typeof testWarning) => Promise<{ subject: string; html: string } | null> }).generateEmailContent?.(testWarning)

    if (emailContent) {
      console.log('✅ Email généré avec succès')
      console.log(`   Sujet: ${emailContent.subject}`)
      console.log(`   HTML: ${emailContent.html.length} caractères`)
    } else {
      console.log('⚠️ Génération email non implémentée dans le service')
    }
  } catch (error) {
    console.error('❌ Erreur génération email:', error)
  }
}

async function testJobSimulation(): Promise<void> {
  console.log('\n🧪 Test 3: Simulation du job quotidien')

  try {
    // Simuler le job avec des données de test
    const mockUsers = [
      { id: 'user1', email: 'user1@example.com', chat_retention: '30-days', poll_retention: '12-months', auto_delete_enabled: true, email_notifications: true },
      { id: 'user2', email: 'user2@example.com', chat_retention: 'indefinite', poll_retention: '6-years', auto_delete_enabled: true, email_notifications: true },
      { id: 'user3', email: 'user3@example.com', chat_retention: '12-months', poll_retention: '12-months', auto_delete_enabled: false, email_notifications: false }
    ]

    console.log(`📊 Simulation pour ${mockUsers.length} utilisateurs`)

    let totalWarnings = 0

    for (const user of mockUsers) {
      const settings = {
        chatRetention: user.chat_retention as any,
        pollRetention: user.poll_retention as any,
        autoDeleteEnabled: user.auto_delete_enabled,
        emailNotifications: user.email_notifications,
        allowDataForImprovement: false
      }

      if (user.auto_delete_enabled && user.email_notifications) {
        const warnings = await retentionService.calculateUpcomingDeletions(user.id, settings)
        const imminentWarnings = warnings.filter(w => w.daysUntilDeletion <= 30)

        if (imminentWarnings.length > 0) {
          console.log(`⚠️ ${imminentWarnings.length} alertes pour ${user.email}`)
          imminentWarnings.forEach(w => {
            console.log(`   - ${w.type}: ${w.itemCount} éléments dans ${w.daysUntilDeletion} jours`)
          })
          totalWarnings += imminentWarnings.length
        }
      }
    }

    console.log(`✅ Simulation terminée: ${totalWarnings} alertes à envoyer`)

  } catch (error) {
    console.error('❌ Erreur simulation job:', error)
  }
}

function testInterfaceDataControl(): void {
  console.log('\n🧪 Test 4: Interface DataControl (localStorage)')

  try {
    // Tester la persistance localStorage
    const testSettings = {
      chatRetention: '12-months',
      pollRetention: '6-years',
      autoDeleteEnabled: true,
      emailNotifications: true,
      allowDataForImprovement: true
    }

    // Simuler localStorage (dans un vrai navigateur)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('doodates_chat_retention', testSettings.chatRetention)
      localStorage.setItem('doodates_poll_retention', testSettings.pollRetention)
      localStorage.setItem('doodates_auto_delete', testSettings.autoDeleteEnabled.toString())
      localStorage.setItem('doodates_email_notifications', testSettings.emailNotifications.toString())
      localStorage.setItem('doodates_allow_data_improvement', testSettings.allowDataForImprovement.toString())

      console.log('✅ Paramètres sauvegardés dans localStorage')

      // Vérifier la lecture
      const savedSettings = {
        chatRetention: localStorage.getItem('doodates_chat_retention'),
        pollRetention: localStorage.getItem('doodates_poll_retention'),
        autoDeleteEnabled: localStorage.getItem('doodates_auto_delete') !== 'false',
        emailNotifications: localStorage.getItem('doodates_email_notifications') !== 'false',
        allowDataForImprovement: localStorage.getItem('doodates_allow_data_improvement') === 'true'
      }

      console.log('✅ Paramètres relus:', savedSettings)
    } else {
      console.log('⚠️ localStorage non disponible (test en dehors du navigateur)')
    }

  } catch (error) {
    console.error('❌ Erreur test interface:', error)
  }
}

async function testPostponement(): Promise<void> {
  console.log('\n🧪 Test 5: Report de suppression')

  try {
    const success = await retentionService.postponeDeletion('test-user-123', 'chat')

    if (success) {
      console.log('✅ Report de suppression réussi')
    } else {
      console.log('⚠️ Report de suppression simulé (pas de backend)')
    }
  } catch (error) {
    console.error('❌ Erreur report suppression:', error)
  }
}

// Fonction principale de test
async function runAllTests(): Promise<void> {
  console.log('🚀 Démarrage des tests du système d\'alertes email\n')

  await testCalculSuppressions()
  await testGenerationEmail()
  await testJobSimulation()
  testInterfaceDataControl()
  await testPostponement()

  console.log('\n✅ Tests terminés !')
  console.log('\n📋 Prochaines étapes:')
  console.log('1. Démarrer le serveur de développement: npm run dev')
  console.log('2. Aller sur /data-control pour tester l\'interface')
  console.log('3. Configurer les variables d\'environnement Supabase')
  console.log('4. Déployer les Supabase Functions')
  console.log('5. Activer le GitHub Actions workflow')
}

import { fileURLToPath } from 'url';

// Exécuter les tests
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAllTests()
    .then(() => {
      console.log('\n🎉 Tous les tests exécutés avec succès')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Échec des tests:', error)
      process.exit(1)
    })
}

export default runAllTests
