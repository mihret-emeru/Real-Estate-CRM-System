"use client";

import Link from "next/link";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "@/styles/property-map.css";

// Custom red property marker
const propertyIcon = L.divIcon({
  className: "property-marker",
  html: `
    <div class="property-marker-pin">
      <div class="property-marker-dot"></div>
    </div>
  `,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
  popupAnchor: [0, -38],
});

export default function PropertyMap({ properties = [] }) {
  const validProperties = properties.filter(
    (property) =>
      property.location?.latitude != null &&
      property.location?.longitude != null,
  );

  return (
    <MapContainer
      center={[8.9806, 38.7578]}
      zoom={12}
      minZoom={11}
      maxZoom={18}
      scrollWheelZoom={true}
      maxBounds={[
        [8.8, 38.55],
        [9.1, 39.05],
      ]}
      maxBoundsViscosity={1}
      zoomControl={false}
      className="property-map"
    >
      <ZoomControl position="bottomright" />

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {validProperties.map((property) => (
        <Marker
          key={property._id}
          position={[
            Number(property.location.latitude),
            Number(property.location.longitude),
          ]}
          icon={propertyIcon}
        >
          <Popup>
            <div className="property-map-popup">
              <h3>{property.title}</h3>

              <p className="property-map-location">
                {property.location?.subCity
                  ? `${property.location.subCity}, `
                  : ""}
                {property.location?.city || "Addis Ababa"}
              </p>

              <div className="property-map-price">
                {Number(property.price || 0).toLocaleString()}{" "}
                {property.currency}
              </div>

              <div className="property-map-status">{property.status}</div>

              {property.assignedAgent && (
                <p className="property-map-agent">
                  <strong>Agent:</strong> {property.assignedAgent.name}
                </p>
              )}

              <Link
                href={`/manager/properties/${property._id}`}
                className="property-map-view-btn"
              >
                View Property
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
