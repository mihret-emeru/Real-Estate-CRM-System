"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { FaComments, FaUser, FaHome, FaClock } from "react-icons/fa";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import "@/styles/agent/messages.css";
import "@/styles/agent/messages-list.css";

export default function AgentMessagesPage() {
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

      const response = await fetch("/api/agent/conversations", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load conversations.");
      }

      setConversations(data.data || []);
    } catch (error) {
      console.error("Fetch agent conversations error:", error);

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
      <div className="agent-messages-page">
        <div className="agent-messages-loading">
          <LoadingSpinner message="Loading messages..." />
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="agent-messages-page">
        <div className="agent-messages-error">
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
      <div className="agent-messages-page">
        <div className="agent-messages-header">
          <div>
            <span>COMMUNICATION</span>

            <h1>Messages</h1>

            <p>
              Communicate with clients interested in your assigned properties.
            </p>
          </div>

          <FaComments className="agent-messages-header-icon" />
        </div>

        <div className="agent-messages-empty">
          <FaComments />

          <h2>No conversations yet</h2>

          <p>
            When a client contacts you about one of your assigned properties,
            the conversation will appear here.
          </p>

          <Link href="/agent/properties">View Assigned Properties</Link>
        </div>
      </div>
    );
  }

  // ==========================================================
  // CONVERSATIONS
  // ==========================================================

  return (
    <div className="agent-messages-page">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="agent-messages-header">
        <div>
          <span>COMMUNICATION</span>

          <h1>Messages</h1>

          <p>
            Communicate with clients interested in your assigned properties.
          </p>
        </div>

        <FaComments className="agent-messages-header-icon" />
      </div>

      {/* ======================================================
          CONVERSATION LIST
          ====================================================== */}

      <div className="agent-conversation-list">
        {conversations.map((conversation) => (
          <Link
            key={conversation._id}
            href={`/agent/messages/${conversation._id}`}
            className="agent-conversation-card"
          >
            {/* PROPERTY IMAGE */}

            <div className="agent-conversation-property-image">
              {conversation.property?.images?.[0] ? (
                <img
                  src={conversation.property.images[0]}
                  alt={conversation.property.title}
                />
              ) : (
                <FaHome />
              )}
            </div>

            {/* CONTENT */}

            <div className="agent-conversation-content">
              <div className="agent-conversation-top">
                <div>
                  <h2>{conversation.client?.name || "Client"}</h2>

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

              {/* LAST MESSAGE */}

              <p className="agent-conversation-last-message">
                {conversation.lastMessage || "No messages yet."}
              </p>

              {/* UNREAD */}

              {conversation.agentUnreadCount > 0 && (
                <span className="agent-conversation-unread">
                  {conversation.agentUnreadCount}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
