/**
 * AI Night Tester - Report Generator
 * 
 * Generates markdown reports with screenshots and issue details
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from './ai-night-tester.config';
import type { Issue, TestStats, TestAction } from './types';

export class ReportGenerator {
    private issues: Issue[] = [];
    private stats: TestStats;
    private reportPath: string = '';
    private sessionSummary: string = '';

    constructor() {
        this.stats = {
            startTime: new Date(),
            totalActions: 0,
            pagesVisited: new Set<string>(),
            issuesFound: [],
            actionHistory: [],
        };
    }

    /**
     * Initialize report file
     */
    init(): void {
        // Ensure reports directory exists
        if (!fs.existsSync(config.output.reportsDir)) {
            fs.mkdirSync(config.output.reportsDir, { recursive: true });
        }

        // Create report filename with timestamp
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .substring(0, 19);
        this.reportPath = path.join(
            config.output.reportsDir,
            `report-${timestamp}.md`
        );

        console.log(`📝 Report will be saved to: ${this.reportPath}`);
    }

    /**
     * Log an action
     */
    logAction(action: TestAction, success: boolean): void {
        this.stats.totalActions++;
        this.stats.actionHistory.push(action);

        // Keep action history under control
        if (this.stats.actionHistory.length > 1000) {
            this.stats.actionHistory = this.stats.actionHistory.slice(-500);
        }
    }

    /**
     * Log a page visit
     */
    logPageVisit(url: string): void {
        this.stats.pagesVisited.add(url);
    }

    /**
     * Log an issue
     */
    logIssue(issue: Issue): void {
        this.issues.push(issue);
        this.stats.issuesFound.push(issue);

        console.log(`🐛 Issue #${this.issues.length}: [${issue.severity}] ${issue.title}`);

        // Append issue to live report
        this.appendToReport(`
---

### 🐛 Issue #${this.issues.length}: ${issue.title}

- **Severity**: ${this.getSeverityEmoji(issue.severity)} ${issue.severity}
- **Type**: ${issue.type}
- **URL**: ${issue.pageUrl}
- **Screen**: ${issue.viewport ? `${issue.viewport.name} (${issue.viewport.width}x${issue.viewport.height})` : 'Default'}
- **Time**: ${issue.timestamp.toLocaleTimeString('fr-FR')}

**Description:**
${issue.description}

${issue.screenshotPath ? `![Screenshot](${path.relative(config.output.reportsDir, issue.screenshotPath)})` : ''}

${issue.aiAnalysis ? `**AI Analysis:** ${issue.aiAnalysis}` : ''}

<details>
<summary>Reproduction Steps</summary>

${issue.reproductionSteps.map((step, i) => `${i + 1}. ${step.type}: ${step.description || step.selector || step.url}`).join('\n')}

</details>
`);
    }

    /**
     * Get severity emoji
     */
    private getSeverityEmoji(severity: string): string {
        switch (severity) {
            case 'critical': return '🔴';
            case 'major': return '🟠';
            case 'minor': return '🟡';
            case 'suggestion': return '🔵';
            default: return '⚪';
        }
    }

    /**
     * Append content to the live report
     */
    private appendToReport(content: string): void {
        if (!this.reportPath) return;

        try {
            fs.appendFileSync(this.reportPath, content);
        } catch (error) {
            console.error('Failed to write to report:', error);
        }
    }

    /**
     * Set AI session summary
     */
    setSessionSummary(summary: string): void {
        this.sessionSummary = summary;
    }

    /**
     * Generate the full report
     */
    generateReport(): string {
        this.stats.endTime = new Date();
        const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
        const durationMinutes = Math.round(duration / 60000);

        const criticalCount = this.issues.filter(i => i.severity === 'critical').length;
        const majorCount = this.issues.filter(i => i.severity === 'major').length;
        const minorCount = this.issues.filter(i => i.severity === 'minor').length;

        const header = `# 🌙 AI Night Tester Report

**Date**: ${this.stats.startTime.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}

**Duration**: ${durationMinutes} minutes (${this.stats.startTime.toLocaleTimeString('fr-FR')} → ${this.stats.endTime.toLocaleTimeString('fr-FR')})

---

## 📊 Summary

| Metric | Value |
|--------|-------|
| 🎯 Total Actions | ${this.stats.totalActions} |
| 📄 Pages Visited | ${this.stats.pagesVisited.size} |
| 🐛 Issues Found | ${this.issues.length} |

### Issues by Severity

| 🔴 Critical | 🟠 Major | 🟡 Minor | 🔵 Suggestions |
|-------------|----------|----------|----------------|
| ${criticalCount} | ${majorCount} | ${minorCount} | ${this.issues.filter(i => i.severity === 'suggestion').length} |

---

${this.sessionSummary ? `## 🤖 AI Narrative Review

${this.sessionSummary}

---
` : ''}

## 📄 Pages Visited

${Array.from(this.stats.pagesVisited).map(url => `- ${url}`).join('\n')}

---

## 🐛 Issues Found
`;

        // Prepend header to report
        if (this.reportPath) {
            const existingContent = fs.existsSync(this.reportPath)
                ? fs.readFileSync(this.reportPath, 'utf-8')
                : '';

            // Extract issues section (content after initial creation)
            const issuesContent = existingContent;

            fs.writeFileSync(this.reportPath, header + (this.issues.length === 0 ? '✅ No issues found!\n' : '') + issuesContent);
        }

        console.log(`\n✅ Report generated: ${this.reportPath}`);
        console.log(`   📊 ${this.stats.totalActions} actions, ${this.stats.pagesVisited.size} pages, ${this.issues.length} issues`);

        return this.reportPath;
    }

    /**
     * Generate an intermediate report (snapshot)
     */
    generateIntermediateReport(suffix: string): string {
        const intermediatePath = this.reportPath.replace('.md', `-${suffix}.md`);

        const now = new Date();
        const duration = now.getTime() - this.stats.startTime.getTime();
        const durationMinutes = Math.round(duration / 60000);

        const criticalCount = this.issues.filter(i => i.severity === 'critical').length;
        const majorCount = this.issues.filter(i => i.severity === 'major').length;
        const minorCount = this.issues.filter(i => i.severity === 'minor').length;

        const header = `# 🌙 AI Night Tester - Intermediate Report (${suffix})
        
**Date**: ${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR')}
**Duration So Far**: ${durationMinutes} minutes

---

## 📊 Status Snapshot

| Metric | Value |
|--------|-------|
| 🎯 Total Actions | ${this.stats.totalActions} |
| 📄 Pages Visited | ${this.stats.pagesVisited.size} |
| 🐛 Issues Found | ${this.issues.length} |

### Issues by Severity

| 🔴 Critical | 🟠 Major | 🟡 Minor | 🔵 Suggestions |
|-------------|----------|----------|----------------|
| ${criticalCount} | ${majorCount} | ${minorCount} | ${this.issues.filter(i => i.severity === 'suggestion').length} |

---

## 🐛 Issues Found (So Far)
`;

        // Reconstruct full content from memory issues (cleaner than reading file)
        let issuesContent = '';
        for (const issue of this.issues) {
            issuesContent += `
### 🐛 Issue: ${issue.title}
- **Severity**: ${this.getSeverityEmoji(issue.severity)} ${issue.severity}
- **Type**: ${issue.type}
- **URL**: ${issue.pageUrl}
- **Time**: ${issue.timestamp.toLocaleTimeString('fr-FR')}

${issue.description}

` + (issue.aiAnalysis ? `> **AI Analysis**: ${issue.aiAnalysis}\n\n` : '') + `---
`;
        }

        fs.writeFileSync(intermediatePath, header + issuesContent);
        console.log(`📸 Intermediate report saved: ${intermediatePath}`);
        return intermediatePath;
    }

    /**
     * Get current stats
     */
    getStats(): TestStats {
        return { ...this.stats };
    }

    /**
     * Get issues count
     */
    getIssuesCount(): number {
        return this.issues.length;
    }
}
