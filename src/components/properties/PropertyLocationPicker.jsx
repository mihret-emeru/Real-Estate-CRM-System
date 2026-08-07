"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "@/styles/property-map.css";

const propertyIcon = L.divIcon({
  className: "property-marker",
  html: `
    <div class="property-marker-pin">
      <div class="property-marker-dot"></div>
    </div>
  `,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
});

function LocationSelector({ position, onSelect }) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return position ? <Marker position={position} icon={propertyIcon} /> : null;
}

export default function PropertyLocationPicker({
  latitude,
  longitude,
  onLocationSelect,
}) {
  const hasLocation =
    latitude !== "" &&
    longitude !== "" &&
    latitude != null &&
    longitude != null;

  const position = hasLocation ? [Number(latitude), Number(longitude)] : null;

  return (
    <MapContainer
      center={position || [8.9806, 38.7578]}
      zoom={position ? 15 : 12}
      minZoom={11}
      maxZoom={18}
      scrollWheelZoom={true}
      maxBounds={[
        [8.8, 38.55],
        [9.1, 39.05],
      ]}
      maxBoundsViscosity={1}
      className="property-location-picker"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationSelector position={position} onSelect={onLocationSelect} />
    </MapContainer>
  );
}

