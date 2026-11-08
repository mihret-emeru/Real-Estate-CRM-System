"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import BackLink from "@/components/common/BackLink";

import {
  FaUser,
  FaUserTie,
  FaBuilding,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaFileContract,
} from "react-icons/fa";

import "@/styles/contract-request-details.css";

export default function ManagerContractRequestDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [reviewLoading, setReviewLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  useEffect(() => {
    async function fetchRequest() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/contracts/requests/${id}`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load request details.");
        }

        setRequest(result.data);
      } catch (error) {
        console.error("Request details error:", error);
        setError(error.message || "Failed to load request details.");
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchRequest();
  }, [id]);

  function formatPrice(amount, currency = "ETB") {
    return `${Number(amount || 0).toLocaleString()} ${currency}`;
  }

  function formatDate(date) {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  }
  async function handleReview(action) {
    if (action === "reject" && !rejectionReason.trim()) {
      setReviewMessage("Please provide a rejection reason.");
      return;
    }

    const confirmed = window.confirm(
      action === "approve"
        ? "Are you sure you want to approve this contract request?"
        : "Are you sure you want to reject this contract request?",
    );

    if (!confirmed) return;

    try {
      setReviewLoading(true);
      setReviewMessage("");

      const response = await fetch(`/api/contracts/requests/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          rejectionReason,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to review request.");
      }

      setRequest((previous) => ({
        ...previous,
        status: result.data.status,
        reviewedAt: result.data.reviewedAt,
        rejectionReason: action === "reject" ? rejectionReason.trim() : "",
      }));

      setReviewMessage(result.message);
    } catch (error) {
      setReviewMessage(error.message || "Something went wrong.");
    } finally {
      setReviewLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading request details..." />;
  }

  if (error || !request) {
    return (
      <div className="manager-contract-request-details-page">
        <BackLink href="/manager/contract-requests" label="Back to Requests" />
        <div className="manager-request-details-error">
          {error || "Contract request not found."}
        </div>
      </div>
    );
  }

  const currency = request.currency || "ETB";

  const remainingBalance =
    Number(request.propertyPrice || 0) - Number(request.downPayment || 0);

  const agentName =
    request.agent?.fullName || request.agent?.name || "Agent unavailable";

  const location = request.property?.location;

  return (
    <div className="manager-contract-request-details-page">
      <div className="manager-request-details-top">
        <BackLink href="/manager/contract-requests" label="Back to Requests" />
      </div>

      <div className="manager-request-details-header">
        <div>
          <span>MANAGER WORKSPACE</span>
          <h1>Contract Request Details</h1>
          <p>Review the agent's proposed contract terms.</p>
        </div>

        <span className={`manager-request-details-status ${request.status}`}>
          {request.status.replace("_", " ")}
        </span>
      </div>

      <div className="manager-request-details-grid">
        <section className="manager-request-details-card">
          <div className="manager-request-card-heading">
            <FaUserTie />
            <h2>Agent Information</h2>
          </div>

          <div className="manager-request-detail-item">
            <span>Agent Name</span>
            <strong>{agentName}</strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Email</span>
            <strong>{request.agent?.email || "-"}</strong>
          </div>
        </section>

        <section className="manager-request-details-card">
          <div className="manager-request-card-heading">
            <FaUser />
            <h2>Lead Information</h2>
          </div>

          <div className="manager-request-detail-item">
            <span>Client Name</span>
            <strong>{request.lead?.fullName || "-"}</strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Email</span>
            <strong>{request.lead?.email || "-"}</strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Phone</span>
            <strong>{request.lead?.phone || "-"}</strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Lead Status</span>
            <strong>{request.lead?.status || "-"}</strong>
          </div>
        </section>

        <section className="manager-request-details-card">
          <div className="manager-request-card-heading">
            <FaBuilding />
            <h2>Property Information</h2>
          </div>

          <div className="manager-request-detail-item">
            <span>Property</span>
            <strong>{request.property?.title || "-"}</strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Property Type</span>
            <strong>{request.property?.propertyType || "-"}</strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Location</span>
            <strong>
              {location
                ? [location.city, location.subCity, location.address]
                    .filter(Boolean)
                    .join(", ")
                : "-"}
            </strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Property Price</span>
            <strong>{formatPrice(request.propertyPrice, currency)}</strong>
          </div>
        </section>

        <section className="manager-request-details-card">
          <div className="manager-request-card-heading">
            <FaMoneyBillWave />
            <h2>Payment Proposal</h2>
          </div>

          <div className="manager-request-detail-item">
            <span>Payment Type</span>
            <strong>
              {request.paymentType === "full_payment"
                ? "Full Payment"
                : "Installment"}
            </strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Down Payment</span>
            <strong>{formatPrice(request.downPayment, currency)}</strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Remaining Balance</span>
            <strong>{formatPrice(remainingBalance, currency)}</strong>
          </div>

          {request.paymentType === "installment" && (
            <>
              <div className="manager-request-detail-item">
                <span>Installment Duration</span>
                <strong>{request.installmentMonths} months</strong>
              </div>

              <div className="manager-request-detail-item">
                <span>Payment Frequency</span>
                <strong>{request.paymentFrequency}</strong>
              </div>
            </>
          )}
        </section>

        <section className="manager-request-details-card">
          <div className="manager-request-card-heading">
            <FaCalendarAlt />
            <h2>Request Information</h2>
          </div>

          <div className="manager-request-detail-item">
            <span>Submitted Date</span>
            <strong>{formatDate(request.createdAt)}</strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Last Updated</span>
            <strong>{formatDate(request.updatedAt)}</strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Reviewed By</span>
            <strong>
              {request.reviewedBy?.fullName ||
                request.reviewedBy?.name ||
                "Awaiting review"}
            </strong>
          </div>

          <div className="manager-request-detail-item">
            <span>Reviewed Date</span>
            <strong>{formatDate(request.reviewedAt)}</strong>
          </div>
        </section>

        <section className="manager-request-details-card manager-request-terms-card">
          <div className="manager-request-card-heading">
            <FaFileContract />
            <h2>Additional Terms</h2>
          </div>

          <p>{request.terms || "No additional terms provided."}</p>

          {request.rejectionReason && (
            <div className="manager-request-rejection-reason">
              <strong>Rejection Reason</strong>
              <p>{request.rejectionReason}</p>
            </div>
          )}

          {request.contract && (
            <div className="manager-request-detail-item">
              <span>Created Contract</span>
              <strong>
                {request.contract.contractNumber} ({request.contract.status})
              </strong>
            </div>
          )}
        </section>
        {request.status === "pending" && (
          <section className="manager-request-review-card">
            <h2>Review Contract Request</h2>

            <p>
              Review the proposed terms before approving or rejecting this
              request.
            </p>

            <div className="manager-request-rejection-input">
              <label htmlFor="rejectionReason">
                Rejection Reason (required when rejecting)
              </label>

              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this request is being rejected..."
                rows={4}
              />
            </div>

            {reviewMessage && (
              <p className="manager-request-review-message">{reviewMessage}</p>
            )}

            <div className="manager-request-review-actions">
              <button
                type="button"
                onClick={() => handleReview("approve")}
                disabled={reviewLoading}
              >
                {reviewLoading ? "Processing..." : "Approve Request"}
              </button>

              <button
                type="button"
                onClick={() => handleReview("reject")}
                disabled={reviewLoading}
              >
                {reviewLoading ? "Processing..." : "Reject Request"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
