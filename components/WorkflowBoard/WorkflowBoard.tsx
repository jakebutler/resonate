"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  BookOpen,
  Bot,
  FileText,
  Layers3,
  Lightbulb,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { WorkflowDraftEditor } from "@/components/WorkflowBoard/WorkflowDraftEditor";
import { WorkflowIdeaModal } from "@/components/WorkflowBoard/WorkflowIdeaModal";
import { getAssistantResponse } from "@/lib/llmClient";
import {
  DRAFT_STAGES,
  STAGE_DESCRIPTIONS,
  STAGE_LABELS,
  buildOutlineAgentPrompt,
  buildResearchAgentPrompt,
  formatWorkflowTimestamp,
  getStageAgentLabel,
  type ResearchMode,
  type ResearchSource,
} from "@/lib/workflow";

type ComposerMode = "new" | "existing";
type NewIdeaDestination = "idea" | "backlog";

type GateState =
  | {
      kind: "idea";
      ideaId: Id<"ideas">;
      gate: {
        summary: string;
        issues: string[];
        recommendedAction: string;
      };
    }
  | {
      kind: "spawn";
      ideaId: Id<"ideas">;
      postType: "blog" | "linkedin";
      gate: {
        summary: string;
        issues: string[];
        recommendedAction: string;
      };
    };

type IdeaLookupCard = {
  _id: Id<"ideas">;
  title?: string;
  text: string;
  references: Array<{
    url: string;
    title?: string;
    kind?: string;
    addedBy: "user" | "extractor" | "agent";
  }>;
  researchObjective?: string;
  researchNotes?: string;
  researchModes: ResearchMode[];
  researchSources: ResearchSource[];
  updatedAt: number;
  draftCount: number;
};

const COLUMN_TONES = {
  idea: "from-[#ffecd1] to-white",
  research: "from-[#d9f0f2] to-white",
  outline: "from-[#fff0db] to-white",
  copyedit: "from-[#f8ece7] to-white",
  seo: "from-[#e6f3ea] to-white",
  final: "from-[#e9edf7] to-white",
  published: "from-[#ececec] to-white",
} as const;

export function WorkflowBoard() {
  const board = useQuery(api.workflow.getBoard);
  const createIdea = useMutation(api.workflow.createIdea);
  const moveIdeaToStatus = useMutation(api.workflow.moveIdeaToStatus);
  const advanceIdeaStage = useMutation(api.workflow.advanceIdeaStage);
  const createDraftFromIdea = useMutation(api.workflow.createDraftFromIdea);
  const recordIdeaResearchRun = useMutation(api.workflow.recordIdeaResearchRun);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>("new");
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [newIdeaText, setNewIdeaText] = useState("");
  const [newIdeaDestination, setNewIdeaDestination] =
    useState<NewIdeaDestination>("idea");
  const [ideaEditorId, setIdeaEditorId] = useState<Id<"ideas"> | null>(null);
  const [draftEditorId, setDraftEditorId] = useState<Id<"workflowDrafts"> | null>(null);
  const [gateState, setGateState] = useState<GateState | null>(null);
  const [creating, setCreating] = useState(false);
  const [runningAgent, setRunningAgent] = useState(false);

  const allColumns = useMemo(() => {
    if (!board) return [];
    return [
      { stage: "idea" as const, cards: board.ideaCards },
      { stage: "research" as const, cards: board.researchCards },
      ...board.draftColumns,
    ];
  }, [board]);

  const ideaLookup = useMemo(() => {
    const lookup = new Map<Id<"ideas">, IdeaLookupCard>();
    for (const idea of board?.ideaCards || []) lookup.set(idea._id, idea);
    for (const idea of board?.researchCards || []) lookup.set(idea._id, idea);
    return lookup;
  }, [board]);

  const handleCreateIdea = async () => {
    if (!newIdeaText.trim()) return;
    setCreating(true);
    try {
      await createIdea({
        title: newIdeaTitle.trim() || undefined,
        text: newIdeaText,
        status: newIdeaDestination,
      });
      setNewIdeaTitle("");
      setNewIdeaText("");
      setNewIdeaDestination("idea");
      setComposerOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handlePromoteInspiration = async (ideaId: Id<"ideas">) => {
    await moveIdeaToStatus({ id: ideaId, status: "idea" });
    setComposerOpen(false);
  };

  const handleAdvanceIdea = async (ideaId: Id<"ideas">) => {
    const result = await advanceIdeaStage({ id: ideaId });
    if (result?.blocked && result.gate) {
      setGateState({ kind: "idea", ideaId, gate: result.gate });
    }
  };

  const handleSpawnDraft = async (
    ideaId: Id<"ideas">,
    postType: "blog" | "linkedin"
  ) => {
    const result = await createDraftFromIdea({ ideaId, type: postType });
    if (result?.blocked && result.gate) {
      setGateState({ kind: "spawn", ideaId, postType, gate: result.gate });
      return;
    }

    if (result?.draftId) {
      setDraftEditorId(result.draftId);
    }
  };

  const handleRunGateAgent = async () => {
    if (!gateState) return;
    const idea = ideaLookup.get(gateState.ideaId);
    if (!idea) return;

    setRunningAgent(true);
    try {
      if (gateState.kind === "idea") {
        const researchNotes = await getAssistantResponse({
          assistantType: "blog",
          messages: [
            {
              role: "user",
              content: buildResearchAgentPrompt({
                title: idea.title,
                text: idea.text,
                researchObjective: idea.researchObjective,
                researchNotes: idea.researchNotes,
                references: idea.references,
              }),
            },
          ],
        });

        await recordIdeaResearchRun({
          id: gateState.ideaId,
          researchObjective: idea.researchObjective,
          researchModes: idea.researchModes,
          researchSources: idea.researchSources,
          researchNotes,
        });
      }

      if (gateState.kind === "spawn") {
        const result = await createDraftFromIdea({
          ideaId: gateState.ideaId,
          type: gateState.postType,
          force: true,
          seedContent: await getAssistantResponse({
            assistantType: gateState.postType,
            messages: [
              {
                role: "user",
                content: buildOutlineAgentPrompt({
                  type: gateState.postType,
                  title: idea.title,
                  text: idea.text,
                  researchObjective: idea.researchObjective,
                  researchNotes: idea.researchNotes,
                  references: idea.references,
                }),
              },
            ],
          }),
          agentSummary: `${getStageAgentLabel("outline", gateState.postType)} created the initial draft.`,
        });

        if (result?.draftId) {
          setDraftEditorId(result.draftId);
        }
      }

      setGateState(null);
    } finally {
      setRunningAgent(false);
    }
  };

  const handleForceAdvance = async () => {
    if (!gateState) return;
    if (gateState.kind === "idea") {
      await advanceIdeaStage({ id: gateState.ideaId, force: true });
    } else {
      const result = await createDraftFromIdea({
        ideaId: gateState.ideaId,
        type: gateState.postType,
        force: true,
      });
      if (result?.draftId) {
        setDraftEditorId(result.draftId);
      }
    }
    setGateState(null);
  };

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[28px] bg-[linear-gradient(135deg,#001524_0%,#124559_100%)] px-6 py-6 text-white shadow-[0_24px_80px_rgba(0,21,36,0.18)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                Post Workflow
              </p>
              <h1 className="mt-2 font-forum text-4xl leading-none">
                Selected ideas become research-backed draft instances.
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/75">
                The board keeps the original idea primitive intact, lets one idea spawn
                multiple posts, and checks readiness before each rightward move.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => {
                setComposerMode("existing");
                setComposerOpen(true);
              }}>
                <Layers3 size={14} />
                Use Inspiration
              </Button>
              <Button variant="primary" onClick={() => {
                setComposerMode("new");
                setComposerOpen(true);
              }}>
                <Plus size={14} />
                Add Idea Card
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <MetricCard
              icon={<Lightbulb size={16} />}
              label="Selected Ideas"
              value={String(board?.ideaCards.length ?? 0)}
            />
            <MetricCard
              icon={<Search size={16} />}
              label="Research Cards"
              value={String(board?.researchCards.length ?? 0)}
            />
            <MetricCard
              icon={<BookOpen size={16} />}
              label="Inspiration Backlog"
              value={String(board?.availableIdeas.length ?? 0)}
            />
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid min-w-[1280px] grid-cols-7 gap-4">
            {board === undefined
              ? ["idea", "research", ...DRAFT_STAGES].map((stage) => (
                  <div
                    key={stage}
                    className="min-h-[320px] animate-pulse rounded-[26px] border border-gray-100 bg-white"
                  />
                ))
              : allColumns.map((column) => (
                  <BoardColumn
                    key={column.stage}
                    stage={column.stage}
                    cardCount={column.cards.length}
                  >
                    {column.stage === "idea" || column.stage === "research"
                      ? column.cards.map((idea) => (
                          <IdeaCard
                            key={idea._id}
                            idea={idea}
                            onOpen={() => setIdeaEditorId(idea._id)}
                            onAdvance={
                              column.stage === "idea"
                                ? () => handleAdvanceIdea(idea._id)
                                : undefined
                            }
                            onSpawnBlog={
                              column.stage === "research"
                                ? () => handleSpawnDraft(idea._id, "blog")
                                : undefined
                            }
                            onSpawnLinkedIn={
                              column.stage === "research"
                                ? () => handleSpawnDraft(idea._id, "linkedin")
                                : undefined
                            }
                          />
                        ))
                      : column.cards.map((draft) => (
                          <DraftCard
                            key={draft._id}
                            draft={draft}
                            onOpen={() => setDraftEditorId(draft._id)}
                          />
                        ))}
                  </BoardColumn>
                ))}
          </div>
        </div>
      </section>

      <WorkflowIdeaComposerModal
        open={composerOpen}
        mode={composerMode}
        newIdeaDestination={newIdeaDestination}
        newIdeaText={newIdeaText}
        newIdeaTitle={newIdeaTitle}
        availableIdeas={board?.availableIdeas || []}
        creating={creating}
        onClose={() => setComposerOpen(false)}
        onCreate={handleCreateIdea}
        onDestinationChange={setNewIdeaDestination}
        onModeChange={setComposerMode}
        onNewIdeaTextChange={setNewIdeaText}
        onNewIdeaTitleChange={setNewIdeaTitle}
        onPromoteIdea={handlePromoteInspiration}
      />

      <WorkflowIdeaModal
        open={Boolean(ideaEditorId)}
        ideaId={ideaEditorId}
        onClose={() => setIdeaEditorId(null)}
      />

      <WorkflowDraftEditor
        open={Boolean(draftEditorId)}
        draftId={draftEditorId}
        onClose={() => setDraftEditorId(null)}
      />

      <Modal
        open={Boolean(gateState)}
        onClose={() => setGateState(null)}
        title={gateState ? `${gateState.gate.recommendedAction} Recommended` : "Gate Check"}
      >
        {gateState && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-[#78290f]">{gateState.gate.summary}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-[#001524]">What still looks weak</p>
              <ul className="mt-2 space-y-2 text-sm text-gray-600">
                {gateState.gate.issues.map((issue) => (
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
                onClick={handleRunGateAgent}
                disabled={runningAgent}
              >
                <Bot size={14} />
                {runningAgent ? "Running…" : gateState.gate.recommendedAction}
              </Button>
              <Button variant="primary" onClick={handleForceAdvance}>
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

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-2 text-white/60">{icon}<span className="text-xs uppercase tracking-[0.18em]">{label}</span></div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function BoardColumn({
  stage,
  cardCount,
  children,
}: {
  stage: "idea" | "research" | (typeof DRAFT_STAGES)[number];
  cardCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[26px] border border-gray-100 bg-[linear-gradient(180deg,var(--tw-gradient-stops))] ${COLUMN_TONES[stage]} p-3 shadow-[0_20px_50px_rgba(0,21,36,0.06)]`}>
      <div className="rounded-[22px] bg-white/85 p-3 shadow-sm backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400">
              {STAGE_LABELS[stage]}
            </p>
            <p className="mt-1 text-sm leading-5 text-gray-600">
              {STAGE_DESCRIPTIONS[stage]}
            </p>
          </div>
          <span className="rounded-full bg-[#001524] px-2.5 py-1 text-xs font-medium text-white">
            {cardCount}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {cardCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
              Nothing here yet.
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

function IdeaCard({
  idea,
  onOpen,
  onAdvance,
  onSpawnBlog,
  onSpawnLinkedIn,
}: {
  idea: {
    _id: Id<"ideas">;
    title?: string;
    text: string;
    references: Array<{ url: string; title?: string }>;
    draftCount: number;
    lastResearchRunAt?: number;
    lastGateSummary?: string;
    researchObjective?: string;
    updatedAt: number;
  };
  onOpen: () => void;
  onAdvance?: () => void;
  onSpawnBlog?: () => void;
  onSpawnLinkedIn?: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-white bg-white p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <button type="button" onClick={onOpen} className="block w-full text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-forum text-xl text-[#001524]">
            {idea.title || "Untitled idea"}
          </p>
          <p className="mt-2 line-clamp-4 text-sm leading-6 text-gray-600">
            {idea.text}
          </p>
        </div>
        <div className="rounded-full bg-[#ffecd1] px-2 py-1 text-xs text-[#78290f]">
          {idea.references.length} refs
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {idea.researchObjective && (
          <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-xs text-[#3949ab]">
            angle set
          </span>
        )}
        {idea.draftCount > 0 && (
          <span className="rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs text-[#15616d]">
            {idea.draftCount} draft{idea.draftCount === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-500">
        <span>Updated {formatWorkflowTimestamp(idea.updatedAt)}</span>
        {idea.lastResearchRunAt && <span>Research run {formatWorkflowTimestamp(idea.lastResearchRunAt)}</span>}
      </div>

      {idea.lastGateSummary && (
        <div className="mt-4 rounded-2xl bg-[#fff7e8] px-3 py-2 text-xs text-[#78290f]">
          {idea.lastGateSummary}
        </div>
      )}
      </button>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={onOpen}>
          Open
        </Button>
        {onAdvance && (
          <Button variant="primary" size="sm" onClick={onAdvance}>
            <ArrowRight size={14} />
            Move to Research
          </Button>
        )}
        {onSpawnBlog && (
          <Button variant="secondary" size="sm" onClick={onSpawnBlog}>
            <FileText size={14} />
            Blog Draft
          </Button>
        )}
        {onSpawnLinkedIn && (
          <Button variant="secondary" size="sm" onClick={onSpawnLinkedIn}>
            <Sparkles size={14} />
            LinkedIn Draft
          </Button>
        )}
      </div>
    </div>
  );
}

function DraftCard({
  draft,
  onOpen,
}: {
  draft: {
    _id: Id<"workflowDrafts">;
    title: string;
    preview: string;
    type: "blog" | "linkedin";
    ideaTitle?: string;
    scheduledDate?: string;
    lastAgentSummary?: string;
    lastGateSummary?: string;
  };
  onOpen: () => void;
}) {
  return (
    <div className="rounded-[22px] border border-white bg-white p-4 text-left shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <button type="button" onClick={onOpen} className="block w-full text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-forum text-xl text-[#001524]">{draft.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-400">
            {draft.type === "blog" ? "Blog" : "LinkedIn"}
          </p>
        </div>
        {draft.scheduledDate && (
          <span className="rounded-full bg-[#eef7f7] px-2 py-1 text-xs text-[#15616d]">
            {draft.scheduledDate}
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-5 text-sm leading-6 text-gray-600">
        {draft.preview || "No content preview yet."}
      </p>

      {draft.ideaTitle && (
        <p className="mt-3 text-xs text-gray-500">
          From: {draft.ideaTitle}
        </p>
      )}

      {(draft.lastAgentSummary || draft.lastGateSummary) && (
        <div className="mt-4 space-y-2">
          {draft.lastAgentSummary && (
            <div className="rounded-2xl bg-[#f1f9fb] px-3 py-2 text-xs text-[#15616d]">
              {draft.lastAgentSummary}
            </div>
          )}
          {draft.lastGateSummary && (
            <div className="rounded-2xl bg-[#fff7e8] px-3 py-2 text-xs text-[#78290f]">
              {draft.lastGateSummary}
            </div>
          )}
        </div>
      )}
      </button>

      <div className="mt-4">
        <Button variant="ghost" size="sm" onClick={onOpen}>
          Open
        </Button>
      </div>
    </div>
  );
}

function WorkflowIdeaComposerModal({
  open,
  mode,
  newIdeaDestination,
  newIdeaText,
  newIdeaTitle,
  availableIdeas,
  creating,
  onClose,
  onCreate,
  onDestinationChange,
  onModeChange,
  onNewIdeaTextChange,
  onNewIdeaTitleChange,
  onPromoteIdea,
}: {
  open: boolean;
  mode: ComposerMode;
  newIdeaDestination: NewIdeaDestination;
  newIdeaText: string;
  newIdeaTitle: string;
  availableIdeas: Array<{
    _id: Id<"ideas">;
    title?: string;
    text: string;
    updatedAt: number;
    referencesCount: number;
  }>;
  creating: boolean;
  onClose: () => void;
  onCreate: () => void;
  onDestinationChange: (value: NewIdeaDestination) => void;
  onModeChange: (value: ComposerMode) => void;
  onNewIdeaTextChange: (value: string) => void;
  onNewIdeaTitleChange: (value: string) => void;
  onPromoteIdea: (ideaId: Id<"ideas">) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Add to Workflow">
      <div className="space-y-5">
        <div className="inline-flex rounded-2xl border border-gray-200 p-1">
          {(["new", "existing"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onModeChange(value)}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                mode === value
                  ? "bg-[#001524] text-white"
                  : "text-gray-600 hover:text-[#001524]"
              }`}
            >
              {value === "new" ? "New idea" : "Existing inspiration"}
            </button>
          ))}
        </div>

        {mode === "new" ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="workflow-new-title"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Working Title
              </label>
              <input
                id="workflow-new-title"
                value={newIdeaTitle}
                onChange={(event) => onNewIdeaTitleChange(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                placeholder="Optional"
              />
            </div>

            <div>
              <label
                htmlFor="workflow-new-idea"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Idea
              </label>
              <textarea
                id="workflow-new-idea"
                value={newIdeaText}
                onChange={(event) => onNewIdeaTextChange(event.target.value)}
                rows={7}
                className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm leading-6 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                placeholder="Capture the thought that should become a workflow card."
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                Where should this go first?
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onDestinationChange("idea")}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    newIdeaDestination === "idea"
                      ? "border-[#001524] bg-[#001524] text-white"
                      : "border-gray-200 bg-white text-[#001524]"
                  }`}
                >
                  <p className="font-medium">Add to Idea column</p>
                  <p className="mt-1 text-sm opacity-80">
                    This enters the active pipeline immediately.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDestinationChange("backlog")}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    newIdeaDestination === "backlog"
                      ? "border-[#15616d] bg-[#15616d] text-white"
                      : "border-gray-200 bg-white text-[#001524]"
                  }`}
                >
                  <p className="font-medium">Save as inspiration</p>
                  <p className="mt-1 text-sm opacity-80">
                    Keep it out of column one until it is selected later.
                  </p>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={onCreate} disabled={creating || !newIdeaText.trim()}>
                <Plus size={14} />
                {creating ? "Saving…" : "Create Idea"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {availableIdeas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                No inspiration items are waiting. Save a new idea to inspiration first.
              </div>
            ) : (
              availableIdeas.map((idea) => (
                <div
                  key={idea._id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#001524]">
                        {idea.title || "Untitled inspiration"}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                        {idea.text}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onPromoteIdea(idea._id)}
                    >
                      <ArrowRight size={14} />
                      Select
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>{idea.referencesCount} refs</span>
                    <span>Updated {formatWorkflowTimestamp(idea.updatedAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
