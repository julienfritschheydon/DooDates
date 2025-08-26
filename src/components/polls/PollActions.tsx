import React from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Edit, Share2, Trash2, Vote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Poll,
  buildPublicLink,
  copyToClipboard,
  deletePollById,
  duplicatePoll,
} from "@/lib/pollStorage";

export type PollActionsVariant = "compact" | "full";

interface PollActionsProps {
  poll: Poll;
  showVoteButton?: boolean;
  variant?: PollActionsVariant;
  className?: string;
  onEdit?: (pollId: string) => void;
  onAfterDuplicate?: (newPoll: Poll) => void;
  onAfterDelete?: () => void;
}

export const PollActions: React.FC<PollActionsProps> = ({
  poll,
  showVoteButton = true,
  variant = "full",
  className,
  onEdit,
  onAfterDuplicate,
  onAfterDelete,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCopyLink = async () => {
    try {
      const url = buildPublicLink(poll.slug);
      await copyToClipboard(url);
      toast({
        title: "Lien copié",
        description: "Le lien du sondage a été copié.",
      });
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    if (onEdit) return onEdit(poll.id);
    if ((poll as any)?.type === "form") {
      navigate(`/create/form?edit=${poll.id}`);
    } else {
      navigate(`/create?edit=${poll.id}`);
    }
  };

  const handleDuplicate = () => {
    try {
      const dup = duplicatePoll(poll);
      toast({
        title: "Sondage copié",
        description: "Le sondage a été copié avec succès.",
      });
      onAfterDuplicate?.(dup);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de copier le sondage.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce sondage ?"))
      return;
    try {
      deletePollById(poll.id);
      toast({
        title: "Sondage supprimé",
        description: "Le sondage a été supprimé avec succès.",
      });
      onAfterDelete?.();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le sondage.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {showVoteButton && (
        <button
          onClick={() => window.open(`/poll/${poll.slug}`, "_blank")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          data-testid="results-action-vote"
        >
          <Vote className="w-4 h-4" />
          Participer au vote
        </button>
      )}

      <button
        onClick={handleCopyLink}
        className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
        title="Copier le lien"
        data-testid="poll-action-copy-link"
      >
        <Share2 className="w-4 h-4" />
        {variant === "full" && <span className="hidden sm:inline">Lien</span>}
      </button>

      <button
        onClick={handleEdit}
        className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
        data-testid="poll-action-edit"
      >
        <Edit className="w-4 h-4" />
        {variant === "full" && <span>Modifier</span>}
      </button>

      <button
        onClick={handleDuplicate}
        className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
        data-testid="poll-action-duplicate"
      >
        <Copy className="w-4 h-4" />
        {variant === "full" && <span>Copier</span>}
      </button>

      <button
        onClick={handleDelete}
        className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
        title="Supprimer"
        data-testid="poll-action-delete"
      >
        <Trash2 className="w-4 h-4" />
        {variant === "full" && (
          <span className="hidden sm:inline">Supprimer</span>
        )}
      </button>
    </div>
  );
};

export default PollActions;
