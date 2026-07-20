"use client";

import { useState, useRef, useEffect } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { updateUserProfile } from "@/lib/firestore";
import { uploadMotivationImage, getMotivationImageUrl } from "@/lib/storage";
import type { UserProfile } from "@/types";
import { toast } from "sonner";

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
  const [resolvedImageUrl, setResolvedImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support both old base64 and new URL format
  const imageSource = userProfile?.motivationImageUrl || userProfile?.motivationImageBase64 || "";
  const hasImage = !!imageSource;

  useEffect(() => {
    async function loadImg() {
      if (!imageSource) {
        setResolvedImageUrl("");
        return;
      }
      try {
        const url = await getMotivationImageUrl(imageSource);
        setResolvedImageUrl(url);
      } catch (e) {
        console.error("Error resolving motivation image:", e);
      }
    }
    loadImg();
  }, [imageSource]);

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

      // Upload to Firestore chunks, get firestore:// URL
      const url = await uploadMotivationImage(uid, file);

      // Save only the URL in Firestore (not the image data)
      await updateUserProfile(uid, { motivationImageUrl: url, motivationImageBase64: "" });
      await refreshProfile();
      toast.success("Motivation board updated!");
    } catch (error) {
      console.error("Error uploading motivation image:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload image. Please try again."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasImage) return;
    try {
      await updateUserProfile(uid, { motivationImageUrl: "", motivationImageBase64: "" });
      await refreshProfile();
      toast.success("Motivation photo removed.");
    } catch (error) {
      console.error("Error removing motivation image:", error);
      toast.error("Failed to remove image.");
    }
  };

  return (
    <div className="relative group rounded-2xl border border-[#E8E8ED] shadow-sm bg-white overflow-hidden w-full h-48 sm:h-56 mt-4">
      {isUploading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#0071E3]" />
          <p className="text-xs text-[#86868B]">Uploading...</p>
        </div>
      ) : hasImage ? (
        <div 
          className="relative w-full h-full cursor-pointer" 
          onClick={() => fileInputRef.current?.click()}
        >
           {resolvedImageUrl ? (
             <img 
               src={resolvedImageUrl} 
               alt="Motivation Board" 
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
               referrerPolicy="no-referrer"
             />
           ) : (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
               <Loader2 className="w-6 h-6 animate-spin text-[#0071E3]" />
             </div>
           )}
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
