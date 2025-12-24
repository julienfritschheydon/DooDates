/**
 * AI Night Tester - Browser Controller
 * 
 * Playwright-based browser automation for the AI tester
 */

import { chromium, Browser, Page, BrowserContext, Locator } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { config } from './ai-night-tester.config';
import type {
    PageState,
    InteractiveElement,
    HttpError,
    TestAction,
    AccessibilityViolation,
    Viewport,
} from './types';
import { AxeBuilder } from '@axe-core/playwright';

export class BrowserController {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private _currentViewport: Viewport | undefined;

    // Track blocked file uploads [timestamp]
    public blockedFileUploads: Date[] = [];

    public get currentViewport(): Viewport | undefined {
        return this._currentViewport;
    }

    private consoleErrors: string[] = [];
    private httpErrors: HttpError[] = [];
    private screenshotCounter = 0;

    /**
     * Initialize the browser
     */
    async init(options: { headless?: boolean; slowMo?: number } = {}): Promise<void> {
        console.log('🌐 Launching browser...');

        this.browser = await chromium.launch({
            headless: options.headless ?? false,
            slowMo: options.slowMo ?? 100,
        });

        this.context = await this.browser.newContext({
            viewport: { width: 1280, height: 720 },
            locale: 'fr-FR',
        });

        this.page = await this.context.newPage();

        // Setup error listeners
        this.setupErrorListeners();

        // Set default viewport
        const defaultViewport = config.viewports[0];
        await this.setViewport(defaultViewport);

        console.log('✅ Browser ready');
    }

    /**
     * Set the browser viewport
     */
    async setViewport(viewport: Viewport): Promise<void> {
        if (!this.page) return;

        console.log(`📱 Setting viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
        await this.page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
        });
        this._currentViewport = viewport;
    }

    /**
     * Setup console and network error listeners
     */
    private setupErrorListeners(): void {
        if (!this.page) return;

        // Console errors
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // Filter out known non-critical errors
                if (!text.includes('ResizeObserver') &&
                    !text.includes('favicon') &&
                    !text.includes('chrome-extension')) {
                    this.consoleErrors.push(text);
                }
            }
        });

        // HTTP errors
        this.page.on('response', response => {
            if (response.status() >= 400) {
                const url = response.url();
                // Filter out non-critical 404s
                if (!url.includes('.map') &&
                    !url.includes('favicon') &&
                    !url.includes('analytics')) {
                    this.httpErrors.push({
                        url,
                        status: response.status(),
                        statusText: response.statusText(),
                        timestamp: new Date(),
                    });
                }
            }
        });

        // Page crashes
        this.page.on('crash', () => {
            this.consoleErrors.push('PAGE CRASHED');
        });

        // File chooser interception (Prevent blocking)
        this.page.on('filechooser', async (fileChooser) => {
            console.log('🚫 File chooser detected. Cancelling upload...');
            try {
                // Setting empty files acts as cancellation in most headless contexts
                await fileChooser.setFiles([]);
                this.blockedFileUploads.push(new Date());
            } catch (error) {
                console.warn('⚠️ Failed to dismiss file chooser:', error);
            }
        });
    }

    /**
     * Navigate to a URL
     */
    async navigate(url: string): Promise<void> {
        if (!this.page) throw new Error('Browser not initialized');

        const fullUrl = url.startsWith('http') ? url : `${config.app.baseUrl}${url}`;
        console.log(`📍 Navigating to: ${fullUrl}`);

        await this.page.goto(fullUrl, {
            waitUntil: 'networkidle',
            timeout: 30000,
        });

        // Wait for React to settle
        await this.page.waitForTimeout(1000);
    }

    /**
     * Get the current page URL
     */
    async getCurrentUrl(): Promise<string> {
        return this.page?.url() || '';
    }

    /**
     * Click on an element
     */
    async click(selector: string): Promise<boolean> {
        if (!this.page) throw new Error('Browser not initialized');

        try {
            const element = this.page.locator(selector).first();

            // Check if element is enabled before trying to click
            const isEnabled = await element.isEnabled({ timeout: 2000 }).catch(() => false);

            if (!isEnabled) {
                // Try magic fix if it looks like a send button
                const isMagicFixed = await this.tryMagicFixForDisabledButton(selector, element);
                if (!isMagicFixed) {
                    console.warn(`⚠️ Element ${selector} is still disabled after checks.`);
                    return false;
                }
            }

            await element.waitFor({ state: 'visible', timeout: 5000 });
            await element.click();
            await this.page.waitForTimeout(500);
            return true;
        } catch (error) {
            console.warn(`⚠️ Could not click ${selector}:`, error);
            return false;
        }
    }

    /**
     * MAGICAL FIX: Try to unblock disabled "Send" buttons
     * often caused by React state not updating fast enough after typing
     */
    private async tryMagicFixForDisabledButton(selector: string, element: any): Promise<boolean> {
        if (!this.page) return false;

        // Only apply to potential "Send" buttons to avoid side effects
        const text = (await element.textContent() || '').toLowerCase();
        const title = (await element.getAttribute('title') || '').toLowerCase();
        const testId = (await element.getAttribute('data-testid') || '').toLowerCase();

        const isSendButton =
            text.includes('envoyer') ||
            text.includes('send') ||
            title.includes('envoyer') ||
            title.includes('send') ||
            testId.includes('send');

        if (!isSendButton) return false;

        console.log('✨ Attempting MAGIC FIX for disabled Send button...');

        // 1. Find the likely input
        const textarea = this.page.locator('textarea').first();
        const input = this.page.locator('input[type="text"]').first();

        const targetInput = (await textarea.count()) > 0 ? textarea : input;

        if ((await targetInput.count()) === 0) return false;

        // 2. Check if it has a value
        const value = await targetInput.inputValue();
        if (!value || !value.trim()) {
            console.log('   (Input is empty, cannot auto-fix)');
            return false;
        }

        // 3. Force re-trigger events
        console.log(`   (Re-triggering events for content: "${value.substring(0, 10)}...")`);

        await targetInput.click();
        await targetInput.evaluate(node => {
            node.dispatchEvent(new Event('input', { bubbles: true }));
            node.dispatchEvent(new Event('change', { bubbles: true }));
        });

        // Wait for state update
        await this.page.waitForTimeout(1000);

        // 4. Check again
        const isEnabledNow = await element.isEnabled();
        if (isEnabledNow) {
            console.log('✨ Magic Fix SUCCESS! Button is now enabled.');
            return true;
        }

        return false;
    }

    /**
     * Type text into an input
     */
    async type(selector: string, text: string): Promise<boolean> {
        if (!this.page) throw new Error('Browser not initialized');

        try {
            const element = this.page.locator(selector).first();
            await element.waitFor({ state: 'visible', timeout: 5000 });
            await element.fill(text);
            await this.page.waitForTimeout(300);
            return true;
        } catch (error) {
            console.warn(`⚠️ Could not type in ${selector}:`, error);
            return false;
        }
    }

    /**
     * Execute an action
     */
    async executeAction(action: TestAction): Promise<boolean> {
        console.log(`🎯 Executing: ${action.type} - ${action.description || action.selector || action.url}`);

        switch (action.type) {
            case 'click':
                return this.click(action.selector!);
            case 'type':
                return this.type(action.selector!, action.value!);
            case 'navigate':
                await this.navigate(action.url!);
                return true;
            case 'scroll':
                if (this.page) {
                    await this.page.mouse.wheel(0, 300);
                    return true;
                }
                return false;
            case 'wait':
                await new Promise(r => setTimeout(r, 1000));
                return true;
            case 'resize':
                // Randomly select a viewport from config
                const randomViewport = config.viewports[Math.floor(Math.random() * config.viewports.length)];
                await this.setViewport(randomViewport);
                return true;
            default:
                return false;
        }
    }

    /**
     * Get current page state
     */
    async getPageState(): Promise<PageState> {
        if (!this.page) throw new Error('Browser not initialized');

        const url = this.page.url();
        const title = await this.page.title();
        const bodyText = await this.page.locator('body').textContent() || '';

        const interactiveElements = await this.getInteractiveElements();

        // Get and clear errors
        const consoleErrors = [...this.consoleErrors];
        const httpErrors = [...this.httpErrors];
        this.consoleErrors = [];
        this.httpErrors = [];

        // Accessibility Check
        const accessibilityViolations = await this.checkAccessibility();

        // Layout Check (NEW)
        const layoutIssues = await this.checkLayout();

        return {
            url,
            title,
            interactiveElements,
            consoleErrors,
            httpErrors,
            accessibilityViolations,
            layoutIssues,
            viewport: this.currentViewport,
            bodyText: bodyText.substring(0, 2000), // Limit text size
            timestamp: new Date(),
        };
    }

    /**
     * Run Axe accessibility check
     */
    private async checkAccessibility(): Promise<AccessibilityViolation[]> {
        if (!this.page) return [];

        try {
            const results = await new AxeBuilder({ page: this.page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                // .disableRules(['color-contrast']) // Re-enabled for Critical UX Mode
                .analyze();

            return results.violations.map(v => ({
                id: v.id,
                impact: v.impact as 'minor' | 'moderate' | 'serious' | 'critical' | null,
                description: v.description,
                help: v.help,
                nodes: v.nodes.map(n => n.target.join(', ')),
            }));
        } catch (error) {
            console.warn('⚠️ Accessibility check failed:', error);
            return [];
        }
    }

    /**
     * Check for layout issues (Visual Hygiene)
     */
    private async checkLayout(): Promise<any[]> {
        if (!this.page) return [];

        try {
            return await this.page.evaluate(() => {
                const issues = [];
                const width = window.innerWidth;

                // 1. Horizontal Scrollbar Detection (Page shouldn't scroll horizontally)
                if (document.documentElement.scrollWidth > width) {
                    issues.push({
                        type: 'overflow_x',
                        description: `Page causes horizontal scroll (${document.documentElement.scrollWidth}px > ${width}px)`,
                    });
                }

                // 2. Elements wider than viewport
                const allElements = document.querySelectorAll('*');
                for (const el of allElements) {
                    const rect = el.getBoundingClientRect();
                    if (rect.width > width) {
                        issues.push({
                            type: 'viewport_width_exceeded',
                            description: `Element wider than viewport: ${Math.round(rect.width)}px`,
                            selector: el.className || el.tagName,
                        });
                        if (issues.length >= 5) break;
                    }
                }

                // 3. Visual Consistency Check (Buttons, Links, Headings, Nav)
                const designChecks = [
                    { selector: 'button:not([disabled])', name: 'Buttons', props: ['backgroundColor', 'borderRadius', 'color', 'fontSize'] },
                    { selector: 'h2', name: 'Headings (H2)', props: ['fontFamily', 'fontSize', 'color', 'fontWeight'] },
                    { selector: 'a:not(:has(img))', name: 'Links', props: ['color', 'textDecorationLine', 'fontSize'] },
                    { selector: 'nav a', name: 'Nav Links', props: ['color', 'padding', 'fontSize', 'fontWeight'] }
                ];

                for (const check of designChecks) {
                    const elements = Array.from(document.querySelectorAll(check.selector));
                    // Only check if we have enough elements to form a pattern
                    if (elements.length >= 3) {
                        const styles = elements.map(el => {
                            const s = window.getComputedStyle(el);
                            return check.props.map(p => s[p as any]).join('|');
                        });
                        const uniqueStyles = new Set(styles);

                        // Tolerance: allow some variation (e.g. primary vs secondary buttons), but flag if > 4 styles
                        if (uniqueStyles.size > 4) {
                            issues.push({
                                type: 'design_inconsistency',
                                description: `Inconsistent ${check.name}: ${uniqueStyles.size} different styles found on this page.`,
                                selector: check.selector
                            });
                        }
                    }
                }

                return issues;
            });
        } catch (error) {
            console.warn('⚠️ Layout check failed:', error);
            return [];
        }
    }

    /**
     * Get all interactive elements on the page
     */
    private async getInteractiveElements(): Promise<InteractiveElement[]> {
        if (!this.page) return [];

        // DEBUG: Check browser date
        const browserDate = await this.page.evaluate(() => new Date().toString());
        console.log(`🌐 [Browser Clock] ${browserDate}`);

        const elements: InteractiveElement[] = [];

        // UNIFIED DISCOVERY: Capture everything interactive in one go to preserve DOM order
        const selector = 'button:visible, input:not([type="hidden"]):visible, textarea:visible, a:visible, [role="button"]:visible, [role="gridcell"]:visible, [role="link"]:visible, [contenteditable="true"]:visible';
        const locators = await this.page.locator(selector).all();

        // Limit total elements to 100 to avoid prompt explosion
        for (let i = 0; i < Math.min(locators.length, 100); i++) {
            const el = locators[i];
            try {
                const tagName = await el.evaluate(node => node.tagName.toLowerCase());
                const typeAttr = await el.getAttribute('type') || '';

                // Skip file uploads as requested
                if (typeAttr === 'file') continue;

                const isInput = tagName === 'input' || tagName === 'textarea' || await el.evaluate(node => (node as HTMLElement).isContentEditable);

                let text = '';
                if (isInput) {
                    const placeholder = await el.getAttribute('placeholder') || '';
                    const ariaLabel = await el.getAttribute('aria-label') || '';
                    const labelText = await el.evaluate(node => {
                        const labels = (node as HTMLInputElement).labels;
                        return labels && labels.length > 0 ? labels[0].innerText : '';
                    }).catch(() => '');
                    text = placeholder || ariaLabel || labelText || (tagName === 'textarea' ? 'Zone de texte' : 'Champ de saisie');
                } else {
                    text = (await el.textContent())?.trim() || '';
                    if (!text) text = await el.getAttribute('aria-label') || '';
                    if (!text) text = await el.getAttribute('title') || '';
                    if (!text) {
                        const img = el.locator('img').first();
                        text = await img.getAttribute('alt').catch(() => null) || '';
                    }
                }

                if (!text && !isInput) continue;
                if (this.shouldExclude(text)) continue;

                const boundingBox = await el.boundingBox();
                if (!boundingBox) continue;

                // ULTIMATE DISABLED DETECTION
                const detection = await el.evaluate(node => {
                    const style = window.getComputedStyle(node);
                    const isNativeDisabled = (node as any).disabled === true || node.getAttribute('disabled') !== null;
                    const isAriaDisabled = node.getAttribute('aria-disabled') === 'true';
                    const hasDataDisabled = node.getAttribute('data-disabled') === 'true';
                    const hasDisabledClass = node.classList.contains('cursor-not-allowed') ||
                        node.classList.contains('disabled') ||
                        node.classList.contains('pointer-events-none') ||
                        node.className.includes('opacity-50');
                    const isFaded = parseFloat(style.opacity) < 0.7;
                    const noPointer = style.pointerEvents === 'none';
                    const cursorNotAllowed = style.cursor === 'not-allowed';

                    return {
                        isDisabled: isNativeDisabled || isAriaDisabled || hasDataDisabled || hasDisabledClass || noPointer || (isFaded && cursorNotAllowed),
                        reasons: { isNativeDisabled, isAriaDisabled, hasDataDisabled, hasDisabledClass, noPointer, isFaded, cursorNotAllowed }
                    };
                }).catch(() => ({ isDisabled: false, reasons: {} }));

                // Specific debug for calendar dates
                if (text === "5" || text === "10" || text === "12" || text === "27") {
                    console.log(`🔍 [Discovery] Date "${text}": isDisabled=${detection.isDisabled}`, (detection as any).reasons);
                }

                elements.push({
                    selector: await this.getRobustSelector(el, text, tagName),
                    tagName,
                    text: text.substring(0, 100),
                    type: isInput ? (tagName === 'textarea' ? 'textarea' : 'input') : (tagName === 'a' ? 'link' : 'button'),
                    isVisible: true,
                    isDisabled: detection.isDisabled,
                    boundingBox,
                    ariaLabel: await el.getAttribute('aria-label') || undefined,
                });
            } catch { /* skip failed element */ }
        }

        return elements;
    }

    private async getRobustSelector(el: Locator, text: string, tagName: string): Promise<string> {
        const id = await el.getAttribute('id');
        if (id) return `${tagName}#${id}`;

        const dataTestId = await el.getAttribute('data-testid');
        if (dataTestId) return `${tagName}[data-testid="${dataTestId}"]`;

        const name = await el.getAttribute('name');
        if (name) return `${tagName}[name="${name}"]`;

        const ariaLabel = await el.getAttribute('aria-label');
        if (ariaLabel) return `${tagName}[aria-label="${ariaLabel}"]`;

        if (text && text.length < 50 && !/\d+/.test(text)) {
            return `${tagName}:has-text("${text.replace(/"/g, '\\"')}")`;
        }

        return tagName; // Last resort
    }

    /**
     * Check if text matches any exclusion patterns
     */
    private shouldExclude(text: string): boolean {
        if (!config.behavior.excludeText) return false;
        return config.behavior.excludeText.some(term =>
            text.toLowerCase().includes(term.toLowerCase())
        );
    }

    /**
     * Take a screenshot
     */
    async screenshot(name?: string): Promise<string> {
        if (!this.page) throw new Error('Browser not initialized');

        // Ensure screenshots directory exists
        const screenshotsDir = config.output.screenshotsDir;
        if (!fs.existsSync(screenshotsDir)) {
            fs.mkdirSync(screenshotsDir, { recursive: true });
        }

        const filename = name || `screenshot-${++this.screenshotCounter}`;
        const filepath = path.join(screenshotsDir, `${filename}.png`);

        await this.page.screenshot({ path: filepath });
        console.log(`📸 Screenshot saved: ${filepath}`);

        return filepath;
    }

    /**
     * Close the browser
     */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
            console.log('🔒 Browser closed');
        }
    }

    /**
     * Check if browser is open
     */
    isOpen(): boolean {
        return this.browser !== null && this.page !== null;
    }
}
