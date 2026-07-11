"use client";

import { useState, useRef } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateUserProfile } from "@/lib/firestore";
import type { UserProfile } from "@/types";

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const storageRef = ref(storage, `users/${uid}/motivation/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await updateUserProfile(uid, { motivationImageUrl: url });
      await refreshProfile();
    } catch (error) {
      console.error("Error uploading motivation image:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile?.motivationImageUrl) return;
    try {
      await updateUserProfile(uid, { motivationImageUrl: "" });
      await refreshProfile();
    } catch (error) {
      console.error("Error removing motivation image:", error);
    }
  };

  return (
    <div className="relative group rounded-2xl border border-[#E8E8ED] shadow-sm bg-white overflow-hidden w-full h-48 sm:h-56 mt-4">
      {isUploading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#0071E3]" />
        </div>
      ) : userProfile?.motivationImageUrl ? (
        <div 
          className="relative w-full h-full cursor-pointer" 
          onClick={() => fileInputRef.current?.click()}
        >
           <img 
             src={userProfile.motivationImageUrl} 
             alt="Motivation Board" 
             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
           />
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
           
           <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
             <h3 className="text-white font-medium text-sm drop-shadow-md">Motivation Board</h3>
             <button 
               onClick={handleRemove} 
               className="text-white/80 hover:text-white bg-black/30 p-1.5 rounded-lg backdrop-blur-sm transition-colors"
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
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
    </div>
  );
}
