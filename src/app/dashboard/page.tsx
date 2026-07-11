"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import KPICards from "@/components/dashboard/KPICards";
import FunnelChart from "@/components/dashboard/FunnelChart";
import RejectionChart from "@/components/dashboard/RejectionChart";
import InsightText from "@/components/dashboard/InsightText";
import AIAssistantCard from "@/components/dashboard/AIAssistantCard";
import ResumeBuilderCard from "@/components/dashboard/ResumeBuilderCard";
import TopApplicationsChart from "@/components/dashboard/TopApplicationsChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import HiringRoadmap from "@/components/dashboard/HiringRoadmap";
import { getApplications } from "@/lib/firestore";
import type { Application, KPIData, FunnelData, RejectionReasonData } from "@/types";
import { FUNNEL_STAGES } from "@/types";
import { Loader2, GraduationCap, Briefcase } from "lucide-react";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const apps = await getApplications(user.uid);
      setApplications(apps);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const kpiData = computeKPI(applications);
  const funnelData = computeFunnel(applications);
  const rejectionData = computeRejectionReasons(applications);

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split("@")[0] || "there";

  // Compute days since graduation
  const daysUnemployed = (() => {
    if (!userProfile?.graduationDate) return null;
    const gradDate = new Date(userProfile.graduationDate);
    const offeringApp = applications.find((app) => app.status === "Offering Letter");
    const endDate = offeringApp ? new Date(offeringApp.dateUpdated) : new Date();
    const diff = Math.floor((endDate.getTime() - gradDate.getTime()) / (1000 * 60 * 60 * 24));
    return { days: Math.max(diff, 0), hasOffering: !!offeringApp };
  })();

  // Compute days since last position
  const daysSinceLastPosition = (() => {
    if (!userProfile?.lastPosition?.endDate) return null;
    const endDate = new Date(userProfile.lastPosition.endDate);
    if (isNaN(endDate.getTime())) return null;
    const diff = Math.floor((new Date().getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    return { days: Math.max(diff, 0), company: userProfile.lastPosition.company, position: userProfile.lastPosition.position };
  })();

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071E3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24">
        {/* Header with unemployment counter */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F]">
              Hello, {displayName}
            </h1>
            <p className="text-sm text-[#86868B] mt-1">
              {applications.length === 0
                ? "Start by adding your first application."
                : "Keep going. Consistency is key."}
            </p>
          </div>

          {/* Day counters */}
          <div className="flex flex-wrap items-start gap-3 shrink-0">
            {/* Days since graduation counter */}
            {daysUnemployed !== null && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm ${
                daysUnemployed.hasOffering
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-[#E8E8ED]"
              }`}>
                {daysUnemployed.hasOffering ? (
                  <>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100">
                      <GraduationCap className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700">
                        🎉 Congratulations!
                      </p>
                      <p className="text-[11px] text-emerald-600">
                        Got offering in <span className="font-bold">{daysUnemployed.days}</span> days
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F5F5F7]">
                      <GraduationCap className="w-5 h-5 text-[#86868B]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#1D1D1F] leading-none tabular-nums">
                        {daysUnemployed.days}
                      </p>
                      <p className="text-[11px] text-[#86868B] font-medium mt-0.5">
                        days since graduation
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Days since last position counter */}
            {daysSinceLastPosition !== null && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm bg-white border-[#E8E8ED]">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50">
                  <Briefcase className="w-5 h-5 text-[#0071E3]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1D1D1F] leading-none tabular-nums">
                    {daysSinceLastPosition.days}
                  </p>
                  <p className="text-[11px] text-[#86868B] font-medium mt-0.5">
                    days since last position
                  </p>
                  {daysSinceLastPosition.company && (
                    <p className="text-[10px] text-[#0071E3] mt-0.5 truncate max-w-[140px]">
                      {daysSinceLastPosition.position} @ {daysSinceLastPosition.company}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#0071E3]" />
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            <HiringRoadmap applications={applications} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              <InsightText applications={applications} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <AIAssistantCard />
                <ResumeBuilderCard />
              </div>
            </div>

            <KPICards data={kpiData} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              <RejectionChart data={rejectionData} />
              <FunnelChart data={funnelData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              <TopApplicationsChart applications={applications} />
              <RecentActivity applications={applications} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function computeKPI(applications: Application[]): KPIData {
  const total = applications.length;
  const rejected = applications.filter((app) => app.status === "Rejected").length;
  const accepted = applications.filter((app) => app.status === "Offering Letter").length;
  const withdrawn = 0; // Removing withdrawn since it's removed from status
  const saved = applications.filter((app) => app.status === "Saved").length;
  const active = total - rejected - accepted - withdrawn - applications.filter(app => app.status === "Ghosted").length;
  const interview = applications.filter((app) =>
    ["Wawancara HR", "Tes Technical", "Wawancara User/Technical", "Presentasi Pitch Deck", "FGD / LGD", "Wawancara Final"].includes(app.status)
  ).length;
  const successRate = total > 0 ? (accepted / total) * 100 : 0;
  return { total, active, saved, interview, rejected, accepted, successRate };
}

function computeFunnel(applications: Application[]): FunnelData[] {
  const total = applications.length;
  if (total === 0) return [];

  const stageOrder = FUNNEL_STAGES;
  const statusIndex: Record<string, number> = {};
  stageOrder.forEach((stage, index) => { statusIndex[stage] = index; });

  // Legacy mapping: old stage/status names → new names
  // so existing Firestore data is still counted correctly
  const legacyMap: Record<string, string> = {
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

  const resolveStageIndex = (name: string): number => {
    return statusIndex[name] ?? statusIndex[legacyMap[name]] ?? -1;
  };

  return stageOrder.map((stage) => {
    let count = 0;
    if (stage === "Saved") {
      count = applications.filter((app) => app.status === "Saved").length;
    } else {
      const stageIdx = statusIndex[stage];
      count = applications.filter((app) => {
        if (app.status === "Saved") return false;
        if (app.status === "Rejected" || app.status === "Ghosted" || app.status === "On Hold") {
          if (app.evaluation?.rejectionStage) {
            const rejIdx = resolveStageIndex(app.evaluation.rejectionStage);
            return rejIdx >= 0 && stageIdx <= rejIdx;
          }
          return stageIdx <= statusIndex["Applied"]; // Count at Applied level
        }
        // For active statuses, resolve using legacy map too
        const appIdx = resolveStageIndex(app.status);
        return appIdx >= 0 && appIdx >= stageIdx;
      }).length;
    }
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return { stage, count, percentage };
  });
}

function computeRejectionReasons(applications: Application[]): RejectionReasonData[] {
  const rejected = applications.filter((app) => app.status === "Rejected" && app.evaluation?.rootCause);
  const counts: Record<string, number> = {};
  rejected.forEach((app) => { counts[app.evaluation!.rootCause] = (counts[app.evaluation!.rootCause] || 0) + 1; });
  return Object.entries(counts).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
}
