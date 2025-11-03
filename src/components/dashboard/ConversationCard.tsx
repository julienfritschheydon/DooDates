import React, { useState } from "react";
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
} from "lucide-react";
import { ConversationItem } from "./types";
import { getStatusColor, getStatusLabel } from "./utils";
import PollActions from "@/components/polls/PollActions";
import { useConversations } from "@/hooks/useConversations";
import { useToast } from "@/hooks/use-toast";

interface ConversationCardProps {
  item: ConversationItem;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  onRefresh: () => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  item,
  isSelected = false,
  onToggleSelection,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deleteConversation } = useConversations();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCardClick = () => {
    // Ouvrir le workspace avec la conversation
    navigate(`/workspace?resume=${item.id}`);
  };

  const handleDeleteConversation = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette conversation ?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteConversation.mutateAsync(item.id);
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
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`bg-[#3c4043] rounded-lg shadow-sm border transition-all cursor-pointer relative ${
        isSelected ? "border-blue-500 ring-2 ring-blue-500/50" : "border-gray-700 hover:shadow-md"
      }`}
      data-testid="poll-item"
    >
      {/* Checkbox de sélection */}
      {onToggleSelection && (
        <div
          className="absolute top-4 right-4 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelection();
          }}
        >
          <div
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
              isSelected
                ? "bg-blue-600 border-blue-600"
                : "bg-transparent border-gray-500 hover:border-blue-400"
            }`}
          >
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>
      )}

      <div className="p-6" onClick={handleCardClick}>
        {/* Header : Titre du poll (priorité) ou conversation */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-10">
            <div className="flex items-center gap-2 mb-2">
              {item.poll ? (
                item.poll.type === "form" ? (
                  <ClipboardList className="w-5 h-5 text-purple-400 flex-shrink-0" />
                ) : (
                  <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0" />
                )
              ) : (
                <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <h3 className="text-lg font-semibold text-white line-clamp-2">
                {item.poll ? item.poll.title : item.conversationTitle}
              </h3>

              {/* Badge statut du poll - À côté du titre */}
              {item.poll && (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getStatusColor(
                    item.poll.status,
                  )}`}
                >
                  {getStatusLabel(item.poll.status)}
                </span>
              )}
            </div>

            {/* Description du poll */}
            {item.poll?.description && (
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.poll.description}</p>
            )}
          </div>
        </div>

        {/* Statistiques (si poll existe) */}
        {item.poll && (
          <div className="mb-4">
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>
                  {item.poll.participants_count || 0} participant
                  {(item.poll.participants_count || 0) > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Vote className="w-4 h-4" />
                <span>
                  {item.poll.type === "form" ? (
                    <>
                      {item.poll.votes_count || 0} réponse
                      {(item.poll.votes_count || 0) > 1 ? "s" : ""}
                    </>
                  ) : (
                    <>
                      {item.poll.votes_count || 0} vote
                      {(item.poll.votes_count || 0) > 1 ? "s" : ""}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Meilleures dates (pour sondages de dates) */}
            {item.poll.topDates && item.poll.topDates.length > 0 ? (
              <div className="mb-3">
                <div className="text-xs text-gray-400 mb-2 font-medium">🏆 Dates populaires :</div>
                <div className="flex flex-wrap gap-2">
                  {item.poll.topDates.map((dateInfo, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        index === 0
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-purple-900/30 text-purple-400"
                      }`}
                    >
                      {index === 0 && "⭐ "}
                      {dateInfo.date}
                      <span className="ml-1 text-xs opacity-75">({dateInfo.score} pts)</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              item.poll.votes_count > 0 &&
              item.poll.type !== "form" && (
                <div className="mb-3 text-xs text-gray-400">
                  Aucune date n'a reçu de vote favorable
                </div>
              )
            )}
          </div>
        )}

        {/* Badge IA avec bouton reprendre conversation */}
        {item.hasAI && (
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
              💬 Créé par IA
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/workspace?resume=${item.id}`);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Reprendre la conversation →
            </button>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          {item.poll && item.poll.created_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(item.poll.created_at).toLocaleDateString("fr-FR")}
            </span>
          )}
          <span>
            Conversation :{" "}
            {item.conversationDate.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {item.poll ? (
            <>
              {/* Actions pour poll */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/poll/${item.poll!.slug}/results`);
                }}
                className="bg-[#1e1e1e] text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-1"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden lg:inline">Résultats</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/poll/${item.poll!.slug}`);
                }}
                className="bg-[#1e1e1e] text-gray-300 px-3 py-2 rounded-md text-sm font-medium hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-1"
              >
                <Vote className="w-4 h-4" />
                <span className="hidden lg:inline">Voter</span>
              </button>
              <PollActions
                poll={item.poll as any}
                showVoteButton={false}
                variant="compact"
                onAfterDuplicate={onRefresh}
                onAfterDelete={onRefresh}
                onAfterArchive={onRefresh}
              />
            </>
          ) : (
            <>
              {/* Actions pour conversation seule */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/workspace?resume=${item.id}`);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Reprendre
              </button>

              {/* Bouton supprimer - style identique à PollActions */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation();
                }}
                className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1"
                title="Supprimer"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
