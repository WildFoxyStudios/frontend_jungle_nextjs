"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { LatLngExpression } from "leaflet";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false },
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false },
);

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  label?: string;
  description?: string;
}

interface MapViewProps {
  center?: LatLngExpression;
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
}

export function MapView({
  center = [40.4168, -3.7038],
  zoom = 13,
  markers = [],
  className = "h-[400px] w-full",
  onMarkerClick,
}: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`${className} bg-muted animate-pulse rounded-lg`} />;
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <MapContainer
        center={center}
        zoom={zoom}
        className={`${className} rounded-lg z-0`}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            eventHandlers={{
              click: () => onMarkerClick?.(marker),
            }}
          >
            {(marker.label || marker.description) && (
              <Popup>
                {marker.label && <strong>{marker.label}</strong>}
                {marker.description && <p className="text-sm">{marker.description}</p>}
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}
