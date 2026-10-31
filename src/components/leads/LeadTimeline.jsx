"use client";

import {
  FaPlusCircle,
  FaExchangeAlt,
  FaStickyNote,
  FaPhone,
  FaEnvelope,
  FaCalendarCheck,
  FaHome,
} from "react-icons/fa";

export default function LeadTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return <p className="empty-timeline">No activities yet.</p>;
  }

  const activityIcons = {
    created: <FaPlusCircle />,
    status_change: <FaExchangeAlt />,
    property_interest: <FaHome />,
    note: <FaStickyNote />,
    call: <FaPhone />,
    email: <FaEnvelope />,
    meeting: <FaCalendarCheck />,
  };

  const activityTitles = {
    created: "Lead Created",
    status_change: "Status Changed",
    property_interest: "Property Interest",
    note: "Notes Updated",
    call: "Phone Call",
    meeting: "Meeting",
    email: "Email",
  };

  return (
    <div className="lead-timeline">
      {activities.map((activity, index) => (
        <div
          key={`${activity.createdAt}-${activity.type}-${index}`}
          className="timeline-item"
        >
          <div className={`timeline-icon ${activity.type}`}>
            {activityIcons[activity.type]}
          </div>

          <div className="timeline-content">
            <h4>
              {activityTitles[activity.type] ||
                activity.type
                  ?.replaceAll("_", " ")
                  .replace(/\b\w/g, (character) => character.toUpperCase())}
            </h4>

            {activity.type !== "note" && (
              <p className="timeline-message">{activity.message}</p>
            )}

            {activity.type === "note" && (
              <div className="note-history">
                <div>
                  <strong>Previous:</strong>
                  <p>{activity.oldValue || "No previous notes"}</p>
                </div>

                <div>
                  <strong>New:</strong>
                  <p>{activity.newValue || "No new notes"}</p>
                </div>
              </div>
            )}

            <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
