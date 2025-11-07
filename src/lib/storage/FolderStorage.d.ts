/**
 * Folder Storage - Gestion centralisée des dossiers
 * Permet d'organiser les conversations/sondages en dossiers
 */
export interface Folder {
    id: string;
    name: string;
    color: string;
    icon: string;
    createdAt: string;
    itemCount?: number;
}
/**
 * Récupère tous les dossiers
 */
export declare function getAllFolders(): Folder[];
/**
 * Sauvegarde les dossiers
 */
export declare function saveFolders(folders: Folder[]): void;
/**
 * Crée un nouveau dossier
 */
export declare function createFolder(name: string, color?: string, icon?: string): Folder;
/**
 * Met à jour un dossier
 */
export declare function updateFolder(folderId: string, updates: Partial<Pick<Folder, "name" | "color" | "icon">>): Folder;
/**
 * Supprime un dossier
 */
export declare function deleteFolder(folderId: string): void;
/**
 * Récupère un dossier par ID
 */
export declare function getFolderById(folderId: string): Folder | undefined;
/**
 * Calcule le nombre d'items dans un dossier
 */
export declare function getFolderItemCount(folderId: string, allItems: {
    folderId?: string;
}[]): number;
