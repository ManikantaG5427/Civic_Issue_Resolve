import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { notificationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function NotificationPopover() {
  const { isAuthenticated } = useAuth();
  const { liveNotification } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationAPI.getNotifications({ limit: 15 });
      if (res && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Non-blocking
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // React to live notification from Socket.IO
  useEffect(() => {
    if (liveNotification) {
      setNotifications((prev) => [
        liveNotification,
        ...prev.filter((n) => n._id !== liveNotification._id),
      ]);
      setUnreadCount((c) => c + 1);
    }
  }, [liveNotification]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState) fetchNotifications();
        }}
        aria-label="Notifications"
        className="relative p-2 rounded-full text-[#1D1D1F] hover:text-[#0071E3] hover:bg-black/[0.05] border border-black/[0.08] transition-all duration-200 shadow-sm bg-white active:scale-95 flex items-center justify-center"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#FF3B30] text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown (Positioned cleanly below the navbar) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-[320px] sm:w-[380px] rounded-2xl bg-white/95 backdrop-blur-2xl border border-black/[0.1] shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-[#F5F5F7]/80 border-b border-black/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1D1D1F] tracking-tight">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0071E3]/10 text-[#0071E3] border border-[#0071E3]/20">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#0071E3] hover:text-[#0077ED] flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-black/[0.04]">
            {notifications.length === 0 ? (
              <div className="py-10 text-center space-y-1.5">
                <Bell className="w-7 h-7 text-[#86868B] mx-auto opacity-50" />
                <p className="text-xs font-semibold text-[#1D1D1F]">You're all caught up</p>
                <span className="text-[11px] text-[#86868B] block">No new alerts in your inbox</span>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.isRead;

                return (
                  <div
                    key={notif._id}
                    className={`p-3.5 transition flex items-start justify-between gap-3 ${
                      isUnread
                        ? 'bg-[#0071E3]/[0.03] hover:bg-[#0071E3]/[0.06] border-l-3 border-[#0071E3]'
                        : 'hover:bg-black/[0.02]'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold truncate ${
                            isUnread ? 'text-[#1D1D1F]' : 'text-[#6E6E73]'
                          }`}
                        >
                          {notif.title}
                        </span>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] shrink-0"></span>
                        )}
                      </div>

                      <p className="text-xs text-[#6E6E73] line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[10px] text-[#86868B]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        {notif.linkUrl && (
                          <Link
                            to={notif.linkUrl}
                            onClick={() => {
                              handleMarkAsRead(notif._id);
                              setIsOpen(false);
                            }}
                            className="text-[#0071E3] hover:text-[#0077ED] font-semibold flex items-center gap-0.5"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        title="Mark as read"
                        className="p-1 text-[#86868B] hover:text-[#0071E3] hover:bg-black/[0.04] rounded-full transition shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
