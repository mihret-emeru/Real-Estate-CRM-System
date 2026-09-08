import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";

function createToken(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );

  const signature = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        {
          status: 401,
        },
      );
    }

    if (session.user.role !== "client") {
      return NextResponse.json(
        {
          success: false,
          message: "Only clients can use property conversion actions.",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();

    if (!body.propertyId) {
      return NextResponse.json(
        {
          success: false,
          message: "Property ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const payload = {
      userId: session.user.id,
      propertyId: body.propertyId,
      purpose: body.purpose || "property_interest",
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    const token = createToken(payload);

    return NextResponse.json(
      {
        success: true,
        token,
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

