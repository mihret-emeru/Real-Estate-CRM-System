"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FaSearch,
  FaBell,
  FaChevronDown,
  FaCreditCard,
  FaFileAlt,
  FaUserTie,
  FaComment,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
} from "react-icons/fa";

import Link from "next/link";

export default function TopNavbar() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: session, status } = useSession();
  const [profileImage, setProfileImage] = useState("");

  const userName = session?.user?.name || "User";
  const userRole = session?.user?.role || "";
  const userInitial = userName.charAt(0).toUpperCase();

  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  async function loadNotifications() {
    try {
      const response = await fetch("/api/client/notifications", {
        credentials: "include",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return;
      }

      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================

  useEffect(() => {
    loadNotifications();

    // Check for new notifications every 30 seconds.
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    let cancelled = false;

    async function loadProfileImage() {
      try {
        const response = await fetch("/api/profile", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) return;

        if (!cancelled) {
          setProfileImage(result.data.profileImage || "");
        }
      } catch (error) {
        console.error("Failed to load profile photo:", error);
      }
    }

    loadProfileImage();

    return () => {
      cancelled = true;
    };
  }, [status]);

  // ============================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // ============================================================

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // ============================================================
  // NOTIFICATION ICON
  // ============================================================

  function getNotificationIcon(type) {
    switch (type) {
      case "payment_due":
        return <FaCreditCard />;

      case "payment_verified":
        return <FaCheckCircle />;

      case "payment_rejected":
      case "payment_review":
        return <FaExclamationTriangle />;

      case "contract_created":
      case "contract_updated":
        return <FaFileAlt />;

      case "agent_assigned":
        return <FaUserTie />;

      case "new_message":
        return <FaComment />;

      case "property_update":
        return <FaInfoCircle />;

      default:
        return <FaInfoCircle />;
    }
  }

  // ============================================================
  // NOTIFICATION TIME
  // ============================================================

  function formatNotificationTime(date) {
    if (!date) return "";

    const notificationDate = new Date(date);
    const now = new Date();

    const difference = Math.floor(
      (now.getTime() - notificationDate.getTime()) / 1000,
    );

    if (difference < 60) {
      return "Just now";
    }

    if (difference < 3600) {
      return `${Math.floor(difference / 60)} min ago`;
    }

    if (difference < 86400) {
      return `${Math.floor(difference / 3600)} hr ago`;
    }

    if (difference < 604800) {
      return `${Math.floor(difference / 86400)} day ago`;
    }

    return notificationDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ============================================================
  // MARK ONE AS READ
  // ============================================================

  async function handleNotificationClick(notification) {
    try {
      if (!notification.isRead) {
        await fetch("/api/client/notifications", {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId: notification._id,
          }),
        });

        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id
              ? {
                  ...item,
                  isRead: true,
                }
              : item,
          ),
        );

        setUnreadCount((current) => Math.max(current - 1, 0));
      }

      setShowNotifications(false);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  async function handleMarkAllRead() {
    try {
      const response = await fetch("/api/client/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAll: true,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }

  return (
    <header className="top-navbar">
      <div className="top-navbar-left">
        <form
          className="search-box"
          onSubmit={(event) => {
            event.preventDefault();

            const query = searchTerm.trim();

            if (query) {
              router.push(
                `/client/properties?search=${encodeURIComponent(query)}`,
              );
            } else {
              router.push("/client/properties");
            }
          }}
        >
          <button
            type="submit"
            className="search-icon"
            aria-label="Search properties"
          >
            <FaSearch />
          </button>

          <input
            type="search"
            placeholder="Search properties..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search properties"
          />
        </form>
      </div>

      <div className="top-navbar-right">
        {/* ======================================================
            NOTIFICATION BELL
            ====================================================== */}

        <div className="notification-wrapper" ref={notificationRef}>
          <button
            type="button"
            className="nav-icon-btn notification-btn"
            onClick={() => setShowNotifications((current) => !current)}
            aria-label="Notifications"
          >
            <FaBell />

            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* ==================================================
              NOTIFICATION DROPDOWN
              ================================================== */}

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <div>
                  <h3>Notifications</h3>

                  <span>
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "All caught up"}
                  </span>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="mark-all-read-btn"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <div className="notification-empty-icon">
                      <FaBell />
                    </div>

                    <h4>No notifications</h4>

                    <p>You're all caught up. New updates will appear here.</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((notification) => {
                    const notificationContent = (
                      <div
                        className={`notification-item ${
                          notification.isRead ? "read" : "unread"
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="notification-item-icon">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="notification-item-content">
                          <div className="notification-item-title">
                            <h4>{notification.title}</h4>

                            {!notification.isRead && (
                              <span className="notification-unread-dot" />
                            )}
                          </div>

                          <p>{notification.message}</p>

                          <span className="notification-time">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    );

                    if (notification.link) {
                      return (
                        <Link
                          href={notification.link}
                          key={notification._id}
                          className="notification-link"
                        >
                          {notificationContent}
                        </Link>
                      );
                    }

                    return (
                      <div key={notification._id}>{notificationContent}</div>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="notification-dropdown-footer">
                  <Link
                    href="/client/notifications"
                    onClick={() => setShowNotifications(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================
            USER PROFILE
            ====================================================== */}

        <div className="user-profile-wrapper" ref={profileRef}>
          <div
            className="user-profile"
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={showProfileMenu}
            onClick={() => setShowProfileMenu((current) => !current)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setShowProfileMenu((current) => !current);
              }
            }}
          >
            <div className="user-avatar">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={`${userName}'s profile`}
                  className="user-avatar-image"
                />
              ) : (
                userInitial
              )}
            </div>

            <div className="user-info">
              <h4>{status === "loading" ? "Loading..." : userName}</h4>
              <span>{userRole}</span>
            </div>

            <FaChevronDown
              className={`dropdown-icon ${
                showProfileMenu ? "profile-chevron-open" : ""
              }`}
            />
          </div>

          {showProfileMenu && (
            <div className="profile-dropdown" role="menu">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={`${userName}'s profile`}
                      className="user-avatar-image"
                    />
                  ) : (
                    userInitial
                  )}
                </div>

                <div className="profile-dropdown-user">
                  <strong>{userName}</strong>
                  <span>{userRole}</span>
                </div>
              </div>

              <div className="profile-dropdown-divider" />

              <Link
                href="/profile"
                className="profile-dropdown-item"
                role="menuitem"
                onClick={() => setShowProfileMenu(false)}
              >
                <span className="profile-dropdown-item-icon">👤</span>
                <span>My Profile</span>
              </Link>

              <Link
                href="/settings"
                className="profile-dropdown-item"
                role="menuitem"
                onClick={() => setShowProfileMenu(false)}
              >
                <span className="profile-dropdown-item-icon">⚙️</span>
                <span>Settings</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
