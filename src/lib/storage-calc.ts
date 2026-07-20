import type { Application, UserProfile, StorageUsage } from "@/types";
import { STORAGE_LIMIT_BYTES } from "@/types";

/**
 * Calculate the approximate byte size of a string.
 * Uses TextEncoder for accurate UTF-8 byte measurement.
 */
function getByteSize(str: string): number {
  if (!str) return 0;
  return new TextEncoder().encode(str).length;
}

/**
 * Calculate the byte size of an object by serializing it to JSON.
 */
function getObjectByteSize(obj: unknown): number {
  if (obj === null || obj === undefined) return 0;
  try {
    return getByteSize(JSON.stringify(obj));
  } catch {
    return 0;
  }
}

import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

/**
 * Calculate storage usage breakdown from loaded data.
 * Categorizes into: applications (text), CV files, evaluations, profile data.
 *
 * This measures the *logical* size of data as stored in Firestore documents
 * (JSON-serialized), which closely approximates actual Firestore storage usage.
 */
export async function calculateStorageUsage(
  applications: Application[],
  userProfile: UserProfile | null
): Promise<StorageUsage> {
  let applicationsSize = 0;
  let cvFilesSize = 0;
  let evaluationsSize = 0;
  let motivationImageSize = 0;

  // Calculate sizes for applications and legacy non-chunked CVs
  for (const app of applications) {
    // CV file size (legacy base64 data)
    if (app.cvFileUrl && !app.cvFileUrl.startsWith("firestore://")) {
      cvFilesSize += getByteSize(app.cvFileUrl);
    }

    // Evaluation size
    if (app.evaluation) {
      evaluationsSize += getObjectByteSize(app.evaluation);
    }

    // Application text data (everything except cvFileUrl and evaluation)
    const textData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(app)) {
      if (key !== "cvFileUrl" && key !== "evaluation") {
        textData[key] = value;
      }
    }
    applicationsSize += getObjectByteSize(textData);
  }

  // Profile data size (including legacy photoBase64, skills, etc.)
  let profileDataSize = 0;
  if (userProfile) {
    // We clone to remove firestore:// URL from calculation if present
    const profileClone = { ...userProfile };
    if (profileClone.motivationImageUrl?.startsWith("firestore://")) {
       profileClone.motivationImageUrl = ""; // Don't double count
    }
    profileDataSize = getObjectByteSize(profileClone);
  }

  // Fetch true size of all chunked files (CVs and Motivation images)
  if (userProfile?.id && db) {
    try {
      const chunksRef = collection(db, "users", userProfile.id, "file_chunks");
      const snapshot = await getDocs(chunksRef);
      snapshot.forEach(doc => {
        const data = doc.data();
        const size = getByteSize(data.data || "");
        if (data.fileId?.startsWith("cv_")) {
          cvFilesSize += size;
        } else if (data.fileId?.startsWith("motivation_")) {
          motivationImageSize += size;
        }
      });
    } catch (e) {
      console.error("Error fetching chunk sizes:", e);
    }
  }

  // Motivation images logically belong to profile storage
  profileDataSize += motivationImageSize;

  const total = applicationsSize + cvFilesSize + evaluationsSize + profileDataSize;

  return {
    applications: applicationsSize,
    cvFiles: cvFilesSize,
    evaluations: evaluationsSize,
    profileData: profileDataSize,
    total,
    limit: STORAGE_LIMIT_BYTES,
  };
}

/**
 * Format bytes into a human-readable string.
 * Automatically selects KB, MB, or GB.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
