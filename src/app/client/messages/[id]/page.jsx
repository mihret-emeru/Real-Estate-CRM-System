"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BackLink from "@/components/common/BackLink";

import {
  FaArrowLeft,
  FaHome,
  FaUser,
  FaPaperPlane,
  FaCalendarAlt,
  FaClock,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";

import "@/styles/client/message-chat.css";

export default function ClientMessageChatPage() {
  const { id } = useParams();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [messageText, setMessageText] = useState("");

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ============================================================
  // VIEWING REQUEST
  // ============================================================

  const [viewingRequest, setViewingRequest] = useState(null);

  const [showViewingModal, setShowViewingModal] = useState(false);

  const [viewingDate, setViewingDate] = useState("");
  const [viewingTime, setViewingTime] = useState("");
  const [viewingNote, setViewingNote] = useState("");

  const [requestingViewing, setRequestingViewing] = useState(false);

  const messagesEndRef = useRef(null);

  // ============================================================
  // SAFE JSON RESPONSE
  // ============================================================

  async function getJsonResponse(response) {
    const text = await response.text();

    if (!text) {
      throw new Error(
        `Server returned an empty response (${response.status}).`,
      );
    }

    try {
      return JSON.parse(text);
    } catch {
      console.error("Invalid API response:", text);

      throw new Error(
        `Server returned an invalid response (${response.status}).`,
      );
    }
  }

  // ============================================================
  // FETCH CONVERSATION + MESSAGES
  // ============================================================

  async function fetchMessages() {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/client/conversations/${id}/messages`, {
        cache: "no-store",
      });

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load conversation.");
      }

      setConversation(data.data?.conversation || null);
      setMessages(data.data?.messages || []);
    } catch (error) {
      console.error("Fetch messages error:", error);

      setError(
        error instanceof Error ? error.message : "Failed to load conversation.",
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // FETCH VIEWING REQUEST
  // ============================================================

  async function fetchViewingRequest() {
    if (!id) return;

    try {
      const response = await fetch(
        `/api/client/viewing-requests?conversationId=${id}`,
        {
          cache: "no-store",
        },
      );

      /*
       * If the API doesn't exist yet or returns an empty response,
       * don't break the chat page.
       */

      if (!response.ok) {
        console.error("Viewing request API returned:", response.status);

        return;
      }

      const data = await getJsonResponse(response);

      if (data.success) {
        setViewingRequest(data.data || null);
      }
    } catch (error) {
      console.error("Fetch viewing request error:", error);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (!id) return;

    fetchMessages();
    fetchViewingRequest();
  }, [id]);

  // ============================================================
  // SCROLL TO LATEST MESSAGE
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

    const content = messageText.trim();

    if (!content || sending) return;

    try {
      setSending(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`/api/client/conversations/${id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
        }),
      });

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send message.");
      }

      setMessages((previousMessages) => [...previousMessages, data.data]);

      setMessageText("");

      setConversation((previousConversation) => {
        if (!previousConversation) return previousConversation;

        return {
          ...previousConversation,
          lastMessage: content,
          lastMessageAt: data.data?.createdAt || new Date().toISOString(),
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
  // OPEN VIEWING MODAL
  // ============================================================

  function openViewingModal() {
    setError("");
    setSuccessMessage("");

    setShowViewingModal(true);
  }

  // ============================================================
  // CLOSE VIEWING MODAL
  // ============================================================

  function closeViewingModal() {
    if (requestingViewing) return;

    setShowViewingModal(false);

    setViewingDate("");
    setViewingTime("");
    setViewingNote("");
  }

  // ============================================================
  // SEND VIEWING REQUEST
  // ============================================================

  async function handleSubmitViewingRequest(event) {
    event.preventDefault();

    if (!viewingDate) {
      setError("Please select a viewing date.");
      return;
    }

    if (!viewingTime) {
      setError("Please select a viewing time.");
      return;
    }

    try {
      setRequestingViewing(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch("/api/client/viewing-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: id,
          requestedDate: viewingDate,
          requestedTime: viewingTime,
          message: viewingNote.trim(),
        }),
      });

      const data = await getJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to request property viewing.");
      }

      setViewingRequest(data.data || null);

      setShowViewingModal(false);

      setViewingDate("");
      setViewingTime("");
      setViewingNote("");

      setSuccessMessage("Viewing request sent successfully.");
    } catch (error) {
      console.error("Request viewing error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to request property viewing.",
      );
    } finally {
      setRequestingViewing(false);
    }
  }

  // ============================================================
  // FORMAT MESSAGE TIME
  // ============================================================

  function formatMessageTime(date) {
    if (!date) return "";

    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ============================================================
  // FORMAT DATE
  // ============================================================

  function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // ============================================================
  // FORMAT PRICE
  // ============================================================

  function formatPrice(price, currency) {
    return `${Number(price || 0).toLocaleString()} ${currency || "ETB"}`;
  }

  // ============================================================
  // VIEWING STATUS
  // ============================================================

  function getViewingStatusText() {
    if (!viewingRequest) {
      return null;
    }

    switch (viewingRequest.status) {
      case "pending":
        return "Viewing request pending";

      case "accepted":
        return "Viewing request accepted";

      case "rejected":
        return "Viewing request declined";

      case "cancelled":
        return "Viewing request cancelled";

      default:
        return "Viewing request submitted";
    }
  }

  // ============================================================
  // VIEWING BUTTON DISABLED STATE
  // ============================================================

  const viewingRequestActive =
    viewingRequest?.status === "pending" ||
    viewingRequest?.status === "accepted";

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="client-chat-page">
        <div className="chat-loading">
          <LoadingSpinner message="Loading conversation..." />
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR WITHOUT CONVERSATION
  // ============================================================

  if (error && !conversation) {
    return (
      <div className="client-chat-page">
        <div className="chat-error">
          <FaExclamationTriangle />

          <h2>Unable to load conversation</h2>

          <p>{error}</p>

          <BackLink href="/client/messages" label="Back to Messages" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return null;
  }

  const property = conversation.property;
  const agent = conversation.agent;

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="client-chat-page">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="chat-header">
        <Link href="/client/messages" className="chat-back-link">
          <FaArrowLeft />
          Messages
        </Link>

        <div className="chat-agent-info">
          <div className="chat-agent-avatar">
            <FaUser />
          </div>

          <div>
            <h1>{agent?.name || "Property Agent"}</h1>

            <span>{agent?.email || "Agent"}</span>
          </div>
        </div>

        <button
          type="button"
          className="request-viewing-btn"
          onClick={openViewingModal}
          disabled={viewingRequestActive}
          title={
            viewingRequestActive
              ? getViewingStatusText()
              : "Request a property viewing"
          }
        >
          <FaCalendarAlt />

          {viewingRequest?.status === "accepted"
            ? "Viewing Accepted"
            : viewingRequest?.status === "pending"
              ? "Request Pending"
              : "Request Viewing"}
        </button>
      </div>

      {/* ======================================================
          PROPERTY SUMMARY
          ====================================================== */}

      <section className="chat-property-card">
        <div className="chat-property-image">
          {property?.images?.[0] ? (
            <img src={property.images[0]} alt={property.title} />
          ) : (
            <FaHome />
          )}
        </div>

        <div className="chat-property-info">
          <span>PROPERTY</span>

          <h2>{property?.title || "Property"}</h2>

          <div className="chat-property-details">
            <span>
              <FaHome />
              {property?.propertyType || "-"}
            </span>

            <span>{property?.location?.city || "-"}</span>

            <strong>{formatPrice(property?.price, property?.currency)}</strong>
          </div>
        </div>

        <Link
          href={`/client/properties/${property?._id}`}
          className="chat-view-property-btn"
        >
          View Property
        </Link>
      </section>

      {/* ======================================================
          VIEWING REQUEST STATUS
          ====================================================== */}

      {viewingRequest && (
        <div
          className={`viewing-status viewing-status-${viewingRequest.status}`}
        >
          <FaCalendarAlt />

          <div>
            <strong>{getViewingStatusText()}</strong>

            {viewingRequest.requestedDate && (
              <span>
                {formatDate(viewingRequest.requestedDate)}

                {viewingRequest.requestedTime &&
                  ` at ${viewingRequest.requestedTime}`}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ======================================================
          GLOBAL SUCCESS
          ====================================================== */}

      {successMessage && (
        <div className="chat-success-message">{successMessage}</div>
      )}

      {/* ======================================================
          CHAT AREA
          ====================================================== */}

      <section className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <FaUser />

              <h3>Start a conversation</h3>

              <p>Ask the agent anything about this property.</p>
            </div>
          ) : (
            messages.map((item) => {
              const isClient =
                String(item.sender?._id || item.sender) ===
                String(conversation.client?._id || conversation.client);

              return (
                <div
                  key={item._id}
                  className={`chat-message-row ${
                    isClient ? "client-message" : "agent-message"
                  }`}
                >
                  <div className="chat-message-bubble">
                    <p>{item.content}</p>

                    <time>{formatMessageTime(item.createdAt)}</time>
                  </div>
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ====================================================
            CHAT ERROR
            ==================================================== */}

        {error && conversation && (
          <div className="chat-inline-error">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {/* ====================================================
            MESSAGE INPUT
            ==================================================== */}

        <form className="chat-input-area" onSubmit={handleSendMessage}>
          <textarea
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Write a message to the agent..."
            maxLength={2000}
            rows={2}
            disabled={sending}
          />

          <div className="chat-input-bottom">
            <span>{messageText.length}/2000</span>

            <button
              type="submit"
              disabled={sending || !messageText.trim()}
              className="chat-send-btn"
            >
              <FaPaperPlane />

              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </section>

      {/* ======================================================
          VIEWING REQUEST MODAL
          ====================================================== */}

      {showViewingModal && (
        <div
          className="viewing-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !requestingViewing) {
              closeViewingModal();
            }
          }}
        >
          <div className="viewing-modal">
            <div className="viewing-modal-header">
              <div>
                <span>PROPERTY VIEWING</span>

                <h2>Request a Viewing</h2>
              </div>

              <button
                type="button"
                onClick={closeViewingModal}
                disabled={requestingViewing}
                className="viewing-modal-close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="viewing-modal-property">
              <FaHome />

              <div>
                <strong>{property?.title || "Property"}</strong>

                <span>{property?.location?.city || "Location"}</span>
              </div>
            </div>

            <form
              className="viewing-request-form"
              onSubmit={handleSubmitViewingRequest}
            >
              <div className="viewing-form-row">
                <label>
                  Viewing Date
                  <input
                    type="date"
                    value={viewingDate}
                    onChange={(event) => setViewingDate(event.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={requestingViewing}
                    required
                  />
                </label>

                <label>
                  Preferred Time
                  <input
                    type="time"
                    value={viewingTime}
                    onChange={(event) => setViewingTime(event.target.value)}
                    disabled={requestingViewing}
                    required
                  />
                </label>
              </div>

              <label>
                Note
                <textarea
                  value={viewingNote}
                  onChange={(event) => setViewingNote(event.target.value)}
                  placeholder="Optional message to the agent..."
                  maxLength={500}
                  rows={4}
                  disabled={requestingViewing}
                />
              </label>

              <div className="viewing-modal-actions">
                <button
                  type="button"
                  onClick={closeViewingModal}
                  disabled={requestingViewing}
                  className="viewing-cancel-btn"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={requestingViewing || !viewingDate || !viewingTime}
                  className="viewing-submit-btn"
                >
                  <FaCalendarAlt />

                  {requestingViewing ? "Sending Request..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

