"use client";

import { useState } from "react";
import { Settings, ExternalLink } from "lucide-react";

type Status = "draft" | "scheduled" | "published";

const STATUS_CYCLE: Record<Status, Status> = {
  draft: "scheduled",
  scheduled: "published",
  published: "draft",
};

const STATUS_STYLES: Record<Status, string> = {
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-[#ffecd1] text-[#78290f]",
  published: "bg-green-100 text-green-700",
};

const TIMES = [
  "08:00","09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00","17:00",
];

interface MetadataBarProps {
  status: Status;
  scheduledDate: string;
  scheduledTime: string;
  tags: string[];
  seoDescription: string;
  onStatusChange: (status: Status) => void;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onTagsChange: (tags: string[]) => void;
  onSeoDescriptionChange: (desc: string) => void;
  onPublish: () => void;
  publishing: boolean;
  githubPrUrl: string;
  title: string;
  hasContent: boolean;
}

export function MetadataBar({
  status,
  scheduledDate,
  scheduledTime,
  tags,
  seoDescription,
  onStatusChange,
  onDateChange,
  onTimeChange,
  onTagsChange,
  onSeoDescriptionChange,
  onPublish,
  publishing,
  githubPrUrl,
  title,
  hasContent,
}: MetadataBarProps) {
  const [expanded, setExpanded] = useState(false);

  const canPublish = Boolean(title && hasContent && !publishing);

  return (
    <div className="px-12 pb-4 shrink-0">
      {/* GitHub PR link */}
      {githubPrUrl && (
        <a
          href={githubPrUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="PR open — review and merge to publish"
          className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#ffecd1] rounded-lg text-xs text-[#78290f] hover:bg-[#ffd9b0] transition-colors w-fit"
        >
          <ExternalLink size={12} />
          PR open — review and merge to publish
        </a>
      )}

      {/* Primary row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status badge */}
        <button
          type="button"
          onClick={() => onStatusChange(STATUS_CYCLE[status])}
          aria-label="Change status"
          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors hover:opacity-80 ${STATUS_STYLES[status]}`}
        >
          {status}
        </button>

        {/* Date */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="meta-date" className="text-xs text-gray-400 sr-only">
            Publish date
          </label>
          <input
            id="meta-date"
            type="date"
            value={scheduledDate}
            onChange={(e) => onDateChange(e.target.value)}
            aria-label="Publish date"
            className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#ff7d00]"
          />
        </div>

        {/* Time */}
        <select
          value={scheduledTime}
          onChange={(e) => onTimeChange(e.target.value)}
          aria-label="Publish time"
          className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#ff7d00]"
        >
          {TIMES.map((t) => (
            <option key={t} value={t}>
              {new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </option>
          ))}
        </select>

        {/* Settings gear */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-label="Settings"
          aria-expanded={expanded}
          className={`p-1 rounded-md transition-colors ${
            expanded
              ? "text-[#ff7d00] bg-[#ffecd1]"
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Settings size={14} />
        </button>

        {/* Publish button — right-aligned */}
        <div className="ml-auto">
          <button
            type="button"
            onClick={onPublish}
            disabled={!canPublish}
            aria-label="Publish"
            className="px-4 py-1.5 bg-[#ff7d00] text-white rounded-xl text-xs font-semibold hover:bg-[#e67200] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {publishing ? "Creating PR…" : "Publish"}
          </button>
        </div>
      </div>

      {/* Expanded settings row */}
      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="meta-tags" className="block text-xs font-medium text-gray-500 mb-1">
              Tags
            </label>
            <input
              id="meta-tags"
              type="text"
              value={tags.join(", ")}
              onChange={(e) =>
                onTagsChange(
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                )
              }
              placeholder="ai, leadership, strategy"
              aria-label="Tags"
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#ff7d00]"
            />
          </div>
          <div>
            <label htmlFor="meta-seo" className="block text-xs font-medium text-gray-500 mb-1">
              SEO Description
            </label>
            <textarea
              id="meta-seo"
              value={seoDescription}
              onChange={(e) => onSeoDescriptionChange(e.target.value)}
              placeholder="Brief description for search engines..."
              rows={2}
              aria-label="SEO description"
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#ff7d00] resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
