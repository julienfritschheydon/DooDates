/**
 * Tests d'Intégration Réels - Supabase Production (SIMPLIFIÉS)
 * 
 * Tests adaptés au schéma Supabase RÉEL de production.
 * Structure confirmée :
 * - conversations: id, user_id, title, status, is_favorite, messages (JSONB), etc.
 * - Pas de table conversation_messages séparée
 * - Pas de colonnes folders, tags dans conversations
 * 
 * Ces tests vérifient le système réel sans mocks.
 */

import { test, expect, Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://julienfritschheydon.github.io/DooDates';
const TEST_EMAIL = 'test-integration@doodates.com';
const TEST_PASSWORD = process.env.INTEGRATION_TEST_PASSWORD || 'TestPassword123!';

let supabaseClient: SupabaseClient;
let testUserId: string;
let testConversationIds: string[] = [];

// Configuration Supabase (vrai client, pas de mock)
test.beforeAll(async () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('❌ Variables Supabase manquantes (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Client Supabase créé pour tests d\'intégration');
});

// Connexion avec compte de test
test.beforeEach(async ({ page }) => {
  // 1. Nettoyer les données précédentes
  if (testUserId) {
    await cleanupTestData(testUserId);
  }

  // 2. Se connecter avec le compte de test
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    throw new Error(`❌ Échec connexion compte de test: ${error.message}`);
  }

  testUserId = data.user!.id;
  console.log(`✅ Connecté avec compte de test: ${testUserId.substring(0, 8)}...`);

  // 2.5. Vérifier/créer le profile (fix foreign key constraint)
  const { data: existingProfile } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('id', testUserId)
    .single();

  if (!existingProfile) {
    console.log('⚠️ Profile manquant, création automatique...');
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: testUserId,
        email: TEST_EMAIL,
        full_name: 'Test Integration User',
        timezone: 'Europe/Paris',
        preferences: {},
        plan_type: 'free',
      });

    if (profileError) {
      console.warn('⚠️ Erreur création profile:', profileError.message);
      // Continue quand même - le profile existe peut-être déjà
    } else {
      console.log('✅ Profile créé');
    }
  }

  // 3. Configurer la session dans le navigateur
  await page.goto(BASE_URL);
  
  // Injecter le token d'authentification dans le localStorage du navigateur
  await page.evaluate((sessionData: any) => {
    const supabaseUrl = 'https://outmbbisrrdiumlweira.supabase.co';
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
    const authKey = `sb-${projectRef}-auth-token`;
    
    // Format exact attendu par Supabase
    const authSession = {
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
      expires_in: sessionData.expires_in,
      expires_at: sessionData.expires_at,
      token_type: sessionData.token_type,
      user: sessionData.user,
    };
    
    localStorage.setItem(authKey, JSON.stringify(authSession));
  }, data.session);

  // Recharger la page pour que l'application détecte la session
  await page.reload({ waitUntil: 'networkidle' });
  
  console.log('✅ Session configurée dans le navigateur');
});

// Nettoyage après chaque test
test.afterEach(async () => {
  if (testUserId) {
    await cleanupTestData(testUserId);
    console.log('✅ Données de test nettoyées');
  }
});

// Déconnexion finale
test.afterAll(async () => {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
    console.log('✅ Déconnexion du compte de test');
  }
});

/**
 * Helper: Nettoyer toutes les données de test
 */
async function cleanupTestData(userId: string) {
  try {
    // Supprimer conversations de test
    const { error: convError } = await supabaseClient
      .from('conversations')
      .delete()
      .eq('user_id', userId);

    if (convError) {
      console.warn('⚠️ Erreur nettoyage conversations:', convError.message);
    }

    // Réinitialiser tracking
    testConversationIds = [];

    console.log(`🧹 Nettoyage effectué pour user ${userId.substring(0, 8)}...`);
  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  }
}

/**
 * Helper: Créer une conversation de test directement via API Supabase
 * Structure RÉELLE du schéma Supabase
 */
async function createTestConversation(userId: string, title: string = 'Test Conversation') {
  const conversationId = uuidv4();
  
  const { data, error } = await supabaseClient
    .from('conversations')
    .insert({
      id: conversationId,
      user_id: userId,
      session_id: conversationId,
      title,
      status: 'active',
      is_favorite: false,
      first_message: 'Test message',
      message_count: 1,
      messages: [],
      context: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`❌ Erreur création conversation test: ${error.message}`);
  }

  testConversationIds.push(conversationId);
  return data;
}

// ============================================================================
// TESTS CRITIQUES - AUTHENTIFICATION
// ============================================================================

test.describe('🔐 Authentification - Tests Réels', () => {
  test('AUTH-01: Token Supabase valide dans localStorage', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const tokenValid = await page.evaluate(() => {
      try {
        const supabaseUrl = 'https://outmbbisrrdiumlweira.supabase.co';
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
        const authKey = `sb-${projectRef}-auth-token`;
        const authData = localStorage.getItem(authKey);
        
        if (!authData) return false;
        
        const parsed = JSON.parse(authData);
        return !!parsed.access_token && !!parsed.user?.id;
      } catch {
        return false;
      }
    });

    expect(tokenValid).toBe(true);
    console.log('✅ AUTH-01: Token valide dans localStorage');
  });

  test('AUTH-02: User ID correspond au compte de test', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const userId = await page.evaluate(() => {
      const supabaseUrl = 'https://outmbbisrrdiumlweira.supabase.co';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
      const authKey = `sb-${projectRef}-auth-token`;
      const authData = localStorage.getItem(authKey);
      
      if (!authData) return null;
      
      const parsed = JSON.parse(authData);
      return parsed.user?.id;
    });

    expect(userId).toBe(testUserId);
    console.log(`✅ AUTH-02: User ID = ${userId?.substring(0, 8)}...`);
  });
});

// ============================================================================
// TESTS CRITIQUES - CONVERSATIONS (CRUD SIMPLIFIÉ)
// ============================================================================

test.describe('💬 Conversations - Tests CRUD Réels', () => {
  test('CONV-01: Créer une conversation via Supabase', async () => {
    const conversation = await createTestConversation(testUserId, 'Test Création');

    expect(conversation.id).toBeTruthy();
    expect(conversation.user_id).toBe(testUserId);
    expect(conversation.title).toBe('Test Création');
    expect(conversation.status).toBe('active');
    
    console.log(`✅ CONV-01: Conversation créée: ${conversation.id}`);
  });

  test('CONV-02: Lire une conversation depuis Supabase', async () => {
    const created = await createTestConversation(testUserId, 'Test Lecture');

    const { data, error } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', created.id)
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.title).toBe('Test Lecture');
    
    console.log('✅ CONV-02: Conversation lue avec succès');
  });

  test('CONV-03: Mettre à jour une conversation', async () => {
    const created = await createTestConversation(testUserId, 'Titre Original');

    const { data, error } = await supabaseClient
      .from('conversations')
      .update({ title: 'Titre Modifié', is_favorite: true })
      .eq('id', created.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data!.title).toBe('Titre Modifié');
    expect(data!.is_favorite).toBe(true);
    
    console.log('✅ CONV-03: Conversation mise à jour');
  });

  test('CONV-04: Supprimer une conversation', async () => {
    const created = await createTestConversation(testUserId, 'À Supprimer');

    const { error: deleteError } = await supabaseClient
      .from('conversations')
      .delete()
      .eq('id', created.id);

    expect(deleteError).toBeNull();

    // Vérifier qu'elle n'existe plus
    const { data } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', created.id)
      .maybeSingle();

    expect(data).toBeNull();
    
    console.log('✅ CONV-04: Conversation supprimée');
  });

  test('CONV-05: Lister conversations d\'un utilisateur', async () => {
    // Créer 3 conversations
    await createTestConversation(testUserId, 'Conv 1');
    await createTestConversation(testUserId, 'Conv 2');
    await createTestConversation(testUserId, 'Conv 3');

    const { data, error } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.length).toBeGreaterThanOrEqual(3);
    
    console.log(`✅ CONV-05: ${data!.length} conversations listées`);
  });
});

// ============================================================================
// TESTS CRITIQUES - RLS (Row Level Security)
// ============================================================================

test.describe('🔒 RLS - Tests de Sécurité', () => {
  test('RLS-01: Utilisateur voit uniquement SES conversations', async () => {
    await createTestConversation(testUserId, 'Ma Conversation');

    const { data, error } = await supabaseClient
      .from('conversations')
      .select('*');

    expect(error).toBeNull();
    expect(data).toBeTruthy();

    // Toutes les conversations doivent appartenir à notre utilisateur
    const allBelongToUser = data!.every((conv: any) => conv.user_id === testUserId);
    expect(allBelongToUser).toBe(true);
    
    console.log(`✅ RLS-01: ${data!.length} conversations (toutes au user ${testUserId.substring(0, 8)}...)`);
  });

  test('RLS-02: Impossible de modifier conversation d\'un autre utilisateur', async () => {
    const conv = await createTestConversation(testUserId, 'Original');

    // Se déconnecter
    await supabaseClient.auth.signOut();

    // Essayer de modifier sans être connecté
    const { error } = await supabaseClient
      .from('conversations')
      .update({ title: 'Hacked' })
      .eq('id', conv.id);

    // Devrait échouer
    expect(error).toBeTruthy();
    
    // Se reconnecter pour les tests suivants
    await supabaseClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    console.log('✅ RLS-02: Modification interdite (RLS fonctionne)');
  });
});

// ============================================================================
// TESTS CRITIQUES - PERFORMANCE
// ============================================================================

test.describe('⚡ Performance - Tests de Vitesse', () => {
  test('PERF-01: Lecture conversations < 2s', async () => {
    const startTime = Date.now();

    const { data, error } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('user_id', testUserId)
      .order('updated_at', { ascending: false })
      .limit(50);

    const duration = Date.now() - startTime;

    expect(error).toBeNull();
    expect(duration).toBeLessThan(2000);
    
    console.log(`✅ PERF-01: Lecture en ${duration}ms`);
  });

  test('PERF-02: Création conversation < 1s', async () => {
    const startTime = Date.now();

    await createTestConversation(testUserId, 'Perf test');

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000);
    
    console.log(`✅ PERF-02: Création en ${duration}ms`);
  });
});

// ============================================================================
// TESTS CRITIQUES - CONNEXION SUPABASE
// ============================================================================

test.describe('🔗 Connexion Supabase', () => {
  test('CONN-01: Client Supabase peut se connecter', async () => {
    // Vérifier que le client est initialisé
    expect(supabaseClient).toBeTruthy();
    
    // Vérifier qu'on peut lire la table conversations (même vide)
    const { error } = await supabaseClient
      .from('conversations')
      .select('count')
      .eq('user_id', testUserId);

    expect(error).toBeNull();
    
    console.log('✅ CONN-01: Connexion Supabase réussie');
  });
});

// ============================================================================
// RÉSUMÉ DES TESTS
// ============================================================================

test.afterAll(() => {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ DES TESTS D\'INTÉGRATION (SIMPLIFIÉS)');
  console.log('='.repeat(80));
  console.log(`✅ Tests exécutés sur PRODUCTION (${BASE_URL})`);
  console.log(`✅ Compte de test: ${TEST_EMAIL}`);
  console.log(`✅ User ID: ${testUserId?.substring(0, 8)}...`);
  console.log(`✅ ${testConversationIds.length} conversations créées et nettoyées`);
  console.log('='.repeat(80) + '\n');
});

