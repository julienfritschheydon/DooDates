/**
 * Tag Storage - Gestion centralisée des tags
 * Stocke les tags disponibles et leurs métadonnées
 */

import { logger } from "@/lib/logger";
import { ErrorFactory } from "@/lib/error-handling";

export interface Tag {
  id: string;
  name: string;
  color: string; // Couleur hex (ex: "#3b82f6")
  createdAt: string;
  usageCount?: number; // Nombre d'items utilisant ce tag
}

const STORAGE_KEY = "doodates_tags";
const DEFAULT_TAGS: Tag[] = [
  { id: "tag-1", name: "Prioritaire", color: "#ef4444", createdAt: new Date().toISOString() },
  { id: "tag-2", name: "Client", color: "#3b82f6", createdAt: new Date().toISOString() },
  { id: "tag-3", name: "Interne", color: "#10b981", createdAt: new Date().toISOString() },
  { id: "tag-4", name: "Marketing", color: "#f59e0b", createdAt: new Date().toISOString() },
  { id: "tag-5", name: "Produit", color: "#8b5cf6", createdAt: new Date().toISOString() },
];

/**
 * Récupère tous les tags disponibles
 */
export function getAllTags(): Tag[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const tags = JSON.parse(stored) as Tag[];
      return tags;
    }
    // Initialiser avec les tags par défaut
    saveTags(DEFAULT_TAGS);
    return DEFAULT_TAGS;
  } catch (error) {
    logger.error("Erreur chargement tags", error);
    return DEFAULT_TAGS;
  }
}

/**
 * Sauvegarde les tags
 */
export function saveTags(tags: Tag[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  } catch (error) {
    logger.error("Erreur sauvegarde tags", error);
  }
}

/**
 * Crée un nouveau tag
 */
export function createTag(name: string, color: string = "#3b82f6"): Tag {
  const tags = getAllTags();
  const newTag: Tag = {
    id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim(),
    color,
    createdAt: new Date().toISOString(),
    usageCount: 0,
  };

  // Vérifier que le nom n'existe pas déjà
  if (tags.some((t) => t.name.toLowerCase() === newTag.name.toLowerCase())) {
    throw ErrorFactory.validation(
      `Un tag avec le nom "${name}" existe déjà`,
      `Le tag "${name}" existe déjà. Veuillez choisir un autre nom.`,
    );
  }

  tags.push(newTag);
  saveTags(tags);
  return newTag;
}

/**
 * Met à jour un tag
 */
export function updateTag(tagId: string, updates: Partial<Pick<Tag, "name" | "color">>): Tag {
  const tags = getAllTags();
  const index = tags.findIndex((t) => t.id === tagId);
  if (index === -1) {
    throw ErrorFactory.notFound(
      `Tag avec l'ID "${tagId}" introuvable`,
      `Le tag demandé n'existe pas.`,
    );
  }

  // Vérifier que le nouveau nom n'existe pas déjà (si changement de nom)
  if (
    updates.name &&
    tags.some((t, i) => i !== index && t.name.toLowerCase() === updates.name!.toLowerCase())
  ) {
    throw ErrorFactory.validation(
      `Un tag avec le nom "${updates.name}" existe déjà`,
      `Le tag "${updates.name}" existe déjà. Veuillez choisir un autre nom.`,
    );
  }

  tags[index] = { ...tags[index], ...updates };
  saveTags(tags);
  return tags[index];
}

/**
 * Supprime un tag
 */
export function deleteTag(tagId: string): void {
  const tags = getAllTags();
  const filtered = tags.filter((t) => t.id !== tagId);
  if (filtered.length === tags.length) {
    throw ErrorFactory.notFound(
      `Tag avec l'ID "${tagId}" introuvable`,
      `Le tag demandé n'existe pas.`,
    );
  }
  saveTags(filtered);
}

/**
 * Calcule le nombre d'utilisations d'un tag
 */
export function getTagUsageCount(tagName: string, allItems: { tags?: string[] }[]): number {
  return allItems.filter((item) => item.tags?.includes(tagName)).length;
}
