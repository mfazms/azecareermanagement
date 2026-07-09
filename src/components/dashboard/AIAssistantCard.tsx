"use client";

import { ArrowRight, MessageSquareText } from "lucide-react";
import Image from "next/image";

export default function AIAssistantCard() {
  return (
    <div 
      className="bg-gradient-to-br from-blue-400 via-blue-600 to-slate-900 rounded-2xl p-5 sm:p-6 shadow-md text-white relative overflow-hidden group cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full" 
      onClick={() => alert("Aze Intelligence chatbot is coming soon! Stay tuned for real-time advice and data-driven discussions.")}
    >
      <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 group-hover:scale-110 group-hover:rotate-12 transform pointer-events-none">
        <Image src="/logo.png" alt="Aze" width={128} height={128} className="w-32 h-32 object-contain brightness-0 invert" />
      </div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <Image src="/logo.png" alt="Aze Logo" width={16} height={16} className="w-4 h-4 object-contain brightness-0 invert" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold leading-tight">Aze Intelligence</h3>
              <span className="text-[10px] font-medium text-blue-100">powered by Gemini</span>
            </div>
          </div>
          <p className="text-white/90 text-sm mb-5 max-w-[90%] leading-relaxed">
            Talk and discuss. Seek real-time advice and insights powered by Gemini x Aze algorithm.
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] font-semibold bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm uppercase tracking-wider">
            Coming Soon
          </span>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:bg-white transition-colors duration-300">
            <MessageSquareText className="w-4 h-4 text-white group-hover:text-purple-600 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
