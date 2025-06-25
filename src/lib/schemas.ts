import { z } from "zod";

// Schema pour la création de sondage
export const PollCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),

  description: z
    .string()
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional(),

  selectedDates: z
    .array(z.string().date())
    .min(1, "Au moins une date doit être sélectionnée")
    .max(30, "Maximum 30 dates autorisées"),

  timeSlots: z
    .record(
      z.string().date(),
      z.array(
        z.object({
          hour: z.number().min(0).max(23),
          minute: z.number().min(0).max(59),
          duration: z.number().min(15).max(480), // 15min à 8h
        }),
      ),
    )
    .optional(),

  participantEmails: z
    .array(z.string().email("Format d'email invalide"))
    .max(100, "Maximum 100 participants autorisés"),

  settings: z
    .object({
      timeGranularity: z.number().default(60),
      allowAnonymousVotes: z.boolean().default(true),
      allowMaybeVotes: z.boolean().default(true),
      sendNotifications: z.boolean().default(true),
      expiresAt: z.string().datetime().optional(),
    })
    .optional(),
});

// Schema pour le vote
export const VoteCreateSchema = z.object({
  voterName: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),

  voterEmail: z.string().email("Format d'email invalide"),

  selections: z.record(
    z.string().uuid(), // option_id
    z.object({
      vote: z.enum(["yes", "no", "maybe"]),
      timeSlots: z
        .record(
          z.string(), // slot_id
          z.enum(["yes", "no", "maybe"]),
        )
        .optional(),
    }),
  ),

  comment: z
    .string()
    .max(500, "Le commentaire ne peut pas dépasser 500 caractères")
    .optional(),
});

// Schema pour la mise à jour du profil
export const ProfileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(1, "Le nom complet est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .optional(),

  timezone: z.string().default("Europe/Paris").optional(),

  preferences: z
    .object({
      language: z.enum(["fr", "en"]).default("fr"),
      notifications: z
        .object({
          emailInvitations: z.boolean().default(true),
          emailReminders: z.boolean().default(true),
          pushNotifications: z.boolean().default(false),
        })
        .optional(),
      ui: z
        .object({
          theme: z.enum(["light", "dark", "system"]).default("light"),
          defaultGranularity: z.number().default(60),
          defaultTimezone: z.string().default("Europe/Paris"),
        })
        .optional(),
    })
    .optional(),
});

// Schema pour l'inscription
export const SignUpSchema = z
  .object({
    email: z.string().email("Format d'email invalide"),

    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre",
      ),

    confirmPassword: z
      .string()
      .min(1, "La confirmation du mot de passe est requise"),

    fullName: z
      .string()
      .min(1, "Le nom complet est requis")
      .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// Schema pour la connexion
export const SignInSchema = z.object({
  email: z.string().email("Format d'email invalide"),

  password: z.string().min(1, "Le mot de passe est requis"),
});

// Schema pour la conversation IA
export const ConversationCreateSchema = z.object({
  sessionId: z.string().uuid("Session ID invalide").optional(),

  initialMessage: z
    .string()
    .min(1, "Le message initial est requis")
    .max(1000, "Le message ne peut pas dépasser 1000 caractères"),
});

export const MessageCreateSchema = z.object({
  content: z
    .string()
    .min(1, "Le message ne peut pas être vide")
    .max(1000, "Le message ne peut pas dépasser 1000 caractères"),
});

// Types dérivés des schémas
export type PollCreateInput = z.infer<typeof PollCreateSchema>;
export type VoteCreateInput = z.infer<typeof VoteCreateSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
export type ConversationCreateInput = z.infer<typeof ConversationCreateSchema>;
export type MessageCreateInput = z.infer<typeof MessageCreateSchema>;

// Helpers de validation
export function validatePollData(data: unknown): PollCreateInput {
  return PollCreateSchema.parse(data);
}

export function validateVoteData(data: unknown): VoteCreateInput {
  return VoteCreateSchema.parse(data);
}

export function validateProfileData(data: unknown): ProfileUpdateInput {
  return ProfileUpdateSchema.parse(data);
}

// Helper pour formater les erreurs Zod
export function formatZodError(error: z.ZodError): Record<string, string> {
  const formattedErrors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join(".");
    formattedErrors[path] = err.message;
  });

  return formattedErrors;
}
