import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";

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

    const { id } = await params;

    const payment = await Payment.findById(id)
      .populate("client", "name email phone")
      .populate("contract", "contractNumber status")
      .populate("property", "title price currency")
      .populate("verifiedBy", "name email");

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found.",
        },
        { status: 404 },
      );
    }

    // Client can only see their own payment.
    if (
      session.user.role === "client" &&
      String(payment.client?._id || payment.client) !== String(session.user.id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to view this payment.",
        },
        { status: 403 },
      );
    }

    // Only manager/admin can access other users' payments.
    if (
      session.user.role !== "client" &&
      session.user.role !== "manager" &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Payment GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
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

    // Only manager/admin can approve or reject.
    if (session.user.role !== "manager" && session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Only managers can verify payments.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    const body = await request.json();

    const payment = await Payment.findById(id);

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found.",
        },
        { status: 404 },
      );
    }

    const { status, paidAmount, verificationNotes } = body;

    // Only these actions are allowed from manager verification.
    if (!["paid", "rejected", "review_required"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment verification status.",
        },
        { status: 400 },
      );
    }

    payment.paymentStatus = status;

    payment.verificationNotes = verificationNotes || payment.verificationNotes;

    if (status === "paid") {
      payment.paidAmount = Number(paidAmount) || Number(payment.expectedAmount);

      payment.paymentDate = new Date();
      payment.verifiedBy = session.user.id;
      payment.verifiedAt = new Date();
    }

    if (status === "rejected") {
      payment.paidAmount = 0;
      payment.verifiedBy = session.user.id;
      payment.verifiedAt = new Date();
    }

    if (status === "review_required") {
      payment.verifiedBy = session.user.id;
      payment.verifiedAt = new Date();
    }

    await payment.save();

    return NextResponse.json({
      success: true,
      message:
        status === "paid"
          ? "Payment approved successfully."
          : status === "rejected"
            ? "Payment rejected successfully."
            : "Payment marked for review.",
      data: payment,
    });
  } catch (error) {
    console.error("Payment PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
