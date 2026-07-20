"use client";

import { useState, useEffect, useCallback } from "react";
import DeadlinePopup from "@/components/dashboard/DeadlinePopup";
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
import MotivationBoard from "@/components/dashboard/MotivationBoard";
import { getApplications } from "@/lib/firestore";
import type { Application, KPIData, FunnelData, RejectionReasonData } from "@/types";
import { FUNNEL_STAGES } from "@/types";
import { Loader2, GraduationCap, Briefcase, Bookmark, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeadlinePopup, setShowDeadlinePopup] = useState(false);

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

  // Compute saved apps metrics
  const { urgentSavedCount, totalSavedCount, minDiffDays } = (() => {
    let urgent = 0;
    let total = 0;
    let minDays: number | null = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    applications.forEach(app => {
      if (app.status === "Saved") {
        total++;
        if (app.deadline) {
          const deadlineDate = new Date(app.deadline);
          const diffTime = deadlineDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 7) {
            urgent++;
          }
          if (minDays === null || diffDays < minDays) {
            minDays = diffDays;
          }
        }
      }
    });
    return { urgentSavedCount: urgent, totalSavedCount: total, minDiffDays: minDays };
  })();

  const getGraduationBoxStyle = (days: number) => {
    const ratio = Math.min(days / 365, 1);
    const boxL = 98 - (ratio * 53); 
    const isDark = boxL < 48;
    return {
      backgroundColor: `hsl(152, 76%, ${boxL}%)`,
      borderColor: `hsl(152, 76%, ${Math.max(30, boxL - 15)}%)`,
      color: isDark ? '#ffffff' : `hsl(152, 76%, 15%)`,
      subColor: isDark ? 'rgba(255,255,255,0.9)' : `hsl(152, 76%, 30%)`,
      iconBg: isDark ? 'rgba(255,255,255,0.2)' : `hsl(152, 76%, ${Math.max(30, boxL - 15)}%)`,
      iconColor: isDark ? '#ffffff' : `hsl(152, 76%, 20%)`,
    };
  };

  const getLastPositionBoxStyle = (days: number) => {
    const ratio = Math.min(days / 365, 1);
    const boxL = 50 + (ratio * 48); 
    const isDark = boxL < 55;
    return {
      backgroundColor: `hsl(211, 100%, ${boxL}%)`,
      borderColor: `hsl(211, 100%, ${Math.max(30, boxL - 15)}%)`,
      color: isDark ? '#ffffff' : `hsl(211, 100%, 15%)`,
      subColor: isDark ? 'rgba(255,255,255,0.9)' : `hsl(211, 100%, 35%)`,
      iconBg: isDark ? 'rgba(255,255,255,0.2)' : `hsl(211, 100%, ${Math.max(30, boxL - 15)}%)`,
      iconColor: isDark ? '#ffffff' : `hsl(211, 100%, 25%)`,
      linkColor: isDark ? '#93c5fd' : `hsl(211, 100%, 40%)`,
    };
  };

  const getSavedAppsBoxStyle = (minDays: number | null) => {
    if (minDays === null) return null;
    const ratio = Math.max(0, Math.min(minDays / 30, 1)); 
    const hue = ratio * 120; 
    const boxL = 95 - ((1 - ratio) * 45); 
    const isDark = boxL < 55 && (hue < 20 || hue > 200);
    return {
      backgroundColor: `hsl(${hue}, 90%, ${boxL}%)`,
      borderColor: `hsl(${hue}, 90%, ${Math.max(30, boxL - 15)}%)`,
      color: isDark ? '#ffffff' : `hsl(${hue}, 90%, 15%)`,
      subColor: isDark ? 'rgba(255,255,255,0.9)' : `hsl(${hue}, 90%, 30%)`,
      iconBg: isDark ? 'rgba(255,255,255,0.2)' : `hsl(${hue}, 90%, ${Math.max(30, boxL - 15)}%)`,
      iconColor: isDark ? '#ffffff' : `hsl(${hue}, 90%, 25%)`,
      alertColor: isDark ? '#ffccd5' : `hsl(${hue}, 90%, 35%)`,
    };
  };

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
        {/* Banner Reminder */}
        {!isLoading && urgentSavedCount > 0 && (
          <button
            onClick={() => setShowDeadlinePopup(true)}
            className="mb-6 w-full bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:bg-red-100 hover:shadow-md transition-all cursor-pointer text-left"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Action Required: Deadlines Approaching</h3>
              <p className="text-sm text-red-700 mt-1">
                You have {urgentSavedCount} saved {urgentSavedCount === 1 ? "application" : "applications"} with a deadline in 7 days or less. Don&apos;t forget to apply!
              </p>
              <p className="text-xs text-red-500 mt-1.5 font-medium">Click to view details →</p>
            </div>
          </button>
        )}

        {/* Header with unemployment counter */}
        <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-8">
          <div className="flex-1 min-w-0 w-full">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F]">
              Hello, {displayName}
            </h1>
            <p className="text-sm text-[#86868B] mt-1">
              {applications.length === 0
                ? "Start by adding your first application."
                : "Keep going. Consistency is key."}
            </p>

            {userProfile && (
              <MotivationBoard 
                uid={user.uid} 
                userProfile={userProfile} 
                refreshProfile={refreshProfile} 
              />
            )}
          </div>

          {/* Day counters */}
          <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
            {/* Urgent Saved Jobs Counter */}
            {totalSavedCount > 0 && (() => {
              const style = getSavedAppsBoxStyle(minDiffDays);
              return (
                <button 
                  onClick={() => setShowDeadlinePopup(true)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm w-full sm:w-[230px] shrink-0 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer text-left"
                  style={style ? { backgroundColor: style.backgroundColor, borderColor: style.borderColor } : { backgroundColor: '#ffffff', borderColor: '#E8E8ED' }}
                >
                  <div 
                    className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                    style={style ? { backgroundColor: style.iconBg } : { backgroundColor: '#F5F5F7' }}
                  >
                    <Bookmark 
                      className="w-5 h-5" 
                      style={style ? { color: style.iconColor } : { color: '#86868B' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-2xl font-bold leading-none tabular-nums"
                      style={{ color: style ? style.color : '#1D1D1F' }}
                    >
                      {totalSavedCount}
                    </p>
                    <p 
                      className="text-[11px] font-medium mt-0.5 truncate"
                      style={{ color: style ? style.subColor : '#86868B' }}
                    >
                      {urgentSavedCount > 0 ? (
                        <span style={{ color: style ? style.alertColor : '#dc2626', fontWeight: 'bold' }}>{urgentSavedCount} urgent to apply!</span>
                      ) : (
                        "saved applications"
                      )}
                    </p>
                  </div>
                </button>
              );
            })()}

            {/* Days since graduation counter */}
            {daysUnemployed !== null && (() => {
              const style = getGraduationBoxStyle(daysUnemployed.days);
              return (
                <div 
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm w-full sm:w-[230px] shrink-0 transition-colors"
                  style={daysUnemployed.hasOffering ? { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' } : { backgroundColor: style.backgroundColor, borderColor: style.borderColor }}
                >
                  {daysUnemployed.hasOffering ? (
                    <>
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 bg-emerald-100">
                        <GraduationCap className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-emerald-700">🎉 Congratulations!</p>
                        <p className="text-[11px] text-emerald-600 truncate">
                          Got offering in <span className="font-bold">{daysUnemployed.days}</span> days
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div 
                        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                        style={{ backgroundColor: style.iconBg }}
                      >
                        <GraduationCap className="w-5 h-5" style={{ color: style.iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p 
                          className="text-2xl font-bold leading-none tabular-nums"
                          style={{ color: style.color }}
                        >
                          {daysUnemployed.days}
                        </p>
                        <p 
                          className="text-[11px] font-medium mt-0.5 truncate"
                          style={{ color: style.subColor }}
                        >
                          days since graduation
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Days since last position counter */}
            {daysSinceLastPosition !== null && (() => {
              const style = getLastPositionBoxStyle(daysSinceLastPosition.days);
              return (
                <div 
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-sm w-full sm:w-[230px] shrink-0 transition-colors"
                  style={{ backgroundColor: style.backgroundColor, borderColor: style.borderColor }}
                >
                  <div 
                    className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                    style={{ backgroundColor: style.iconBg }}
                  >
                    <Briefcase className="w-5 h-5" style={{ color: style.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-2xl font-bold leading-none tabular-nums"
                      style={{ color: style.color }}
                    >
                      {daysSinceLastPosition.days}
                    </p>
                    <p 
                      className="text-[11px] font-medium mt-0.5 truncate"
                      style={{ color: style.subColor }}
                    >
                      days since last position
                    </p>
                    {daysSinceLastPosition.company && (
                      <p 
                        className="text-[10px] mt-0.5 truncate"
                        style={{ color: style.linkColor }}
                      >
                        {daysSinceLastPosition.position} @ {daysSinceLastPosition.company}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
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

      {/* Deadline Popup */}
      <DeadlinePopup
        applications={applications}
        isOpen={showDeadlinePopup}
        onClose={() => setShowDeadlinePopup(false)}
      />
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
