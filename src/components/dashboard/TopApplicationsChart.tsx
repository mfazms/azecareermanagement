"use client";

import type { Application } from "@/types";

interface TopApplicationsChartProps {
  applications: Application[];
}

const companyColors = ["#007AFF", "#34C759", "#FF9500", "#5856D6", "#FF2D55"];
const roleColors = ["#5AC8FA", "#30D158", "#FFCC00", "#AF52DE", "#FF3B30"];

export default function TopApplicationsChart({ applications }: TopApplicationsChartProps) {
  if (applications.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-2xl border border-[#E8E8ED] p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex">
          <h3 className="text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100/50">Top Applications</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-[#86868B]">No applications data yet</p>
        </div>
      </div>
    );
  }

  // Calculate top companies
  const companyCounts = applications.reduce((acc, app) => {
    acc[app.company] = (acc[app.company] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCompanyCount = Math.max(...topCompanies.map(([, count]) => count), 1);

  // Calculate top roles
  const roleCounts = applications.reduce((acc, app) => {
    acc[app.position] = (acc[app.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topRoles = Object.entries(roleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxRoleCount = Math.max(...topRoles.map(([, count]) => count), 1);

  return (
    <div className="bg-gradient-to-br from-white to-purple-50/40 rounded-2xl border border-[#E8E8ED] p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col gap-6">
      
      {/* Top Companies */}
      <div>
        <div className="mb-4 flex">
          <h3 className="text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100/50">Most Applied Companies</h3>
        </div>
        <div className="space-y-3">
          {topCompanies.map(([company, count], index) => {
            const widthPercent = (count / maxCompanyCount) * 100;
            const color = companyColors[index % companyColors.length];
            return (
              <div key={company} className="group cursor-pointer">
                <div className="flex items-center justify-between mb-1.5 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <span className="text-xs font-medium text-[#86868B] truncate mr-2 group-hover:text-[#1D1D1F] transition-colors">{company}</span>
                  <span className="text-xs font-bold text-[#1D1D1F] tabular-nums shrink-0 group-hover:scale-110 transition-transform origin-right">{count}</span>
                </div>
                <div className="h-4 bg-[#F5F5F7] rounded-md overflow-hidden border border-transparent group-hover:border-[#E8E8ED] transition-colors">
                  <div
                    className="h-full rounded-md transition-all duration-700 ease-out opacity-80 group-hover:opacity-100 group-hover:shadow-glow-blue relative overflow-hidden"
                    style={{ width: `${Math.max(widthPercent, 5)}%`, backgroundColor: color }}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <hr className="border-[#E8E8ED]" />

      {/* Top Roles */}
      <div>
        <div className="mb-4 flex">
          <h3 className="text-sm font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100/50">Most Applied Roles</h3>
        </div>
        <div className="space-y-3">
          {topRoles.map(([role, count], index) => {
            const widthPercent = (count / maxRoleCount) * 100;
            const color = roleColors[index % roleColors.length];
            return (
              <div key={role} className="group cursor-pointer">
                <div className="flex items-center justify-between mb-1.5 transition-transform duration-300 group-hover:-translate-y-0.5">
                  <span className="text-xs font-medium text-[#86868B] truncate mr-2 group-hover:text-[#1D1D1F] transition-colors">{role}</span>
                  <span className="text-xs font-bold text-[#1D1D1F] tabular-nums shrink-0 group-hover:scale-110 transition-transform origin-right">{count}</span>
                </div>
                <div className="h-4 bg-[#F5F5F7] rounded-md overflow-hidden border border-transparent group-hover:border-[#E8E8ED] transition-colors">
                  <div
                    className="h-full rounded-md transition-all duration-700 ease-out opacity-80 group-hover:opacity-100 group-hover:shadow-glow-blue relative overflow-hidden"
                    style={{ width: `${Math.max(widthPercent, 5)}%`, backgroundColor: color }}
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
