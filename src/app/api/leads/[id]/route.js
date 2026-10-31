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

    // Get current lead
    const existingLead = await Lead.findById(id);

    if (!existingLead) {
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

    // Copy existing activities
    const activities = [...existingLead.activities];
    if (body.status && body.status !== existingLead.status) {
      activities.push({
        type: "status_change",
        message: `Status changed from "${existingLead.status}" to "${body.status}"`,
        oldValue: existingLead.status,
        newValue: body.status,
        createdAt: new Date(),
      });
    }
    console.log("OLD NOTES:", existingLead.notes);
    console.log("NEW NOTES:", body.notes);

    if (body.notes !== undefined && body.notes !== existingLead.notes) {
      activities.push({
        type: "note",
        message: "Notes updated",
        oldValue: existingLead.notes,
        newValue: body.notes,
      });
    }
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      {
        ...body,
        activities,
      },
      {
        new: true,
        runValidators: true,
      },
    );

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
