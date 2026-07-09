"use client";

import { useState } from "react";
import type { Evaluation } from "@/types";
import { REJECTION_STAGES, ROOT_CAUSES } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface EvaluationFormProps {
  evaluation?: Evaluation;
  onSave: (evaluation: Evaluation) => Promise<void>;
  companyName: string;
}

export default function EvaluationForm({
  evaluation,
  onSave,
  companyName,
}: EvaluationFormProps) {
  const [rejectionStage, setRejectionStage] = useState(
    evaluation?.rejectionStage || ""
  );
  const [rootCause, setRootCause] = useState(evaluation?.rootCause || "");
  const [selfNote, setSelfNote] = useState(evaluation?.selfNote || "");
  const [actionItem, setActionItem] = useState(evaluation?.actionItem || "");
  const [actionItemDone, setActionItemDone] = useState(
    evaluation?.actionItemDone || false
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!rejectionStage || !rootCause) return;
    setIsSaving(true);
    try {
      await onSave({
        rejectionStage: rejectionStage as Evaluation["rejectionStage"],
        rootCause: rootCause as Evaluation["rootCause"],
        selfNote,
        actionItem,
        actionItemDone,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
        <p className="text-sm text-red-700">
          <strong>{companyName}</strong> — Rejected. Fill in a brief evaluation to learn from this experience.
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1D1D1F]">
            Rejection Stage *
          </Label>
          <Select value={rejectionStage} onValueChange={(v) => setRejectionStage(v ?? "")}>
            <SelectTrigger className="rounded-xl border-[#E8E8ED]">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {REJECTION_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1D1D1F]">
            Root Cause *
          </Label>
          <Select value={rootCause} onValueChange={(v) => setRootCause(v ?? "")}>
            <SelectTrigger className="rounded-xl border-[#E8E8ED]">
              <SelectValue placeholder="Select root cause" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {ROOT_CAUSES.map((cause) => (
                <SelectItem key={cause} value={cause}>
                  {cause}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1D1D1F]">
          Self-note
        </Label>
        <Textarea
          placeholder="What happened? e.g., &quot;Struggled with microservices questions&quot;"
          value={selfNote}
          onChange={(e) => setSelfNote(e.target.value)}
          className="rounded-xl border-[#E8E8ED] min-h-[80px] resize-none focus:border-[#0071E3] focus:ring-blue-500/20"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#1D1D1F]">
          Action Item
        </Label>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setActionItemDone(!actionItemDone)}
            className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              actionItemDone
                ? "bg-[#0071E3] border-[#0071E3]"
                : "border-[#C7C7CC] hover:border-[#0071E3]"
            }`}
          >
            {actionItemDone && (
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            )}
          </button>
          <Textarea
            placeholder="What to do next? e.g., &quot;Practice mock interviews, focus on STAR method&quot;"
            value={actionItem}
            onChange={(e) => setActionItem(e.target.value)}
            className={`rounded-xl border-[#E8E8ED] min-h-[60px] resize-none focus:border-[#0071E3] focus:ring-blue-500/20 ${
              actionItemDone ? "line-through text-[#C7C7CC]" : ""
            }`}
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={!rejectionStage || !rootCause || isSaving}
        className="w-full rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-lg shadow-blue-500/15 cursor-pointer"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : null}
        Save Evaluation
      </Button>
    </div>
  );
}
