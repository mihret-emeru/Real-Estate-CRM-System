import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import ViewingRequest from "@/models/ViewingRequest";
import Property from "@/models/Property";
import User from "@/models/User";
import Conversation from "@/models/Conversation";

// ============================================================
// GET AGENT VIEWING REQUESTS
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
          message: "Only agents can access viewing requests.",
        },
        { status: 403 },
      );
    }

    // ==========================================================
    // FIND REQUESTS FOR CURRENT AGENT
    // ==========================================================

    const requests = await ViewingRequest.find({
      agent: session.user.id,
    })
      .populate("client", "name email phone")
      .populate("agent", "name email phone")
      .populate(
        "property",
        "title images price currency status propertyType location",
      )
      .populate(
        "conversation",
        "client agent property status lastMessage lastMessageAt",
      )
      .sort({
        createdAt: -1,
      });

    // ==========================================================
    // RESPONSE
    // ==========================================================

    return NextResponse.json(
      {
        success: true,
        data: requests,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get agent viewing requests error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to load viewing requests.",
      },
      { status: 500 },
    );
  }
}
