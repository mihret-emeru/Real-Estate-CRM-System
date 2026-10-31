import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";

export async function GET() {
  try {
    await connectDB();

    const leads = await Lead.find({
      status: "qualified",
    })
      .select("fullName email phone interestedProperty status")
      .populate("interestedProperty", "title price")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error("Qualified leads API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch qualified leads.",
      },
      {
        status: 500,
      },
    );
  }
}
