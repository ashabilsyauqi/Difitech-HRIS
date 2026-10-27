"use client";

import { useState } from "react";
import { BellRing, Check, Clock, User, AlertCircle } from "lucide-react";

interface FollowUpItem {
  id: string;
  sender: {
    id: string;
    name: string;
    department?: string | null;
  };
  message?: string | null;
  createdAt: string;
}

interface FollowUpButtonProps {
  taskId: string;
  taskTitle: string;
  initialFollowUps?: FollowUpItem[];
  onFollowUpSuccess?: () => void;
  variant?: "default" | "large";
  popoverPlacement?: "top" | "bottom";
}

export default function FollowUpButton({
  taskId,
  taskTitle,
  initialFollowUps = [],
  onFollowUpSuccess,
  variant = "default",
  popoverPlacement = "bottom",
}: FollowUpButtonProps) {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(initialFollowUps);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const effectivePlacement = variant === "large" && popoverPlacement === "bottom" ? "top" : popoverPlacement;

  const handleFollowUp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/workspace/tasks/${taskId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Tolong dicek dan di-update progres tugas ini ya.",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFollowUps((prev) => [data.followUp, ...prev]);
        setJustSubmitted(true);
        setTimeout(() => setJustSubmitted(false), 3000);
        if (onFollowUpSuccess) onFollowUpSuccess();
      }
    } catch (err) {
      console.error("Failed to follow up:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "baru saja";
      if (diffMins < 60) return `${diffMins}m lalu`;
      if (diffHours < 24) return `${diffHours}j lalu`;
      return `${diffDays}h lalu`;
    } catch {
      return "";
    }
  };

  const latestFollowUp = followUps[0];

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2">
        {variant === "large" ? (
          <button
            type="button"
            onClick={handleFollowUp}
            disabled={isSubmitting}
            title="Tekan untuk mengirim notifikasi Follow Up ke penerima tugas"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition shadow-sm cursor-pointer select-none active:scale-95 ${
              justSubmitted
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
            }`}
          >
            {justSubmitted ? (
              <>
                <Check className="h-4 w-4 text-white stroke-[3]" />
                <span>Follow Up Terkirim!</span>
              </>
            ) : (
              <>
                <BellRing className={`h-4 w-4 ${isSubmitting ? "animate-spin" : "animate-bounce"}`} />
                <span>Follow Up Tugas</span>
                {followUps.length > 0 && (
                  <span className="rounded-full bg-white/30 backdrop-blur-xs px-2 py-0.5 text-[10px] font-black text-white">
                    {followUps.length}x
                  </span>
                )}
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFollowUp}
            disabled={isSubmitting}
            title="Tekan untuk mengirim notifikasi Follow Up ke penerima tugas"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition shadow-2xs ${
              justSubmitted
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            }`}
          >
            {justSubmitted ? (
              <>
                <Check className="h-3 w-3 text-emerald-600" />
                <span>Terkirim!</span>
              </>
            ) : (
              <>
                <BellRing className={`h-3 w-3 ${isSubmitting ? "animate-spin" : "text-amber-600"}`} />
                <span>Follow Up</span>
                {followUps.length > 0 && (
                  <span className="rounded-full bg-amber-200 px-1 text-[9px] font-black text-amber-900">
                    {followUps.length}
                  </span>
                )}
              </>
            )}
          </button>
        )}

        {latestFollowUp && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`text-slate-500 hover:text-slate-800 underline decoration-dotted transition cursor-pointer font-semibold ${
              variant === "large" ? "text-xs" : "text-[10px]"
            }`}
          >
            {variant === "large" ? (
              <span>Riwayat ({followUps.length})</span>
            ) : (
              <span>Di-follow up {latestFollowUp.sender?.name?.split(" ")[0]} ({formatTimeAgo(latestFollowUp.createdAt)})</span>
            )}
          </button>
        )}
      </div>

      {/* Popover Riwayat Follow Up */}
      {showHistory && (
        <div
          className={`absolute ${
            effectivePlacement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          } left-0 w-80 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-100`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" /> Log Follow Up ({followUps.length})
            </span>
            <button
              onClick={() => setShowHistory(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
            >
              Tutup
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-0.5 custom-scrollbar">
            {followUps.map((fu) => (
              <div key={fu.id} className="rounded-xl bg-slate-50 p-2.5 text-[11px] border border-slate-100">
                <div className="flex items-center justify-between text-slate-800 font-bold">
                  <span className="truncate">{fu.sender?.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                    {formatTimeAgo(fu.createdAt)}
                  </span>
                </div>
                {fu.sender?.department && (
                  <p className="text-[10px] text-slate-400 font-medium">{fu.sender.department}</p>
                )}
                {fu.message && (
                  <p className="text-[11px] text-slate-600 mt-1 italic bg-white p-2 rounded-lg border border-slate-100">"{fu.message}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
