import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import ContractRequest from "@/models/ContractRequest";
import Contract from "@/models/Contract";
import Lead from "@/models/Lead";
import Property from "@/models/Property";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access." },
        { status: 401 },
      );
    }

    if (!["manager", "admin"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Access denied." },
        { status: 403 },
      );
    }

    await connectDB();

    const requests = await ContractRequest.find({})
      .populate("agent", "name fullName email")
      .populate("lead", "fullName email phone status")
      .populate("property", "title price currency propertyType location")
      .populate("reviewedBy", "name fullName")
      .populate("contract", "contractNumber status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Manager contract requests fetch error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch contract requests.",
      },
      { status: 500 },
    );
  }
}
