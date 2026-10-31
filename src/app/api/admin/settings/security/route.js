import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import dbConnect from "@/lib/mongodb";
import SystemConfiguration from "@/models/SystemConfiguration";
import { authOptions } from "@/lib/auth";

const defaultSecurity = {
  requireStrongPasswords: true,
  passwordMinimumLength: 8,
  requireEmailVerification: false,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  accountLockoutDuration: 15,

  twoFactorAuthentication: false,
  require2FAForAdmins: false,
  require2FAForManagers: false,

  loginNotifications: true,
  trackFailedLoginAttempts: true,
  accountLockout: true,
  allowMultipleActiveSessions: true,

  auditLogging: true,
  logUserChanges: true,
  logPropertyChanges: true,
  logSalesPaymentChanges: true,
  logAuthenticationEvents: true,

  confirmSensitiveAdminActions: true,
  requirePasswordForCriticalActions: true,
  protectAdminAccounts: true,
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
  };
}

function normalizeSecurity(security) {
  return {
    ...defaultSecurity,
    ...(security || {}),
  };
}

function validateSecurity(security) {
  if (
    typeof security.requireStrongPasswords !== "boolean" ||
    typeof security.requireEmailVerification !== "boolean" ||
    typeof security.twoFactorAuthentication !== "boolean" ||
    typeof security.require2FAForAdmins !== "boolean" ||
    typeof security.require2FAForManagers !== "boolean" ||
    typeof security.loginNotifications !== "boolean" ||
    typeof security.trackFailedLoginAttempts !== "boolean" ||
    typeof security.accountLockout !== "boolean" ||
    typeof security.allowMultipleActiveSessions !== "boolean" ||
    typeof security.auditLogging !== "boolean" ||
    typeof security.logUserChanges !== "boolean" ||
    typeof security.logPropertyChanges !== "boolean" ||
    typeof security.logSalesPaymentChanges !== "boolean" ||
    typeof security.logAuthenticationEvents !== "boolean" ||
    typeof security.confirmSensitiveAdminActions !== "boolean" ||
    typeof security.requirePasswordForCriticalActions !== "boolean" ||
    typeof security.protectAdminAccounts !== "boolean"
  ) {
    return "Invalid security toggle value.";
  }

  if (
    !Number.isInteger(security.passwordMinimumLength) ||
    security.passwordMinimumLength < 6 ||
    security.passwordMinimumLength > 32
  ) {
    return "Password minimum length must be between 6 and 32 characters.";
  }

  if (![15, 30, 60, 120, 240].includes(security.sessionTimeout)) {
    return "Invalid session timeout.";
  }

  if (![3, 5, 10].includes(security.maxLoginAttempts)) {
    return "Invalid maximum login attempts.";
  }

  if (![5, 15, 30, 60].includes(security.accountLockoutDuration)) {
    return "Invalid account lockout duration.";
  }

  if (security.require2FAForAdmins && !security.twoFactorAuthentication) {
    return "Enable two-factor authentication before requiring it for admins.";
  }

  if (security.require2FAForManagers && !security.twoFactorAuthentication) {
    return "Enable two-factor authentication before requiring it for managers.";
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
        security: defaultSecurity,
      });
    }

    const security = normalizeSecurity(settings.security);

    return NextResponse.json({
      success: true,
      data: security,
    });
  } catch (error) {
    console.error("Failed to fetch security settings:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load security settings.",
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

    const security = normalizeSecurity(body);

    const validationError = validateSecurity(security);

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
        security,
      });
    } else {
      settings.security = security;
      await settings.save();
    }

    return NextResponse.json({
      success: true,
      message: "Security settings saved successfully.",
      data: normalizeSecurity(settings.security),
    });
  } catch (error) {
    console.error("Failed to save security settings:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save security settings.",
      },
      { status: 500 },
    );
  }
}
