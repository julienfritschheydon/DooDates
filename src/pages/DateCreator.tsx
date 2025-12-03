import React from "react";
import { AICreationWorkspace } from "../components/prototype/AICreationWorkspace";

/**
 * Page de création de sondage de dates avec IA
 * Wrapped in DooDates1 layout via App.tsx
 */
export default function DateCreator() {
  // AICreationWorkspace will detect type from URL or use this default
  return <AICreationWorkspace pollTypeFromUrl="date" />;
}
