"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Bot, CalendarDays, CheckCircle2, Clock3, FileText, Sparkles, X } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getAssistantResponse } from "@/lib/llmClient";
import {
  STAGE_LABELS,
  buildDraftStageAgentPrompt,
  formatWorkflowTimestamp,
  getNextDraftStage,
  getStageAgentLabel,
} from "@/lib/workflow";

interface WorkflowDraftEditorProps {
  open: boolean;
  draftId: Id<"workflowDrafts"> | null;
  onClose: () => void;
}

interface DraftGateState {
  stage: string;
  summary: string;
  issues: string[];
  recommendedAction: string;
}

export function WorkflowDraftEditor({
  open,
  draftId,
  onClose,
}: WorkflowDraftEditorProps) {
  const data = useQuery(api.workflow.getDraftForEditor, draftId ? { id: draftId } : "skip");
  const updateDraftContent = useMutation(api.workflow.updateDraftContent);
  const advanceDraft = useMutation(api.workflow.advanceDraft);
  const recordDraftAgentRun = useMutation(api.workflow.recordDraftAgentRun);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [stageNotes, setStageNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [runningAgent, setRunningAgent] = useState(false);
  const [gateState, setGateState] = useState<DraftGateState | null>(null);

  useEffect(() => {
    if (!data) return;
    setTitle(data.post.title || "");
    setContent(data.post.content);
    setScheduledDate(data.post.scheduledDate || "");
    setScheduledTime(data.post.scheduledTime || "");
    setStageNotes(data.draft.stageNotes || "");
  }, [data]);

  const nextStage = data ? getNextDraftStage(data.draft.stage) : null;
  const nextAgentLabel = nextStage
    ? getStageAgentLabel(nextStage, data?.draft.type)
    : null;

  const persistDraft = async () => {
    if (!draftId) return;
    await updateDraftContent({
      id: draftId,
      title: title.trim() || undefined,
      content,
      scheduledDate: scheduledDate || undefined,
      scheduledTime: scheduledTime || undefined,
      stageNotes: stageNotes.trim() || undefined,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persistDraft();
    } finally {
      setSaving(false);
    }
  };

  const handleAdvance = async (force = false) => {
    if (!draftId) return;
    setAdvancing(true);
    try {
      await persistDraft();
      const result = await advanceDraft({ id: draftId, force });
      if (result?.blocked && result.gate) {
        setGateState(result.gate);
      } else {
        setGateState(null);
      }
    } finally {
      setAdvancing(false);
    }
  };

  const handleRunAgent = async () => {
    if (!draftId || !data || !nextStage) return;
    setRunningAgent(true);
    try {
      await persistDraft();
      const generated = await getAssistantResponse({
        assistantType: data.draft.type,
        messages: [
          {
            role: "user",
            content: buildDraftStageAgentPrompt({
              type: data.draft.type,
              targetStage: nextStage,
              title: title.trim() || undefined,
              content,
              scheduledDate: scheduledDate || undefined,
              ideaTitle: data.idea.title,
              ideaText: data.idea.text,
              researchObjective: data.idea.researchObjective,
              researchNotes: data.idea.researchNotes,
              references: data.idea.references,
            }),
          },
        ],
      });

      await recordDraftAgentRun({
        id: draftId,
        stage: nextStage,
        title: title.trim() || undefined,
        content: generated,
        summary: `${getStageAgentLabel(nextStage, data.draft.type)} produced a fresh ${STAGE_LABELS[nextStage].toLowerCase()} pass.`,
      });

      setContent(generated);
      setGateState(null);
    } finally {
      setRunningAgent(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="absolute inset-2 overflow-hidden rounded-[28px] border border-white/40 bg-[#f7f4ee] shadow-2xl md:inset-4">
          <div className="flex h-full flex-col">
            <header className="border-b border-black/5 bg-[linear-gradient(135deg,#001524_0%,#18485a_100%)] px-5 py-4 text-white md:px-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    {data?.draft.type === "blog" ? <FileText size={18} /> : <Sparkles size={18} />}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                      Full-Screen Workflow Editor
                    </p>
                    <h2 className="font-forum text-2xl">
                      {data
                        ? `${STAGE_LABELS[data.draft.stage]}`
                        : "Loading draft…"}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" onClick={onClose}>
                    <X size={14} />
                    Close
                  </Button>
                  {nextStage && (
                    <Button
                      variant="secondary"
                      onClick={handleRunAgent}
                      disabled={runningAgent || advancing}
                    >
                      <Bot size={14} />
                      {runningAgent ? "Running…" : nextAgentLabel}
                    </Button>
                  )}
                  <Button variant="secondary" onClick={handleSave} disabled={saving || advancing}>
                    <CheckCircle2 size={14} />
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  {nextStage && (
                    <Button
                      variant="primary"
                      onClick={() => handleAdvance(false)}
                      disabled={advancing || runningAgent}
                    >
                      <ArrowRight size={14} />
                      {advancing ? "Checking…" : `Advance to ${STAGE_LABELS[nextStage]}`}
                    </Button>
                  )}
                </div>
              </div>
            </header>

            {data === undefined ? (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
                Loading draft…
              </div>
            ) : !data ? (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
                Draft not found.
              </div>
            ) : (
              <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]">
                <section className="overflow-y-auto bg-white px-5 py-5 md:px-7">
                  <div className="mx-auto max-w-4xl space-y-5">
                    {data.draft.type === "blog" && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Working Title
                        </label>
                        <input
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-lg text-[#001524] shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                          placeholder="Untitled blog draft"
                        />
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Publish Date
                        </label>
                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={(event) => setScheduledDate(event.target.value)}
                            className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Publish Time
                        </label>
                        <div className="relative">
                          <Clock3 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={(event) => setScheduledTime(event.target.value)}
                            className="w-full rounded-2xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Draft Body
                      </label>
                      <textarea
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        rows={24}
                        className="min-h-[58dvh] w-full rounded-[24px] border border-gray-200 px-4 py-4 font-mono text-sm leading-7 text-[#001524] shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                        placeholder="Draft content goes here"
                      />
                    </div>
                  </div>
                </section>

                <aside className="overflow-y-auto border-t border-black/5 bg-[#f4efe4] px-5 py-5 lg:border-l lg:border-t-0">
                  <div className="space-y-4">
                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Source Idea
                      </p>
                      <h3 className="mt-2 font-forum text-xl text-[#001524]">
                        {data.idea.title || "Untitled idea"}
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {data.idea.text}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Research Context
                      </p>
                      <div className="mt-3 space-y-3 text-sm text-gray-700">
                        <div>
                          <p className="font-medium text-[#001524]">Objective</p>
                          <p>{data.idea.researchObjective || "No objective captured yet."}</p>
                        </div>
                        <div>
                          <p className="font-medium text-[#001524]">Notes</p>
                          <p className="whitespace-pre-wrap">
                            {data.idea.researchNotes || "No research notes captured yet."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        References
                      </p>
                      <div className="mt-3 space-y-2">
                        {data.idea.references.length === 0 ? (
                          <p className="text-sm text-gray-500">No references attached yet.</p>
                        ) : (
                          data.idea.references.map((reference) => (
                            <a
                              key={reference.url}
                              href={reference.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-[#15616d] transition-colors hover:border-[#15616d]/30 hover:bg-[#15616d]/5"
                            >
                              {reference.title || reference.url}
                            </a>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Editor Notes
                      </p>
                      <textarea
                        value={stageNotes}
                        onChange={(event) => setStageNotes(event.target.value)}
                        rows={7}
                        className="mt-3 w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm leading-6 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                        placeholder="Capture reviewer notes, blockers, or reminders for this stage."
                      />
                    </div>

                    <div className="rounded-3xl bg-white p-4 shadow-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        Workflow Signals
                      </p>
                      <div className="mt-3 space-y-3 text-sm text-gray-700">
                        <div>
                          <p className="font-medium text-[#001524]">Last agent run</p>
                          <p>{data.draft.lastAgentSummary || "No stage agent has been run yet."}</p>
                          {data.draft.lastAgentRunAt && (
                            <p className="mt-1 text-xs text-gray-500">
                              {formatWorkflowTimestamp(data.draft.lastAgentRunAt)}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="font-medium text-[#001524]">Last gate check</p>
                          <p>{data.draft.lastGateSummary || "No gate check recorded yet."}</p>
                          {data.draft.lastGateIssues.length > 0 && (
                            <ul className="mt-2 space-y-1 text-xs text-[#78290f]">
                              {data.draft.lastGateIssues.map((issue) => (
                                <li key={issue}>• {issue}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={Boolean(gateState)}
        onClose={() => setGateState(null)}
        title={gateState ? `${gateState.recommendedAction} Recommended` : "Gate Check"}
      >
        {gateState && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-[#78290f]">{gateState.summary}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-[#001524]">What still looks weak</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                {gateState.issues.map((issue) => (
                  <li key={issue}>• {issue}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setGateState(null)}>
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleRunAgent}
                disabled={runningAgent}
              >
                <Bot size={14} />
                {runningAgent ? "Running…" : gateState.recommendedAction}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleAdvance(true)}
                disabled={advancing}
              >
                <ArrowRight size={14} />
                Move Anyway
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
