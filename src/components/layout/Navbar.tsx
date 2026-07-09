"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutDashboard, List, LogOut, User, Settings } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: LayoutDashboard },
    { href: "/applications", label: "Applications", mobileLabel: "Apps", icon: List },
    { href: "/profile", label: "Profile", mobileLabel: "Profile", icon: Settings },
  ];

  if (!user) return null;

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/90 backdrop-blur-lg border border-[#E8E8ED]/80 shadow-glass">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-[#F5F5F7]/80 transition-all duration-200 group shrink-0"
        >
          <Image
            src="/logo.png"
            alt="Aze Career"
            width={24}
            height={24}
            className="w-6 h-6 object-contain group-hover:scale-110 transition-transform duration-200"
          />
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-[#E8E8ED] mx-0.5 shrink-0" />

        {/* Navigation Links */}
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 whitespace-nowrap active:scale-95 ${
                isActive
                  ? "bg-[#0071E3] text-white shadow-glow-blue"
                  : "text-[#86868B] hover:bg-white/80 hover:text-[#1D1D1F] hover:shadow-sm"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 ${!isActive && 'group-hover:scale-110 group-hover:-rotate-3'}`} />
              <span className="text-xs font-medium hidden sm:inline">{link.label}</span>
              <span className="text-xs font-medium sm:hidden">{link.mobileLabel}</span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="w-px h-6 bg-[#E8E8ED] mx-0.5 shrink-0" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/80 cursor-pointer outline-none transition-all duration-300 group shrink-0 active:scale-95">
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-[#0071E3] border-2 border-white shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              {userProfile?.photoBase64 ? (
                <img src={userProfile.photoBase64} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-white" />
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            sideOffset={8}
            className="w-52 rounded-xl shadow-lg border border-[#E8E8ED]/50 bg-white/95 backdrop-blur-xl"
          >
            <div className="px-3 py-2 border-b border-[#E8E8ED]">
              <p className="text-sm font-medium text-[#1D1D1F] truncate">
                {userProfile?.displayName || user.displayName || "User"}
              </p>
              <p className="text-xs text-[#86868B] truncate">{user.email}</p>
            </div>
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="cursor-pointer font-medium mx-1 mt-1 rounded-lg"
            >
              <User className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer mx-1 mb-1 rounded-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
