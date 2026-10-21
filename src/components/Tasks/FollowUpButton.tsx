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
}

export default function FollowUpButton({
  taskId,
  taskTitle,
  initialFollowUps = [],
  onFollowUpSuccess,
}: FollowUpButtonProps) {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(initialFollowUps);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

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
      <div className="flex items-center gap-1.5">
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

        {latestFollowUp && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-[10px] text-slate-500 hover:text-slate-800 underline decoration-dotted transition"
          >
            Di-follow up {latestFollowUp.sender?.name?.split(" ")[0]} ({formatTimeAgo(latestFollowUp.createdAt)})
          </button>
        )}
      </div>

      {/* Popover Riwayat Follow Up */}
      {showHistory && (
        <div className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" /> Log Follow Up ({followUps.length})
            </span>
            <button
              onClick={() => setShowHistory(false)}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              Tutup
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {followUps.map((fu) => (
              <div key={fu.id} className="rounded-lg bg-slate-50 p-2 text-[11px] border border-slate-100">
                <div className="flex items-center justify-between text-slate-700 font-bold">
                  <span className="truncate">{fu.sender?.name}</span>
                  <span className="text-[9px] text-slate-400 shrink-0 font-normal">
                    {formatTimeAgo(fu.createdAt)}
                  </span>
                </div>
                {fu.sender?.department && (
                  <p className="text-[10px] text-slate-400">{fu.sender.department}</p>
                )}
                {fu.message && (
                  <p className="text-[10px] text-slate-600 mt-1 italic">"{fu.message}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
