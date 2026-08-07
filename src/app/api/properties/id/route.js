import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Property from "@/models/Property";

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    await connectDB();

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

// UPDATE PROPERTY
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
      },
    );
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

// DELETE PROPERTY
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
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Property deleted successfully",
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
