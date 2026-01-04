// Serveur HTTP simple pour tester l'envoi d'emails sans dépendances externes
// Usage: node simple-email-server.js

const http = require("http");
const url = require("url");
const querystring = require("querystring");

const PORT = 3001;

// Fonction d'envoi d'email via Resend API
const sendEmailViaResend = async (emailData) => {
  const apiKey = process.env.VITE_RESEND_API_KEY;

  if (!apiKey) {
    console.log("📧 [SIMULATION] Email qui serait envoyé:", emailData);
    return {
      success: true,
      id: "simulated-" + Date.now(),
      message: "Email simulé (pas de clé API Resend)",
    };
  }

  try {
    // Utiliser fetch natif de Node.js (v18+)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    return {
      success: true,
      id: result.id,
      message: "Email envoyé avec succès via Resend",
    };
  } catch (error) {
    throw new Error(`Erreur Resend: ${error.message}`);
  }
};

// Template d'email simple
const generateEmailTemplate = (data, type) => {
  switch (type) {
    case "poll_created":
      return `
        <h1>📅 DooDates - Nouveau sondage</h1>
        <p>Votre sondage "${data.pollTitle}" a été créé avec succès !</p>
        <p>Dates sélectionnées: ${data.selectedDates.join(", ")}</p>
        <p><a href="${data.pollUrl}">Voir le sondage</a></p>
      `;
    case "vote_confirmation":
      return `
        <h1>✅ Vote confirmé</h1>
        <p>Merci ${data.voterName} pour votre vote sur "${data.pollTitle}" !</p>
      `;
    case "vote_notification":
      return `
        <h1>🔔 Nouveau vote</h1>
        <p>${data.voterName} a voté sur votre sondage "${data.pollTitle}".</p>
      `;
    default:
      return "<p>Email de test DooDates</p>";
  }
};

// Serveur HTTP
const server = http.createServer(async (req, res) => {
  // Headers CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`📡 ${method} ${path}`);

  // Gérer les requêtes OPTIONS (preflight CORS)
  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route principale pour l'envoi d'emails
  if (path === "/api/send-email" && method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { type, data } = JSON.parse(body);

        console.log("📧 Requête d'envoi d'email:", { type, data });

        if (!type || !data) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: false,
              error: "Type et data requis",
            }),
          );
          return;
        }

        let emailData;

        switch (type) {
          case "poll_created":
            emailData = {
              from: "DooDates <onboarding@resend.dev>",
              to: [data.creatorEmail],
              subject: `📅 Votre sondage "${data.pollTitle}" a été créé`,
              html: generateEmailTemplate(data, type),
            };
            break;

          case "vote_confirmation":
            emailData = {
              from: "DooDates <onboarding@resend.dev>",
              to: [data.voterEmail],
              subject: `✅ Vote confirmé pour "${data.pollTitle}"`,
              html: generateEmailTemplate(data, type),
            };
            break;

          case "vote_notification":
            emailData = {
              from: "DooDates <onboarding@resend.dev>",
              to: [data.creatorEmail],
              subject: `🔔 Nouveau vote sur "${data.pollTitle}"`,
              html: generateEmailTemplate(data, type),
            };
            break;

          default:
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                success: false,
                error: `Type d'email non supporté: ${type}`,
              }),
            );
            return;
        }

        console.log("📤 Tentative d'envoi:", {
          from: emailData.from,
          to: emailData.to,
          subject: emailData.subject,
        });

        const result = await sendEmailViaResend(emailData);

        console.log("✅ Résultat:", result);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error("❌ Erreur:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            error: error.message || "Erreur inconnue",
          }),
        );
      }
    });
  }
  // Route de test
  else if (path === "/api/send-email" && method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "OK",
        message: "Serveur email de test actif",
        timestamp: new Date().toISOString(),
        hasApiKey: !!process.env.VITE_RESEND_API_KEY,
      }),
    );
  }
  // 404 pour les autres routes
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route non trouvée" }));
  }
});

// Démarrage du serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur email de test démarré sur http://localhost:${PORT}`);
  console.log(`📧 Endpoint: http://localhost:${PORT}/api/send-email`);
  console.log(
    `🔑 Clé Resend: ${process.env.VITE_RESEND_API_KEY ? "Configurée ✅" : "Manquante ⚠️ (mode simulation)"}`,
  );
  console.log("");
  console.log("💡 Pour tester depuis la console du navigateur:");
  console.log("   testEmail()");
});
