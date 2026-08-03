"use client";

import InfoCard from "@/components/common/InfoCard";
import PaymentScheduleTable from "./PaymentScheduleTable";
import ContractDocument from "./ContractDocument";

export default function ContractDetails({ contract, setContract }) {
  return (
    <div className="contract-details">
      <h1>Contract Details</h1>

      <InfoCard title="Client Information">
        <p>
          <strong>Name:</strong> {contract.client?.name}
        </p>

        <p>
          <strong>Email:</strong> {contract.client?.email}
        </p>

        <p>
          <strong>Phone:</strong> {contract.client?.phone}
        </p>
      </InfoCard>

      <InfoCard title="Property Information">
        <p>
          <strong>Title:</strong> {contract.property?.title}
        </p>

        <p>
          <strong>Price:</strong>
          {Number(contract.property?.price).toLocaleString()} ETB
        </p>
      </InfoCard>

      <InfoCard title="Financial Summary">
        <p>
          <strong>Sale Price:</strong>
          {Number(contract.salePrice).toLocaleString()} ETB
        </p>

        <p>
          <strong>Down Payment:</strong>
          {Number(contract.downPayment).toLocaleString()} ETB
        </p>

        <p>
          <strong>Remaining Balance:</strong>
          {Number(contract.remainingBalance).toLocaleString()} ETB
        </p>

        <p>
          <strong>Installment Months:</strong>
          {contract.installmentMonths}
        </p>

        <p>
          <strong>Payment Frequency:</strong>
          {contract.paymentFrequency}
        </p>

        <p>
          <strong>Status:</strong>
          {contract.status}
        </p>
      </InfoCard>

      <PaymentScheduleTable schedule={contract.paymentSchedule} />

      <ContractDocument contract={contract} onUpdate={setContract} />
    </div>
  );
}

