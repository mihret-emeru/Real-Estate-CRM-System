import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import SystemConfiguration from "@/models/SystemConfiguration";

export async function GET() {
  try {
    await connectDB();

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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Only administrators can access system settings.",
        },
        { status: 403 },
      );
    }

    let settings = await SystemConfiguration.findOne().lean();

    if (!settings) {
      settings = await SystemConfiguration.create({
        companyName: "Real Estate CRM",
        currency: "ETB",
        timezone: "Africa/Addis_Ababa",
      });

      settings = settings.toObject();
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("General settings GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load general settings.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();

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

    if (session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Only administrators can update system settings.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      companyName,
      email,
      phone,
      address,
      city,
      website,
      currency,
      timezone,
    } = body;

    if (!companyName?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Company name is required.",
        },
        { status: 400 },
      );
    }

    if (!["ETB", "USD"].includes(currency)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid currency.",
        },
        { status: 400 },
      );
    }

    const allowedTimezones = [
      "Africa/Addis_Ababa",
      "Africa/Nairobi",
      "Africa/Cairo",
      "UTC",
    ];

    if (!allowedTimezones.includes(timezone)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid timezone.",
        },
        { status: 400 },
      );
    }

    const settings = await SystemConfiguration.findOneAndUpdate(
      {},
      {
        companyName: companyName.trim(),
        email: email?.trim() || "",
        phone: phone?.trim() || "",
        address: address?.trim() || "",
        city: city?.trim() || "",
        website: website?.trim() || "",
        currency,
        timezone,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return NextResponse.json({
      success: true,
      message: "General settings saved successfully.",
      data: settings,
    });
  } catch (error) {
    console.error("General settings PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save general settings.",
      },
      { status: 500 },
    );
  }
}
