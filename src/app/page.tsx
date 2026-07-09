"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100 rounded-full opacity-30 blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50 rounded-full opacity-40 blur-3xl translate-y-1/3 -translate-x-1/3" />
      </div>

      <nav className="w-full px-6 py-6 flex items-center justify-between relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Aze Career Logo" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="font-semibold text-lg text-[#1D1D1F]">Aze Career</span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => router.push("/login")}
            className="text-sm font-medium text-[#1D1D1F] hover:text-[#0071E3] transition-colors"
          >
            Sign In
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center relative z-10 max-w-3xl mx-auto pb-20">
        <Image src="/logo.png" alt="Aze Career Logo" width={80} height={80} className="w-20 h-20 object-contain mb-6" />
        <h1 className="text-5xl md:text-6xl font-bold text-[#1D1D1F] tracking-tight mb-4">
          Aze Career
        </h1>
        <h2 className="text-xl md:text-2xl font-medium text-[#86868B] mb-8">
          Career Management built for us, by us.
        </h2>
        
        <p className="text-base md:text-lg text-[#1D1D1F] leading-relaxed max-w-2xl mb-10">
          Surviving endless job rejections taught me one thing: never give up. Keep grinding, because the light at the end of the tunnel is real, and it's yours to claim.
        </p>

        <button 
          onClick={() => router.push("/login")}
          className="bg-[#0071E3] text-white px-8 py-4 rounded-full font-medium text-lg shadow-lg shadow-blue-500/20 hover:bg-[#0077ED] hover:scale-105 transition-all active:scale-95"
        >
          Start Tracking for Free
        </button>
      </main>
    </div>
  );
}
