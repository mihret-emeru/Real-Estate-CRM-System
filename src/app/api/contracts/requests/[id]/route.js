import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import ContractRequest from "@/models/ContractRequest";
import Contract from "@/models/Contract";
import Lead from "@/models/Lead";
import Property from "@/models/Property";
import { createNotification } from "@/utils/createNotification";
import User from "@/models/User";

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access." },
        { status: 401 },
      );
    }

    if (!["manager", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied." },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid contract request ID." },
        { status: 400 },
      );
    }

    await connectDB();

    const contractRequest = await ContractRequest.findById(id)
      .populate("agent", "name fullName email phone")
      .populate("lead", "fullName email phone status")
      .populate("property", "title price currency propertyType location")
      .populate("reviewedBy", "name fullName")
      .populate("contract", "contractNumber status")
      .lean();

    if (!contractRequest) {
      return NextResponse.json(
        { success: false, message: "Contract request not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: contractRequest,
    });
  } catch (error) {
    console.error("Contract request details error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch contract request details.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access." },
        { status: 401 },
      );
    }

    if (!["manager", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied." },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid contract request ID." },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Invalid review action." },
        { status: 400 },
      );
    }

    if (action === "reject" && (!rejectionReason || !rejectionReason.trim())) {
      return NextResponse.json(
        { success: false, message: "Please provide a rejection reason." },
        { status: 400 },
      );
    }

    await connectDB();

    const contractRequest = await ContractRequest.findById(id);

    if (!contractRequest) {
      return NextResponse.json(
        { success: false, message: "Contract request not found." },
        { status: 404 },
      );
    }

    if (contractRequest.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "This request has already been reviewed.",
        },
        { status: 400 },
      );
    }

    contractRequest.status = action === "approve" ? "approved" : "rejected";
    contractRequest.reviewedBy = session.user.id;
    contractRequest.reviewedAt = new Date();
    contractRequest.rejectionReason =
      action === "reject" ? rejectionReason.trim() : "";

    await contractRequest.save();

    const agent = await User.findById(contractRequest.agent).select("_id");

    if (agent) {
      const approved = action === "approve";

      await createNotification({
        recipient: agent._id,
        type: approved
          ? "contract_request_approved"
          : "contract_request_rejected",
        title: approved
          ? "Contract Request Approved"
          : "Contract Request Rejected",
        message: approved
          ? "Your contract request has been approved by the manager."
          : `Your contract request was rejected. Reason: ${rejectionReason.trim()}`,
        link: "/agent/contract-requests",
        relatedId: contractRequest._id,
        metadata: {
          requestId: contractRequest._id,
          status: contractRequest.status,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Contract request approved successfully."
          : "Contract request rejected successfully.",
      data: {
        _id: contractRequest._id,
        status: contractRequest.status,
        reviewedAt: contractRequest.reviewedAt,
      },
    });
  } catch (error) {
    console.error("Contract request review error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to review contract request.",
      },
      { status: 500 },
    );
  }
}
