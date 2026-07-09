"use client";

import type { KPIData } from "@/types";
import {
  Briefcase,
  TrendingUp,
  Bookmark,
  MessageSquare,
  XCircle,
  Trophy,
} from "lucide-react";

interface KPICardsProps {
  data: KPIData;
}

const kpiConfig = [
  { key: "total" as const, label: "Total", icon: Briefcase, color: "#8E8E93", bg: "bg-gray-50" },
  { key: "saved" as const, label: "Saved", icon: Bookmark, color: "#5856D6", bg: "bg-violet-50" },
  { key: "active" as const, label: "Active", icon: TrendingUp, color: "#007AFF", bg: "bg-blue-50" },
  { key: "interview" as const, label: "Interview", icon: MessageSquare, color: "#FF9500", bg: "bg-amber-50" },
  { key: "rejected" as const, label: "Rejected", icon: XCircle, color: "#FF3B30", bg: "bg-red-50" },
  { key: "successRate" as const, label: "Success Rate", icon: Trophy, color: "#34C759", bg: "bg-green-50", suffix: "%" },
];

export default function KPICards({ data }: KPICardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon;
        const value = data[kpi.key];
        return (
          <div
            key={kpi.key}
            className="group bg-white rounded-2xl border border-[#E8E8ED] p-4 sm:p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-glass-hover hover:border-blue-200/60 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          >
            <div className={`w-9 h-9 ${kpi.bg} rounded-xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-sm`}>
              <Icon className="w-[18px] h-[18px]" style={{ color: kpi.color }} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#1D1D1F] tabular-nums">
              {typeof value === "number" && kpi.suffix
                ? `${value.toFixed(1)}${kpi.suffix}`
                : value}
            </p>
            <p className="text-xs text-[#86868B] mt-1 font-medium">{kpi.label}</p>
          </div>
        );
      })}
    </div>
  );
}
