import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import SystemConfiguration from "@/models/SystemConfiguration";
import { authOptions } from "@/lib/auth";

const defaultSales = {
  paymentsEnabled: true,
  chapaEnabled: true,
  automaticPaymentVerification: true,
  managerApprovalForExceptions: true,
  installmentsEnabled: true,
  minimumInstallments: 2,
  maximumInstallments: 12,
  minimumDownPayment: 20,
  paymentGracePeriod: 7,
  salesManagementEnabled: true,
  defaultSalesCurrency: "ETB",
  agentCommissionRate: 2,
  paymentNotificationsEnabled: true,
  paymentConfirmationNotifications: true,
  paymentFailureNotifications: true,
  installmentDueNotifications: true,
};

async function checkAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return false;
  }

  return session.user.role === "admin";
}

function normalizeSales(sales) {
  const source = sales?.toObject?.() || sales || {};

  return {
    ...defaultSales,
    ...source,
  };
}

export async function GET() {
  try {
    const isAdmin = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    await dbConnect();

    let settings = await SystemConfiguration.findOne();

    if (!settings) {
      settings = await SystemConfiguration.create({
        sales: defaultSales,
      });
    }

    const sales = normalizeSales(settings.sales);

    return NextResponse.json({
      success: true,
      data: sales,
    });
  } catch (error) {
    console.error("Failed to load sales settings:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load sales settings",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(request) {
  try {
    const isAdmin = await checkAdmin();

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const body = await request.json();

    const sales = {
      ...defaultSales,

      paymentsEnabled: Boolean(body.paymentsEnabled),

      chapaEnabled: Boolean(body.chapaEnabled),

      automaticPaymentVerification: Boolean(body.automaticPaymentVerification),

      managerApprovalForExceptions: Boolean(body.managerApprovalForExceptions),

      installmentsEnabled: Boolean(body.installmentsEnabled),

      minimumInstallments: Number(body.minimumInstallments),

      maximumInstallments: Number(body.maximumInstallments),

      minimumDownPayment: Number(body.minimumDownPayment),

      paymentGracePeriod: Number(body.paymentGracePeriod),

      salesManagementEnabled: Boolean(body.salesManagementEnabled),

      defaultSalesCurrency: body.defaultSalesCurrency,

      agentCommissionRate: Number(body.agentCommissionRate),

      paymentNotificationsEnabled: Boolean(body.paymentNotificationsEnabled),

      paymentConfirmationNotifications: Boolean(
        body.paymentConfirmationNotifications,
      ),

      paymentFailureNotifications: Boolean(body.paymentFailureNotifications),

      installmentDueNotifications: Boolean(body.installmentDueNotifications),
    };

    if (
      !Number.isInteger(sales.minimumInstallments) ||
      sales.minimumInstallments < 1 ||
      sales.minimumInstallments > 60
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum installments must be between 1 and 60",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(sales.maximumInstallments) ||
      sales.maximumInstallments < 1 ||
      sales.maximumInstallments > 60
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Maximum installments must be between 1 and 60",
        },
        {
          status: 400,
        },
      );
    }

    if (sales.minimumInstallments > sales.maximumInstallments) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Minimum installments cannot be greater than maximum installments",
        },
        {
          status: 400,
        },
      );
    }

    if (sales.minimumDownPayment < 0 || sales.minimumDownPayment > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimum down payment must be between 0% and 100%",
        },
        {
          status: 400,
        },
      );
    }

    if (sales.paymentGracePeriod < 0 || sales.paymentGracePeriod > 90) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment grace period must be between 0 and 90 days",
        },
        {
          status: 400,
        },
      );
    }

    if (sales.agentCommissionRate < 0 || sales.agentCommissionRate > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Agent commission rate must be between 0% and 100%",
        },
        {
          status: 400,
        },
      );
    }

    if (!["ETB", "USD"].includes(sales.defaultSalesCurrency)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid default sales currency",
        },
        {
          status: 400,
        },
      );
    }

    await dbConnect();

    const existingSettings = await SystemConfiguration.findOne();

    if (existingSettings) {
      existingSettings.sales = sales;

      await existingSettings.save();

      const savedSales = normalizeSales(existingSettings.sales);

      return NextResponse.json({
        success: true,
        message: "Sales & Payments settings saved successfully",
        data: savedSales,
      });
    }

    const settings = await SystemConfiguration.create({
      sales,
    });

    const savedSales = normalizeSales(settings.sales);

    return NextResponse.json({
      success: true,
      message: "Sales & Payments settings saved successfully",
      data: savedSales,
    });
  } catch (error) {
    console.error("Failed to save sales settings:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save sales & Payments settings",
      },
      {
        status: 500,
      },
    );
  }
}
