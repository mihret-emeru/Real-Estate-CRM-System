import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Payment from "@/models/Payment";
import User from "@/models/User";

export async function POST(request, { params }) {
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

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can make payments.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

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
    // Payment status
    // ==========================================

    if (payment.paymentStatus === "paid") {
      return NextResponse.json(
        {
          success: false,
          message: "This installment has already been paid.",
        },
        { status: 400 },
      );
    }

    if (
      payment.paymentStatus === "pending_verification" ||
      payment.paymentStatus === "review_required"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This payment is already under verification.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // Chapa configuration
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
    // Client
    // ==========================================

    const client = await User.findById(session.user.id).select(
      "name email phone",
    );

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          message: "Client account not found.",
        },
        { status: 404 },
      );
    }

    // ==========================================
    // Amount
    // ==========================================

    const amount = Number(payment.expectedAmount);
    const currency = payment.property?.currency || "ETB";

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment amount.",
        },
        { status: 400 },
      );
    }

    /*
     * Chapa test/checkout limit.
     *
     * Chapa currently rejects amounts above
     * 1,000,000 ETB.
     */
    if (currency.toUpperCase() === "ETB" && amount > 1000000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This installment is above Chapa's 1,000,000 ETB transaction limit. Please use the bank receipt payment method.",
          code: "CHAPA_AMOUNT_LIMIT",
          amount,
          currency,
        },
        { status: 400 },
      );
    }

    // ==========================================
    // Name
    // ==========================================

    const nameParts = (client.name || "Client").trim().split(/\s+/);

    const firstName = nameParts[0] || "Client";

    const lastName =
      nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Client";

    // ==========================================
    // Transaction reference
    // ==========================================

    const txRef = `CRM-${payment._id}-${Date.now()}`;

    // ==========================================
    // URLs
    // ==========================================

    const baseUrl = (
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    ).replace(/\/$/, "");

    const callbackUrl = `${baseUrl}/api/client/payments/${payment._id}/chapa/callback`;

    const returnUrl =
      `${baseUrl}/client/payments/${payment._id}` +
      `?payment=returned&tx_ref=${encodeURIComponent(txRef)}`;

    // ==========================================
    // Property description
    // ==========================================

    const propertyTitle = payment.property?.title || "Property";

    const description =
      `Installment ${payment.installmentNumber} ${propertyTitle}`
        .replace(/[^a-zA-Z0-9._ -]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 100);

    // ==========================================
    // Chapa payload
    // ==========================================

    const chapaPayload = {
      amount: String(amount),
      currency,

      email: client.email,

      first_name: firstName,
      last_name: lastName,

      tx_ref: txRef,

      callback_url: callbackUrl,
      return_url: returnUrl,

      customization: {
        title: "CRM Payment",
        description,
      },

      meta: {
        payment_id: String(payment._id),
        installment_number: String(payment.installmentNumber),
      },
    };

    if (client.phone) {
      chapaPayload.phone_number = client.phone;
    }

    console.log("==========================================");
    console.log("CHAPA INITIALIZE");
    console.log("Payment ID:", String(payment._id));
    console.log("Amount:", amount);
    console.log("Currency:", currency);
    console.log("Transaction Reference:", txRef);
    console.log("==========================================");

    // ==========================================
    // Initialize Chapa
    // ==========================================

    const response = await fetch(
      "https://api.chapa.co/v1/transaction/initialize",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify(chapaPayload),

        cache: "no-store",
      },
    );

    const data = await response.json();

    console.log("CHAPA RESPONSE:", JSON.stringify(data, null, 2));

    // ==========================================
    // Chapa rejected initialization
    // ==========================================

    if (!response.ok || data?.status !== "success") {
      let chapaMessage = "Chapa rejected the payment initialization.";

      if (typeof data?.message === "string") {
        chapaMessage = data.message;
      } else if (data?.message && typeof data.message === "object") {
        chapaMessage = Object.entries(data.message)
          .map(([field, errors]) => {
            if (Array.isArray(errors)) {
              return `${field}: ${errors.join(", ")}`;
            }

            return `${field}: ${String(errors)}`;
          })
          .join(" | ");
      }

      return NextResponse.json(
        {
          success: false,
          message: chapaMessage,
          chapa: data,
        },
        {
          status: 400,
        },
      );
    }

    // ==========================================
    // Checkout URL
    // ==========================================

    const checkoutUrl = data?.data?.checkout_url;

    if (!checkoutUrl) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Chapa initialized the transaction but did not return a checkout URL.",
          chapa: data,
        },
        { status: 500 },
      );
    }

    // ==========================================
    // Save transaction reference
    // ==========================================

    payment.paymentMethod = "chapa";
    payment.transactionReference = txRef;
    payment.paymentStatus = "pending";

    await payment.save();

    // ==========================================
    // Success
    // ==========================================

    return NextResponse.json({
      success: true,

      message: "Chapa payment initialized successfully.",

      checkoutUrl,

      transactionReference: txRef,
    });
  } catch (error) {
    console.error("CHAPA INITIALIZE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to initialize Chapa payment.",
      },
      { status: 500 },
    );
  }
}

