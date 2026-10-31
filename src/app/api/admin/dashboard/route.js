import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import dbConnect from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";

import User from "@/models/User";
import Property from "@/models/Property";
import Lead from "@/models/Lead";
import Contract from "@/models/Contract";
import Payment from "@/models/Payment";
import AuditLog from "@/models/AuditLog";

async function checkAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      authorized: false,
      status: 401,
      message: "Authentication required.",
    };
  }

  if (session.user.role !== "admin") {
    return {
      authorized: false,
      status: 403,
      message: "Admin access required.",
    };
  }

  return {
    authorized: true,
    session,
  };
}

function formatCurrency(value) {
  return Number(value || 0);
}

async function getOverview() {
  const [
    totalUsers,
    totalProperties,
    totalLeads,
    totalClients,
    totalAgents,
    totalSales,
    revenueResult,
  ] = await Promise.all([
    User.countDocuments(),

    Property.countDocuments(),

    Lead.countDocuments(),

    User.countDocuments({
      role: "client",
    }),

    User.countDocuments({
      role: "agent",
    }),

    Contract.countDocuments({
      status: {
        $in: ["signed", "completed"],
      },
    }),

    Contract.aggregate([
      {
        $match: {
          status: {
            $in: ["signed", "completed"],
          },
        },
      },

      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: ["$salePrice", 0],
            },
          },
        },
      },
    ]),
  ]);

  return {
    totalUsers,
    totalProperties,
    totalLeads,
    totalClients,
    totalAgents,
    totalSales,
    totalRevenue: formatCurrency(revenueResult[0]?.total),
  };
}

async function getSalesChart() {
  const startDate = new Date();

  startDate.setMonth(startDate.getMonth() - 5);
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const sales = await Contract.aggregate([
    {
      $match: {
        status: {
          $in: ["signed", "completed"],
        },

        createdAt: {
          $gte: startDate,
        },
      },
    },

    {
      $group: {
        _id: {
          year: {
            $year: "$createdAt",
          },

          month: {
            $month: "$createdAt",
          },
        },

        sales: {
          $sum: 1,
        },

        revenue: {
          $sum: {
            $ifNull: ["$salePrice", 0],
          },
        },
      },
    },

    {
      $sort: {
        "_id.year": 1,
        "_id.month": 1,
      },
    },
  ]);

  const labels = [];
  const salesValues = [];
  const revenueValues = [];

  for (let index = 5; index >= 0; index--) {
    const date = new Date();

    date.setMonth(date.getMonth() - index);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const record = sales.find(
      (item) => item._id.year === year && item._id.month === month,
    );

    labels.push(
      date.toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      }),
    );

    salesValues.push(record?.sales || 0);
    revenueValues.push(record?.revenue || 0);
  }

  return {
    labels,

    datasets: [
      {
        label: "Sales",
        data: salesValues,
      },

      {
        label: "Revenue",
        data: revenueValues,
      },
    ],
  };
}

async function getLeadChart() {
  const leadStatuses = [
    "new",
    "contacted",
    "qualified",
    "negotiation",
    "won",
    "lost",
  ];

  const results = await Lead.aggregate([
    {
      $group: {
        _id: "$status",

        count: {
          $sum: 1,
        },
      },
    },
  ]);

  return {
    labels: leadStatuses.map(
      (status) => status.charAt(0).toUpperCase() + status.slice(1),
    ),

    datasets: [
      {
        label: "Leads",

        data: leadStatuses.map((status) => {
          const result = results.find((item) => item._id === status);

          return result?.count || 0;
        }),
      },
    ],
  };
}

async function getRecentActivities() {
  const [properties, users, leads, contracts] = await Promise.all([
    Property.find()
      .sort({
        createdAt: -1,
      })
      .limit(3)
      .select("title createdAt"),

    User.find()
      .sort({
        createdAt: -1,
      })
      .limit(3)
      .select("name role createdAt"),

    Lead.find()
      .sort({
        createdAt: -1,
      })
      .limit(3)
      .select("fullName status createdAt"),

    Contract.find()
      .sort({
        createdAt: -1,
      })
      .limit(3)
      .select("contractNumber salePrice status createdAt"),
  ]);

  const activities = [
    ...properties.map((property) => ({
      type: "property",
      title: "New property added",
      description: property.title,
      date: property.createdAt,
    })),

    ...users.map((user) => ({
      type: "user",
      title: "New user registered",
      description: `${user.name} (${user.role})`,
      date: user.createdAt,
    })),

    ...leads.map((lead) => ({
      type: "lead",
      title: "New lead created",
      description: `${lead.fullName} • ${lead.status}`,
      date: lead.createdAt,
    })),

    ...contracts.map((contract) => ({
      type: "sale",
      title: "Contract created",
      description: `${contract.contractNumber} • ${formatCurrency(
        contract.salePrice,
      ).toLocaleString()} ETB`,
      date: contract.createdAt,
    })),
  ];

  return activities
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);
}

async function getRecentPayments() {
  const payments = await Payment.find()
    .sort({
      createdAt: -1,
    })
    .limit(5)
    .populate("client", "name")
    .populate("lead", "fullName")
    .populate("property", "title")
    .select(
      "expectedAmount paidAmount paymentStatus paymentMethod transactionReference createdAt",
    );

  return payments.map((payment) => ({
    type: "payment",
    title: "Payment activity",
    description:
      payment.client?.name ||
      payment.lead?.fullName ||
      payment.property?.title ||
      "Payment",
    date: payment.createdAt,
  }));
}

async function getRecentAuditLogs() {
  return AuditLog.find({})
    .populate("user", "name email role")
    .sort({
      createdAt: -1,
    })
    .limit(5)
    .lean();
}

async function getAdminAlerts() {
  const alertSince = new Date();

  alertSince.setHours(alertSince.getHours() - 24);

  const [
    failedLoginAttempts,
    roleChanges,
    configurationChanges,
    inactiveUsers,
  ] = await Promise.all([
    AuditLog.countDocuments({
      action: {
        $in: ["login_failed", "failed_login", "authentication_failed"],
      },

      createdAt: {
        $gte: alertSince,
      },
    }),

    AuditLog.countDocuments({
      action: "role_changed",

      createdAt: {
        $gte: alertSince,
      },
    }),

    AuditLog.countDocuments({
      module: {
        $in: ["system_configuration", "settings", "configuration"],
      },

      createdAt: {
        $gte: alertSince,
      },
    }),

    User.countDocuments({
      isActive: false,
    }),
  ]);

  const alerts = [];

  if (failedLoginAttempts > 0) {
    alerts.push({
      type: "security",
      priority: "critical",
      title: `${failedLoginAttempts} failed login ${
        failedLoginAttempts === 1 ? "attempt" : "attempts"
      } detected`,
      description: "Review recent authentication activity.",
      count: failedLoginAttempts,
      href: "/admin/audit-logs",
    });
  }

  if (roleChanges > 0) {
    alerts.push({
      type: "users",
      priority: "high",
      title: `${roleChanges} user ${
        roleChanges === 1 ? "role change" : "role changes"
      } detected`,
      description: "Review recent user role modifications.",
      count: roleChanges,
      href: "/admin/audit-logs",
    });
  }

  if (configurationChanges > 0) {
    alerts.push({
      type: "configuration",
      priority: "medium",
      title: `${configurationChanges} configuration ${
        configurationChanges === 1 ? "change" : "changes"
      } detected`,
      description: "Review recent system configuration activity.",
      count: configurationChanges,
      href: "/admin/settings",
    });
  }

  if (inactiveUsers > 0) {
    alerts.push({
      type: "users",
      priority: "info",
      title: `${inactiveUsers} inactive ${
        inactiveUsers === 1 ? "user account" : "user accounts"
      }`,
      description: "Review deactivated accounts.",
      count: inactiveUsers,
      href: "/admin/users",
    });
  }

  return alerts;
}

export async function GET() {
  try {
    const adminCheck = await checkAdmin();

    if (!adminCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          message: adminCheck.message,
        },
        {
          status: adminCheck.status,
        },
      );
    }

    await dbConnect();

    const [overview, sales, leads, activities, payments, auditLogs, alerts] =
      await Promise.all([
        getOverview(),
        getSalesChart(),
        getLeadChart(),
        getRecentActivities(),
        getRecentPayments(),
        getRecentAuditLogs(),
        getAdminAlerts(),
      ]);

    const combinedActivities = [...activities, ...payments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    return NextResponse.json({
      success: true,

      data: {
        overview,

        sales,

        leads,

        activities: combinedActivities,

        auditLogs,

        alerts,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load admin dashboard.",
      },
      {
        status: 500,
      },
    );
  }
}
