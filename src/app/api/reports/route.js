import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

import Property from "@/models/Property";
import Lead from "@/models/Lead";
import User from "@/models/User";
import Payment from "@/models/Payment";
import Contract from "@/models/Contract";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const reportType = searchParams.get("type") || "sales";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Start date and end date are required.",
        },
        { status: 400 },
      );
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      return NextResponse.json(
        {
          success: false,
          message: "Start date cannot be after end date.",
        },
        { status: 400 },
      );
    }

    switch (reportType) {
      case "overview":
        return await generateOverviewReport(start, end);
      case "properties":
        return await generatePropertyReport(start, end);

      case "leads":
        return await generateLeadReport(start, end);

      case "agent-performance":
        return await generateAgentPerformanceReport(start, end);

      case "sales":
        return await generateSalesReport(start, end);

      case "payments":
        return await generatePaymentReport(start, end);

      default:
        return NextResponse.json(
          {
            success: false,
            message: "Invalid report type.",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Reports API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}

/* ================================
   PROPERTY REPORT
================================ */

async function generatePropertyReport(start, end) {
  const properties = await Property.find({
    createdAt: {
      $gte: start,
      $lte: end,
    },
  }).sort({ createdAt: -1 });

  const available = properties.filter(
    (property) => property.status === "available",
  ).length;

  const sold = properties.filter(
    (property) => property.status === "sold",
  ).length;

  const rented = properties.filter(
    (property) => property.status === "rented",
  ).length;

  return NextResponse.json({
    success: true,

    data: {
      reportType: "properties",

      summary: [
        {
          id: "total",
          label: "Total Properties",
          value: properties.length,
          description: "Added during selected period",
        },
        {
          id: "available",
          label: "Available",
          value: available,
          description: "Currently available",
        },
        {
          id: "sold",
          label: "Sold",
          value: sold,
          description: "Sold properties",
        },
        {
          id: "rented",
          label: "Rented",
          value: rented,
          description: "Rented properties",
        },
      ],

      columns: [
        {
          key: "title",
          label: "Property",
        },
        {
          key: "propertyType",
          label: "Type",
        },
        {
          key: "price",
          label: "Price",
          render: (property) =>
            `${property.price?.toLocaleString() || 0} ${
              property.currency || ""
            }`,
        },
        {
          key: "status",
          label: "Status",
        },
        {
          key: "createdAt",
          label: "Created",
          render: (property) =>
            new Date(property.createdAt).toLocaleDateString(),
        },
      ],

      rows: properties,

      chart: {
        type: "doughnut",
        title: "Property Status",
        data: {
          labels: ["Available", "Sold", "Rented"],

          datasets: [
            {
              label: "Properties",
              data: [available, sold, rented],
            },
          ],
        },
      },
    },
  });
}

/* ================================
   LEAD REPORT
================================ */

async function generateLeadReport(start, end) {
  const leads = await Lead.find({
    createdAt: {
      $gte: start,
      $lte: end,
    },
  })
    .populate("interestedProperty", "title propertyType")
    .populate("client", "name email")
    .sort({ createdAt: -1 });

  const totalLeads = leads.length;

  const newLeads = leads.filter((lead) => lead.status === "new").length;

  const contacted = leads.filter((lead) => lead.status === "contacted").length;
  const qualifiedLeads = await Lead.find({
    activities: {
      $elemMatch: {
        type: "status_change",
        newValue: "qualified",
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
  });

  const wonLeads = await Lead.find({
    activities: {
      $elemMatch: {
        type: "status_change",
        newValue: "won",
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
  });

  const negotiationLeads = await Lead.find({
    activities: {
      $elemMatch: {
        type: "status_change",
        newValue: "negotiation",
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
  });

  const lostLeads = await Lead.find({
    activities: {
      $elemMatch: {
        type: "status_change",
        newValue: "lost",
        createdAt: {
          $gte: start,
          $lte: end,
        },
      },
    },
  });

  const qualified = qualifiedLeads.length;
  const won = wonLeads.length;
  const negotiation = negotiationLeads.length;
  const lost = lostLeads.length;

  const conversionRate =
    totalLeads > 0 ? ((won / totalLeads) * 100).toFixed(1) : "0.0";

  const averageLeadScore =
    totalLeads > 0
      ? (
          leads.reduce(
            (total, lead) => total + (Number(lead.leadScore) || 0),
            0,
          ) / totalLeads
        ).toFixed(1)
      : "0.0";

  const sourceCounts = {
    website: 0,
    facebook: 0,
    client_registration: 0,
    phone_call: 0,
    office_visit: 0,
    referral: 0,
  };

  leads.forEach((lead) => {
    if (sourceCounts[lead.source] !== undefined) {
      sourceCounts[lead.source]++;
    }
  });

  const rows = leads.map((lead) => ({
    ...lead.toObject(),

    interestedProperty: lead.interestedProperty,
    client: lead.client,
    leadScore: Number(lead.leadScore) || 0,
  }));

  return NextResponse.json(
    {
      success: true,

      data: {
        reportType: "leads",

        summary: [
          {
            id: "totalLeads",
            label: "Total Leads",
            value: totalLeads,
            description: "Leads created during selected period",
          },

          {
            id: "qualifiedLeads",
            label: "Qualified Leads",
            value: qualified,
            description: "Leads currently qualified",
          },

          {
            id: "wonLeads",
            label: "Won Leads",
            value: won,
            description: "Successfully converted leads",
          },

          {
            id: "conversionRate",
            label: "Conversion Rate",
            value: `${conversionRate}%`,
            description: "Won leads compared with total leads",
          },

          {
            id: "averageScore",
            label: "Average Lead Score",
            value: averageLeadScore,
            description: "Average score of leads",
          },
        ],

        statusSummary: {
          new: newLeads,
          contacted,
          qualified,
          negotiation,
          won,
          lost,
        },

        sourceSummary: sourceCounts,

        columns: [
          {
            key: "fullName",
            label: "Lead",
          },

          {
            key: "email",
            label: "Email",
          },

          {
            key: "phone",
            label: "Phone",
          },

          {
            key: "source",
            label: "Source",
          },

          {
            key: "interestedProperty",
            label: "Property",
          },

          {
            key: "leadScore",
            label: "Score",
          },

          {
            key: "status",
            label: "Status",
          },

          {
            key: "createdAt",
            label: "Date",
          },
        ],

        rows,

        chart: {
          type: "doughnut",

          title: "Leads by Status",

          data: {
            labels: [
              "New",
              "Contacted",
              "Qualified",
              "Negotiation",
              "Won",
              "Lost",
            ],

            datasets: [
              {
                label: "Leads",

                data: [newLeads, contacted, qualified, negotiation, won, lost],
              },
            ],
          },
        },

        sourceChart: {
          type: "bar",

          title: "Leads by Source",

          data: {
            labels: [
              "Website",
              "Facebook",
              "Client Registration",
              "Phone Call",
              "Office Visit",
              "Referral",
            ],

            datasets: [
              {
                label: "Leads",

                data: [
                  sourceCounts.website,
                  sourceCounts.facebook,
                  sourceCounts.client_registration,
                  sourceCounts.phone_call,
                  sourceCounts.office_visit,
                  sourceCounts.referral,
                ],
              },
            ],
          },
        },
      },
    },
    { status: 200 },
  );
}

/* ================================
   AGENT PERFORMANCE REPORT
================================ */

async function generateAgentPerformanceReport(start, end) {
  const agents = await User.find({
    role: "agent",
  }).select("name email phone");

  // ==========================================
  // ALL ASSIGNED PROPERTIES
  // ==========================================

  const properties = await Property.find({
    assignedAgent: {
      $ne: null,
    },
  }).select("assignedAgent");

  // ==========================================
  // SALES DURING SELECTED PERIOD
  // ==========================================

  const contracts = await Contract.find({
    createdAt: {
      $gte: start,
      $lte: end,
    },

    status: {
      $in: ["signed", "completed"],
    },
  }).populate({
    path: "property",
    select: "assignedAgent",
  });

  // ==========================================
  // CALCULATE AGENT PERFORMANCE
  // ==========================================

  const performance = agents.map((agent) => {
    // ------------------------------------------
    // Assigned properties
    // ------------------------------------------

    const agentProperties = properties.filter(
      (property) => property.assignedAgent?.toString() === agent._id.toString(),
    );

    const assignedProperties = agentProperties.length;

    // ------------------------------------------
    // Sales in selected period
    // ------------------------------------------

    const agentSales = contracts.filter(
      (contract) =>
        contract.property?.assignedAgent?.toString() === agent._id.toString(),
    );

    const soldProperties = agentSales.length;

    // ------------------------------------------
    // Revenue in selected period
    // ------------------------------------------

    const revenue = agentSales.reduce(
      (total, contract) => total + (Number(contract.salePrice) || 0),
      0,
    );

    return {
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone || "-",

      assignedProperties,

      soldProperties,

      revenue,
    };
  });

  // ==========================================
  // RESPONSE
  // ==========================================

  return NextResponse.json({
    success: true,

    data: {
      reportType: "agent-performance",

      summary: [
        {
          id: "agents",
          label: "Total Agents",
          value: agents.length,
          description: "Registered agents",
        },

        {
          id: "assigned",
          label: "Assigned Properties",
          value: performance.reduce(
            (total, agent) => total + agent.assignedProperties,
            0,
          ),
          description: "Properties assigned to agents",
        },

        {
          id: "sold",
          label: "Properties Sold",
          value: performance.reduce(
            (total, agent) => total + agent.soldProperties,
            0,
          ),
          description: "Properties sold during selected period",
        },

        {
          id: "revenue",
          label: "Total Revenue",
          value: `${performance
            .reduce((total, agent) => total + agent.revenue, 0)
            .toLocaleString()} ETB`,
          description: "Revenue generated during selected period",
        },
      ],

      columns: [
        {
          key: "name",
          label: "Agent",
        },

        {
          key: "email",
          label: "Email",
        },

        {
          key: "assignedProperties",
          label: "Assigned Properties",
        },

        {
          key: "soldProperties",
          label: "Sold",
        },

        {
          key: "revenue",
          label: "Revenue",
          render: (agent) => `${agent.revenue.toLocaleString()} ETB`,
        },
      ],

      rows: performance,

      chart: {
        type: "bar",

        title: "Agent Performance",

        data: {
          labels: performance.map((agent) => agent.name),

          datasets: [
            {
              label: "Properties Sold",
              data: performance.map((agent) => agent.soldProperties),
            },
          ],
        },
      },
    },
  });
}
/* ================================
   SALES REPORT
================================ */

async function generateSalesReport(start, end) {
  const contracts = await Contract.find({
    createdAt: {
      $gte: start,
      $lte: end,
    },
  })
    .populate("client", "name email")
    .populate("lead", "fullName email phone status")
    .populate("property", "title propertyType")
    .populate("manager", "name email")
    .sort({ createdAt: -1 });

  const totalSales = contracts.length;

  const totalSalesValue = contracts.reduce(
    (total, contract) => total + (Number(contract.salePrice) || 0),
    0,
  );

  const downPayments = contracts.reduce(
    (total, contract) => total + (Number(contract.downPayment) || 0),
    0,
  );

  const remainingBalance = contracts.reduce(
    (total, contract) => total + (Number(contract.remainingBalance) || 0),
    0,
  );

  const completed = contracts.filter(
    (contract) => contract.status === "completed",
  ).length;

  const signed = contracts.filter(
    (contract) => contract.status === "signed",
  ).length;

  const pending = contracts.filter(
    (contract) => contract.status === "pending_signature",
  ).length;

  const cancelled = contracts.filter(
    (contract) => contract.status === "cancelled",
  ).length;

  const statusData = {
    completed,
    signed,
    pending,
    cancelled,
  };

  const rows = contracts.map((contract) => ({
    ...contract.toObject(),

    client: contract.client?.name || contract.lead?.fullName || "-",
    property: contract.property,
    manager: contract.manager,

    salePrice: Number(contract.salePrice) || 0,

    downPayment: Number(contract.downPayment) || 0,

    remainingBalance: Number(contract.remainingBalance) || 0,
  }));

  return NextResponse.json({
    success: true,

    data: {
      reportType: "sales",

      summary: [
        {
          id: "totalSales",
          label: "Total Sales",
          value: totalSales,
          description: "Contracts created during selected period",
        },

        {
          id: "salesValue",
          label: "Sales Value",
          value: `${totalSalesValue.toLocaleString()} ETB`,
          description: "Total contract sale value",
        },

        {
          id: "downPayments",
          label: "Down Payments",
          value: `${downPayments.toLocaleString()} ETB`,
          description: "Total down payments",
        },

        {
          id: "remaining",
          label: "Remaining Balance",
          value: `${remainingBalance.toLocaleString()} ETB`,
          description: "Total remaining balance",
        },
      ],

      statusSummary: statusData,

      columns: [
        {
          key: "contractNumber",
          label: "Contract",
        },

        {
          key: "client",
          label: "Client",
        },

        {
          key: "property",
          label: "Property",
        },

        {
          key: "salePrice",
          label: "Sale Price",
        },

        {
          key: "downPayment",
          label: "Down Payment",
        },

        {
          key: "remainingBalance",
          label: "Remaining",
        },

        {
          key: "status",
          label: "Status",
        },

        {
          key: "createdAt",
          label: "Sale Date",
        },
      ],

      rows,

      chart: {
        type: "doughnut",

        title: "Sales by Contract Status",

        data: {
          labels: ["Completed", "Signed", "Pending", "Cancelled"],

          datasets: [
            {
              label: "Contracts",

              data: [completed, signed, pending, cancelled],
            },
          ],
        },
      },
    },
  });
}

/* ================================
   PAYMENT REPORT
================================ */

async function generatePaymentReport(start, end) {
  const payments = await Payment.find({
    dueDate: {
      $gte: start,
      $lte: end,
    },
  })
    .populate("client", "name email")
    .populate("property", "title")
    .sort({ createdAt: -1 });

  const totalPayments = payments.length;

  const expectedAmount = payments.reduce(
    (total, payment) => total + (Number(payment.expectedAmount) || 0),
    0,
  );

  const paidAmount = payments.reduce(
    (total, payment) => total + (Number(payment.paidAmount) || 0),
    0,
  );

  const outstandingAmount = expectedAmount - paidAmount;

  const paid = payments.filter(
    (payment) => payment.paymentStatus === "paid",
  ).length;

  const pending = payments.filter(
    (payment) =>
      payment.paymentStatus === "pending" ||
      payment.paymentStatus === "pending_verification",
  ).length;

  const now = new Date();

  const overduePayments = payments.filter((payment) => {
    const dueDate = new Date(payment.dueDate);

    return (
      dueDate.getTime() < now.getTime() &&
      payment.paymentStatus !== "paid" &&
      payment.paymentStatus !== "rejected"
    );
  });

  const overdue = overduePayments.length;

  const rejected = payments.filter(
    (payment) => payment.paymentStatus === "rejected",
  ).length;

  return NextResponse.json({
    success: true,

    data: {
      reportType: "payments",

      summary: [
        {
          id: "total",
          label: "Total Payments",
          value: totalPayments,
          description: "Payments during selected period",
        },

        {
          id: "expected",
          label: "Expected Amount",
          value: `${expectedAmount.toLocaleString()} ETB`,
          description: "Total expected payment amount",
        },

        {
          id: "paid",
          label: "Paid Amount",
          value: `${paidAmount.toLocaleString()} ETB`,
          description: "Total amount received",
        },

        {
          id: "outstanding",
          label: "Outstanding",
          value: `${outstandingAmount.toLocaleString()} ETB`,
          description: "Remaining payment amount",
        },
      ],

      columns: [
        {
          key: "client",
          label: "Client",
          render: (payment) => payment.client?.name || "-",
        },

        {
          key: "property",
          label: "Property",
          render: (payment) => payment.property?.title || "-",
        },

        {
          key: "installmentNumber",
          label: "Installment",
        },

        {
          key: "expectedAmount",
          label: "Expected",
          render: (payment) =>
            `${(Number(payment.expectedAmount) || 0).toLocaleString()} ETB`,
        },

        {
          key: "paidAmount",
          label: "Paid",
          render: (payment) =>
            `${(Number(payment.paidAmount) || 0).toLocaleString()} ETB`,
        },

        {
          key: "paymentStatus",
          label: "Status",
        },

        {
          key: "dueDate",
          label: "Due Date",
          render: (payment) => new Date(payment.dueDate).toLocaleDateString(),
        },
      ],

      rows: payments.map((payment) => {
        const dueDate = new Date(payment.dueDate);
        const now = new Date();

        const isOverdue =
          dueDate.getTime() < now.getTime() &&
          payment.paymentStatus !== "paid" &&
          payment.paymentStatus !== "rejected";

        return {
          ...payment.toObject(),

          client: payment.client,
          property: payment.property,

          paymentStatus: isOverdue ? "overdue" : payment.paymentStatus,
        };
      }),

      chart: {
        type: "doughnut",

        title: "Payment Status",

        data: {
          labels: ["Paid", "Pending", "Overdue", "Rejected"],

          datasets: [
            {
              label: "Payments",

              data: [paid, pending, overdue, rejected],
            },
          ],
        },
      },
    },
  });
}
async function generateOverviewReport(start, end) {
  const [properties, leads, contracts, payments, agents] = await Promise.all([
    Property.countDocuments({
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }),

    Lead.countDocuments({
      createdAt: {
        $gte: start,
        $lte: end,
      },
    }),

    Contract.countDocuments({
      createdAt: {
        $gte: start,
        $lte: end,
      },
      status: {
        $in: ["signed", "completed"],
      },
    }),

    Payment.countDocuments({
      createdAt: {
        $gte: start,
        $lte: end,
      },
      paymentStatus: "paid",
    }),

    User.countDocuments({
      role: "agent",
      updatedAt: {
        $gte: start,
        $lte: end,
      },
    }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: {
        reportType: "overview",

        summary: {
          properties,
          leads,
          sales: contracts,
          payments,
          agents,
        },
      },
    },
    { status: 200 },
  );
}
