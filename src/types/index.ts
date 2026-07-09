// ============================================
// Job Tracker MVP — TypeScript Types & Enums
// ============================================

export const APPLICATION_STATUSES = [
  "Saved",
  "Applied",
  "Administrasi",
  "Tes Online",
  "Tes Psikotes",
  "Tes Tulis",
  "Wawancara HR",
  "Tes Technical",
  "Wawancara User/Technical",
  "Presentasi Pitch Deck",
  "FGD / LGD",
  "Wawancara Final",
  "Medical Check Up",
  "Offering Letter",
  "Ghosted",
  "Rejected",
  "On Hold",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const FUNNEL_STAGES = [
  "Saved",
  "Applied",
  "Administrasi",
  "Tes Online",
  "Tes Psikotes",
  "Tes Tulis",
  "Wawancara HR",
  "Tes Technical",
  "Wawancara User/Technical",
  "Presentasi Pitch Deck",
  "FGD / LGD",
  "Wawancara Final",
  "Medical Check Up",
  "Offering Letter",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const REJECTION_STAGES = [
  "Administrasi",
  "Tes Online",
  "Tes Psikotes",
  "Tes Tulis",
  "Wawancara HR",
  "Tes Technical",
  "Wawancara User/Technical",
  "Presentasi Pitch Deck",
  "FGD / LGD",
  "Wawancara Final",
  "Medical Check Up",
  "Offering Letter",
] as const;

export type RejectionStage = (typeof REJECTION_STAGES)[number];

export const ROOT_CAUSES = [
  "CV",
  "Cover Letter",
  "Technical Skill",
  "Soft Skill / Communication",
  "English",
  "Experience",
  "Culture Fit",
  "Salary Mismatch",
  "Unknown",
] as const;

export type RootCause = (typeof ROOT_CAUSES)[number];

export const PRIORITIES = ["High", "Medium", "Low"] as const;

export type Priority = (typeof PRIORITIES)[number];

export const JOB_TYPES = ["Internship", "Contract", "Fulltime"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const WORK_ARRANGEMENTS = ["WFO", "Hybrid", "Remote"] as const;
export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];

export interface Application {
  id: string;
  company: string;
  position: string;
  location?: string;
  status: ApplicationStatus;
  dateApplied: string;
  dateUpdated: string;
  jobLink?: string;
  cvVersion?: string;
  cvFileUrl?: string;
  cvFileName?: string;
  priority?: Priority;
  notes?: string;
  jobType?: JobType;
  workArrangement?: WorkArrangement;
  evaluation?: Evaluation;
}

export interface Evaluation {
  rejectionStage: RejectionStage;
  rootCause: RootCause;
  selfNote: string;
  actionItem: string;
  actionItemDone: boolean;
}

export interface KPIData {
  total: number;
  active: number;
  saved: number;
  interview: number;
  rejected: number;
  accepted: number;
  successRate: number;
}

export interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export interface RejectionReasonData {
  reason: string;
  count: number;
}

export interface UserProfile {
  id: string;
  displayName?: string;
  phone?: string;
  portfolio?: string;
  github?: string;
  linkedin?: string;
  gdrive?: string;
  customLinks?: { label: string; url: string }[];
  photoBase64?: string;
  graduationDate?: string;
}
