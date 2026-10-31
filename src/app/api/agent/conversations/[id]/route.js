import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import Property from "@/models/Property";
import User from "@/models/User";

// ============================================================
// GET AGENT CONVERSATION + MESSAGES
// ============================================================

export async function GET(request, { params }) {
  try {
    await connectDB();

    // ==========================================================
    // AUTHENTICATION
    // ==========================================================

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

    // ==========================================================
    // AGENT ONLY
    // ==========================================================

    if (session.user.role !== "agent") {
      return NextResponse.json(
        {
          success: false,
          message: "Only agents can access conversations.",
        },
        { status: 403 },
      );
    }

    // ==========================================================
    // PARAMETER
    // ==========================================================

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation ID is required.",
        },
        { status: 400 },
      );
    }

    // ==========================================================
    // FIND CONVERSATION
    // ==========================================================

    const conversation = await Conversation.findOne({
      _id: id,
      agent: session.user.id,
      status: "active",
    })
      .populate("client", "name email phone")
      .populate(
        "property",
        "title images price currency status propertyType location",
      );

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation not found or is no longer active.",
        },
        { status: 404 },
      );
    }

    // ==========================================================
    // GET MESSAGES
    // ==========================================================

    const messages = await Message.find({
      conversation: conversation._id,
    })
      .populate("sender", "name email role")
      .populate("receiver", "name email role")
      .sort({
        createdAt: 1,
      });

    // ==========================================================
    // MARK CLIENT MESSAGES AS READ
    // ==========================================================

    await Message.updateMany(
      {
        conversation: conversation._id,
        receiver: session.user.id,
        read: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      },
    );

    // ==========================================================
    // RESET AGENT UNREAD COUNT
    // ==========================================================

    if (conversation.agentUnreadCount > 0) {
      conversation.agentUnreadCount = 0;
      await conversation.save();
    }

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return NextResponse.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error) {
    console.error("Get agent conversation error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load conversation.",
      },
      { status: 500 },
    );
  }
}
