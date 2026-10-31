import Notification from "@/models/Notification";
import User from "@/models/User";
import { sendEmail } from "@/utils/sendEmail";

export async function createNotification({
  recipient,
  type,
  title,
  message,
  link = "",
  metadata = {},
  sendEmailNotification = false,
}) {
  if (!recipient) {
    throw new Error("Notification recipient is required.");
  }

  if (!type || !title || !message) {
    throw new Error("Notification type, title, and message are required.");
  }

  // Create the in-app notification.
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    link,
    metadata,
    isRead: false,
  });

  // Email is optional.
  if (sendEmailNotification) {
    try {
      const user = await User.findById(recipient).select("email").lean();

      if (!user?.email) {
        console.error("Notification recipient has no email address.");
      } else {
        const baseUrl = process.env.NEXTAUTH_URL || "";
        const notificationUrl = link ? `${baseUrl}${link}` : "";

        const safeTitle = escapeHtml(title);
        const safeMessage = escapeHtml(message);
        const safeUrl = escapeHtml(notificationUrl);

        const emailResult = await sendEmail({
          to: user.email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
              <h2>${safeTitle}</h2>
              <p>${safeMessage}</p>
              ${
                notificationUrl
                  ? `<p><a href="${safeUrl}">View notification</a></p>`
                  : ""
              }
              <p style="color: #777; font-size: 12px;">
                This is an automated notification from your Real Estate CRM.
              </p>
            </div>
          `,
          text: `${title}\n\n${message}${
            notificationUrl ? `\n\nView notification: ${notificationUrl}` : ""
          }`,
        });

        if (!emailResult.success) {
          console.error("Notification email failed:", emailResult.error);
        }
      }
    } catch (error) {
      // Email failure must not undo the in-app notification.
      console.error("Notification email error:", error.message);
    }
  }

  // Preserve the original return value.
  return notification;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}
