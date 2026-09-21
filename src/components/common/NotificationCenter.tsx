"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Clock, Award, AlertTriangle, ShieldCheck } from "lucide-react";
import { Notification } from "../../types";
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "../../actions/notifications";
import { useApp } from "../../context/AppContext";

export function NotificationCenter() {
  const { currentUser } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await getNotificationsAction({
        userId: currentUser.id,
        role: currentUser.role,
        branchId: currentUser.branchId,
      });
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // 15s poll for real-time notifications
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.branchId]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notifId: string) => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await markNotificationReadAction(notifId, currentUser.id);
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    setLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsReadAction(currentUser.id, currentUser.role, currentUser.branchId);
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "point_awarded":
        return <Award className="w-4 h-4 text-amber-500" />;
      case "shift_submitted":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "shift_approved":
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case "refrigerator_alert":
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-500" />;
    }
  };

  if (!currentUser) return null;

  return (
    <div className={`relative inline-block text-left ${isOpen ? "z-50" : ""}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-all cursor-pointer text-[var(--color-text-muted)] hover:text-[var(--color-text)] focus-visible:outline-none focus:ring-2 focus:ring-amber-400"
        aria-label="แจ้งเตือน"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl shadow-amber-950/20 z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3.5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-2)]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-[var(--color-text)]">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-300">
                  {unreadCount} ใหม่
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>อ่านทั้งหมด</span>
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border)]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-text-muted)] flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 opacity-30 stroke-1" />
                <p>ไม่มีการแจ้งเตือนในขณะนี้</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleMarkAsRead(n.id)}
                  className={`p-3 sm:p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                    n.read
                      ? "hover:bg-[var(--color-surface-2)]/50 opacity-75"
                      : "bg-amber-500/5 hover:bg-amber-500/10 font-medium"
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-bold text-[var(--color-text)] truncate">{n.title}</p>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                      {n.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--color-text-subtle)]">
                      <span>
                        {new Date(n.createdAt).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {n.branchName && <span>• สาขา {n.branchName}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
