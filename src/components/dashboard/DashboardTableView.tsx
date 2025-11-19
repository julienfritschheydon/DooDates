import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  ClipboardList,
  MessageSquare,
  Users,
  Vote,
  BarChart3,
  Trash2,
  Check,
  MoreVertical,
  Settings,
  Share2,
  Download,
  Edit,
  Copy,
  Lock,
  Archive,
} from "lucide-react";
import { ConversationItem, DashboardPoll } from "./types";
import { getStatusColor, getStatusLabel } from "./utils";
import { useConversations } from "@/hooks/useConversations";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  buildPublicLink,
  copyToClipboard,
  duplicatePoll,
  addPoll,
  deleteVotesByPollId,
} from "@/lib/pollStorage";
import {
  exportFormPollToCSV,
  exportFormPollToPDF,
  exportFormPollToJSON,
  exportFormPollToMarkdown,
  hasExportableData,
} from "@/lib/exports";
import { usePollDeletionCascade } from "@/hooks/usePollDeletionCascade";
import { createConversationForPoll } from "@/lib/ConversationPollLink";
import { logError, ErrorFactory } from "@/lib/error-handling";
import { ManageTagsFolderDialog } from "./ManageTagsFolderDialog";

interface DashboardTableViewProps {
  items: ConversationItem[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onRefresh: () => void;
}

export const DashboardTableView: React.FC<DashboardTableViewProps> = ({
  items,
  selectedIds,
  onToggleSelection,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deleteConversation } = useConversations();
  const { deletePollWithCascade } = usePollDeletionCascade();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [showTagsFolderDialog, setShowTagsFolderDialog] = useState<string | null>(null);
  const [copiedPollIds, setCopiedPollIds] = useState<Set<string>>(new Set());
  const preloadTimeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleDeleteConversation = async (itemId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette conversation ?")) {
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(itemId));
    try {
      await deleteConversation.mutateAsync(itemId);
      toast({
        title: "Conversation supprimée",
        description: "La conversation a été supprimée avec succès.",
      });
      onRefresh();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la conversation.",
        variant: "destructive",
      });
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Handlers pour les actions de poll (extraits de PollActions)
  const handleCopyLink = async (poll: DashboardPoll) => {
    try {
      const url = buildPublicLink(poll.slug);
      await copyToClipboard(url);
      setCopiedPollIds((prev) => new Set(prev).add(poll.id));
      toast({
        title: "Lien copié",
        description: "Le lien du sondage a été copié.",
      });
      setTimeout(() => {
        setCopiedPollIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(poll.id);
          return newSet;
        });
      }, 2000);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  const handlePreloadEdit = (poll: DashboardPoll) => {
    // Précharger PollCreator si c'est un sondage de dates (pas formulaire)
    if (poll.type !== "form") {
      const timeoutRef = preloadTimeoutRefs.current.get(poll.id);
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
      const newTimeout = setTimeout(() => {
        if (typeof window.preloadPollCreator === "function") {
          window.preloadPollCreator();
        }
      }, 300);
      preloadTimeoutRefs.current.set(poll.id, newTimeout);
    }
  };

  const handleMouseLeaveEdit = (poll: Poll) => {
    const timeoutRef = preloadTimeoutRefs.current.get(poll.id);
    if (timeoutRef) {
      clearTimeout(timeoutRef);
      preloadTimeoutRefs.current.delete(poll.id);
    }
  };

  const handleEdit = (poll: Poll) => {
    if (poll.type === "form") {
      navigate(`/workspace/form?edit=${poll.id}`);
    } else {
      navigate(`/workspace/date?edit=${poll.id}`);
    }
  };

  const handleDuplicate = (poll: Poll) => {
    try {
      const dup = duplicatePoll(poll);
      addPoll(dup);
      createConversationForPoll(dup.id, dup.title, dup.type || "date");
      toast({
        title: "Sondage copié",
        description: "Le sondage et sa conversation ont été copiés avec succès.",
      });
      onRefresh();
    } catch (error) {
      logError(error, { component: "DashboardTableView", operation: "duplicatePoll" });
      toast({
        title: "Erreur",
        description: "Impossible de copier le sondage.",
        variant: "destructive",
      });
    }
  };

  const handleArchive = (poll: DashboardPoll) => {
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
      onRefresh();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'archiver le sondage.",
        variant: "destructive",
      });
    }
  };

  const handleClose = (poll: import("../../lib/pollStorage").Poll) => {
    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir terminer ce questionnaire ? Il ne sera plus possible de recevoir de nouvelles réponses.",
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
      toast({
        title: "Sondage terminé",
        description: "Le sondage est maintenant fermé aux nouveaux votes.",
      });
      onRefresh();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de terminer le questionnaire.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePoll = async (poll: DashboardPoll, itemId: string) => {
    const confirmMessage =
      "Êtes-vous sûr de vouloir supprimer ce sondage ?\n\n" +
      "Note: Les conversations liées seront également supprimées.";

    if (!window.confirm(confirmMessage)) return;

    try {
      deleteVotesByPollId(poll.id);
      const result = await deletePollWithCascade(poll.id, { deleteConversation: true });
      if (result.success) {
        toast({
          title: "Sondage supprimé",
          description: "Le sondage a été supprimé avec succès.",
        });
        onRefresh();
      } else {
        throw ErrorFactory.storage(
          result.error || "Failed to delete poll",
          "Impossible de supprimer le sondage",
        );
      }
    } catch (error) {
      logError(error, { component: "DashboardTableView", operation: "deletePoll" });
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de supprimer le sondage.",
        variant: "destructive",
      });
    }
  };

  const handleExport = (poll: DashboardPoll, format: "csv" | "pdf" | "json" | "markdown") => {
    if (poll.type !== "form") {
      toast({
        title: "Non supporté",
        description: "L'export n'est supporté que pour les formulaires actuellement.",
        variant: "destructive",
      });
      return;
    }

    try {
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
          component: "DashboardTableView",
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

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <colgroup>
          <col style={{ width: "48px", minWidth: "48px" }} />
          <col />
          <col style={{ width: "100px", minWidth: "80px" }} />
          <col className="hidden lg:table-column" style={{ width: "120px", minWidth: "100px" }} />
          <col className="hidden lg:table-column" style={{ width: "100px", minWidth: "80px" }} />
          <col style={{ width: "140px", minWidth: "120px" }} />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-2 md:px-3 lg:px-4 text-sm font-medium text-gray-400">
              <span className="sr-only">Sélection</span>
            </th>
            <th className="text-left py-3 px-2 md:px-3 lg:px-4 text-sm font-medium text-gray-400">
              Titre
            </th>
            <th className="text-left py-3 px-2 md:px-3 lg:px-4 text-sm font-medium text-gray-400">
              Statut
            </th>
            <th className="hidden lg:table-cell text-left py-3 px-4 text-sm font-medium text-gray-400">
              Statistiques
            </th>
            <th className="hidden lg:table-cell text-left py-3 px-4 text-sm font-medium text-gray-400">
              Date
            </th>
            <th className="text-left py-3 px-2 md:px-3 lg:px-4 text-sm font-medium text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const isSelected = selectedIds.has(item.id);
            const isDeleting = deletingIds.has(item.id);

            return (
              <tr
                key={item.id}
                className={`border-b border-gray-800 hover:bg-[#2a2a2a] transition-colors cursor-pointer ${
                  isSelected ? "bg-blue-900/20" : ""
                } ${index % 2 === 0 ? "bg-[#1e1e1e]" : "bg-[#252525]"}`}
                onClick={() => navigate(`/workspace?conversationId=${item.id}`)}
              >
                {/* Checkbox */}
                <td className="py-3 px-2 md:px-3 lg:px-4" onClick={(e) => e.stopPropagation()}>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-600 border-blue-600"
                        : "bg-transparent border-gray-500 hover:border-blue-400"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelection(item.id);
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </td>

                {/* Titre */}
                <td className="py-3 px-2 md:px-3 lg:px-4">
                  <div className="flex items-start gap-2">
                    {item.poll ? (
                      item.poll.type === "form" ? (
                        <ClipboardList className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      )
                    ) : (
                      <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium line-clamp-2 break-words">
                        {item.poll ? item.poll.title : item.conversationTitle}
                      </div>
                      {item.poll?.description && (
                        <div className="text-gray-400 text-xs line-clamp-1 mt-1">
                          {item.poll.description}
                        </div>
                      )}
                      {item.hasAI && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded mt-1">
                          💬 IA
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Statut */}
                <td className="py-3 px-2 md:px-3 lg:px-4">
                  {item.poll ? (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.poll.status === "draft"
                          ? "bg-gray-700 text-gray-300"
                          : item.poll.status === "active"
                            ? "bg-blue-900/50 text-blue-300"
                            : item.poll.status === "closed"
                              ? "bg-blue-900/50 text-blue-300"
                              : "bg-red-900/50 text-red-300"
                      }`}
                    >
                      {getStatusLabel(item.poll.status)}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-xs">Conversation</span>
                  )}
                </td>

                {/* Statistiques */}
                <td className="hidden lg:table-cell py-3 px-4">
                  {item.poll ? (
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{item.poll.participants_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Vote className="w-3 h-3" />
                        <span>{item.poll.votes_count || 0}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-xs">-</span>
                  )}
                </td>

                {/* Date */}
                <td className="hidden lg:table-cell py-3 px-4">
                  <div className="text-xs text-gray-400">
                    {item.conversationDate.toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3 px-2 md:px-3 lg:px-4" onClick={(e) => e.stopPropagation()}>
                  <div
                    className="flex items-center gap-1.5 md:gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.poll ? (
                      <>
                        {/* Actions principales : Résultats et Voter */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/poll/${item.poll!.slug}/results`);
                          }}
                          className="p-2 md:p-2 lg:p-1.5 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 rounded transition-colors touch-manipulation"
                          title="Résultats"
                        >
                          <BarChart3 className="w-5 h-5 md:w-4 md:h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/poll/${item.poll!.slug}`);
                          }}
                          className="p-2 md:p-2 lg:p-1.5 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 rounded transition-colors touch-manipulation"
                          title="Voter"
                        >
                          <Vote className="w-5 h-5 md:w-4 md:h-4" />
                        </button>

                        {/* Menu avec toutes les autres actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 md:p-2 lg:p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 touch-manipulation"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-5 h-5 md:w-4 md:h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowTagsFolderDialog(item.id);
                              }}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Gérer les tags/dossier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyLink(item.poll);
                              }}
                            >
                              {copiedPollIds.has(item.poll.id) ? (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Lien copié !
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Copier le lien
                                </>
                              )}
                            </DropdownMenuItem>
                            {item.poll.type === "form" && hasExportableData(item.poll) && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <Download className="w-4 h-4 mr-2" />
                                  Exporter
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExport(item.poll, "csv");
                                    }}
                                  >
                                    📊 CSV
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExport(item.poll, "pdf");
                                    }}
                                  >
                                    📄 PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExport(item.poll, "json");
                                    }}
                                  >
                                    🔧 JSON
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExport(item.poll, "markdown");
                                    }}
                                  >
                                    📝 Markdown
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(item.poll);
                              }}
                              onMouseEnter={() => handlePreloadEdit(item.poll)}
                              onMouseLeave={() => handleMouseLeaveEdit(item.poll)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicate(item.poll);
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Dupliquer
                            </DropdownMenuItem>
                            {item.poll.status === "active" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClose(item.poll);
                                }}
                              >
                                <Lock className="w-4 h-4 mr-2" />
                                Terminer
                              </DropdownMenuItem>
                            )}
                            {item.poll.status !== "archived" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchive(item.poll);
                                }}
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Archiver
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePoll(item.poll, item.id);
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      <>
                        {/* Actions pour conversation seule */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/workspace?conversationId=${item.id}`);
                          }}
                          className="px-3 py-2 md:px-3 md:py-2 lg:px-2 lg:py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors touch-manipulation"
                        >
                          Reprendre
                        </button>

                        {/* Menu pour gérer tags/dossier */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 md:p-2 lg:p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 touch-manipulation"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-5 h-5 md:w-4 md:h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowTagsFolderDialog(item.id);
                              }}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Gérer les tags/dossier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(item.id);
                              }}
                              className="text-red-600 focus:text-red-600"
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Dialog pour gérer tags et dossier */}
      {showTagsFolderDialog && (
        <ManageTagsFolderDialog
          conversationId={showTagsFolderDialog}
          currentTags={items.find((i) => i.id === showTagsFolderDialog)?.tags || []}
          currentFolderId={items.find((i) => i.id === showTagsFolderDialog)?.folderId}
          open={showTagsFolderDialog !== null}
          onOpenChange={(open) => {
            if (!open) setShowTagsFolderDialog(null);
          }}
          onSuccess={() => {
            setShowTagsFolderDialog(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
