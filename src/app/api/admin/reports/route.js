import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/mongodb";

import User from "@/models/User";
import Property from "@/models/Property";
import Lead from "@/models/Lead";
import Contract from "@/models/Contract";
import Payment from "@/models/Payment";

async function checkAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
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

function getDateRange(dateRange) {
  const now = new Date();

  let start = null;
  let end = new Date(now);

  end.setHours(23, 59, 59, 999);

  switch (dateRange) {
    case "today": {
      start = new Date(now);

      start.setHours(0, 0, 0, 0);

      break;
    }

    case "week": {
      start = new Date(now);

      const day = start.getDay();

      const difference = day === 0 ? 6 : day - 1;

      start.setDate(start.getDate() - difference);

      start.setHours(0, 0, 0, 0);

      break;
    }

    case "month": {
      start = new Date(now.getFullYear(), now.getMonth(), 1);

      start.setHours(0, 0, 0, 0);

      break;
    }

    case "year": {
      start = new Date(now.getFullYear(), 0, 1);

      start.setHours(0, 0, 0, 0);

      break;
    }

    case "all":
    default:
      start = null;
      break;
  }

  return {
    start,
    end,
  };
}

function buildDateFilter(start, end) {
  if (!start) {
    return {};
  }

  return {
    createdAt: {
      $gte: start,
      $lte: end,
    },
  };
}

async function getOverview(start, end) {
  const dateFilter = buildDateFilter(start, end);

  const [
    totalProperties,
    totalLeads,
    totalClients,
    totalAgents,
    totalSales,
    salesContracts,
  ] = await Promise.all([
    Property.countDocuments(dateFilter),

    Lead.countDocuments(dateFilter),

    User.countDocuments({
      ...dateFilter,
      role: "client",
    }),

    User.countDocuments({
      ...dateFilter,
      role: "agent",
    }),

    Contract.countDocuments({
      ...dateFilter,
      status: {
        $in: ["signed", "completed"],
      },
    }),

    Contract.find({
      ...dateFilter,
      status: {
        $in: ["signed", "completed"],
      },
    }).select("salePrice"),
  ]);

  const totalRevenue = salesContracts.reduce(
    (total, contract) => total + (Number(contract.salePrice) || 0),
    0,
  );

  return {
    totalProperties,
    totalLeads,
    totalClients,
    totalAgents,
    totalSales,
    totalRevenue,
  };
}

async function getSalesReport(start, end) {
  const dateFilter = buildDateFilter(start, end);

  const contracts = await Contract.find(dateFilter)
    .populate("client", "name email")
    .populate("property", "title propertyType")
    .populate("manager", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const signed = contracts.filter(
    (contract) => contract.status === "signed",
  ).length;

  const completed = contracts.filter(
    (contract) => contract.status === "completed",
  ).length;

  const pending = contracts.filter(
    (contract) => contract.status === "pending_signature",
  ).length;

  const cancelled = contracts.filter(
    (contract) => contract.status === "cancelled",
  ).length;

  const salesValue = contracts
    .filter(
      (contract) =>
        contract.status === "signed" || contract.status === "completed",
    )
    .reduce((total, contract) => total + (Number(contract.salePrice) || 0), 0);

  const monthlySales = {};

  contracts
    .filter(
      (contract) =>
        contract.status === "signed" || contract.status === "completed",
    )
    .forEach((contract) => {
      const date = new Date(contract.createdAt);

      const key = date.toLocaleDateString("en-US", {
        month: "short",
      });

      monthlySales[key] = (monthlySales[key] || 0) + 1;
    });

  return {
    total: contracts.filter(
      (contract) =>
        contract.status === "signed" || contract.status === "completed",
    ).length,

    salesValue,

    status: {
      signed,
      completed,
      pending,
      cancelled,
    },

    chart: Object.entries(monthlySales).map(([month, count]) => ({
      month,
      count,
    })),

    rows: contracts.map((contract) => ({
      _id: contract._id,
      date: contract.createdAt,
      report: contract.contractNumber || "Property Sale",
      category: "Sales",
      count: 1,
      value: Number(contract.salePrice) || 0,
    })),
  };
}

async function getPropertyReport(start, end) {
  const dateFilter = buildDateFilter(start, end);

  const properties = await Property.find(dateFilter)
    .select("title propertyType price currency status assignedAgent createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const available = properties.filter(
    (property) => property.status === "available",
  ).length;

  const pending = properties.filter(
    (property) => property.status === "pending",
  ).length;

  const sold = properties.filter(
    (property) => property.status === "sold",
  ).length;

  const rented = properties.filter(
    (property) => property.status === "rented",
  ).length;

  const propertyTypes = {};

  properties.forEach((property) => {
    const type = property.propertyType || "other";

    propertyTypes[type] = (propertyTypes[type] || 0) + 1;
  });

  return {
    total: properties.length,

    status: {
      available,
      pending,
      sold,
      rented,
    },

    types: Object.entries(propertyTypes).map(([type, count]) => ({
      type,
      count,
    })),

    rows: properties.map((property) => ({
      _id: property._id,
      date: property.createdAt,
      report: property.title,
      category: "Properties",
      count: 1,
      value: Number(property.price) || 0,
    })),
  };
}

async function getLeadReport(start, end) {
  const dateFilter = buildDateFilter(start, end);

  const leads = await Lead.find(dateFilter)
    .select(
      "fullName email phone source status leadScore interestedProperty createdAt",
    )
    .populate("interestedProperty", "title")
    .sort({ createdAt: -1 })
    .lean();

  const statusCounts = {
    new: 0,
    contacted: 0,
    qualified: 0,
    negotiation: 0,
    won: 0,
    lost: 0,
  };

  const sourceCounts = {};

  leads.forEach((lead) => {
    if (statusCounts[lead.status] !== undefined) {
      statusCounts[lead.status]++;
    }

    if (lead.source) {
      sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    }
  });

  return {
    total: leads.length,

    status: statusCounts,

    sources: Object.entries(sourceCounts).map(([source, count]) => ({
      source,
      count,
    })),

    rows: leads.map((lead) => ({
      _id: lead._id,
      date: lead.createdAt,
      report: lead.fullName || "Lead",
      category: "Leads",
      count: 1,
      value: Number(lead.leadScore) || 0,
    })),
  };
}

async function getAgentReport(start, end) {
  const agents = await User.find({
    role: "agent",
  })
    .select("name email phone createdAt")
    .lean();

  const propertyFilter = {
    assignedAgent: {
      $ne: null,
    },
  };

  if (start) {
    propertyFilter.createdAt = {
      $gte: start,
      $lte: end,
    };
  }

  const properties = await Property.find(propertyFilter)
    .select("title status price assignedAgent createdAt")
    .lean();

  const performance = agents.map((agent) => {
    const agentProperties = properties.filter(
      (property) => property.assignedAgent?.toString() === agent._id.toString(),
    );

    const assignedProperties = agentProperties.length;

    const soldProperties = agentProperties.filter(
      (property) => property.status === "sold",
    );

    const revenue = soldProperties.reduce(
      (total, property) => total + (Number(property.price) || 0),
      0,
    );

    return {
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      assignedProperties,
      soldProperties: soldProperties.length,
      revenue,
    };
  });

  return {
    total: agents.length,

    performance,

    rows: performance.map((agent) => ({
      _id: agent._id,
      date: new Date(),
      report: agent.name,
      category: "Agents",
      count: agent.assignedProperties,
      value: agent.revenue,
    })),
  };
}

async function getFinancialReport(start, end) {
  const dateFilter = buildDateFilter(start, end);

  const payments = await Payment.find(dateFilter)
    .select(
      "expectedAmount paidAmount paymentStatus property client createdAt dueDate",
    )
    .populate("property", "title currency")
    .populate("client", "name email")
    .sort({ createdAt: -1 })
    .lean();

  const expectedAmount = payments.reduce(
    (total, payment) => total + (Number(payment.expectedAmount) || 0),
    0,
  );

  const paidAmount = payments.reduce(
    (total, payment) => total + (Number(payment.paidAmount) || 0),
    0,
  );

  const pendingAmount = payments
    .filter(
      (payment) =>
        payment.paymentStatus === "pending" ||
        payment.paymentStatus === "overdue" ||
        payment.paymentStatus === "pending_verification" ||
        payment.paymentStatus === "review_required",
    )
    .reduce(
      (total, payment) => total + (Number(payment.expectedAmount) || 0),
      0,
    );

  return {
    totalPayments: payments.length,

    expectedAmount,

    paidAmount,

    pendingAmount,

    rows: payments.map((payment) => ({
      _id: payment._id,
      date: payment.createdAt,
      report: payment.property?.title || "Payment",
      category: "Financial",
      count: 1,
      value: Number(payment.paidAmount) || 0,
    })),
  };
}

function buildReportsTable(
  sales,
  properties,
  leads,
  agents,
  financial,
  reportType,
) {
  const reports = [];

  if (reportType === "all" || reportType === "sales") {
    reports.push(...sales.rows);
  }

  if (reportType === "all" || reportType === "properties") {
    reports.push(...properties.rows);
  }

  if (reportType === "all" || reportType === "leads") {
    reports.push(...leads.rows);
  }

  if (reportType === "all" || reportType === "agents") {
    reports.push(...agents.rows);
  }

  if (reportType === "all" || reportType === "financial") {
    reports.push(...financial.rows);
  }

  return reports.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export async function GET(request) {
  try {
    const adminCheck = await checkAdmin();

    if (!adminCheck.authorized) {
      return adminCheck.response;
    }

    await connectDB();

    const { searchParams } = new URL(request.url);

    const reportType = searchParams.get("reportType") || "all";

    const dateRange = searchParams.get("dateRange") || "all";

    const validReportTypes = [
      "all",
      "sales",
      "properties",
      "leads",
      "agents",
      "financial",
    ];

    const validDateRanges = ["all", "today", "week", "month", "year"];

    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report type.",
        },
        { status: 400 },
      );
    }

    if (!validDateRanges.includes(dateRange)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date range.",
        },
        { status: 400 },
      );
    }

    const { start, end } = getDateRange(dateRange);

    const [overview, sales, properties, leads, agents, financial] =
      await Promise.all([
        getOverview(start, end),
        getSalesReport(start, end),
        getPropertyReport(start, end),
        getLeadReport(start, end),
        getAgentReport(start, end),
        getFinancialReport(start, end),
      ]);

    const reports = buildReportsTable(
      sales,
      properties,
      leads,
      agents,
      financial,
      reportType,
    );

    return NextResponse.json({
      success: true,

      data: {
        reportType,
        dateRange,

        overview,

        sales,

        leads,

        properties,

        agents,

        financial,

        reports,
      },
    });
  } catch (error) {
    console.error("Admin Reports API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load admin reports.",
      },
      { status: 500 },
    );
  }
}
