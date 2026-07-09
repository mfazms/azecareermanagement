"use client";

import { FileText, ArrowRight, Download } from "lucide-react";

export default function ResumeBuilderCard() {
  const handleResumeClick = () => {
    // Nanti user bisa ganti URL ini dengan link Google Drive template Harvard miliknya
    window.open("https://drive.google.com/", "_blank");
  };

  return (
    <div 
      className="bg-gradient-to-br from-slate-800 via-blue-950 to-slate-950 rounded-2xl p-5 sm:p-6 shadow-md text-white relative overflow-hidden group cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full" 
      onClick={handleResumeClick}
    >
      <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 group-hover:scale-110 group-hover:-rotate-12 transform pointer-events-none">
        <FileText className="w-32 h-32" />
      </div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-base font-bold leading-tight">ATS Resume</h3>
          </div>
          <p className="text-white/90 text-sm mb-5 max-w-[95%] leading-relaxed">
            Build your Harvard-style ATS resume. (Coming soon, grab template for now)
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] font-semibold bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm uppercase tracking-wider">
            Template
          </span>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white transition-colors duration-300">
            <Download className="w-4 h-4 text-white group-hover:text-teal-600 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
