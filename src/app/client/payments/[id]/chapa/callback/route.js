import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    const payment = await Payment.findById(id).populate(
      "property",
      "title currency",
    );

    if (!payment) {
      return NextResponse.redirect(
        new URL(
          `/client/payments/${id}?payment=error&message=Payment%20not%20found`,
          request.url,
        ),
      );
    }

    const { searchParams } = new URL(request.url);

    /*
     * Chapa callback normally sends:
     * trx_ref
     * ref_id
     * status
     */

    const txRef =
      searchParams.get("trx_ref") ||
      searchParams.get("tx_ref") ||
      payment.transactionReference;

    const callbackStatus = searchParams.get("status");

    console.log("====================================");
    console.log("CHAPA CALLBACK");
    console.log("Payment ID:", id);
    console.log("Transaction Ref:", txRef);
    console.log("Callback Status:", callbackStatus);
    console.log("====================================");

    if (!txRef) {
      payment.paymentStatus = "review_required";
      payment.verificationNotes =
        "Chapa callback did not provide a transaction reference.";

      await payment.save();

      return NextResponse.redirect(
        new URL(
          `/client/payments/${id}?payment=error&message=Transaction%20reference%20missing`,
          request.url,
        ),
      );
    }

    const secretKey = process.env.CHAPA_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.redirect(
        new URL(
          `/client/payments/${id}?payment=error&message=Chapa%20configuration%20error`,
          request.url,
        ),
      );
    }

    /*
     * ==========================================
     * Verify transaction with Chapa
     * ==========================================
     */

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

    console.log("CHAPA VERIFY RESPONSE:");
    console.log(JSON.stringify(data, null, 2));

    /*
     * Chapa can return a non-200 response when
     * the transaction is not verified.
     */

    if (!response.ok) {
      payment.paymentStatus = "review_required";

      payment.verificationNotes =
        data?.message || "Unable to verify Chapa transaction.";

      await payment.save();

      return NextResponse.redirect(
        new URL(`/client/payments/${id}?payment=failed`, request.url),
      );
    }

    const transaction = data?.data;

    /*
     * ==========================================
     * Verify transaction status
     * ==========================================
     */

    if (data?.status !== "success" || transaction?.status !== "success") {
      payment.paymentStatus = "review_required";

      payment.verificationNotes =
        "Chapa transaction was not confirmed as successful.";

      await payment.save();

      return NextResponse.redirect(
        new URL(`/client/payments/${id}?payment=failed`, request.url),
      );
    }

    /*
     * ==========================================
     * Verify transaction reference
     * ==========================================
     */

    if (
      transaction.tx_ref &&
      String(transaction.tx_ref) !== String(payment.transactionReference)
    ) {
      payment.paymentStatus = "review_required";

      payment.verificationNotes =
        "Transaction reference does not match the payment record.";

      await payment.save();

      return NextResponse.redirect(
        new URL(`/client/payments/${id}?payment=failed`, request.url),
      );
    }

    /*
     * ==========================================
     * Verify amount
     * ==========================================
     */

    const expectedAmount = Number(payment.expectedAmount);
    const paidAmount = Number(transaction.amount);

    if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
      payment.paymentStatus = "review_required";

      payment.verificationNotes = `Amount mismatch. Expected ${expectedAmount}, received ${paidAmount}.`;

      await payment.save();

      return NextResponse.redirect(
        new URL(`/client/payments/${id}?payment=failed`, request.url),
      );
    }

    /*
     * ==========================================
     * Verify currency
     * ==========================================
     */

    const expectedCurrency = payment.property?.currency || "ETB";

    if (
      transaction.currency &&
      String(transaction.currency).toUpperCase() !==
        String(expectedCurrency).toUpperCase()
    ) {
      payment.paymentStatus = "review_required";

      payment.verificationNotes = `Currency mismatch. Expected ${expectedCurrency}, received ${transaction.currency}.`;

      await payment.save();

      return NextResponse.redirect(
        new URL(`/client/payments/${id}?payment=failed`, request.url),
      );
    }

    /*
     * ==========================================
     * PAYMENT SUCCESS
     * ==========================================
     */

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

    // Chapa payments do not require manager approval.
    payment.verifiedBy = null;

    await payment.save();

    console.log(`Payment ${payment._id} successfully verified through Chapa.`);

    /*
     * ==========================================
     * REDIRECT CUSTOMER BACK TO DETAILS PAGE
     * ==========================================
     */

    return NextResponse.redirect(
      new URL(`/client/payments/${id}?payment=success`, request.url),
    );
  } catch (error) {
    console.error("Chapa callback error:", error);

    return NextResponse.redirect(
      new URL(`/client/payments/${params.id}?payment=error`, request.url),
    );
  }
}

