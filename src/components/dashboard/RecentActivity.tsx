"use client";

import type { Application } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowRight } from "lucide-react";

interface RecentActivityProps {
  applications: Application[];
}

function getStatusColor(status: string): string {
  switch (status) {
    case "Saved": return "bg-violet-50 text-violet-700 border-violet-200";
    case "Applied": case "Administrasi": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Tes Online": case "Tes Psikotes": case "Tes Tulis": return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "Wawancara HR": case "Tes Technical": case "Wawancara User/Technical": case "Presentasi Pitch Deck": case "FGD / LGD": case "Wawancara Final":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Medical Check Up": case "Offering Letter": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "On Hold": return "bg-orange-50 text-orange-600 border-orange-200";
    case "Ghosted": return "bg-gray-100 text-gray-700 border-gray-300";
    case "Rejected": return "bg-red-50 text-red-700 border-red-200";
    default: return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

export default function RecentActivity({ applications }: RecentActivityProps) {
  const recent = [...applications]
    .sort((a, b) => new Date(b.dateUpdated).getTime() - new Date(a.dateUpdated).getTime())
    .slice(0, 5);

  if (recent.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-indigo-50/40 rounded-2xl border border-[#E8E8ED] p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] h-full">
        <div className="mb-4 flex">
          <h3 className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/50">Recent Activity</h3>
        </div>
        <p className="text-sm text-[#86868B]">No activity yet. Start adding applications.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-indigo-50/40 rounded-2xl border border-[#E8E8ED] p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] h-full">
      <div className="mb-4 flex">
        <h3 className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/50">Recent Activity</h3>
      </div>
      <div className="space-y-2">
        {recent.map((app) => (
          <div
            key={app.id}
            className="group flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-blue-50/60 hover:shadow-sm hover:translate-x-1 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-[#007AFF] shrink-0 group-hover:scale-150 group-hover:bg-blue-500 transition-all duration-300 shadow-sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1D1D1F] truncate group-hover:text-blue-700 transition-colors">{app.company}</p>
                <div className="flex items-center gap-2 text-xs text-[#86868B]">
                  <span className="truncate flex items-center gap-1.5">
                    {app.position}
                    {app.jobType && (
                      <span className="px-1.5 py-0.5 rounded-md bg-gray-100/80 backdrop-blur-sm text-[9px] font-medium text-gray-600">
                        {app.jobType}
                      </span>
                    )}
                    {app.workArrangement && (
                      <span className="px-1.5 py-0.5 rounded-md bg-gray-100/80 backdrop-blur-sm text-[9px] font-medium text-gray-600">
                        {app.workArrangement}
                      </span>
                    )}
                  </span>
                  <ArrowRight className="w-3 h-3 shrink-0 group-hover:translate-x-1 group-hover:text-blue-500 transition-all duration-300" />
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(app.status)} text-[10px] font-medium rounded-md px-1.5 py-0 shrink-0`}
                  >
                    {app.status}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#86868B] shrink-0 ml-2">
              <Calendar className="w-3 h-3" />
              {new Date(app.dateUpdated).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
