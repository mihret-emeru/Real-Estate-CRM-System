import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import dbConnect from "@/lib/mongodb";

import AuditLog from "@/models/AuditLog";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
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
          message: "Access denied.",
        },
        { status: 403 },
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 20, 1),
      100,
    );

    const search = (searchParams.get("search") || "").trim();

    const moduleFilter = searchParams.get("module") || "all";

    const actionFilter = searchParams.get("action") || "all";

    const skip = (page - 1) * limit;

    const filter = {};

    if (moduleFilter !== "all") {
      filter.module = moduleFilter;
    }

    if (actionFilter !== "all") {
      filter.action = actionFilter;
    }

    if (search) {
      filter.$or = [
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
        {
          action: {
            $regex: search,
            $options: "i",
          },
        },
        {
          module: {
            $regex: search,
            $options: "i",
          },
        },
        {
          ipAddress: {
            $regex: search,
            $options: "i",
          },
        },
        {
          targetModel: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("user", "name email role phone")
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(filter),
    ]);

    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    return NextResponse.json({
      success: true,

      data: logs,

      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch audit logs.",
      },
      { status: 500 },
    );
  }
}

