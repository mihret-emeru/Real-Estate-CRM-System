export function checkOverduePayment(payment) {
  if (payment.paymentStatus === "paid") {
    return "paid";
  }

  if (payment.paymentStatus === "pending_verification") {
    return "pending_verification";
  }

  const today = new Date();
  const dueDate = new Date(payment.dueDate);

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  if (dueDate < today && payment.paymentStatus === "pending") {
    return "overdue";
  }

  return payment.paymentStatus;
}
