import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aze Career",
  description: "Career Management built for us, by us.",
  keywords: ["job tracker", "job application", "career", "interview tracker"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F5F7] relative z-0">
        <div 
          className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.03]" 
          style={{ backgroundImage: "url('/logo.png')", backgroundSize: "48px", backgroundRepeat: "repeat" }} 
        />
        <AuthProvider>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <footer className="py-6 mt-8 text-center text-xs text-[#86868B] font-medium pb-24 sm:pb-6">
            thelordaze, © 2026 All rights reserved. East Java
          </footer>
          <Toaster position="bottom-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
