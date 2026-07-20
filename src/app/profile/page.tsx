"use client";

import { useEffect, useState, useRef, useCallback, type KeyboardEvent } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserProfile, getApplications } from "@/lib/firestore";
import { fileToBase64 } from "@/lib/storage";
import { calculateStorageUsage } from "@/lib/storage-calc";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import StorageBar from "@/components/profile/StorageBar";
import {
  Loader2, Camera, User, Plus, X,
  MapPin, Cake, Brain, Star, Briefcase, CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import type { Application, SkillCategory, LastPosition, StorageUsage } from "@/types";
import { MBTI_TYPES, DEFAULT_SKILL_CATEGORIES, STORAGE_LIMIT_BYTES } from "@/types";

export default function ProfilePage() {
  const { user, userProfile, refreshProfile, loading } = useAuth();
  const router = useRouter();

  // Existing fields
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [gdrive, setGdrive] = useState("");
  const [customLinks, setCustomLinks] = useState<{ label: string; url: string }[]>([]);
  const [photoBase64, setPhotoBase64] = useState("");
  const [graduationDate, setGraduationDate] = useState("");

  // New fields
  const [professionalSummary, setProfessionalSummary] = useState("");
  const [skills, setSkills] = useState<SkillCategory[]>([]);
  const [lastPosition, setLastPosition] = useState<LastPosition>({ company: "", position: "", endDate: "" });
  const [currentLocation, setCurrentLocation] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [mbti, setMbti] = useState("");
  const [dreamPosition, setDreamPosition] = useState("");

  // Skill input tracking
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

  // Storage
  const [storageUsage, setStorageUsage] = useState<StorageUsage>({
    applications: 0, cvFiles: 0, evaluations: 0, profileData: 0,
    total: 0, limit: STORAGE_LIMIT_BYTES,
  });

  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  // Load profile data
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
      setProfessionalSummary(userProfile.professionalSummary || "");
      setCurrentLocation(userProfile.currentLocation || "");
      setDateOfBirth(userProfile.dateOfBirth || "");
      setMbti(userProfile.mbti || "");
      setDreamPosition(userProfile.dreamPosition || "");
      setLastPosition(userProfile.lastPosition || { company: "", position: "", endDate: "" });

      // Initialize skills with defaults if empty
      if (userProfile.skills && userProfile.skills.length > 0) {
        setSkills(userProfile.skills);
      } else {
        setSkills(DEFAULT_SKILL_CATEGORIES.map((name) => ({ name, skills: [] })));
      }
    } else if (user) {
      setDisplayName(user.displayName || "");
      setSkills(DEFAULT_SKILL_CATEGORIES.map((name) => ({ name, skills: [] })));
    }
  }, [userProfile, user]);

  // Load storage usage
  const loadStorageUsage = useCallback(async () => {
    if (!user) return;
    try {
      const apps = await getApplications(user.uid);
      const usage = await calculateStorageUsage(apps, userProfile);
      setStorageUsage(usage);
    } catch (error) {
      console.error("Error calculating storage:", error);
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (user) loadStorageUsage();
  }, [user, loadStorageUsage]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

    const validCustomLinks = customLinks.filter(
      (link) => link.label.trim() !== "" || link.url.trim() !== ""
    );

    // Filter out empty skill categories
    const validSkills = skills
      .map((cat) => ({ ...cat, skills: cat.skills.filter((s) => s.trim() !== "") }))
      .filter((cat) => cat.name.trim() !== "");

    // Build last position (only save if at least company is filled)
    const validLastPosition =
      lastPosition.company.trim() ? lastPosition : undefined;

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
        professionalSummary,
        skills: validSkills,
        lastPosition: validLastPosition as LastPosition | undefined,
        currentLocation,
        dateOfBirth,
        mbti,
        dreamPosition,
      });
      await refreshProfile();
      await loadStorageUsage();
      toast.success("Profile saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Custom Links ---
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

  // --- Skills ---
  const handleAddSkill = (categoryIndex: number) => {
    const categoryName = skills[categoryIndex].name;
    const input = (skillInputs[categoryName] || "").trim();
    if (!input) return;
    // Prevent duplicates
    if (skills[categoryIndex].skills.includes(input)) {
      toast.error(`"${input}" already exists in ${categoryName}`);
      return;
    }
    const updated = [...skills];
    updated[categoryIndex] = {
      ...updated[categoryIndex],
      skills: [...updated[categoryIndex].skills, input],
    };
    setSkills(updated);
    setSkillInputs({ ...skillInputs, [categoryName]: "" });
  };

  const handleRemoveSkill = (categoryIndex: number, skillIndex: number) => {
    const updated = [...skills];
    updated[categoryIndex] = {
      ...updated[categoryIndex],
      skills: updated[categoryIndex].skills.filter((_, i) => i !== skillIndex),
    };
    setSkills(updated);
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>, categoryIndex: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill(categoryIndex);
    }
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (skills.some((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
      toast.error(`Category "${name}" already exists`);
      return;
    }
    setSkills([...skills, { name, skills: [] }]);
    setNewCategoryName("");
    setShowNewCategoryInput(false);
  };

  const handleRemoveCategory = (index: number) => {
    const cat = skills[index];
    // Don't allow removing default categories if they have skills
    if (
      (DEFAULT_SKILL_CATEGORIES as readonly string[]).includes(cat.name) &&
      cat.skills.length > 0
    ) {
      toast.error("Clear all skills first before removing a default category");
      return;
    }
    const updated = [...skills];
    updated.splice(index, 1);
    setSkills(updated);
  };

  // --- Birthday display ---
  const birthdayDisplay = (() => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth + "T00:00:00");
    if (isNaN(dob.getTime())) return null;
    const day = dob.getDate();
    const month = dob.toLocaleDateString("id-ID", { month: "long" });
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    const isBirthdayToday =
      today.getDate() === dob.getDate() && today.getMonth() === dob.getMonth();
    return { day, month, age, isBirthdayToday };
  })();

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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 pb-24">
        <Card className="border-0 shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-white border-b border-[#E8E8ED] px-6 sm:px-8 py-6">
            <h1 className="text-2xl font-semibold text-[#1D1D1F]">Edit Profile</h1>
            <p className="text-[#86868B] text-sm mt-1">
              Customize your identity, skills, and job-hunting details.
            </p>
          </div>

          <CardContent className="bg-white px-6 sm:px-8 pt-6 pb-8">
            <form onSubmit={handleSave} className="space-y-6">

              {/* ============ ROW 1: Photo + Identity ============ */}
              <div className="flex flex-col lg:flex-row gap-6 pb-6 border-b border-[#E8E8ED]">
                {/* Photo */}
                <div className="flex items-start gap-4 shrink-0">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-[#F5F5F7] border border-[#E8E8ED] flex items-center justify-center shadow-inner">
                      {photoBase64 ? (
                        <img src={photoBase64} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-[#86868B]" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="pt-1">
                    <p className="text-xs text-[#86868B]">Max 900KB</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 text-xs font-medium mt-1.5 cursor-pointer"
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

                {/* Identity fields grid */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[#1D1D1F] text-xs font-medium">Full Name</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="John Doe"
                      className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#1D1D1F] text-xs font-medium">Phone</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+62 812 3456 7890"
                      className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#1D1D1F] text-xs font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </Label>
                    <Input
                      value={currentLocation}
                      onChange={(e) => setCurrentLocation(e.target.value)}
                      placeholder="Jakarta, Indonesia"
                      className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#1D1D1F] text-xs font-medium flex items-center gap-1">
                      <Cake className="w-3 h-3" /> Date of Birth
                    </Label>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                    />
                    {birthdayDisplay && (
                      <p className="text-[10px] text-[#86868B] mt-0.5">
                        {birthdayDisplay.isBirthdayToday ? "🎂 " : "🎂 "}
                        {birthdayDisplay.day} {birthdayDisplay.month} · {birthdayDisplay.age} tahun
                        {birthdayDisplay.isBirthdayToday && (
                          <span className="text-amber-500 font-semibold ml-1">🎉 Happy Birthday!</span>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#1D1D1F] text-xs font-medium flex items-center gap-1">
                      <Brain className="w-3 h-3" /> MBTI
                    </Label>
                    <Select value={mbti} onValueChange={(v) => setMbti(v ?? "")}>
                      <SelectTrigger className="h-10 rounded-xl border-[#E8E8ED] text-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {MBTI_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#1D1D1F] text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" /> Dream Position
                    </Label>
                    <Input
                      value={dreamPosition}
                      onChange={(e) => setDreamPosition(e.target.value)}
                      placeholder="e.g., Product Manager at Google"
                      className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* ============ ROW 2: Professional Summary ============ */}
              <div className="space-y-2 pb-6 border-b border-[#E8E8ED]">
                <div className="flex items-baseline justify-between">
                  <Label className="text-[#1D1D1F] text-sm font-medium">Professional Summary</Label>
                  <span className={`text-xs tabular-nums ${
                    professionalSummary.length > 950
                      ? "text-red-500 font-semibold"
                      : professionalSummary.length > 800
                        ? "text-amber-500"
                        : "text-[#86868B]"
                  }`}>
                    {professionalSummary.length}/1000
                  </span>
                </div>
                <Textarea
                  value={professionalSummary}
                  onChange={(e) => {
                    if (e.target.value.length <= 1000) {
                      setProfessionalSummary(e.target.value);
                    }
                  }}
                  placeholder="Write a brief professional summary highlighting your experience, goals, and key strengths..."
                  className="rounded-xl border-[#E8E8ED] min-h-[100px] resize-none focus:border-[#0071E3] focus:ring-blue-500/20 text-sm leading-relaxed"
                />
              </div>

              {/* ============ ROW 3: Last Position + Dates ============ */}
              <div className="pb-6 border-b border-[#E8E8ED]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Last Position */}
                  <div className="space-y-3">
                    <Label className="text-[#1D1D1F] text-sm font-medium flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> Last Position
                    </Label>
                    <p className="text-xs text-[#86868B] -mt-2">
                      Your most recent job — used to calculate days since last position on dashboard.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        value={lastPosition.company}
                        onChange={(e) => setLastPosition({ ...lastPosition, company: e.target.value })}
                        placeholder="Company"
                        className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                      />
                      <Input
                        value={lastPosition.position}
                        onChange={(e) => setLastPosition({ ...lastPosition, position: e.target.value })}
                        placeholder="Position / Role"
                        className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                      />
                      <Input
                        type="date"
                        value={lastPosition.endDate}
                        onChange={(e) => setLastPosition({ ...lastPosition, endDate: e.target.value })}
                        className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                      />
                    </div>
                  </div>

                  {/* Graduation Date */}
                  <div className="space-y-3">
                    <Label className="text-[#1D1D1F] text-sm font-medium flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" /> Graduation Date
                    </Label>
                    <p className="text-xs text-[#86868B] -mt-2">
                      Used for the unemployment day counter on your dashboard.
                    </p>
                    <Input
                      type="date"
                      value={graduationDate}
                      onChange={(e) => setGraduationDate(e.target.value)}
                      className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm max-w-xs"
                    />
                  </div>
                </div>
              </div>

              {/* ============ ROW 4: Skills ============ */}
              <div className="space-y-4 pb-6 border-b border-[#E8E8ED]">
                <div className="flex items-center justify-between">
                  <Label className="text-[#1D1D1F] text-sm font-medium">Skills</Label>
                  {!showNewCategoryInput && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewCategoryInput(true)}
                      className="h-7 text-xs rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Category
                    </Button>
                  )}
                </div>

                {/* Add new category input */}
                {showNewCategoryInput && (
                  <div className="flex items-center gap-2 bg-[#F5F5F7] p-3 rounded-xl border border-[#E8E8ED]">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name..."
                      className="h-8 text-sm flex-1 bg-white"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCategory}
                      className="h-8 text-xs rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white cursor-pointer"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => { setShowNewCategoryInput(false); setNewCategoryName(""); }}
                      className="h-8 w-8 text-[#86868B] hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}

                {/* Skill categories grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skills.map((category, catIdx) => (
                    <div
                      key={category.name}
                      className="bg-[#F9F9FB] rounded-xl border border-[#E8E8ED] p-3 space-y-2.5"
                    >
                      {/* Category header */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wide">
                          {category.name}
                        </h4>
                        {!(DEFAULT_SKILL_CATEGORIES as readonly string[]).includes(category.name) && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(catIdx)}
                            className="p-0.5 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3 text-[#86868B] hover:text-red-500" />
                          </button>
                        )}
                      </div>

                      {/* Skill chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {category.skills.map((skill, skillIdx) => (
                          <span
                            key={skillIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg text-xs font-medium text-[#1D1D1F] border border-[#E8E8ED] shadow-sm group"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(catIdx, skillIdx)}
                              className="opacity-50 group-hover:opacity-100 hover:text-red-500 transition-opacity cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Skill input */}
                      <div className="flex gap-1.5">
                        <Input
                          value={skillInputs[category.name] || ""}
                          onChange={(e) =>
                            setSkillInputs({ ...skillInputs, [category.name]: e.target.value })
                          }
                          onKeyDown={(e) => handleSkillKeyDown(e, catIdx)}
                          placeholder="Type + Enter"
                          className="h-8 text-xs flex-1 bg-white border-[#E8E8ED] focus:border-[#0071E3] rounded-lg"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddSkill(catIdx)}
                          className="h-8 w-8 p-0 text-[#0071E3] hover:bg-blue-50 cursor-pointer shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ============ ROW 5: Links (4-col grid) ============ */}
              <div className="pb-6 border-b border-[#E8E8ED]">
                <Label className="text-[#1D1D1F] text-sm font-medium mb-3 block">Links</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[#86868B] text-xs">Portfolio</Label>
                    <Input
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="https://myportfolio.com"
                      type="url"
                      className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#86868B] text-xs">GitHub</Label>
                    <Input
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/username"
                      type="url"
                      className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#86868B] text-xs">LinkedIn</Label>
                    <Input
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      type="url"
                      className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#86868B] text-xs">Google Drive</Label>
                    <Input
                      value={gdrive}
                      onChange={(e) => setGdrive(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      type="url"
                      className="h-10 rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* ============ ROW 6: Custom Links ============ */}
              <div className="pb-6 border-b border-[#E8E8ED] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[#1D1D1F] text-sm font-medium">Custom Links</Label>
                    <p className="text-xs text-[#86868B] mt-0.5">Behance, Medium, Twitter, etc.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomLink}
                    className="h-7 text-xs rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Link
                  </Button>
                </div>

                {customLinks.length > 0 && (
                  <div className="space-y-2">
                    {customLinks.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-[#F5F5F7] p-2.5 rounded-xl border border-[#E8E8ED]"
                      >
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            placeholder="Label (e.g. Medium)"
                            value={link.label}
                            onChange={(e) => handleCustomLinkChange(index, "label", e.target.value)}
                            className="h-9 text-sm bg-white border-[#E8E8ED] focus:border-[#0071E3]"
                          />
                          <Input
                            placeholder="URL (https://...)"
                            type="url"
                            value={link.url}
                            onChange={(e) => handleCustomLinkChange(index, "url", e.target.value)}
                            className="h-9 text-sm bg-white border-[#E8E8ED] focus:border-[#0071E3]"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCustomLink(index)}
                          className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0 rounded-lg cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ============ ROW 7: Storage Usage (iOS Bar) ============ */}
              <div className="pb-6 border-b border-[#E8E8ED]">
                <StorageBar usage={storageUsage} />
              </div>

              {/* ============ Save Button ============ */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 h-11 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium shadow-lg shadow-blue-500/20 transition-all duration-200 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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
