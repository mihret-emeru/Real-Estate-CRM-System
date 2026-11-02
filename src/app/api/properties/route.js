import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Property from "@/models/Property";
import User from "@/models/User";
import { createNotification } from "@/utils/createNotification";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3001",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        {
          title: {
            $regex: search,
            $options: "i",
          },
        },
        {
          propertyType: {
            $regex: search,
            $options: "i",
          },
        },
        {
          "location.city": {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate("assignedAgent", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Property.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: properties,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Get properties error:", error);

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

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const property = await Property.create(body);

    // Notify the assigned agent when a property is created.
    if (property.assignedAgent) {
      try {
        const agent = await User.findOne({
          _id: property.assignedAgent,
          role: "agent",
          isActive: true,
        }).select("_id");

        if (agent) {
          await createNotification({
            recipient: agent._id,
            type: "agent_assigned",
            title: "New Property Assigned",
            message: `You have been assigned to "${property.title}". Open your assigned properties to view the details.`,
            link: `/agent/properties/${property._id}`,
            metadata: {
              propertyId: property._id,
              propertyTitle: property.title,
            },
            sendEmailNotification: true,
          });
        }
      } catch (notificationError) {
        console.error(
          "Property assignment notification error:",
          notificationError,
        );
      }
    }

    const populatedProperty = await Property.findById(property._id).populate(
      "assignedAgent",
      "name email phone",
    );

    return NextResponse.json(
      {
        success: true,
        data: populatedProperty,
      },
      {
        status: 201,
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error("Create property error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }
}
