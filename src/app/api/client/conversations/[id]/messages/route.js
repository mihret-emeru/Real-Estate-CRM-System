import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

// ============================================================
// GET MESSAGES
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

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can access messages.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    // ==========================================================
    // FIND CONVERSATION
    // ==========================================================

    const conversation = await Conversation.findOne({
      _id: id,
      client: session.user.id,
    })
      .populate("agent", "name email phone")
      .populate("property", "title images price currency status propertyType");

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation not found.",
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
    //
    // Messages sent by the agent to the client are now read.
    //

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

    // Reset client's unread count.

    if (conversation.clientUnreadCount > 0) {
      conversation.clientUnreadCount = 0;
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
    console.error("Get conversation messages error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to load messages.",
      },
      { status: 500 },
    );
  }
}

// ============================================================
// SEND MESSAGE
// ============================================================

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

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can send messages.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

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
      client: session.user.id,
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
      receiver: conversation.agent,
      content,
      read: false,
    });

    // ==========================================================
    // UPDATE CONVERSATION
    // ==========================================================

    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();

    // Agent now has one unread message.

    conversation.agentUnreadCount += 1;

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
    console.error("Send message error:", error);

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
