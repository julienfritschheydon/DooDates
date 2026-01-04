// Test de connectivité vers l'API Resend
// Usage: node test-resend-connectivity.js

require("dotenv").config();

async function testResendConnectivity() {
  console.log("🔍 Test de connectivité vers l'API Resend...\n");

  const apiKey = process.env.VITE_RESEND_API_KEY;

  if (!apiKey) {
    console.log("❌ Pas de clé API Resend configurée");
    return;
  }

  console.log("🔑 Clé API trouvée:", apiKey.substring(0, 10) + "...");

  // Test 1: Ping simple vers l'API
  console.log("\n📡 Test 1: Connectivité de base vers api.resend.com...");
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Réponse HTTP:", response.status, response.statusText);

    if (response.status === 405) {
      console.log("✅ Connectivité OK (405 = Method Not Allowed attendu pour GET)");
    }
  } catch (error) {
    console.log("❌ Erreur de connectivité:", error.message);
    console.log("   → Possible problème: pare-feu, proxy, DNS, ou réseau");
  }

  // Test 2: Envoi d'email de test minimal
  console.log("\n📧 Test 2: Envoi d'email de test minimal...");
  try {
    const emailData = {
      from: "DooDates <onboarding@resend.dev>",
      to: ["test@example.com"], // Email invalide volontairement
      subject: "Test connectivité DooDates",
      html: "<p>Test de connectivité</p>",
    };

    console.log("📤 Envoi vers:", emailData.to[0]);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    console.log("📡 Statut HTTP:", response.status);

    const responseText = await response.text();
    console.log("📋 Réponse complète:", responseText);

    if (response.ok) {
      console.log("✅ Requête acceptée par Resend !");
      console.log("   → Le problème n'est PAS la connectivité");
    } else {
      console.log("❌ Requête rejetée par Resend");
      console.log("   → Vérifiez la clé API, le format, ou les permissions");
    }
  } catch (error) {
    console.log("❌ Erreur lors de l'envoi:", error.message);
    console.log("   → Problème réseau confirmé");
  }

  // Test 3: Vérification DNS
  console.log("\n🌐 Test 3: Résolution DNS...");
  try {
    const dns = require("dns").promises;
    const addresses = await dns.resolve4("api.resend.com");
    console.log("✅ DNS OK - Adresses IP:", addresses);
  } catch (error) {
    console.log("❌ Problème DNS:", error.message);
  }
}

// Exécution
testResendConnectivity().catch(console.error);
