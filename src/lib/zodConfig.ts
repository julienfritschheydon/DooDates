import { z } from "zod";

// Configuration globale des messages d'erreur Zod en français
z.setErrorMap((issue, ctx) => {
  const { code } = issue;

  switch (code) {
    case z.ZodIssueCode.invalid_type: {
      if (issue.expected === "string") {
        return { message: "Ce champ doit être un texte." };
      }
      if (issue.expected === "number") {
        return { message: "Ce champ doit être un nombre." };
      }
      if (issue.expected === "boolean") {
        return { message: "Ce champ doit être vrai ou faux." };
      }
      return { message: "Valeur invalide pour ce champ." };
    }

    case z.ZodIssueCode.invalid_string: {
      if (issue.validation === "email") {
        return { message: "Format d'email invalide." };
      }
      if (issue.validation === "url") {
        return { message: "Format d'URL invalide." };
      }
      return { message: "Texte invalide." };
    }

    case z.ZodIssueCode.too_small: {
      if (issue.type === "string") {
        return { message: "Ce champ est trop court." };
      }
      if (issue.type === "array") {
        return { message: "Pas assez d'éléments sélectionnés." };
      }
      return { message: "Valeur trop petite." };
    }

    case z.ZodIssueCode.too_big: {
      if (issue.type === "string") {
        return { message: "Ce champ est trop long." };
      }
      if (issue.type === "array") {
        return { message: "Trop d'éléments sélectionnés." };
      }
      return { message: "Valeur trop grande." };
    }

    case z.ZodIssueCode.custom: {
      // Les messages custom définis dans les schémas restent prioritaires.
      return { message: ctx.defaultError };
    }

    default:
      return { message: ctx.defaultError };
  }
});
