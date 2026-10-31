import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

const editableFields = [
  "name",
  "phone",
  "city",
  "preferredPropertyType",
  "minBudget",
  "maxBudget",
  "currency",
  "profileImage",
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Please log in to view your profile." },
        { status: 401 },
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id).select("-password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to load profile." },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Please log in to update your profile." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const updates = {};

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: "No profile changes provided." },
        { status: 400 },
      );
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return NextResponse.json(
          { success: false, message: "Name is required." },
          { status: 400 },
        );
      }

      updates.name = updates.name.trim();
    }

    if (updates.phone !== undefined) {
      updates.phone = String(updates.phone).trim();
    }

    if (updates.city !== undefined) {
      updates.city = String(updates.city).trim();
    }

    if (updates.preferredPropertyType !== undefined) {
      const allowedTypes = [
        "house",
        "apartment",
        "villa",
        "land",
        "commercial",
        "other",
      ];

      if (!allowedTypes.includes(updates.preferredPropertyType)) {
        return NextResponse.json(
          { success: false, message: "Invalid preferred property type." },
          { status: 400 },
        );
      }
    }

    if (updates.currency !== undefined) {
      if (!["ETB", "USD"].includes(updates.currency)) {
        return NextResponse.json(
          { success: false, message: "Invalid currency." },
          { status: 400 },
        );
      }
    }

    for (const field of ["minBudget", "maxBudget"]) {
      if (updates[field] !== undefined) {
        if (updates[field] === "" || updates[field] === null) {
          updates[field] = undefined;
        } else {
          const amount = Number(updates[field]);

          if (!Number.isFinite(amount) || amount < 0) {
            return NextResponse.json(
              {
                success: false,
                message: `${field} must be a non-negative number.`,
              },
              { status: 400 },
            );
          }

          updates[field] = amount;
        }
      }
    }

    await connectDB();

    const currentUser = await User.findById(session.user.id);

    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    const nextMinBudget =
      updates.minBudget === undefined
        ? currentUser.minBudget
        : updates.minBudget;

    const nextMaxBudget =
      updates.maxBudget === undefined
        ? currentUser.maxBudget
        : updates.maxBudget;

    if (
      nextMinBudget != null &&
      nextMaxBudget != null &&
      nextMinBudget > nextMaxBudget
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum budget cannot exceed maximum budget.",
        },
        { status: 400 },
      );
    }

    Object.assign(currentUser, updates);

    await currentUser.save();

    const safeUser = await User.findById(currentUser._id).select("-password");

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      data: safeUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update profile." },
      { status: 500 },
    );
  }
}
