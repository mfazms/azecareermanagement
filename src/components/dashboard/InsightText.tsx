"use client";

import type { Application } from "@/types";
import { Lightbulb } from "lucide-react";

interface InsightTextProps {
  applications: Application[];
}

export default function InsightText({ applications }: InsightTextProps) {
  const insights = generateInsights(applications);

  if (insights.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E8E8ED] p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-[#FF9500]" />
          <h3 className="text-sm font-semibold text-[#1D1D1F]">Insights</h3>
        </div>
        <p className="text-sm text-[#86868B]">
          Add more applications and rejection evaluations to generate automated insights.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-[#FF9500]" />
        <h3 className="text-sm font-semibold text-[#1D1D1F]">Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-[#1D1D1F]">
            <span className="text-[#0071E3] mt-0.5 shrink-0">—</span>
            <p>{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateInsights(applications: Application[]): string[] {
  const insights: string[] = [];
  const rejected = applications.filter((app) => app.status === "Rejected" && app.evaluation);

  if (rejected.length === 0) return insights;

  const stageCounts: Record<string, number> = {};
  rejected.forEach((app) => {
    if (app.evaluation?.rejectionStage) {
      stageCounts[app.evaluation.rejectionStage] = (stageCounts[app.evaluation.rejectionStage] || 0) + 1;
    }
  });

  const topStage = Object.entries(stageCounts).sort(([, a], [, b]) => b - a)[0];
  if (topStage) {
    const [stage, count] = topStage;
    const percentage = ((count / rejected.length) * 100).toFixed(0);
    insights.push(
      `Most rejections happen at "${stage}" (${count} of ${rejected.length}, ${percentage}%). ${getStageAdvice(stage)}`
    );
  }

  const causeCounts: Record<string, number> = {};
  rejected.forEach((app) => {
    if (app.evaluation?.rootCause) {
      causeCounts[app.evaluation.rootCause] = (causeCounts[app.evaluation.rootCause] || 0) + 1;
    }
  });

  const topCause = Object.entries(causeCounts).sort(([, a], [, b]) => b - a)[0];
  if (topCause && topCause[0] !== "Unknown") {
    const [cause, count] = topCause;
    insights.push(`Top root cause: "${cause}" (${count}x). ${getCauseAdvice(cause)}`);
  }

  const cvVersions: Record<string, { total: number; interviews: number }> = {};
  applications.forEach((app) => {
    if (app.cvVersion) {
      if (!cvVersions[app.cvVersion]) cvVersions[app.cvVersion] = { total: 0, interviews: 0 };
      cvVersions[app.cvVersion].total++;
      if (["Wawancara HR", "Tes Technical", "Wawancara User/Technical", "Presentasi Pitch Deck", "FGD / LGD", "Wawancara Final", "Medical Check Up", "Offering Letter"].includes(app.status)) {
        cvVersions[app.cvVersion].interviews++;
      }
    }
  });

  const cvEntries = Object.entries(cvVersions).filter(([, v]) => v.total >= 2);
  if (cvEntries.length >= 2) {
    const sorted = cvEntries.sort(([, a], [, b]) => b.interviews / b.total - a.interviews / a.total);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const bestRate = ((best[1].interviews / best[1].total) * 100).toFixed(0);
    const worstRate = ((worst[1].interviews / worst[1].total) * 100).toFixed(0);
    if (bestRate !== worstRate) {
      insights.push(`"${best[0]}" has a higher interview rate (${bestRate}%) compared to "${worst[0]}" (${worstRate}%).`);
    }
  }

  const pendingActions = rejected.filter((app) => app.evaluation?.actionItem && !app.evaluation.actionItemDone);
  if (pendingActions.length > 0) {
    insights.push(`You have ${pendingActions.length} pending action item${pendingActions.length > 1 ? "s" : ""}. Complete them to improve your next applications.`);
  }

  return insights;
}

function getStageAdvice(stage: string): string {
  switch (stage) {
    case "Administrasi": return "Consider revising your CV — get feedback or tailor it to job descriptions.";
    case "Tes Online": return "Practice assessment tests on LeetCode, HackerRank, or similar platforms.";
    case "Tes Psikotes": return "Familiarize yourself with psychological test patterns.";
    case "Tes Tulis": return "Review fundamentals relevant to the role's written tests.";
    case "Wawancara HR": return "Prepare for common HR questions — motivation, salary expectations, and self-introduction.";
    case "Tes Technical": return "Practice coding challenges and technical problem-solving.";
    case "Wawancara User/Technical": return "Practice mock technical interviews — focus on problem solving and communication.";
    case "Presentasi Pitch Deck": return "Refine your presentation skills and ensure your pitch is concise and clear.";
    case "FGD / LGD": return "Practice active listening, collaboration, and clear articulation of ideas in group settings.";
    case "Wawancara Final": return "You're reaching the final stage. Review past feedback and prepare even more thoroughly.";
    case "Medical Check Up": return "Ensure you maintain good health prior to final medical checks.";
    case "Offering Letter": return "Carefully review terms and negotiate if appropriate.";
    default: return "";
  }
}

function getCauseAdvice(cause: string): string {
  switch (cause) {
    case "Technical Skill": return "Practice coding and technical skills regularly.";
    case "Soft Skill / Communication": return "Try mock interviews and use the STAR method.";
    case "English": return "Improve English proficiency through conversation practice.";
    case "CV": return "Revise your CV — ensure it's tailored to each position.";
    case "Cover Letter": return "Write customized cover letters for each application.";
    case "Experience": return "Gain additional experience through projects, internships, or freelance work.";
    case "Culture Fit": return "Research company culture before interviews.";
    case "Salary Mismatch": return "Research salary ranges more thoroughly before negotiations.";
    default: return "";
  }
}
