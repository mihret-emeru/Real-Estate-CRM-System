"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FaBell,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";
import BackLink from "@/components/common/BackLink";
import "@/styles/admin/admin-notifications.css";

export default function AdminNotificationsPage() {
  const { status } = useSession();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/client/notifications", {
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load notifications.");
      }

      setNotifications(result.data || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (err) {
      console.error("Admin notifications error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadNotifications();
    }

    if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, loadNotifications]);

  async function markAsRead(notificationId) {
    try {
      const response = await fetch("/api/client/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update notification.");
      }

      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item,
        ),
      );

      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (err) {
      console.error("Mark notification as read error:", err);
      setError(err.message);
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch("/api/client/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update notifications.");
      }

      setNotifications((current) =>
        current.map((item) => ({ ...item, isRead: true })),
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Mark all notifications as read error:", err);
      setError(err.message);
    }
  }

  function formatTime(date) {
    if (!date) return "";

    const notificationDate = new Date(date);
    const now = new Date();

    const difference = Math.floor(
      (now.getTime() - notificationDate.getTime()) / 1000,
    );

    if (difference < 60) return "Just now";
    if (difference < 3600) return `${Math.floor(difference / 60)} min ago`;
    if (difference < 86400) return `${Math.floor(difference / 3600)} hr ago`;
    if (difference < 604800) return `${Math.floor(difference / 86400)} day ago`;

    return notificationDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (status === "loading" || loading) {
    return (
      <div className="admin-notifications-loading">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="admin-notifications-page">
      <div className="admin-notifications-header">
        <div>
          <BackLink href="/agent/dashboard" label="Back to Dashboard" />
          <div className="admin-notifications-title">
            <FaShieldAlt />
            <h1>Notifications</h1>
          </div>

          <p>
            Stay updated on assigned properties, client inquiries, messages, and
            other activities.
          </p>
        </div>

        <button
          type="button"
          className="admin-notifications-refresh"
          onClick={loadNotifications}
        >
          <FaSyncAlt />
          Refresh
        </button>
      </div>

      <div className="admin-notifications-summary">
        <div className="admin-notifications-summary-icon">
          <FaBell />
        </div>

        <div>
          <span>Security alerts</span>
          <strong>{notifications.length}</strong>
        </div>

        <div className="admin-notifications-summary-divider" />

        <div>
          <span>Unread alerts</span>
          <strong>{unreadCount}</strong>
        </div>
      </div>

      <div className="admin-notifications-list-header">
        <div>
          <h2>Recent activity</h2>
          <span>{notifications.length} notifications</span>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="admin-mark-all-read"
            onClick={markAllAsRead}
          >
            <FaCheckCircle />
            Mark all as read
          </button>
        )}
      </div>

      {error && <div className="admin-notifications-error">{error}</div>}

      {notifications.length === 0 ? (
        <div className="admin-notifications-empty">
          <FaBell />
          <h3>No security notifications</h3>
          <p>Security alerts will appear here when important events occur.</p>
        </div>
      ) : (
        <div className="admin-notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`admin-notification-item ${
                notification.isRead ? "read" : "unread"
              }`}
            >
              <div className="admin-notification-icon">
                <FaExclamationTriangle />
              </div>

              <div className="admin-notification-content">
                <div className="admin-notification-title">
                  <h3>{notification.title}</h3>

                  {!notification.isRead && (
                    <span className="admin-notification-unread-badge">New</span>
                  )}
                </div>

                <p>{notification.message}</p>

                <span className="admin-notification-time">
                  {formatTime(notification.createdAt)}
                </span>
              </div>

              {!notification.isRead && (
                <button
                  type="button"
                  className="admin-notification-read-btn"
                  onClick={() => markAsRead(notification._id)}
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
