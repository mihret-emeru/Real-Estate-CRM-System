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
      return new NextResponse("Unauthorized.", {
        status: 401,
      });
    }

    if (session.user.role !== "client") {
      return new NextResponse("Forbidden.", {
        status: 403,
      });
    }

    const { id } = await params;

    // ==========================================
    // Find payment
    // ==========================================

    const payment = await Payment.findOne({
      _id: id,
      client: session.user.id,
    });

    if (!payment) {
      return new NextResponse("Payment not found.", {
        status: 404,
      });
    }

    // ==========================================
    // Check receipt
    // ==========================================

    if (!payment.receipt?.fileUrl) {
      return new NextResponse("Receipt not found.", {
        status: 404,
      });
    }

    const fileUrl = payment.receipt.fileUrl;

    // ==========================================
    // Make sure it is our stored data URL
    // ==========================================

    if (!fileUrl.startsWith("data:")) {
      return new NextResponse("Invalid receipt file.", {
        status: 400,
      });
    }

    // Example:
    // data:image/png;base64,AAAA...
    // data:application/pdf;base64,AAAA...

    const match = fileUrl.match(/^data:([^;]+);base64,(.+)$/);

    if (!match) {
      return new NextResponse("Invalid receipt format.", {
        status: 400,
      });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const buffer = Buffer.from(base64Data, "base64");

    // ==========================================
    // Return actual file
    // ==========================================

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Receipt view error:", error);

    return new NextResponse(error.message || "Failed to open receipt.", {
      status: 500,
    });
  }
}
