"use client";

import { useEffect, useState } from "react";
import CustomDropdown from "@/components/common/CustomDropdown";

export default function ContractForm({
  onSubmit,
  submitText = "Create Contract",
}) {
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);

  const [formData, setFormData] = useState({
    client: "",
    property: "",
    manager: "",
    salePrice: "",
    downPayment: "",
    installmentMonths: "",
    paymentFrequency: "monthly",
    terms: "",
    startDate: "",
    endDate: "",
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

    onSubmit(formData);
  }

  return (
    <form className="contract-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>Contract Information</h2>

        <CustomDropdown
          label="Client"
          name="client"
          value={formData.client}
          options={clients.map((client) => ({
            value: client._id,
            label: client.name,
          }))}
          onChange={handleChange}
        />

        <CustomDropdown
          label="Property"
          name="property"
          value={formData.property}
          options={properties.map((property) => ({
            value: property._id,
            label: `${property.title} - ${property.price}`,
          }))}
          onChange={handleChange}
        />

        <label>Sale Price</label>

        <input
          type="number"
          name="salePrice"
          value={formData.salePrice}
          onChange={handleInputChange}
          required
        />

        <label>Down Payment</label>

        <input
          type="number"
          name="downPayment"
          value={formData.downPayment}
          onChange={handleInputChange}
        />

        <label>Installment Months</label>

        <input
          type="number"
          name="installmentMonths"
          value={formData.installmentMonths}
          onChange={handleInputChange}
        />

        <CustomDropdown
          label="Payment Frequency"
          name="paymentFrequency"
          value={formData.paymentFrequency}
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
          onChange={handleChange}
        />

        <label>Terms</label>

        <textarea
          name="terms"
          value={formData.terms}
          onChange={handleInputChange}
          rows="5"
        />
      </div>

      <button className="submit-btn" type="submit">
        {submitText}
      </button>
    </form>
  );
}

