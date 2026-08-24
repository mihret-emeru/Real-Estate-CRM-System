"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import CustomDropdown from "@/components/common/CustomDropdown";
import "@/styles/add-property.css";

const PropertyLocationPicker = dynamic(
  () => import("@/components/properties/PropertyLocationPicker"),
  {
    ssr: false,
    loading: () => <p>Loading map...</p>,
  },
);

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
    latitude: "",
    longitude: "",
    bedrooms: "",
    bathrooms: "",
    floorNumber: "",
    totalFloors: "",
    area: "",
    parkingSpace: false,
    virtualTour: "",
    ownerPhone: "",
    assignedAgent: "",
  });

  const { data: session } = useSession();
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch("/api/agents");
        const data = await response.json();

        if (data.success) {
          setAgents(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      }
    }

    fetchAgents();
  }, []);

  function handleImageChange(e) {
    const files = Array.from(e.target.files);

    setSelectedImages(files);

    const previews = files.map((file) => URL.createObjectURL(file));

    setImagePreview(previews);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Prevent duplicate submissions
    if (submitting) return;

    setSubmitting(true);

    try {
      let imageUrls = [];

      // Upload images first
      if (selectedImages.length > 0) {
        const uploadData = new FormData();

        selectedImages.forEach((image) => {
          uploadData.append("images", image);
        });

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        const uploadResult = await uploadResponse.json();

        if (uploadResult.success) {
          imageUrls = uploadResult.images;
        }
      }

      // Create property
      const response = await fetch("/api/properties", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...formData,

          assignedAgent: formData.assignedAgent || null,

          images: imageUrls,

          location: {
            city: formData.city,
            subCity: formData.subCity,
            address: formData.address,

            latitude: formData.latitude ? Number(formData.latitude) : null,

            longitude: formData.longitude ? Number(formData.longitude) : null,
          },

          createdBy: session.user.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/manager/properties");
      } else {
        console.error(data.message);
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create property.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div className="add-property-page">
      <Link href="/manager/properties" className="property-back-link">
        ← Back to Properties
      </Link>
      <div className="page-title">
        <h1>Add New Property</h1>
        <p>Create and manage property listings</p>
      </div>

      <form className="property-form" onSubmit={handleSubmit}>
        <div className="form-section">
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

          <div className="form-row">
            <div>
              <label>Property Type</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
              >
                <option value="">Select Type</option>

                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>

                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div>
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="available">Available</option>
                <option value="sold">Reserved</option>
                <option value="rented">Sold</option>
              </select>
            </div>
          </div>

          <h2>Pricing</h2>

          <div className="form-row">
            <div>
              <label>Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
              />
            </div>

            <div>
              <label>Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                <option>ETB</option>
                <option>USD</option>
              </select>
            </div>
          </div>

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

          <div className="form-row">
            <div>
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>

            <div>
              <label>Sub City</label>
              <input
                type="text"
                name="subCity"
                value={formData.subCity}
                onChange={handleChange}
                placeholder="Sub city"
              />
            </div>
          </div>

          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Address"
          />
          <div className="form-row">
            <div>
              <label>Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                placeholder="Example: 8.9806"
              />
            </div>

            <div>
              <label>Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                placeholder="Example: 38.7578"
              />
            </div>
          </div>

          <div className="property-location-picker-section">
            <label>Select Property Location on Map</label>

            <PropertyLocationPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationSelect={({ latitude, longitude }) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: latitude.toFixed(6),
                  longitude: longitude.toFixed(6),
                }));
              }}
            />

            <p className="location-helper-text">
              Click on the map to select the property's exact location.
            </p>
          </div>

          <h2>Property Details</h2>
          <div className="form-row">
            <div>
              <label>Bedrooms</label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                placeholder="Number of bedrooms"
              />
            </div>

            <div>
              <label>Bathrooms</label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                placeholder="Number of bathrooms"
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Floor Number</label>
              <input
                type="number"
                name="floorNumber"
                value={formData.floorNumber}
                onChange={handleChange}
                placeholder="Floor number"
              />
            </div>

            <div>
              <label>Total Floors</label>
              <input
                type="number"
                name="totalFloors"
                value={formData.totalFloors}
                onChange={handleChange}
                placeholder="Total floors"
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label>Net Area (m²)</label>
              <input
                type="number"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="Net area"
              />
            </div>

            <div className="feature-checkbox-container">
              <div className="feature-checkbox">
                <input
                  type="checkbox"
                  name="parkingSpace"
                  checked={formData.parkingSpace}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      parkingSpace: e.target.checked,
                    })
                  }
                />

                <label>Parking Available</label>
              </div>
            </div>
          </div>

          <div className="property-agent-assignment">
            <h2>Agent Assignment</h2>

            <label>Assigned Agent</label>

            <CustomDropdown
              value={formData.assignedAgent}
              options={[
                {
                  value: "",
                  label: "No Agent Assigned",
                },
                ...agents.map((agent) => ({
                  value: agent._id,
                  label: agent.name,
                })),
              ]}
              placeholder="Select Agent"
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  assignedAgent: value,
                }));
              }}
            />
            <div className="agent-assignment-info">
              {formData.assignedAgent ? (
                <p>Agent will be assigned when you save this property.</p>
              ) : (
                <p>No agent will be assigned to this property.</p>
              )}
            </div>
          </div>

          <h2>Media</h2>

          <label>Property Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />
          <div className="image-preview">
            {imagePreview.map((image, index) => (
              <img key={index} src={image} alt="preview" />
            ))}
          </div>

          <label>Virtual Tour URL</label>
          <input type="text" placeholder="Video or 360 tour link" />

          <h2>Owner Information</h2>

          <label>Owner Phone</label>
          <input type="text" placeholder="Owner phone number" />

          <button type="submit" disabled={submitting}>
            {submitting ? "Saving Property..." : "Save Property"}
          </button>
        </div>
      </form>
    </div>
  );
}
