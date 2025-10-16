import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormPollCreator, {
  type FormPollDraft,
} from "@/components/polls/FormPollCreator";
import { getAllPolls } from "@/lib/pollStorage";

export default function FormCreator() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");

  const initialDraft = useMemo<FormPollDraft | undefined>(() => {
    if (!editId) return undefined;
    const existing = getAllPolls().find(
      (p) => p.id === editId && p.type === "form",
    );
    if (!existing) return undefined;
    return {
      id: existing.id,
      type: "form",
      title: existing.title || "",
      questions: (existing as any).questions || [],
    } as FormPollDraft;
  }, [editId]);

  const handleCancel = () => navigate(-1);
  const handleSave = (_draft: FormPollDraft) => {
    // Saved as draft via FormPollCreator; stay on page
  };
  const handleFinalize = (draft: FormPollDraft) => {
    // After finalizing, navigate to the poll page
    // Poll slug is generated in upsert within FormPollCreator; reopen via /dashboard or /poll after finalize
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-20">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <FormPollCreator
            initialDraft={initialDraft}
            onCancel={handleCancel}
            onSave={handleSave}
            onFinalize={handleFinalize}
          />
        </div>
      </div>
    </div>
  );
}
