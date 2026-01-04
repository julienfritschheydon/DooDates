/**
 * DIAGNOSTIC: Test Ollama response time under different conditions
 */

const BASE_URL = "http://localhost:11434";

async function testShortPrompt() {
  console.log("\\n=== TEST 1: Short prompt ===");
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5:0.5b",
      prompt: "Say OK",
      stream: false,
      options: { num_predict: 10 },
    }),
  });
  const data = await res.json();
  console.log(`   Time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log(`   Response: ${data.response}`);
}

async function testMediumPrompt() {
  console.log("\\n=== TEST 2: Medium prompt (like night tester) ===");
  const start = Date.now();
  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen2.5:0.5b",
      prompt: `Test QA. Choisis le NUMÉRO.
ÉLÉMENTS:
1. [button] "Submit"
2. [link] "Home"
3. [input] "Email"

TA RÉPONSE (JUSTE LE NUMÉRO):`,
      stream: false,
      options: { num_predict: 10 },
    }),
  });
  const data = await res.json();
  console.log(`   Time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
  console.log(`   Response: ${data.response}`);
}

async function testWithTimeout() {
  console.log("\\n=== TEST 3: With 45s timeout (AbortSignal) ===");
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen2.5:0.5b",
        prompt: "Say OK",
        stream: false,
        options: { num_predict: 10 },
      }),
      signal: AbortSignal.timeout(45000),
    });
    const data = await res.json();
    console.log(`   Time: ${((Date.now() - start) / 1000).toFixed(1)}s`);
    console.log(`   Response: ${data.response}`);
    console.log(`   ✅ SUCCESS`);
  } catch (e) {
    console.log(`   Time before error: ${((Date.now() - start) / 1000).toFixed(1)}s`);
    console.log(`   ❌ ERROR: ${e}`);
  }
}

async function main() {
  console.log("🔍 OLLAMA DIAGNOSTIC");
  console.log("====================");

  await testShortPrompt();
  await testMediumPrompt();
  await testWithTimeout();

  console.log("\\n✅ Diagnostic complete");
}

main().catch(console.error);
