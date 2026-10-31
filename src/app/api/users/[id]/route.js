import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import User from "@/models/User";
import { createAuditLog } from "@/lib/auditLog";

async function authorizeAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      ),
    };
  }

  if (session.user.role !== "admin") {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Only administrators can manage users.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

export async function GET(request, { params }) {
  try {
    await connectDB();

    const authorization = await authorizeAdmin();

    if (!authorization.authorized) {
      return authorization.response;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required.",
        },
        { status: 400 },
      );
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user API error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load user.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const authorization = await authorizeAdmin();

    if (!authorization.authorized) {
      return authorization.response;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required.",
        },
        { status: 400 },
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    const body = await request.json();

    const changes = [];

    const originalValues = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      preferredPropertyType: user.preferredPropertyType,
      minBudget: user.minBudget,
      maxBudget: user.maxBudget,
      currency: user.currency,
      role: user.role,
      profileImage: user.profileImage,
      isActive: user.isActive,
    };

    const allowedFields = [
      "name",
      "email",
      "phone",
      "city",
      "preferredPropertyType",
      "minBudget",
      "maxBudget",
      "currency",
      "role",
      "profileImage",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        user[field] = body[field];
      }
    }

    if (body.email !== undefined) {
      const email = body.email.toLowerCase().trim();

      const existingUser = await User.findOne({
        email,
        _id: { $ne: id },
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

      user.email = email;
    }

    if (body.name !== undefined) {
      user.name = body.name.trim();
    }

    if (body.phone !== undefined) {
      user.phone = body.phone.trim();
    }

    if (body.city !== undefined) {
      user.city = body.city.trim();
    }

    if (body.role !== undefined) {
      if (!["manager", "agent", "client"].includes(body.role)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid user role.",
          },
          { status: 400 },
        );
      }

      if (user.role === "admin" && body.role !== "admin") {
        return NextResponse.json(
          {
            success: false,
            message: "Admin accounts cannot be changed to another role.",
          },
          { status: 400 },
        );
      }

      user.role = body.role;
    }

    if (body.isActive !== undefined) {
      if (user.role === "admin" && body.isActive === false) {
        return NextResponse.json(
          {
            success: false,
            message: "Admin accounts cannot be deactivated.",
          },
          { status: 400 },
        );
      }

      user.isActive = Boolean(body.isActive);
    }

    if (originalValues.name !== user.name) {
      changes.push({
        field: "name",
        from: originalValues.name,
        to: user.name,
      });
    }

    if (originalValues.email !== user.email) {
      changes.push({
        field: "email",
        from: originalValues.email,
        to: user.email,
      });
    }

    if (originalValues.phone !== user.phone) {
      changes.push({
        field: "phone",
        from: originalValues.phone,
        to: user.phone,
      });
    }

    if (originalValues.city !== user.city) {
      changes.push({
        field: "city",
        from: originalValues.city,
        to: user.city,
      });
    }

    if (originalValues.preferredPropertyType !== user.preferredPropertyType) {
      changes.push({
        field: "preferredPropertyType",
        from: originalValues.preferredPropertyType,
        to: user.preferredPropertyType,
      });
    }

    if (originalValues.minBudget !== user.minBudget) {
      changes.push({
        field: "minBudget",
        from: originalValues.minBudget,
        to: user.minBudget,
      });
    }

    if (originalValues.maxBudget !== user.maxBudget) {
      changes.push({
        field: "maxBudget",
        from: originalValues.maxBudget,
        to: user.maxBudget,
      });
    }

    if (originalValues.currency !== user.currency) {
      changes.push({
        field: "currency",
        from: originalValues.currency,
        to: user.currency,
      });
    }

    if (originalValues.role !== user.role) {
      changes.push({
        field: "role",
        from: originalValues.role,
        to: user.role,
      });
    }

    if (originalValues.profileImage !== user.profileImage) {
      changes.push({
        field: "profileImage",
        from: originalValues.profileImage,
        to: user.profileImage,
      });
    }

    if (originalValues.isActive !== user.isActive) {
      changes.push({
        field: "isActive",
        from: originalValues.isActive,
        to: user.isActive,
      });
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    if (changes.length > 0) {
      const action =
        changes.length === 1 && changes[0].field === "isActive"
          ? user.isActive
            ? "activated"
            : "deactivated"
          : changes.length === 1 && changes[0].field === "role"
            ? "role_changed"
            : "updated";

      await createAuditLog({
        action,
        module: "users",
        description: `Updated user account for ${user.name}.`,
        user: authorization.session.user.id,
        targetId: user._id,
        targetModel: "User",
        metadata: {
          changes,
          targetName: user.name,
          targetEmail: user.email,
          targetRole: user.role,
        },
        request,
      });
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user API error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update user.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();

    const authorization = await authorizeAdmin();

    if (!authorization.authorized) {
      return authorization.response;
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID is required.",
        },
        { status: 400 },
      );
    }

    if (id === authorization.session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own admin account.",
        },
        { status: 400 },
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    if (user.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Admin accounts cannot be deleted.",
        },
        { status: 400 },
      );
    }

    const deletedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    await User.findByIdAndDelete(id);

    await createAuditLog({
      action: "deleted",
      module: "users",
      description: `Deleted ${deletedUser.role} account for ${deletedUser.name}.`,
      user: authorization.session.user.id,
      targetId: deletedUser.id,
      targetModel: "User",
      metadata: {
        name: deletedUser.name,
        email: deletedUser.email,
        role: deletedUser.role,
      },
      request,
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("Delete user API error:", error);

    if (error.name === "CastError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user ID.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete user.",
      },
      { status: 500 },
    );
  }
}
