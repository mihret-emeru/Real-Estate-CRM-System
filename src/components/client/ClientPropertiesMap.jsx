"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

import L from "leaflet";
import { useEffect } from "react";

import "leaflet/dist/leaflet.css";

import { FaHome, FaMapMarkerAlt, FaArrowRight } from "react-icons/fa";

/*
 * Fix Leaflet's default marker images.
 */
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/*
 * Automatically fit the map around all properties.
 */

function FitProperties() {
  const map = useMap();

  useEffect(() => {
    // Addis Ababa approximate geographic bounds
    const addisBounds = [
      [8.8, 38.55], // Southwest
      [9.25, 39.0], // Northeast
    ];

    // Center the map on Addis Ababa
    map.setView([9.03, 38.74], 12);

    // Prevent panning outside Addis Ababa
    map.setMaxBounds(addisBounds);

    // How much the user can pull outside the bounds
    map.options.maxBoundsViscosity = 1.0;

    // Prevent zooming too far out
    map.setMinZoom(11);

    // Allow reasonable zooming in
    map.setMaxZoom(17);
  }, [map]);

  return null;
}

export default function ClientPropertiesMap({ properties = [] }) {
  if (!properties.length) {
    return null;
  }

  return (
    <div className="client-properties-map-wrapper">
      <MapContainer
        center={[9.03, 38.74]}
        zoom={12}
        minZoom={11}
        maxZoom={17}
        scrollWheelZoom={true}
        className="client-properties-map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitProperties />

        {properties.map((property) => {
          const latitude = Number(property.location.latitude);

          const longitude = Number(property.location.longitude);

          return (
            <Marker key={property._id} position={[latitude, longitude]}>
              <Popup>
                <div className="client-map-popup">
                  <div className="client-map-popup-icon">
                    <FaHome />
                  </div>

                  <div className="client-map-popup-content">
                    <h3>{property.title || "Property"}</h3>

                    <p className="client-map-popup-location">
                      <FaMapMarkerAlt />

                      {property.location?.city || "Location unavailable"}
                    </p>

                    <strong>
                      {Number(property.price || 0).toLocaleString()}{" "}
                      {property.currency || "ETB"}
                    </strong>

                    <a
                      href={`/client/properties/${property._id}`}
                      className="client-map-popup-link"
                    >
                      View Property
                      <FaArrowRight />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="client-map-property-count">
        <FaHome />

        <span>
          {properties.length}{" "}
          {properties.length === 1 ? "property" : "properties"} found
        </span>
      </div>
    </div>
  );
}
