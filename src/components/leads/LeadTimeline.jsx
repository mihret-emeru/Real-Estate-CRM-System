"use client";
import {
  FaPlusCircle,
  FaExchangeAlt,
  FaStickyNote,
  FaPhone,
  FaEnvelope,
  FaCalendarCheck,
} from "react-icons/fa";

export default function LeadTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return <p className="empty-timeline">No activities yet.</p>;
  }

  const activityIcons = {
    created: <FaPlusCircle />,
    status_change: <FaExchangeAlt />,
    note: <FaStickyNote />,
    call: <FaPhone />,
    email: <FaEnvelope />,
    meeting: <FaCalendarCheck />,
  };

  return (
    <div className="lead-timeline">
      {activities.map((activity, index) => (
        <div key={index} className="timeline-item">
          <div className={`timeline-icon ${activity.type}`}>
            {activityIcons[activity.type]}
          </div>

          <div className="timeline-content">
            <h4>
              {activity.type === "created" && "Lead Created"}

              {activity.type === "status_change" && "Status Changed"}

              {activity.type === "note" && "Notes Updated"}

              {activity.type === "call" && "Phone Call"}

              {activity.type === "meeting" && "Meeting"}

              {activity.type === "email" && "Email"}
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

