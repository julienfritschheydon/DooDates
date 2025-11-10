/**
 * Test de debug pour l'Edge Function Gemini
 * Peut être exécuté avec: npm run test:debug-gemini
 */

import { test, expect } from '@playwright/test';

test.describe('Debug Gemini Edge Function', () => {
  test('should call Edge Function and get valid response', async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    console.log('🔍 Configuration détectée:');
    console.log(`  - VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Présente' : '❌ Manquante'}`);
    console.log(`  - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Présente' : '❌ Manquante'}`);

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('❌ Configuration Supabase manquante');
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/hyper-task`;
    console.log(`\n📡 Appel Edge Function: ${edgeFunctionUrl}`);

    const testPrompt = 'Organise une réunion lundi matin';
    console.log(`📝 Prompt test: "${testPrompt}"`);

    const response = await request.post(edgeFunctionUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        userInput: testPrompt,
      },
    });

    console.log(`\n📊 Statut HTTP: ${response.status()}`);
    
    const responseBody = await response.text();
    console.log(`📦 Réponse brute (${responseBody.length} caractères):`);
    console.log(responseBody.substring(0, 500));

    // Assertions
    expect(response.status()).toBe(200);

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(responseBody);
      console.log('\n✅ Réponse JSON valide');
      console.log('📋 Structure:', JSON.stringify(jsonResponse, null, 2).substring(0, 300));
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error);
      throw new Error(`Réponse non-JSON: ${responseBody}`);
    }

    // Vérifier la structure de la réponse
    expect(jsonResponse).toHaveProperty('success');
    
    if (!jsonResponse.success) {
      console.error('❌ Échec API:', jsonResponse);
      console.error('  - Error:', jsonResponse.error);
      console.error('  - Message:', jsonResponse.message);
    }

    expect(jsonResponse.success).toBe(true);
    expect(jsonResponse).toHaveProperty('data');
    expect(typeof jsonResponse.data).toBe('string');
    expect(jsonResponse.data.length).toBeGreaterThan(0);
    
    console.log('\n✅ Test réussi!');
    console.log(`📝 Réponse Gemini (${jsonResponse.data.length} caractères):`);
    console.log(jsonResponse.data.substring(0, 200));
  });

  test('should handle Edge Function errors gracefully', async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      test.skip();
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/hyper-task`;
    
    // Test avec userInput vide (devrait échouer gracieusement)
    const response = await request.post(edgeFunctionUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        userInput: '',
      },
    });

    console.log(`\n📊 Test erreur - Statut HTTP: ${response.status()}`);
    
    const responseBody = await response.text();
    console.log(`📦 Réponse erreur:`, responseBody.substring(0, 200));

    // L'Edge Function devrait retourner une erreur structurée
    const jsonResponse = JSON.parse(responseBody);
    expect(jsonResponse).toHaveProperty('success');
    expect(jsonResponse.success).toBe(false);
    expect(jsonResponse).toHaveProperty('error');
    
    console.log('✅ Gestion d\'erreur correcte');
  });

  test('should test Edge Function availability', async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('⚠️ Configuration Supabase manquante, test ignoré');
      test.skip();
    }

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/hyper-task`;
    
    console.log('\n🔍 Test de disponibilité Edge Function');
    console.log(`📡 URL: ${edgeFunctionUrl}`);

    try {
      const response = await request.post(edgeFunctionUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        data: {
          userInput: 'test',
        },
        timeout: 10000, // 10s timeout
      });

      console.log(`✅ Edge Function accessible (HTTP ${response.status()})`);
      
      // Peu importe le résultat, si on a une réponse HTTP, c'est que l'Edge Function existe
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
      
    } catch (error) {
      console.error('❌ Edge Function non accessible:', error);
      throw error;
    }
  });
});
