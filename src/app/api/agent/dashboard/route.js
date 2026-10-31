import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import User from "@/models/User";
import Property from "@/models/Property";
import Lead from "@/models/Lead";
import ViewingRequest from "@/models/ViewingRequest";
import Conversation from "@/models/Conversation";

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

    if (session.user.role !== "agent") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied.",
        },
        { status: 403 },
      );
    }

    const agentId = session.user.id;

    const agent = await User.findById(agentId).select("name email phone role");

    if (!agent) {
      return NextResponse.json(
        {
          success: false,
          message: "Agent not found.",
        },
        { status: 404 },
      );
    }

    const assignedProperties = await Property.find({
      assignedAgent: agentId,
    })
      .sort({ createdAt: -1 })
      .populate("assignedAgent", "name email");

    const leads = await Lead.find()
      .sort({ createdAt: -1 })
      .populate(
        "interestedProperty",
        "title price currency propertyType status location images assignedAgent",
      )
      .populate("client", "name email phone");

    const viewingRequests = await ViewingRequest.find({
      agent: agentId,
    })
      .sort({
        requestedDate: 1,
        createdAt: -1,
      })
      .populate("client", "name email phone")
      .populate(
        "property",
        "title price currency propertyType status location images",
      );

    const conversations = await Conversation.find({
      agent: agentId,
    })
      .sort({ lastMessageAt: -1 })
      .populate("client", "name email phone")
      .populate(
        "property",
        "title price currency propertyType status location images",
      );

    const soldProperties = assignedProperties.filter(
      (property) => property.status === "sold",
    );

    const totalCommission = soldProperties.reduce((total, property) => {
      return total + Number(property.price || 0) * 0.02;
    }, 0);

    const activeLeadStatuses = ["new", "contacted", "qualified", "negotiation"];

    const activeLeads = leads.filter((lead) =>
      activeLeadStatuses.includes(lead.status),
    );

    const today = new Date();

    function isSameDay(date) {
      if (!date) return false;

      const target = new Date(date);

      return (
        target.getFullYear() === today.getFullYear() &&
        target.getMonth() === today.getMonth() &&
        target.getDate() === today.getDate()
      );
    }

    const todayAppointments = viewingRequests.filter((request) => {
      const appointmentDate = request.scheduledDate || request.requestedDate;

      return (
        isSameDay(appointmentDate) &&
        ["pending", "accepted"].includes(request.status)
      );
    });

    const unreadMessages = conversations.reduce((total, conversation) => {
      return total + Number(conversation.agentUnreadCount || 0);
    }, 0);

    const leadOverview = {
      new: leads.filter((lead) => lead.status === "new").length,

      contacted: leads.filter((lead) => lead.status === "contacted").length,

      qualified: leads.filter((lead) => lead.status === "qualified").length,

      negotiation: leads.filter((lead) => lead.status === "negotiation").length,

      won: leads.filter((lead) => lead.status === "won").length,

      lost: leads.filter((lead) => lead.status === "lost").length,
    };

    const appointmentOverview = {
      pending: viewingRequests.filter((request) => request.status === "pending")
        .length,

      accepted: viewingRequests.filter(
        (request) => request.status === "accepted",
      ).length,

      completed: viewingRequests.filter(
        (request) => request.status === "completed",
      ).length,

      declined: viewingRequests.filter(
        (request) => request.status === "declined",
      ).length,

      cancelled: viewingRequests.filter(
        (request) => request.status === "cancelled",
      ).length,
    };

    const upcomingAppointments = viewingRequests
      .filter((request) => ["pending", "accepted"].includes(request.status))
      .sort((a, b) => {
        const dateA = new Date(a.scheduledDate || a.requestedDate);

        const dateB = new Date(b.scheduledDate || b.requestedDate);

        return dateA - dateB;
      })
      .slice(0, 5);

    const commissionByProperty = soldProperties.map((property) => ({
      _id: property._id,
      title: property.title,
      price: property.price,
      currency: property.currency,
      commission: Number(property.price || 0) * 0.02,
    }));

    return NextResponse.json({
      success: true,

      data: {
        agent,

        stats: {
          assignedProperties: assignedProperties.length,

          activeLeads: activeLeads.length,

          todayAppointments: todayAppointments.length,

          unreadMessages,

          totalCommission,
        },

        leadOverview,

        appointmentOverview,

        properties: assignedProperties.slice(0, 6),

        recentLeads: leads.slice(0, 5),

        upcomingAppointments,

        commissionByProperty,
      },
    });
  } catch (error) {
    console.error("Agent dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load agent dashboard.",
      },
      { status: 500 },
    );
  }
}
