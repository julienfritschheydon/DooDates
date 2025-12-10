import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormPollCreator from '../polls/FormPollCreator';
import { useAuth } from '../../contexts/AuthContext';
import { getAllPolls, savePolls, type Poll, type FormPollDraft } from '../../lib/pollStorage';
import { UIStateProvider } from '../prototype/UIStateProvider';
import { TestWrapper } from '../../test/setup';

// Mock des dépendances
vi.mock('../../contexts/AuthContext');
vi.mock('../../lib/pollStorage');
vi.mock('../../hooks/useAutoSave', () => ({
  useAutoSave: () => ({ save: vi.fn(), isSaving: false }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ idOrSlug: 'new' }),
    useLocation: () => ({ pathname: '/form/new' }),
  };
});

const mockUseAuth = vi.mocked(useAuth);
const mockGetAllPolls = vi.mocked(getAllPolls);
const mockSavePolls = vi.mocked(savePolls);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('FormPollCreator - Results Visibility', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });
    
    mockGetAllPolls.mockResolvedValue([]);
    mockSavePolls.mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  test('affiche les options de visibilité des résultats', async () => {
    render(
      <TestWrapper>
        <UIStateProvider>
          <FormPollCreator />
        </UIStateProvider>
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Visibilité des résultats')).toBeInTheDocument();
    }, { timeout: 5000 });
    
    // Vérifier que les 3 options sont présentes
    expect(screen.getByText('Moi uniquement')).toBeInTheDocument();
    expect(screen.getByText('Personnes ayant voté')).toBeInTheDocument();
    expect(screen.getByText('Public (tout le monde)')).toBeInTheDocument();
  });

  test('sélectionne "Moi uniquement" par défaut', async () => {
    render(
      <TestWrapper>
        <UIStateProvider>
          <FormPollCreator />
        </UIStateProvider>
      </TestWrapper>
    );
    
    await waitFor(() => {
      const creatorOnlyRadio = screen.getByDisplayValue('creator-only');
      expect(creatorOnlyRadio).toBeChecked();
    });
  });

  test('permet de changer la visibilité des résultats', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UIStateProvider>
          <FormPollCreator />
        </UIStateProvider>
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Visibilité des résultats')).toBeInTheDocument();
    });
    
    // Sélectionner "Personnes ayant voté"
    const votersOnlyRadio = screen.getByDisplayValue('voters');
    await user.click(votersOnlyRadio);
    
    expect(votersOnlyRadio).toBeChecked();
    expect(screen.getByDisplayValue('creator-only')).not.toBeChecked();
    expect(screen.getByDisplayValue('public')).not.toBeChecked();
  });

  test('permet de sélectionner "Public"', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UIStateProvider>
          <FormPollCreator />
        </UIStateProvider>
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Visibilité des résultats')).toBeInTheDocument();
    });
    
    // Sélectionner "Public"
    const publicRadio = screen.getByDisplayValue('public');
    await user.click(publicRadio);
    
    expect(publicRadio).toBeChecked();
    expect(screen.getByDisplayValue('creator-only')).not.toBeChecked();
    expect(screen.getByDisplayValue('voters')).not.toBeChecked();
  });

  test('persiste la visibilité lors de la sauvegarde', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UIStateProvider>
          <FormPollCreator />
        </UIStateProvider>
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Visibilité des résultats')).toBeInTheDocument();
    });
    
    // Changer la visibilité en "Public"
    const publicRadio = screen.getByDisplayValue('public');
    await user.click(publicRadio);
    
    // Ajouter une question pour pouvoir finaliser
    const questionInput = screen.getByPlaceholderText('Entrez votre question...');
    await user.type(questionInput, 'Question test');
    
    // Ajouter une option
    const addOptionButton = screen.getByText('Ajouter une option');
    await user.click(addOptionButton);
    
    const optionInput = screen.getByPlaceholderText('Option 1');
    await user.type(optionInput, 'Option test');
    
    // Finaliser le poll
    const finalizeButton = screen.getByText('Finaliser');
    await user.click(finalizeButton);
    
    // Vérifier que savePolls est appelé avec la bonne visibilité
    await waitFor(() => {
      expect(mockSavePolls).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            resultsVisibility: 'public',
          })
        ])
      );
    });
  });

  test('maintient la visibilité lors du rechargement', async () => {
    const existingPoll: Poll = {
      id: 'existing-poll',
      title: 'Poll existant',
      type: 'form',
      slug: 'poll-existant',
      creator_id: 'user-123',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
      questions: [],
      resultsVisibility: 'voters',
    };
    
    mockGetAllPolls.mockResolvedValue([existingPoll]);
    
    render(
      <TestWrapper>
        <UIStateProvider>
          <FormPollCreator />
        </UIStateProvider>
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Visibilité des résultats')).toBeInTheDocument();
    });
    
    // Vérifier que la visibilité est correctement chargée
    const votersOnlyRadio = screen.getByDisplayValue('voters');
    expect(votersOnlyRadio).toBeChecked();
    expect(screen.getByDisplayValue('creator-only')).not.toBeChecked();
    expect(screen.getByDisplayValue('public')).not.toBeChecked();
  });

  test('affiche les descriptions pour chaque option', async () => {
    render(
      <TestWrapper>
        <UIStateProvider>
          <FormPollCreator />
        </UIStateProvider>
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Visibilité des résultats')).toBeInTheDocument();
    });
    
    // Vérifier les descriptions
    expect(screen.getByText('(par défaut)')).toBeInTheDocument();
    expect(screen.getByText('(recommandé)')).toBeInTheDocument();
    expect(screen.getByText('Public (tout le monde)')).toBeInTheDocument();
  });

  test('gère le changement de visibilité avec le clavier', async () => {
    render(
      <TestWrapper>
        <UIStateProvider>
          <FormPollCreator />
        </UIStateProvider>
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Visibilité des résultats')).toBeInTheDocument();
    });
    
    // Utiliser Tab pour naviguer et Enter pour sélectionner
    const votersOnlyRadio = screen.getByDisplayValue('voters');
    votersOnlyRadio.focus();
    
    fireEvent.keyDown(votersOnlyRadio, { key: 'Enter', code: 'Enter' });
    
    expect(votersOnlyRadio).toBeChecked();
  });

  test('inclut la visibilité dans le state du draft', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <UIStateProvider>
          <FormPollCreator />
        </UIStateProvider>
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Visibilité des résultats')).toBeInTheDocument();
    });
    
    // Changer la visibilité
    const publicRadio = screen.getByDisplayValue('public');
    await user.click(publicRadio);
    
    // Le state devrait être mis à jour (vérification indirecte via la sauvegarde)
    const questionInput = screen.getByPlaceholderText('Entrez votre question...');
    await user.type(questionInput, 'Question test');
    
    const addOptionButton = screen.getByText('Ajouter une option');
    await user.click(addOptionButton);
    
    const optionInput = screen.getByPlaceholderText('Option 1');
    await user.type(optionInput, 'Option test');
    
    const finalizeButton = screen.getByText('Finaliser');
    await user.click(finalizeButton);
    
    await waitFor(() => {
      expect(mockSavePolls).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            resultsVisibility: 'public',
          })
        ])
      );
    });
  });

  test('réinitialise la visibilité par défaut pour un nouveau poll', async () => {
    // Simuler un nouveau poll (sans données existantes)
    mockGetAllPolls.mockResolvedValue([]);
    
    render(
      <TestWrapper>
        <UIStateProvider>
          <FormPollCreator />
        </UIStateProvider>
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Visibilité des résultats')).toBeInTheDocument();
    });
    
    // Vérifier que "Moi uniquement" est sélectionné par défaut
    const creatorOnlyRadio = screen.getByDisplayValue('creator-only');
    expect(creatorOnlyRadio).toBeChecked();
  });

  test('applique les styles visuels corrects aux options', async () => {
    render(
      <TestWrapper>
        <UIStateProvider>
          <FormPollCreator />
        </UIStateProvider>
      </TestWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Visibilité des résultats')).toBeInTheDocument();
    });
    
    // Vérifier que les radios ont les classes appropriées
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    
    radios.forEach(radio => {
      expect(radio).toHaveClass('form-radio');
    });
  });
});
