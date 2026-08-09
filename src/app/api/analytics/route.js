import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

import Property from "@/models/Property";
import Lead from "@/models/Lead";
import Payment from "@/models/Payment";
import Contract from "@/models/Contract";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const period = searchParams.get("period") || "30-days";

    const comparison = searchParams.get("comparison") || "previous";

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const { start, end } = getDateRange(period, startDate, endDate);

    const currentData = await getAnalyticsData(start, end);

    let comparisonData = null;

    if (comparison === "previous") {
      const previousRange = getPreviousDateRange(start, end);

      comparisonData = await getAnalyticsData(
        previousRange.start,
        previousRange.end,
      );
    }

    const kpis = buildKpis(currentData, comparisonData);

    return NextResponse.json({
      success: true,

      data: {
        period,
        comparison,

        startDate: start.toISOString(),
        endDate: end.toISOString(),

        kpis,

        leads: buildLeadAnalytics(currentData, period, start, end),

        sales: buildSalesAnalytics(currentData, period, start, end),

        properties: buildPropertyAnalytics(currentData),

        payments: buildPaymentAnalytics(currentData, period, start, end),
      },
    });
  } catch (error) {
    console.error("Analytics API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load analytics.",
      },
      { status: 500 },
    );
  }
}

/* =====================================================
   DATE RANGE
===================================================== */

function getDateRange(period, startDate, endDate) {
  const now = new Date();

  let start;
  let end = new Date(now);

  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "today":
      start = new Date(now);

      start.setHours(0, 0, 0, 0);

      break;

    case "7-days":
      start = new Date(now);

      start.setDate(start.getDate() - 6);

      start.setHours(0, 0, 0, 0);

      break;

    case "30-days":
      start = new Date(now);

      start.setDate(start.getDate() - 29);

      start.setHours(0, 0, 0, 0);

      break;

    case "12-months":
      start = new Date(now);

      start.setMonth(start.getMonth() - 11);

      start.setDate(1);

      start.setHours(0, 0, 0, 0);

      break;

    case "custom":
      if (!startDate || !endDate) {
        throw new Error(
          "Start date and end date are required for custom analytics.",
        );
      }

      start = new Date(startDate);

      end = new Date(endDate);

      start.setHours(0, 0, 0, 0);

      end.setHours(23, 59, 59, 999);

      break;

    default:
      start = new Date(now);

      start.setDate(start.getDate() - 29);

      start.setHours(0, 0, 0, 0);
  }

  if (start > end) {
    throw new Error("Start date cannot be after end date.");
  }

  return {
    start,
    end,
  };
}

/* =====================================================
   PREVIOUS PERIOD
===================================================== */

function getPreviousDateRange(start, end) {
  const duration = end.getTime() - start.getTime();

  const previousEnd = new Date(start.getTime() - 1);

  const previousStart = new Date(previousEnd.getTime() - duration);

  previousStart.setHours(0, 0, 0, 0);

  previousEnd.setHours(23, 59, 59, 999);

  return {
    start: previousStart,
    end: previousEnd,
  };
}

/* =====================================================
   GET CRM DATA
===================================================== */

async function getAnalyticsData(start, end) {
  const dateFilter = {
    createdAt: {
      $gte: start,
      $lte: end,
    },
  };

  const [properties, leads, contracts, payments] = await Promise.all([
    Property.find(dateFilter).lean(),

    Lead.find(dateFilter)
      .populate("interestedProperty", "title propertyType")
      .lean(),

    Contract.find(dateFilter).lean(),

    Payment.find(dateFilter).lean(),
  ]);

  return {
    properties,
    leads,
    contracts,
    payments,
  };
}

/* =====================================================
   KPI
===================================================== */

function buildKpis(current, previous) {
  const currentValues = {
    leads: current.leads.length,

    sales: current.contracts.filter(
      (contract) =>
        contract.status === "signed" || contract.status === "completed",
    ).length,

    revenue: current.contracts.reduce(
      (total, contract) => total + (Number(contract.salePrice) || 0),
      0,
    ),

    properties: current.properties.length,

    payments: current.payments.reduce(
      (total, payment) => total + (Number(payment.paidAmount) || 0),
      0,
    ),
  };

  const previousValues = previous
    ? {
        leads: previous.leads.length,

        sales: previous.contracts.filter(
          (contract) =>
            contract.status === "signed" || contract.status === "completed",
        ).length,

        revenue: previous.contracts.reduce(
          (total, contract) => total + (Number(contract.salePrice) || 0),
          0,
        ),

        properties: previous.properties.length,

        payments: previous.payments.reduce(
          (total, payment) => total + (Number(payment.paidAmount) || 0),
          0,
        ),
      }
    : null;

  return [
    createKpi(
      "leads",
      "Total Leads",
      currentValues.leads,
      previousValues?.leads,
      "Leads created during selected period",
    ),

    createKpi(
      "sales",
      "Total Sales",
      currentValues.sales,
      previousValues?.sales,
      "Completed or signed contracts",
    ),

    createKpi(
      "revenue",
      "Revenue",
      currentValues.revenue,
      previousValues?.revenue,
      "Total contract value",
    ),

    createKpi(
      "properties",
      "Properties",
      currentValues.properties,
      previousValues?.properties,
      "Properties added during selected period",
    ),

    createKpi(
      "payments",
      "Payments Collected",
      currentValues.payments,
      previousValues?.payments,
      "Payments received during selected period",
    ),
  ];
}

function createKpi(id, label, value, previousValue, description) {
  let change = null;

  if (previousValue !== undefined && previousValue !== null) {
    if (previousValue === 0) {
      change = value > 0 ? 100 : 0;
    } else {
      change = Number(
        (((value - previousValue) / previousValue) * 100).toFixed(1),
      );
    }
  }

  return {
    id,
    label,
    value,
    change,
    description,
  };
}

/* =====================================================
   LEAD ANALYTICS
===================================================== */

function buildLeadAnalytics(data, period, start, end) {
  const sourceCounts = {};

  const statusCounts = {
    new: 0,
    contacted: 0,
    qualified: 0,
    negotiation: 0,
    won: 0,
    lost: 0,
  };

  data.leads.forEach((lead) => {
    if (lead.source) {
      sourceCounts[lead.source] = (sourceCounts[lead.source] || 0) + 1;
    }

    if (statusCounts[lead.status] !== undefined) {
      statusCounts[lead.status]++;
    }
  });

  const totalLeads = data.leads.length;

  const wonLeads = data.leads.filter((lead) => lead.status === "won").length;

  const conversionRate =
    totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;

  return {
    total: totalLeads,

    sourceCounts,

    statusCounts,

    conversion: {
      total: totalLeads,
      won: wonLeads,
      rate: conversionRate,
    },

    overTime: buildLeadOverTime(data.leads, period, start, end),
  };
}

function buildLeadOverTime(leads, period, start, end) {
  const buckets = {};

  const useHourly = period === "today";
  const useMonthly = period === "12-months";

  leads.forEach((lead) => {
    const date = new Date(lead.createdAt);

    let key;

    if (useHourly) {
      key = `${date.getHours().toString().padStart(2, "0")}:00`;
    } else if (useMonthly) {
      key = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
    } else {
      key = date.toISOString().split("T")[0];
    }

    buckets[key] = (buckets[key] || 0) + 1;
  });

  const labels = [];
  const values = [];

  const current = new Date(start);

  if (useHourly) {
    current.setMinutes(0, 0, 0);

    while (current <= end) {
      const key = `${current.getHours().toString().padStart(2, "0")}:00`;

      labels.push(key);
      values.push(buckets[key] || 0);

      current.setHours(current.getHours() + 1);
    }
  } else if (useMonthly) {
    current.setDate(1);

    while (current <= end) {
      const key = `${current.getFullYear()}-${(current.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      labels.push(key);
      values.push(buckets[key] || 0);

      current.setMonth(current.getMonth() + 1);
    }
  } else {
    while (current <= end) {
      const key = current.toISOString().split("T")[0];

      labels.push(key);
      values.push(buckets[key] || 0);

      current.setDate(current.getDate() + 1);
    }
  }

  return {
    labels,
    values,
  };
}

/* =====================================================
   SALES ANALYTICS
===================================================== */

function buildSalesAnalytics(data, period, start, end) {
  const signedContracts = data.contracts.filter(
    (contract) =>
      contract.status === "signed" || contract.status === "completed",
  );

  const revenue = signedContracts.reduce(
    (total, contract) => total + (Number(contract.salePrice) || 0),
    0,
  );

  return {
    totalSales: signedContracts.length,

    revenue,

    overTime: buildSalesOverTime(signedContracts, period, start, end),
  };
}
function buildSalesOverTime(contracts, period, start, end) {
  const salesBuckets = {};
  const valueBuckets = {};

  const useHourly = period === "today";

  const useMonthly = period === "12-months";

  contracts.forEach((contract) => {
    const date = new Date(contract.createdAt);

    const value = Number(contract.salePrice) || 0;

    let key;

    if (useHourly) {
      key = `${date.getHours().toString().padStart(2, "0")}:00`;
    } else if (useMonthly) {
      key = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
    } else {
      key = date.toISOString().split("T")[0];
    }

    salesBuckets[key] = (salesBuckets[key] || 0) + 1;

    valueBuckets[key] = (valueBuckets[key] || 0) + value;
  });

  const labels = [];
  const salesValues = [];
  const valueValues = [];

  const current = new Date(start);

  function addBucket(key) {
    labels.push(key);

    salesValues.push(salesBuckets[key] || 0);

    valueValues.push(valueBuckets[key] || 0);
  }

  if (useHourly) {
    current.setMinutes(0, 0, 0);

    while (current <= end) {
      const key = `${current.getHours().toString().padStart(2, "0")}:00`;

      addBucket(key);

      current.setHours(current.getHours() + 1);
    }
  } else if (useMonthly) {
    current.setDate(1);

    while (current <= end) {
      const key = `${current.getFullYear()}-${(current.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      addBucket(key);

      current.setMonth(current.getMonth() + 1);
    }
  } else {
    while (current <= end) {
      const key = current.toISOString().split("T")[0];

      addBucket(key);

      current.setDate(current.getDate() + 1);
    }
  }

  return {
    labels,

    sales: salesValues,

    value: valueValues,
  };
}

/* =====================================================
   PROPERTY ANALYTICS
===================================================== */

function buildPropertyAnalytics(data) {
  const typeCounts = {};

  const statusCounts = {
    available: 0,
    sold: 0,
    reserved: 0,
    rented: 0,
    pending: 0,
  };

  data.properties.forEach((property) => {
    const type = property.propertyType || "Unknown";

    typeCounts[type] = (typeCounts[type] || 0) + 1;

    if (statusCounts[property.status] !== undefined) {
      statusCounts[property.status]++;
    }
  });

  return {
    total: data.properties.length,
    typeCounts,
    statusCounts,
  };
}

/* =====================================================
   PAYMENT ANALYTICS
===================================================== */

function buildPaymentAnalytics(data, period, start, end) {
  const statusCounts = {
    pending: 0,
    pending_verification: 0,
    paid: 0,
    rejected: 0,
    review_required: 0,
    overdue: 0,
  };

  const now = new Date();

  data.payments.forEach((payment) => {
    const status = payment.paymentStatus;

    const isOverdue =
      status !== "paid" &&
      status !== "rejected" &&
      payment.dueDate &&
      new Date(payment.dueDate) < now;

    if (isOverdue) {
      statusCounts.overdue++;
    } else if (statusCounts[status] !== undefined) {
      statusCounts[status]++;
    }
  });

  const totalCollected = data.payments.reduce(
    (total, payment) => total + (Number(payment.paidAmount) || 0),
    0,
  );

  return {
    statusCounts,
    totalCollected,

    overTime: buildPaymentsOverTime(data.payments, period, start, end),
  };
}

function buildPaymentsOverTime(payments, period, start, end) {
  const buckets = {};

  const useHourly = period === "today";

  const useMonthly = period === "12-months";

  payments.forEach((payment) => {
    const date = new Date(payment.createdAt);

    const amount = Number(payment.paidAmount) || 0;

    let key;

    if (useHourly) {
      key = `${date.getHours().toString().padStart(2, "0")}:00`;
    } else if (useMonthly) {
      key = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
    } else {
      key = date.toISOString().split("T")[0];
    }

    buckets[key] = (buckets[key] || 0) + amount;
  });

  const labels = [];
  const values = [];

  const current = new Date(start);

  function addBucket(key) {
    labels.push(key);
    values.push(buckets[key] || 0);
  }

  if (useHourly) {
    current.setMinutes(0, 0, 0);

    while (current <= end) {
      const key = `${current.getHours().toString().padStart(2, "0")}:00`;

      addBucket(key);

      current.setHours(current.getHours() + 1);
    }
  } else if (useMonthly) {
    current.setDate(1);

    while (current <= end) {
      const key = `${current.getFullYear()}-${(current.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      addBucket(key);

      current.setMonth(current.getMonth() + 1);
    }
  } else {
    while (current <= end) {
      const key = current.toISOString().split("T")[0];

      addBucket(key);

      current.setDate(current.getDate() + 1);
    }
  }

  return {
    labels,
    values,
  };
}

