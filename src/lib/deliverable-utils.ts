/**
 * Deliverable screenshot & attachment utilities
 */

/**
 * Parses deliverableAttachment string from database.
 * Supports legacy single base64/url string as well as JSON stringified array of up to 3 image strings.
 */
export function parseDeliverableAttachments(attachment: string | null | undefined): string[] {
  if (!attachment) return [];
  const trimmed = attachment.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      // Fallback to single string if json parsing fails
    }
  }

  return [trimmed];
}

/**
 * Compresses an image File or Blob client-side using an HTML5 Canvas.
 * Downscales to max dimension (default 1600px) and compresses to JPEG (quality 0.82).
 * Typical output size: ~100KB - 250KB per screenshot.
 */
export async function compressImageFile(
  file: File | Blob,
  maxDimension: number = 1600,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not in browser environment
    if (typeof window === "undefined" || typeof document === "undefined") {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with given quality
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
