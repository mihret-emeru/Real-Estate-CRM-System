import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Property from "@/models/Property";

// GET ALL PROPERTIES
export async function GET() {
  try {
    await connectDB();

    const properties = await Property.find().sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: properties,
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

    return NextResponse.json(
      {
        success: true,
        data: property,
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

