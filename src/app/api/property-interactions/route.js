import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import PropertyInteraction from "@/models/PropertyInteraction";
import Property from "@/models/Property";

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

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can access interaction history.",
        },
        { status: 403 },
      );
    }

    const interactions = await PropertyInteraction.find({
      client: session.user.id,
    })
      .populate(
        "property",
        "title propertyType price currency location bedrooms bathrooms area",
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: interactions,
    });
  } catch (error) {
    console.error("Property interactions GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
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

    // Only clients should generate recommendation behavior.
    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can record property interactions.",
        },
        { status: 403 },
      );
    }

    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Property ID is required.",
        },
        { status: 400 },
      );
    }

    const property = await Property.findById(propertyId).select("_id");

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: "Property not found.",
        },
        { status: 404 },
      );
    }

    /*
     * Don't create hundreds of identical view records
     * when the client refreshes the page repeatedly.
     *
     * One view for the same client/property within
     * the same day is enough for our first version.
     */
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const existingView = await PropertyInteraction.findOne({
      client: session.user.id,
      property: propertyId,
      type: "view",
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (existingView) {
      return NextResponse.json({
        success: true,
        recorded: false,
        message: "Property view already recorded today.",
      });
    }

    await PropertyInteraction.create({
      client: session.user.id,
      property: propertyId,
      type: "view",
    });

    return NextResponse.json({
      success: true,
      recorded: true,
      message: "Property view recorded.",
    });
  } catch (error) {
    console.error("Property interaction error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
