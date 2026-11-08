import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { sendEmail } from "@/utils/sendEmail";

export async function POST(request) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter your email address.",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Use the same response whether the account exists or not.
    const successMessage =
      "If an account exists with this email, a password reset link will be sent.";

    if (!user || !user.isActive) {
      return NextResponse.json({
        success: true,
        message: successMessage,
      });
    }

    // Generate a secure random token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only the hashed token in MongoDB.
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl = new URL(
      `/reset-password?token=${resetToken}`,
      new URL(request.url).origin,
    ).toString();

    const emailResult = await sendEmail({
      to: user.email,
      subject: "Reset Your EverHome Account Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 25px; color: #333;">
          <h2 style="color: #58745d;">Password Reset Request</h2>

          <p>Hello ${user.name.replace(
            /[&<>"']/g,
            (char) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[char],
          )},</p>

          <p>We received a request to reset your EverHome Real Estate CRM account password.</p>

          <p>Click the button below to create a new password:</p>

          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 24px; background: #58745d; color: white; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>

          <p>This link expires in <strong>15 minutes</strong> and can only be used once.</p>

          <p>If you did not request this change, you can safely ignore this email.</p>

          <p>Regards,<br/>EverHome Real Estate CRM Team</p>
        </div>
      `,
      text: `Reset your EverHome password using this link: ${resetUrl}. This link expires in 15 minutes.`,
    });

    if (!emailResult.success) {
      console.error("Password reset email failed:", emailResult.error);

      // Invalidate the token if the email could not be sent.
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
    });
  } catch (error) {
    console.error("Forgot password API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to process your request. Please try again later.",
      },
      { status: 500 },
    );
  }
}
