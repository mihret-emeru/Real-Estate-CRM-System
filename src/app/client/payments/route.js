import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Payment from "@/models/Payment";
import Contract from "@/models/Contract";
import { checkOverduePayment } from "@/utils/checkOverduePayments";

export async function GET() {
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
          message: "Only clients can access their payments.",
        },
        { status: 403 },
      );
    }

    /*
     * IMPORTANT:
     * Only retrieve payments belonging to
     * the logged-in client.
     */
    const payments = await Payment.find({
      client: session.user.id,
    })
      .populate("contract", "contractNumber status")
      .populate("property", "title price currency")
      .populate("verifiedBy", "name email")
      .sort({ dueDate: 1 });

    /*
     * Update overdue statuses.
     */
    const updatedPayments = payments.map((payment) => {
      const currentStatus = checkOverduePayment(payment);

      if (currentStatus !== payment.paymentStatus) {
        payment.paymentStatus = currentStatus;
      }

      return payment;
    });

    /*
     * Calculate summary.
     */
    const totalExpected = updatedPayments.reduce(
      (total, payment) => total + Number(payment.expectedAmount || 0),
      0,
    );

    const totalPaid = updatedPayments.reduce(
      (total, payment) => total + Number(payment.paidAmount || 0),
      0,
    );

    const outstandingBalance = Math.max(totalExpected - totalPaid, 0);

    const totalPayments = updatedPayments.length;

    const paidPayments = updatedPayments.filter(
      (payment) => payment.paymentStatus === "paid",
    ).length;

    const pendingPayments = updatedPayments.filter(
      (payment) => payment.paymentStatus === "pending",
    ).length;

    const pendingVerificationPayments = updatedPayments.filter(
      (payment) => payment.paymentStatus === "pending_verification",
    ).length;

    const reviewRequiredPayments = updatedPayments.filter(
      (payment) => payment.paymentStatus === "review_required",
    ).length;

    /*
     * Find the next payment.
     *
     * Priority:
     * pending / overdue
     * earliest due date
     */
    const payablePayments = updatedPayments
      .filter(
        (payment) =>
          payment.paymentStatus === "pending" ||
          payment.paymentStatus === "overdue",
      )
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const nextPayment = payablePayments[0] || null;

    return NextResponse.json({
      success: true,

      data: updatedPayments,

      summary: {
        totalExpected,
        totalPaid,
        outstandingBalance,
        totalPayments,
        paidPayments,
        pendingPayments,
        pendingVerificationPayments,
        reviewRequiredPayments,
      },

      nextPayment,
    });
  } catch (error) {
    console.error("Client payments API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

