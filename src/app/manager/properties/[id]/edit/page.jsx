"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/styles/add-property.css";

export default function EditPropertyPage() {
  const { id } = useParams();
  const router = useRouter();

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
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const response = await fetch(`/api/properties/${id}`);

        const data = await response.json();

        const property = data.data;

        setFormData({
          title: property.title || "",
          description: property.description || "",
          propertyType: property.propertyType || "",
          status: property.status || "available",

          price: property.price || "",
          currency: property.currency || "ETB",
          paymentType: property.paymentType || "full_payment",

          city: property.location?.city || "",
          subCity: property.location?.subCity || "",
          address: property.location?.address || "",

          bedrooms: property.bedrooms || "",
          bathrooms: property.bathrooms || "",
          floorNumber: property.floorNumber || "",
          totalFloors: property.totalFloors || "",
          area: property.area || "",

          parkingSpace: property.parkingSpace || false,

          virtualTour: property.virtualTour || "",
          ownerPhone: property.ownerPhone || "",
        });
        setImagePreview(property.images || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchProperty();
    }
  }, [id]);

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  }

  function handleImageChange(e) {
    const files = Array.from(e.target.files);

    setSelectedImages(files);

    const previews = files.map((file) => URL.createObjectURL(file));

    setImagePreview(previews);
  }

  if (loading) {
    return <h1>Loading...</h1>;
  }
  async function handleUpdate(e) {
    e.preventDefault();

    try {
      let imageUrls = imagePreview;

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

      const response = await fetch(`/api/properties/${id}`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...formData,

          images: imageUrls,

          location: {
            city: formData.city,
            subCity: formData.subCity,
            address: formData.address,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/manager/properties/${id}`);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="add-property-page">
      <div className="page-title">
        <h1>Edit Property</h1>
        <p>Update property information</p>
      </div>

      <form className="property-form" onSubmit={handleUpdate}>
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
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="condominium">Condominium</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
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
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
                <option value="pending">Pending</option>
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
              <img key={index} src={image} alt={`Preview ${index + 1}`} />
            ))}
          </div>

          <label>Virtual Tour URL</label>
          <input
            type="text"
            name="virtualTour"
            value={formData.virtualTour}
            onChange={handleChange}
            placeholder="Video or 360 tour link"
          />

          <h2>Owner Information</h2>

          <label>Owner Phone</label>
          <input
            type="text"
            name="ownerPhone"
            value={formData.ownerPhone}
            onChange={handleChange}
            placeholder="Owner phone number"
          />

          <button type="submit">Update Property</button>
        </div>
      </form>
    </div>
  );
}
