import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

function MapSynchronizer({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);

  return null;
}

export default function PropertyMapCard({ property, draggable = false, onLocationChange }) {
  const center = [Number(property.latitude), Number(property.longitude)];

  return (
    <div className="relative h-full min-h-[360px] overflow-hidden rounded-xl bg-surface-container">
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full min-h-[360px]">
        <MapSynchronizer center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={center}
          draggable={draggable}
          eventHandlers={
            draggable
              ? {
                  dragend: (event) => {
                    const marker = event.target;
                    const position = marker.getLatLng();
                    onLocationChange?.({
                      latitude: Number(position.lat.toFixed(6)),
                      longitude: Number(position.lng.toFixed(6)),
                    });
                  },
                }
              : undefined
          }
        >
          <Popup>
            <strong>{property.city}</strong>
            <br />
            {property.neighbourhood_cleansed}
          </Popup>
        </Marker>
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 z-[500] rounded-lg bg-inverse-surface px-3 py-2 text-label-sm text-inverse-on-surface shadow-ambient-soft">
        {property.city}, {property.neighbourhood_cleansed}
      </div>
    </div>
  );
}
