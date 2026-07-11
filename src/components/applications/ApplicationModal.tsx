"use client";

import { useState, useEffect, useRef } from "react";
import type { Application, ApplicationStatus, Evaluation, JobType, WorkArrangement } from "@/types";
import { APPLICATION_STATUSES, PRIORITIES, JOB_TYPES, WORK_ARRANGEMENTS } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EvaluationForm from "./EvaluationForm";
import { Loader2, Upload, FileText, Download, X } from "lucide-react";
import { downloadCvFile } from "@/lib/storage";

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application?: Application | null;
  onSave: (data: Omit<Application, "id" | "dateUpdated">, cvFile?: File) => Promise<void>;
  onSaveEvaluation: (
    applicationId: string,
    evaluation: Evaluation
  ) => Promise<void>;
}

export default function ApplicationModal({
  isOpen,
  onClose,
  application,
  onSave,
  onSaveEvaluation,
}: ApplicationModalProps) {
  const isEditing = !!application;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("Saved");
  const [dateApplied, setDateApplied] = useState("");
  const [deadline, setDeadline] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [cvVersion, setCvVersion] = useState("");
  const [priority, setPriority] = useState("");
  const [jobType, setJobType] = useState<JobType | "">("");
  const [workArrangement, setWorkArrangement] = useState<WorkArrangement | "">("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [existingCvUrl, setExistingCvUrl] = useState("");
  const [existingCvName, setExistingCvName] = useState("");

  useEffect(() => {
    if (application) {
      setCompany(application.company);
      setPosition(application.position);
      setLocation(application.location || "");
      setStatus(application.status);
      setDateApplied(application.dateApplied);
      setDeadline(application.deadline || "");
      setJobLink(application.jobLink || "");
      setCvVersion(application.cvVersion || "");
      setPriority(application.priority || "");
      setJobType(application.jobType || "");
      setWorkArrangement(application.workArrangement || "");
      setNotes(application.notes || "");
      setExistingCvUrl(application.cvFileUrl || "");
      setExistingCvName(application.cvFileName || "");
      setCvFile(null);
      if (application.status === "Rejected" && !application.evaluation) {
        setActiveTab("evaluation");
      } else {
        setActiveTab("details");
      }
    } else {
      setCompany("");
      setPosition("");
      setLocation("");
      setStatus("Saved");
      setDateApplied(new Date().toISOString().split("T")[0]);
      setDeadline("");
      setJobLink("");
      setCvVersion("");
      setPriority("");
      setJobType("");
      setWorkArrangement("");
      setNotes("");
      setExistingCvUrl("");
      setExistingCvName("");
      setCvFile(null);
      setActiveTab("details");
    }
  }, [application, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a PDF or Word document.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be under 10MB.");
        return;
      }
      setCvFile(file);
    }
  };

  const handleSave = async () => {
    if (!company || !position || !dateApplied) return;
    setIsSaving(true);
    try {
      const data: Record<string, unknown> = {
        company,
        position,
        location: location || "",
        status,
        dateApplied,
        deadline: status === "Saved" ? deadline : "",
        jobLink: jobLink || "",
        cvVersion: cvVersion || "",
        priority: priority || "",
        jobType: jobType || "",
        workArrangement: workArrangement || "",
        notes: notes || "",
        cvFileUrl: existingCvUrl || "",
        cvFileName: existingCvName || "",
      };
      if (application?.evaluation) {
        data.evaluation = application.evaluation;
      }
      await onSave(
        data as unknown as Omit<Application, "id" | "dateUpdated">,
        cvFile || undefined
      );
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEvaluation = async (evaluation: Evaluation) => {
    if (application) {
      await onSaveEvaluation(application.id, evaluation);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] rounded-2xl p-0 gap-0 border-0 shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-lg font-semibold text-[#1D1D1F]">
            {isEditing ? `Edit — ${application.company}` : "New Application"}
          </DialogTitle>
        </DialogHeader>

        {isEditing && status === "Rejected" ? (
          <Tabs value={activeTab} onValueChange={(v) => v && setActiveTab(v)} className="w-full">
            <div className="px-6">
              <TabsList className="w-full rounded-xl bg-[#F5F5F7] p-1">
                <TabsTrigger
                  value="details"
                  className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm cursor-pointer"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="evaluation"
                  className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm cursor-pointer"
                >
                  Evaluation
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="details" className="p-6 pt-4 mt-0">
              <FormFields
                company={company} setCompany={setCompany}
                position={position} setPosition={setPosition}
                location={location} setLocation={setLocation}
                status={status} setStatus={setStatus}
                dateApplied={dateApplied} setDateApplied={setDateApplied}
                deadline={deadline} setDeadline={setDeadline}
                jobLink={jobLink} setJobLink={setJobLink}
                cvVersion={cvVersion} setCvVersion={setCvVersion}
                priority={priority} setPriority={setPriority}
                jobType={jobType} setJobType={setJobType}
                workArrangement={workArrangement} setWorkArrangement={setWorkArrangement}
                notes={notes} setNotes={setNotes}
                isSaving={isSaving} onSave={handleSave}
                cvFile={cvFile} existingCvUrl={existingCvUrl}
                existingCvName={existingCvName}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
                onRemoveFile={() => { setCvFile(null); setExistingCvUrl(""); setExistingCvName(""); }}
              />
            </TabsContent>
            <TabsContent value="evaluation" className="p-6 pt-4 mt-0">
              <EvaluationForm
                evaluation={application.evaluation}
                onSave={handleSaveEvaluation}
                companyName={application.company}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-6 pt-0">
            <FormFields
              company={company} setCompany={setCompany}
              position={position} setPosition={setPosition}
              location={location} setLocation={setLocation}
              status={status} setStatus={setStatus}
              dateApplied={dateApplied} setDateApplied={setDateApplied}
              deadline={deadline} setDeadline={setDeadline}
              jobLink={jobLink} setJobLink={setJobLink}
              cvVersion={cvVersion} setCvVersion={setCvVersion}
              priority={priority} setPriority={setPriority}
              jobType={jobType} setJobType={setJobType}
              workArrangement={workArrangement} setWorkArrangement={setWorkArrangement}
              notes={notes} setNotes={setNotes}
              isSaving={isSaving} onSave={handleSave}
              cvFile={cvFile} existingCvUrl={existingCvUrl}
              existingCvName={existingCvName}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onRemoveFile={() => { setCvFile(null); setExistingCvUrl(""); setExistingCvName(""); }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface FormFieldsProps {
  company: string; setCompany: (v: string) => void;
  position: string; setPosition: (v: string) => void;
  location: string; setLocation: (v: string) => void;
  status: ApplicationStatus; setStatus: (v: ApplicationStatus) => void;
  dateApplied: string; setDateApplied: (v: string) => void;
  deadline: string; setDeadline: (v: string) => void;
  jobLink: string; setJobLink: (v: string) => void;
  cvVersion: string; setCvVersion: (v: string) => void;
  priority: string; setPriority: (v: string) => void;
  jobType: JobType | ""; setJobType: (v: JobType | "") => void;
  workArrangement: WorkArrangement | ""; setWorkArrangement: (v: WorkArrangement | "") => void;
  notes: string; setNotes: (v: string) => void;
  isSaving: boolean; onSave: () => void;
  cvFile: File | null;
  existingCvUrl: string;
  existingCvName: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}

function FormFields({
  company, setCompany, position, setPosition, location, setLocation,
  status, setStatus, dateApplied, setDateApplied,
  deadline, setDeadline,
  jobLink, setJobLink, cvVersion, setCvVersion,
  priority, setPriority, jobType, setJobType, workArrangement, setWorkArrangement, notes, setNotes,
  isSaving, onSave, cvFile, existingCvUrl, existingCvName,
  fileInputRef, onFileChange, onRemoveFile,
}: FormFieldsProps) {
  const isFileOverOneMB = cvFile ? cvFile.size > 1 * 1024 * 1024 : false;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1D1D1F]">Company *</Label>
          <Input
            placeholder="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1D1D1F]">Position *</Label>
          <Input
            placeholder="Role applied for"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1D1D1F]">Location</Label>
          <Input
            placeholder="e.g., Jakarta, Singapore, or Remote"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1D1D1F]">Work Arrangement</Label>
          <Select value={workArrangement} onValueChange={(v) => setWorkArrangement(v as WorkArrangement)}>
            <SelectTrigger className="rounded-xl border-[#E8E8ED]">
              <SelectValue placeholder="Select arrangement (optional)" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {WORK_ARRANGEMENTS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1D1D1F]">Status *</Label>
          <Select value={status} onValueChange={(v) => v && setStatus(v as ApplicationStatus)}>
            <SelectTrigger className="rounded-xl border-[#E8E8ED]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {APPLICATION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1D1D1F]">
            {status === "Saved" ? "Date Saved *" : "Date Applied *"}
          </Label>
          <Input
            type="date"
            value={dateApplied}
            onChange={(e) => setDateApplied(e.target.value)}
            className="rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20"
            required
          />
        </div>
      </div>

      {status === "Saved" && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#1D1D1F]">Deadline / Last Apply Date *</Label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20"
            required
          />
        </div>
      )}

      <Separator className="my-2" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#86868B]">Job Link</Label>
          <Input
            type="url"
            placeholder="https://..."
            value={jobLink}
            onChange={(e) => setJobLink(e.target.value)}
            className="rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#86868B]">CV Version</Label>
          <Input
            placeholder='e.g., "CV Tech v3"'
            value={cvVersion}
            onChange={(e) => setCvVersion(e.target.value)}
            className="rounded-xl border-[#E8E8ED] focus:border-[#0071E3] focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* CV Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#86868B]">CV File (PDF or Word)</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onFileChange}
          className="hidden"
        />
        {cvFile ? (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <FileText className="w-5 h-5 text-[#0071E3] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1D1D1F] break-words">{cvFile.name}</p>
              <p className="text-xs text-[#86868B]">
                {(cvFile.size / 1024).toFixed(0)} KB — Ready to upload
                {isFileOverOneMB && (
                  <span className="text-amber-600 font-medium"> • Will be auto-compressed</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onRemoveFile}
              className="p-1 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-[#86868B]" />
            </button>
          </div>
        ) : existingCvUrl ? (
          <div className="flex items-center gap-3 p-3 bg-[#F5F5F7] rounded-xl border border-[#E8E8ED]">
            <FileText className="w-5 h-5 text-[#0071E3] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1D1D1F] break-words">{existingCvName}</p>
              <p className="text-xs text-[#86868B]">Uploaded</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); downloadCvFile(existingCvUrl, existingCvName); }}
              className="p-1.5 hover:bg-[#E8E8ED] rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#0071E3]" />
            </button>
            <button
              type="button"
              onClick={onRemoveFile}
              className="p-1 hover:bg-[#E8E8ED] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-[#86868B]" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-[#E8E8ED] rounded-xl text-sm text-[#86868B] hover:border-[#0071E3] hover:text-[#0071E3] hover:bg-blue-50/50 transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Upload CV (PDF or Word)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#86868B]">Job Type</Label>
          <Select value={jobType} onValueChange={(v) => setJobType(v as JobType)}>
            <SelectTrigger className="rounded-xl border-[#E8E8ED]">
              <SelectValue placeholder="Select type (optional)" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {JOB_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-[#86868B]">Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v ?? "")}>
            <SelectTrigger className="rounded-xl border-[#E8E8ED]">
              <SelectValue placeholder="Select priority (optional)" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium text-[#86868B]">Quick Notes</Label>
        <Textarea
          placeholder="Additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-xl border-[#E8E8ED] min-h-[70px] resize-none focus:border-[#0071E3] focus:ring-blue-500/20"
        />
      </div>

      <Button
        onClick={onSave}
        disabled={!company || !position || !dateApplied || (status === "Saved" && !deadline) || isSaving}
        className="w-full h-11 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium shadow-lg shadow-blue-500/15 transition-all cursor-pointer"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save
      </Button>
    </div>
  );
}
