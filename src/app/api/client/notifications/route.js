import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";

const ALLOWED_ROLES = ["admin", "manager", "agent", "client"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied." },
        { status: 403 },
      );
    }

    await connectDB();

    const notificationFilter = {
      recipient: session.user.id,
    };

    if (session.user.role === "admin") {
      notificationFilter.type = "security_alert";
    }

    const notifications = await Notification.find(notificationFilter)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadFilter = {
      ...notificationFilter,
      isRead: false,
    };

    const unreadCount = await Notification.countDocuments(unreadFilter);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load notifications.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    await connectDB();

    // Admins can update only security notifications.
    const notificationFilter = {
      recipient: session.user.id,
      ...(session.user.role === "admin" ? { type: "security_alert" } : {}),
    };

    if (markAll === true) {
      await Notification.updateMany(
        {
          ...notificationFilter,
          isRead: false,
        },
        {
          $set: { isRead: true },
        },
      );

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read.",
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification ID is required.",
        },
        { status: 400 },
      );
    }

    const notification = await Notification.findOneAndUpdate(
      {
        ...notificationFilter,
        _id: notificationId,
      },
      {
        $set: { isRead: true },
      },
      { new: true },
    );

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          message: "Notification not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    console.error("Notifications PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update notification.",
      },
      { status: 500 },
    );
  }
}
