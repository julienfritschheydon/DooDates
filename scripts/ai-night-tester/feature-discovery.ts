/**
 * AI Night Tester - Feature Discovery
 *
 * Catalogs all discovered UI features and exports them
 * as JSON and Markdown reports grouped by page.
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "./ai-night-tester.config";
import type {
  DiscoveredFeature,
  PageFeatureMap,
  FeatureCatalog,
  InteractiveElement,
  MissingFeature,
} from "./types";

export class FeatureDiscovery {
  private pages: Map<string, PageFeatureMap> = new Map();
  private featureIdCounter = 0;
  private startTime: Date;
  private catalogFilePath: string;
  private previousCatalog: FeatureCatalog | null = null;
  private newFeaturesInThisRun: Set<string> = new Set();

  constructor() {
    this.startTime = new Date();
    this.catalogFilePath = path.join(config.output.reportsDir, "feature-catalog.json");
    this.loadExistingCatalog();
  }

  /**
   * Load existing catalog from disk if it exists
   */
  private loadExistingCatalog(): void {
    if (fs.existsSync(this.catalogFilePath)) {
      try {
        const content = fs.readFileSync(this.catalogFilePath, "utf8");
        const existing = JSON.parse(content);

        // Store previous catalog for regression detection
        this.previousCatalog = {
          ...existing,
          generatedAt: new Date(existing.generatedAt),
          pages: existing.pages.map((p: any) => ({
            ...p,
            firstVisited: new Date(p.firstVisited),
            lastVisited: new Date(p.lastVisited),
            features: p.features.map((f: any) => ({
              ...f,
              firstSeen: new Date(f.firstSeen),
              lastSeen: new Date(f.lastSeen),
            })),
          })),
        };

        // Restore pages and features
        if (existing.pages) {
          for (const page of existing.pages) {
            this.pages.set(page.urlPath, {
              ...page,
              firstVisited: new Date(page.firstVisited),
              lastVisited: new Date(page.lastVisited),
              features: page.features.map((f: any) => ({
                ...f,
                firstSeen: new Date(f.firstSeen),
                lastSeen: new Date(f.lastSeen),
              })),
            });

            // Update feature ID counter
            page.features.forEach((f: any) => {
              const idNum = parseInt(f.id.replace("feat-", ""));
              if (idNum > this.featureIdCounter) {
                this.featureIdCounter = idNum;
              }
            });
          }
        }

        console.log(
          `📂 Loaded existing catalog: ${this.pages.size} pages, ${this.featureIdCounter} features`,
        );
      } catch (error) {
        console.warn(`⚠️ Failed to load existing catalog, starting fresh:`, error);
      }
    }
  }

  /**
   * Normalize URL to clean path
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.pathname;
    } catch {
      return url.replace(/^https?:\/\/[^/]+/, "");
    }
  }

  /**
   * Auto-categorize an element based on its properties
   */
  private categorizeElement(element: InteractiveElement): DiscoveredFeature["category"] {
    const text = element.text.toLowerCase();
    const selector = element.selector.toLowerCase();

    // Navigation patterns
    if (
      element.type === "link" ||
      text.includes("retour") ||
      text.includes("back") ||
      selector.includes("nav") ||
      text.includes("dashboard") ||
      text.includes("home")
    ) {
      return "navigation";
    }

    // Settings patterns
    if (
      text.includes("paramètre") ||
      text.includes("setting") ||
      text.includes("config") ||
      text.includes("préférence") ||
      selector.includes("setting")
    ) {
      return "settings";
    }

    // Modal triggers
    if (
      selector.includes("dialog") ||
      selector.includes("modal") ||
      text.includes("ouvrir") ||
      text.includes("détails")
    ) {
      return "modal-trigger";
    }

    // Form inputs
    if (["input", "select", "textarea", "checkbox", "radio"].includes(element.type || "")) {
      return "form-input";
    }

    // Action buttons
    if (
      element.type === "button" ||
      text.includes("créer") ||
      text.includes("envoyer") ||
      text.includes("submit") ||
      text.includes("save") ||
      text.includes("delete")
    ) {
      return "action";
    }

    return "other";
  }

  /**
   * Determine element type from InteractiveElement
   */
  private getElementType(element: InteractiveElement): DiscoveredFeature["elementType"] {
    const type = element.type?.toLowerCase() || element.tagName.toLowerCase();

    switch (type) {
      case "button":
        return "button";
      case "a":
      case "link":
        return "link";
      case "input":
        return "input";
      case "select":
        return "select";
      case "textarea":
        return "textarea";
      case "checkbox":
        return "checkbox";
      case "radio":
        return "radio";
      default:
        return "other";
    }
  }

  /**
   * Register discovered features from a page
   */
  registerFeatures(elements: InteractiveElement[], pageUrl: string, pageTitle: string): void {
    const urlPath = this.normalizeUrl(pageUrl);
    const now = new Date();

    // Get or create page entry
    let page = this.pages.get(urlPath);
    if (!page) {
      page = {
        url: pageUrl,
        urlPath,
        title: pageTitle,
        features: [],
        visitCount: 0,
        firstVisited: now,
        lastVisited: now,
      };
      this.pages.set(urlPath, page);
    }

    page.visitCount++;
    page.lastVisited = now;

    // Process each element
    for (const element of elements) {
      if (!element.isVisible || !element.text.trim()) continue;

      // Check if feature already exists on this page
      const existing = page.features.find((f) => f.selector === element.selector);

      if (existing) {
        existing.lastSeen = now;
      } else {
        const feature: DiscoveredFeature = {
          id: `feat-${++this.featureIdCounter}`,
          elementType: this.getElementType(element),
          text: element.text.substring(0, 100).trim(),
          selector: element.selector,
          category: this.categorizeElement(element),
          interactions: 0,
          firstSeen: now,
          lastSeen: now,
        };
        page.features.push(feature);

        // Track as new feature in this run
        this.newFeaturesInThisRun.add(feature.id);
      }
    }
  }

  /**
   * Record that a feature was interacted with
   */
  recordInteraction(selector: string, pageUrl: string): void {
    const urlPath = this.normalizeUrl(pageUrl);
    const page = this.pages.get(urlPath);

    if (page) {
      const feature = page.features.find((f) => f.selector === selector);
      if (feature) {
        feature.interactions++;
      }
    }
  }

  /**
   * Detect missing features (regression detection)
   */
  private detectMissingFeatures(): MissingFeature[] {
    if (!this.previousCatalog) return [];

    const missingFeatures: MissingFeature[] = [];
    const currentFeatureIds = new Set<string>();

    // Collect all current feature IDs
    this.pages.forEach((page) => {
      page.features.forEach((f) => currentFeatureIds.add(f.id));
    });

    // Find features that existed before but are missing now
    this.previousCatalog.pages.forEach((page) => {
      page.features.forEach((f) => {
        if (!currentFeatureIds.has(f.id)) {
          missingFeatures.push({
            id: f.id,
            text: f.text,
            selector: f.selector,
            page: page.urlPath,
            lastSeen: new Date(f.lastSeen),
            category: f.category,
          });
        }
      });
    });

    return missingFeatures;
  }

  /**
   * Get new features discovered in this run
   */
  private getNewFeatures(): DiscoveredFeature[] {
    const newFeatures: DiscoveredFeature[] = [];

    this.pages.forEach((page) => {
      page.features.forEach((f) => {
        if (this.newFeaturesInThisRun.has(f.id)) {
          newFeatures.push(f);
        }
      });
    });

    return newFeatures;
  }

  /**
   * Build the complete feature catalog with history
   */
  buildCatalog(): FeatureCatalog & { history?: any[] } {
    const pages = Array.from(this.pages.values()).sort((a, b) =>
      a.urlPath.localeCompare(b.urlPath),
    );

    const totalFeatures = pages.reduce((sum, p) => sum + p.features.length, 0);

    // Count unique features by text (deduped across pages)
    const uniqueTexts = new Set<string>();
    pages.forEach((p) => p.features.forEach((f) => uniqueTexts.add(f.text)));

    // Detect regressions and new features
    const missingFeatures = this.detectMissingFeatures();
    const newFeatures = this.getNewFeatures();

    const catalog: any = {
      generatedAt: new Date(),
      duration: Date.now() - this.startTime.getTime(),
      totalPages: pages.length,
      totalFeatures,
      uniqueFeatures: uniqueTexts.size,
      pages,
      missingFeatures: missingFeatures.length > 0 ? missingFeatures : undefined,
      newFeatures: newFeatures.length > 0 ? newFeatures : undefined,
    };

    // Load and append history from existing catalog
    if (fs.existsSync(this.catalogFilePath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(this.catalogFilePath, "utf8"));
        catalog.history = existing.history || [];

        // Add current run to history
        catalog.history.push({
          timestamp: new Date(),
          duration: catalog.duration,
          totalPages: catalog.totalPages,
          totalFeatures: catalog.totalFeatures,
          uniqueFeatures: catalog.uniqueFeatures,
          missingFeaturesCount: missingFeatures.length,
          newFeaturesCount: newFeatures.length,
        });
      } catch (error) {
        catalog.history = [
          {
            timestamp: new Date(),
            duration: catalog.duration,
            totalPages: catalog.totalPages,
            totalFeatures: catalog.totalFeatures,
            uniqueFeatures: catalog.uniqueFeatures,
            missingFeaturesCount: missingFeatures.length,
            newFeaturesCount: newFeatures.length,
          },
        ];
      }
    } else {
      catalog.history = [
        {
          timestamp: new Date(),
          duration: catalog.duration,
          totalPages: catalog.totalPages,
          totalFeatures: catalog.totalFeatures,
          uniqueFeatures: catalog.uniqueFeatures,
          missingFeaturesCount: missingFeatures.length,
          newFeaturesCount: newFeatures.length,
        },
      ];
    }

    return catalog;
  }

  /**
   * Export catalog to single consolidated JSON file
   */
  exportToJSON(): string {
    const catalog = this.buildCatalog();

    fs.writeFileSync(this.catalogFilePath, JSON.stringify(catalog, null, 2));
    console.log(`📦 Feature catalog updated: ${this.catalogFilePath}`);
    console.log(`   📊 Total runs: ${catalog.history?.length || 1}`);
    console.log(`   📄 Pages: ${catalog.totalPages}`);
    console.log(`   🔧 Features: ${catalog.totalFeatures} (${catalog.uniqueFeatures} unique)`);

    // Report regressions and new features
    if (catalog.missingFeatures && catalog.missingFeatures.length > 0) {
      console.log(
        `   ⚠️  Missing features: ${catalog.missingFeatures.length} (potential regressions!)`,
      );
    }
    if (catalog.newFeatures && catalog.newFeatures.length > 0) {
      console.log(`   ✨ New features: ${catalog.newFeatures.length}`);
    }

    return this.catalogFilePath;
  }

  /**
   * Generate a Markdown catalog
   */
  exportToMarkdown(): string {
    const catalog = this.buildCatalog();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
    const filePath = path.join(config.output.reportsDir, `feature-catalog-${timestamp}.md`);

    const durationMinutes = Math.round(catalog.duration / 60000);

    let md = `# 🔍 Feature Discovery Report

**Generated**: ${catalog.generatedAt.toLocaleDateString("fr-FR", { dateStyle: "full" })}
**Duration**: ${durationMinutes} minutes
**Pages Discovered**: ${catalog.totalPages}
**Total Features**: ${catalog.totalFeatures}
**Unique Features**: ${catalog.uniqueFeatures}

---

`;

    // Group by category for summary
    const byCategory: Record<string, number> = {};
    catalog.pages.forEach((p) => {
      p.features.forEach((f) => {
        byCategory[f.category] = (byCategory[f.category] || 0) + 1;
      });
    });

    md += `## 📊 Summary by Category

| Category | Count |
|----------|-------|
`;
    for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
      md += `| ${cat} | ${count} |\n`;
    }

    md += `\n---\n\n## 📄 Features by Page\n\n`;

    for (const page of catalog.pages) {
      md += `### ${page.urlPath}\n\n`;
      md += `**Title**: ${page.title}\n`;
      md += `**Visits**: ${page.visitCount}\n\n`;

      if (page.features.length === 0) {
        md += `_No interactive elements found_\n\n`;
      } else {
        md += `| Type | Text | Category | Interactions |\n`;
        md += `|------|------|----------|-------------|\n`;

        for (const feat of page.features.sort((a, b) => a.category.localeCompare(b.category))) {
          const textClean = feat.text.replace(/\|/g, "\\|").replace(/\n/g, " ");
          md += `| ${feat.elementType} | ${textClean.substring(0, 40)} | ${feat.category} | ${feat.interactions} |\n`;
        }
      }
      md += "\n---\n\n";
    }

    md += `\n*Generated by AI Night Tester - Feature Discovery Mode*\n`;

    fs.writeFileSync(filePath, md);
    console.log(`📝 Markdown catalog exported: ${filePath}`);

    return filePath;
  }

  /**
   * Get current stats
   */
  getStats(): { pages: number; features: number } {
    const totalFeatures = Array.from(this.pages.values()).reduce(
      (sum, p) => sum + p.features.length,
      0,
    );

    return {
      pages: this.pages.size,
      features: totalFeatures,
    };
  }

  /**
   * Update the main FEATURES-CATALOG.md documentation with latest stats
   */
  updateDocumentation(catalog: FeatureCatalog): void {
    const docsPath = path.resolve(process.cwd(), "Docs", "4. FEATURES-CATALOG.md");

    if (!fs.existsSync(docsPath)) {
      console.warn(`⚠️ Documentation file not found at ${docsPath}, skipping update.`);
      return;
    }

    try {
      let content = fs.readFileSync(docsPath, "utf8");
      const generatedDateStr = new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const todayStr = new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // 1. Update Section 7 (Automated Report)
      const newSection7 = `## 7. 📊 Rapport de Test Automatisé
*Généré par AI Night Tester le ${generatedDateStr}*

- **Couverture** : ${catalog.totalPages} pages explorées.
- **Fonctionnalités** : ${catalog.totalFeatures} éléments interactifs détectés, dont ${catalog.uniqueFeatures} uniques.
- **Interactions** : Simulation de clics, navigation et remplissage de formulaires sur l'ensemble du périmètre.`;

      // Regex matches from "## 7." up to the footer or end of section
      const sectionRegex =
        /## 7\. 📊 Rapport de Test Automatisé[\s\S]*?(?=(\*Dernière mise à jour)|$)/;

      if (sectionRegex.test(content)) {
        content = content.replace(sectionRegex, newSection7 + "\n\n");
      } else {
        // If section is missing, insert it before the footer
        const lastUpdateMarker = "*Dernière mise à jour";
        if (content.includes(lastUpdateMarker)) {
          content = content.replace(
            lastUpdateMarker,
            `\n---\n\n${newSection7}\n\n${lastUpdateMarker}`,
          );
        } else {
          content += `\n\n---\n\n${newSection7}\n`;
        }
      }

      // 2. Update Footer Date
      const footerRegex = /\*Dernière mise à jour : .*\*/;
      if (footerRegex.test(content)) {
        content = content.replace(footerRegex, `*Dernière mise à jour : ${todayStr}*`);
      } else {
        content += `\n\n*Dernière mise à jour : ${todayStr}*`;
      }

      fs.writeFileSync(docsPath, content);
      console.log(`✅ Main documentation updated: ${docsPath}`);
    } catch (error) {
      console.error("❌ Failed to update documentation:", error);
    }
  }
}
