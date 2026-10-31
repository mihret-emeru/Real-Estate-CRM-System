import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import SystemConfiguration from "@/models/SystemConfiguration";

const defaultCRMSettings = {
  leadManagementEnabled: true,
  defaultLeadStatus: "new",
  followUpReminder: 24,
  autoLeadAssignment: false,

  appointmentsEnabled: true,
  appointmentDuration: 60,
  allowClientRescheduling: true,
  requireAgentConfirmation: true,

  clientRegistrationEnabled: true,
  allowClientPreferenceUpdates: true,
  requireClientPhone: true,

  notificationsEnabled: true,
  leadAssignmentNotifications: true,
  appointmentNotifications: true,
  paymentNotifications: true,
};

async function checkAdmin() {
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
          message: "Only administrators can access CRM settings.",
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

export async function GET() {
  try {
    await connectDB();

    const auth = await checkAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    let settings = await SystemConfiguration.findOne();

    if (!settings) {
      settings = await SystemConfiguration.create({
        companyName: "Real Estate CRM",
        currency: "ETB",
        timezone: "Africa/Addis_Ababa",
        crm: defaultCRMSettings,
      });
    }

    const crmSettings = {
      ...defaultCRMSettings,
      ...(settings.crm?.toObject?.() || settings.crm || {}),
    };

    return NextResponse.json({
      success: true,
      data: crmSettings,
    });
  } catch (error) {
    console.error("CRM settings GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load CRM settings.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();

    const auth = await checkAdmin();

    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json();

    const {
      leadManagementEnabled,
      defaultLeadStatus,
      followUpReminder,
      autoLeadAssignment,

      appointmentsEnabled,
      appointmentDuration,
      allowClientRescheduling,
      requireAgentConfirmation,

      clientRegistrationEnabled,
      allowClientPreferenceUpdates,
      requireClientPhone,

      notificationsEnabled,
      leadAssignmentNotifications,
      appointmentNotifications,
      paymentNotifications,
    } = body;

    if (
      typeof leadManagementEnabled !== "boolean" ||
      typeof autoLeadAssignment !== "boolean" ||
      typeof appointmentsEnabled !== "boolean" ||
      typeof allowClientRescheduling !== "boolean" ||
      typeof requireAgentConfirmation !== "boolean" ||
      typeof clientRegistrationEnabled !== "boolean" ||
      typeof allowClientPreferenceUpdates !== "boolean" ||
      typeof requireClientPhone !== "boolean" ||
      typeof notificationsEnabled !== "boolean" ||
      typeof leadAssignmentNotifications !== "boolean" ||
      typeof appointmentNotifications !== "boolean" ||
      typeof paymentNotifications !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid CRM toggle settings.",
        },
        { status: 400 },
      );
    }

    if (!["new", "contacted", "qualified"].includes(defaultLeadStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid default lead status.",
        },
        { status: 400 },
      );
    }

    if (![12, 24, 48, 72].includes(Number(followUpReminder))) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid follow-up reminder.",
        },
        { status: 400 },
      );
    }

    if (![30, 60, 90, 120].includes(Number(appointmentDuration))) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid appointment duration.",
        },
        { status: 400 },
      );
    }

    const crm = {
      leadManagementEnabled,
      defaultLeadStatus,
      followUpReminder: Number(followUpReminder),
      autoLeadAssignment,

      appointmentsEnabled,
      appointmentDuration: Number(appointmentDuration),
      allowClientRescheduling,
      requireAgentConfirmation,

      clientRegistrationEnabled,
      allowClientPreferenceUpdates,
      requireClientPhone,

      notificationsEnabled,
      leadAssignmentNotifications,
      appointmentNotifications,
      paymentNotifications,
    };

    const settings = await SystemConfiguration.findOneAndUpdate(
      {},
      {
        $set: {
          crm,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();

    return NextResponse.json({
      success: true,
      message: "CRM settings saved successfully.",
      data: {
        ...defaultCRMSettings,
        ...(settings.crm || {}),
      },
    });
  } catch (error) {
    console.error("CRM settings PUT error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save CRM settings.",
      },
      { status: 500 },
    );
  }
}
