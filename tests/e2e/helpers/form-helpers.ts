import { Page, Locator } from '@playwright/test';

const TITLE_SELECTORS = {
  // Sélecteur principal - doit correspondre au data-testid du composant
  byTestId: '[data-testid="poll-title"]',
  // Sélecteurs de fallback (au cas où)
  byLabel: 'label:has-text("Titre du formulaire") + input',
  byPlaceholder: 'input[placeholder*="Questionnaire"], input[placeholder*="Titre"]'
} as const;

/**
 * Récupère le champ de titre du formulaire
 */
export async function getTitleInput(
  page: Page,
  context: Page | Locator = page
): Promise<Locator | null> {
  // Essayer d'abord avec le data-testid
  const byTestId = context.locator(TITLE_SELECTORS.byTestId).first();
  if (await byTestId.isVisible({ timeout: 2000 }).catch(() => false)) {
    return byTestId;
  }

  // Fallback: chercher par label
  const byLabel = context.locator(TITLE_SELECTORS.byLabel).first();
  if (await byLabel.isVisible({ timeout: 1000 }).catch(() => false)) {
    return byLabel;
  }

  // Dernier recours: par placeholder
  const byPlaceholder = context.locator(TITLE_SELECTORS.byPlaceholder).first();
  if (await byPlaceholder.isVisible({ timeout: 1000 }).catch(() => false)) {
    return byPlaceholder;
  }

  return null;
}

/**
 * Remplit le titre du formulaire
 */
export async function fillFormTitle(
  page: Page,
  title: string,
  options: {
    context?: Page | Locator;
    skipIfNotEmpty?: boolean;
    timeout?: number;
  } = {}
): Promise<boolean> {
  const {
    context = page,
    skipIfNotEmpty = true,
    timeout = 5000
  } = options;

  try {
    const titleInput = await getTitleInput(page, context);
    if (!titleInput) {
      console.error('Champ de titre introuvable');
      return false;
    }

    if (skipIfNotEmpty) {
      const currentValue = await titleInput.inputValue().catch(() => '');
      if (currentValue && currentValue.trim() !== '') {
        return true; // Déjà rempli
      }
    }

    await titleInput.fill('');
    await titleInput.type(title, { delay: 50 });
    
    // Vérifier que la valeur a bien été définie
    const newValue = await titleInput.inputValue();
    if (newValue !== title) {
      console.error(`La valeur du champ titre n'a pas été correctement définie. Attendu: "${title}", Reçu: "${newValue}"`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors du remplissage du titre:', error);
    return false;
  }
}

export default {
  getTitleInput,
  fillFormTitle
};
