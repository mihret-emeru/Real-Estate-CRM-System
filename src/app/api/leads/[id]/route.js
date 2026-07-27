import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";

export async function GET(request, { params }) {
  const { id } = await params;

  try {
    await connectDB();

    const lead = await Lead.findById(id)
      .populate("client", "name email")
      .populate("interestedProperty", "title price");

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      data: lead,
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
export async function PUT(request, { params }) {
  const { id } = await params;

  try {
    await connectDB();

    const body = await request.json();

    const updatedLead = await Lead.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedLead) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedLead,
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
export async function DELETE(request, { params }) {
  const { id } = await params;

  try {
    await connectDB();

    const deletedLead = await Lead.findByIdAndDelete(id);

    if (!deletedLead) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Lead deleted successfully",
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

