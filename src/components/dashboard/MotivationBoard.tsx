"use client";

import { useState, useRef } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { updateUserProfile } from "@/lib/firestore";
import type { UserProfile } from "@/types";
import { toast } from "sonner";

const MAX_MOTIVATION_SIZE = 800 * 1024; // 800KB max for the base64 image

export default function MotivationBoard({
  uid,
  userProfile,
  refreshProfile,
}: {
  uid: string;
  userProfile: UserProfile;
  refreshProfile: () => Promise<void>;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const compressImage = (base64: string, maxWidth: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Scale down if larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context failed")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = base64;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    try {
      setIsUploading(true);
      let base64 = await fileToBase64(file);

      // Compress if too large
      const base64Size = base64.length;
      if (base64Size > MAX_MOTIVATION_SIZE) {
        // Progressively compress with lower quality and smaller dimensions
        const attempts = [
          { maxWidth: 1920, quality: 0.7 },
          { maxWidth: 1280, quality: 0.6 },
          { maxWidth: 1024, quality: 0.5 },
          { maxWidth: 800,  quality: 0.4 },
          { maxWidth: 640,  quality: 0.3 },
        ];

        for (const { maxWidth, quality } of attempts) {
          base64 = await compressImage(base64, maxWidth, quality);
          if (base64.length <= MAX_MOTIVATION_SIZE) break;
        }

        if (base64.length > MAX_MOTIVATION_SIZE) {
          toast.error("Image is too large even after compression. Please use a smaller image.");
          return;
        }
      }

      await updateUserProfile(uid, { motivationImageBase64: base64 });
      await refreshProfile();
      toast.success("Motivation board updated!");
    } catch (error) {
      console.error("Error uploading motivation image:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile?.motivationImageBase64) return;
    try {
      await updateUserProfile(uid, { motivationImageBase64: "" });
      await refreshProfile();
      toast.success("Motivation photo removed.");
    } catch (error) {
      console.error("Error removing motivation image:", error);
      toast.error("Failed to remove image.");
    }
  };

  const hasImage = !!userProfile?.motivationImageBase64;

  return (
    <div className="relative group rounded-2xl border border-[#E8E8ED] shadow-sm bg-white overflow-hidden w-full h-48 sm:h-56 mt-4">
      {isUploading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#0071E3]" />
          <p className="text-xs text-[#86868B]">Uploading & compressing...</p>
        </div>
      ) : hasImage ? (
        <div 
          className="relative w-full h-full cursor-pointer" 
          onClick={() => fileInputRef.current?.click()}
        >
           <img 
             src={userProfile.motivationImageBase64} 
             alt="Motivation Board" 
             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
           />
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
           
           <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
             <h3 className="text-white font-medium text-sm drop-shadow-md">Motivation Board</h3>
             <button 
               onClick={handleRemove} 
               className="text-white/80 hover:text-white bg-black/30 p-1.5 rounded-lg backdrop-blur-sm transition-colors cursor-pointer"
               title="Remove Photo"
             >
               <X className="w-4 h-4" />
             </button>
           </div>
        </div>
      ) : (
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-gray-100">
            <ImagePlus className="w-6 h-6 text-[#0071E3]" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium text-[#1D1D1F]">Motivation Board</p>
            <p className="text-xs text-[#86868B] mt-1 max-w-[240px] mx-auto">
              Upload a photo of your dream company, dream city, or anything that keeps you motivated.
            </p>
          </div>
        </button>
      )}

      <input 
        type="file" 
        accept="image/png, image/jpeg, image/webp" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
    </div>
  );
}
