"use client";

import { useEffect, useState } from "react";
import CustomDropdown from "@/components/common/CustomDropdown";
import PaymentSchedulePreview from "@/components/contracts/PaymentSchedulePreview";

export default function ContractForm({
  onSubmit,
  submitText = "Create Contract",
  mode = "generated",
}) {
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [paymentSchedule, setPaymentSchedule] = useState([]);

  const [formData, setFormData] = useState({
    client: "",
    property: "",

    salePrice: "",
    downPayment: "",
    remainingBalance: "",
    installmentMonths: "",
    installmentAmount: "",
    paymentFrequency: "monthly",
    terms: "",
    startDate: "",
    endDate: "",
    contractFile: null,
    contractDate: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const clientsResponse = await fetch("/api/clients");
        const clientsData = await clientsResponse.json();

        if (clientsData.success) {
          setClients(clientsData.data);
        }

        const propertiesResponse = await fetch("/api/properties/available");

        const propertiesData = await propertiesResponse.json();

        if (propertiesData.success) {
          setProperties(propertiesData.data);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadData();
  }, []);

  function handleChange(name, value) {
    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleInputChange(e) {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleSubmit(e) {
    e.preventDefault();

    onSubmit({
      ...formData,
      paymentSchedule,
    });
  }

  function calculateInstallment(remainingBalance, months, frequency) {
    const balance = Number(remainingBalance);
    const totalMonths = Number(months);

    if (!balance || !totalMonths) return 0;

    let numberOfPayments = totalMonths;

    switch (frequency) {
      case "monthly":
        numberOfPayments = totalMonths;
        break;

      case "quarterly":
        numberOfPayments = Math.ceil(totalMonths / 3);
        break;

      case "yearly":
        numberOfPayments = Math.ceil(totalMonths / 12);
        break;

      case "one_time":
        numberOfPayments = 1;
        break;

      default:
        numberOfPayments = totalMonths;
    }

    return balance / numberOfPayments;
  }

  function generatePaymentSchedule(balance, months, frequency, startDate) {
    const schedule = [];

    const amount = calculateInstallment(balance, months, frequency);

    let paymentCount = 0;
    let monthGap = 1;

    switch (frequency) {
      case "monthly":
        paymentCount = months;
        monthGap = 1;
        break;

      case "quarterly":
        paymentCount = Math.ceil(months / 3);
        monthGap = 3;
        break;

      case "yearly":
        paymentCount = Math.ceil(months / 12);
        monthGap = 12;
        break;

      case "one_time":
        paymentCount = 1;
        monthGap = 0;
        break;
    }

    let date = new Date(startDate);

    for (let i = 0; i < paymentCount; i++) {
      schedule.push({
        installmentNumber: i + 1,
        dueDate: new Date(date),
        amount,
        status: "pending",
      });

      date.setMonth(date.getMonth() + monthGap);
    }

    return schedule;
  }

  useEffect(() => {
    if (
      formData.remainingBalance &&
      formData.installmentMonths &&
      formData.paymentFrequency &&
      formData.startDate
    ) {
      const schedule = generatePaymentSchedule(
        formData.remainingBalance,
        formData.installmentMonths,
        formData.paymentFrequency,
        formData.startDate,
      );

      setPaymentSchedule(schedule);
    }
  }, [
    formData.remainingBalance,
    formData.installmentMonths,
    formData.paymentFrequency,
    formData.startDate,
  ]);

  return (
    <form className="contract-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>Contract Information</h2>

        <CustomDropdown
          value={formData.client}
          options={clients.map((client) => ({
            value: client._id,
            label: client.name,
          }))}
          placeholder="Select Client"
          onChange={(value) => {
            setFormData((prev) => ({
              ...prev,
              client: value,
            }));
          }}
        />

        <CustomDropdown
          value={formData.property}
          options={properties.map((property) => ({
            value: property._id,
            label: property.title,
          }))}
          placeholder="Select Property"
          onChange={(value) => {
            const property = properties.find((item) => item._id === value);

            if (!property) return;

            setSelectedProperty(property);

            setFormData((prev) => ({
              ...prev,
              property: value,
              salePrice: property.price,
            }));
          }}
        />

        {mode === "generated" && (
          <>
            <label>Sale Price</label>

            <input
              type="number"
              name="salePrice"
              value={formData.salePrice}
              readOnly
              required
            />

            <label>Down Payment</label>

            <input
              type="number"
              name="downPayment"
              value={formData.downPayment}
              onChange={(e) => {
                const downPayment = Number(e.target.value);

                const salePrice = Number(formData.salePrice);

                let remaining = null;

                if (contractType === "generated") {
                  remaining = Math.max(salePrice - downPayment, 0);
                }

                setFormData((prev) => ({
                  ...prev,
                  downPayment: e.target.value,
                  remainingBalance: remaining,

                  installmentAmount: calculateInstallment(
                    remaining,
                    prev.installmentMonths,
                    prev.paymentFrequency,
                  ),
                }));
              }}
            />
            <label>Remaining Balance</label>

            <input type="number" value={formData.remainingBalance} readOnly />

            <label>Installment Months</label>

            <input
              type="number"
              name="installmentMonths"
              value={formData.installmentMonths}
              onChange={(e) => {
                const months = e.target.value;

                setFormData((prev) => ({
                  ...prev,
                  installmentMonths: months,
                  installmentAmount: calculateInstallment(
                    prev.remainingBalance,
                    months,
                    prev.paymentFrequency,
                  ),
                }));
              }}
            />

            <label>Payment Frequency</label>
            <CustomDropdown
              value={formData.paymentFrequency}
              placeholder="Select Payment Frequency"
              options={[
                {
                  value: "monthly",
                  label: "Monthly",
                },
                {
                  value: "quarterly",
                  label: "Quarterly",
                },
                {
                  value: "yearly",
                  label: "Yearly",
                },
                {
                  value: "one_time",
                  label: "One Time",
                },
              ]}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  paymentFrequency: value,
                  installmentAmount: calculateInstallment(
                    prev.remainingBalance,
                    prev.installmentMonths,
                    value,
                  ),
                }));
              }}
            />

            <label>Installment Amount</label>

            <input
              type="number"
              value={Number(formData.installmentAmount).toFixed(2)}
              readOnly
            />

            <label>Start Date</label>

            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />

            <PaymentSchedulePreview schedule={paymentSchedule} />
          </>
        )}

        <label>Terms</label>

        <textarea
          name="terms"
          value={formData.terms}
          onChange={handleInputChange}
          rows="5"
        />

        {mode === "uploaded" && (
          <>
            <label>Signed Contract (PDF)</label>

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  contractFile: e.target.files[0],
                }))
              }
            />

            <label>Contract Date</label>

            <input
              type="date"
              name="contractDate"
              value={formData.contractDate || ""}
              onChange={handleInputChange}
            />
          </>
        )}
      </div>

      <button className="submit-btn" type="submit">
        {submitText}
      </button>
    </form>
  );
}
