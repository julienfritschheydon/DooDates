/**
 * Export utilities for polls (CSV, PDF, JSON)
 * Format specs: /Docs/Export.md
 */

import type { Poll, FormResponse } from "./pollStorage";
import { getFormResponses } from "./pollStorage";

/**
 * Escape CSV values (RFC 4180 compliant)
 */
function escapeCSV(value: string | number | undefined): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  // Escape if contains comma, newline, or double quote
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV header with BOM for UTF-8 encoding
 */
function getCSVHeader(): string {
  return "\uFEFF"; // UTF-8 BOM
}

/**
 * Format date to ISO 8601 (UTC)
 */
function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Generate filename for export
 * Format: doodates_{type}_{slug}_{YYYYMMDD-HHmmss}.csv
 */
function generateFilename(poll: Poll, extension: string = "csv"): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "-")
    .slice(0, 15); // YYYYMMDD-HHmmss
  const slug = poll.slug || "poll";
  const type = poll.type;
  return `doodates_${type}_${slug}_${timestamp}.${extension}`;
}

/**
 * Export FormPoll to CSV (long format)
 * Structure: 1 line per (respondent, question)
 */
export function formPollToCSV(poll: Poll): string {
  if (poll.type !== "form") {
    throw new Error("Poll type must be 'form'");
  }

  const lines: string[] = [];

  // Header with BOM
  lines.push(getCSVHeader());

  // Metadata header
  lines.push(
    ["poll_id", "poll_slug", "poll_title", "type", "created_at", "exported_at"]
      .map(escapeCSV)
      .join(","),
  );

  // Metadata values
  lines.push(
    [
      poll.id,
      poll.slug,
      poll.title,
      poll.type,
      formatTimestamp(poll.created_at),
      formatTimestamp(new Date()),
    ]
      .map(escapeCSV)
      .join(","),
  );

  // Empty line separator
  lines.push("");

  // Data header
  lines.push(
    [
      "respondent_display",
      "respondent_hash",
      "submitted_at",
      "source",
      "question_id",
      "question_title",
      "question_type",
      "value",
      "selected_count",
    ]
      .map(escapeCSV)
      .join(","),
  );

  // Data rows
  const responses = getFormResponses(poll.id);

  responses.forEach((response) => {
    const respondentDisplay = response.respondentName || "Anonymous";
    const respondentHash = response.id || "unknown";
    const submittedAt = formatTimestamp(response.created_at || new Date());
    const source = "link"; // MVP: default to "link" (can be extended later)

    response.items.forEach((item) => {
      const question = poll.questions?.find((q) => q.id === item.questionId);
      const questionTitle = question?.title || "Unknown question";
      const questionType = question?.type || "unknown";

      let value: string;
      let selectedCount: number | string = "";

      if (Array.isArray(item.value)) {
        // Multiple choice: join with pipe
        value = item.value.join(" | ");
        selectedCount = item.value.length;
      } else if (typeof item.value === "object" && item.value !== null) {
        // Matrix: format as "Row1: Col1 | Row2: Col2"
        const matrixVal = item.value as Record<string, string | string[]>;
        const matrixRows = (question as any)?.matrixRows || [];
        const matrixCols = (question as any)?.matrixColumns || [];

        const formatted = Object.entries(matrixVal).map(([rowId, colValue]) => {
          const row = matrixRows.find((r: any) => r.id === rowId);
          const rowLabel = row?.label || rowId;

          const colIds = Array.isArray(colValue) ? colValue : [colValue];
          const colLabels = colIds.map((cid: string) => {
            const col = matrixCols.find((c: any) => c.id === cid);
            return col?.label || cid;
          });

          return `${rowLabel}: ${colLabels.join(", ")}`;
        });

        value = formatted.join(" | ");
        selectedCount = Object.keys(matrixVal).length;
      } else {
        // Single choice or text
        value = String(item.value);
        selectedCount = 1;
      }

      lines.push(
        [
          respondentDisplay,
          respondentHash,
          submittedAt,
          source,
          item.questionId,
          questionTitle,
          questionType,
          value,
          selectedCount,
        ]
          .map(escapeCSV)
          .join(","),
      );
    });
  });

  return lines.join("\n");
}

/**
 * Trigger CSV download in browser
 */
export function downloadCSV(content: string, poll: Poll): void {
  const filename = generateFilename(poll, "csv");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export FormPoll to CSV and trigger download
 */
export function exportFormPollToCSV(poll: Poll): void {
  if (poll.type !== "form") {
    throw new Error("This function only supports FormPoll");
  }

  const csv = formPollToCSV(poll);
  downloadCSV(csv, poll);
}

/**
 * Check if poll has data to export
 */
export function hasExportableData(poll: Poll): boolean {
  if (poll.type !== "form") return false;
  const responses = getFormResponses(poll.id);
  return responses.length > 0;
}

/**
 * Validate export permissions (MVP: basic check)
 */
export function canExport(poll: Poll, userId?: string): boolean {
  // MVP: Allow export if poll has data
  // TODO: Add proper ownership check when auth is implemented
  return hasExportableData(poll);
}

/**
 * Generate HTML template for PDF export
 * User can print to PDF via browser (Ctrl+P)
 */
function formPollToHTML(poll: Poll): string {
  if (poll.type !== "form") {
    throw new Error("Poll type must be 'form'");
  }

  const responses = getFormResponses(poll.id);
  const exportDate = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Build questions summary
  let questionsHTML = "";
  poll.questions?.forEach((question, idx) => {
    questionsHTML += `
      <div class="question-block">
        <h3 class="question-title">Question ${idx + 1}: ${escapeHTML(question.title)}</h3>
        <p class="question-meta">Type: ${question.type} ${question.required ? "• Obligatoire" : ""}</p>
    `;

    // Count responses per question
    const questionResponses = responses.flatMap((r) =>
      r.items.filter((item) => item.questionId === question.id),
    );

    if (question.type === "text") {
      questionsHTML += `<div class="responses">`;
      questionResponses.forEach((item, i) => {
        questionsHTML += `<p class="text-response"><strong>Réponse ${i + 1}:</strong> ${escapeHTML(String(item.value))}</p>`;
      });
      questionsHTML += `</div>`;
    } else {
      // Count options for single/multiple choice
      const optionCounts: Record<string, number> = {};
      questionResponses.forEach((item) => {
        if (Array.isArray(item.value)) {
          item.value.forEach((v) => {
            optionCounts[v] = (optionCounts[v] || 0) + 1;
          });
        } else {
          optionCounts[String(item.value)] =
            (optionCounts[String(item.value)] || 0) + 1;
        }
      });

      questionsHTML += `<table class="results-table">
        <thead>
          <tr>
            <th>Option</th>
            <th>Réponses</th>
            <th>Pourcentage</th>
          </tr>
        </thead>
        <tbody>`;

      Object.entries(optionCounts).forEach(([option, count]) => {
        const percentage =
          responses.length > 0
            ? ((count / responses.length) * 100).toFixed(1)
            : "0.0";
        questionsHTML += `
          <tr>
            <td>${escapeHTML(option)}</td>
            <td>${count}</td>
            <td>${percentage}%</td>
          </tr>`;
      });

      questionsHTML += `</tbody></table>`;
    }

    questionsHTML += `</div>`;
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(poll.title)} - Export PDF</title>
  <style>
    @page {
      margin: 2cm;
      size: A4;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #1e40af;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .metadata {
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
      color: #666;
      font-size: 14px;
      margin-top: 15px;
    }
    .metadata-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .metadata-label {
      font-weight: 600;
    }
    .question-block {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .question-title {
      color: #1e40af;
      font-size: 18px;
      margin-bottom: 8px;
    }
    .question-meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 15px;
    }
    .results-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .results-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }
    .results-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .results-table tbody tr:hover {
      background: #f9fafb;
    }
    .text-response {
      padding: 10px;
      background: #f9fafb;
      border-left: 3px solid #2563eb;
      margin-bottom: 8px;
    }
    .responses {
      margin-top: 10px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHTML(poll.title)}</h1>
    <div class="metadata">
      <div class="metadata-item">
        <span class="metadata-label">Type:</span>
        <span>Questionnaire</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Réponses:</span>
        <span>${responses.length}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Questions:</span>
        <span>${poll.questions?.length || 0}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">Exporté le:</span>
        <span>${exportDate}</span>
      </div>
    </div>
  </div>

  ${questionsHTML}

  <div class="footer">
    <p>Généré par DooDates • ${exportDate}</p>
    <p>ID: ${poll.id} • Slug: ${poll.slug}</p>
  </div>

  <script>
    // Auto-trigger print dialog
    window.onload = () => {
      setTimeout(() => window.print(), 500);
    };
  </script>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Export FormPoll to PDF (via print dialog)
 */
export function exportFormPollToPDF(poll: Poll): void {
  if (poll.type !== "form") {
    throw new Error("This function only supports FormPoll");
  }

  const html = formPollToHTML(poll);

  // Open in new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Popup blocked. Please allow popups for this site.");
  }

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export FormPoll to JSON
 */
export function exportFormPollToJSON(poll: Poll): void {
  if (poll.type !== "form") {
    throw new Error("This function only supports FormPoll");
  }

  const responses = getFormResponses(poll.id);

  const exportData = {
    meta: {
      poll_id: poll.id,
      poll_slug: poll.slug,
      poll_title: poll.title,
      type: poll.type,
      created_at: poll.created_at,
      exported_at: new Date().toISOString(),
      total_responses: responses.length,
    },
    questions: poll.questions,
    responses: responses.map((r) => ({
      id: r.id,
      respondent_name: r.respondentName || "Anonymous",
      created_at: r.created_at,
      items: r.items,
    })),
    conditionalRules: poll.conditionalRules || [],
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const filename = generateFilename(poll, "json");
  const blob = new Blob([jsonString], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export FormPoll to Markdown
 */
export function exportFormPollToMarkdown(poll: Poll): void {
  if (poll.type !== "form") {
    throw new Error("This function only supports FormPoll");
  }

  const responses = getFormResponses(poll.id);
  const exportDate = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let markdown = `# ${poll.title}\n\n`;
  markdown += `**Type:** Questionnaire  \n`;
  markdown += `**Réponses:** ${responses.length}  \n`;
  markdown += `**Questions:** ${poll.questions?.length || 0}  \n`;
  markdown += `**Exporté le:** ${exportDate}  \n`;
  markdown += `**ID:** ${poll.id}  \n`;
  markdown += `**Slug:** ${poll.slug}\n\n`;
  markdown += `---\n\n`;

  // Questions
  poll.questions?.forEach((question, idx) => {
    markdown += `## Question ${idx + 1}: ${question.title}\n\n`;
    markdown += `**Type:** ${question.type}`;
    if (question.required) markdown += ` • **Obligatoire**`;
    markdown += `\n\n`;

    const questionResponses = responses.flatMap((r) =>
      r.items.filter((item) => item.questionId === question.id),
    );

    if (question.type === "text") {
      markdown += `### Réponses texte\n\n`;
      questionResponses.forEach((item, i) => {
        markdown += `${i + 1}. ${String(item.value)}\n`;
      });
      markdown += `\n`;
    } else if (question.type === "matrix") {
      // Matrix: display as table
      const matrixRows = (question as any)?.matrixRows || [];
      const matrixCols = (question as any)?.matrixColumns || [];

      // Count responses per cell (rowId_colId)
      const cellCounts: Record<string, number> = {};
      questionResponses.forEach((item) => {
        if (
          typeof item.value === "object" &&
          item.value !== null &&
          !Array.isArray(item.value)
        ) {
          const matrixVal = item.value as Record<string, string | string[]>;
          Object.entries(matrixVal).forEach(([rowId, colValue]) => {
            const colIds = Array.isArray(colValue) ? colValue : [colValue];
            colIds.forEach((colId: string) => {
              const key = `${rowId}_${colId}`;
              cellCounts[key] = (cellCounts[key] || 0) + 1;
            });
          });
        }
      });

      markdown += `### Résultats (${responses.length} réponse${responses.length > 1 ? "s" : ""})\n\n`;
      markdown += `| | ${matrixCols.map((c: any) => c.label).join(" | ")} |\n`;
      markdown += `|${matrixCols.map(() => "---").join("|")}---|\n`;

      matrixRows.forEach((row: any) => {
        const rowLabel = row.label;
        const counts = matrixCols.map((col: any) => {
          const key = `${row.id}_${col.id}`;
          const count = cellCounts[key] || 0;
          const pct =
            responses.length > 0
              ? ((count / responses.length) * 100).toFixed(1)
              : "0.0";
          return `${count} (${pct}%)`;
        });
        markdown += `| ${rowLabel} | ${counts.join(" | ")} |\n`;
      });
      markdown += `\n`;
    } else {
      // Count options
      const optionCounts: Record<string, number> = {};
      questionResponses.forEach((item) => {
        if (Array.isArray(item.value)) {
          item.value.forEach((v) => {
            optionCounts[v] = (optionCounts[v] || 0) + 1;
          });
        } else {
          optionCounts[String(item.value)] =
            (optionCounts[String(item.value)] || 0) + 1;
        }
      });

      markdown += `### Résultats\n\n`;
      markdown += `| Option | Réponses | Pourcentage |\n`;
      markdown += `|--------|----------|-------------|\n`;

      Object.entries(optionCounts).forEach(([option, count]) => {
        const percentage =
          responses.length > 0
            ? ((count / responses.length) * 100).toFixed(1)
            : "0.0";
        markdown += `| ${option} | ${count} | ${percentage}% |\n`;
      });

      markdown += `\n`;
    }
  });

  markdown += `---\n\n`;
  markdown += `*Généré par DooDates le ${exportDate}*\n`;

  const filename = generateFilename(poll, "md");
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
