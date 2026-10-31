import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";

export async function GET(request, { params }) {
  try {
    await connectDB();

    // Authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized.", {
        status: 401,
      });
    }

    const allowedRoles = ["client", "manager", "admin"];

    if (!allowedRoles.includes(session.user.role)) {
      return new NextResponse("Forbidden.", {
        status: 403,
      });
    }

    const { id } = await params;

    // Validate payment ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse("Invalid payment ID.", {
        status: 400,
      });
    }

    // Find payment
    const payment = await Payment.findById(id);

    if (!payment) {
      return new NextResponse("Payment not found.", {
        status: 404,
      });
    }

    // Clients can access only their own receipts
    if (
      session.user.role === "client" &&
      String(payment.client) !== String(session.user.id)
    ) {
      return new NextResponse("Forbidden.", {
        status: 403,
      });
    }

    // Check receipt
    const fileUrl = payment.receipt?.fileUrl;

    if (!fileUrl) {
      return new NextResponse("Receipt not found.", {
        status: 404,
      });
    }

    // Validate stored Base64 data URL
    const match = fileUrl.match(
      /^data:(image\/jpeg|image\/png|application\/pdf);base64,([A-Za-z0-9+/=\s]+)$/,
    );

    if (!match) {
      return new NextResponse("Invalid receipt format.", {
        status: 400,
      });
    }

    const mimeType = match[1];
    const base64Data = match[2].replace(/\s/g, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Return the receipt inline
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": buffer.length.toString(),
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Receipt view error:", error);

    return new NextResponse("Failed to open receipt.", {
      status: 500,
    });
  }
}
