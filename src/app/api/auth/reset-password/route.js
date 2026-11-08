import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Reset token and new password are required.",
        },
        { status: 400 },
      );
    }

    // Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least 8 characters, including uppercase, lowercase, a number, and a special character.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    // Hash the received token to compare with the database.
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
      isActive: true,
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This password reset link is invalid or has expired. Please request a new one.",
        },
        { status: 400 },
      );
    }

    // Hash the new password.
    user.password = await bcrypt.hash(password, 10);

    // Invalidate the reset token after successful use.
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Clear failed login attempts after verified password recovery.
    user.failedLoginAttempts = 0;
    user.lastFailedLoginAt = null;
    user.lockedUntil = null;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to reset your password. Please try again.",
      },
      { status: 500 },
    );
  }
}
