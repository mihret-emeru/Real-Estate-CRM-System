"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BackLink from "@/components/common/BackLink";
import {
  FaArrowLeft,
  FaPaperPlane,
  FaHome,
  FaUser,
  FaClock,
} from "react-icons/fa";

import "@/styles/agent/messages.css";

export default function AgentMessageDetailsPage() {
  const { id } = useParams();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  // ============================================================
  // FETCH CONVERSATION
  // ============================================================

  async function fetchConversation() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/agent/conversations/${id}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load conversation.");
      }

      setConversation(data.data.conversation || data.data);
      setMessages(data.data.messages || []);
    } catch (error) {
      console.error("Fetch agent conversation error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load conversation.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (!id) return;

    fetchConversation();
  }, [id]);

  // ============================================================
  // SCROLL TO BOTTOM
  // ============================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async function handleSendMessage(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    try {
      setSending(true);
      setError("");

      const response = await fetch(`/api/agent/conversations/${id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send message.");
      }

      setMessages((previousMessages) => [...previousMessages, data.data]);

      setMessage("");

      // Update conversation preview immediately.
      setConversation((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          lastMessage: data.data.content,
          lastMessageAt: data.data.createdAt,
        };
      });
    } catch (error) {
      console.error("Send message error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to send message.",
      );
    } finally {
      setSending(false);
    }
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatMessageTime(date) {
    if (!date) return "";

    return new Date(date).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="agent-message-page">
        <div className="agent-message-loading">
          <LoadingSpinner message="Loading conversation..." />
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error && !conversation) {
    return (
      <div className="agent-message-page">
        <div className="agent-message-error">
          <h2>Unable to load conversation</h2>

          <p>{error}</p>

          <button onClick={fetchConversation}>Try Again</button>

          <BackLink href="/agent/messages" label="Back to Messages" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const property = conversation.property;
  const client = conversation.client;

  return (
    <div className="agent-message-page">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="agent-message-header">
        <BackLink href="/agent/messages" label="Back to Messages" />

        <div className="agent-message-heading">
          <div>
            <span>CLIENT COMMUNICATION</span>

            <h1>{client?.name || "Client"}</h1>

            <p>Communicate with the client about this property.</p>
          </div>
        </div>
      </div>

      {/* ======================================================
          PROPERTY CONTEXT
          ====================================================== */}

      <section className="agent-conversation-property">
        <div className="agent-conversation-property-image">
          {property?.images?.[0] ? (
            <img src={property.images[0]} alt={property.title} />
          ) : (
            <FaHome />
          )}
        </div>

        <div className="agent-conversation-property-info">
          <span>PROPERTY</span>

          <h2>{property?.title || "Property"}</h2>

          <p>
            <FaHome />
            {property?.propertyType || "-"}
          </p>

          <p>
            {property?.price
              ? `${Number(property.price).toLocaleString()} ${
                  property.currency || "ETB"
                }`
              : "-"}
          </p>
        </div>

        <Link
          href={`/agent/properties/${property?._id}`}
          className="agent-view-property"
        >
          View Property
        </Link>
      </section>

      {/* ======================================================
          CLIENT INFORMATION
          ====================================================== */}

      <section className="agent-client-info">
        <div className="agent-client-avatar">
          <FaUser />
        </div>

        <div>
          <span>CLIENT</span>

          <strong>{client?.name || "Client"}</strong>

          {client?.email && <small>{client.email}</small>}

          {client?.phone && <small>{client.phone}</small>}
        </div>
      </section>

      {/* ======================================================
          CHAT
          ====================================================== */}

      <section className="agent-chat-card">
        <div className="agent-chat-header">
          <div>
            <h2>Messages</h2>

            <p>Conversation about {property?.title || "this property"}.</p>
          </div>

          {conversation.lastMessageAt && (
            <span>
              <FaClock />
              {formatDate(conversation.lastMessageAt)}
            </span>
          )}
        </div>

        {/* ====================================================
            ERROR WHILE SENDING
            ==================================================== */}

        {error && conversation && (
          <div className="agent-chat-error">{error}</div>
        )}

        {/* ====================================================
            MESSAGE LIST
            ==================================================== */}

        <div className="agent-message-list">
          {messages.length === 0 ? (
            <div className="agent-no-messages">
              <FaUser />

              <h3>No messages yet</h3>

              <p>Start the conversation with the client.</p>
            </div>
          ) : (
            messages.map((item) => {
              const isAgentMessage =
                String(item.sender?._id || item.sender) !== String(client?._id);

              return (
                <div
                  key={item._id}
                  className={`agent-message-row ${
                    isAgentMessage
                      ? "agent-message-row-sent"
                      : "agent-message-row-received"
                  }`}
                >
                  <div
                    className={`agent-message-bubble ${
                      isAgentMessage
                        ? "agent-message-sent"
                        : "agent-message-received"
                    }`}
                  >
                    <p>{item.content}</p>

                    <span>{formatMessageTime(item.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ====================================================
            MESSAGE INPUT
            ==================================================== */}

        <form className="agent-message-input-area" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a message to the client..."
            maxLength={2000}
            disabled={sending}
          />

          <button type="submit" disabled={sending || !message.trim()}>
            <FaPaperPlane />

            <span>{sending ? "Sending..." : "Send"}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
