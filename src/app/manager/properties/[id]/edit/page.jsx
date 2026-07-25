"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

  if (loading) {
    return <h1>Loading...</h1>;
  }
  async function handleUpdate(e) {
    e.preventDefault();

    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: "PUT",

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
    <div>
      <h1>Edit Property</h1>

      <form onSubmit={handleUpdate}>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />

        <button type="submit">Update Property</button>
      </form>
    </div>
  );
}

