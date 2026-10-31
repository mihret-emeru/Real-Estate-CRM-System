import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import dbConnect from "@/lib/mongodb";
import SystemConfiguration from "@/models/SystemConfiguration";
import { authOptions } from "@/lib/auth";

const defaultPreferences = {
  theme: "system",
  sidebarCollapsed: false,
  compactMode: false,
  showBreadcrumbs: true,
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24-hour",
  weekStartsOn: "monday",
  systemNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  inAppNotificationsEnabled: true,
  notificationSoundEnabled: true,
  showStatisticsCards: true,
  showRecentActivity: true,
  showQuickActions: true,
  recordsPerPage: 10,
  confirmBeforeDelete: true,
  autoRefreshData: true,
  autoRefreshInterval: 60,
};

async function checkAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
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
          message: "Access denied. Admin privileges required.",
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

function normalizePreferences(preferences) {
  return {
    ...defaultPreferences,
    ...(preferences || {}),
  };
}

function validatePreferences(preferences) {
  const validThemes = ["system", "light", "dark"];

  const validDateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

  const validTimeFormats = ["12-hour", "24-hour"];

  const validWeekStarts = ["monday", "sunday"];

  const validRecordsPerPage = [10, 20, 30, 50];

  const validRefreshIntervals = [30, 60, 120, 300];

  if (!validThemes.includes(preferences.theme)) {
    return "Invalid theme.";
  }

  if (!validDateFormats.includes(preferences.dateFormat)) {
    return "Invalid date format.";
  }

  if (!validTimeFormats.includes(preferences.timeFormat)) {
    return "Invalid time format.";
  }

  if (!validWeekStarts.includes(preferences.weekStartsOn)) {
    return "Invalid week start day.";
  }

  if (!validRecordsPerPage.includes(preferences.recordsPerPage)) {
    return "Invalid records per page value.";
  }

  if (!validRefreshIntervals.includes(preferences.autoRefreshInterval)) {
    return "Invalid auto refresh interval.";
  }

  if (typeof preferences.sidebarCollapsed !== "boolean") {
    return "Invalid sidebar collapsed value.";
  }

  if (typeof preferences.compactMode !== "boolean") {
    return "Invalid compact mode value.";
  }

  if (typeof preferences.showBreadcrumbs !== "boolean") {
    return "Invalid breadcrumbs value.";
  }

  if (typeof preferences.systemNotificationsEnabled !== "boolean") {
    return "Invalid system notification value.";
  }

  if (typeof preferences.emailNotificationsEnabled !== "boolean") {
    return "Invalid email notification value.";
  }

  if (typeof preferences.inAppNotificationsEnabled !== "boolean") {
    return "Invalid in-app notification value.";
  }

  if (typeof preferences.notificationSoundEnabled !== "boolean") {
    return "Invalid notification sound value.";
  }

  if (typeof preferences.showStatisticsCards !== "boolean") {
    return "Invalid statistics cards value.";
  }

  if (typeof preferences.showRecentActivity !== "boolean") {
    return "Invalid recent activity value.";
  }

  if (typeof preferences.showQuickActions !== "boolean") {
    return "Invalid quick actions value.";
  }

  if (typeof preferences.confirmBeforeDelete !== "boolean") {
    return "Invalid delete confirmation value.";
  }

  if (typeof preferences.autoRefreshData !== "boolean") {
    return "Invalid auto refresh value.";
  }

  return null;
}

export async function GET() {
  try {
    const adminCheck = await checkAdmin();

    if (!adminCheck.authorized) {
      return adminCheck.response;
    }

    await dbConnect();

    let settings = await SystemConfiguration.findOne();

    if (!settings) {
      settings = await SystemConfiguration.create({
        preferences: defaultPreferences,
      });
    }

    const preferences = normalizePreferences(settings.preferences);

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("Failed to fetch system preferences:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load system preferences.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const adminCheck = await checkAdmin();

    if (!adminCheck.authorized) {
      return adminCheck.response;
    }

    await dbConnect();

    const body = await request.json();

    const preferences = normalizePreferences(body);

    const validationError = validatePreferences(preferences);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError,
        },
        { status: 400 },
      );
    }

    let settings = await SystemConfiguration.findOne();

    if (!settings) {
      settings = await SystemConfiguration.create({
        preferences,
      });
    } else {
      settings.preferences = preferences;

      await settings.save();
    }

    return NextResponse.json({
      success: true,
      message: "System preferences saved successfully.",
      data: normalizePreferences(settings.preferences),
    });
  } catch (error) {
    console.error("Failed to save system preferences:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save system preferences.",
      },
      { status: 500 },
    );
  }
}
