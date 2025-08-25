import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Edit3,
  Check,
  X,
  Sparkles,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TopNav from "./TopNav";

interface Message {
  id: string;
  content: string;
  isAI: boolean;
  timestamp: Date;
  pollData?: PollDraft;
  isEditing?: boolean;
}

interface PollDraft {
  title: string;
  dates: string[];
  timeSlots?: { start: string; end: string }[];
  participants: string[];
  description?: string;
}

interface ConversationalAIProps {
  onPollCreated?: (pollData: PollDraft) => void;
}

const ConversationalAI: React.FC<ConversationalAIProps> = ({
  onPollCreated,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<PollDraft | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Message de bienvenue
    const welcomeMessage: Message = {
      id: "welcome",
      content:
        "Bonjour ! Décrivez-moi le sondage que vous souhaitez créer. Par exemple : 'Organise une réunion avec Paul et Marie mardi ou mercredi après-midi'",
      isAI: true,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const simulateAIResponse = async (
    userMessage: string,
  ): Promise<{ content: string; pollData?: PollDraft }> => {
    // Simulation d'analyse IA
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Si l'utilisateur demande explicitement de changer le titre
    if (
      userMessage.toLowerCase().includes("titre") &&
      (userMessage.toLowerCase().includes("changer") ||
        userMessage.toLowerCase().includes("modifier"))
    ) {
      return {
        content: "Quel nouveau titre souhaitez-vous donner à votre sondage ?",
      };
    }

    // Détection de patterns simples pour création initiale
    if (
      userMessage.toLowerCase().includes("réunion") ||
      userMessage.toLowerCase().includes("meeting")
    ) {
      const pollData: PollDraft = {
        title: "Réunion équipe",
        dates: ["2025-08-26", "2025-08-27"],
        timeSlots: [{ start: "14:00", end: "16:00" }],
        participants: [],
        description: "Réunion d'équipe planifiée automatiquement",
      };

      return {
        content:
          "J'ai créé un brouillon de sondage pour votre réunion. Vous pouvez modifier n'importe quel élément en cliquant sur l'icône d'édition.",
        pollData,
      };
    }

    if (
      userMessage.toLowerCase().includes("modifier") ||
      userMessage.toLowerCase().includes("changer")
    ) {
      return {
        content:
          "Que souhaitez-vous modifier exactement ? Vous pouvez cliquer sur l'icône d'édition à côté de chaque élément du brouillon.",
      };
    }

    if (userMessage.toLowerCase().includes("date")) {
      return {
        content:
          "Quelles nouvelles dates proposez-vous ? Vous pouvez dire par exemple 'lundi et mardi prochains'.",
      };
    }

    return {
      content:
        "Je comprends que vous voulez créer un sondage. Pouvez-vous me donner plus de détails ? Par exemple : le type d'événement, les dates possibles, et qui doit participer ?",
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isAI: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const aiResponse = await simulateAIResponse(inputValue);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        isAI: true,
        timestamp: new Date(),
        pollData: aiResponse.pollData,
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (aiResponse.pollData) {
        setCurrentDraft(aiResponse.pollData);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre demande. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDraft = (field: keyof PollDraft, value: any) => {
    if (!currentDraft) return;

    setCurrentDraft((prev) => (prev ? { ...prev, [field]: value } : null));

    // Simuler une réponse IA confirmant la modification
    const confirmMessage: Message = {
      id: Date.now().toString(),
      content: `Parfait ! J'ai mis à jour ${field === "title" ? "le titre" : field === "dates" ? "les dates" : field === "participants" ? "les participants" : "la description"} de votre sondage.`,
      isAI: true,
      timestamp: new Date(),
      pollData: { ...currentDraft, [field]: value },
    };

    setMessages((prev) => [...prev, confirmMessage]);
  };

  const handleCreatePoll = () => {
    if (currentDraft && onPollCreated) {
      onPollCreated(currentDraft);
      toast({
        title: "Sondage créé !",
        description: "Votre sondage a été créé avec succès.",
      });
    }
  };

  const PollDraftCard: React.FC<{
    pollData: PollDraft;
    onEdit: (field: keyof PollDraft, value: any) => void;
  }> = ({ pollData, onEdit }) => {
    const [editingField, setEditingField] = useState<keyof PollDraft | null>(
      null,
    );
    const [editValue, setEditValue] = useState("");

    const startEdit = (field: keyof PollDraft) => {
      setEditingField(field);
      setEditValue(
        Array.isArray(pollData[field])
          ? (pollData[field] as any[]).join(", ")
          : (pollData[field] as string) || "",
      );
    };

    const saveEdit = () => {
      if (!editingField) return;

      let value: any = editValue;
      if (editingField === "dates" || editingField === "participants") {
        value = editValue
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }

      onEdit(editingField, value);
      setEditingField(null);
      setEditValue("");
    };

    const cancelEdit = () => {
      setEditingField(null);
      setEditValue("");
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3"
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            Brouillon de sondage
          </span>
        </div>

        <div className="space-y-3">
          {/* Titre */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {editingField === "title" ? (
                <div className="flex gap-2">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm"
                    placeholder="Titre du sondage"
                  />
                  <button
                    onClick={saveEdit}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {pollData.title}
                  </span>
                  <button
                    onClick={() => startEdit("title")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              {editingField === "dates" ? (
                <div className="flex gap-2">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm"
                    placeholder="Dates séparées par des virgules"
                  />
                  <button
                    onClick={saveEdit}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    {pollData.dates
                      .map((date) => new Date(date).toLocaleDateString())
                      .join(", ")}
                  </span>
                  <button
                    onClick={() => startEdit("dates")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Horaires */}
          {pollData.timeSlots && pollData.timeSlots.length > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {pollData.timeSlots
                  .map((slot) => `${slot.start} - ${slot.end}`)
                  .join(", ")}
              </span>
            </div>
          )}

          {/* Participants */}
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              {editingField === "participants" ? (
                <div className="flex gap-2">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm"
                    placeholder="Emails séparés par des virgules"
                  />
                  <button
                    onClick={saveEdit}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    {pollData.participants.length > 0
                      ? pollData.participants.join(", ")
                      : "Aucun participant ajouté"}
                  </span>
                  <button
                    onClick={() => startEdit("participants")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t border-blue-200">
          <button
            onClick={handleCreatePoll}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Créer le sondage
          </button>
          <button
            onClick={() => setCurrentDraft(null)}
            className="px-3 py-2 text-gray-600 hover:text-gray-700 transition-colors"
            title="Supprimer le brouillon"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <TopNav />
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.isAI ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                  message.isAI
                    ? "bg-gray-100 text-gray-900"
                    : "bg-blue-600 text-white"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.pollData && (
                  <PollDraftCard
                    pollData={message.pollData}
                    onEdit={handleEditDraft}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">L'IA réfléchit...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Décrivez votre sondage ou demandez des modifications..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationalAI;
