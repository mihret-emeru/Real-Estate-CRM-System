"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
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

export default function PropertyLocationView({ latitude, longitude }) {
  if (latitude == null || longitude == null) {
    return (
      <div className="property-location-unavailable">
        Location coordinates are not available for this property.
      </div>
    );
  }

  const position = [Number(latitude), Number(longitude)];

  return (
    <MapContainer
      center={position}
      zoom={15}
      minZoom={11}
      maxZoom={18}
      scrollWheelZoom={false}
      dragging={true}
      doubleClickZoom={true}
      maxBounds={[
        [8.8, 38.55],
        [9.1, 39.05],
      ]}
      maxBoundsViscosity={1}
      className="property-location-view"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={position} icon={propertyIcon} />
    </MapContainer>
  );
}

