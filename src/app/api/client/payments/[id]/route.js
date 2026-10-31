import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Payment from "@/models/Payment";
import { checkOverduePayment } from "@/utils/checkOverduePayments";

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

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can access payments.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    const payment = await Payment.findOne({
      _id: id,
      client: session.user.id,
    })
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

    // Never change a completed payment back to another status.
    if (payment.paymentStatus !== "paid") {
      const status = checkOverduePayment(payment);

      if (status !== payment.paymentStatus) {
        payment.paymentStatus = status;
        await payment.save();
      }
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Client payment details error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
