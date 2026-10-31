import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("DIRECT MONGOOSE CONNECTION: SUCCESS");

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
    });
  } catch (error) {
    console.error("DIRECT MONGOOSE CONNECTION: FAILED");
    console.error(error.name);
    console.error(error.message);

    return NextResponse.json(
      {
        success: false,
        name: error.name,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
