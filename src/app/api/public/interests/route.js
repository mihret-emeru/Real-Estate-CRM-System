import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Property from "@/models/Property";
import Lead from "@/models/Lead";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3001",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function verifyToken(token) {
  const parts = token?.split(".");

  if (!parts || parts.length !== 2) {
    return null;
  }

  const [encodedPayload, signature] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.NEXTAUTH_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString(),
    );

    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request) {
  try {
    const body = await request.json();

    const payload = verifyToken(body.token);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired conversion token.",
        },
        {
          status: 401,
          headers: corsHeaders,
        },
      );
    }

    if (payload.purpose !== "property_interest") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid conversion purpose.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    await connectDB();

    const user = await User.findById(payload.userId);

    if (!user || user.role !== "client" || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Client account not found or inactive.",
        },
        {
          status: 403,
          headers: corsHeaders,
        },
      );
    }

    const property = await Property.findById(payload.propertyId);

    if (!property) {
      return NextResponse.json(
        {
          success: false,
          message: "Property not found.",
        },
        {
          status: 404,
          headers: corsHeaders,
        },
      );
    }

    if (!user.phone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please add a phone number to your account before expressing interest.",
        },
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const propertyId = property._id;
    const now = new Date();

    const existingLead = await Lead.findOne({
      client: user._id,
    });

    if (!existingLead) {
      const lead = await Lead.findOneAndUpdate(
        {
          client: user._id,
        },
        {
          $setOnInsert: {
            fullName: user.name,
            email: user.email,
            phone: user.phone,
            client: user._id,
            interestedProperty: propertyId,
            source: "website",
            status: "new",
            notes: `Client expressed interest in ${property.title} from the public website.`,
            activities: [
              {
                type: "created",
                message: "Lead created from website",
                createdAt: now,
              },
              {
                type: "property_interest",
                message: `Client expressed interest in ${property.title}.`,
                createdAt: now,
              },
            ],
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );

      return NextResponse.json(
        {
          success: true,
          alreadyExists: false,
          updated: false,
          data: lead,
          message: "Your interest has been submitted successfully.",
        },
        {
          status: 201,
          headers: corsHeaders,
        },
      );
    }

    const previousProperty = existingLead.interestedProperty;

    if (existingLead.interestedProperty?.toString() === propertyId.toString()) {
      return NextResponse.json(
        {
          success: true,
          alreadyExists: true,
          updated: false,
          previousProperty,
          data: existingLead,
          message: "Your interest in this property has already been submitted.",
        },
        {
          status: 200,
          headers: corsHeaders,
        },
      );
    }

    const updatedLead = await Lead.findOneAndUpdate(
      {
        _id: existingLead._id,
        interestedProperty: {
          $ne: propertyId,
        },
      },
      {
        $set: {
          interestedProperty: propertyId,
          source: "website",
          fullName: user.name,
          email: user.email,
          phone: user.phone,
          notes: `Client expressed interest in ${property.title} from the public website.`,
        },
        $push: {
          activities: {
            type: "property_interest",
            message: `Client expressed interest in ${property.title}.`,
            createdAt: now,
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedLead) {
      const currentLead = await Lead.findOne({
        client: user._id,
      });

      return NextResponse.json(
        {
          success: true,
          alreadyExists: true,
          updated: false,
          previousProperty: currentLead?.interestedProperty || previousProperty,
          data: currentLead,
          message: "Your interest in this property has already been submitted.",
        },
        {
          status: 200,
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        alreadyExists: true,
        updated: true,
        previousProperty,
        data: updatedLead,
        message: "Your interest has been submitted successfully.",
      },
      {
        status: 200,
        headers: corsHeaders,
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
        headers: corsHeaders,
      },
    );
  }
}

