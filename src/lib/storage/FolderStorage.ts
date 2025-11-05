/**
 * Folder Storage - Gestion centralisée des dossiers
 * Permet d'organiser les conversations/sondages en dossiers
 */

import { logger } from "@/lib/logger";
import { ErrorFactory } from "@/lib/error-handling";

export interface Folder {
  id: string;
  name: string;
  color: string; // Couleur hex (ex: "#3b82f6")
  icon: string; // Emoji ou icône (ex: "📁", "😊")
  createdAt: string;
  itemCount?: number; // Nombre d'items dans ce dossier
}

const STORAGE_KEY = "doodates_folders";

/**
 * Récupère tous les dossiers
 */
export function getAllFolders(): Folder[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Folder[];
    }
    return [];
  } catch (error) {
    logger.error("Erreur chargement dossiers", error);
    return [];
  }
}

/**
 * Sauvegarde les dossiers
 */
export function saveFolders(folders: Folder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
  } catch (error) {
    logger.error("Erreur sauvegarde dossiers", error);
  }
}

/**
 * Crée un nouveau dossier
 */
export function createFolder(
  name: string,
  color: string = "#3b82f6",
  icon: string = "📁",
): Folder {
  const folders = getAllFolders();
  const newFolder: Folder = {
    id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: name.trim(),
    color,
    icon,
    createdAt: new Date().toISOString(),
    itemCount: 0,
  };

  // Vérifier que le nom n'existe pas déjà
  if (folders.some((f) => f.name.toLowerCase() === newFolder.name.toLowerCase())) {
    throw ErrorFactory.validation(
      `Un dossier avec le nom "${name}" existe déjà`,
      `Le dossier "${name}" existe déjà. Veuillez choisir un autre nom.`,
    );
  }

  folders.push(newFolder);
  saveFolders(folders);
  return newFolder;
}

/**
 * Met à jour un dossier
 */
export function updateFolder(
  folderId: string,
  updates: Partial<Pick<Folder, "name" | "color" | "icon">>,
): Folder {
  const folders = getAllFolders();
  const index = folders.findIndex((f) => f.id === folderId);
  if (index === -1) {
    throw ErrorFactory.notFound(
      `Dossier avec l'ID "${folderId}" introuvable`,
      `Le dossier demandé n'existe pas.`,
    );
  }

  // Vérifier que le nouveau nom n'existe pas déjà (si changement de nom)
  if (updates.name && folders.some((f, i) => i !== index && f.name.toLowerCase() === updates.name!.toLowerCase())) {
    throw ErrorFactory.validation(
      `Un dossier avec le nom "${updates.name}" existe déjà`,
      `Le dossier "${updates.name}" existe déjà. Veuillez choisir un autre nom.`,
    );
  }

  folders[index] = { ...folders[index], ...updates };
  saveFolders(folders);
  return folders[index];
}

/**
 * Supprime un dossier
 */
export function deleteFolder(folderId: string): void {
  const folders = getAllFolders();
  const filtered = folders.filter((f) => f.id !== folderId);
  if (filtered.length === folders.length) {
    throw ErrorFactory.notFound(
      `Dossier avec l'ID "${folderId}" introuvable`,
      `Le dossier demandé n'existe pas.`,
    );
  }
  saveFolders(filtered);
}

/**
 * Récupère un dossier par ID
 */
export function getFolderById(folderId: string): Folder | undefined {
  return getAllFolders().find((f) => f.id === folderId);
}

/**
 * Calcule le nombre d'items dans un dossier
 */
export function getFolderItemCount(folderId: string, allItems: { folderId?: string }[]): number {
  return allItems.filter((item) => item.folderId === folderId).length;
}

