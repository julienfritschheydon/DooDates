export interface GeminiAttachedFile {
  name: string;
  mimeType: string;
  size: number;
  /** Base64 content without data: prefix */
  contentBase64: string;
}

/**
 * Convertit un File navigateur en structure prête pour un appel Gemini (inlineData.base64).
 * Ne fait aucune hypothèse sur le type de fichier : images, PDF, DOCX, etc.
 */
export const fileToGeminiAttachment = (file: File): Promise<GeminiAttachedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;

      resolve({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        contentBase64: base64,
      });
    };

    reader.onerror = (event) => {
      reject(event instanceof Error ? event : new Error("Erreur lors de la lecture du fichier"));
    };

    reader.readAsDataURL(file);
  });
};
