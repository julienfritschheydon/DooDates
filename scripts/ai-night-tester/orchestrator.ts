/**
 * AI Night Tester - Orchestrator
 * 
 * Main control loop for the autonomous AI testing agent
 * 
 * Supports two modes:
 * - bug-hunting: Find bugs, accessibility issues, and UX problems
 * - feature-discovery: Catalog all UI features and export to JSON/Markdown
 */

import { GemmaBrain } from './gemma-brain';
import { BrowserController } from './browser-controller';
import { ReportGenerator } from './report-generator';
import { NavigationMemory } from './navigation-memory';
import { FeatureDiscovery } from './feature-discovery';
import { config } from './ai-night-tester.config';
import * as path from 'path';
import * as fs from 'fs';
import type {
    TestAction,
    PageState,
    Issue,
    GemmaContext,
    IssueSeverity,
    TesterMode,
    InteractiveElement,
} from './types';

export interface OrchestratorOptions {
    mode: TesterMode;
    duration?: number;
    clearMemory?: boolean;
    workerId?: string;
    browserOptions?: {
        headless?: boolean;
        slowMo?: number;
    };
}

export class Orchestrator {
    private brain: GemmaBrain;
    private browser: BrowserController;
    private reporter: ReportGenerator;
    private memory: NavigationMemory;
    private featureDiscovery: FeatureDiscovery;

    private mode: TesterMode;
    private isRunning = false;
    private startTime: Date = new Date();
    private duration: number;
    private browserOptions: { headless?: boolean; slowMo?: number } = {};
    private lastSaveTime: number = Date.now();

    private visitedUrls = new Set<string>();
    private recentActions: TestAction[] = [];
    private currentPageActions = 0;
    private consecutiveErrors = 0;
    private issueIdCounter = 0;
    private loggedAccessibilityIssues = new Set<string>();
    private activeMission: any | null = null;
    private blacklistedSelectors = new Set<string>();

    // Product rotation for sequential testing
    private currentProductIndex = 0;
    private productStartTime: number = Date.now();
    private actionsInCurrentProduct = 0;
    private readonly ACTIONS_PER_PRODUCT = 20; // Rotate after N actions per product
    private workerId: string = 'main';
    private isChaosMode: boolean = false;

    private missions = config.missions;
    private analysisPromise: Promise<void> | null = null;
    private backgroundScreenshotPath: string | null = null;

    constructor(options: OrchestratorOptions | number) {
        // Support legacy constructor (just duration)
        if (typeof options === 'number') {
            this.mode = 'bug-hunting';
            this.duration = options;
        } else {
            this.mode = options.mode;
            this.duration = options.duration || config.duration.default;
            this.workerId = options.workerId || 'main';
            this.browserOptions = options.browserOptions || {};

            // Clear memory if requested
            if (options.clearMemory) {
                this.memory = new NavigationMemory();
                this.memory.clear();
            }
        }

        this.brain = new GemmaBrain();
        this.browser = new BrowserController();
        this.reporter = new ReportGenerator();
        this.memory = new NavigationMemory();
        this.featureDiscovery = new FeatureDiscovery();
    }

    /**
     * Start the testing session
     */
    async start(): Promise<void> {
        const modeEmoji = this.mode === 'feature-discovery' ? '🔍' : '🐛';
        const modeLabel = this.mode === 'feature-discovery' ? 'FEATURE DISCOVERY' : 'BUG HUNTING';

        console.log('\n🌙 ═══════════════════════════════════════════');
        console.log(`   AI NIGHT TESTER - ${modeLabel} ${modeEmoji}`);
        console.log('═══════════════════════════════════════════════\n');

        // Show memory stats
        const memStats = this.memory.getStats();
        console.log(`🧠 Navigation Memory: ${memStats.totalElements} elements, ${memStats.uniquePages} pages`);

        // Initialize Reporter
        this.reporter.init();

        // Check Ollama connection
        console.log('🔌 Checking Ollama connection...');
        const ollamaOk = await this.brain.checkConnection();
        if (!ollamaOk) {
            console.error('❌ Ollama not available. Please run: ollama serve');
            console.error(`   Then: ollama pull ${config.ollama.deepModel}`);
            return;
        }
        console.log('✅ Ollama connected');

        // Warm up the model
        console.log('🔥 Warming up model (this may take 20-30s on first run)...');
        const warmupStart = Date.now();
        await this.brain.warmUp();
        const warmupTime = ((Date.now() - warmupStart) / 1000).toFixed(1);
        console.log(`✅ Model ready (${warmupTime}s)\n`);

        // Initialize browser
        await this.browser.init(this.browserOptions);

        // Initial navigation
        await this.navigateToNewPage();

        if (this.mode === 'bug-hunting') {
            this.pickNewMission();
        }

        this.isRunning = true;

        console.log(`⏰ Test duration: ${Math.round(this.duration / 60000)} minutes`);
        console.log(`🎯 Starting URL: ${config.app.baseUrl}`);
        console.log('\n───────────────────────────────────────────────\n');

        try {
            await this.runTestLoop();
        } catch (error) {
            console.error('❌ Fatal error:', error);
            await this.logIssue({
                type: 'crash',
                severity: 'critical',
                title: 'Test Orchestrator Crash',
                description: String(error),
                pageUrl: 'N/A',
            });
        } finally {
            await this.stop();
        }
    }

    /**
     * Main test loop
     */
    private async runTestLoop(): Promise<void> {
        const startPage = config.app.startPages[0];
        await this.browser.navigate(startPage);
        this.visitedUrls.add(startPage);
        this.reporter.logPageVisit(startPage);

        while (this.isRunning && !this.isTimeUp()) {
            try {
                // 1. Get current page state
                const pageState = await this.browser.getPageState();
                this.visitedUrls.add(pageState.url);
                this.reporter.logPageVisit(pageState.url);

                // Track page visit and check for Chaos Mode (Curiosity Gradient)
                const visitCount = this.memory.recordPageVisit(pageState.url);
                this.isChaosMode = visitCount > 10;
                if (this.isChaosMode) {
                    console.log(`🔥 [Worker-${this.workerId}] CHAOS MODE ACTIVATED (Visit count: ${visitCount})`);
                }

                // 2. Feature Discovery (Always active in background)
                this.featureDiscovery.registerFeatures(
                    pageState.interactiveElements,
                    pageState.url,
                    pageState.title
                );

                // Log discovery progress periodically
                if (this.mode === 'feature-discovery') {
                    const fdStats = this.featureDiscovery.getStats();
                    if (fdStats.features % 20 === 0) {
                        console.log(`📊 Discovery: ${fdStats.pages} pages, ${fdStats.features} features`);
                    }
                }

                // 3. Check for automatic issues (only in bug-hunting mode) - ASYNCHRONOUS
                if (this.mode === 'bug-hunting') {
                    if (!this.analysisPromise) {
                        // Deep analysis only every 5 actions OR on first page load
                        const shouldDeepAnalyze = (this.currentPageActions === 1 || this.recentActions.length % 5 === 0);

                        // We take a snapshot-specific name
                        const timestamp = Date.now();
                        const screenshotName = `bg-analysis-${timestamp}`;

                        // Start background analysis
                        this.analysisPromise = (async () => {
                            // Take screenshot for context
                            const preCapturedPath = await this.browser.screenshot(screenshotName);
                            await this.checkForIssues(pageState, preCapturedPath, shouldDeepAnalyze);
                        })().catch(e => console.error('⚠️ Background analysis error:', e))
                            .finally(() => {
                                this.analysisPromise = null;
                            });
                    }
                }

                // 4. Build prioritised element list with semantic and visual scores
                const priorities = new Map<string, number>();
                pageState.interactiveElements = pageState.interactiveElements.filter(el => {
                    if (this.blacklistedSelectors.has(el.selector)) return false;

                    const novelty = this.memory.getNoveltyScore(el.selector, pageState.url);
                    const semanticWeight = this.calculateSemanticWeight(el);
                    const visualWeight = this.calculateVisualWeight(el, pageState.viewport);

                    // --- STATE-CHANGE PENALTY ---
                    let stateChangePenalty = 0;
                    if (el.type === 'link') {
                        // Penalize leaving the page too early (e.g. before 3 actions)
                        if (this.currentPageActions < 3) {
                            stateChangePenalty = 0.3;
                        }

                        // Heavier penalty if the link goes to a recently visited URL (anti-ping-pong)
                        const lastUrl = this.recentActions.length > 0 ? this.recentActions[this.recentActions.length - 1].url : null;
                        if (lastUrl && el.text.toLowerCase().includes('retour') || el.text.toLowerCase().includes('home')) {
                            stateChangePenalty += 0.2;
                        }
                    }

                    // Final priority score
                    const totalPriority = (novelty * 0.4) + (semanticWeight * 0.4) + (visualWeight * 0.2) - stateChangePenalty;
                    priorities.set(el.selector, totalPriority);
                    return true;
                });

                // Sort elements by priority for the prompt
                pageState.interactiveElements.sort((a, b) =>
                    (priorities.get(b.selector) || 0) - (priorities.get(a.selector) || 0)
                );

                // 5. Ask Gemma for next action with novelty hints
                let currentObjective = this.mode === 'feature-discovery'
                    ? 'Explorer toutes les pages et découvrir tous les boutons/liens'
                    : (this.activeMission?.goal || 'Explorer l\'application librement');

                if (this.isChaosMode) {
                    currentObjective = `🔥 STABLE PAGE DETECTED. GO CRAZY: ${currentObjective}. Trigger edge cases, rapid double-clicks, invalid inputs, and unexpected navigation patterns. Don't be professional, be a destructive tester.`;
                }

                const context: GemmaContext = {
                    currentPage: pageState,
                    recentActions: this.recentActions.slice(-5),
                    visitedUrls: Array.from(this.visitedUrls),
                    currentObjective,
                    activeMission: this.mode === 'bug-hunting' ? this.activeMission : undefined,
                };

                console.log(`\n🤖 Asking Gemma for next action...`);
                const decision = await this.brain.decideNextAction(context);
                console.log(`   📥 Decision: ${decision.actions.length} actions predicted`);
                console.log(`   Reason: ${decision.reasoning}`);

                // 6. Execute the action batch
                let lastSuccess = true;
                for (const action of decision.actions) {
                    if (!this.isRunning || this.isTimeUp()) break;

                    console.log(`   🎯 Executing: ${action.type} - ${action.description || action.selector}`);
                    const success = await this.browser.executeAction(action);
                    lastSuccess = success;

                    // 7. Record interaction in memory
                    if (action.type === 'click' && action.selector) {
                        const element = pageState.interactiveElements.find(el => el.selector === action.selector);
                        if (element) {
                            this.memory.recordInteraction(element, pageState.url, success);
                        }

                        // Also record in feature discovery
                        if (action.selector) {
                            this.featureDiscovery.recordInteraction(action.selector, pageState.url);
                        }
                    }

                    // 8. Log the action
                    this.recentActions.push(action);
                    this.reporter.logAction(action, success);

                    // 9. BREAK BATCH if navigation occurred (URL changed)
                    const currentUrl = await this.browser.getCurrentUrl();
                    if (currentUrl !== pageState.url) {
                        console.log(`   📍 Navigation detected (${currentUrl}). Breaking batch.`);
                        break;
                    }

                    // Small wait between batch actions
                    await new Promise(r => setTimeout(r, 100));
                }

                if (this.recentActions.length > 50) {
                    this.recentActions = this.recentActions.slice(-30);
                }

                this.currentPageActions++;

                // Random viewport resize (15% chance)
                if (config.behavior.randomizeViewport && Math.random() < 0.15) {
                    console.log('🎲 Random viewport resize triggered!');
                    await this.browser.executeAction({ type: 'resize' });
                }

                if (lastSuccess) {
                    this.consecutiveErrors = 0;
                } else {
                    this.consecutiveErrors++;
                    console.warn(`⚠️ Action failed (${this.consecutiveErrors}/5)`);
                    if (this.consecutiveErrors >= config.behavior.maxConsecutiveErrors) {
                        console.warn('⚠️ Too many consecutive errors, forcing navigation...');
                        await this.forceNavigate();
                    }
                }

                // Detect frustration (rage clicks) - only in bug-hunting mode
                const lastAction = decision.actions[decision.actions.length - 1];
                if (this.mode === 'bug-hunting' && lastAction) {
                    this.detectFrustration(lastAction);
                }

                // Handle blocked file uploads
                if (this.browser.blockedFileUploads.length > 0) {
                    const lastBlocked = this.browser.blockedFileUploads[this.browser.blockedFileUploads.length - 1];
                    if (new Date().getTime() - lastBlocked.getTime() < 2000) {
                        console.log('🚫 Last action triggered a blocked file upload. Adding to exclusion list.');

                        if (this.mode === 'bug-hunting' && lastAction) {
                            await this.logIssue({
                                type: 'behavior_bug',
                                severity: 'major',
                                title: 'Blocking Interaction: File Upload',
                                description: `Action "${lastAction.description}" triggered a native file picker.`,
                                pageUrl: pageState.url || 'unknown',
                                aiAnalysis: 'Avoid interacting with this element type in automated tests.',
                            });
                        }

                        if (lastAction?.description) {
                            const textMatch = lastAction.description.split(': ')[1];
                            if (textMatch) {
                                config.behavior.excludeText.push(textMatch.trim());
                            }
                        }
                    }
                }

                // Check if we should move to a new page
                if (this.currentPageActions >= config.behavior.maxActionsPerPage) {
                    console.log(`📍 Max actions on page reached, moving on...`);
                    await this.navigateToNewPage();
                    this.currentPageActions = 0;
                }

                // Mission rotation (bug-hunting only)
                if (this.mode === 'bug-hunting' && this.currentPageActions >= 20) {
                    this.pickNewMission();
                }

                // Wait between actions
                await new Promise(r => setTimeout(r, config.behavior.waitBetweenActions));

                // Periodic Autosave (every 1 hour)
                // const saveInterval = 60 * 60 * 1000; // 1 hour
                const saveInterval = 60 * 60 * 1000;
                if (Date.now() - this.lastSaveTime > saveInterval) {
                    console.log('💾 Triggering Hourly Autosave...');
                    this.memory.saveToDisk(); // Save navigation graph

                    // Save discovered features
                    // Always export feature catalog to allow monitoring progress in all modes
                    this.featureDiscovery.exportToJSON();
                    this.featureDiscovery.exportToMarkdown();

                    // Generate Hourly Report Snapshot
                    const hour = Math.round((Date.now() - this.startTime.getTime()) / (60 * 60 * 1000));
                    this.reporter.generateIntermediateReport(`hour-${hour}`);

                    this.lastSaveTime = Date.now();
                }

                // Log progress periodically
                this.logProgress();

            } catch (error) {
                console.error('⚠️ Loop error:', error);
                this.consecutiveErrors++;

                if (this.consecutiveErrors >= config.behavior.maxConsecutiveErrors) {
                    await this.forceNavigate();
                }
            }
        }
    }

    /**
     * Check current page for issues (bug-hunting mode)
     */
    private async checkForIssues(pageState: PageState, backgroundScreenshot?: string, forceDeepAnalyze?: boolean): Promise<void> {
        // Console errors
        for (const error of pageState.consoleErrors) {
            await this.logIssue({
                type: 'console_error',
                severity: 'major',
                title: 'Console Error',
                description: error,
                pageUrl: pageState.url,
                explicitScreenshotPath: backgroundScreenshot
            });
        }

        // HTTP errors
        for (const httpError of pageState.httpErrors) {
            const severity: IssueSeverity = httpError.status >= 500 ? 'critical' : 'major';
            await this.logIssue({
                type: 'http_error',
                severity,
                title: `HTTP ${httpError.status} Error`,
                description: `${httpError.statusText}: ${httpError.url}`,
                pageUrl: pageState.url,
                explicitScreenshotPath: backgroundScreenshot
            });
        }

        // Accessibility violations
        if (pageState.accessibilityViolations) {
            for (const violation of pageState.accessibilityViolations) {
                if (violation.impact !== 'critical' && violation.impact !== 'serious') continue;

                const key = `${pageState.url}:${violation.id}`;
                if (this.loggedAccessibilityIssues.has(key)) continue;
                this.loggedAccessibilityIssues.add(key);

                await this.logIssue({
                    type: 'accessibility',
                    severity: violation.impact === 'critical' ? 'major' : 'minor',
                    title: `Accessibility: ${violation.id}`,
                    description: `${violation.description} (${violation.help}) on ${violation.nodes.length} elements`,
                    pageUrl: pageState.url,
                    aiAnalysis: `Fix: ${violation.help}`,
                    explicitScreenshotPath: backgroundScreenshot
                });
            }
        }

        // AI Analysis - Only every 5 actions or on specific triggers
        const shouldAnalyze = forceDeepAnalyze ?? (this.currentPageActions === 1 || this.recentActions.length % 5 === 0);

        if (shouldAnalyze) {
            console.log(`🧠 [Background] Deep AI analysis starting for ${pageState.url}...`);
            const analysis = await this.brain.analyzeForIssues(pageState);
            if (analysis.isIssue) {
                await this.logIssue({
                    type: 'behavior_bug',
                    severity: analysis.severity || 'minor',
                    title: 'UX/UI Issue (AI Detected)',
                    description: analysis.description || 'Potential issue detected by AI',
                    pageUrl: pageState.url,
                    aiAnalysis: analysis.suggestion,
                    explicitScreenshotPath: backgroundScreenshot
                });
            }
            console.log(`✅ [Background] Deep AI analysis complete.`);
        }
    }

    /**
     * Log an issue with screenshot
     */
    private async logIssue(params: {
        type: Issue['type'];
        severity: IssueSeverity;
        title: string;
        description: string;
        pageUrl: string;
        aiAnalysis?: string;
        explicitScreenshotPath?: string;
    }): Promise<void> {
        const issueId = `issue-${++this.issueIdCounter}`;

        let screenshotPath: string | undefined = params.explicitScreenshotPath;

        // If no pre-captured screenshot, take one now (only if we're not in the middle of a background analysis)
        if (!screenshotPath && config.behavior.screenshotOnIssue) {
            try {
                screenshotPath = await this.browser.screenshot(issueId);
            } catch { /* ignore */ }
        }

        const issue: Issue = {
            id: issueId,
            severity: params.severity,
            type: params.type,
            title: params.title,
            description: params.description,
            screenshotPath,
            reproductionSteps: [...this.recentActions.slice(-10)],
            pageUrl: params.pageUrl,
            viewport: this.browser.currentViewport,
            timestamp: new Date(),
            aiAnalysis: params.aiAnalysis,
        };

        this.reporter.logIssue(issue);
    }

    /**
     * Navigate to a new unexplored page (with product rotation)
     */
    private async navigateToNewPage(): Promise<void> {
        // Check if we should rotate to the next product
        this.actionsInCurrentProduct++;
        if (this.actionsInCurrentProduct >= this.ACTIONS_PER_PRODUCT) {
            this.rotateToNextProduct();
        }

        const currentProduct = config.productGroups[this.currentProductIndex];
        const productRoutes = currentProduct?.routes || config.priorityRoutes;

        // EXCLUSION LIST: Skip poll workspaces
        const excludedPaths = [
            '/date-polls/workspace'
        ];

        // Find unvisited routes within current product
        const unvisited = productRoutes.filter(
            route => !this.visitedUrls.has(route) &&
                !this.visitedUrls.has(config.app.baseUrl + route) &&
                !excludedPaths.some(p => route.startsWith(p))
        );

        if (unvisited.length > 0) {
            const next = unvisited[0];
            console.log(`📍 [${currentProduct?.name || 'Global'}] Navigating to unvisited: ${next}`);
            await this.browser.navigate(next);
            this.visitedUrls.add(next);
        } else {
            // All routes in current product visited, pick random from current product
            // Filter exclusions here too
            const performantRoutes = productRoutes.filter(r => !excludedPaths.some(p => r.startsWith(p)));

            if (performantRoutes.length > 0) {
                const random = performantRoutes[Math.floor(Math.random() * performantRoutes.length)];
                console.log(`📍 [${currentProduct?.name || 'Global'}] Revisiting: ${random}`);
                await this.browser.navigate(random);
            } else {
                console.warn(`⚠️ No valid routes found for product ${currentProduct?.name}. Force navigating to home.`);
                await this.forceNavigate();
            }
        }

        this.currentPageActions = 0;
    }

    /**
     * Rotate to the next product in the sequence
     */
    private rotateToNextProduct(): void {
        const previousProduct = config.productGroups[this.currentProductIndex];
        this.currentProductIndex = (this.currentProductIndex + 1) % config.productGroups.length;
        const nextProduct = config.productGroups[this.currentProductIndex];

        console.log(`\n🔄 ═══════════════════════════════════════════`);
        console.log(`   PRODUCT ROTATION: ${previousProduct?.name} → ${nextProduct?.name}`);
        console.log(`═══════════════════════════════════════════════\n`);

        this.actionsInCurrentProduct = 0;
        this.productStartTime = Date.now();
    }

    /**
     * Force navigation after errors
     */
    private async forceNavigate(): Promise<void> {
        const startPage = config.app.startPages[
            Math.floor(Math.random() * config.app.startPages.length)
        ];
        console.log(`🔄 Force navigating to: ${startPage}`);
        await this.browser.navigate(startPage);
        this.consecutiveErrors = 0;
        this.currentPageActions = 0;
    }

    /**
     * Check if test time is up
     */
    private isTimeUp(): boolean {
        const elapsed = Date.now() - this.startTime.getTime();
        return elapsed >= this.duration;
    }

    /**
     * Log progress
     */
    private logProgress(): void {
        const stats = this.reporter.getStats();
        const elapsed = Date.now() - this.startTime.getTime();
        const remaining = Math.max(0, this.duration - elapsed);
        const remainingMinutes = Math.round(remaining / 60000);

        if (stats.totalActions % 10 === 0) {
            if (this.mode === 'feature-discovery') {
                const fdStats = this.featureDiscovery.getStats();
                console.log(`\n📊 Progress: ${stats.totalActions} actions, ${fdStats.pages} pages, ${fdStats.features} features`);
            } else {
                console.log(`\n📊 Progress: ${stats.totalActions} actions, ${stats.pagesVisited.size} pages, ${this.reporter.getIssuesCount()} issues`);
            }
            console.log(`   ⏰ Time remaining: ${remainingMinutes} minutes\n`);
        }
    }

    /**
     * Stop the testing session
     */
    async stop(): Promise<void> {
        console.log('\n───────────────────────────────────────────────');
        console.log('🛑 Stopping AI Night Tester...\n');

        this.isRunning = false;

        // Save navigation memory
        this.memory.saveToDisk();

        // Always Generate Feature Catalog (Passive Mode)
        console.log('📦 Updating Feature Catalog (Passive Discovery)...');
        // Only log paths if we actually have data
        const fdStats = this.featureDiscovery.getStats();
        if (fdStats.features > 0) {
            const jsonPath = this.featureDiscovery.exportToJSON();
            const mdPath = this.featureDiscovery.exportToMarkdown();
            console.log(`   JSON: ${jsonPath}`);
            console.log(`   Markdown: ${mdPath}`);

            // Auto-update main documentation
            this.featureDiscovery.updateDocumentation(this.featureDiscovery.buildCatalog());
        } else {
            console.log('   (No features discovered to export)');
        }

        // Mode-specific additional outputs
        if (this.mode === 'bug-hunting') {
            // Generate AI Narrative Summary (bug-hunting mode)
            console.log('🤖 Generating AI Narrative Summary...');
            const historyStr = this.recentActions
                .map(a => `${a.type}: ${a.description || a.selector}`)
                .join('\n');

            try {
                const summary = await this.brain.summarizeSession(historyStr);
                console.log(`\n📝 Summary generated: ${summary.substring(0, 50)}...`);
                this.reporter.setSessionSummary(summary);
            } catch (error) {
                console.warn('⚠️ Could not generate narrative summary:', error);
            }
        }

        // Generate final report
        const reportPath = this.reporter.generateReport();

        // Close browser
        await this.browser.close();

        console.log('\n═══════════════════════════════════════════════');
        console.log('   AI NIGHT TESTER - Complete');
        console.log('═══════════════════════════════════════════════');
        console.log(`\n📋 Report saved: ${reportPath}\n`);
    }

    /**
     * Pick a random mission (bug-hunting mode only)
     */
    private pickNewMission(): void {
        if (this.mode !== 'bug-hunting') return;

        const randomIndex = Math.floor(Math.random() * this.missions.length);
        this.activeMission = this.missions[randomIndex];
        console.log(`\n🎭 Mission activée: [${this.activeMission.name}] - ${this.activeMission.goal}`);

        const startPath = this.activeMission.successCondition.split('/')[1];
        if (startPath) {
            console.log(`📍 Auto-navigating to mission area: /${startPath}`);
            this.browser.navigate(`/${startPath}`).catch(() => { });
        }
    }

    /**
     * Detect frustration patterns like rage clicks
     */
    private detectFrustration(action: TestAction): void {
        if (action.type !== 'click' || !action.selector) return;

        const last3 = this.recentActions.slice(-3);
        const isRageClick = last3.length >= 3 && last3.every(a =>
            a.type === 'click' && a.selector === action.selector
        );

        if (isRageClick) {
            console.warn(`🤬 Rage Click détecté sur: ${action.selector}. Ajout à la liste noire temporaire.`);
            this.blacklistedSelectors.add(action.selector);
            this.logIssue({
                type: 'behavior_bug',
                severity: 'minor',
                title: 'UX: Rage Click Détecté',
                description: `L'utilisateur a cliqué 3 fois de suite sur "${action.selector}". Soit l'interface est lente, soit le bouton ne semble pas fonctionner.`,
                pageUrl: 'current',
            });
            return;
        }

        // Detect Ping-Pong Loop (A -> B -> A -> B)
        const last4 = this.recentActions.slice(-4);
        if (last4.length === 4) {
            const [a1, b1, a2, b2] = last4;
            if (a1.selector && b1.selector && a1.selector === a2.selector && b1.selector === b2.selector && a1.selector === action.selector) {
                console.warn(`🏓 Ping-Pong détecté entre: ${a1.selector} et ${b1.selector}. Blacklisting.`);
                this.blacklistedSelectors.add(a1.selector);
                this.blacklistedSelectors.add(b1.selector);
                this.logIssue({
                    type: 'behavior_bug',
                    severity: 'minor',
                    title: 'UX: Boucle Ping-Pong Détectée',
                    description: `L'IA alterne en boucle entre "${a1.selector}" et "${b1.selector}". Ces éléments sont désormais ignorés pour forcer l'exploration.`,
                    pageUrl: 'current',
                });
            }
        }
    }

    /**
     * Boost elements with "action" keywords, penalize "distraction" keywords
     */
    private calculateSemanticWeight(el: InteractiveElement): number {
        const text = (el.text + ' ' + (el.ariaLabel || '') + ' ' + (el.placeholder || '')).toLowerCase();

        const actionKeywords = ['créer', 'create', 'suivant', 'next', 'envoyer', 'send', 'publier', 'publish', 'découvrir', 'discover', 'continuer', 'continue', 'valider', 'submit', 'ok', 'participer', 'tester', 'save', 'enregistrer', 'titre', 'title'];
        const distractionKeywords = ['fermer', 'close', 'annuler', 'cancel', 'menu', 'français', 'english', 'langue', 'language', 'mentions', 'cookies', 'vitesse', 'mode', 'propos', 'about', 'contact', 'légales', 'conditions', 'privacy', 'sécurité', 'security', 'aide', 'help', 'cgu', 'confidentialité', 'support'];

        let weight = 0.5; // Base weight

        if (actionKeywords.some(kw => text.includes(kw))) weight += 0.5;
        if (distractionKeywords.some(kw => text.includes(kw))) weight -= 0.6; // Heavier penalty

        if (text.includes('titre') || text.includes('title')) weight += 0.6;
        if (text.includes('publier') || text.includes('publish')) weight += 0.8;

        // CRITICAL: Heavy boost for "Mois suivant"
        if (text.includes('mois suivant') || text.includes('next month')) {
            weight += 0.8;
        } else if (text.includes('mois') || /\d+/.test(text)) {
            weight += 0.4;
        }

        // Bias: Inputs are usually more important than links during exploration
        if (el.type?.startsWith('input')) weight += 0.2;

        return Math.max(0.1, Math.min(1.0, weight));
    }

    /**
     * Prioritize elements near the center-top of the screen (human-like visual bias)
     */
    private calculateVisualWeight(el: InteractiveElement, viewport?: { width: number, height: number }): number {
        if (!el.boundingBox || !viewport) return 0.5;

        const centerX = viewport.width / 2;
        const centerY = viewport.height / 3;

        const elCenterX = el.boundingBox.x + el.boundingBox.width / 2;
        const elCenterY = el.boundingBox.y + el.boundingBox.height / 2;

        const distMax = Math.sqrt(Math.pow(viewport.width, 2) + Math.pow(viewport.height, 2));
        const dist = Math.sqrt(Math.pow(centerX - elCenterX, 2) + Math.pow(centerY - elCenterY, 2));

        // Invert distance: 0 distance = 1.0 weight, max distance = 0.0 weight
        return 1.0 - (dist / distMax);
    }
}
