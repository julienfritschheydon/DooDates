import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Eye, Share2, Star } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProductCardProps {
  id: string;
  title: string;
  description?: string;
  type: "date" | "form" | "quizz";
  status: "active" | "archived" | "deleted";
  createdAt: string;
  updatedAt: string;
  responseCount?: number;
  isFavorite?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onShare?: () => void;
  onToggleFavorite?: () => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  description,
  type,
  status,
  createdAt,
  updatedAt,
  responseCount = 0,
  isFavorite = false,
  onEdit,
  onDelete,
  onView,
  onShare,
  onToggleFavorite,
  className = "",
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "date":
        return "bg-blue-100 text-blue-800";
      case "form":
        return "bg-green-100 text-green-800";
      case "quizz":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "date":
        return "Sondage de dates";
      case "form":
        return "Formulaire";
      case "quizz":
        return "Quiz";
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-yellow-100 text-yellow-800";
      case "deleted":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Actif";
      case "archived":
        return "Archivé";
      case "deleted":
        return "Supprimé";
      default:
        return status;
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1 line-clamp-2">{description}</CardDescription>
            )}
          </div>
          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${isFavorite ? "text-yellow-400 hover:text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Star className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Badge className={getTypeColor(type)}>{getTypeLabel(type)}</Badge>
          <Badge className={getStatusColor(status)}>{getStatusLabel(status)}</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>Créé le {format(new Date(createdAt), "dd MMM yyyy", { locale: fr })}</span>
          {responseCount > 0 && (
            <span className="font-medium">
              {responseCount} réponse{responseCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onView && (
            <Button variant="outline" size="sm" onClick={onView} data-testid="product-card-view">
              <Eye className="h-4 w-4 mr-1" />
              Voir
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} data-testid="product-card-edit">
              <Edit className="h-4 w-4 mr-1" />
              Modifier
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare} data-testid="product-card-share">
              <Share2 className="h-4 w-4 mr-1" />
              Partager
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
              data-testid="product-card-delete"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
