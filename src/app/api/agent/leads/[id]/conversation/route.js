import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Lead from "@/models/Lead";
import User from "@/models/User";
import Property from "@/models/Property";
import Conversation from "@/models/Conversation";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 },
      );
    }

    if (session.user.role !== "agent") {
      return NextResponse.json(
        { success: false, message: "Only agents can access this route." },
        { status: 403 },
      );
    }

    const { id: leadId } = await params;

    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json(
        { success: false, message: "Invalid lead ID." },
        { status: 400 },
      );
    }

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return NextResponse.json(
        { success: false, message: "Lead not found." },
        { status: 404 },
      );
    }

    // Identify the client linked to this lead.
    let client = lead.client
      ? await User.findById(lead.client).select("_id role")
      : null;

    // If the lead has no client ID, try matching its email.
    if (!client && lead.email) {
      client = await User.findOne({
        email: lead.email.trim().toLowerCase(),
        role: "client",
      }).select("_id role");
    }

    if (!client || client.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This lead is not linked to a registered client account. Link the lead to a client before messaging.",
        },
        { status: 400 },
      );
    }

    const agentId = session.user.id;

    // Reuse the most recently active conversation with this client.
    const existingConversation = await Conversation.findOne({
      client: client._id,
      agent: agentId,
      status: "active",
    }).sort({
      lastMessageAt: -1,
      updatedAt: -1,
    });

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        conversationId: String(existingConversation._id),
      });
    }

    // Prefer the property associated with this lead, provided
    // it is assigned to the logged-in agent.
    let property = null;

    if (lead.interestedProperty) {
      property = await Property.findOne({
        _id: lead.interestedProperty,
        assignedAgent: agentId,
      }).select("_id");
    }

    // Registration leads may not have an interested property.
    // Use an assigned property to establish the conversation.
    if (!property) {
      property = await Property.findOne({
        assignedAgent: agentId,
      })
        .sort({ createdAt: -1 })
        .select("_id");
    }

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You have no assigned properties to start this conversation. Ask your manager to assign a property to you.",
        },
        { status: 400 },
      );
    }

    // Create a conversation for this client and agent.
    // The existing schema requires a property.
    let conversation = await Conversation.findOne({
      client: client._id,
      agent: agentId,
      property: property._id,
      status: "active",
    });

    if (!conversation) {
      try {
        conversation = await Conversation.create({
          client: client._id,
          agent: agentId,
          property: property._id,
          status: "active",
        });
      } catch (error) {
        // Handle a duplicate conversation created concurrently.
        if (error.code !== 11000) {
          throw error;
        }

        conversation = await Conversation.findOne({
          client: client._id,
          agent: agentId,
          property: property._id,
          status: "active",
        });
      }
    }

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to create the conversation. Please try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      conversationId: String(conversation._id),
    });
  } catch (error) {
    console.error("Open lead conversation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to open this client's conversation.",
      },
      { status: 500 },
    );
  }
}
