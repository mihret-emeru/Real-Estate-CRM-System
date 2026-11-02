import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Gmail SMTP credentials are not configured.");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to || !subject || (!html && !text)) {
    return {
      success: false,
      error: "Recipient, subject, and email content are required.",
    };
  }

  try {
    const mailer = getTransporter();

    const result = await mailer.sendMail({
      from: `"EverHome Real Estate CRM" <${process.env.GMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
    });

    return {
      success: true,
      id: result.messageId,
    };
  } catch (error) {
    console.error("Gmail email sending failed:", error.message);

    return {
      success: false,
      error: error.message || "Failed to send email.",
    };
  }
}
