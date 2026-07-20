// ============================================
// File Storage Service
// Uses Firebase Storage for actual file data
// Stores only download URLs in Firestore
// ============================================

import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const MAX_CV_SIZE = 5 * 1024 * 1024; // 5MB max for CV files
const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB max for images
const UPLOAD_TIMEOUT_MS = 15000; // 15 seconds timeout

/**
 * Helper to wrap a promise with a timeout
 */
async function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}

/**
 * Generate standardized CV filename:
 * Company_Position_DateApplied_Resume.ext
 */
export function generateCvFileName(
  company: string,
  position: string,
  dateApplied: string,
  originalFileName: string
): string {
  const ext = originalFileName.split(".").pop()?.toLowerCase() || "pdf";
  const sanitize = (str: string) =>
    str
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");

  const safeCompany = sanitize(company) || "Company";
  const safePosition = sanitize(position) || "Position";
  const safeDate = dateApplied || new Date().toISOString().split("T")[0];

  return `${safeCompany}_${safePosition}_${safeDate}_Resume.${ext}`;
}

/**
 * Upload a CV file to Firebase Storage.
 * Returns the download URL to store in Firestore.
 */
export async function uploadCvFile(
  uid: string,
  applicationId: string,
  file: File,
  fileName: string
): Promise<string> {
  if (!storage) throw new Error("Firebase Storage is not initialized. Please check your Firebase configuration.");
  if (file.size > MAX_CV_SIZE) throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum is 5MB.`);

  const storagePath = `users/${uid}/cv/${applicationId}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  try {
    await withTimeout(
      uploadBytes(storageRef, file), 
      UPLOAD_TIMEOUT_MS, 
      "Upload timed out. Please ensure Firebase Storage is initialized in your console and rules are set."
    );
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Storage upload error:", error);
    throw error;
  }
}

/**
 * Upload a motivation board image to Firebase Storage.
 * Returns the download URL.
 */
export async function uploadMotivationImage(
  uid: string,
  file: File
): Promise<string> {
  if (!storage) throw new Error("Firebase Storage is not initialized. Please check your Firebase configuration.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error(`Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum is 3MB.`);

  const storagePath = `users/${uid}/motivation/board_${Date.now()}.${file.name.split(".").pop()?.toLowerCase() || "jpg"}`;
  const storageRef = ref(storage, storagePath);

  try {
    await withTimeout(
      uploadBytes(storageRef, file), 
      UPLOAD_TIMEOUT_MS, 
      "Upload timed out. Please ensure Firebase Storage is initialized in your console and rules are set."
    );
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Storage upload error:", error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage by URL.
 * Silently handles errors (file might not exist).
 */
export async function deleteStorageFile(downloadUrl: string): Promise<void> {
  if (!storage || !downloadUrl) return;
  try {
    // Extract path from the download URL
    const storageRef = ref(storage, downloadUrl);
    await deleteObject(storageRef);
  } catch {
    // File might already be deleted, ignore
  }
}

/**
 * Convert a File to base64 data URL (only for small files like profile photos).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Download a file from a URL (for Firebase Storage URLs).
 * Opens in a new tab for viewing/downloading.
 */
export function downloadCvFile(url: string, fileName: string) {
  // For Firebase Storage URLs, open in new tab
  if (url.startsWith("https://")) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Legacy: base64 data URLs (old format, backward compatible)
  if (url.startsWith("data:")) {
    // Check if it's gzip compressed (old format)
    if (url.startsWith("data:application/gzip")) {
      downloadCompressedBase64(url, fileName);
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Legacy: decompress and download old gzip-compressed base64 files
 */
async function downloadCompressedBase64(dataUrl: string, fileName: string) {
  try {
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes);
        controller.close();
      },
    });

    const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
    const reader = decompressedStream.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalLength += value.length;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeType =
      ext === "pdf" ? "application/pdf"
        : ext === "doc" ? "application/msword"
          : ext === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/octet-stream";

    const blob = new Blob([result.buffer as ArrayBuffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    console.error("Failed to decompress legacy file");
  }
}
