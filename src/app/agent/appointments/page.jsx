"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaEye,
  FaCheck,
  FaTimes,
  FaCalendarAlt,
  FaList,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import CustomDropdown from "@/components/common/CustomDropdown";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import "@/styles/agent/appointments.css";

export default function AgentAppointmentsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [agentNote, setAgentNote] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  const [calendarDate, setCalendarDate] = useState(new Date());

  async function fetchRequests() {
    try {
      setLoading(true);

      const response = await fetch("/api/agent/viewing-requests");

      const data = await response.json();

      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function updateRequest(id, payload) {
    try {
      const response = await fetch(`/api/agent/viewing-requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        alert("The server returned an invalid response.");
        return false;
      }

      if (!response.ok || !data?.success) {
        alert(data?.message || "Failed to update appointment.");
        return false;
      }

      setRequests((currentRequests) =>
        currentRequests.map((request) =>
          request._id === id ? data.data : request,
        ),
      );

      setSelectedRequest((currentRequest) =>
        currentRequest?._id === id ? data.data : currentRequest,
      );

      return true;
    } catch (error) {
      console.error("Failed to update appointment:", error);
      alert(error.message || "Failed to update appointment.");
      return false;
    }
  }

  async function handleAccept(request) {
    const success = await updateRequest(request._id, {
      status: "accepted",
      scheduledDate: request.requestedDate
        ? new Date(request.requestedDate).toISOString()
        : null,
      scheduledTime: request.requestedTime || "",
    });

    if (success) {
      alert("Appointment accepted.");
    }
  }

  async function handleDecline(request) {
    const confirmed = window.confirm(
      "Are you sure you want to decline this appointment?",
    );

    if (!confirmed) return;

    const success = await updateRequest(request._id, {
      status: "declined",
    });

    if (success) {
      alert("Appointment declined.");
    }
  }

  function openReschedule(request) {
    setSelectedRequest(request);

    const date = request.scheduledDate || request.requestedDate;

    setScheduledDate(date ? new Date(date).toISOString().split("T")[0] : "");

    setScheduledTime(request.scheduledTime || request.requestedTime || "");

    setAgentNote(request.agentNote || "");

    setShowRescheduleModal(true);
  }

  async function handleReschedule() {
    if (!selectedRequest) return;

    if (!scheduledDate || !scheduledTime) {
      alert("Please select a date and time.");
      return;
    }

    const success = await updateRequest(selectedRequest._id, {
      status: "accepted",
      scheduledDate,
      scheduledTime,
      agentNote,
    });

    if (success) {
      setShowRescheduleModal(false);
      setSelectedRequest(null);
      alert("Appointment rescheduled.");
    }
  }

  function openView(request) {
    setSelectedRequest(request);
    setShowViewModal(true);
  }

  function closeViewModal() {
    setShowViewModal(false);
    setSelectedRequest(null);
  }

  function closeRescheduleModal() {
    setShowRescheduleModal(false);
    setSelectedRequest(null);
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatMonth(date) {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  function isSameDay(firstDate, secondDate) {
    if (!firstDate || !secondDate) return false;

    const first = new Date(firstDate);
    const second = new Date(secondDate);

    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  }

  function getCalendarDays() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    for (let index = 0; index < startingDay; index += 1) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(year, month, day));
    }

    return days;
  }

  function getRequestsForDay(date) {
    if (!date) return [];

    return filteredRequests.filter((request) => {
      const appointmentDate = request.scheduledDate || request.requestedDate;

      return isSameDay(appointmentDate, date);
    });
  }

  function goToPreviousMonth() {
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1),
    );
  }

  function goToNextMonth() {
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1),
    );
  }

  function goToToday() {
    setCalendarDate(new Date());
  }

  const filteredRequests = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return requests.filter((request) => {
      const matchesSearch =
        !searchValue ||
        request.client?.name?.toLowerCase().includes(searchValue) ||
        request.client?.phone?.toLowerCase().includes(searchValue) ||
        request.client?.email?.toLowerCase().includes(searchValue) ||
        request.property?.title?.toLowerCase().includes(searchValue) ||
        request.property?.location?.city?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const pendingCount = requests.filter(
    (request) => request.status === "pending",
  ).length;

  const acceptedCount = requests.filter(
    (request) => request.status === "accepted",
  ).length;

  const completedCount = requests.filter(
    (request) => request.status === "completed",
  ).length;

  const today = new Date();

  const todayCount = requests.filter((request) => {
    const date = request.scheduledDate || request.requestedDate;

    return date && isSameDay(date, today);
  }).length;

  const calendarDays = getCalendarDays();

  if (loading) {
    return (
      <div className="agent-appointments-page">
        <div className="agent-appointments-loading">
          <LoadingSpinner message="Loading appointments..." />
        </div>
      </div>
    );
  }

  return (
    <div className="agent-appointments-page">
      <div className="agent-appointments-header">
        <div>
          <span className="agent-appointments-eyebrow">
            Appointment Management
          </span>

          <h1>Appointments</h1>

          <p>Manage client property viewing requests and appointments.</p>
        </div>
      </div>

      <div className="agent-appointment-summary">
        <div className="agent-appointment-summary-card">
          <span>Pending Requests</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="agent-appointment-summary-card">
          <span>Accepted</span>
          <strong>{acceptedCount}</strong>
        </div>

        <div className="agent-appointment-summary-card">
          <span>Today</span>
          <strong>{todayCount}</strong>
        </div>

        <div className="agent-appointment-summary-card">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>
      </div>

      <div className="agent-appointments-toolbar">
        <div className="agent-appointments-search">
          <FaSearch />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search client or property..."
          />
        </div>

        <CustomDropdown
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            {
              value: "all",
              label: "All Appointments",
            },
            {
              value: "pending",
              label: "Pending",
            },
            {
              value: "accepted",
              label: "Accepted",
            },
            {
              value: "declined",
              label: "Declined",
            },
            {
              value: "completed",
              label: "Completed",
            },
            {
              value: "cancelled",
              label: "Cancelled",
            },
          ]}
        />

        <div className="agent-appointments-view-switch">
          <button
            type="button"
            className={viewMode === "list" ? "active" : ""}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <FaList />
            <span>List</span>
          </button>

          <button
            type="button"
            className={viewMode === "calendar" ? "active" : ""}
            onClick={() => setViewMode("calendar")}
            title="Calendar view"
          >
            <FaCalendarAlt />
            <span>Calendar</span>
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="agent-appointments-empty">
          <h2>No appointments</h2>
          <p>You don't have any viewing requests yet.</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="agent-appointments-empty">
          <h2>No matching appointments</h2>
          <p>Try changing your search or status filter.</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="agent-appointments-list">
          {filteredRequests.map((request) => (
            <div className="agent-appointment-card" key={request._id}>
              <div className="agent-appointment-card-header">
                <div>
                  <h2>{request.property?.title || "Property"}</h2>

                  <p>{request.property?.location?.city || "-"}</p>
                </div>

                <span className={`agent-appointment-status ${request.status}`}>
                  {request.status}
                </span>
              </div>

              <div className="agent-appointment-details">
                <div>
                  <span>Client</span>
                  <strong>{request.client?.name || "-"}</strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>{request.client?.phone || "-"}</strong>
                </div>

                <div>
                  <span>Requested Date</span>
                  <strong>{formatDate(request.requestedDate)}</strong>
                </div>

                <div>
                  <span>Requested Time</span>
                  <strong>{request.requestedTime || "-"}</strong>
                </div>
              </div>

              {request.scheduledDate && (
                <div className="agent-appointment-scheduled">
                  <span>Scheduled appointment</span>

                  <strong>
                    {formatDate(request.scheduledDate)}
                    {" at "}
                    {request.scheduledTime || "-"}
                  </strong>
                </div>
              )}

              {request.message && (
                <div className="agent-appointment-message">
                  <span>Client message</span>
                  <p>{request.message}</p>
                </div>
              )}

              {request.agentNote && (
                <div className="agent-appointment-note">
                  <span>Agent note</span>
                  <p>{request.agentNote}</p>
                </div>
              )}

              <div className="agent-appointment-actions">
                <button
                  type="button"
                  className="view-appointment-btn"
                  onClick={() => openView(request)}
                  title="View appointment"
                >
                  <FaEye />
                </button>

                {request.status === "pending" && (
                  <>
                    <button
                      type="button"
                      className="accept-appointment-btn"
                      onClick={() => handleAccept(request)}
                      title="Accept appointment"
                    >
                      <FaCheck />
                    </button>

                    <button
                      type="button"
                      className="decline-appointment-btn"
                      onClick={() => handleDecline(request)}
                      title="Decline appointment"
                    >
                      <FaTimes />
                    </button>

                    <button
                      type="button"
                      className="reschedule-appointment-btn"
                      onClick={() => openReschedule(request)}
                      title="Reschedule appointment"
                    >
                      <FaCalendarAlt />
                    </button>
                  </>
                )}

                {request.status === "accepted" && (
                  <button
                    type="button"
                    className="reschedule-appointment-btn"
                    onClick={() => openReschedule(request)}
                    title="Reschedule appointment"
                  >
                    <FaCalendarAlt />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="agent-appointments-calendar">
          <div className="agent-calendar-header">
            <div>
              <h2>{formatMonth(calendarDate)}</h2>
              <span>
                {filteredRequests.length} appointment
                {filteredRequests.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="agent-calendar-navigation">
              <button
                type="button"
                onClick={goToPreviousMonth}
                title="Previous month"
              >
                <FaChevronLeft />
              </button>

              <button
                type="button"
                className="agent-calendar-today-btn"
                onClick={goToToday}
              >
                Today
              </button>

              <button type="button" onClick={goToNextMonth} title="Next month">
                <FaChevronRight />
              </button>
            </div>
          </div>

          <div className="agent-calendar-weekdays">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="agent-calendar-grid">
            {calendarDays.map((date, index) => {
              const dayRequests = getRequestsForDay(date);

              return (
                <div
                  className={`agent-calendar-day ${
                    date && isSameDay(date, today) ? "today" : ""
                  }`}
                  key={date ? date.toISOString() : `empty-${index}`}
                >
                  {date && (
                    <>
                      <span className="agent-calendar-day-number">
                        {date.getDate()}
                      </span>

                      <div className="agent-calendar-events">
                        {dayRequests.map((request) => (
                          <button
                            type="button"
                            className={`agent-calendar-event ${request.status}`}
                            key={request._id}
                            onClick={() => openView(request)}
                          >
                            <strong>
                              {request.scheduledTime ||
                                request.requestedTime ||
                                "-"}
                            </strong>

                            <span>{request.property?.title || "Property"}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showViewModal && selectedRequest && (
        <div
          className="agent-appointment-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeViewModal();
            }
          }}
        >
          <div className="agent-appointment-modal">
            <button
              type="button"
              className="agent-appointment-modal-close"
              onClick={closeViewModal}
            >
              ×
            </button>

            <span className="agent-appointment-modal-eyebrow">
              Appointment Details
            </span>

            <div className="agent-appointment-modal-header">
              <div>
                <h2>{selectedRequest.property?.title || "Property"}</h2>

                <p>{selectedRequest.property?.location?.city || "-"}</p>
              </div>

              <span
                className={`agent-appointment-status ${selectedRequest.status}`}
              >
                {selectedRequest.status}
              </span>
            </div>

            <div className="appointment-modal-section">
              <h3>Client Information</h3>

              <div className="appointment-modal-details">
                <div>
                  <span>Name</span>
                  <strong>{selectedRequest.client?.name || "-"}</strong>
                </div>

                <div>
                  <span>Email</span>
                  <strong>{selectedRequest.client?.email || "-"}</strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>{selectedRequest.client?.phone || "-"}</strong>
                </div>
              </div>
            </div>

            <div className="appointment-modal-section">
              <h3>Viewing Request</h3>

              <div className="appointment-modal-details">
                <div>
                  <span>Requested Date</span>
                  <strong>{formatDate(selectedRequest.requestedDate)}</strong>
                </div>

                <div>
                  <span>Requested Time</span>
                  <strong>{selectedRequest.requestedTime || "-"}</strong>
                </div>

                {selectedRequest.scheduledDate && (
                  <div>
                    <span>Scheduled</span>
                    <strong>
                      {formatDate(selectedRequest.scheduledDate)}
                      {" at "}
                      {selectedRequest.scheduledTime || "-"}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {selectedRequest.message && (
              <div className="appointment-modal-full">
                <span>Client message</span>
                <p>{selectedRequest.message}</p>
              </div>
            )}

            {selectedRequest.agentNote && (
              <div className="appointment-modal-full">
                <span>Agent note</span>
                <p>{selectedRequest.agentNote}</p>
              </div>
            )}

            {selectedRequest.status === "pending" && (
              <div className="appointment-modal-actions">
                <button
                  type="button"
                  className="accept-appointment-btn"
                  onClick={async () => {
                    const success = await handleAccept(selectedRequest);

                    if (success) {
                      closeViewModal();
                    }
                  }}
                >
                  <FaCheck />
                  Accept
                </button>

                <button
                  type="button"
                  className="decline-appointment-btn"
                  onClick={async () => {
                    await handleDecline(selectedRequest);
                    closeViewModal();
                  }}
                >
                  <FaTimes />
                  Decline
                </button>

                <button
                  type="button"
                  className="reschedule-appointment-btn"
                  onClick={() => {
                    closeViewModal();
                    openReschedule(selectedRequest);
                  }}
                >
                  <FaCalendarAlt />
                  Reschedule
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showRescheduleModal && selectedRequest && (
        <div
          className="agent-appointment-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeRescheduleModal();
            }
          }}
        >
          <div className="agent-appointment-modal">
            <button
              type="button"
              className="agent-appointment-modal-close"
              onClick={closeRescheduleModal}
            >
              ×
            </button>

            <span className="agent-appointment-modal-eyebrow">
              Appointment Management
            </span>

            <h2>Reschedule Appointment</h2>

            <p className="agent-reschedule-property">
              {selectedRequest.property?.title || "Property"}
            </p>

            <div className="appointment-form">
              <label>
                Date
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(event) => setScheduledDate(event.target.value)}
                />
              </label>

              <label>
                Time
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(event) => setScheduledTime(event.target.value)}
                />
              </label>

              <label>
                Note
                <textarea
                  value={agentNote}
                  onChange={(event) => setAgentNote(event.target.value)}
                  placeholder="Optional note for the client"
                />
              </label>

              <button
                type="button"
                className="save-reschedule-btn"
                onClick={handleReschedule}
              >
                Save Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
