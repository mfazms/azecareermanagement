"use client";

import type { RejectionReasonData } from "@/types";

interface RejectionChartProps {
  data: RejectionReasonData[];
}

const reasonColors = ["#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#007AFF", "#5856D6", "#FF2D55", "#8E8E93", "#C7C7CC"];

export default function RejectionChart({ data }: RejectionChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-red-50/40 rounded-2xl border border-[#E8E8ED] p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex">
          <h3 className="text-sm font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100/50">Rejection Root Causes</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-[#86868B]">No rejection data yet</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-gradient-to-br from-white to-red-50/40 rounded-2xl border border-[#E8E8ED] p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
      <div className="mb-6 flex">
        <h3 className="text-sm font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100/50">Rejection Root Causes</h3>
      </div>
      <div className="space-y-3">
        {data.map((item, index) => {
          const widthPercent = (item.count / maxCount) * 100;
          const color = reasonColors[index % reasonColors.length];
          return (
            <div key={item.reason} className="group cursor-pointer">
              <div className="flex items-center justify-between mb-1.5 transition-transform duration-300 group-hover:-translate-y-0.5">
                <span className="text-xs font-medium text-[#86868B] group-hover:text-[#1D1D1F] transition-colors">{item.reason}</span>
                <span className="text-xs font-bold text-[#1D1D1F] tabular-nums group-hover:scale-110 transition-transform origin-right">{item.count}</span>
              </div>
              <div className="h-6 bg-[#F5F5F7] rounded-lg overflow-hidden border border-transparent group-hover:border-[#E8E8ED] transition-colors">
                <div
                  className="h-full rounded-lg transition-all duration-700 ease-out opacity-80 group-hover:opacity-100 group-hover:shadow-glow-blue relative overflow-hidden"
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
  );
}
