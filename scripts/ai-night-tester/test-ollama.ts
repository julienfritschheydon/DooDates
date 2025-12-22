// Test with a longer prompt like the night tester uses
const testOllamaLongPrompt = async () => {
    console.log("Testing Ollama API with longer prompt...\n");

    const prompt = `Tu es un testeur QA automatisé pour une application web de sondages appelée DooDates.

PAGE ACTUELLE:
- URL: http://localhost:8080/DooDates/
- Titre: DooDates - Sondages de dates

ÉLÉMENTS INTERACTIFS DISPONIBLES:
1. [button] "Sondages de Dates" → button:has-text("Sondages de Dates")
2. [button] "Formulaires" → button:has-text("Formulaires")
3. [link] "Documentation" → a:has-text("Documentation")
4. [link] "Pricing" → a:has-text("Pricing")

DERNIÈRES ACTIONS:
(aucune)

OBJECTIF: Tester systématiquement l'application.

RÉPONDS EXACTEMENT dans ce format JSON:
{
  "action": {
    "type": "click",
    "selector": "le sélecteur CSS",
    "description": "brève description"
  },
  "reasoning": "pourquoi cette action"
}`;

    const startTime = Date.now();

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma2:2b',
                prompt,
                stream: false,
                options: {
                    temperature: 0.3,
                    num_predict: 500,
                },
            }),
        });

        const elapsed = Date.now() - startTime;
        console.log(`Response received in ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);

        if (!response.ok) {
            console.error(`HTTP Error: ${response.status} ${response.statusText}`);
            return;
        }

        const data = await response.json();
        console.log("\n=== RESPONSE ===");
        console.log(data.response);

    } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`Error after ${elapsed}ms:`, error);
    }
};

testOllamaLongPrompt();
