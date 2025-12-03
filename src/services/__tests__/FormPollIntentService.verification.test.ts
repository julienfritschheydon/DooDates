import { describe, it, expect } from "vitest";
import { FormPollIntentService } from "../FormPollIntentService";
import type { Poll } from "../../lib/pollStorage";

const mockFormPoll: Poll = {
    id: "test-form-verify",
    slug: "test-form-verify",
    title: "Questionnaire de vérification",
    type: "form",
    creator_id: "test",
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    dates: [],
    questions: [
        {
            id: "q1",
            kind: "single",
            title: "Question 1",
            required: true,
            options: [
                { id: "opt1", label: "Option A" },
                { id: "opt2", label: "Option B" },
            ],
        },
        {
            id: "q2",
            kind: "matrix",
            title: "Matrice",
            required: false,
            matrixRows: [{ id: "r1", label: "Row 1" }],
            matrixColumns: [{ id: "c1", label: "Col 1" }],
        },
    ],
};

describe("FormPollIntentService Verification", () => {
    describe("Unquoted Options Support", () => {
        it("should detect ADD_OPTION without quotes", () => {
            const intent = FormPollIntentService.detectIntent(
                "Ajoute l'option Très satisfait à la question 1",
                mockFormPoll
            );
            expect(intent).not.toBeNull();
            expect(intent?.action).toBe("ADD_OPTION");
            expect(intent?.payload.optionText).toBe("Très satisfait");
            expect(intent?.payload.questionIndex).toBe(0);
        });

        it("should detect ADD_OPTION with quotes (backward compatibility)", () => {
            const intent = FormPollIntentService.detectIntent(
                'Ajoute l\'option "Très satisfait" à la question 1',
                mockFormPoll
            );
            expect(intent).not.toBeNull();
            expect(intent?.action).toBe("ADD_OPTION");
            expect(intent?.payload.optionText).toBe("Très satisfait");
        });

        it("should detect REMOVE_OPTION without quotes", () => {
            const intent = FormPollIntentService.detectIntent(
                "Supprime l'option Option A de la question 1",
                mockFormPoll
            );
            expect(intent).not.toBeNull();
            expect(intent?.action).toBe("REMOVE_OPTION");
            expect(intent?.payload.optionText).toBe("Option A");
        });
    });

    describe("Edge Cases & Limitations", () => {
        it("should NOT detect conditional logic requests (unsupported)", () => {
            const intent = FormPollIntentService.detectIntent(
                "Si Q1 est Option A alors montre Q2",
                mockFormPoll
            );
            expect(intent).toBeNull();
        });

        it("should detect ADD_OPTION on Matrix question (technically allowed by regex but logic might fail later)", () => {
            // The regex doesn't check question type, but the service logic does check if it supports options.
            // Matrix questions DO have options (rows/cols) but the structure is different.
            // Let's see what the service does.
            const intent = FormPollIntentService.detectIntent(
                "Ajoute l'option Nouvelle Ligne à la question 2",
                mockFormPoll
            );
            // Current implementation checks `if (question.kind === "text") return null`.
            // Matrix is NOT text, so it might return an intent.
            // Whether the reducer handles it is another story, but the intent service should detect it.
            expect(intent).not.toBeNull();
            expect(intent?.action).toBe("ADD_OPTION");
        });
    });
});
