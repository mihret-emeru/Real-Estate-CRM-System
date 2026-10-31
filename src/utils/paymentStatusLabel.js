export default function paymentStatusLabel(status) {
  switch (status) {
    case "pending":
      return "Pending";

    case "pending_verification":
      return "Pending Verification";

    case "paid":
      return "Paid";

    case "rejected":
      return "Rejected";

    case "overdue":
      return "Overdue";

    default:
      return status;
  }
}
