import { Resend } from "resend";

let resendClient;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

/**
 * Send a transactional email.
 *
 * Returns a result instead of throwing so an email failure
 * does not automatically interrupt the calling workflow.
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!to || !subject || (!html && !text)) {
    return {
      success: false,
      error: "Recipient, subject, and email content are required.",
    };
  }

  try {
    const resend = getResendClient();

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Your CRM <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
    });

    if (result.error) {
      console.error("Resend email error:", result.error);

      return {
        success: false,
        error: result.error.message || "Failed to send email.",
      };
    }

    return {
      success: true,
      id: result.data?.id,
    };
  } catch (error) {
    console.error("Email sending failed:", error.message);

    return {
      success: false,
      error: "Email sending failed.",
    };
  }
}
