"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaComments, FaUser, FaHome, FaClock } from "react-icons/fa";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import "@/styles/client/messages.css";

export default function ClientMessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================================
  // FETCH CONVERSATIONS
  // ==========================================================

  async function fetchConversations() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/client/conversations", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load conversations.");
      }

      setConversations(data.data || []);
    } catch (error) {
      console.error("Fetch conversations error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load conversations.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchConversations();
  }, []);

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="client-messages-page">
        <LoadingSpinner message="Loading messages..." />
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="client-messages-page">
        <div className="messages-error">
          <FaComments />

          <h2>Unable to load messages</h2>

          <p>{error}</p>

          <button onClick={fetchConversations}>Try Again</button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // EMPTY
  // ==========================================================

  if (conversations.length === 0) {
    return (
      <div className="client-messages-page">
        <div className="messages-header">
          <div>
            <span>COMMUNICATION</span>

            <h1>Messages</h1>

            <p>
              Communicate directly with agents about properties you are
              interested in.
            </p>
          </div>

          <FaComments className="messages-header-icon" />
        </div>

        <div className="messages-empty">
          <FaComments />

          <h2>No conversations yet</h2>

          <p>
            When you are interested in a property, use
            <strong> Message Agent </strong>
            on the property card to start a conversation.
          </p>

          <Link href="/client/properties">Browse Properties</Link>
        </div>
      </div>
    );
  }

  // ==========================================================
  // CONVERSATIONS
  // ==========================================================

  return (
    <div className="client-messages-page">
      <div className="messages-header">
        <div>
          <span>COMMUNICATION</span>

          <h1>Messages</h1>

          <p>
            Communicate directly with agents about properties you are interested
            in.
          </p>
        </div>

        <FaComments className="messages-header-icon" />
      </div>

      <div className="conversation-list">
        {conversations.map((conversation) => (
          <Link
            key={conversation._id}
            href={`/client/messages/${conversation._id}`}
            className="conversation-card"
          >
            {/* PROPERTY IMAGE */}

            <div className="conversation-property-image">
              {conversation.property?.images?.[0] ? (
                <img
                  src={conversation.property.images[0]}
                  alt={conversation.property.title}
                />
              ) : (
                <FaHome />
              )}
            </div>

            {/* CONVERSATION CONTENT */}

            <div className="conversation-content">
              <div className="conversation-top">
                <div>
                  <h2>{conversation.agent?.name || "Property Agent"}</h2>

                  <span>
                    <FaHome />
                    {conversation.property?.title || "Property"}
                  </span>
                </div>

                {conversation.lastMessageAt && (
                  <time>
                    <FaClock />
                    {formatDate(conversation.lastMessageAt)}
                  </time>
                )}
              </div>

              <p className="conversation-last-message">
                {conversation.lastMessage || "No messages yet."}
              </p>

              {/* UNREAD */}

              {conversation.clientUnreadCount > 0 && (
                <span className="conversation-unread">
                  {conversation.clientUnreadCount}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

