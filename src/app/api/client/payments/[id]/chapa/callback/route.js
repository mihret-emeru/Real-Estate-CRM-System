import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    console.log("==========================================");
    console.log("CHAPA CALLBACK");
    console.log("Payment ID:", id);
    console.log("==========================================");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment ID is missing.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // FIND PAYMENT
    // ==========================================

    const payment = await Payment.findById(id).populate(
      "property",
      "title currency",
    );

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not found.",
          paymentId: id,
        },
        { status: 404 },
      );
    }

    // ==========================================
    // GET TRANSACTION REFERENCE FROM DATABASE
    // ==========================================

    const txRef = payment.transactionReference;

    console.log("Transaction Reference from MongoDB:", txRef);

    if (!txRef) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction reference is missing from payment.",
          paymentId: id,
        },
        { status: 400 },
      );
    }

    // ==========================================
    // ALREADY PAID
    // ==========================================

    if (payment.paymentStatus === "paid") {
      console.log("Payment is already marked as PAID.");

      return NextResponse.json({
        success: true,
        message: "Payment is already marked as paid.",
        data: payment,
      });
    }

    // ==========================================
    // CHAPA SECRET KEY
    // ==========================================

    const secretKey = process.env.CHAPA_SECRET_KEY?.trim();

    if (!secretKey) {
      return NextResponse.json(
        {
          success: false,
          message: "CHAPA_SECRET_KEY is not configured.",
        },
        { status: 500 },
      );
    }

    // ==========================================
    // VERIFY WITH CHAPA
    // ==========================================

    console.log("Verifying transaction with Chapa:");
    console.log(txRef);

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

    console.log(
      "CHAPA CALLBACK VERIFY RESPONSE:",
      JSON.stringify(chapaData, null, 2),
    );

    // ==========================================
    // CHAPA API ERROR
    // ==========================================

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: chapaData?.message || "Chapa verification failed.",
        },
        { status: 400 },
      );
    }

    const transaction = chapaData?.data;

    // ==========================================
    // PAYMENT NOT SUCCESSFUL YET
    // ==========================================

    if (chapaData?.status !== "success" || transaction?.status !== "success") {
      console.log("Chapa has not confirmed payment yet.");

      return NextResponse.json({
        success: false,
        message: "Chapa has not confirmed this payment yet.",
        data: payment,
        chapa: chapaData,
      });
    }

    // ==========================================
    // VERIFY TRANSACTION REFERENCE
    // ==========================================

    if (transaction?.tx_ref && String(transaction.tx_ref) !== String(txRef)) {
      payment.paymentStatus = "review_required";

      payment.verificationNotes = `Transaction reference mismatch. Expected ${txRef}, received ${transaction.tx_ref}.`;

      await payment.save();

      return NextResponse.json(
        {
          success: false,
          message: "Transaction reference does not match.",
          data: payment,
        },
        { status: 400 },
      );
    }

    // ==========================================
    // VERIFY AMOUNT
    // ==========================================

    const expectedAmount = Number(payment.expectedAmount);
    const paidAmount = Number(transaction.amount);

    const expectedRounded = Number(expectedAmount.toFixed(2));
    const paidRounded = Number(paidAmount.toFixed(2));

    console.log("Amount comparison:");
    console.log("Expected:", expectedAmount);
    console.log("Expected rounded:", expectedRounded);
    console.log("Chapa:", paidAmount);
    console.log("Chapa rounded:", paidRounded);

    if (!Number.isFinite(paidAmount) || expectedRounded !== paidRounded) {
      payment.paymentStatus = "review_required";

      payment.verificationNotes = `Amount mismatch. Expected ${expectedRounded}, received ${paidRounded}.`;

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
    // VERIFY CURRENCY
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

    console.log("==========================================");
    console.log("CALLBACK MARKING PAYMENT AS PAID");
    console.log("Payment ID:", String(payment._id));
    console.log("Paid Amount:", paidRounded);
    console.log("Transaction Reference:", txRef);
    console.log("==========================================");

    payment.paymentMethod = "chapa";
    payment.transactionReference = transaction.tx_ref || txRef;
    payment.paidAmount = paidRounded;

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
      message: "Payment successfully verified through Chapa.",
      data: payment,
    });
  } catch (error) {
    console.error("CHAPA CALLBACK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Chapa callback failed.",
      },
      { status: 500 },
    );
  }
}
