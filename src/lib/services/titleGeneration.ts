/**
 * Title Generation Service
 * DooDates - Intelligent conversation title generation
 */

import { logError, ErrorFactory } from "../error-handling";
import type { ConversationMessage } from "../../types/conversation";

export interface TitleGenerationOptions {
  /** Minimum character length for generated title */
  minLength?: number;
  /** Maximum character length for generated title */
  maxLength?: number;
  /** Maximum number of message turns to analyze */
  maxTurns?: number;
  /** Language for title generation */
  language?: "fr" | "en";
}

export interface TitleGenerationResult {
  /** Generated title */
  title: string;
  /** Whether generation was successful */
  success: boolean;
  /** Source messages used for generation */
  sourceMessages: string[];
  /** Reason if generation failed */
  failureReason?: string;
}

const DEFAULT_OPTIONS: Required<TitleGenerationOptions> = {
  minLength: 38,
  maxLength: 60,
  maxTurns: 4,
  language: "fr",
};

/**
 * Generate intelligent title from conversation messages
 * Analyzes first 2-4 message turns to create meaningful title
 */
export function generateConversationTitle(
  messages: ConversationMessage[],
  options: TitleGenerationOptions = {},
): TitleGenerationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Validate input
    if (!messages || messages.length === 0) {
      return {
        title: "",
        success: false,
        sourceMessages: [],
        failureReason: "No messages provided",
      };
    }

    // Get relevant messages (first 2-4 turns, user + assistant pairs)
    const relevantMessages = getRelevantMessages(messages, opts.maxTurns);

    if (relevantMessages.length === 0) {
      return {
        title: "",
        success: false,
        sourceMessages: [],
        failureReason: "No relevant messages found",
      };
    }

    // Extract key topics and generate title
    const generatedTitle = extractAndGenerateTitle(relevantMessages, opts);

    if (!generatedTitle || generatedTitle.length < opts.minLength) {
      return {
        title: "",
        success: false,
        sourceMessages: relevantMessages.map((m) => m.content),
        failureReason: "Generated title too short or empty",
      };
    }

    return {
      title: generatedTitle,
      success: true,
      sourceMessages: relevantMessages.map((m) => m.content),
    };
  } catch (error) {
    logError(
      ErrorFactory.storage(
        "Failed to generate conversation title",
        "Échec de génération du titre de conversation",
      ),
      {
        component: "titleGeneration",
        operation: "generateConversationTitle",
        metadata: {
          messageCount: messages.length,
          options: opts,
          originalError: error,
        },
      },
    );

    return {
      title: "",
      success: false,
      sourceMessages: [],
      failureReason: "Internal error during title generation",
    };
  }
}

/**
 * Get relevant messages for title generation (first 2-4 turns)
 */
function getRelevantMessages(
  messages: ConversationMessage[],
  maxTurns: number,
): ConversationMessage[] {
  const relevantMessages: ConversationMessage[] = [];
  let turnCount = 0;
  let lastRole: string | null = null;

  for (const message of messages) {
    // Skip empty content
    if (!message.content?.trim()) {
      continue;
    }

    // Count turns (user -> assistant = 1 turn)
    if (message.role !== lastRole) {
      if (lastRole !== null && message.role === "user") {
        turnCount++;
      }
      lastRole = message.role;
    }

    // Stop if we've reached max turns
    if (turnCount >= maxTurns) {
      break;
    }

    relevantMessages.push(message);
  }

  return relevantMessages;
}

/**
 * Extract key topics and generate title from messages
 */
function extractAndGenerateTitle(
  messages: ConversationMessage[],
  options: Required<TitleGenerationOptions>,
): string {
  // Get original text for name extraction (preserve case)
  const originalText = messages.map((m) => m.content.trim()).join(" ");

  // Combine all message content for pattern matching
  const combinedText = originalText.toLowerCase();

  // Extract key phrases and topics
  const keyPhrases = extractKeyPhrases(originalText, options.language);

  // Generate title from key phrases
  let title = generateTitleFromPhrases(keyPhrases, options);

  // Ensure title fits length constraints
  title = ensureTitleLength(title, options.minLength, options.maxLength);

  // Clean up title (remove trailing punctuation, etc.)
  title = cleanupTitle(title);

  return title;
}

/**
 * Extract key phrases from text based on language patterns
 */
function extractKeyPhrases(text: string, language: "fr" | "en"): string[] {
  const phrases: string[] = [];

  // Extract poll/survey type (sondage pour déjeuner, réunion, événement, etc.)
  const pollTypePatterns =
    language === "fr"
      ? [
          /(?:sondage|poll|questionnaire)\s+(?:pour|de|du|sur)\s+([a-zà-ÿ\s]+?)(?:\s|$|,|\.)/gi,
          /(?:cré|génér|fais)[a-z]*\s+(?:un|une|le|la)?\s*(?:sondage|poll|questionnaire)\s+(?:pour|de|du|sur)?\s*([a-zà-ÿ\s]+?)(?:\s|$|,|\.)/gi,
          /(?:déjeuner|dîner|petit-déjeuner|brunch|repas|apéro|apéritif|goûter)/gi,
          /(?:réunion|meeting|rendez-vous|rencontre|conférence|séminaire|atelier|formation)/gi,
          /(?:événement|évènement|soirée|fête|anniversaire|célébration)/gi,
          /(?:projet|tâche|mission|travail|collaboration)/gi,
        ]
      : [
          /(?:poll|survey|questionnaire)\s+(?:for|about|on)\s+([a-z\s]+?)(?:\s|$|,|\.)/gi,
          /(?:creat|generat|mak)[a-z]*\s+(?:a|an|the)?\s*(?:poll|survey|questionnaire)\s+(?:for|about|on)?\s*([a-z\s]+?)(?:\s|$|,|\.)/gi,
          /(?:lunch|dinner|breakfast|brunch|meal|drinks)/gi,
          /(?:meeting|appointment|call|conference|seminar|workshop)/gi,
          /(?:event|party|celebration|anniversary)/gi,
          /(?:project|task|mission|work|collaboration)/gi,
        ];

  pollTypePatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        // Extract the actual type (e.g., "déjeuner", "réunion")
        const typeMatch = match.match(/(?:pour|de|du|sur|for|about|on)\s+([a-zà-ÿ\s]+)/i);
        if (typeMatch && typeMatch[1]) {
          phrases.push(typeMatch[1].trim());
        } else {
          // Extract direct type words
          const directMatch = match.match(
            /(?:déjeuner|dîner|réunion|meeting|événement|event|projet|project)/i,
          );
          if (directMatch) {
            phrases.push(directMatch[0]);
          } else {
            phrases.push(match.trim());
          }
        }
      });
    }
  });

  // Extract days of the week
  const dayPattern =
    language === "fr"
      ? /(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/gi
      : /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi;
  const days = text.match(dayPattern);
  if (days) {
    phrases.push(...days.map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()));
  }

  // Extract dates (day + month)
  const datePattern =
    language === "fr"
      ? /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/gi
      : /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/gi;
  const dates = text.match(datePattern);
  if (dates) {
    phrases.push(...dates.map((d) => d.trim()));
  }

  // Common scheduling/meeting patterns
  const schedulingPatterns =
    language === "fr"
      ? [
          /(?:organis|planifi|program|prépar|arrang)[a-z]*\s+(?:une?\s+)?(?:réunion|rendez-vous|meeting|rencontre)/gi,
          /(?:réunion|meeting|rendez-vous|rencontre)/gi,
          /(?:quand|à quelle heure|quel jour|quelle date)/gi,
        ]
      : [
          /(?:schedul|organiz|plan|arrang)[a-z]*\s+(?:a\s+)?(?:meeting|appointment|call)/gi,
          /(?:meeting|appointment|call)/gi,
          /(?:when|what time|which day|what date)/gi,
        ];

  // Extract matches from patterns
  schedulingPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      phrases.push(...matches.map((m) => m.trim()));
    }
  });

  // Extract names (proper nouns - capitalized words that are likely names)
  const words = text.split(/\s+/);
  const names: string[] = [];

  for (const word of words) {
    // Match names: capitalized, 2+ chars, may include hyphens/apostrophes
    if (/^[A-ZÀ-ÿ][a-zà-ÿ''-]{1,}$/.test(word)) {
      // Filter out common words that might be capitalized
      const commonWords = [
        "Bonjour",
        "Hello",
        "Hi",
        "Parfait",
        "Perfect",
        "Très",
        "Very",
        "Nous",
        "We",
        "Je",
        "Il",
        "Elle",
        "Vous",
        "The",
        "This",
        "That",
        "Sondage",
        "Poll",
        "Samedi",
        "Dimanche",
        "Lundi",
        "Mardi",
        "Mercredi",
        "Jeudi",
        "Vendredi",
      ];
      if (!commonWords.includes(word)) {
        names.push(word);
      }
    }
  }

  if (names.length > 0) {
    phrases.push(...names.slice(0, 3)); // Limit to 3 names
  }

  // Extract time expressions (more comprehensive)
  const timePattern =
    /\b(?:\d{1,2}[h:]\d{0,2}|\d{1,2}\s*(?:h|heures?|pm|am)|\d{1,2}pm|\d{1,2}am)\b/gi;
  const times = text.match(timePattern);
  if (times) {
    phrases.push(...times.slice(0, 2)); // Limit to 2 time expressions
  }

  return phrases.slice(0, 15); // Increase limit for more content
}

/**
 * Generate title from extracted key phrases
 */
function generateTitleFromPhrases(
  phrases: string[],
  options: Required<TitleGenerationOptions>,
): string {
  if (phrases.length === 0) {
    return options.language === "fr" ? "Nouvelle conversation" : "New conversation";
  }

  // Extract poll type (déjeuner, réunion, événement, etc.)
  const pollTypePhrases = phrases.filter((p) =>
    /(?:déjeuner|dîner|petit-déjeuner|brunch|repas|apéro|réunion|meeting|rendez-vous|événement|évènement|soirée|fête|projet|lunch|dinner|breakfast|event|party|project)/i.test(
      p,
    ),
  );

  // Extract days of the week
  const dayPhrases = phrases.filter((p) =>
    /^(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(
      p,
    ),
  );

  // Extract dates (day + month)
  const datePhrases = phrases.filter((p) =>
    /(?:\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)|(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2})/i.test(
      p,
    ),
  );

  // Prioritize scheduling-related phrases
  const schedulingPhrases = phrases.filter((p) =>
    /(?:organis|planifi|program|prépar|arrang|schedul)/i.test(p),
  );

  // Prioritize names (improved pattern)
  const namesPhrases = phrases.filter((p) => /^[A-ZÀ-ÿ][a-zà-ÿ''-]+$/.test(p));

  // Prioritize time expressions (improved pattern)
  const timePhrases = phrases.filter((p) =>
    /\b(?:\d{1,2}[h:]\d{0,2}|\d{1,2}\s*(?:h|heures?|pm|am)|\w+day|\w+di|matin|après-midi|soir|midi|morning|afternoon|evening)\b/i.test(
      p,
    ),
  );

  // Build title with priority order
  const titleParts: string[] = [];

  // Start with "Sondage" prefix if it's a poll-related conversation
  const isPollConversation = pollTypePhrases.length > 0 || schedulingPhrases.length > 0;
  const prefix = isPollConversation
    ? options.language === "fr"
      ? "Sondage"
      : "Poll"
    : options.language === "fr"
      ? "Discussion"
      : "Discussion";

  titleParts.push(prefix);

  // Add poll type (déjeuner, réunion, etc.)
  if (pollTypePhrases.length > 0) {
    // Take the first poll type found
    const pollType = pollTypePhrases[0];
    // Capitalize first letter
    const capitalizedType = pollType.charAt(0).toUpperCase() + pollType.slice(1).toLowerCase();
    titleParts.push(capitalizedType);
  }

  // Add days or dates
  if (dayPhrases.length > 0) {
    // Format: "Samedi/Dimanche" or "Samedi et Dimanche"
    const formattedDays = dayPhrases
      .map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
      .join("/");
    titleParts.push(`- ${formattedDays}`);
  } else if (datePhrases.length > 0) {
    // Format: "15 novembre"
    const formattedDate = datePhrases[0];
    titleParts.push(`- ${formattedDate}`);
  }

  // Add participants (if no poll type found)
  if (pollTypePhrases.length === 0 && namesPhrases.length > 0) {
    const connector = options.language === "fr" ? "avec" : "with";
    const participants = namesPhrases.slice(0, 2).join(" et ");
    titleParts.push(`${connector} ${participants}`);
  }

  // Add timing if we have space
  if (timePhrases.length > 0 && titleParts.length < 3) {
    titleParts.push(`(${timePhrases[0]})`);
  }

  // Build final title
  let title = titleParts.join(" ");

  // If still too short, add more context
  if (title.length < options.minLength && phrases.length > titleParts.length) {
    const additionalPhrases = phrases
      .filter((p) => !titleParts.some((part) => part.toLowerCase().includes(p.toLowerCase())))
      .slice(0, 2);
    if (additionalPhrases.length > 0) {
      title += ` - ${additionalPhrases.join(", ")}`;
    }
  }

  return title;
}

/**
 * Ensure title fits within length constraints
 */
function ensureTitleLength(title: string, minLength: number, maxLength: number): string {
  if (title.length > maxLength) {
    // Truncate at word boundary
    const truncated = title.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > minLength ? truncated.substring(0, lastSpace) : truncated;
  }

  if (title.length < minLength) {
    // Try to expand with context
    const padding = minLength - title.length;

    // Add descriptive suffix based on content
    let suffix = "";
    if (title.includes("réunion") || title.includes("meeting")) {
      suffix = " - Planification et organisation";
    } else if (title.includes("Discussion")) {
      suffix = " sur projet et coordination";
    } else {
      suffix = " - Échange et planification";
    }

    const expandedTitle = title + suffix;

    // If still too short, add more context
    if (expandedTitle.length < minLength) {
      const additionalSuffix = " des prochaines étapes";
      return (expandedTitle + additionalSuffix).substring(0, maxLength);
    }

    return expandedTitle.substring(0, maxLength);
  }

  return title;
}

/**
 * Clean up title (remove trailing punctuation, normalize spaces)
 */
function cleanupTitle(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, " ") // Normalize spaces
    .replace(/[.!?;,]+$/, "") // Remove trailing punctuation
    .replace(/^[.!?;,\s]+/, "") // Remove leading punctuation/spaces
    .trim();
}

/**
 * Check if a title should be regenerated (e.g., after new messages)
 */
export function shouldRegenerateTitle(
  currentTitle: string,
  isCustomTitle: boolean,
  messageCount: number,
): boolean {
  // Never regenerate custom titles
  if (isCustomTitle) {
    return false;
  }

  // Regenerate if title is empty or default
  if (
    !currentTitle ||
    currentTitle === "Nouvelle conversation" ||
    currentTitle === "New conversation" ||
    currentTitle.startsWith("Conversation du ")
  ) {
    return messageCount >= 2; // Wait for at least user + assistant message
  }

  // Regenerate if we have significantly more content (early conversations)
  if (messageCount <= 6 && messageCount % 2 === 0) {
    return true;
  }

  return false;
}

/**
 * Generate fallback title based on date
 */
export function generateFallbackTitle(language: "fr" | "en" = "fr"): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return language === "fr" ? `Conversation du ${dateStr}` : `Conversation ${dateStr}`;
}
