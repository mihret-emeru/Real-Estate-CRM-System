import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Lead from "@/models/Lead";

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

    if (session.user.role !== "agent") {
      return NextResponse.json(
        {
          success: false,
          message: "Only agents can access leads.",
        },
        { status: 403 },
      );
    }

    const leads = await Lead.find()
      .populate(
        "interestedProperty",
        "title price currency propertyType status location images assignedAgent",
      )
      .populate("client", "name email phone")
      .sort({
        createdAt: -1,
      });

    return NextResponse.json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error("Agent leads API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load leads.",
      },
      { status: 500 },
    );
  }
}
