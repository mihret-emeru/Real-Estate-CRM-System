import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { checkOverduePayment } from "@/utils/checkOverduePayments";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);

    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    /*
     * Get all payment records.
     *
     * Each Payment document represents one installment.
     */
    const payments = await Payment.find()
      .populate("client", "name email phone")
      .populate("lead", "fullName email phone status")
      .populate("contract", "contractNumber status")
      .populate("property", "title")
      .populate("verifiedBy", "name email")
      .sort({ dueDate: 1 });

    /*
     * Update overdue status in memory.
     */
    const updatedPayments = payments.map((payment) => {
      const currentStatus = checkOverduePayment(payment);

      if (currentStatus !== payment.paymentStatus) {
        payment.paymentStatus = currentStatus;
      }

      return payment;
    });

    /*
     * Group installments by contract.
     */
    const contractMap = new Map();

    updatedPayments.forEach((payment) => {
      const contractId = payment.contract?._id?.toString();

      if (!contractId) return;

      if (!contractMap.has(contractId)) {
        contractMap.set(contractId, {
          contractId,
          contractNumber: payment.contract?.contractNumber || "-",
          client: payment.client,
          lead: payment.lead,
          property: payment.property,

          installments: [],
        });
      }

      contractMap.get(contractId).installments.push(payment);
    });

    /*
     * Convert grouped contracts into summary rows.
     */
    let contractSummaries = Array.from(contractMap.values()).map((contract) => {
      const installments = contract.installments;

      const totalInstallments = installments.length;

      const paidInstallments = installments.filter(
        (payment) => payment.paymentStatus === "paid",
      ).length;

      const paidAmount = installments.reduce(
        (total, payment) => total + (Number(payment.paidAmount) || 0),
        0,
      );

      const expectedAmount = installments.reduce(
        (total, payment) => total + (Number(payment.expectedAmount) || 0),
        0,
      );

      const outstandingAmount = Math.max(expectedAmount - paidAmount, 0);

      /*
       * Determine overall contract payment status.
       */
      let paymentStatus = "pending";

      if (paidInstallments === totalInstallments && totalInstallments > 0) {
        paymentStatus = "paid";
      } else if (
        installments.some((payment) => payment.paymentStatus === "overdue")
      ) {
        paymentStatus = "overdue";
      } else if (paidInstallments > 0) {
        paymentStatus = "partial";
      } else if (
        installments.some(
          (payment) => payment.paymentStatus === "pending_verification",
        )
      ) {
        paymentStatus = "pending_verification";
      }

      return {
        contractId: contract.contractId,
        contractNumber: contract.contractNumber,

        client: contract.client,
        lead: contract.lead,
        property: contract.property,

        paidInstallments,
        totalInstallments,

        paidAmount,
        expectedAmount,
        outstandingAmount,

        paymentStatus,
      };
    });

    /*
     * Search by client or contract number.
     */
    if (search) {
      contractSummaries = contractSummaries.filter((contract) => {
        const clientName = contract.client?.name?.toLowerCase() || "";

        const leadName = contract.lead?.fullName?.toLowerCase() || "";

        const contractNumber = contract.contractNumber?.toLowerCase() || "";

        const propertyTitle = contract.property?.title?.toLowerCase() || "";

        return (
          clientName.includes(search) ||
          leadName.includes(search) ||
          contractNumber.includes(search) ||
          propertyTitle.includes(search)
        );
      });
    }

    /*
     * Filter by payment status.
     */
    if (status !== "all") {
      contractSummaries = contractSummaries.filter(
        (contract) => contract.paymentStatus === status,
      );
    }

    /*
     * Sort newest/current contracts first.
     */
    contractSummaries.sort((a, b) =>
      a.contractNumber.localeCompare(b.contractNumber),
    );

    /*
     * Pagination.
     */
    const total = contractSummaries.length;

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    const safePage = Math.min(page, totalPages);

    const startIndex = (safePage - 1) * limit;

    const paginatedContracts = contractSummaries.slice(
      startIndex,
      startIndex + limit,
    );

    return NextResponse.json({
      success: true,

      data: paginatedContracts,

      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Payments API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
