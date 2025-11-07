/**
 * Export utilities for polls (CSV, PDF, JSON)
 * Format specs: /Docs/Export.md
 */
import type { Poll } from "./pollStorage";
/**
 * Export FormPoll to CSV (long format)
 * Structure: 1 line per (respondent, question)
 */
export declare function formPollToCSV(poll: Poll): string;
/**
 * Trigger CSV download in browser
 */
export declare function downloadCSV(content: string, poll: Poll): void;
/**
 * Export FormPoll to CSV and trigger download
 */
export declare function exportFormPollToCSV(poll: Poll): void;
/**
 * Check if poll has data to export
 */
export declare function hasExportableData(poll: Poll): boolean;
/**
 * Validate export permissions (MVP: basic check)
 */
export declare function canExport(poll: Poll, userId?: string): boolean;
/**
 * Export FormPoll to PDF (via print dialog)
 */
export declare function exportFormPollToPDF(poll: Poll): void;
/**
 * Export FormPoll to JSON
 */
export declare function exportFormPollToJSON(poll: Poll): void;
/**
 * Export FormPoll to Markdown
 */
export declare function exportFormPollToMarkdown(poll: Poll): void;
