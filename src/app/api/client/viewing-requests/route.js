import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Conversation from "@/models/Conversation";
import ViewingRequest from "@/models/ViewingRequest";
import Lead from "@/models/Lead";

// ============================================================
// GET CLIENT VIEWING REQUEST
// ============================================================

export async function GET(request) {
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
    // CLIENT ONLY
    // ==========================================================

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can access viewing requests.",
        },
        { status: 403 },
      );
    }

    // ==========================================================
    // GET CONVERSATION ID
    // ==========================================================

    const { searchParams } = new URL(request.url);

    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation ID is required.",
        },
        { status: 400 },
      );
    }

    // ==========================================================
    // FIND VIEWING REQUEST
    // ==========================================================

    const viewingRequest = await ViewingRequest.findOne({
      conversation: conversationId,
      client: session.user.id,
    })
      .populate("agent", "name email phone")
      .populate("property", "title images price currency status propertyType")
      .populate("conversation");

    // ==========================================================
    // NO REQUEST
    // ==========================================================

    if (!viewingRequest) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return NextResponse.json({
      success: true,
      data: viewingRequest,
    });
  } catch (error) {
    console.error("Get viewing request error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load viewing request.",
      },
      { status: 500 },
    );
  }
}

// ============================================================
// CREATE VIEWING REQUEST
// ============================================================

export async function POST(request) {
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
    // CLIENT ONLY
    // ==========================================================

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can request property viewings.",
        },
        { status: 403 },
      );
    }

    // ==========================================================
    // REQUEST BODY
    // ==========================================================

    const body = await request.json();

    const { conversationId, requestedDate, requestedTime, message } = body;

    if (!conversationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Conversation ID is required.",
        },
        { status: 400 },
      );
    }

    if (!requestedDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Viewing date is required.",
        },
        { status: 400 },
      );
    }

    if (!requestedTime) {
      return NextResponse.json(
        {
          success: false,
          message: "Viewing time is required.",
        },
        { status: 400 },
      );
    }

    // ==========================================================
    // VALIDATE DATE
    // ==========================================================

    const viewingDate = new Date(requestedDate);

    if (Number.isNaN(viewingDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid viewing date.",
        },
        { status: 400 },
      );
    }

    // ==========================================================
    // PREVENT PAST DATES
    // ==========================================================

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    viewingDate.setHours(0, 0, 0, 0);

    if (viewingDate < today) {
      return NextResponse.json(
        {
          success: false,
          message: "Viewing date cannot be in the past.",
        },
        { status: 400 },
      );
    }

    // ==========================================================
    // FIND CONVERSATION
    // ==========================================================

    const conversation = await Conversation.findOne({
      _id: conversationId,
      client: session.user.id,
      status: "active",
    }).populate("property", "title");

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
    // CHECK EXISTING REQUEST
    // ==========================================================

    const existingRequest = await ViewingRequest.findOne({
      conversation: conversation._id,
      client: session.user.id,
      status: {
        $in: ["pending", "accepted"],
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You already have an active viewing request for this property.",
          data: existingRequest,
        },
        { status: 409 },
      );
    }

    // ==========================================================
    // CREATE VIEWING REQUEST
    // ==========================================================

    const viewingRequest = await ViewingRequest.create({
      client: session.user.id,
      agent: conversation.agent,
      property: conversation.property,
      conversation: conversation._id,
      requestedDate: viewingDate,
      requestedTime: String(requestedTime).trim(),
      message: String(message || "").trim(),
      status: "pending",
    });

    // ==========================================================
    // UPDATE LEAD SCORE
    // ==========================================================

    const lead = await Lead.findOne({
      client: session.user.id,
    });

    if (lead) {
      lead.leadScore = Math.min(lead.leadScore + 30, 100);

      lead.activities.push({
        type: "meeting",
        message: `Client requested a viewing for ${conversation.property.title}.`,
        createdAt: new Date(),
      });

      await lead.save();
    }

    // ==========================================================
    // POPULATE RESPONSE
    // ==========================================================

    const populatedViewingRequest = await ViewingRequest.findById(
      viewingRequest._id,
    )
      .populate("agent", "name email phone")
      .populate("property", "title images price currency status propertyType")
      .populate("conversation");

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,
        message: "Viewing request submitted successfully.",
        data: populatedViewingRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create viewing request error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create viewing request.",
      },
      { status: 500 },
    );
  }
}
