/**
 * AI Night Tester - Type Definitions
 */

/** Actions the AI can take */
export type ActionType = 'click' | 'type' | 'navigate' | 'scroll' | 'wait' | 'hover' | 'resize';

export interface Viewport {
    name: string;
    width: number;
    height: number;
    isMobile: boolean;
}

export interface TestAction {
    type: ActionType;
    selector?: string;
    value?: string;
    url?: string;
    description?: string;
}

/** Clickable/interactive element on the page */
export interface InteractiveElement {
    selector: string;
    tagName: string;
    text: string;
    type?: string;        // button, link, input, etc.
    isVisible: boolean;
    isDisabled?: boolean;
    placeholder?: string;
    ariaLabel?: string;
    value?: string;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/** HTTP error captured */
export interface HttpError {
    url: string;
    status: number;
    statusText: string;
    timestamp: Date;
}

/** Accessibility violation found by Axe */
export interface AccessibilityViolation {
    id: string;
    impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
    description: string;
    help: string;
    nodes: string[]; // Selectors of affected elements
}

/** Layout issue detected */
export interface LayoutIssue {
    type: 'overflow_x' | 'viewport_width_exceeded' | 'element_overlap';
    description: string;
    selector?: string;
}

/** Current state of the page */
export interface PageState {
    url: string;
    title: string;
    screenshotPath?: string;
    interactiveElements: InteractiveElement[];
    consoleErrors: string[];
    httpErrors: HttpError[];
    accessibilityViolations: AccessibilityViolation[];
    layoutIssues: LayoutIssue[]; // NEW
    viewport?: Viewport; // NEW
    bodyText: string;
    timestamp: Date;
}

/** Issue severity levels */
export type IssueSeverity = 'critical' | 'major' | 'minor' | 'suggestion';

/** An issue found during testing */
export interface Issue {
    id: string;
    severity: IssueSeverity;
    type: 'console_error' | 'http_error' | 'visual_bug' | 'behavior_bug' | 'accessibility' | 'crash';
    title: string;
    description: string;
    screenshotPath?: string;
    reproductionSteps: TestAction[];
    pageUrl: string;
    viewport?: Viewport; // NEW
    timestamp: Date;
    aiAnalysis?: string;   // Gemma's analysis of the issue
}

/** Test session statistics */
export interface TestStats {
    startTime: Date;
    endTime?: Date;
    totalActions: number;
    pagesVisited: Set<string>;
    issuesFound: Issue[];
    actionHistory: TestAction[];
}

/** Gemma response for action decision */
export interface GemmaActionResponse {
    actions: TestAction[];
    reasoning: string;
}

/** Gemma response for issue analysis */
export interface GemmaIssueResponse {
    isIssue: boolean;
    severity?: IssueSeverity;
    description?: string;
    suggestion?: string;
}

/** Session context for Gemma */
export interface GemmaContext {
    currentPage: PageState;
    recentActions: TestAction[];
    visitedUrls: string[];
    currentObjective: string;
    activeMission?: Mission; // NEW: The specific mission/persona being simulated
}

/** User Persona definition */
export interface Persona {
    id: string;
    name: string;
    description: string;
    frustrationTolerance: 'low' | 'medium' | 'high';
}

/** Specific testing mission */
export interface Mission {
    id: string;
    name: string;
    personaId: string;
    goal: string;
    successCondition?: string; // URL pattern or text presence
}

/** Frustration signals */
export interface FrustrationMetric {
    type: 'rage_click' | 'looping' | 'hesitation';
    score: number; // 0-1 frustration score
    details: string;
    timestamp: Date;
}

// ============================================================
// FEATURE DISCOVERY TYPES (New Enhancement)
// ============================================================

/** Tester operation modes */
export type TesterMode = 'bug-hunting' | 'feature-discovery';

/** A discovered UI feature/element */
export interface DiscoveredFeature {
    id: string;
    elementType: 'button' | 'link' | 'input' | 'select' | 'form' | 'textarea' | 'checkbox' | 'radio' | 'other';
    text: string;
    selector: string;
    ariaLabel?: string;
    category: 'navigation' | 'action' | 'form-input' | 'modal-trigger' | 'settings' | 'other';
    interactions: number;
    firstSeen: Date;
    lastSeen: Date;
}

/** Features grouped by page */
export interface PageFeatureMap {
    url: string;
    urlPath: string; // Clean path without base URL
    title: string;
    features: DiscoveredFeature[];
    visitCount: number;
    firstVisited: Date;
    lastVisited: Date;
}

/** Complete feature catalog for export */
export interface FeatureCatalog {
    generatedAt: Date;
    duration: number; // Test duration in ms
    totalPages: number;
    totalFeatures: number;
    uniqueFeatures: number;
    pages: PageFeatureMap[];
}

// ============================================================
// NAVIGATION MEMORY TYPES (Smart Exploration)
// ============================================================

/** Memory of a single element interaction */
export interface ElementMemory {
    selectorHash: string;
    selector: string;
    pageUrl: string;
    text: string;
    clickCount: number;
    firstInteraction: Date;
    lastInteraction: Date;
    wasSuccessful: boolean;
}

/** Navigation memory stats */
export interface MemoryStats {
    totalElements: number;
    totalInteractions: number;
    uniquePages: number;
    avgClicksPerElement: number;
}

