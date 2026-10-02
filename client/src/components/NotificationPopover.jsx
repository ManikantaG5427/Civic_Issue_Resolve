import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ShieldAlert,
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
      const res = await notificationAPI.getNotifications({ limit: 10 });
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Non-blocking
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
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
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        aria-label="Notifications"
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition shadow-sm bg-white"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 bottom-full mb-3 md:bottom-0 md:left-full md:right-auto md:ml-3.5 w-80 sm:w-96 rounded-3xl bg-white border border-sand-300 shadow-clay-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 font-heading">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-brand-700 hover:text-brand-800 flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Bell className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">You're all caught up!</p>
                <span className="text-[11px] text-slate-500">No new alerts in your inbox</span>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.isRead;

                return (
                  <div
                    key={notif._id}
                    className={`p-3.5 transition flex items-start justify-between gap-3 ${
                      isUnread
                        ? 'bg-amber-50/50 hover:bg-amber-50/80 border-l-4 border-amber-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold ${
                            isUnread ? 'text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          {notif.title}
                        </span>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
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
                            className="text-brand-700 hover:text-brand-800 hover:underline font-semibold"
                          >
                            View Ticket →
                          </Link>
                        )}
                      </div>
                    </div>

                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        title="Mark as read"
                        className="p-1 text-slate-400 hover:text-brand-700 hover:bg-white rounded transition"
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
