import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import ContractRequest from "@/models/ContractRequest";
import Lead from "@/models/Lead";
import Property from "@/models/Property";
import User from "@/models/User";

import { createNotification } from "@/utils/createNotification";

export async function POST(request) {
  try {
    await connectDB();

    // 1. Authenticate agent
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    if (session.user.role !== "agent") {
      return NextResponse.json(
        { success: false, message: "Only agents can request contracts." },
        { status: 403 },
      );
    }

    // 2. Read request details
    const body = await request.json();

    const {
      leadId,
      propertyId,
      downPayment,
      installmentMonths,
      paymentFrequency,
      terms,
    } = body;

    if (
      !leadId ||
      !propertyId ||
      !mongoose.Types.ObjectId.isValid(leadId) ||
      !mongoose.Types.ObjectId.isValid(propertyId)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid lead ID and property ID are required.",
        },
        { status: 400 },
      );
    }

    // 3. Verify lead
    const lead = await Lead.findById(leadId);

    if (!lead) {
      return NextResponse.json(
        { success: false, message: "Lead not found." },
        { status: 404 },
      );
    }

    if (lead.status !== "negotiation") {
      return NextResponse.json(
        {
          success: false,
          message: "Only leads in negotiation can request contracts.",
        },
        { status: 400 },
      );
    }

    // 4. Find property assigned to this agent
    const property = await Property.findOne({
      _id: propertyId,
      assignedAgent: session.user.id,
    });

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: "Property not found or not assigned to you.",
        },
        { status: 403 },
      );
    }

    if (property.status !== "available") {
      return NextResponse.json(
        {
          success: false,
          message: "This property is no longer available.",
        },
        { status: 400 },
      );
    }

    // 5. Get fixed price and payment configuration from property
    const propertyPrice = Number(property.price);
    const currency = property.currency || "ETB";
    const paymentType = property.paymentType;

    if (!Number.isFinite(propertyPrice) || propertyPrice <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid property price." },
        { status: 400 },
      );
    }

    let finalDownPayment;
    let finalInstallmentMonths = 0;
    let finalPaymentFrequency = "one_time";

    if (paymentType === "full_payment") {
      finalDownPayment = propertyPrice;
    } else if (paymentType === "installment") {
      finalDownPayment = Number(downPayment);
      finalInstallmentMonths = Number(installmentMonths);
      finalPaymentFrequency = paymentFrequency;

      if (
        !Number.isFinite(finalDownPayment) ||
        finalDownPayment < 0 ||
        finalDownPayment >= propertyPrice
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Enter a valid installment down payment.",
          },
          { status: 400 },
        );
      }

      if (
        !Number.isInteger(finalInstallmentMonths) ||
        finalInstallmentMonths <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Installment duration must be a positive number of months.",
          },
          { status: 400 },
        );
      }

      if (!["monthly", "quarterly", "yearly"].includes(finalPaymentFrequency)) {
        return NextResponse.json(
          { success: false, message: "Invalid payment frequency." },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid property payment configuration.",
        },
        { status: 400 },
      );
    }

    // 6. Prevent duplicate active requests
    const existingRequest = await ContractRequest.findOne({
      agent: session.user.id,
      lead: lead._id,
      property: property._id,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A pending or approved request already exists for this lead and property.",
        },
        { status: 409 },
      );
    }

    // 7. Create contract request
    const contractRequest = await ContractRequest.create({
      agent: session.user.id,
      lead: lead._id,
      property: property._id,
      propertyPrice,
      currency,
      paymentType,
      downPayment: finalDownPayment,
      installmentMonths: finalInstallmentMonths,
      paymentFrequency: finalPaymentFrequency,
      terms: typeof terms === "string" ? terms.trim() : "",
    });

    // 8. Notify active managers
    const managers = await User.find({
      role: "manager",
      isActive: true,
    })
      .select("_id")
      .lean();

    const notificationResults = await Promise.allSettled(
      managers.map((manager) =>
        createNotification({
          recipient: manager._id,
          type: "contract_request",
          title: "New Contract Request",
          message: `${session.user.name || "An agent"} submitted a contract request for ${property.title}.`,
          link: "/manager/contracts/requests",
          metadata: {
            requestId: contractRequest._id.toString(),
            leadId: lead._id.toString(),
            propertyId: property._id.toString(),
            agentId: session.user.id,
          },
        }),
      ),
    );

    const failedNotifications = notificationResults.filter(
      (result) => result.status === "rejected",
    );

    if (failedNotifications.length > 0) {
      console.error("Some manager notifications failed:", failedNotifications);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Contract request submitted successfully.",
        data: contractRequest,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Agent contract request API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to submit contract request.",
      },
      { status: 500 },
    );
  }
}
