import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import Property from "@/models/Property";
import User from "@/models/User";
import { createNotification } from "@/utils/createNotification";

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    if (session.user.role !== "manager") {
      return NextResponse.json(
        { success: false, message: "Only managers can assign agents." },
        { status: 403 },
      );
    }

    await connectDB();

    const { id } = await params;
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { success: false, message: "Agent ID is required." },
        { status: 400 },
      );
    }

    const [property, agent] = await Promise.all([
      Property.findById(id),
      User.findById(agentId).select("name email role isActive"),
    ]);

    if (!property) {
      return NextResponse.json(
        { success: false, message: "Property not found." },
        { status: 404 },
      );
    }

    if (!agent || agent.role !== "agent" || agent.isActive !== true) {
      return NextResponse.json(
        { success: false, message: "Please select an active agent." },
        { status: 400 },
      );
    }

    const isNewAssignment =
      property.assignedAgent?.toString() !== agent._id.toString();

    property.assignedAgent = agent._id;
    await property.save();

    const populatedProperty = await Property.findById(property._id).populate(
      "assignedAgent",
      "name email phone",
    );

    if (isNewAssignment) {
      try {
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
      } catch (notificationError) {
        console.error(
          "Agent assignment notification error:",
          notificationError,
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: populatedProperty,
    });
  } catch (error) {
    console.error("Assign agent error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to assign agent.",
      },
      { status: 500 },
    );
  }
}
