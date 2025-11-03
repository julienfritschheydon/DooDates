import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Check, Copy, Download, Edit, Lock, Share2, Trash2, Vote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Poll,
  buildPublicLink,
  copyToClipboard,
  duplicatePoll,
  getAllPolls,
  addPoll,
} from "@/lib/pollStorage";
import {
  exportFormPollToCSV,
  exportFormPollToPDF,
  exportFormPollToJSON,
  exportFormPollToMarkdown,
  hasExportableData,
} from "@/lib/exports";
import { ErrorFactory, logError } from "@/lib/error-handling";
import {
  compareSimulationWithReality,
  getLastSimulation,
} from "@/lib/simulation/SimulationComparison";
import { usePollDeletionCascade } from "@/hooks/usePollDeletionCascade";
import { deleteVotesByPollId } from "@/lib/pollStorage";
import { createConversationForPoll } from "@/lib/ConversationPollLink";

export type PollActionsVariant = "compact" | "full";

interface PollActionsProps {
  poll: Poll;
  showVoteButton?: boolean;
  variant?: PollActionsVariant;
  className?: string;
  onEdit?: (pollId: string) => void;
  onAfterDuplicate?: (newPoll: Poll) => void;
  onAfterDelete?: () => void;
  onAfterArchive?: () => void;
  onAfterClose?: () => void;
}

export const PollActions: React.FC<PollActionsProps> = ({
  poll,
  showVoteButton = true,
  variant = "full",
  className,
  onEdit,
  onAfterDuplicate,
  onAfterDelete,
  onAfterArchive,
  onAfterClose,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { deletePollWithCascade } = usePollDeletionCascade();

  const handleCopyLink = async () => {
    try {
      const url = buildPublicLink(poll.slug);
      await copyToClipboard(url);
      setIsCopied(true);
      toast({
        title: "Lien copié",
        description: "Le lien du sondage a été copié.",
      });
      setTimeout(() => setIsCopied(false), 2000);
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
      navigate(`/create/date?edit=${poll.id}`);
    }
  };

  const handleDuplicate = () => {
    try {
      const dup = duplicatePoll(poll);

      // Create a conversation for the duplicated poll
      createConversationForPoll(dup.id, dup.title, dup.type || "date");

      toast({
        title: "Sondage copié",
        description: "Le sondage et sa conversation ont été copiés avec succès.",
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

  const handleArchive = () => {
    try {
      const updatedPoll = {
        ...poll,
        status: "archived" as const,
        updated_at: new Date().toISOString(),
      };
      addPoll(updatedPoll);
      toast({
        title: "Sondage archivé",
        description: "Le sondage a été archivé avec succès.",
      });
      onAfterArchive?.();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'archiver le sondage.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir clôturer ce questionnaire ? Il ne sera plus possible de recevoir de nouvelles réponses.",
      )
    )
      return;
    try {
      const updatedPoll = {
        ...poll,
        status: "closed" as const,
        updated_at: new Date().toISOString(),
      };
      addPoll(updatedPoll);

      // Déclencher comparaison simulation si applicable
      if (poll.type === "form") {
        const lastSimulation = getLastSimulation(poll.id);
        if (lastSimulation) {
          try {
            const comparison = compareSimulationWithReality(poll.id, lastSimulation);
            toast({
              title: "Questionnaire clôturé",
              description: `Précision de la simulation : ${comparison.accuracy.overall}%`,
            });
          } catch (error) {
            toast({
              title: "Questionnaire clôturé",
              description: "Le questionnaire est maintenant fermé aux nouvelles réponses.",
            });
          }
        } else {
          toast({
            title: "Questionnaire clôturé",
            description: "Le questionnaire est maintenant fermé aux nouvelles réponses.",
          });
        }
      } else {
        toast({
          title: "Sondage clôturé",
          description: "Le sondage est maintenant fermé aux nouveaux votes.",
        });
      }
      onAfterClose?.();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de clôturer le questionnaire.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    const confirmMessage =
      "Êtes-vous sûr de vouloir supprimer ce sondage ?\n\n" +
      "Note: Les conversations liées seront également supprimées.";

    if (!window.confirm(confirmMessage)) return;

    try {
      // Delete votes first
      deleteVotesByPollId(poll.id);

      // Delete poll and conversations
      const result = await deletePollWithCascade(poll.id, { deleteConversation: true });

      if (result.success) {
        let description = "Le sondage a été supprimé avec succès.";
        if (result.conversationDeleted) {
          description += " Les conversations liées ont été supprimées.";
        }

        toast({
          title: "Sondage supprimé",
          description,
        });
        onAfterDelete?.();
      } else {
        throw new Error(result.error || "Failed to delete poll");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le sondage.",
        variant: "destructive",
      });
    }
  };

  const handleExport = (format: "csv" | "pdf" | "json" | "markdown") => {
    try {
      if (poll.type !== "form") {
        toast({
          title: "Non supporté",
          description: "L'export n'est supporté que pour les formulaires actuellement.",
          variant: "destructive",
        });
        return;
      }

      switch (format) {
        case "csv":
          exportFormPollToCSV(poll);
          toast({
            title: "Export CSV réussi",
            description: "Le fichier CSV a été téléchargé.",
          });
          break;
        case "pdf":
          exportFormPollToPDF(poll);
          toast({
            title: "Export PDF",
            description:
              "Une fenêtre d'impression s'est ouverte. Sélectionnez 'Enregistrer en PDF'.",
          });
          break;
        case "json":
          exportFormPollToJSON(poll);
          toast({
            title: "Export JSON réussi",
            description: "Le fichier JSON a été téléchargé.",
          });
          break;
        case "markdown":
          exportFormPollToMarkdown(poll);
          toast({
            title: "Export Markdown réussi",
            description: "Le fichier Markdown a été téléchargé.",
          });
          break;
      }
    } catch (err) {
      logError(
        err instanceof Error
          ? err
          : ErrorFactory.api("Export error", "Erreur lors de l'export du sondage"),
        {
          component: "PollActions",
          operation: "handleExport",
          pollId: poll.id,
        },
      );
      toast({
        title: "Erreur d'export",
        description: err instanceof Error ? err.message : "Impossible d'exporter le sondage.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {showVoteButton && (
        <button
          onClick={() => navigate(`/poll/${poll.slug}`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          data-testid="results-action-vote"
        >
          <Vote className="w-4 h-4" />
          Participer au vote
        </button>
      )}

      <button
        onClick={handleCopyLink}
        className={`p-2 rounded-md transition-all duration-300 flex items-center gap-1 ${
          isCopied
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
        }`}
        title={isCopied ? "Lien copié !" : "Copier le lien"}
        data-testid="poll-action-copy-link"
        disabled={isCopied}
      >
        {isCopied ? (
          <>
            <Check className="w-4 h-4 animate-in zoom-in duration-200" />
            {variant === "full" && <span className="hidden sm:inline font-medium">Copié !</span>}
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            {variant === "full" && <span className="hidden sm:inline">Lien</span>}
          </>
        )}
      </button>

      {poll.type === "form" && hasExportableData(poll) && (
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center gap-1"
            title="Exporter"
            data-testid="poll-action-export"
          >
            <Download className="w-4 h-4" />
            {variant === "full" && <span>Exporter</span>}
          </button>

          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => {
                    handleExport("csv");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-t-md"
                >
                  📊 CSV
                </button>
                <button
                  onClick={() => {
                    handleExport("pdf");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  📄 PDF
                </button>
                <button
                  onClick={() => {
                    handleExport("json");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  🔧 JSON
                </button>
                <button
                  onClick={() => {
                    handleExport("markdown");
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-b-md"
                >
                  📝 Markdown
                </button>
              </div>
            </>
          )}
        </div>
      )}

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

      {poll.status === "active" && (
        <button
          onClick={handleClose}
          className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
          title="Clôturer"
          data-testid="poll-action-close"
        >
          <Lock className="w-4 h-4" />
          {variant === "full" && <span className="hidden sm:inline">Clôturer</span>}
        </button>
      )}

      {poll.status !== "archived" && (
        <button
          onClick={handleArchive}
          className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
          title="Archiver"
          data-testid="poll-action-archive"
        >
          <Archive className="w-4 h-4" />
          {variant === "full" && <span className="hidden sm:inline">Archiver</span>}
        </button>
      )}

      <button
        onClick={handleDelete}
        className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
        title="Supprimer"
        data-testid="poll-action-delete"
      >
        <Trash2 className="w-4 h-4" />
        {variant === "full" && <span className="hidden sm:inline">Supprimer</span>}
      </button>
    </div>
  );
};

export default PollActions;
