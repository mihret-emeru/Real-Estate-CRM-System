import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Property from "@/models/Property";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3001",
  "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const property = await Property.findById(id).populate(
      "assignedAgent",
      "name email phone",
    );

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: "Property not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: property,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Get property error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const body = await request.json();

    const updatedProperty = await Property.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).populate("assignedAgent", "name email phone");

    if (!updatedProperty) {
      return NextResponse.json(
        {
          success: false,
          message: "Property not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedProperty,
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Update property error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const deletedProperty = await Property.findByIdAndDelete(id);

    if (!deletedProperty) {
      return NextResponse.json(
        {
          success: false,
          message: "Property not found",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Property deleted successfully",
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Delete property error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
