import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Contract from "@/models/Contract";
import connectDB from "@/lib/mongodb";
import ContractRequest from "@/models/ContractRequest";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "agent") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access." },
        { status: 401 },
      );
    }

    await connectDB();

    const requests = await ContractRequest.find({
      agent: session.user.id,
    })
      .populate("lead", "fullName email phone status")
      .populate("property", "title price currency propertyType location")
      .populate("reviewedBy", "name")
      .populate("contract", "contractNumber status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Fetch agent contract requests error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch your contract requests.",
      },
      { status: 500 },
    );
  }
}
