import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const leadData = {
      ...body,

      activities: [
        {
          type: "created",
          message: `Lead created from ${body.source}`,
        },
      ],
    };

    console.log(leadData);

    const lead = await Lead.create(leadData);

    console.log(lead);

    return NextResponse.json(
      {
        success: true,
        data: lead,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
export async function GET() {
  try {
    await connectDB();

    const leads = await Lead.find()
      .populate("client", "name email")
      .populate("interestedProperty", "title price")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: leads,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
