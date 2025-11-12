import type { Page } from '@playwright/test';

interface DashboardSeedOptions {
  mode?: 'guest' | 'authenticated';
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

interface DashboardSeedPayload {
  tags: Array<{ id: string; name: string; color: string; createdAt: string }>;
  folders: Array<{ id: string; name: string; color: string; icon: string; createdAt: string }>;
  conversations: Array<{
    id: string;
    title: string;
    status: 'active' | 'completed';
    createdAt: string;
    updatedAt: string;
    firstMessage: string;
    messageCount: number;
    isFavorite: boolean;
    tags: string[];
    metadata: Record<string, any>;
  }>;
  polls: Array<{
    id: string;
    title: string;
    slug: string;
    type: string;
    status: 'active' | 'completed';
    created_at: string;
    settings: Record<string, any>;
  }>;
}

const DEFAULT_DASHBOARD_DATA: DashboardSeedPayload = {
  tags: [
    { id: 'tag-1', name: 'Test Tag 1', color: '#3b82f6', createdAt: new Date().toISOString() },
    { id: 'tag-2', name: 'Test Tag 2', color: '#ef4444', createdAt: new Date().toISOString() },
    { id: 'tag-3', name: 'Test Tag 3', color: '#10b981', createdAt: new Date().toISOString() },
  ],
  folders: [
    { id: 'folder-1', name: 'Test Folder 1', color: '#3b82f6', icon: '📁', createdAt: new Date().toISOString() },
    { id: 'folder-2', name: 'Test Folder 2', color: '#ef4444', icon: '📂', createdAt: new Date().toISOString() },
  ],
  conversations: [
    {
      id: 'test-conv-1',
      title: 'Conversation active',
      status: 'active',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      firstMessage: 'Premier message actif',
      messageCount: 5,
      isFavorite: false,
      tags: ['Test Tag 1'],
      metadata: { folderId: 'folder-1' },
    },
    {
      id: 'test-conv-2',
      title: 'Conversation brouillon',
      status: 'active',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date().toISOString(),
      firstMessage: 'Premier message brouillon',
      messageCount: 2,
      isFavorite: true,
      tags: ['Test Tag 2'],
      metadata: {},
    },
    {
      id: 'test-conv-3',
      title: 'Conversation avec poll',
      status: 'completed',
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date().toISOString(),
      firstMessage: 'Premier message avec poll',
      messageCount: 10,
      isFavorite: false,
      tags: ['Test Tag 1', 'Test Tag 3'],
      metadata: { folderId: 'folder-2', pollId: 'test-poll-1', pollGenerated: true },
    },
  ],
  polls: [
    {
      id: 'test-poll-1',
      title: 'Sondage de test',
      slug: 'sondage-test',
      type: 'date',
      status: 'active',
      created_at: new Date().toISOString(),
      settings: {
        selectedDates: ['2025-02-01', '2025-02-02'],
      },
    },
  ],
};

function getSupabaseProjectId(): string {
  if (typeof window === 'undefined') {
    return 'test';
  }

  const fromEnv =
    (typeof window !== 'undefined' && (window as any).__VITE_SUPABASE_URL__) ||
    (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
    '';

  const parsedEnv = fromEnv.split('//')[1]?.split('.')[0];
  if (parsedEnv && parsedEnv.length > 0) {
    return parsedEnv;
  }

  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const project = key.substring(3, key.length - '-auth-token'.length);
        if (project) {
          return project;
        }
      }
    }
  } catch {}

  return 'test';
}

async function resolveProjectId(page: Page): Promise<string> {
  return page.evaluate(() => {
    const fromEnv =
      (typeof window !== 'undefined' && (window as any).__VITE_SUPABASE_URL__) ||
      '';

    const parsedEnv = fromEnv.split('//')[1]?.split('.')[0];
    if (parsedEnv && parsedEnv.length > 0) {
      return parsedEnv;
    }

    try {
      for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const project = key.substring(3, key.length - '-auth-token'.length);
          if (project) {
            return project;
          }
        }
      }
    } catch {}

    return 'test';
  });
}

async function seedLocalStorage(page: Page, payload: DashboardSeedPayload): Promise<void> {
  const serializablePayload = JSON.parse(JSON.stringify(payload));
  await page.evaluate(({ data }) => {
    localStorage.setItem('doodates_tags', JSON.stringify(data.tags));
    localStorage.setItem('doodates_folders', JSON.stringify(data.folders));
    localStorage.setItem('doodates_conversations', JSON.stringify(data.conversations));
    localStorage.setItem('dev-polls', JSON.stringify(data.polls));
  }, { data: serializablePayload });
}

async function seedSupabaseSession(page: Page, options: Required<DashboardSeedOptions>): Promise<void> {
  const projectId = await resolveProjectId(page);

  await page.evaluate(({ user, projectIdParam }) => {
    const projectId = projectIdParam;
    const supabaseUrl = (window as any).__VITE_SUPABASE_URL__ || `https://${projectId}.supabase.co`;
    const tokenKey = `sb-${projectId}-auth-token`;

    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const supabaseSession = {
      user: {
        id: user.id,
        email: user.email,
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {
          provider: 'email',
          providers: ['email'],
        },
        user_metadata: {
          full_name: user.fullName ?? 'Dashboard Test User',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_at: expiresAt,
      expires_in: 3600,
      token_type: 'bearer',
    } as const;

    localStorage.setItem(tokenKey, JSON.stringify(supabaseSession));
    localStorage.setItem(
      'supabase.auth.token',
      JSON.stringify({
        currentSession: supabaseSession,
        currentUser: supabaseSession.user,
        expiresAt,
        expiresIn: supabaseSession.expires_in,
      }),
    );
  }, { user: options.user, projectIdParam: projectId });
}

export async function seedDashboard(
  page: Page,
  options: DashboardSeedOptions = {},
  overridePayload?: Partial<DashboardSeedPayload>,
): Promise<void> {
  const mode = options.mode ?? 'guest';
  const user = options.user ?? {
    id: 'auth-dashboard-user',
    email: 'dashboard.test@doodates.dev',
    fullName: 'Dashboard Test User',
  };

  const payload: DashboardSeedPayload = {
    tags: overridePayload?.tags ?? DEFAULT_DASHBOARD_DATA.tags,
    folders: overridePayload?.folders ?? DEFAULT_DASHBOARD_DATA.folders,
    conversations: overridePayload?.conversations ?? DEFAULT_DASHBOARD_DATA.conversations,
    polls: overridePayload?.polls ?? DEFAULT_DASHBOARD_DATA.polls,
  };

  await seedLocalStorage(page, payload);

  if (mode === 'authenticated') {
    await seedSupabaseSession(page, { mode, user });
  }
}

export { DashboardSeedOptions, DashboardSeedPayload, DEFAULT_DASHBOARD_DATA, getSupabaseProjectId };
