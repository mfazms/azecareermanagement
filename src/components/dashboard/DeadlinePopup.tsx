"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Application } from "@/types";
import { X, Clock, AlertTriangle, ExternalLink } from "lucide-react";

interface DeadlinePopupProps {
  applications: Application[];
  isOpen: boolean;
  onClose: () => void;
}

interface DeadlineItem {
  app: Application;
  daysRemaining: number; // negative = past deadline
}

export default function DeadlinePopup({ applications, isOpen, onClose }: DeadlinePopupProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all saved applications with deadlines, sorted by urgency
  const deadlineItems: DeadlineItem[] = applications
    .filter((app) => app.status === "Saved" && app.deadline)
    .map((app) => {
      const deadlineDate = new Date(app.deadline!);
      deadlineDate.setHours(0, 0, 0, 0);
      const diffTime = deadlineDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { app, daysRemaining };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const getDeadlineLabel = (days: number) => {
    if (days < 0) return { text: `H+${Math.abs(days)} (Overdue!)`, color: "text-red-600", bg: "bg-red-50 border-red-200" };
    if (days === 0) return { text: "Today!", color: "text-red-600", bg: "bg-red-50 border-red-200" };
    if (days === 1) return { text: "Tomorrow", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" };
    if (days <= 3) return { text: `H-${days} days`, color: "text-orange-500", bg: "bg-orange-50 border-orange-200" };
    if (days <= 7) return { text: `H-${days} days`, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
    return { text: `H-${days} days`, color: "text-[#86868B]", bg: "bg-[#F5F5F7] border-[#E8E8ED]" };
  };

  const handleGoToApplication = (appId: string) => {
    // Navigate to applications page with the selected app's id as a query param
    router.push(`/applications?highlight=${appId}`);
    onClose();
  };

  const overdueCount = deadlineItems.filter((d) => d.daysRemaining < 0).length;
  const urgentCount = deadlineItems.filter((d) => d.daysRemaining >= 0 && d.daysRemaining <= 7).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col pointer-events-auto overflow-hidden border border-[#E8E8ED]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8ED] shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-[#1D1D1F]">Deadline Overview</h2>
              <p className="text-xs text-[#86868B] mt-0.5">
                {deadlineItems.length} application{deadlineItems.length !== 1 ? "s" : ""} with deadlines
                {overdueCount > 0 && (
                  <span className="text-red-500 font-semibold ml-1">
                    · {overdueCount} overdue
                  </span>
                )}
                {urgentCount > 0 && (
                  <span className="text-amber-500 font-semibold ml-1">
                    · {urgentCount} urgent
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F5F5F7] rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-[#86868B]" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {deadlineItems.length === 0 ? (
              <div className="text-center py-10">
                <Clock className="w-10 h-10 text-[#E8E8ED] mx-auto mb-3" />
                <p className="text-sm text-[#86868B]">No applications with deadlines.</p>
              </div>
            ) : (
              deadlineItems.map((item) => {
                const label = getDeadlineLabel(item.daysRemaining);
                return (
                  <button
                    key={item.app.id}
                    onClick={() => handleGoToApplication(item.app.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer ${label.bg}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1D1D1F] truncate">
                          {item.app.company}
                        </p>
                        <p className="text-xs text-[#86868B] truncate mt-0.5">
                          {item.app.position}
                          {item.app.location && ` · ${item.app.location}`}
                        </p>
                        <p className="text-[10px] text-[#86868B] mt-1">
                          Deadline: {new Date(item.app.deadline!).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-xs font-bold ${label.color} flex items-center gap-1`}>
                          {item.daysRemaining <= 0 && <AlertTriangle className="w-3 h-3" />}
                          {label.text}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#86868B]" />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[#E8E8ED] shrink-0">
            <button
              onClick={() => { router.push("/applications"); onClose(); }}
              className="w-full py-2.5 text-sm font-medium text-[#0071E3] hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
            >
              View All Applications →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
