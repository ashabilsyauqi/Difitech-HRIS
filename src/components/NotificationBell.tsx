"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, ExternalLink, AlertCircle, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  taskId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s for updates
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "FOLLOW_UP":
        return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />;
      case "APPROVAL_COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      case "REVISION_REQUESTED":
        return <RefreshCw className="h-4 w-4 text-rose-500 shrink-0" />;
      case "DEADLINE_SUGGESTION":
        return <Clock className="h-4 w-4 text-blue-500 shrink-0" />;
      default:
        return <Bell className="h-4 w-4 text-indigo-500 shrink-0" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifikasi Tugas & Aktivitas"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={isLoading}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Belum ada notifikasi tugas</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && markAsRead(item.id)}
                  className={`p-3.5 transition hover:bg-slate-50 flex gap-3 items-start cursor-pointer ${
                    !item.isRead ? "bg-red-50/30" : ""
                  }`}
                >
                  <div className="mt-0.5">{getIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs ${!item.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"} truncate`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 mt-1.5"
                      >
                        Buka Tugas <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                  {!item.isRead && (
                    <span className="h-2 w-2 rounded-full bg-red-600 mt-1.5 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
