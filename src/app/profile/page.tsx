"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile } from "@/lib/firestore";
import { fileToBase64 } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Camera, User, Plus, X } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";

export default function ProfilePage() {
  const { user, userProfile, refreshProfile, loading } = useAuth();
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [gdrive, setGdrive] = useState("");
  const [customLinks, setCustomLinks] = useState<{ label: string; url: string }[]>([]);
  const [photoBase64, setPhotoBase64] = useState("");
  const [graduationDate, setGraduationDate] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || user?.displayName || "");
      setPhone(userProfile.phone || "");
      setPortfolio(userProfile.portfolio || "");
      setGithub(userProfile.github || "");
      setLinkedin(userProfile.linkedin || "");
      setGdrive(userProfile.gdrive || "");
      setCustomLinks(userProfile.customLinks || []);
      setPhotoBase64(userProfile.photoBase64 || "");
      setGraduationDate(userProfile.graduationDate || "");
    } else if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [userProfile, user]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 900KB)
    if (file.size > 900 * 1024) {
      toast.error("Image must be smaller than 900KB to save in database.");
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setPhotoBase64(base64);
      toast.success("Photo uploaded! Click save to keep changes.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to read image file.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Remove empty custom links before saving
    const validCustomLinks = customLinks.filter(link => link.label.trim() !== "" || link.url.trim() !== "");

    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName,
        phone,
        portfolio,
        github,
        linkedin,
        gdrive,
        customLinks: validCustomLinks,
        photoBase64,
        graduationDate,
      });
      await refreshProfile();
      toast.success("Profile saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCustomLink = () => {
    setCustomLinks([...customLinks, { label: "", url: "" }]);
  };

  const handleRemoveCustomLink = (index: number) => {
    const newLinks = [...customLinks];
    newLinks.splice(index, 1);
    setCustomLinks(newLinks);
  };

  const handleCustomLinkChange = (index: number, field: "label" | "url", value: string) => {
    const newLinks = [...customLinks];
    newLinks[index][field] = value;
    setCustomLinks(newLinks);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0071E3]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 pb-24">
        <Card className="border-0 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-[#E8E8ED] pb-6">
            <CardTitle className="text-2xl font-semibold text-[#1D1D1F]">
              Edit Profile
            </CardTitle>
            <p className="text-[#86868B] text-sm mt-1">
              Customize your identity and job-hunting contact details.
            </p>
          </CardHeader>
          <CardContent className="bg-white pt-6">
            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 pb-6 border-b border-[#E8E8ED]">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-[#F5F5F7] border border-[#E8E8ED] flex items-center justify-center shadow-inner">
                    {photoBase64 ? (
                      <img src={photoBase64} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-[#86868B]" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="text-center sm:text-left flex-1 space-y-2 pt-2">
                  <h3 className="font-medium text-[#1D1D1F]">Profile Photo</h3>
                  <p className="text-sm text-[#86868B]">
                    Upload a professional photo. Max size 900KB.
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-8 text-xs font-medium mt-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Photo
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp" 
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-[#1D1D1F] text-sm font-medium">Full Name / Nickname</Label>
                  <Input 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    className="h-11 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#1D1D1F] text-sm font-medium">Phone Number</Label>
                  <Input 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62 812 3456 7890"
                    className="h-11 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#1D1D1F] text-sm font-medium">Portfolio URL</Label>
                  <Input 
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    placeholder="https://myportfolio.com"
                    type="url"
                    className="h-11 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#1D1D1F] text-sm font-medium">GitHub URL</Label>
                  <Input 
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/username"
                    type="url"
                    className="h-11 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#1D1D1F] text-sm font-medium">LinkedIn URL</Label>
                  <Input 
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    type="url"
                    className="h-11 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#1D1D1F] text-sm font-medium">Google Drive URL</Label>
                  <Input 
                    value={gdrive}
                    onChange={(e) => setGdrive(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    type="url"
                    className="h-11 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Custom Links Section */}
              <div className="pt-4 border-t border-[#E8E8ED] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[#1D1D1F] text-sm font-medium">Custom Links</Label>
                    <p className="text-xs text-[#86868B] mt-0.5">Add other important links (e.g., Behance, Medium, Twitter)</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleAddCustomLink}
                    className="h-8 text-xs rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Link
                  </Button>
                </div>
                
                {customLinks.length > 0 && (
                  <div className="space-y-3">
                    {customLinks.map((link, index) => (
                      <div key={index} className="flex items-start gap-2 sm:gap-3 bg-[#F5F5F7] p-3 rounded-xl border border-[#E8E8ED]">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <Input 
                            placeholder="Label (e.g. Medium)" 
                            value={link.label}
                            onChange={(e) => handleCustomLinkChange(index, "label", e.target.value)}
                            className="h-9 text-sm bg-white border-[#E8E8ED] focus:border-[#0071E3] transition-all"
                          />
                          <Input 
                            placeholder="URL (https://...)" 
                            type="url"
                            value={link.url}
                            onChange={(e) => handleCustomLinkChange(index, "url", e.target.value)}
                            className="h-9 text-sm bg-white border-[#E8E8ED] focus:border-[#0071E3] transition-all"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveCustomLink(index)}
                          className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-[#E8E8ED]">
                <Label className="text-[#1D1D1F] text-sm font-medium">Graduation Date</Label>
                <p className="text-xs text-[#86868B] -mt-1">Used to calculate how long since you graduated (unemployment counter on dashboard).</p>
                <Input 
                  type="date"
                  value={graduationDate}
                  onChange={(e) => setGraduationDate(e.target.value)}
                  className="h-11 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 transition-all max-w-xs"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 h-11 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium shadow-lg shadow-blue-500/20 transition-all duration-200"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Save Profile
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
