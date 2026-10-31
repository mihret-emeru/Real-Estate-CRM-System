import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";

/**
 * Chapa Webhook
 *
 * Chapa -> this endpoint -> verify transaction -> update Payment
 *
 * IMPORTANT:
 * This route does NOT use getServerSession().
 * Chapa calls this endpoint directly from its servers.
 */

export async function POST(request) {
  try {
    await connectDB();

    console.log("==========================================");
    console.log("🔥 CHAPA WEBHOOK RECEIVED");
    console.log("==========================================");

    // ============================================================
    // READ CHAPA WEBHOOK BODY
    // ============================================================

    let body = {};

    try {
      body = await request.json();
    } catch (error) {
      console.error("Failed to parse Chapa webhook body:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook payload.",
        },
        { status: 400 },
      );
    }

    console.log("CHAPA WEBHOOK BODY:", JSON.stringify(body, null, 2));

    // ============================================================
    // TRANSACTION REFERENCE
    // ============================================================

    /*
     * Depending on the Chapa webhook payload, tx_ref may be
     * available directly or inside data.
     */

    const transaction = body?.data || body?.transaction || body || {};

    const txRef =
      transaction?.tx_ref ||
      body?.tx_ref ||
      body?.trx_ref ||
      transaction?.trx_ref;

    console.log("Webhook transaction reference:", txRef);

    if (!txRef) {
      console.error("❌ Transaction reference missing from webhook.");

      return NextResponse.json(
        {
          success: false,
          message: "Transaction reference is missing.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // CHAPA SECRET KEY
    // ============================================================

    const secretKey = process.env.CHAPA_SECRET_KEY?.trim();

    if (!secretKey) {
      console.error("❌ CHAPA_SECRET_KEY is not configured.");

      return NextResponse.json(
        {
          success: false,
          message: "CHAPA_SECRET_KEY is not configured.",
        },
        { status: 500 },
      );
    }

    // ============================================================
    // FIND PAYMENT
    // ============================================================

    /*
     * We search by transactionReference instead of relying on
     * payment_id from the webhook.
     *
     * Your initialize route stores:
     *
     * payment.transactionReference = txRef;
     */

    const payment = await Payment.findOne({
      transactionReference: txRef,
    }).populate("property", "title currency");

    if (!payment) {
      console.error("❌ Payment not found for transaction:", txRef);

      /*
       * Returning 200 prevents unnecessary repeated webhook
       * attempts for a transaction that does not belong to
       * a payment in this CRM.
       */

      return NextResponse.json({
        success: false,
        message: "Payment not found.",
        transactionReference: txRef,
      });
    }

    console.log("✅ Payment found:", String(payment._id));

    console.log("Current payment status:", payment.paymentStatus);

    // ============================================================
    // ALREADY PAID
    // ============================================================

    if (payment.paymentStatus === "paid") {
      console.log("ℹ️ Payment is already marked as PAID.");

      return NextResponse.json({
        success: true,
        message: "Payment is already marked as paid.",
        data: payment,
      });
    }

    // ============================================================
    // VERIFY TRANSACTION DIRECTLY WITH CHAPA
    // ============================================================

    console.log("🔎 Verifying transaction with Chapa:", txRef);

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

    // ============================================================
    // CHAPA API ERROR
    // ============================================================

    if (!response.ok) {
      console.error("❌ Chapa verification request failed.");

      return NextResponse.json(
        {
          success: false,
          message: chapaData?.message || "Chapa verification failed.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // TRANSACTION DATA
    // ============================================================

    const verifiedTransaction = chapaData?.data;

    if (!verifiedTransaction) {
      console.error("❌ Chapa verification returned no transaction data.");

      return NextResponse.json(
        {
          success: false,
          message: "Chapa verification returned no transaction data.",
        },
        { status: 400 },
      );
    }

    console.log(
      "Verified transaction:",
      JSON.stringify(verifiedTransaction, null, 2),
    );

    // ============================================================
    // TRANSACTION STATUS
    // ============================================================

    /*
     * IMPORTANT:
     *
     * We ONLY mark the payment as paid when Chapa explicitly
     * reports:
     *
     * status === "success"
     */

    if (
      chapaData?.status !== "success" ||
      verifiedTransaction?.status !== "success"
    ) {
      console.log("⏳ Chapa transaction is not successful yet.");

      console.log("Chapa status:", chapaData?.status);

      console.log("Transaction status:", verifiedTransaction?.status);

      return NextResponse.json({
        success: true,
        paymentStatus: "pending",
        message: "Chapa has not confirmed this transaction yet.",
        data: payment,
      });
    }

    // ============================================================
    // VERIFY TRANSACTION REFERENCE
    // ============================================================

    const verifiedTxRef = verifiedTransaction?.tx_ref;

    if (
      verifiedTxRef &&
      String(verifiedTxRef) !== String(payment.transactionReference)
    ) {
      console.error("❌ Transaction reference mismatch.");

      payment.paymentStatus = "review_required";

      payment.verificationNotes = `Transaction reference mismatch. Expected ${payment.transactionReference}, received ${verifiedTxRef}.`;

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

    // ============================================================
    // VERIFY AMOUNT
    // ============================================================

    const expectedAmount = Number(payment.expectedAmount);

    const paidAmount = Number(verifiedTransaction?.amount);

    const expectedRounded = Number(expectedAmount.toFixed(2));

    const paidRounded = Number(paidAmount.toFixed(2));

    console.log("==========================================");

    console.log("AMOUNT VERIFICATION");

    console.log("Expected amount:", expectedRounded);

    console.log("Chapa paid amount:", paidRounded);

    console.log("==========================================");

    if (
      !Number.isFinite(expectedRounded) ||
      !Number.isFinite(paidRounded) ||
      expectedRounded !== paidRounded
    ) {
      console.error("❌ Payment amount mismatch.");

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

    // ============================================================
    // VERIFY CURRENCY
    // ============================================================

    const expectedCurrency = payment.property?.currency || "ETB";

    const receivedCurrency = verifiedTransaction?.currency || "";

    console.log("Expected currency:", expectedCurrency);

    console.log("Chapa currency:", receivedCurrency);

    if (
      receivedCurrency &&
      String(receivedCurrency).toUpperCase() !==
        String(expectedCurrency).toUpperCase()
    ) {
      console.error("❌ Payment currency mismatch.");

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

    // ============================================================
    // MARK PAYMENT AS PAID
    // ============================================================

    console.log("==========================================");

    console.log("🔥 CALLBACK MARKING PAYMENT AS PAID");

    console.log("Payment ID:", String(payment._id));

    console.log("Expected Amount:", expectedRounded);

    console.log("Paid Amount:", paidRounded);

    console.log("Transaction Reference:", verifiedTxRef || txRef);

    console.log("==========================================");

    payment.paymentMethod = "chapa";

    payment.transactionReference = verifiedTxRef || txRef;

    payment.paidAmount = paidRounded;

    payment.paymentDate = verifiedTransaction?.updated_at
      ? new Date(verifiedTransaction.updated_at)
      : new Date();

    payment.paymentStatus = "paid";

    payment.verificationNotes =
      "Payment automatically verified through Chapa webhook.";

    payment.verifiedAt = new Date();

    /*
     * The payment was automatically verified by
     * the server, not manually verified by a manager.
     */

    payment.verifiedBy = null;

    await payment.save();

    // ============================================================
    // CONFIRM DATABASE UPDATE
    // ============================================================

    console.log("==========================================");

    console.log("✅ PAYMENT SUCCESSFULLY MARKED AS PAID");

    console.log("Payment ID:", String(payment._id));

    console.log("Payment Status:", payment.paymentStatus);

    console.log("Paid Amount:", payment.paidAmount);

    console.log("Transaction Reference:", payment.transactionReference);

    console.log("==========================================");

    return NextResponse.json({
      success: true,
      paymentStatus: "paid",
      message: "Payment successfully verified through Chapa webhook.",
      data: payment,
    });
  } catch (error) {
    console.error("==========================================");

    console.error("❌ CHAPA WEBHOOK ERROR:", error);

    console.error("==========================================");

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Chapa webhook failed.",
      },
      { status: 500 },
    );
  }
}

/**
 * Optional GET handler
 *
 * This is useful for testing whether the route is reachable
 * from a browser.
 *
 * Chapa payment notifications should use POST.
 */

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Chapa webhook endpoint is active.",
  });
}
