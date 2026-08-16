import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { checkOverduePayment } from "@/utils/checkOverduePayments";

export async function GET() {
  try {
    await connectDB();

    const payments = await Payment.find()
      .populate("client", "name email phone")
      .populate("lead", "fullName email phone status")
      .populate("contract", "contractNumber status")
      .populate("property", "title")
      .populate("verifiedBy", "name email")
      .sort({ createdAt: -1 });

    const updatedPayments = payments.map((payment) => {
      const status = checkOverduePayment(payment);

      if (status !== payment.paymentStatus) {
        payment.paymentStatus = status;
      }

      return payment;
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedPayments,
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

