import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";

import Property from "@/models/Property";
import Lead from "@/models/Lead";
import Payment from "@/models/Payment";
import Contract from "@/models/Contract";

export async function GET() {
  try {
    await connectDB();

    /*
     * Fetch the current CRM data in parallel.
     *
     * The Manager Dashboard is a business snapshot,
     * so we are not applying the Analytics date filters here.
     */
    const [properties, leads, contracts, payments] = await Promise.all([
      Property.find().lean(),

      Lead.find().populate("interestedProperty", "title propertyType").lean(),

      Contract.find().populate("property", "title propertyType").lean(),

      Payment.find().populate("contract", "salePrice").lean(),
    ]);

    const data = {
      kpis: buildKpis({
        properties,
        leads,
        contracts,
        payments,
      }),

      sales: buildSalesAnalytics(contracts),

      leads: buildLeadAnalytics(leads),

      properties: buildPropertyAnalytics(properties),

      payments: buildPaymentAnalytics(payments, contracts),

      needsAttention: buildNeedsAttention({
        leads,
        contracts,
        payments,
      }),
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Manager Dashboard API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to load manager dashboard.",
      },
      { status: 500 },
    );
  }
}

/* =====================================================
   KPI
===================================================== */

function buildKpis({
  properties = [],
  leads = [],
  contracts = [],
  payments = [],
}) {
  const signedOrCompletedContracts = contracts.filter(
    (contract) =>
      contract.status === "signed" || contract.status === "completed",
  );

  const totalSales = signedOrCompletedContracts.length;

  const revenue = signedOrCompletedContracts.reduce(
    (total, contract) => total + (Number(contract.salePrice) || 0),
    0,
  );

  const downPaymentsCollected = signedOrCompletedContracts.reduce(
    (total, contract) => total + (Number(contract.downPayment) || 0),
    0,
  );

  const installmentPaymentsCollected = payments.reduce(
    (total, payment) => total + (Number(payment.paidAmount) || 0),
    0,
  );

  const paymentsCollected =
    downPaymentsCollected + installmentPaymentsCollected;

  return [
    {
      id: "properties",
      label: "Properties",
      value: properties.length,
      change: null,
    },

    {
      id: "leads",
      label: "Leads",
      value: leads.length,
      change: null,
    },

    {
      id: "sales",
      label: "Sales",
      value: totalSales,
      change: null,
    },

    {
      id: "revenue",
      label: "Revenue",
      value: revenue,
      change: null,
    },

    {
      id: "payments",
      label: "Payments Collected",
      value: paymentsCollected,
      change: null,
    },
  ];
}

/* =====================================================
   SALES
===================================================== */

function buildSalesAnalytics(contracts) {
  const signedContracts = contracts.filter(
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

    overTime: buildSalesOverTime(signedContracts),
  };
}

function buildSalesOverTime(contracts) {
  const buckets = {};

  contracts.forEach((contract) => {
    const date = new Date(contract.createdAt);

    const key = date.toISOString().split("T")[0];

    buckets[key] = (buckets[key] || 0) + 1;
  });

  const labels = Object.keys(buckets).sort();

  return {
    labels,
    values: labels.map((label) => buckets[label]),
  };
}

/* =====================================================
   LEADS
===================================================== */

function buildLeadAnalytics(leads) {
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

  const totalLeads = leads.length;

  const wonLeads = leads.filter((lead) => lead.status === "won").length;

  const conversionRate =
    totalLeads > 0 ? Number(((wonLeads / totalLeads) * 100).toFixed(1)) : 0;

  return {
    total: totalLeads,

    statusCounts,

    sourceCounts,

    conversion: {
      total: totalLeads,
      won: wonLeads,
      rate: conversionRate,
    },
  };
}

/* =====================================================
   PROPERTIES
===================================================== */

function buildPropertyAnalytics(properties) {
  const statusCounts = {
    available: 0,
    reserved: 0,
    sold: 0,
    rented: 0,
    pending: 0,
  };

  const typeCounts = {};

  properties.forEach((property) => {
    if (statusCounts[property.status] !== undefined) {
      statusCounts[property.status]++;
    }

    const type = property.propertyType || "unknown";

    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  return {
    total: properties.length,

    statusCounts,

    typeCounts,
  };
}

/* =====================================================
   PAYMENTS
===================================================== */

function buildPaymentAnalytics(payments, contracts) {
  const statusCounts = {
    pending: 0,
    pending_verification: 0,
    paid: 0,
    rejected: 0,
    review_required: 0,
    overdue: 0,
  };

  const now = new Date();

  payments.forEach((payment) => {
    const status = payment.paymentStatus;

    /*
     * Keep the same overdue logic
     * already proven in Analytics.
     */
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

  const soldContracts = contracts.filter(
    (contract) =>
      contract.status === "signed" || contract.status === "completed",
  );

  const downPaymentsCollected = soldContracts.reduce(
    (total, contract) => total + (Number(contract.downPayment) || 0),
    0,
  );

  const installmentPaymentsCollected = payments.reduce(
    (total, payment) => total + (Number(payment.paidAmount) || 0),
    0,
  );

  const totalCollected = downPaymentsCollected + installmentPaymentsCollected;

  return {
    statusCounts,

    totalCollected,
  };
}

/* =====================================================
   NEEDS ATTENTION
===================================================== */

function buildNeedsAttention({ leads, contracts, payments }) {
  const now = new Date();

  const uncontactedLeads = leads.filter((lead) => lead.status === "new").length;

  const pendingContracts = contracts.filter(
    (contract) => contract.status === "pending",
  ).length;

  const overduePayments = payments.filter((payment) => {
    const status = payment.paymentStatus;

    return (
      status !== "paid" &&
      status !== "rejected" &&
      payment.dueDate &&
      new Date(payment.dueDate) < now
    );
  }).length;

  const pendingVerification = payments.filter(
    (payment) => payment.paymentStatus === "pending_verification",
  ).length;

  return {
    uncontactedLeads,

    pendingContracts,

    overduePayments,

    pendingVerification,
  };
}
