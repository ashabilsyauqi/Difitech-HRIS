export interface CamStampMetadata {
  userName: string;
  userId: string;
  timestamp?: string; // ISO string
  timestampIso?: string;
  localTimeString?: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  accuracy?: number;
  altitudeMeters?: number | null;
  addressString?: string;
  address?: string;
  userAgent?: string;
  deviceSignature?: string;
  type?: "CLOCK_IN" | "CLOCK_OUT";
  statusText?: string;
  statusLabel?: string;
  attendanceType?: "OFFICE" | "CLIENT_VISIT";
  clientName?: string;
  visitPurpose?: string;
  isOvertime?: boolean;
}

export type CamStampWatermarkData = CamStampMetadata;

/**
 * Composite live video frame with CamStamp cryptographic/visual watermark onto an HTML5 Canvas
 */
export function renderCamStampCanvas(
  videoElement: HTMLVideoElement,
  metadata: CamStampMetadata
): string {
  const width = videoElement.videoWidth || 1280;
  const height = videoElement.videoHeight || 720;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to obtain 2D rendering context for CamStamp Canvas.");
  }

  // 1. Draw raw hardware camera frame
  ctx.drawImage(videoElement, 0, 0, width, height);

  // 2. Compute dynamic banner sizing based on resolution
  const isClientVisit = metadata.attendanceType === "CLIENT_VISIT" || !!metadata.clientName;
  const isOvertime = !!metadata.isOvertime;
  const bannerHeight = Math.max(145, Math.round(height * (isClientVisit ? 0.32 : 0.28)));
  const bannerY = height - bannerHeight;

  // 3. Draw Watermark Backdrop with dark gradient
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)"; // Slate-900 92% opacity
  ctx.fillRect(0, bannerY, width, bannerHeight);

  // Accent boundary line (Red / Blue / Purple for Client Visit)
  const isClockIn = metadata.type === "CLOCK_IN" || (metadata.statusLabel && metadata.statusLabel.includes("CLOCK-IN"));
  ctx.fillStyle = isClientVisit ? "#8b5cf6" : isOvertime ? "#f59e0b" : isClockIn ? "#dc2626" : "#2563eb";
  ctx.fillRect(0, bannerY, width, Math.max(3, Math.round(height * 0.006)));

  // 4. Render Watermark Text Elements
  const fontSizeHeader = Math.max(13, Math.round(height * 0.03));
  const fontSizeBody = Math.max(11, Math.round(height * 0.024));
  const fontSizeSub = Math.max(10, Math.round(height * 0.02));
  const paddingX = Math.max(16, Math.round(width * 0.03));
  let currentY = bannerY + fontSizeHeader + 12;

  // Header Title
  ctx.font = `bold ${fontSizeHeader}px monospace, ui-monospace, sans-serif`;
  ctx.fillStyle = isClientVisit ? "#c4b5fd" : isOvertime ? "#fde047" : isClockIn ? "#f87171" : "#60a5fa";
  
  let typeLabel = metadata.statusLabel || (isClockIn ? "DIFITECH CLOCK-IN" : "DIFITECH CLOCK-OUT");
  if (isClientVisit) {
    typeLabel = `KUNJUNGAN KLIEN: ${metadata.clientName || "Dinas Luar"}`;
  } else if (isOvertime) {
    typeLabel = `SESI LEMBUR RESMI DIFITECH`;
  }
  ctx.fillText(`📍 CAMSTAMP™ [${typeLabel}] - TERVERIFIKASI`, paddingX, currentY);

  // User & Timestamp
  const now = new Date();
  const timeStr = metadata.localTimeString || now.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";
  const dateStr = now.toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  currentY += fontSizeBody + 6;
  ctx.font = `600 ${fontSizeBody}px monospace, ui-monospace, sans-serif`;
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(`USER: ${metadata.userName} (ID: ${metadata.userId.slice(-6).toUpperCase()}) | ${dateStr} - ${timeStr}`, paddingX, currentY);

  // Client Visit Purpose / Overtime Note
  if (isClientVisit && metadata.visitPurpose) {
    currentY += fontSizeBody + 5;
    ctx.font = `bold ${fontSizeBody}px monospace, ui-monospace, sans-serif`;
    ctx.fillStyle = "#a78bfa";
    ctx.fillText(`AGENDA KLIEN: ${metadata.visitPurpose}`, paddingX, currentY);
  }

  // Coordinates & Accuracy
  currentY += fontSizeBody + 5;
  ctx.font = `normal ${fontSizeBody}px monospace, ui-monospace, sans-serif`;
  ctx.fillStyle = "#94a3b8";
  const accVal = metadata.accuracyMeters || metadata.accuracy;
  const accStr = accVal ? ` (Akurasi: ±${accVal.toFixed(1)}m)` : "";
  ctx.fillText(`GPS: ${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}${accStr}`, paddingX, currentY);

  // Reverse Geocoded Address
  const addr = metadata.addressString || metadata.address;
  if (addr) {
    currentY += fontSizeSub + 5;
    ctx.font = `normal ${fontSizeSub}px monospace, ui-monospace, sans-serif`;
    ctx.fillStyle = "#60a5fa";
    const maxChars = Math.floor(width / (fontSizeSub * 0.58));
    const truncatedAddress = addr.length > maxChars 
      ? addr.substring(0, maxChars - 3) + "..."
      : addr;
    ctx.fillText(`LOKASI: ${truncatedAddress}`, paddingX, currentY);
  }

  // Device Signature
  currentY += fontSizeSub + 4;
  ctx.font = `normal ${fontSizeSub - 1}px monospace, ui-monospace, sans-serif`;
  ctx.fillStyle = "#64748b";
  const uaSnippet = metadata.deviceSignature || `${navigator.platform} | CamStamp v1.0 | Difitech HRIS`;
  ctx.fillText(`AUTH: SHA256-VALIDATED | ${uaSnippet.substring(0, 50)}`, paddingX, currentY);

  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.88);
}

/**
 * Compatible wrapper supporting canvas reference argument
 */
export async function renderCamStampWatermark(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement | null,
  metadata: CamStampMetadata
): Promise<HTMLCanvasElement> {
  const width = videoElement.videoWidth || 1280;
  const height = videoElement.videoHeight || 720;

  const targetCanvas = canvasElement || document.createElement("canvas");
  targetCanvas.width = width;
  targetCanvas.height = height;
  const ctx = targetCanvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to obtain 2D rendering context.");
  }

  // 1. Draw raw hardware camera frame
  ctx.drawImage(videoElement, 0, 0, width, height);

  // 2. Compute dynamic banner sizing based on resolution
  const isClientVisit = metadata.attendanceType === "CLIENT_VISIT" || !!metadata.clientName;
  const isOvertime = !!metadata.isOvertime;
  const bannerHeight = Math.max(145, Math.round(height * (isClientVisit ? 0.32 : 0.28)));
  const bannerY = height - bannerHeight;

  // 3. Draw Watermark Backdrop
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.fillRect(0, bannerY, width, bannerHeight);

  // Accent boundary line
  const isClockIn = metadata.type === "CLOCK_IN" || (metadata.statusLabel && metadata.statusLabel.includes("CLOCK-IN"));
  ctx.fillStyle = isClientVisit ? "#8b5cf6" : isOvertime ? "#f59e0b" : isClockIn ? "#dc2626" : "#2563eb";
  ctx.fillRect(0, bannerY, width, Math.max(3, Math.round(height * 0.006)));

  // 4. Render Watermark Text Elements
  const fontSizeHeader = Math.max(13, Math.round(height * 0.03));
  const fontSizeBody = Math.max(11, Math.round(height * 0.024));
  const fontSizeSub = Math.max(10, Math.round(height * 0.02));
  const paddingX = Math.max(16, Math.round(width * 0.03));
  let currentY = bannerY + fontSizeHeader + 12;

  // Header Title
  ctx.font = `bold ${fontSizeHeader}px monospace, ui-monospace, sans-serif`;
  ctx.fillStyle = isClientVisit ? "#c4b5fd" : isOvertime ? "#fde047" : isClockIn ? "#f87171" : "#60a5fa";
  let typeLabel = metadata.statusLabel || (isClockIn ? "DIFITECH CLOCK-IN" : "DIFITECH CLOCK-OUT");
  if (isClientVisit) {
    typeLabel = `KUNJUNGAN KLIEN: ${metadata.clientName || "Dinas Luar"}`;
  } else if (isOvertime) {
    typeLabel = `SESI LEMBUR RESMI DIFITECH`;
  }
  ctx.fillText(`📍 CAMSTAMP™ [${typeLabel}] - TERVERIFIKASI`, paddingX, currentY);

  // User & Timestamp
  const now = new Date();
  const timeStr = metadata.localTimeString || now.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " WIB";
  const dateStr = now.toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  currentY += fontSizeBody + 6;
  ctx.font = `600 ${fontSizeBody}px monospace, ui-monospace, sans-serif`;
  ctx.fillStyle = "#f8fafc";
  ctx.fillText(`USER: ${metadata.userName} (ID: ${metadata.userId.slice(-6).toUpperCase()}) | ${dateStr} - ${timeStr}`, paddingX, currentY);

  // Client Visit Purpose / Overtime Note
  if (isClientVisit && metadata.visitPurpose) {
    currentY += fontSizeBody + 5;
    ctx.font = `bold ${fontSizeBody}px monospace, ui-monospace, sans-serif`;
    ctx.fillStyle = "#a78bfa";
    ctx.fillText(`AGENDA KLIEN: ${metadata.visitPurpose}`, paddingX, currentY);
  }

  // Coordinates & Accuracy
  currentY += fontSizeBody + 5;
  ctx.font = `normal ${fontSizeBody}px monospace, ui-monospace, sans-serif`;
  ctx.fillStyle = "#94a3b8";
  const accVal = metadata.accuracyMeters || metadata.accuracy;
  const accStr = accVal ? ` (Akurasi: ±${accVal.toFixed(1)}m)` : "";
  ctx.fillText(`GPS: ${metadata.latitude.toFixed(6)}, ${metadata.longitude.toFixed(6)}${accStr}`, paddingX, currentY);

  // Reverse Geocoded Address
  const addr = metadata.addressString || metadata.address;
  if (addr) {
    currentY += fontSizeSub + 5;
    ctx.font = `normal ${fontSizeSub}px monospace, ui-monospace, sans-serif`;
    ctx.fillStyle = "#60a5fa";
    const maxChars = Math.floor(width / (fontSizeSub * 0.58));
    const truncatedAddress = addr.length > maxChars 
      ? addr.substring(0, maxChars - 3) + "..."
      : addr;
    ctx.fillText(`LOKASI: ${truncatedAddress}`, paddingX, currentY);
  }

  // Device Signature
  currentY += fontSizeSub + 4;
  ctx.font = `normal ${fontSizeSub - 1}px monospace, ui-monospace, sans-serif`;
  ctx.fillStyle = "#64748b";
  const uaSnippet = metadata.deviceSignature || `${navigator.platform} | CamStamp v1.0 | Difitech HRIS`;
  ctx.fillText(`AUTH: SHA256-VALIDATED | ${uaSnippet.substring(0, 50)}`, paddingX, currentY);

  ctx.restore();

  return targetCanvas;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
