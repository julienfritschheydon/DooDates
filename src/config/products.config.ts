import { Calendar, FileText, Clock, Brain } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ProductType = "date" | "form" | "availability" | "quizz";
export type ThemeColor = "blue" | "violet" | "emerald" | "amber";

export interface ProductConfig {
  type: ProductType;
  theme: ThemeColor;
  icon: LucideIcon;
  iconName: string; // Pour lazy loading dans les layouts
  name: string;
  namePlural: string;
  layoutName: string; // "DooDates1", "DooDates2", "DooDates3", "Quizz"
  baseRoute: string;
  createRoute: string;
  workspaceRoute: string;
  dashboardRoute: string;
  listRoute: string;
  settingsRoute: string;
  pricingRoute: string;
  docsRoute: string;
  journalRoute: string;
  createLabel: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateButtonLabel: string;
  dashboardTitle: string;
  dashboardDescription: string;
  listLabel: string; // "Mes Sondages", "Mes Formulaires", "Mes Disponibilités", "Mes Quiz"
}

export const PRODUCT_CONFIGS: Record<ProductType, ProductConfig> = {
  date: {
    type: "date",
    theme: "blue",
    icon: Calendar,
    iconName: "Calendar",
    name: "Sondage",
    namePlural: "Sondages",
    layoutName: "DooDates1",
    baseRoute: "/date-polls",
    createRoute: "/create/date",
    workspaceRoute: "/workspace/date",
    dashboardRoute: "/date-polls/dashboard",
    listRoute: "/date-polls/dashboard",
    settingsRoute: "/date-polls/settings",
    pricingRoute: "/date-polls/pricing",
    docsRoute: "/date-polls/docs",
    journalRoute: "/date-polls/journal",
    createLabel: "Nouveau Sondage",
    emptyStateTitle: "Aucun sondage de dates",
    emptyStateDescription: "Créez votre premier sondage pour commencer",
    emptyStateButtonLabel: "Créer un sondage",
    dashboardTitle: "Vos Sondages de Dates",
    dashboardDescription: "Gérez vos sondages et planifiez vos événements.",
    listLabel: "Mes Sondages",
  },
  form: {
    type: "form",
    theme: "violet",
    icon: FileText,
    iconName: "ClipboardList", // Pour le layout creator
    name: "Formulaire",
    namePlural: "Formulaires",
    layoutName: "DooDates2",
    baseRoute: "/form-polls",
    createRoute: "/create/form",
    workspaceRoute: "/workspace/form",
    dashboardRoute: "/form-polls/dashboard",
    listRoute: "/form-polls/list",
    settingsRoute: "/form-polls/settings",
    pricingRoute: "/form-polls/pricing",
    docsRoute: "/form-polls/docs",
    journalRoute: "/form-polls/journal",
    createLabel: "Nouveau Formulaire",
    emptyStateTitle: "Aucun formulaire",
    emptyStateDescription: "Créez votre premier formulaire pour commencer",
    emptyStateButtonLabel: "Créer un formulaire",
    dashboardTitle: "Vos Formulaires",
    dashboardDescription: "Gérez vos formulaires et analysez les réponses.",
    listLabel: "Mes Formulaires",
  },
  availability: {
    type: "availability",
    theme: "emerald",
    icon: Clock,
    iconName: "Clock",
    name: "Disponibilité",
    namePlural: "Disponibilités",
    layoutName: "DooDates3",
    baseRoute: "/availability-polls",
    createRoute: "/create/availability",
    workspaceRoute: "/workspace/availability",
    dashboardRoute: "/availability-polls/dashboard",
    listRoute: "/availability-polls/list",
    settingsRoute: "/availability-polls/settings",
    pricingRoute: "/availability-polls/pricing",
    docsRoute: "/availability-polls/docs",
    journalRoute: "/availability-polls/journal",
    createLabel: "Nouvelle Dispo",
    emptyStateTitle: "Aucune disponibilité",
    emptyStateDescription: "Créez votre première disponibilité pour commencer",
    emptyStateButtonLabel: "Créer une disponibilité",
    dashboardTitle: "Vos Disponibilités",
    dashboardDescription: "Gérez vos sondages de disponibilité.",
    listLabel: "Mes Disponibilités",
  },
  quizz: {
    type: "quizz",
    theme: "amber",
    icon: Brain,
    iconName: "Brain",
    name: "Quiz",
    namePlural: "Quiz",
    layoutName: "Quizz",
    baseRoute: "/quizz",
    createRoute: "/quizz/create",
    workspaceRoute: "/quizz/create",
    dashboardRoute: "/quizz/dashboard",
    listRoute: "/quizz",
    settingsRoute: "/settings",
    pricingRoute: "/quizz/pricing",
    docsRoute: "/quizz/docs",
    journalRoute: "/quizz/journal",
    createLabel: "Nouveau Quiz",
    emptyStateTitle: "Aucun quiz pour le moment",
    emptyStateDescription: "Créez votre premier quiz pour aider vos enfants",
    emptyStateButtonLabel: "Créer un quiz",
    dashboardTitle: "Vos Quiz",
    dashboardDescription: "Gérez vos quiz et suivez les résultats de vos élèves.",
    listLabel: "Landing Page",
  },
};

export function getProductConfig(type: ProductType): ProductConfig {
  return PRODUCT_CONFIGS[type];
}

export function getThemeClasses(theme: ThemeColor) {
  const classes = {
    blue: {
      bg: "bg-blue-900/20",
      text: "text-blue-400",
      border: "border-blue-900/30",
      hover: "hover:bg-blue-900/20",
      gradientFrom: "from-blue-900/30",
      gradientTo: "to-blue-800/30",
      borderGradient: "border-blue-700/30",
      button: "bg-blue-600 hover:bg-blue-700",
      buttonGradient: "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      avatarGradient: "from-blue-500 to-blue-600",
      settingsButton: "hover:bg-blue-700/50 border-blue-700/30",
      authButton: "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
      authShadow: "hover:shadow-blue-500/20",
      loading: "border-blue-500",
      quotaBg: "bg-blue-900/20 border-blue-500/50",
      quotaText: "text-blue-400",
      quotaBar: "bg-blue-500",
      quotaHover: "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20",
      headerBorder: "border-blue-900/20",
      headerText: "text-blue-400",
      headerHover: "hover:bg-blue-900/20",
      conversationHover: "hover:bg-blue-900/10",
      conversationIcon: "bg-blue-900/20 text-blue-400",
    },
    emerald: {
      bg: "bg-emerald-900/20",
      text: "text-emerald-400",
      border: "border-emerald-900/30",
      hover: "hover:bg-emerald-900/20",
      gradientFrom: "from-emerald-900/30",
      gradientTo: "to-emerald-800/30",
      borderGradient: "border-emerald-700/30",
      button: "bg-emerald-600 hover:bg-emerald-700",
      buttonGradient: "from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700",
      avatarGradient: "from-emerald-500 to-emerald-600",
      settingsButton: "hover:bg-emerald-700/50 border-emerald-700/30",
      authButton: "from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800",
      authShadow: "hover:shadow-emerald-500/20",
      loading: "border-emerald-500",
      quotaBg: "bg-emerald-900/20 border-emerald-500/50",
      quotaText: "text-emerald-400",
      quotaBar: "bg-emerald-500",
      quotaHover: "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20",
      headerBorder: "border-emerald-900/20",
      headerText: "text-emerald-400",
      headerHover: "hover:bg-emerald-900/20",
      conversationHover: "hover:bg-emerald-900/10",
      conversationIcon: "bg-emerald-900/20 text-emerald-400",
    },
    violet: {
      bg: "bg-violet-900/20",
      text: "text-violet-400",
      border: "border-violet-900/30",
      hover: "hover:bg-violet-900/20",
      gradientFrom: "from-violet-900/30",
      gradientTo: "to-violet-800/30",
      borderGradient: "border-violet-700/30",
      button: "bg-violet-600 hover:bg-violet-700",
      buttonGradient: "from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700",
      avatarGradient: "from-violet-500 to-violet-600",
      settingsButton: "hover:bg-violet-700/50 border-violet-700/30",
      authButton: "from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800",
      authShadow: "hover:shadow-violet-500/20",
      loading: "border-violet-500",
      quotaBg: "bg-violet-900/20 border-violet-500/50",
      quotaText: "text-violet-400",
      quotaBar: "bg-violet-500",
      quotaHover: "text-violet-400 hover:text-violet-300 hover:bg-violet-900/20",
      headerBorder: "border-violet-900/20",
      headerText: "text-violet-400",
      headerHover: "hover:bg-violet-900/20",
      conversationHover: "hover:bg-violet-900/10",
      conversationIcon: "bg-violet-900/20 text-violet-400",
    },
    green: {
      bg: "bg-green-900/20",
      text: "text-green-400",
      border: "border-green-900/30",
      hover: "hover:bg-green-900/20",
      gradientFrom: "from-green-900/30",
      gradientTo: "to-green-800/30",
      borderGradient: "border-green-700/30",
      button: "bg-green-600 hover:bg-green-700",
      buttonGradient: "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
      avatarGradient: "from-green-500 to-green-600",
      settingsButton: "hover:bg-green-700/50 border-green-700/30",
      authButton: "from-green-600 to-green-700 hover:from-green-700 hover:to-green-800",
      authShadow: "hover:shadow-green-500/20",
      loading: "border-green-500",
      quotaBg: "bg-green-900/20 border-green-500/50",
      quotaText: "text-green-400",
      quotaBar: "bg-green-500",
      quotaHover: "text-green-400 hover:text-green-300 hover:bg-green-900/20",
      headerBorder: "border-green-900/20",
      headerText: "text-green-400",
      headerHover: "hover:bg-green-900/20",
      conversationHover: "hover:bg-green-900/10",
      conversationIcon: "bg-green-900/20 text-green-400",
    },
    amber: {
      bg: "bg-amber-900/20",
      text: "text-amber-400",
      border: "border-amber-900/30",
      hover: "hover:bg-amber-900/20",
      gradientFrom: "from-amber-900/30",
      gradientTo: "to-amber-800/30",
      borderGradient: "border-amber-700/30",
      button: "bg-amber-600 hover:bg-amber-700",
      buttonGradient: "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
      avatarGradient: "from-amber-500 to-amber-600",
      settingsButton: "hover:bg-amber-700/50 border-amber-700/30",
      authButton: "from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800",
      authShadow: "hover:shadow-amber-500/20",
      loading: "border-amber-500",
      quotaBg: "bg-amber-900/20 border-amber-500/50",
      quotaText: "text-amber-400",
      quotaBar: "bg-amber-500",
      quotaHover: "text-amber-400 hover:text-amber-300 hover:bg-amber-900/20",
      headerBorder: "border-amber-900/20",
      headerText: "text-amber-400",
      headerHover: "hover:bg-amber-900/20",
      conversationHover: "hover:bg-amber-900/10",
      conversationIcon: "bg-amber-900/20 text-amber-400",
    },
  };
  return classes[theme];
}
