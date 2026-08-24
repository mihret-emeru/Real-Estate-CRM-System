import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import Favorite from "@/models/Favorite";

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

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can access favorites.",
        },
        { status: 403 },
      );
    }

    const favorites = await Favorite.find({
      client: session.user.id,
    })
      .populate("property")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: favorites,
    });
  } catch (error) {
    console.error("Favorites GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
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

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can manage favorites.",
        },
        { status: 403 },
      );
    }

    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Property ID is required.",
        },
        { status: 400 },
      );
    }

    const existingFavorite = await Favorite.findOne({
      client: session.user.id,
      property: propertyId,
    });

    // Remove from favorites
    if (existingFavorite) {
      await Favorite.findByIdAndDelete(existingFavorite._id);

      return NextResponse.json({
        success: true,
        saved: false,
        message: "Property removed from favorites.",
      });
    }

    // Add to favorites
    await Favorite.create({
      client: session.user.id,
      property: propertyId,
    });

    return NextResponse.json({
      success: true,
      saved: true,
      message: "Property added to favorites.",
    });
  } catch (error) {
    console.error("Favorites POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
