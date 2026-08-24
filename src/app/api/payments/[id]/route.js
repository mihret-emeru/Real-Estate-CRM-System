import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const payment = await Payment.findById(id)
      .populate("client", "name email phone")
      .populate("contract", "contractNumber status")
      .populate("property", "title price")
      .populate("verifiedBy", "name email");

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: payment,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(error);

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
  try {
    await connectDB();

    const { id } = await params;

    const body = await request.json();

    const payment = await Payment.findById(id);

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found",
        },
        {
          status: 404,
        },
      );
    }

    payment.paymentStatus = body.status || payment.paymentStatus;

    if (body.status === "paid") {
      payment.paidAmount = body.paidAmount || payment.expectedAmount;

      payment.paymentDate = new Date();

      // Later replace with real logged-in manager ID
      payment.verifiedBy = body.managerId || null;

      payment.verifiedAt = new Date();
    }

    payment.verificationNotes =
      body.verificationNotes || payment.verificationNotes;

    await payment.save();

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error(error);

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
