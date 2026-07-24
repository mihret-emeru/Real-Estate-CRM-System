"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AddPropertyPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    propertyType: "",
    status: "available",
    price: "",
    currency: "ETB",
    paymentType: "full_payment",
    city: "",
    subCity: "",
    address: "",
    bedrooms: "",
    bathrooms: "",
    floorNumber: "",
    totalFloors: "",
    area: "",
    parkingSpace: false,
    virtualTour: "",
    ownerPhone: "",
  });

  const { data: session } = useSession();
  const router = useRouter();

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch("/api/properties", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...formData,

          location: {
            city: formData.city,
            subCity: formData.subCity,
            address: formData.address,
          },

          createdBy: session.user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/manager/properties");
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      <h1>Add New Property</h1>

      <form onSubmit={handleSubmit}>
        <h2>Basic Information</h2>

        <label>Property Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter property title"
        />

        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter description"
        />

        <label>Property Type</label>
        <select
          name="propertyType"
          value={formData.propertyType}
          onChange={handleChange}
        >
          <option value="">Select Type</option>

          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="villa">Villa</option>
          <option value="condominium">Condominium</option>
          <option value="commercial">Commercial</option>
          <option value="land">Land</option>
        </select>

        <label>Status</label>
        <select name="status" value={formData.status} onChange={handleChange}>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
          <option value="pending">Pending</option>
        </select>

        <h2>Pricing</h2>

        <label>Price</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          placeholder="Enter price"
        />

        <label>Currency</label>
        <select
          name="currency"
          value={formData.currency}
          onChange={handleChange}
        >
          <option>ETB</option>
          <option>USD</option>
        </select>

        <label>Payment Type</label>
        <select
          name="paymentType"
          value={formData.paymentType}
          onChange={handleChange}
        >
          <option value="full_payment">Full Payment</option>
          <option value="installment">Installment</option>
        </select>

        <h2>Location</h2>

        <label>City</label>
        <input
          type="text"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="City"
        />

        <label>Sub City</label>
        <input
          type="text"
          name="subCity"
          value={formData.subCity}
          onChange={handleChange}
          placeholder="Sub city"
        />

        <label>Address</label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Address"
        />

        <h2>Property Details</h2>

        <label>Bedrooms</label>
        <input
          type="number"
          name="bedrooms"
          value={formData.bedrooms}
          onChange={handleChange}
          placeholder="Number of bedrooms"
        />

        <label>Bathrooms</label>
        <input
          type="number"
          name="bathrooms"
          value={formData.bathrooms}
          onChange={handleChange}
          placeholder="Number of bathrooms"
        />

        <label>Floor Number</label>
        <input
          type="number"
          name="floorNumber"
          value={formData.floorNumber}
          onChange={handleChange}
          placeholder="Floor number"
        />

        <label>Total Floors</label>
        <input
          type="number"
          name="totalFloors"
          value={formData.totalFloors}
          onChange={handleChange}
          placeholder="Total floors"
        />

        <label>Net Area (m²)</label>
        <input
          type="number"
          name="area"
          value={formData.area}
          onChange={handleChange}
          placeholder="Net area"
        />

        <label>
          <input
            type="checkbox"
            name="parkingSpace"
            checked={formData.parkingSpace}
            onChange={(e) =>
              setFormData({ ...formData, parkingSpace: e.target.checked })
            }
          />
          Parking Available
        </label>

        <h2>Media</h2>

        <label>Property Images</label>
        <input type="file" multiple />

        <label>Virtual Tour URL</label>
        <input type="text" placeholder="Video or 360 tour link" />

        <h2>Owner Information</h2>

        <label>Owner Phone</label>
        <input type="text" placeholder="Owner phone number" />

        <button type="submit">Save Property</button>
      </form>
    </div>
  );
}
