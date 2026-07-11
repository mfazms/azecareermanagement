// CV is stored as base64 in Firestore directly
// Files > 1MB are auto-compressed using gzip before base64 encoding
// Files are auto-renamed to Company_Position_DateApplied_Resume format

const ONE_MB = 1 * 1024 * 1024;

/**
 * Generate standardized CV filename:
 * Company_Position_DateApplied_Resume.ext
 * e.g. "Google_SoftwareEngineer_2026-07-11_Resume.pdf"
 */
export function generateCvFileName(
  company: string,
  position: string,
  dateApplied: string,
  originalFileName: string
): string {
  // Get file extension from original filename
  const ext = originalFileName.split(".").pop()?.toLowerCase() || "pdf";

  // Sanitize company and position: remove special chars, replace spaces with camelCase-like format
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
 * Returns a compressed Uint8Array
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

  // Merge chunks into a single Uint8Array
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Decompress gzip data back to original bytes
 */
async function decompressData(compressedData: Uint8Array): Promise<Uint8Array> {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(compressedData);
      controller.close();
    },
  });

  const decompressedStream = stream.pipeThrough(
    new DecompressionStream("gzip")
  );
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

  return result;
}

/**
 * Convert Uint8Array to base64 data URL
 */
function uint8ArrayToBase64DataUrl(
  data: Uint8Array,
  mimeType: string
): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Convert base64 data URL to Uint8Array
 */
function base64DataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Process a CV file for storage:
 * - If > 1MB, auto-compress using gzip
 * - Returns { base64Data, isCompressed } 
 * 
 * The base64Data uses a special MIME prefix to indicate compression:
 * - Compressed: "data:application/gzip;base64,..."
 * - Uncompressed: "data:application/pdf;base64,..." (normal data URL)
 */
export async function processFileForStorage(
  file: File
): Promise<{ base64Data: string; isCompressed: boolean }> {
  if (file.size > ONE_MB) {
    // Compress the file
    const compressed = await compressFile(file);
    const base64Data = uint8ArrayToBase64DataUrl(compressed, "application/gzip");

    // Check if compressed size is still too large for Firestore (~1MB base64 = ~750KB raw)
    // Firestore document limit is 1MB, but we have other fields too, so target ~900KB base64
    if (base64Data.length > 900 * 1024) {
      throw new Error(
        `File is too large even after compression. Compressed size: ${(base64Data.length / 1024).toFixed(0)}KB. Please use a smaller file.`
      );
    }

    return { base64Data, isCompressed: true };
  }

  // Small file: store as normal base64
  return {
    base64Data: await fileToBase64(file),
    isCompressed: false,
  };
}

/**
 * Convert a regular File to base64 data URL (for files under 1MB)
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
 * Download a CV file, handling both compressed and uncompressed formats.
 * Detects gzip-compressed files by MIME type and decompresses before download.
 */
export async function downloadCvFile(
  base64Data: string,
  fileName: string,
  originalMimeType?: string
) {
  const isCompressed = base64Data.startsWith("data:application/gzip");

  if (isCompressed) {
    // Decompress first
    const compressedBytes = base64DataUrlToUint8Array(base64Data);
    const originalBytes = await decompressData(compressedBytes);

    // Determine MIME type from file extension
    const ext = fileName.split(".").pop()?.toLowerCase();
    const mimeType =
      originalMimeType ||
      (ext === "pdf"
        ? "application/pdf"
        : ext === "doc"
          ? "application/msword"
          : ext === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/octet-stream");

    const blob = new Blob([originalBytes.buffer as ArrayBuffer], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Normal uncompressed download
    downloadBase64File(base64Data, fileName);
  }
}

/**
 * Simple base64 file download (for uncompressed files)
 */
export function downloadBase64File(base64Data: string, fileName: string) {
  const link = document.createElement("a");
  link.href = base64Data;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
