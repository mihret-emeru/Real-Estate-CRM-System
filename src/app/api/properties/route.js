import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Property from "@/models/Property";

// GET ALL PROPERTIES
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);

    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

    const status = searchParams.get("status");

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate("assignedAgent", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Property.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: properties,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// CREATE PROPERTY
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const property = await Property.create(body);

    const populatedProperty = await Property.findById(property._id).populate(
      "assignedAgent",
      "name email phone",
    );

    return NextResponse.json(
      {
        success: true,
        data: populatedProperty,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 },
    );
  }
}
