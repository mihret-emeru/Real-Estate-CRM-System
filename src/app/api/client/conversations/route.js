import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Conversation from "@/models/Conversation";
import Property from "@/models/Property";

// ============================================================
// GET CLIENT CONVERSATIONS
// ============================================================

export async function GET() {
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
          message: "Only clients can access conversations.",
        },
        { status: 403 },
      );
    }

    // ==========================================================
    // FIND CLIENT CONVERSATIONS
    // ==========================================================

    const conversations = await Conversation.find({
      client: session.user.id,
      status: "active",
    })
      .populate("agent", "name email phone")
      .populate("property", "title images price currency status propertyType")
      .sort({
        lastMessageAt: -1,
        updatedAt: -1,
      });

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Get client conversations error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load conversations.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    // ==========================================
    // AUTHENTICATION
    // ==========================================

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

    // ==========================================
    // CLIENT ONLY
    // ==========================================

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can start conversations.",
        },
        { status: 403 },
      );
    }

    // ==========================================
    // REQUEST BODY
    // ==========================================

    const body = await request.json();

    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Property ID is required.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // FIND PROPERTY
    // ==========================================

    const property = await Property.findById(propertyId).populate(
      "assignedAgent",
      "name email phone",
    );

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: "Property not found.",
        },
        { status: 404 },
      );
    }

    // ==========================================
    // CHECK ASSIGNED AGENT
    // ==========================================

    if (!property.assignedAgent) {
      return NextResponse.json(
        {
          success: false,
          message: "This property does not have an assigned agent yet.",
        },
        { status: 400 },
      );
    }

    const agentId = property.assignedAgent._id;
    const clientId = session.user.id;

    // ==========================================
    // FIND EXISTING CONVERSATION
    // ==========================================

    let conversation = await Conversation.findOne({
      client: clientId,
      agent: agentId,
      property: property._id,
    })
      .populate("agent", "name email phone")
      .populate("property", "title images price currency status");

    // ==========================================
    // CREATE CONVERSATION IF NEEDED
    // ==========================================

    if (!conversation) {
      conversation = await Conversation.create({
        client: clientId,
        agent: agentId,
        property: property._id,
        status: "active",
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("agent", "name email phone")
        .populate("property", "title images price currency status");
    }

    // ==========================================
    // RETURN CONVERSATION
    // ==========================================

    return NextResponse.json({
      success: true,
      message: "Conversation opened successfully.",
      data: conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to open conversation.",
      },
      { status: 500 },
    );
  }
}
