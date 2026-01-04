import { createClient } from "@supabase/supabase-js";
import DataRetentionService from "../src/services/DataRetentionService";

/**
 * Job quotidien d'envoi d'alertes email avant suppression automatique
 *
 * Ce script s'exécute tous les jours pour :
 * 1. Identifier les utilisateurs ayant des suppressions à venir (dans 30 jours)
 * 2. Envoyer des alertes email pour chaque type de donnée concerné
 * 3. Logger les envois pour audit et suivi
 *
 * À déployer via GitHub Actions cron job ou Supabase Edge Functions scheduler
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variables d environnement Supabase manquantes");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const retentionService = DataRetentionService.getInstance();

interface UserWithSettings {
  id: string;
  email: string;
  chat_retention: string;
  poll_retention: string;
  auto_delete_enabled: boolean;
  email_notifications: boolean;
}

async function main() {
  console.log("🔄 Démarrage du job quotidien d'alertes de suppression...");

  try {
    // 1. Récupérer tous les utilisateurs avec suppression automatique activée
    const { data: users, error: usersError } = await supabase
      .from("user_settings")
      .select(
        `
        id,
        email,
        chat_retention,
        poll_retention,
        auto_delete_enabled,
        email_notifications
      `,
      )
      .eq("auto_delete_enabled", true)
      .eq("email_notifications", true);

    if (usersError) {
      console.error("Erreur récupération utilisateurs:", usersError);
      throw usersError;
    }

    console.log(`📊 ${users?.length || 0} utilisateurs vérifiés`);

    if (!users || users.length === 0) {
      console.log("✅ Aucun utilisateur avec notifications activées");
      return;
    }

    let totalWarningsSent = 0;
    let totalUsersProcessed = 0;

    // 2. Traiter chaque utilisateur
    for (const user of users) {
      try {
        const settings = {
          chatRetention: user.chat_retention as "30-days" | "12-months" | "indefinite",
          pollRetention: user.poll_retention as "30-days" | "12-months" | "indefinite",
          autoDeleteEnabled: user.auto_delete_enabled,
          emailNotifications: user.email_notifications,
          allowDataForImprovement: false, // Non utilisé pour ce job
        };

        // Calculer les suppressions à venir
        const warnings = await retentionService.calculateUpcomingDeletions(user.id, settings);

        // Filtrer uniquement les alertes dans 30 jours ou moins
        const imminentWarnings = warnings.filter((w) => w.daysUntilDeletion <= 30);

        if (imminentWarnings.length > 0) {
          console.log(`⚠️ ${imminentWarnings.length} alertes pour ${user.email}`);

          // Envoyer les emails via la Supabase Function
          const { data, error } = await supabase.functions.invoke("data-retention-warnings", {
            body: { warnings: imminentWarnings },
          });

          if (error) {
            console.error(`❌ Erreur envoi emails à ${user.email}:`, error);
          } else {
            console.log(`✅ Emails envoyés à ${user.email}`);
            totalWarningsSent += imminentWarnings.length;
          }
        }

        totalUsersProcessed++;
      } catch (userError) {
        console.error(`❌ Erreur traitement utilisateur ${user.id}:`, userError);
      }
    }

    // 3. Rapport final
    console.log("\n📋 Rapport du job:");
    console.log(`- Utilisateurs traités: ${totalUsersProcessed}`);
    console.log(`- Alertes envoyées: ${totalWarningsSent}`);
    console.log(`- Date d exécution: ${new Date().toISOString()}`);

    // 4. Logger dans la table job_logs pour audit
    await supabase.from("job_logs").insert({
      job_name: "data-retention-warnings",
      status: "completed",
      users_processed: totalUsersProcessed,
      warnings_sent: totalWarningsSent,
      executed_at: new Date().toISOString(),
      metadata: {
        total_users: users.length,
        execution_time_ms: Date.now(),
      },
    });

    console.log("✅ Job terminé avec succès");
  } catch (error) {
    console.error("❌ Erreur critique du job:", error);

    // Logger l'erreur
    await supabase.from("job_logs").insert({
      job_name: "data-retention-warnings",
      status: "failed",
      error_message: (error as Error).message,
      executed_at: new Date().toISOString(),
    });

    throw error;
  }
}

// Exécuter le job
if (require.main === module) {
  main()
    .then(() => {
      console.log("Job exécuté avec succès");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Job échoué:", error);
      process.exit(1);
    });
}

export default main;
