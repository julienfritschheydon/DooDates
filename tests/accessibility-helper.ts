import { test as base, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Extend the base test with accessibility helpers
export const test = base.extend<{
  makeAxeBuilder: () => AxeBuilder;
  checkA11y: (page: Page, options?: { skipRules?: string[] }) => Promise<void>;
}>({
  makeAxeBuilder: async ({ page }, use) => {
    const axeBuilder = new AxeBuilder({ page });
    await use(axeBuilder);
  },

  checkA11y: async ({ page }, use) => {
    const checkA11y = async (page: Page, options?: { skipRules?: string[] }) => {
      const axeBuilder = new AxeBuilder({ page });

      // Configure axe-core based on options
      if (options?.skipRules) {
        axeBuilder.withRules(options.skipRules);
      }

      // Run accessibility audit
      const results = await axeBuilder.analyze();

      // Check for violations
      if (results.violations.length > 0) {
        console.log('🚨 Accessibility violations found:');
        results.violations.forEach((violation, index) => {
          console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
          console.log(`   Impact: ${violation.impact}`);
          console.log(`   Help: ${violation.help}`);
          console.log(`   Help URL: ${violation.helpUrl}`);
          console.log(`   Elements affected: ${violation.nodes.length}`);
          console.log('---');
        });

        // Create a detailed error message
        const violationSummary = results.violations
          .map(v => `${v.id} (${v.impact}): ${v.help}`)
          .join('\n');

        expect(results.violations).toHaveLength(0,
          `Accessibility violations found:\n${violationSummary}`
        );
      }

      // Log passes for information
      if (results.passes.length > 0) {
        console.log(`✅ Accessibility checks passed: ${results.passes.length} rules`);
      }
    };

    await use(checkA11y);
  },
});

// Utility function to run axe-core checks with custom configuration
export async function runAccessibilityAudit(
  page: Page,
  options?: {
    rules?: string[];
    tags?: string[];
    skipRules?: string[];
    include?: string[][];
    exclude?: string[][];
  }
): Promise<{
  violations: any[];
  passes: any[];
  inapplicable: any[];
  incomplete: any[];
}> {
  const axeBuilder = new AxeBuilder({ page });

  // Apply configuration options
  if (options?.rules) {
    axeBuilder.withRules(options.rules);
  }

  if (options?.tags) {
    axeBuilder.withTags(options.tags);
  }

  if (options?.skipRules) {
    axeBuilder.withRules(options.skipRules);
  }

  if (options?.include) {
    options.include.forEach(selector => {
      axeBuilder.include(selector);
    });
  }

  if (options?.exclude) {
    options.exclude.forEach(selector => {
      axeBuilder.exclude(selector);
    });
  }

  return await axeBuilder.analyze();
}

// Helper to check specific accessibility rules
export async function checkSpecificRules(
  page: Page,
  rules: string[]
): Promise<{ violations: any[]; passes: any[] }> {
  const axeBuilder = new AxeBuilder({ page }).withRules(rules);
  const results = await axeBuilder.analyze();

  return {
    violations: results.violations,
    passes: results.passes,
  };
}

// Helper to get accessibility score (percentage of passed rules)
export async function getAccessibilityScore(page: Page): Promise<number> {
  const axeBuilder = new AxeBuilder({ page });
  const results = await axeBuilder.analyze();

  const totalChecks = results.passes.length + results.violations.length + results.incomplete.length;
  const passedChecks = results.passes.length;

  return totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
}
