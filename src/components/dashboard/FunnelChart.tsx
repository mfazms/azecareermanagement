"use client";

import type { FunnelData } from "@/types";

interface FunnelChartProps {
  data: FunnelData[];
}

const stageColors: Record<string, string> = {
  "Saved": "#5856D6",
  "Applied": "#007AFF",
  "Administrasi": "#007AFF",
  "Tes Online": "#5AC8FA",
  "Tes Psikotes": "#5AC8FA",
  "Tes Tulis": "#5AC8FA",
  "Wawancara HR": "#FF9500",
  "Tes Technical": "#FF9500",
  "Wawancara User/Technical": "#FF9500",
  "Presentasi Pitch Deck": "#FF9500",
  "FGD / LGD": "#FF9500",
  "Wawancara Final": "#FF2D55",
  "Medical Check Up": "#34C759",
  "Offering Letter": "#30D158",
};

export default function FunnelChart({ data }: FunnelChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="bg-gradient-to-br from-white to-blue-50/40 rounded-2xl border border-[#E8E8ED] p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
        <div className="mb-6 flex">
          <h3 className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100/50">Conversion Funnel</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-[#86868B]">No data to display yet</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/40 rounded-2xl border border-[#E8E8ED] p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col">
      <div className="mb-6 flex">
        <h3 className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100/50">Conversion Funnel</h3>
      </div>
      
      <div className="flex items-start gap-2 sm:gap-3 overflow-x-auto pb-4">
        {data.filter((item) => item.count > 0).map((item) => {
          const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          const color = stageColors[item.stage] || "#8E8E93";
          return (
            <div key={item.stage} className="group flex flex-col items-center min-w-[72px] flex-1 shrink-0">
              
              {/* Labels above bar */}
              <div className="flex flex-col items-center mb-2 opacity-80 group-hover:opacity-100 transition-opacity h-8 justify-end">
                <span className="text-xs font-bold text-[#1D1D1F] tabular-nums leading-none mb-1 group-hover:scale-125 transition-transform duration-300 origin-bottom">{item.count}</span>
                <span className="text-[10px] font-medium text-[#86868B] leading-none group-hover:text-[#0071E3] transition-colors">{item.percentage.toFixed(0)}%</span>
              </div>
              
              {/* Bar container */}
              <div className="w-full h-[160px] bg-[#F5F5F7] rounded-t-xl flex flex-col justify-end overflow-hidden group-hover:bg-blue-50/50 transition-colors relative cursor-pointer">
                <div
                  className="w-full rounded-t-xl transition-all duration-700 ease-out opacity-85 group-hover:opacity-100 group-hover:shadow-glow-blue relative overflow-hidden"
                  style={{ height: `${Math.max(heightPercent, 2)}%`, backgroundColor: color }}
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-500 ease-out" />
                </div>
              </div>
              
              {/* Stage name at bottom */}
              <div className="h-10 mt-3 flex items-start justify-center w-full px-1">
                <span className="text-[10px] text-center font-medium text-[#86868B] leading-tight line-clamp-2">
                  {item.stage}
                </span>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
}
