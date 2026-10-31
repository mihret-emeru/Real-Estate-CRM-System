import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Conversation from "@/models/Conversation";
import Property from "@/models/Property";

// ============================================================
// GET AGENT CONVERSATIONS
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
    // FIND AGENT CONVERSATIONS
    // ==========================================================

    const conversations = await Conversation.find({
      agent: session.user.id,
      status: "active",
    })
      .populate("client", "name email phone")
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
    console.error("Get agent conversations error:", error);

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
