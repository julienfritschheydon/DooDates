import { MigrationProgress as MigrationProgressType } from "../lib/storage/ConversationMigrationService";
interface MigrationProgressProps {
  progress: MigrationProgressType | null;
  onCancel?: () => void;
  onRetry?: () => void;
  className?: string;
}
export declare function MigrationProgress({
  progress,
  onCancel,
  onRetry,
  className,
}: MigrationProgressProps): import("react/jsx-runtime").JSX.Element;
export {};
