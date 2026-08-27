import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Payment from "@/models/Payment";

export async function GET(request, { params }) {
  try {
    await connectDB();

    // ==========================================
    // AUTHENTICATION
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

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can verify payments.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    const { searchParams } = new URL(request.url);

    const txRef = searchParams.get("tx_ref") || searchParams.get("trx_ref");

    console.log("==========================================");
    console.log("CHAPA VERIFY");
    console.log("Payment ID:", id);
    console.log("Transaction Reference:", txRef);
    console.log("==========================================");

    // ==========================================
    // TRANSACTION REFERENCE
    // ==========================================

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
    // FIND PAYMENT
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
    // ALREADY PAID
    // ==========================================

    if (payment.paymentStatus === "paid") {
      console.log("Payment is already PAID.");

      return NextResponse.json({
        success: true,
        paymentStatus: "paid",
        message: "Payment has already been verified.",
        data: payment,
      });
    }

    // ==========================================
    // VERIFY TRANSACTION REFERENCE
    // ==========================================

    if (
      payment.transactionReference &&
      String(payment.transactionReference) !== String(txRef)
    ) {
      console.error("Transaction reference mismatch.");

      return NextResponse.json(
        {
          success: false,
          message: "Transaction reference does not match.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // CHAPA SECRET KEY
    // ==========================================

    const secretKey = process.env.CHAPA_SECRET_KEY?.trim();

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
    // VERIFY WITH CHAPA
    // ==========================================

    console.log("Verifying transaction with Chapa...");
    console.log("Transaction:", txRef);

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

    const chapaData = await response.json();

    console.log("CHAPA VERIFY RESPONSE:", JSON.stringify(chapaData, null, 2));

    // ==========================================
    // CHAPA API ERROR
    // ==========================================

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: chapaData?.message || "Chapa verification request failed.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // TRANSACTION
    // ==========================================

    const transaction = chapaData?.data;

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Chapa did not return transaction data.",
        },
        { status: 400 },
      );
    }

    console.log("Chapa transaction status:", transaction.status);

    // ==========================================
    // PAYMENT STILL PENDING
    // ==========================================

    if (chapaData?.status !== "success" || transaction?.status !== "success") {
      console.log("Chapa transaction is not successful yet.");

      payment.paymentStatus = "pending";

      await payment.save();

      return NextResponse.json({
        success: true,
        paymentStatus: "pending",
        message: "Payment is still pending.",
        data: payment,
      });
    }

    // ==========================================
    // TRANSACTION REFERENCE
    // ==========================================

    if (
      transaction?.tx_ref &&
      String(transaction.tx_ref) !== String(payment.transactionReference)
    ) {
      payment.paymentStatus = "review_required";

      payment.verificationNotes = `Transaction reference mismatch. Expected ${payment.transactionReference}, received ${transaction.tx_ref}.`;

      await payment.save();

      return NextResponse.json(
        {
          success: false,
          message: "Transaction reference mismatch.",
          data: payment,
        },
        { status: 400 },
      );
    }

    // ==========================================
    // AMOUNT
    // ==========================================

    const expectedAmount = Number(payment.expectedAmount);

    const paidAmount = Number(transaction.amount);

    const expectedAmountRounded = Number(expectedAmount.toFixed(2));

    const paidAmountRounded = Number(paidAmount.toFixed(2));

    console.log("==========================================");
    console.log("AMOUNT COMPARISON");
    console.log("Expected:", expectedAmountRounded);
    console.log("Chapa:", paidAmountRounded);
    console.log("==========================================");

    if (
      !Number.isFinite(expectedAmountRounded) ||
      !Number.isFinite(paidAmountRounded) ||
      expectedAmountRounded !== paidAmountRounded
    ) {
      payment.paymentStatus = "review_required";

      payment.verificationNotes = `Amount mismatch. Expected ${expectedAmountRounded.toFixed(
        2,
      )}, received ${paidAmountRounded.toFixed(2)}.`;

      await payment.save();

      return NextResponse.json(
        {
          success: false,
          message: "Payment amount does not match.",
          data: payment,
        },
        { status: 400 },
      );
    }

    // ==========================================
    // CURRENCY
    // ==========================================

    const expectedCurrency = payment.property?.currency || "ETB";

    const receivedCurrency = transaction?.currency || "";

    if (
      receivedCurrency &&
      String(receivedCurrency).toUpperCase() !==
        String(expectedCurrency).toUpperCase()
    ) {
      payment.paymentStatus = "review_required";

      payment.verificationNotes = `Currency mismatch. Expected ${expectedCurrency}, received ${receivedCurrency}.`;

      await payment.save();

      return NextResponse.json(
        {
          success: false,
          message: "Payment currency does not match.",
          data: payment,
        },
        { status: 400 },
      );
    }

    // ==========================================
    // MARK PAYMENT AS PAID
    // ==========================================

    payment.paymentMethod = "chapa";

    payment.transactionReference =
      transaction.tx_ref || payment.transactionReference;

    payment.paidAmount = paidAmountRounded;

    payment.paymentDate = transaction.updated_at
      ? new Date(transaction.updated_at)
      : new Date();

    payment.paymentStatus = "paid";

    payment.verificationNotes = "Payment automatically verified through Chapa.";

    payment.verifiedAt = new Date();

    payment.verifiedBy = null;

    await payment.save();

    console.log("==========================================");
    console.log("PAYMENT MARKED AS PAID");
    console.log("Payment ID:", String(payment._id));
    console.log("Amount:", payment.paidAmount);
    console.log("Transaction:", payment.transactionReference);
    console.log("Status:", payment.paymentStatus);
    console.log("==========================================");

    // ==========================================
    // SUCCESS
    // ==========================================

    return NextResponse.json({
      success: true,
      paymentStatus: "paid",
      message: "Payment successfully verified.",
      data: payment,
    });
  } catch (error) {
    console.error("==========================================");
    console.error("CHAPA VERIFY ERROR");
    console.error(error);
    console.error("==========================================");

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to verify Chapa payment.",
      },
      { status: 500 },
    );
  }
}
