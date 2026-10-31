import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

export async function POST(request, { params }) {
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
          message: "Only agents can send messages.",
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
    // REQUEST BODY
    // ==========================================================

    const body = await request.json();

    const content = String(body.content || "").trim();

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          message: "Message cannot be empty.",
        },
        { status: 400 },
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          message: "Message cannot exceed 2000 characters.",
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
    });

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
    // CREATE MESSAGE
    // ==========================================================

    const message = await Message.create({
      conversation: conversation._id,
      sender: session.user.id,
      receiver: conversation.client,
      content,
      read: false,
    });

    // ==========================================================
    // UPDATE CONVERSATION
    // ==========================================================

    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();

    // Client has a new unread message.

    conversation.clientUnreadCount += 1;

    await conversation.save();

    // ==========================================================
    // POPULATE MESSAGE
    // ==========================================================

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email role")
      .populate("receiver", "name email role");

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,
        message: "Message sent successfully.",
        data: populatedMessage,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Agent send message error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to send message.",
      },
      { status: 500 },
    );
  }
}
