import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import User from "@/models/User";
import { createAuditLog } from "@/lib/auditLog";
import bcrypt from "bcryptjs";

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
          message: "Only administrators can access users.",
        },
        { status: 403 },
      );
    }

    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Users API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load users.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
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
          message: "Only administrators can create users.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const { name, email, password, phone, city, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, password, and role are required.",
        },
        { status: 400 },
      );
    }

    if (!["manager", "agent"].includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Admin can only create manager or agent accounts.",
        },
        { status: 400 },
      );
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "A user with this email already exists.",
        },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone?.trim() || "",
      city: city?.trim() || "",
      role,
      isActive: true,
    });
    const createdUser = await User.findById(user._id).select("-password");

    await createAuditLog({
      action: "created",
      module: "users",
      description: `Created ${role} account for ${user.name}.`,
      user: session.user.id,
      targetId: user._id,
      targetModel: "User",
      metadata: {
        role,
        name: user.name,
        email: user.email,
      },
      request,
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully.",
        data: createdUser,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create user API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create user.",
      },
      { status: 500 },
    );
  }
}
