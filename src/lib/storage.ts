// ============================================
// File Storage Service (Firestore Chunking)
// Uses Firestore to store files as chunks to bypass the 1MB document limit,
// avoiding the need for Firebase Storage (which requires Blaze plan).
// ============================================

import { db } from "./firebase";
import { doc, setDoc, getDocs, collection, query, where, orderBy, deleteDoc } from "firebase/firestore";

const CHUNK_SIZE = 800 * 1024; // 800KB per chunk
const MAX_CV_SIZE = 5 * 1024 * 1024; // 5MB max for CV files
const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB max for images

/**
 * Compress image using Canvas API
 */
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress to JPEG with 0.8 quality
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Generate standardized CV filename
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
 * Compress a File using gzip (browser-native CompressionStream API)
 */
async function compressFile(file: File): Promise<Uint8Array> {
  const stream = file.stream();
  const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
  const reader = compressedStream.getReader();

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
  return result;
}

/**
 * Store a large base64 string in Firestore chunks
 */
async function storeInChunks(uid: string, fileId: string, base64Data: string, mimeType: string): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  
  const chunks = [];
  for (let i = 0; i < base64Data.length; i += CHUNK_SIZE) {
    chunks.push(base64Data.slice(i, i + CHUNK_SIZE));
  }

  const totalChunks = chunks.length;
  const chunksRef = collection(db, "users", uid, "file_chunks");

  for (let i = 0; i < totalChunks; i++) {
    const chunkId = `${fileId}_${i}`;
    const chunkDoc = doc(chunksRef, chunkId);
    await setDoc(chunkDoc, {
      fileId,
      index: i,
      totalChunks,
      data: chunks[i],
      mimeType,
      createdAt: new Date().toISOString()
    });
  }

  return `firestore://${uid}/${fileId}`;
}

/**
 * Read a file from Firestore chunks
 */
export async function getFileFromChunks(uid: string, fileId: string): Promise<{ base64Data: string; mimeType: string } | null> {
  if (!db) return null;
  const chunksRef = collection(db, "users", uid, "file_chunks");
  const q = query(chunksRef, where("fileId", "==", fileId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const chunks = querySnapshot.docs.map(doc => doc.data());
  // Sort in memory to avoid requiring a composite index in Firestore
  chunks.sort((a, b) => a.index - b.index);

  let fullData = "";
  let mimeType = "";

  chunks.forEach((data) => {
    fullData += data.data;
    if (data.index === 0) mimeType = data.mimeType;
  });

  return { base64Data: fullData, mimeType };
}

/**
 * Delete a file from Firestore chunks
 */
export async function deleteStorageFile(url: string): Promise<void> {
  if (!db || !url.startsWith("firestore://")) return;
  try {
    const pathParts = url.replace("firestore://", "").split("/");
    if (pathParts.length !== 2) return;
    const uid = pathParts[0];
    const fileId = pathParts[1];

    const chunksRef = collection(db, "users", uid, "file_chunks");
    const q = query(chunksRef, where("fileId", "==", fileId));
    const querySnapshot = await getDocs(q);
    
    for (const docSnapshot of querySnapshot.docs) {
      await deleteDoc(docSnapshot.ref);
    }
  } catch (err) {
    console.error("Error deleting chunks:", err);
  }
}

/**
 * Upload a CV file
 */
export async function uploadCvFile(
  uid: string,
  applicationId: string,
  file: File,
  fileName: string
): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized.");
  if (file.size > MAX_CV_SIZE) throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum is 5MB.`);

  const compressed = await compressFile(file);
  let binary = "";
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  const base64Data = btoa(binary);
  const fileId = `cv_${uid}_${applicationId}_${Date.now()}`;
  
  return await storeInChunks(uid, fileId, base64Data, "application/gzip");
}

/**
 * Upload a motivation board image
 */
export async function uploadMotivationImage(
  uid: string,
  file: File
): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error(`Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum is 3MB.`);

  const compressedBase64 = await compressImage(file);
  // compressedBase64 contains the data URL (e.g. data:image/jpeg;base64,...)
  // We extract just the base64 part for chunking
  const base64Data = compressedBase64.split(",")[1];
  const mimeType = compressedBase64.split(";")[0].split(":")[1];
  
  const fileId = `motivation_${uid}_${Date.now()}`;
  return await storeInChunks(uid, fileId, base64Data, mimeType);
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
 * Fetch a motivation image URL to display in an <img> tag
 */
export async function getMotivationImageUrl(urlOrBase64: string): Promise<string> {
  if (!urlOrBase64) return "";
  if (urlOrBase64.startsWith("data:") || urlOrBase64.startsWith("http")) return urlOrBase64;
  
  if (urlOrBase64.startsWith("firestore://")) {
    const pathParts = urlOrBase64.replace("firestore://", "").split("/");
    if (pathParts.length !== 2) return "";
    const uid = pathParts[0];
    const fileId = pathParts[1];
    
    const fileData = await getFileFromChunks(uid, fileId);
    if (fileData) {
      return `data:${fileData.mimeType};base64,${fileData.base64Data}`;
    }
  }
  return "";
}

/**
 * Download a CV file
 */
export async function downloadCvFile(url: string, fileName: string) {
  if (!url) return;

  // External URLs (e.g. legacy Firebase Storage)
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

  // Legacy raw data URL
  if (url.startsWith("data:")) {
    if (url.startsWith("data:application/gzip")) {
      await downloadCompressedBase64(url, fileName);
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    return;
  }

  // New Firestore Chunking format
  if (url.startsWith("firestore://")) {
    const pathParts = url.replace("firestore://", "").split("/");
    if (pathParts.length === 2) {
      const uid = pathParts[0];
      const fileId = pathParts[1];
      const fileData = await getFileFromChunks(uid, fileId);
      if (fileData) {
        if (fileData.mimeType === "application/gzip") {
          await downloadCompressedBase64(`data:application/gzip;base64,${fileData.base64Data}`, fileName);
        } else {
          const link = document.createElement("a");
          link.href = `data:${fileData.mimeType};base64,${fileData.base64Data}`;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    }
  }
}

/**
 * Legacy: decompress and download gzip-compressed base64 files
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
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch {
    console.error("Failed to decompress file");
  }
}
