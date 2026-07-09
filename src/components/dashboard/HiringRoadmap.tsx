"use client";

import type { Application } from "@/types";
import {
  FileText, ClipboardCheck, Users, UserCheck,
  UsersRound, Presentation, Crown, HeartPulse, PartyPopper,
} from "lucide-react";

interface RoadmapProps {
  applications: Application[];
}

const ROADMAP_STAGES = [
  {
    id: "administrasi",
    label: "Administrasi",
    subtitle: "CV screening",
    icon: FileText,
    color: "#8B5CF6",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    statuses: ["Administrasi"],
  },
  {
    id: "tes",
    label: "Tes-tes",
    subtitle: "Online, psikotes, technical",
    icon: ClipboardCheck,
    color: "#3B82F6",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    statuses: ["Tes Online", "Tes Psikotes", "Tes Tulis", "Tes Technical"],
  },
  {
    id: "wawancara-hr",
    label: "Wawancara HR",
    subtitle: "Fit budaya, motivasi",
    icon: Users,
    color: "#F59E0B",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    statuses: ["Wawancara HR"],
  },
  {
    id: "wawancara-user",
    label: "Wawancara User",
    subtitle: "Kesesuaian dengan tim",
    icon: UserCheck,
    color: "#EF4444",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    statuses: ["Wawancara User/Technical"],
  },
  {
    id: "fgd-lgd",
    label: "FGD / LGD",
    subtitle: "Khusus program MT",
    icon: UsersRound,
    color: "#EC4899",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    statuses: ["FGD / LGD"],
    isMT: true,
  },
  {
    id: "presentasi",
    label: "Pitch Deck",
    subtitle: "Khusus program MT",
    icon: Presentation,
    color: "#D946EF",
    bgColor: "bg-fuchsia-50",
    borderColor: "border-fuchsia-200",
    statuses: ["Presentasi Pitch Deck"],
    isMT: true,
  },
  {
    id: "wawancara-final",
    label: "Wawancara Final",
    subtitle: "Panel / direksi",
    icon: Crown,
    color: "#F97316",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    statuses: ["Wawancara Final"],
  },
  {
    id: "mcu",
    label: "Medical Check Up",
    subtitle: "Verifikasi kesehatan",
    icon: HeartPulse,
    color: "#10B981",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    statuses: ["Medical Check Up"],
  },
  {
    id: "offering",
    label: "Offering Letter",
    subtitle: "Negosiasi & tanda tangan",
    icon: PartyPopper,
    color: "#059669",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    statuses: ["Offering Letter"],
  },
];

// Legacy mapping for old Firestore data
const LEGACY_STATUS_MAP: Record<string, string> = {
  "CV Screening": "Administrasi",
  "Online Assessment": "Tes Online",
  "HR Interview": "Wawancara HR",
  "User Interview": "Wawancara User/Technical",
  "User/Technical Interview": "Wawancara User/Technical",
  "Final Interview": "Wawancara Final",
  "Offering": "Offering Letter",
  "Offering Stage": "Offering Letter",
  "Accepted": "Offering Letter",
};

function resolveStatus(status: string): string {
  return LEGACY_STATUS_MAP[status] || status;
}

export default function HiringRoadmap({ applications }: RoadmapProps) {
  // Count applications at each stage (current status or rejection stage)
  const stageCounts: Record<string, number> = {};

  for (const app of applications) {
    const resolved = resolveStatus(app.status);

    if (app.status === "Rejected" || app.status === "Ghosted" || app.status === "On Hold") {
      // Count at their rejection stage
      if (app.evaluation?.rejectionStage) {
        const rejResolved = resolveStatus(app.evaluation.rejectionStage);
        stageCounts[rejResolved] = (stageCounts[rejResolved] || 0) + 1;
      }
    } else if (resolved !== "Saved" && resolved !== "Applied") {
      stageCounts[resolved] = (stageCounts[resolved] || 0) + 1;
    }
  }

  // Get count for a roadmap stage (sum across all its statuses)
  const getStageCount = (statuses: string[]) => {
    return statuses.reduce((sum, s) => sum + (stageCounts[s] || 0), 0);
  };

  // Find the highest stage the user has reached
  let highestActiveIndex = -1;
  for (let i = ROADMAP_STAGES.length - 1; i >= 0; i--) {
    if (getStageCount(ROADMAP_STAGES[i].statuses) > 0) {
      highestActiveIndex = i;
      break;
    }
  }

  return (
    <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-2xl border border-[#E8E8ED] p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex mb-1">
            <h3 className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100/50">Hiring Roadmap</h3>
          </div>
          <p className="text-xs text-[#86868B] mt-1.5 ml-1">Track your journey through the hiring process</p>
        </div>
      </div>

      {/* Scrollable roadmap */}
      <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6 pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex items-start gap-0 min-w-max py-2">
          {ROADMAP_STAGES.map((stage, index) => {
            const count = getStageCount(stage.statuses);
            const isActive = count > 0;
            const isPast = index < highestActiveIndex;
            const isReached = isActive || isPast;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="flex items-start">
                {/* Stage node */}
                <div className="flex flex-col items-center relative group" style={{ width: 100 }}>
                  {/* MT badge */}
                  {stage.isMT && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full mb-0.5">
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-600 whitespace-nowrap">
                        MT Track
                      </span>
                    </div>
                  )}

                  {/* Icon circle */}
                  <div
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${
                      isActive
                        ? `${stage.bgColor} ${stage.borderColor} shadow-lg scale-105`
                        : isPast
                        ? `${stage.bgColor} ${stage.borderColor} opacity-70`
                        : "bg-[#F5F5F7] border-[#E8E8ED]"
                    } group-hover:scale-110 group-hover:shadow-lg`}
                    style={isActive ? { boxShadow: `0 8px 24px ${stage.color}20` } : {}}
                  >
                    <Icon
                      className="w-6 h-6 transition-colors"
                      style={{ color: isReached ? stage.color : "#C7C7CC" }}
                    />
                    {/* Count badge */}
                    {count > 0 && (
                      <div
                        className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-md animate-in zoom-in-50 duration-300"
                        style={{ backgroundColor: stage.color }}
                      >
                        {count}
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-2.5 text-center px-1">
                    <p
                      className={`text-[11px] font-semibold leading-tight transition-colors ${
                        isReached ? "text-[#1D1D1F]" : "text-[#C7C7CC]"
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>

                  {/* Step number */}
                  <div
                    className={`mt-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      isReached
                        ? "text-white"
                        : "bg-[#F5F5F7] text-[#C7C7CC]"
                    }`}
                    style={isReached ? { backgroundColor: stage.color } : {}}
                  >
                    {index + 1}
                  </div>
                </div>

                {/* Connector line */}
                {index < ROADMAP_STAGES.length - 1 && (
                  <div className="flex items-center self-center mt-1" style={{ marginTop: 18 }}>
                    <div className="relative w-8 h-0.5">
                      {/* Base line */}
                      <div className="absolute inset-0 bg-[#E8E8ED] rounded-full" />
                      {/* Active line */}
                      {isPast && (
                        <div
                          className="absolute inset-0 rounded-full transition-all duration-700"
                          style={{
                            background: `linear-gradient(90deg, ${stage.color}, ${ROADMAP_STAGES[index + 1].color})`,
                          }}
                        />
                      )}
                      {/* Dot */}
                      <div
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
                          isPast ? "bg-white shadow-sm" : "bg-[#D1D1D6]"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress summary */}
      <div className="mt-4 pt-3 border-t border-[#F5F5F7]">
        <div className="flex items-center gap-3 text-xs text-[#86868B]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Active stage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#E8E8ED]" />
            <span>Not reached yet</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[#86868B]">
              {highestActiveIndex >= 0
                ? `Furthest: ${ROADMAP_STAGES[highestActiveIndex].label}`
                : "No active applications yet"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
