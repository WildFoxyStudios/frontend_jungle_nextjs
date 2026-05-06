"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import type { LatLngExpression } from "leaflet";

// Fix Leaflet's default marker icon paths for bundlers (webpack/Next.js
// don't resolve the relative image URLs in leaflet.css).
// Use CDN copies so markers work without additional static assets.
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

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
  const [error, setError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center border bg-muted`}>
        <span className="text-sm text-muted-foreground">Map unavailable</span>
      </div>
    );
  }

  if (!mounted) {
    return <div className={`${className} animate-pulse bg-muted`} />;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`${className} z-0 border`}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        eventHandlers={{
          tileerror: () => setError(true),
        }}
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
  );
}
