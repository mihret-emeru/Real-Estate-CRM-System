import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import ViewingRequest from "@/models/ViewingRequest";

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
          message: "Only agents can access viewing requests.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    const viewingRequest = await ViewingRequest.findOne({
      _id: id,
      agent: session.user.id,
    })
      .populate("client", "name email phone")
      .populate(
        "property",
        "title price currency propertyType status location images",
      );

    if (!viewingRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Viewing request not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: viewingRequest,
    });
  } catch (error) {
    console.error("Agent viewing request GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load viewing request.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
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
          message: "Only agents can update viewing requests.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    const body = await request.json();

    const viewingRequest = await ViewingRequest.findOne({
      _id: id,
      agent: session.user.id,
    });

    if (!viewingRequest) {
      return NextResponse.json(
        {
          success: false,
          message: "Viewing request not found.",
        },
        { status: 404 },
      );
    }

    const { status, scheduledDate, scheduledTime, agentNote } = body;

    const allowedStatuses = [
      "pending",
      "accepted",
      "declined",
      "cancelled",
      "completed",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid appointment status.",
        },
        { status: 400 },
      );
    }

    if (status) {
      viewingRequest.status = status;
    }

    if (scheduledDate !== undefined) {
      viewingRequest.scheduledDate = scheduledDate
        ? new Date(scheduledDate)
        : null;
    }

    if (scheduledTime !== undefined) {
      viewingRequest.scheduledTime = String(scheduledTime).trim();
    }

    if (agentNote !== undefined) {
      viewingRequest.agentNote = String(agentNote).trim();
    }

    await viewingRequest.save();

    const updatedRequest = await ViewingRequest.findById(viewingRequest._id)
      .populate("client", "name email phone")
      .populate(
        "property",
        "title price currency propertyType status location images",
      );

    return NextResponse.json({
      success: true,
      message: "Viewing request updated successfully.",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Agent viewing request PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update viewing request.",
      },
      { status: 500 },
    );
  }
}
