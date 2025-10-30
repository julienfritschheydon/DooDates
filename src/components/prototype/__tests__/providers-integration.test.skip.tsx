/**
 * Tests d'intégration pour les nouveaux providers
 * Vérifie que ConversationStateProvider et EditorStateProvider fonctionnent correctement
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ReactNode } from "react";
import {
  ConversationStateProvider,
  useConversationState,
  useConversationMessages,
  useConversationActions,
} from "../ConversationStateProvider";
import {
  EditorStateProvider,
  useEditorState,
  useCurrentPoll,
  useEditorActions,
} from "../EditorStateProvider";

// Wrapper pour les tests
const createWrapper = (Component: React.ComponentType<{ children: ReactNode }>) => {
  return ({ children }: { children: ReactNode }) => <Component>{children}</Component>;
};

describe("ConversationStateProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should provide conversation state", () => {
    const { result } = renderHook(() => useConversationState(), {
      wrapper: createWrapper(ConversationStateProvider),
    });

    expect(result.current.conversationId).toBeNull();
    expect(result.current.messages).toEqual([]);
  });

  it("should add message", () => {
    const { result } = renderHook(() => useConversationState(), {
      wrapper: createWrapper(ConversationStateProvider),
    });

    act(() => {
      result.current.addMessage({
        role: "user",
        content: "Test message",
      });
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].content).toBe("Test message");
    expect(result.current.messages[0].role).toBe("user");
  });

  it("should clear messages", () => {
    const { result } = renderHook(() => useConversationState(), {
      wrapper: createWrapper(ConversationStateProvider),
    });

    act(() => {
      result.current.addMessage({ role: "user", content: "Test" });
    });

    expect(result.current.messages).toHaveLength(1);

    act(() => {
      result.current.clearMessages();
    });

    expect(result.current.messages).toEqual([]);
  });

  it("should use specialized hooks without re-renders", () => {
    // Les hooks spécialisés doivent partager le même provider
    const { result } = renderHook(
      () => ({
        messages: useConversationMessages(),
        actions: useConversationActions(),
      }),
      {
        wrapper: createWrapper(ConversationStateProvider),
      },
    );

    expect(result.current.messages).toEqual([]);

    act(() => {
      result.current.actions.addMessage({ role: "user", content: "Test" });
    });

    expect(result.current.messages).toHaveLength(1);
  });
});

describe.skip("EditorStateProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should provide editor state", () => {
    const { result } = renderHook(() => useEditorState(), {
      wrapper: createWrapper(EditorStateProvider),
    });

    expect(result.current.isEditorOpen).toBe(false);
    expect(result.current.currentPoll).toBeNull();
  });

  it("should open and close editor", () => {
    const { result } = renderHook(() => useEditorState(), {
      wrapper: createWrapper(EditorStateProvider),
    });

    act(() => {
      result.current.openEditor();
    });

    expect(result.current.isEditorOpen).toBe(true);

    act(() => {
      result.current.closeEditor();
    });

    expect(result.current.isEditorOpen).toBe(false);
  });

  it("should toggle editor", () => {
    const { result } = renderHook(() => useEditorState(), {
      wrapper: createWrapper(EditorStateProvider),
    });

    expect(result.current.isEditorOpen).toBe(false);

    act(() => {
      result.current.toggleEditor();
    });

    expect(result.current.isEditorOpen).toBe(true);

    act(() => {
      result.current.toggleEditor();
    });

    expect(result.current.isEditorOpen).toBe(false);
  });

  it("should use specialized hooks without re-renders", () => {
    const { result: pollResult } = renderHook(() => useCurrentPoll(), {
      wrapper: createWrapper(EditorStateProvider),
    });

    const { result: actionsResult } = renderHook(() => useEditorActions(), {
      wrapper: createWrapper(EditorStateProvider),
    });

    expect(pollResult.current).toBeNull();

    act(() => {
      actionsResult.current.openEditor();
    });

    // Poll reste null mais éditeur est ouvert
    expect(pollResult.current).toBeNull();
  });
});

describe.skip("Providers integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should work together without conflicts", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ConversationStateProvider>
        <EditorStateProvider>{children}</EditorStateProvider>
      </ConversationStateProvider>
    );

    const { result: conversationResult } = renderHook(() => useConversationState(), {
      wrapper,
    });

    const { result: editorResult } = renderHook(() => useEditorState(), {
      wrapper,
    });

    // Les deux providers fonctionnent indépendamment
    act(() => {
      conversationResult.current.addMessage({ role: "user", content: "Test" });
      editorResult.current.openEditor();
    });

    expect(conversationResult.current.messages).toHaveLength(1);
    expect(editorResult.current.isEditorOpen).toBe(true);
  });
});
