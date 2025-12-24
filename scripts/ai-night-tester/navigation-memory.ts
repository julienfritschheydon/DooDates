/**
 * AI Night Tester - Navigation Memory
 * 
 * Tracks all element interactions to enable smart exploration
 * and avoid repetitive actions.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { fileURLToPath } from 'url';
import type { ElementMemory, MemoryStats, InteractiveElement } from './types';

// Persistence path based on process root to avoid import.meta issues
const reportsDir = path.join(process.cwd(), 'scripts', 'ai-night-tester', 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

export class NavigationMemory {
    private memory: Map<string, ElementMemory> = new Map();
    private pageVisits: Map<string, number> = new Map();
    private persistPath: string;

    constructor(persistPath?: string) {
        this.persistPath = persistPath || path.join(reportsDir, '.global-memory.json');
        this.loadFromDisk();
    }

    /**
     * Generate a unique hash for an element based on selector and page
     */
    private hashElement(selector: string, pageUrl: string): string {
        const normalized = `${this.normalizeUrl(pageUrl)}::${selector}`;
        return crypto.createHash('md5').update(normalized).digest('hex').substring(0, 12);
    }

    /**
     * Normalize URL to path only (remove base URL variations)
     */
    private normalizeUrl(url: string): string {
        try {
            const parsed = new URL(url);
            return parsed.pathname;
        } catch {
            // Already a path
            return url.replace(/^https?:\/\/[^/]+/, '');
        }
    }

    /**
     * Record an interaction with an element
     */
    recordInteraction(element: InteractiveElement, pageUrl: string, wasSuccessful: boolean = true): void {
        // Reload to sync with other workers
        this.loadFromDisk();

        const hash = this.hashElement(element.selector, pageUrl);
        const existing = this.memory.get(hash);

        if (existing) {
            existing.clickCount++;
            existing.lastInteraction = new Date();
            existing.wasSuccessful = wasSuccessful;
        } else {
            this.memory.set(hash, {
                selectorHash: hash,
                selector: element.selector,
                pageUrl: this.normalizeUrl(pageUrl),
                text: element.text.substring(0, 100),
                clickCount: 1,
                firstInteraction: new Date(),
                lastInteraction: new Date(),
                wasSuccessful,
            });
        }

        this.saveToDisk();
    }

    /**
     * Record a visit to a page (for curiosity gradient)
     */
    recordPageVisit(pageUrl: string): number {
        this.loadFromDisk();
        const url = this.normalizeUrl(pageUrl);
        const count = (this.pageVisits.get(url) || 0) + 1;
        this.pageVisits.set(url, count);
        this.saveToDisk();
        return count;
    }

    /**
     * Get visit count for a page
     */
    getVisitCount(pageUrl: string): number {
        this.loadFromDisk();
        return this.pageVisits.get(this.normalizeUrl(pageUrl)) || 0;
    }

    /**
     * Get novelty score for an element (1 = never seen, 0 = frequently clicked)
     */
    getNoveltyScore(selector: string, pageUrl: string): number {
        const hash = this.hashElement(selector, pageUrl);
        const mem = this.memory.get(hash);

        if (!mem) return 1.0; // Never seen = maximum novelty

        // Decay based on click count (1 click = 0.8, 3 clicks = 0.4, 5+ = 0.1)
        const clickPenalty = Math.min(mem.clickCount * 0.2, 0.9);
        return Math.max(0.1, 1.0 - clickPenalty);
    }

    /**
     * Check if element has been clicked before
     */
    hasBeenClicked(selector: string, pageUrl: string): boolean {
        const hash = this.hashElement(selector, pageUrl);
        return this.memory.has(hash);
    }

    /**
     * Get click count for element
     */
    getClickCount(selector: string, pageUrl: string): number {
        const hash = this.hashElement(selector, pageUrl);
        return this.memory.get(hash)?.clickCount || 0;
    }

    /**
     * Get statistics about navigation memory
     */
    getStats(): MemoryStats {
        const elements = Array.from(this.memory.values());
        const uniquePages = new Set(elements.map(e => e.pageUrl)).size;
        const totalClicks = elements.reduce((sum, e) => sum + e.clickCount, 0);

        return {
            totalElements: elements.length,
            totalInteractions: totalClicks,
            uniquePages,
            avgClicksPerElement: elements.length > 0 ? totalClicks / elements.length : 0,
        };
    }

    /**
     * Get elements sorted by novelty (most novel first)
     */
    rankByNovelty(elements: InteractiveElement[], pageUrl: string): InteractiveElement[] {
        return [...elements].sort((a, b) => {
            const scoreA = this.getNoveltyScore(a.selector, pageUrl);
            const scoreB = this.getNoveltyScore(b.selector, pageUrl);
            return scoreB - scoreA; // Higher score = more novel = first
        });
    }

    /**
     * Save memory to disk for persistence between sessions
     */
    saveToDisk(): void {
        try {
            const data = {
                savedAt: new Date().toISOString(),
                elements: Array.from(this.memory.entries()),
                pageVisits: Array.from(this.pageVisits.entries()),
            };
            fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
        } catch (error) {
            // Silently fail to avoid worker noise
        }
    }

    /**
     * Load memory from disk
     */
    private loadFromDisk(): void {
        try {
            if (fs.existsSync(this.persistPath)) {
                const raw = fs.readFileSync(this.persistPath, 'utf-8');
                const data = JSON.parse(raw);

                if (data.elements && Array.isArray(data.elements)) {
                    this.memory = new Map(data.elements.map(([key, value]: [string, ElementMemory]) => {
                        // Restore dates
                        value.firstInteraction = new Date(value.firstInteraction);
                        value.lastInteraction = new Date(value.lastInteraction);
                        return [key, value];
                    }));
                }

                if (data.pageVisits && Array.isArray(data.pageVisits)) {
                    this.pageVisits = new Map(data.pageVisits);
                }
            }
        } catch (error) {
            // Ignore corrupted loads
        }
    }

    /**
     * Clear all memory (for fresh sessions)
     */
    clear(): void {
        this.memory.clear();
        if (fs.existsSync(this.persistPath)) {
            fs.unlinkSync(this.persistPath);
        }
        console.log('🧹 Navigation memory cleared');
    }
}
