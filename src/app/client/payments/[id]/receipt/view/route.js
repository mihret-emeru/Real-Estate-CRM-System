import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";

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
          message: "Only clients can upload payment receipts.",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    // ==========================================
    // Find payment
    // ==========================================

    const payment = await Payment.findById(id);

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
    // Verify ownership
    // ==========================================

    if (String(payment.client) !== String(session.user.id)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to upload a receipt for this payment.",
        },
        { status: 403 },
      );
    }

    // ==========================================
    // Validate payment status
    // ==========================================

    if (payment.paymentStatus === "paid") {
      return NextResponse.json(
        {
          success: false,
          message: "This payment has already been approved.",
        },
        { status: 400 },
      );
    }

    if (payment.paymentStatus === "pending_verification") {
      return NextResponse.json(
        {
          success: false,
          message: "This receipt is already waiting for verification.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // Read multipart/form-data
    // ==========================================

    const formData = await request.formData();

    const file = formData.get("receipt");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Receipt file is required.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // Validate file type
    // ==========================================

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please upload a PDF, JPG, JPEG, or PNG file.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // Validate file size
    // ==========================================

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "The receipt file must be smaller than 5 MB.",
        },
        { status: 400 },
      );
    }

    // ==========================================
    // Convert file to data URL
    // ==========================================

    const arrayBuffer = await file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    const base64 = buffer.toString("base64");

    const fileUrl = `data:${file.type};base64,${base64}`;

    // ==========================================
    // Save receipt
    // ==========================================

    payment.paymentMethod = "receipt";

    payment.receipt = {
      fileName: file.name || "Payment Receipt",
      fileUrl,
      mimeType: file.type,
      uploadedAt: new Date(),
    };

    payment.paymentStatus = "pending_verification";

    payment.verifiedBy = null;
    payment.verifiedAt = null;
    payment.verificationNotes = "";

    await payment.save();

    // ==========================================
    // Response
    // ==========================================

    return NextResponse.json({
      success: true,
      message:
        "Receipt uploaded successfully and is waiting for manager verification.",
      data: payment,
    });
  } catch (error) {
    console.error("Receipt upload error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to upload receipt.",
      },
      { status: 500 },
    );
  }
}

