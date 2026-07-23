"use client";

import { useState } from "react";

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

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  return (
    <div>
      <h1>Add New Property</h1>

      <form>
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
          <option>Select Type</option>
          <option>House</option>
          <option>Apartment</option>
          <option>Villa</option>
          <option>Condominium</option>
          <option>Commercial</option>
          <option>Land</option>
        </select>

        <label>Status</label>
        <select name="status" value={formData.status} onChange={handleChange}>
          <option>Available</option>
          <option>Sold</option>
          <option>Rented</option>
          <option>Pending</option>
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
          <option>Full Payment</option>
          <option>Installment</option>
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

