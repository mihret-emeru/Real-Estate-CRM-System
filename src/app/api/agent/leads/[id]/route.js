import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Lead from "@/models/Lead";
import Property from "@/models/Property";

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
          message: "Only agents can access lead details.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    const lead = await Lead.findById(id)
      .populate(
        "interestedProperty",
        "title price currency propertyType status location images assignedAgent",
      )
      .populate("client", "name email phone")
      .lean();

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found.",
        },
        { status: 404 },
      );
    }

    if (!lead.interestedProperty) {
      return NextResponse.json(
        {
          success: false,
          message: "This lead is not connected to a property.",
        },
        { status: 404 },
      );
    }

    const property = await Property.findOne({
      _id: lead.interestedProperty._id,
      assignedAgent: session.user.id,
    }).select("_id");

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view this lead.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Agent lead detail API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load lead.",
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
          message: "Only agents can update leads.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    const body = await request.json();

    const { status, notes } = body;

    if (
      status !== undefined &&
      !["new", "contacted", "qualified", "negotiation", "won", "lost"].includes(
        status,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid lead status.",
        },
        { status: 400 },
      );
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found.",
        },
        { status: 404 },
      );
    }

    const oldStatus = lead.status;
    const oldNotes = lead.notes || "";

    if (status !== undefined && status !== oldStatus) {
      lead.activities.push({
        type: "status_change",
        message: `Lead status changed from ${oldStatus} to ${status}.`,
        oldValue: oldStatus,
        newValue: status,
        createdAt: new Date(),
      });

      lead.status = status;
    }

    if (notes !== undefined && notes !== oldNotes) {
      lead.activities.push({
        type: "note",
        message: "Lead notes updated.",
        oldValue: oldNotes,
        newValue: notes,
        createdAt: new Date(),
      });

      lead.notes = notes;
    }

    await lead.save();

    const updatedLead = await Lead.findById(lead._id)
      .populate(
        "interestedProperty",
        "title price currency propertyType status location images assignedAgent",
      )
      .populate("client", "name email phone");

    return NextResponse.json({
      success: true,
      message: "Lead updated successfully.",
      data: updatedLead,
    });
  } catch (error) {
    console.error("Agent lead update API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update lead.",
      },
      { status: 500 },
    );
  }
}
