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

  // Common scheduling/meeting patterns
  const schedulingPatterns =
    language === "fr"
      ? [
          /(?:organis|planifi|program|prépar|arrang)[a-z]*\s+(?:une?\s+)?(?:réunion|rendez-vous|meeting|rencontre)/gi,
          /(?:réunion|meeting|rendez-vous|rencontre)/gi,
          /(?:quand|à quelle heure|quel jour|quelle date)/gi,
          /(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/gi,
          /(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/gi,
          /(?:matin|après-midi|soir|midi)/gi,
          /(?:urgent|important|priorit)/gi,
        ]
      : [
          /(?:schedul|organiz|plan|arrang)[a-z]*\s+(?:a\s+)?(?:meeting|appointment|call)/gi,
          /(?:meeting|appointment|call)/gi,
          /(?:when|what time|which day|what date)/gi,
          /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
          /(?:january|february|march|april|may|june|july|august|september|october|november|december)/gi,
          /(?:morning|afternoon|evening|noon)/gi,
          /(?:urgent|important|priority)/gi,
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

  return phrases.slice(0, 10); // Increase limit for more content
}

/**
 * Generate title from extracted key phrases
 */
function generateTitleFromPhrases(
  phrases: string[],
  options: Required<TitleGenerationOptions>,
): string {
  if (phrases.length === 0) {
    return options.language === "fr"
      ? "Nouvelle conversation"
      : "New conversation";
  }

  // Prioritize scheduling-related phrases
  const schedulingPhrases = phrases.filter((p) =>
    /(?:réunion|meeting|rendez-vous|organis|planifi|schedul)/i.test(p),
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

  // Start with base action
  let baseAction = "";
  if (schedulingPhrases.length > 0) {
    baseAction = schedulingPhrases[0];
  } else if (options.language === "fr") {
    baseAction = "Discussion";
  } else {
    baseAction = "Discussion";
  }

  titleParts.push(baseAction);

  // Add participants
  if (namesPhrases.length > 0) {
    const connector = options.language === "fr" ? "avec" : "with";
    const participants = namesPhrases.slice(0, 2).join(" et ");
    titleParts.push(`${connector} ${participants}`);
  }

  // Add timing
  if (timePhrases.length > 0) {
    titleParts.push(`- ${timePhrases[0]}`);
  }

  // If still too short, add more context
  let title = titleParts.join(" ");
  if (title.length < options.minLength && phrases.length > titleParts.length) {
    const additionalPhrases = phrases
      .filter((p) => !titleParts.some((part) => part.includes(p)))
      .slice(0, 2);
    if (additionalPhrases.length > 0) {
      title += ` (${additionalPhrases.join(", ")})`;
    }
  }

  return title;
}

/**
 * Ensure title fits within length constraints
 */
function ensureTitleLength(
  title: string,
  minLength: number,
  maxLength: number,
): string {
  if (title.length > maxLength) {
    // Truncate at word boundary
    const truncated = title.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > minLength
      ? truncated.substring(0, lastSpace)
      : truncated;
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
  const dateStr = now.toLocaleDateString(
    language === "fr" ? "fr-FR" : "en-US",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );

  return language === "fr"
    ? `Conversation du ${dateStr}`
    : `Conversation ${dateStr}`;
}
