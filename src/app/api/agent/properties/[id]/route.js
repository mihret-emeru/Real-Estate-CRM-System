import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Property from "@/models/Property";
import User from "@/models/User";

export async function GET(request, { params }) {
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
          message: "Only agents can access property details.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Property ID is required.",
        },
        { status: 400 },
      );
    }

    const property = await Property.findOne({
      _id: id,
      assignedAgent: session.user.id,
    })
      .populate("assignedAgent", "name email phone role")
      .populate("createdBy", "name email role")
      .populate("owner", "name email phone");

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: "Property not found or not assigned to you.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error("Agent property detail API error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid property ID.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load property details.",
      },
      { status: 500 },
    );
  }
}
