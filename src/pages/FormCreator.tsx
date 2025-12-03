import React from "react";
import { AICreationWorkspace } from "../components/prototype/AICreationWorkspace";

/**
 * Page de création de formulaire avec IA
 * Wrapped in DooDates2 layout via App.tsx
 */
export default function FormCreator() {
  return <AICreationWorkspace pollTypeFromUrl="form" />;
}
