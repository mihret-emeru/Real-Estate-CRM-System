import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Property from "@/models/Property";
import Favorite from "@/models/Favorite";

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
          message: "Only agents can access assigned properties.",
        },
        { status: 403 },
      );
    }

    const properties = await Property.find({
      assignedAgent: session.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    const propertiesWithInterest = await Promise.all(
      properties.map(async (property) => {
        const saveCount = await Favorite.countDocuments({
          property: property._id,
        });

        return {
          ...property,
          saveCount,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: propertiesWithInterest,
    });
  } catch (error) {
    console.error("Agent assigned properties API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load assigned properties.",
      },
      { status: 500 },
    );
  }
}
