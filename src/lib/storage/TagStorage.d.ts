/**
 * Tag Storage - Gestion centralisée des tags
 * Stocke les tags disponibles et leurs métadonnées
 */
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  usageCount?: number;
}
/**
 * Récupère tous les tags disponibles
 */
export declare function getAllTags(): Tag[];
/**
 * Sauvegarde les tags
 */
export declare function saveTags(tags: Tag[]): void;
/**
 * Crée un nouveau tag
 */
export declare function createTag(name: string, color?: string): Tag;
/**
 * Met à jour un tag
 */
export declare function updateTag(
  tagId: string,
  updates: Partial<Pick<Tag, "name" | "color">>,
): Tag;
/**
 * Supprime un tag
 */
export declare function deleteTag(tagId: string): void;
/**
 * Calcule le nombre d'utilisations d'un tag
 */
export declare function getTagUsageCount(
  tagName: string,
  allItems: {
    tags?: string[];
  }[],
): number;
