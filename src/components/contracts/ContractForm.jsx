"use client";

import { useEffect, useState } from "react";
import CustomDropdown from "@/components/common/CustomDropdown";
import PaymentSchedulePreview from "@/components/contracts/PaymentSchedulePreview";
import "@/styles/contract-form.css";

export default function ContractForm({
  initialData,
  onSubmit,
  submitText = "Create Contract",
  mode = "generated",
}) {
  const [clients, setClients] = useState([]);
  const [qualifiedLeads, setQualifiedLeads] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [customerType, setCustomerType] = useState(
    initialData?.lead ? "lead" : "client",
  );
  const [clientSearch, setClientSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [propertySearch, setPropertySearch] = useState("");
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [formData, setFormData] = useState(() => {
    const data = initialData || {};

    return {
      client: data.client || null,
      lead: data.lead || null,
      property: data.property || "",

      salePrice: data.salePrice ?? "",
      downPayment: data.downPayment ?? "",
      remainingBalance: data.remainingBalance ?? "",
      installmentMonths: data.installmentMonths ?? "",
      installmentAmount: data.installmentAmount ?? "",
      paymentFrequency: data.paymentFrequency || "monthly",

      terms: data.terms || "",
      startDate: data.startDate || "",
      endDate: data.endDate || "",
      contractFile: null,
      contractDate: data.contractDate || "",
    };
  });

  useEffect(() => {
    async function loadData() {
      try {
        const clientsResponse = await fetch("/api/clients");
        const clientsData = await clientsResponse.json();

        if (clientsData.success) {
          setClients(clientsData.data);
        }

        // Load qualified leads
        const qualifiedLeadsResponse = await fetch("/api/leads/qualified");
        const qualifiedLeadsData = await qualifiedLeadsResponse.json();

        if (qualifiedLeadsData.success) {
          setQualifiedLeads(qualifiedLeadsData.data);
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

  useEffect(() => {
    if (!initialData?.property || properties.length === 0) {
      return;
    }

    const property = properties.find(
      (item) => item._id === initialData.property,
    );

    if (property) {
      setPropertySearch(property.title);
      setSelectedProperty(property);
    }
  }, [initialData, properties]);

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

  const filteredClients = clients.filter((client) =>
    client.name?.toLowerCase().includes(clientSearch.toLowerCase()),
  );

  const filteredQualifiedLeads = qualifiedLeads.filter((lead) =>
    lead.fullName?.toLowerCase().includes(leadSearch.toLowerCase()),
  );

  const filteredProperties = properties.filter((property) =>
    property.title?.toLowerCase().includes(propertySearch.toLowerCase()),
  );

  return (
    <form className="contract-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>Contract Information</h2>
        <label>Customer Type</label>

        {initialData ? (
          <input
            type="text"
            value={formData.lead ? "Qualified Lead" : "Registered Client"}
            readOnly
          />
        ) : (
          <CustomDropdown
            value={customerType}
            options={[
              {
                value: "client",
                label: "Registered Client",
              },
              {
                value: "lead",
                label: "Qualified Lead",
              },
            ]}
            placeholder="Select Customer Type"
            onChange={(value) => {
              setCustomerType(value);

              setClientSearch("");
              setLeadSearch("");

              setFormData((prev) => ({
                ...prev,
                client: null,
                lead: null,
              }));
            }}
          />
        )}

        {/* =========================================
    REGISTERED CLIENT
========================================= */}

        {customerType === "client" ? (
          initialData ? (
            <input
              type="text"
              value={
                clients.find((client) => client._id === formData.client)
                  ?.name || ""
              }
              readOnly
            />
          ) : (
            <>
              <label>Client</label>

              <input
                type="text"
                placeholder="Search client name..."
                value={
                  formData.client
                    ? clients.find((client) => client._id === formData.client)
                        ?.name || clientSearch
                    : clientSearch
                }
                onChange={(e) => {
                  setClientSearch(e.target.value);

                  setFormData((prev) => ({
                    ...prev,
                    client: null,
                    lead: null,
                  }));
                }}
              />

              {clientSearch.trim() && !formData.client && (
                <div className="contract-search-results">
                  {filteredClients.length > 0 ? (
                    filteredClients.slice(0, 8).map((client) => (
                      <button
                        type="button"
                        key={client._id}
                        className="contract-search-result"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            client: client._id,
                            lead: null,
                          }));

                          setClientSearch(client.name);
                        }}
                      >
                        {client.name}
                      </button>
                    ))
                  ) : (
                    <div className="contract-search-no-results">
                      No registered client found.
                    </div>
                  )}
                </div>
              )}
            </>
          )
        ) : (
          /* =========================================
     QUALIFIED LEAD
  ========================================= */

          <>
            <label>Qualified Lead</label>

            <input
              type="text"
              placeholder="Search qualified lead..."
              value={
                formData.lead
                  ? qualifiedLeads.find((lead) => lead._id === formData.lead)
                      ?.fullName || leadSearch
                  : leadSearch
              }
              onChange={(e) => {
                setLeadSearch(e.target.value);

                setFormData((prev) => ({
                  ...prev,
                  lead: null,
                  client: null,
                }));
              }}
            />

            {leadSearch.trim() && !formData.lead && (
              <div className="contract-search-results">
                {filteredQualifiedLeads.length > 0 ? (
                  filteredQualifiedLeads.slice(0, 8).map((lead) => (
                    <button
                      type="button"
                      key={lead._id}
                      className="contract-search-result"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          lead: lead._id,
                          client: null,
                        }));

                        setLeadSearch(lead.fullName);
                      }}
                    >
                      {lead.fullName}
                    </button>
                  ))
                ) : (
                  <div className="contract-search-no-results">
                    No qualified lead found.
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {initialData ? (
          <>
            <label>Property</label>

            <input
              type="text"
              value={
                initialData.propertyTitle ||
                properties.find(
                  (property) => property._id === formData.property,
                )?.title ||
                ""
              }
              readOnly
            />
          </>
        ) : (
          <>
            <label>Property</label>

            <input
              type="text"
              placeholder="Search property..."
              value={
                formData.property
                  ? properties.find(
                      (property) => property._id === formData.property,
                    )?.title || propertySearch
                  : propertySearch
              }
              onChange={(e) => {
                setPropertySearch(e.target.value);

                setFormData((prev) => ({
                  ...prev,
                  property: "",
                }));
              }}
            />

            {propertySearch.trim() && !formData.property && (
              <div className="contract-search-results">
                {filteredProperties.length > 0 ? (
                  filteredProperties.slice(0, 8).map((property) => (
                    <button
                      type="button"
                      key={property._id}
                      className="contract-search-result"
                      onClick={() => {
                        setSelectedProperty(property);

                        setFormData((prev) => ({
                          ...prev,
                          property: property._id,
                          salePrice: property.price,
                        }));

                        setPropertySearch(property.title);
                      }}
                    >
                      <span>{property.title}</span>

                      <small>
                        {Number(property.price || 0).toLocaleString()} ETB
                      </small>
                    </button>
                  ))
                ) : (
                  <div className="contract-search-no-results">
                    No available property found.
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {(mode === "generated" || mode === "uploaded") && (
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

                remaining = Math.max(salePrice - downPayment, 0);

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

            {!initialData && (
              <>
                <label>Installment Amount</label>

                <input
                  type="number"
                  value={Number(formData.installmentAmount).toFixed(2)}
                  readOnly
                />
              </>
            )}

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
