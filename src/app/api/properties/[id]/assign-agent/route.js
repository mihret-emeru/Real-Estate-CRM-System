import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Property from "@/models/Property";

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await request.json();

    const property = await Property.findByIdAndUpdate(
      id,
      {
        assignedAgent: body.agentId,
      },
      {
        new: true,
      },
    ).populate("assignedAgent", "name email");

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: "Property not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      data: property,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
