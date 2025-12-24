import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    createConversation,
    updateConversation,
    getConversation,
    getConversations,
    clearAll,
} from "../ConversationStorageSimple";
import { hasWindow } from "../storageUtils";

describe("Favorites Persistence (LocalStorage)", () => {
    beforeEach(() => {
        // Override the "safe" but broken mock from setup.ts with a working one for this test
        const store: Record<string, string> = {};
        const mockStorage = {
            getItem: (key: string) => {
                return key in store ? store[key] : null;
            },
            setItem: (key: string, value: string) => {
                store[key] = value + "";
            },
            removeItem: (key: string) => {
                delete store[key];
            },
            clear: () => {
                Object.keys(store).forEach(key => delete store[key]);
            },
            key: (index: number) => Object.keys(store)[index] || null,
            length: 0
        };

        // Define length property getter
        Object.defineProperty(mockStorage, 'length', {
            get: () => Object.keys(store).length
        });

        Object.defineProperty(window, "localStorage", {
            value: mockStorage,
            writable: true,
            configurable: true
        });

        clearAll();
        vi.restoreAllMocks();
    });

    it("should create a conversation with isFavorite false by default", () => {
        const conversation = createConversation({
            title: "Test Conversation",
            firstMessage: "Hello",
            userId: "test-user",
        });

        expect(conversation.isFavorite).toBe(false);

        // Check persistence
        const saved = getConversation(conversation.id);
        expect(saved?.isFavorite).toBe(false);
    });

    it("should update isFavorite to true and persist", () => {
        const conversation = createConversation({
            title: "Favorite Conversation",
            firstMessage: "I like this one",
            userId: "test-user",
        });

        // Update to favorite
        updateConversation({
            ...conversation,
            isFavorite: true,
        });

        // Verify persistence
        const saved = getConversation(conversation.id);
        expect(saved?.isFavorite).toBe(true);
    });

    it("should update isFavorite to false and persist (remove from favorites)", () => {
        const conversation = createConversation({
            title: "Unfavorite Conversation",
            firstMessage: "I don't like this anymore",
            userId: "test-user",
        });

        // Set as favorite first
        updateConversation({
            ...conversation,
            isFavorite: true,
        });

        expect(getConversation(conversation.id)?.isFavorite).toBe(true);

        // Remove from favorite
        const favoriteConv = getConversation(conversation.id);
        if (favoriteConv) {
            updateConversation({
                ...favoriteConv,
                isFavorite: false,
            });
        }

        // Verify persistence
        const saved = getConversation(conversation.id);
        expect(saved?.isFavorite).toBe(false);
    });

    it("should filter favorites correctly", () => {
        // Create mixed conversations
        // Create C1
        createConversation({ title: "C1", firstMessage: "M1" });

        // Create C2 and fav
        const c2 = createConversation({ title: "C2", firstMessage: "M2" });
        updateConversation({ ...c2, isFavorite: true });

        // Create C3
        createConversation({ title: "C3", firstMessage: "M3" });

        const all = getConversations();
        const favorites = all.filter(c => c.isFavorite);

        expect(all.length).toBe(3);
        expect(favorites.length).toBe(1);
        expect(favorites[0].id).toBe(c2.id);
    });

    it("should persist across 'reloads' (simulated by reading directly from localStorage)", () => {
        // Create and mark favorite
        const c1 = createConversation({ title: "Persistent Fav", firstMessage: "M1" });
        updateConversation({ ...c1, isFavorite: true });

        // We can verify that data is in localStorage directly to ensure it survives.
        const storedData = window.localStorage.getItem("doodates_conversations");

        // Check if data is present
        expect(storedData, `localStorage should have data. hasWindow=${hasWindow()}`).toBeTruthy();

        const parsed = JSON.parse(storedData || "[]");
        const savedConv = parsed.find((c: any) => c.id === c1.id);
        expect(savedConv).toBeDefined();
        expect(savedConv.isFavorite).toBe(true);
    });
});
