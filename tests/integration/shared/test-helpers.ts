/**
 * Helpers Partagés pour Tests d'Intégration
 *
 * Centralise le code de setup, teardown et factories de données
 * pour éviter la duplication entre tests d'intégration et E2E.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TEST_PASSWORD = process.env.INTEGRATION_TEST_PASSWORD || 'TestPassword123!';
const TEST_EMAIL = 'test-integration@doodates.com';

// Types
export interface TestUser {
  id: string;
  email: string;
  session: any;
}

export interface TestConversation {
  id: string;
  user_id: string;
  title: string;
  status: string;
  message_count: number;
  messages: any[];
  context: any;
  session_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Vérifie que les credentials Supabase sont configurés
 */
export function validateSupabaseCredentials(): { isValid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');
  if (!process.env.INTEGRATION_TEST_PASSWORD) missing.push('INTEGRATION_TEST_PASSWORD');

  return {
    isValid: missing.length === 0,
    missing
  };
}

/**
 * Crée un client Supabase pour les tests
 */
export function createTestSupabaseClient(): SupabaseClient {
  const { isValid, missing } = validateSupabaseCredentials();

  if (!isValid) {
    throw new Error(`Credentials Supabase manquants: ${missing.join(', ')}`);
  }

  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}

/**
 * Authentifie l'utilisateur de test
 */
export async function authenticateTestUser(supabase: SupabaseClient): Promise<TestUser> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    throw new Error(`Échec authentification test: ${error.message}`);
  }

  if (!data.user) {
    throw new Error('Utilisateur test non trouvé');
  }

  return {
    id: data.user.id,
    email: data.user.email!,
    session: data.session,
  };
}

/**
 * Crée un utilisateur de test si nécessaire
 */
export async function ensureTestUser(supabase: SupabaseClient): Promise<TestUser> {
  try {
    return await authenticateTestUser(supabase);
  } catch (error) {
    // Si l'utilisateur n'existe pas, on pourrait le créer ici
    // Mais pour les tests d'intégration, on suppose qu'il existe
    throw error;
  }
}

/**
 * Vérifie/crée le profil utilisateur requis par les foreign keys
 */
export async function ensureTestProfile(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!existingProfile) {
    console.log('⚠️ Profile manquant, création automatique...');

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: TEST_EMAIL,
        full_name: 'Test Integration User',
        timezone: 'Europe/Paris',
        preferences: {},
        plan_type: 'free',
      });

    if (profileError && !profileError.message?.toLowerCase().includes('duplicate')) {
      throw new Error(`❌ Impossible de créer le profile test: ${profileError.message}`);
    }

    console.log('✅ Profile créé avec succès');
  }
}

/**
 * Factory: Crée une conversation de test
 */
export function createTestConversationData(
  userId: string,
  overrides: Partial<TestConversation> = {}
): Omit<TestConversation, 'id'> {
  const now = new Date().toISOString();

  return {
    user_id: userId,
    title: 'Test Conversation',
    status: 'active',
    message_count: 1,
    messages: [],
    context: {
      integrationTest: true,
      testId: uuidv4(),
    },
    session_id: `integration-${userId}`,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Crée une conversation de test dans la base
 */
export async function createTestConversation(
  supabase: SupabaseClient,
  userId: string,
  title: string = 'Test Conversation'
): Promise<TestConversation> {
  const conversationId = uuidv4();
  const conversationData = createTestConversationData(userId, { title });

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      id: conversationId,
      ...conversationData,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`❌ Erreur création conversation test: ${error.message}`);
  }

  return data;
}

/**
 * Nettoie les données de test pour un utilisateur
 */
export async function cleanupTestData(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    // Supprimer les conversations de test
    const { error: convError } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', userId)
      .contains('context', { integrationTest: true });

    if (convError) {
      console.warn('⚠️ Erreur nettoyage conversations:', convError.message);
    }

    console.log(`🧹 Nettoyage effectué pour user ${userId.substring(0, 8)}...`);
  } catch (error: any) {
    console.error('❌ Erreur lors du nettoyage:', error.message);
  }
}

/**
 * Génère un email de test unique
 */
export function generateTestEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}@doodates.com`;
}

/**
 * Mesure le temps d'exécution d'une opération
 */
export async function measureExecutionTime<T>(
  operation: () => Promise<T>,
  label: string
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await operation();
  const duration = Date.now() - startTime;

  console.log(`⏱️ ${label}: ${duration}ms`);
  return { result, duration };
}

/**
 * Vérifie que l'utilisateur ne voit que ses propres données (RLS)
 */
export async function verifyRLSEnabled(
  supabase: SupabaseClient,
  userId: string,
  expectedMinConversationCount: number = 0
): Promise<boolean> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*');

  if (error) {
    console.error('❌ Erreur RLS:', error.message);
    return false;
  }

  // Toutes les conversations doivent appartenir à l'utilisateur connecté
  const allBelongToUser = data!.every((conv: any) => conv.user_id === userId);
  const hasAtLeastExpected = data!.length >= expectedMinConversationCount;

  return allBelongToUser && hasAtLeastExpected;
}
