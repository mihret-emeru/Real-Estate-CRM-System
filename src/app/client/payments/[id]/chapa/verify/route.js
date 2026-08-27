import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Payment from "@/models/Payment";

export async function GET(request, { params }) {
  try {
    await connectDB();

    // ==========================================
    // Authentication
    // ==========================================

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

    const { searchParams } = new URL(request.url);

    const txRef = searchParams.get("tx_ref");

    if (!txRef) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction reference is missing.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // Find payment
    // ==========================================

    const payment = await Payment.findOne({
      _id: id,
      client: session.user.id,
    }).populate("property", "title currency");

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found.",
        },
        { status: 404 },
      );
    }

    // ==========================================
    // Already paid
    // ==========================================

    if (payment.paymentStatus === "paid") {
      return NextResponse.json({
        success: true,
        message: "Payment has already been verified.",
        data: payment,
      });
    }

    // ==========================================
    // Reference validation
    // ==========================================

    if (
      payment.transactionReference &&
      String(payment.transactionReference) !== String(txRef)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction reference does not match.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // Chapa secret
    // ==========================================

    const secretKey = process.env.CHAPA_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Chapa secret key is not configured.",
        },
        { status: 500 },
      );
    }

    // ==========================================
    // Verify with Chapa
    // ==========================================

    const response = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await response.json();

    console.log("Chapa verify response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || "Chapa could not verify this transaction.",
        },
        { status: 400 },
      );
    }

    const transaction = data?.data;

    // ==========================================
    // Transaction status
    // ==========================================

    if (data?.status !== "success" || transaction?.status !== "success") {
      return NextResponse.json({
        success: false,
        message: "Chapa has not confirmed this payment yet.",
      });
    }

    // ==========================================
    // Reference
    // ==========================================

    if (
      transaction?.tx_ref &&
      String(transaction.tx_ref) !== String(payment.transactionReference)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction reference mismatch.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // Amount
    // ==========================================

    const expectedAmount = Number(payment.expectedAmount);

    const paidAmount = Number(transaction.amount);

    if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
      payment.paymentStatus = "review_required";

      payment.verificationNotes = `Amount mismatch. Expected ${expectedAmount}, received ${paidAmount}.`;

      await payment.save();

      return NextResponse.json(
        {
          success: false,
          message: "Payment amount does not match.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // Currency
    // ==========================================

    const expectedCurrency = payment.property?.currency || "ETB";

    if (
      transaction?.currency &&
      String(transaction.currency).toUpperCase() !==
        String(expectedCurrency).toUpperCase()
    ) {
      payment.paymentStatus = "review_required";

      payment.verificationNotes = `Currency mismatch. Expected ${expectedCurrency}, received ${transaction.currency}.`;

      await payment.save();

      return NextResponse.json(
        {
          success: false,
          message: "Payment currency does not match.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    payment.paymentMethod = "chapa";

    payment.transactionReference =
      transaction.tx_ref || payment.transactionReference;

    payment.paidAmount = paidAmount;

    payment.paymentDate = transaction.updated_at
      ? new Date(transaction.updated_at)
      : new Date();

    payment.paymentStatus = "paid";

    payment.verificationNotes = "Payment automatically verified through Chapa.";

    payment.verifiedAt = new Date();

    payment.verifiedBy = null;

    await payment.save();

    console.log(`Payment ${payment._id} successfully marked as PAID.`);

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified.",
      data: payment,
    });
  } catch (error) {
    console.error("Chapa verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to verify Chapa payment.",
      },
      { status: 500 },
    );
  }
}

