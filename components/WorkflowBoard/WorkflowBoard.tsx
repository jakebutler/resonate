"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Bot,
  ChevronDown,
  ChevronUp,
  Compass,
  FileText,
  Layers3,
  Lightbulb,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Sparkles,
  Wand2,
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
  formatWorkflowTitle,
  formatWorkflowTimestamp,
  getStageAgentLabel,
  type ResearchMode,
  type ResearchSource,
} from "@/lib/workflow";

type ComposerMode = "new" | "existing";
type NewIdeaDestination = "idea" | "backlog";
type StageKey = "idea" | "research" | (typeof DRAFT_STAGES)[number];

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

type IdeaBoardCard = {
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

type DraftBoardCard = {
  _id: Id<"workflowDrafts">;
  title: string;
  preview: string;
  type: "blog" | "linkedin";
  ideaTitle?: string;
  scheduledDate?: string;
  lastAgentSummary?: string;
  lastGateSummary?: string;
};

const STAGE_THEME: Record<
  StageKey,
  {
    shell: string;
    panel: string;
    chip: string;
    soft: string;
    icon: React.ReactNode;
    eyebrow: string;
  }
> = {
  idea: {
    shell: "border-[#ffe1b4] bg-[radial-gradient(circle_at_top_left,_rgba(255,236,209,0.95),_rgba(255,255,255,0.94)_58%)]",
    panel: "border-[#ffd199] bg-white/90",
    chip: "bg-[#ffecd1] text-[#8b4513]",
    soft: "bg-[#fff6ea] text-[#8b4513]",
    icon: <Lightbulb size={18} />,
    eyebrow: "Select and shape the strongest raw ideas.",
  },
  research: {
    shell: "border-[#bfe1e4] bg-[radial-gradient(circle_at_top_left,_rgba(217,240,242,0.95),_rgba(255,255,255,0.94)_58%)]",
    panel: "border-[#afd7db] bg-white/90",
    chip: "bg-[#dff2f4] text-[#135b64]",
    soft: "bg-[#eef9fa] text-[#135b64]",
    icon: <Compass size={18} />,
    eyebrow: "Gather proof, objections, and structure before drafting.",
  },
  outline: {
    shell: "border-[#ffe0b6] bg-[radial-gradient(circle_at_top_left,_rgba(255,240,219,0.95),_rgba(255,255,255,0.94)_58%)]",
    panel: "border-[#ffd4a0] bg-white/90",
    chip: "bg-[#fff1de] text-[#9b5b00]",
    soft: "bg-[#fff8ef] text-[#9b5b00]",
    icon: <PenLine size={18} />,
    eyebrow: "Turn research into a real post instance.",
  },
  copyedit: {
    shell: "border-[#edd1c8] bg-[radial-gradient(circle_at_top_left,_rgba(248,236,231,0.96),_rgba(255,255,255,0.94)_58%)]",
    panel: "border-[#e3c2b7] bg-white/90",
    chip: "bg-[#f8e8e1] text-[#7e3f2f]",
    soft: "bg-[#fdf3ef] text-[#7e3f2f]",
    icon: <Wand2 size={18} />,
    eyebrow: "Improve flow, clarity, and factual hygiene.",
  },
  seo: {
    shell: "border-[#cfe5d5] bg-[radial-gradient(circle_at_top_left,_rgba(230,243,234,0.96),_rgba(255,255,255,0.94)_58%)]",
    panel: "border-[#bdd9c6] bg-white/90",
    chip: "bg-[#e8f5ec] text-[#226141]",
    soft: "bg-[#f2fbf5] text-[#226141]",
    icon: <Search size={18} />,
    eyebrow: "Sharpen hooks, structure, and discoverability.",
  },
  final: {
    shell: "border-[#d7ddf0] bg-[radial-gradient(circle_at_top_left,_rgba(233,237,247,0.96),_rgba(255,255,255,0.94)_58%)]",
    panel: "border-[#c5cfeb] bg-white/90",
    chip: "bg-[#edf1fb] text-[#304d8c]",
    soft: "bg-[#f5f7fd] text-[#304d8c]",
    icon: <Sparkles size={18} />,
    eyebrow: "Polish the last editorial details before release.",
  },
  published: {
    shell: "border-[#dadada] bg-[radial-gradient(circle_at_top_left,_rgba(236,236,236,0.96),_rgba(255,255,255,0.94)_58%)]",
    panel: "border-[#cccccc] bg-white/90",
    chip: "bg-[#efefef] text-[#434343]",
    soft: "bg-[#f7f7f7] text-[#434343]",
    icon: <BadgeCheck size={18} />,
    eyebrow: "Recent wins stay visible for one week, then clear away.",
  },
};

function getPreviewLimit(stage: StageKey) {
  if (stage === "idea") return 4;
  if (stage === "published") return 2;
  return 3;
}

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
  const [expandedStages, setExpandedStages] = useState<Partial<Record<StageKey, boolean>>>({});

  const allStages = useMemo(() => {
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

  const toggleStageExpansion = (stage: StageKey) => {
    setExpandedStages((current) => ({
      ...current,
      [stage]: !current[stage],
    }));
  };

  return (
    <>
      <section className="space-y-6">
        <div className="overflow-hidden rounded-[32px] border border-[#15384a] bg-[linear-gradient(135deg,#061b29_0%,#0b3147_46%,#15616d_100%)] text-white shadow-[0_30px_90px_rgba(0,21,36,0.18)]">
          <div className="relative px-4 py-4 md:px-5 md:py-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,236,209,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_36%)]" />

            <div className="relative">
              <p className="text-[11px] uppercase tracking-[0.34em] text-white/58">
                Editorial Runway
              </p>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setComposerMode("existing");
                    setComposerOpen(true);
                  }}
                  className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,250,0.94))] p-5 text-left text-[#001524] shadow-[0_24px_60px_rgba(0,0,0,0.14)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_32px_70px_rgba(0,0,0,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffecd1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b3045]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(21,97,109,0.12),transparent_34%)]" />
                  <div className="relative flex h-full items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dff2f4] text-[#15616d] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                        <Layers3 size={18} />
                      </span>
                      <p className="mt-5 text-[11px] uppercase tracking-[0.28em] text-[#15616d]">
                        From backlog
                      </p>
                      <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-[-0.03em]">
                        Use Inspiration
                      </p>
                      <p className="mt-3 max-w-md text-sm leading-6 text-[#436170]">
                        Pull a saved spark into the active board and give it a real
                        next step.
                      </p>
                    </div>
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d6e7eb] bg-white/80 text-[#15616d] transition-transform duration-200 group-hover:translate-x-1">
                      <ArrowRight size={17} />
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setComposerMode("new");
                    setComposerOpen(true);
                  }}
                  className="group relative overflow-hidden rounded-[28px] border border-[#ff9d33] bg-[linear-gradient(135deg,#ff7d00_0%,#ff9629_100%)] p-5 text-left text-white shadow-[0_26px_60px_rgba(255,125,0,0.26)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_34px_72px_rgba(255,125,0,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b3045]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
                  <div className="relative flex h-full items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/18 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur">
                        <Plus size={18} />
                      </span>
                      <p className="mt-5 text-[11px] uppercase tracking-[0.28em] text-white/70">
                        Fresh card
                      </p>
                      <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-[-0.03em]">
                        Add Idea Card
                      </p>
                      <p className="mt-3 max-w-md text-sm leading-6 text-white/82">
                        Capture a new angle now and drop it straight into the
                        workflow without breaking your pace.
                      </p>
                    </div>
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/22 bg-white/14 text-white transition-transform duration-200 group-hover:translate-x-1">
                      <ArrowRight size={17} />
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f2ea_100%)] px-4 py-5 shadow-[0_18px_60px_rgba(0,21,36,0.06)] md:px-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-400">
                Stage Flow
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Each row previews the current stage. Overflow stays collapsed until
                you ask for it.
              </p>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-[#001524] px-3 py-1.5 text-xs text-white md:flex">
              <ArrowDown size={12} />
              Top to bottom progression
            </div>
          </div>

          <div className="relative">
            <div className="absolute bottom-0 left-[27px] top-0 hidden w-px bg-[linear-gradient(180deg,rgba(0,21,36,0.04),rgba(0,21,36,0.18),rgba(0,21,36,0.04))] md:block" />

            <div className="space-y-5">
              {board === undefined
                ? (["idea", "research", ...DRAFT_STAGES] as StageKey[]).map((stage) => (
                    <div
                      key={stage}
                      className="h-48 animate-pulse rounded-[30px] border border-gray-200 bg-white/80"
                    />
                  ))
                : allStages.map((section, index) => {
                    const stage = section.stage;
                    const previewLimit = getPreviewLimit(stage);
                    const isExpanded = expandedStages[stage] ?? false;
                    const visibleCards = isExpanded
                      ? section.cards
                      : section.cards.slice(0, previewLimit);
                    const hiddenCount = Math.max(section.cards.length - previewLimit, 0);
                    const visibleIdeaCards = visibleCards as IdeaBoardCard[];
                    const visibleDraftCards = visibleCards as DraftBoardCard[];

                    return (
                      <StageSection
                        key={stage}
                        stage={stage}
                        count={section.cards.length}
                        hiddenCount={hiddenCount}
                        expanded={isExpanded}
                        index={index}
                        onToggleOverflow={
                          hiddenCount > 0 ? () => toggleStageExpansion(stage) : undefined
                        }
                      >
                        {section.cards.length === 0 ? (
                          <EmptyStage stage={stage} />
                        ) : (
                          <div className="grid gap-4 xl:grid-cols-2">
                            {stage === "idea" || stage === "research"
                              ? visibleIdeaCards.map((idea) => (
                                  <IdeaCard
                                    key={idea._id}
                                    stage={stage}
                                    idea={idea}
                                    onOpen={() => setIdeaEditorId(idea._id)}
                                    onAdvance={
                                      stage === "idea"
                                        ? () => handleAdvanceIdea(idea._id)
                                        : undefined
                                    }
                                    onSpawnBlog={
                                      stage === "research"
                                        ? () => handleSpawnDraft(idea._id, "blog")
                                        : undefined
                                    }
                                    onSpawnLinkedIn={
                                      stage === "research"
                                        ? () => handleSpawnDraft(idea._id, "linkedin")
                                        : undefined
                                    }
                                  />
                                ))
                              : visibleDraftCards.map((draft) => (
                                  <DraftCard
                                    key={draft._id}
                                    stage={stage}
                                    draft={draft}
                                    onOpen={() => setDraftEditorId(draft._id)}
                                  />
                                ))}
                          </div>
                        )}
                      </StageSection>
                    );
                  })}
            </div>
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

function StageSection({
  stage,
  count,
  hiddenCount,
  expanded,
  index,
  onToggleOverflow,
  children,
}: {
  stage: StageKey;
  count: number;
  hiddenCount: number;
  expanded: boolean;
  index: number;
  onToggleOverflow?: () => void;
  children: React.ReactNode;
}) {
  const theme = STAGE_THEME[stage];

  return (
    <section
      className={`relative overflow-hidden rounded-[30px] border px-4 py-4 shadow-[0_14px_40px_rgba(0,21,36,0.05)] md:grid md:grid-cols-[180px_minmax(0,1fr)] md:gap-6 md:px-5 ${theme.shell}`}
    >
      <div className="mb-5 md:mb-0">
        <div className="relative z-10 flex items-start gap-3 md:sticky md:top-24">
          <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/70 bg-white/95 text-[#001524] shadow-sm md:flex">
            <span className="text-xs font-semibold">{index + 1}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${theme.panel} text-[#001524] shadow-sm`}>
                {theme.icon}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${theme.chip}`}>
                {count}
              </span>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-[0.24em] text-gray-500">
              {STAGE_LABELS[stage]}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#001524]">{theme.eyebrow}</p>
          </div>
        </div>
      </div>

      <div className={`relative rounded-[26px] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] md:px-5 ${theme.panel}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-2xl">
            <p className="text-sm leading-6 text-gray-600">{STAGE_DESCRIPTIONS[stage]}</p>
          </div>

          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={onToggleOverflow}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${theme.soft}`}
            >
              <MoreHorizontal size={12} />
              {expanded ? "Show less" : `Show ${hiddenCount} more`}
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          ) : (
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${theme.soft}`}>
              <ArrowDown size={12} />
              {count === 0 ? "Ready for the next card" : "Focused preview"}
            </div>
          )}
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

function EmptyStage({ stage }: { stage: StageKey }) {
  const theme = STAGE_THEME[stage];

  return (
    <div className="rounded-[24px] border border-dashed border-gray-300/90 bg-white/70 px-4 py-7 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-2xl ${theme.soft}`}>
        {theme.icon}
      </div>
      <p className="mt-3 text-sm font-medium text-[#001524]">Nothing parked here right now.</p>
      <p className="mt-1 text-sm leading-6 text-gray-500">
        Keep this lane quiet until a card genuinely earns its way down.
      </p>
    </div>
  );
}

function IdeaCard({
  stage,
  idea,
  onOpen,
  onAdvance,
  onSpawnBlog,
  onSpawnLinkedIn,
}: {
  stage: "idea" | "research";
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
  const theme = STAGE_THEME[stage];
  const title = formatWorkflowTitle(idea.title, idea.text);
  const isCompact = stage === "idea";

  return (
    <article className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_18px_40px_rgba(0,21,36,0.08)]">
      <div className={`h-1.5 w-full ${stage === "idea" ? "bg-[#ffb351]" : "bg-[#52b4bc]"}`} />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`font-forum leading-[1.02] text-[#001524] ${isCompact ? "text-[22px]" : "text-[28px]"}`}>
              {title}
            </p>
            {!isCompact && (
              <p className="mt-2 text-sm leading-7 text-gray-600">{idea.text}</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${theme.chip}`}>
            {idea.references.length} refs
          </span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {idea.researchObjective && (
            <span className="rounded-full bg-[#edf3ff] px-2.5 py-1 text-[#395495]">
              angle set
            </span>
          )}
          {idea.draftCount > 0 && (
            <span className="rounded-full bg-[#ecf9f0] px-2.5 py-1 text-[#226141]">
              {idea.draftCount} draft{idea.draftCount === 1 ? "" : "s"}
            </span>
          )}
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
            Updated {formatWorkflowTimestamp(idea.updatedAt)}
          </span>
        </div>

        {!isCompact && idea.lastGateSummary && (
          <div className="rounded-[18px] bg-[#fff6e8] px-3 py-2 text-xs leading-5 text-[#8b4513]">
            {idea.lastGateSummary}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
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
    </article>
  );
}

function DraftCard({
  stage,
  draft,
  onOpen,
}: {
  stage: Exclude<StageKey, "idea" | "research">;
  draft: DraftBoardCard;
  onOpen: () => void;
}) {
  const theme = STAGE_THEME[stage];

  return (
    <article className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-[0_18px_40px_rgba(0,21,36,0.08)]">
      <div className={`h-1.5 w-full ${
        stage === "outline"
          ? "bg-[#ffbe64]"
          : stage === "copyedit"
          ? "bg-[#d69c84]"
          : stage === "seo"
          ? "bg-[#7bc18e]"
          : stage === "final"
          ? "bg-[#8ea5e6]"
          : "bg-[#b5b5b5]"
      }`} />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-forum text-[28px] leading-[1.02] text-[#001524]">
              {draft.title}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-gray-400">
              <span>{draft.type === "blog" ? "Blog" : "LinkedIn"}</span>
              {draft.ideaTitle && <span>From {draft.ideaTitle}</span>}
            </div>
          </div>
          {draft.scheduledDate && (
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${theme.chip}`}>
              {draft.scheduledDate}
            </span>
          )}
        </div>

        <p className="text-sm leading-7 text-gray-600">
          {draft.preview || "No content preview yet."}
        </p>

        {(draft.lastAgentSummary || draft.lastGateSummary) && (
          <div className="space-y-2">
            {draft.lastAgentSummary && (
              <div className="rounded-[18px] bg-[#eef8fb] px-3 py-2 text-xs leading-5 text-[#15616d]">
                {draft.lastAgentSummary}
              </div>
            )}
            {draft.lastGateSummary && (
              <div className="rounded-[18px] bg-[#fff6e8] px-3 py-2 text-xs leading-5 text-[#8b4513]">
                {draft.lastGateSummary}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <Button variant="ghost" size="sm" onClick={onOpen}>
            Open
          </Button>
        </div>
      </div>
    </article>
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
              <Button
                variant="primary"
                onClick={onCreate}
                disabled={creating || !newIdeaText.trim()}
              >
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
