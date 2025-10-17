import { WorkspaceProvider } from '@/components/prototype/WorkspaceProvider';
import { WorkspaceLayoutPrototype } from '@/components/prototype/WorkspaceLayoutPrototype';

/**
 * Page Workspace
 * 
 * Nouvelle page pour l'UX IA-First
 * Layout 3 colonnes: Sidebar + Canvas + AI Chat
 */
export default function WorkspacePage() {
  return (
    <WorkspaceProvider>
      <WorkspaceLayoutPrototype />
    </WorkspaceProvider>
  );
}
