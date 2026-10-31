import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can access notifications.",
        },
        { status: 403 },
      );
    }

    const notifications = await Notification.find({
      recipient: session.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: session.user.id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Client notifications GET error:", error);

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
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can update notifications.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const { notificationId, markAll } = body;

    // ==========================================
    // MARK ALL AS READ
    // ==========================================

    if (markAll === true) {
      await Notification.updateMany(
        {
          recipient: session.user.id,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
          },
        },
      );

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read.",
      });
    }

    // ==========================================
    // MARK ONE AS READ
    // ==========================================

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
        _id: notificationId,
        recipient: session.user.id,
      },
      {
        $set: {
          isRead: true,
        },
      },
      {
        new: true,
      },
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
    console.error("Client notifications PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update notification.",
      },
      { status: 500 },
    );
  }
}
