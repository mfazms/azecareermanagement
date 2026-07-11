"use client";

import type { StorageUsage } from "@/types";
import { formatBytes } from "@/lib/storage-calc";

interface StorageBarProps {
  usage: StorageUsage;
}

const SEGMENTS = [
  { key: "applications" as const, label: "Applications", color: "#3B82F6" },
  { key: "cvFiles" as const, label: "CV Files", color: "#22C55E" },
  { key: "evaluations" as const, label: "Evaluations", color: "#F97316" },
  { key: "profileData" as const, label: "Profile", color: "#A855F7" },
];

export default function StorageBar({ usage }: StorageBarProps) {
  const usedPercent = Math.min((usage.total / usage.limit) * 100, 100);
  const freeBytes = Math.max(usage.limit - usage.total, 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-[#1D1D1F]">Storage</h3>
        <p className="text-sm text-[#86868B]">
          <span className="font-semibold text-[#1D1D1F]">{formatBytes(usage.total)}</span>
          {" "}of {formatBytes(usage.limit)} Used
          <span className="ml-1.5 text-xs font-semibold text-[#1D1D1F]">({usedPercent.toFixed(1)}%)</span>
        </p>
      </div>

      {/* iOS-style segmented bar */}
      <div className="relative w-full h-3 bg-[#E8E8ED] rounded-full overflow-hidden flex">
        {SEGMENTS.map((seg) => {
          const segPercent = (usage[seg.key] / usage.limit) * 100;
          if (segPercent < 0.05) return null;
          return (
            <div
              key={seg.key}
              className="h-full transition-all duration-700 ease-out first:rounded-l-full"
              style={{
                width: `${segPercent}%`,
                backgroundColor: seg.color,
                minWidth: segPercent > 0.1 ? "2px" : "0",
              }}
              title={`${seg.label}: ${formatBytes(usage[seg.key])}`}
            />
          );
        })}
        {/* Rounded right edge on last colored segment */}
        {usedPercent > 0 && usedPercent < 99.5 && (
          <div
            className="h-full rounded-r-full"
            style={{
              width: "0px",
              marginLeft: "-2px",
              backgroundColor: (() => {
                // Find the last non-zero segment color
                for (let i = SEGMENTS.length - 1; i >= 0; i--) {
                  if (usage[SEGMENTS[i].key] > 0) return SEGMENTS[i].color;
                }
                return "transparent";
              })(),
              minWidth: "4px",
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {SEGMENTS.map((seg) => {
          const pct = usage.total > 0 ? (usage[seg.key] / usage.total) * 100 : 0;
          return (
            <div key={seg.key} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-[#86868B]">
                {seg.label}{" "}
                <span className="font-medium text-[#1D1D1F]">
                  {formatBytes(usage[seg.key])}
                </span>
                <span className="text-[10px] ml-0.5 text-[#86868B]">({pct.toFixed(1)}%)</span>
              </span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#E8E8ED]" />
          <span className="text-xs text-[#86868B]">
            Available{" "}
            <span className="font-medium text-[#1D1D1F]">
              {formatBytes(freeBytes)}
            </span>
          </span>
        </div>
      </div>

      {/* Info note */}
      <p className="text-[10px] text-[#86868B] mt-1">
        💡 Profile includes your profile photo. CV Files are counted separately from application text data.
      </p>
    </div>
  );
}
