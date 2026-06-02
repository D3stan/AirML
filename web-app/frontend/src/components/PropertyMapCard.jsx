import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";

function MapSynchronizer({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center, map, zoom]);

  return null;
}

export default function PropertyMapCard({
  property,
  draggable = false,
  onLocationChange,
  mapCenter,
  zoom,
  showTooltip = true,
  className = "",
}) {
  const markerPosition = [Number(property.latitude), Number(property.longitude)];
  const center = mapCenter ?? markerPosition;
  const initialZoom = zoom ?? 13;
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "airml-marker-shell",
        html: '<span class="airml-marker-dot"></span>',
        iconAnchor: [9, 9],
        iconSize: [18, 18],
        popupAnchor: [0, -10],
      }),
    [],
  );

  return (
    <div className={`relative h-full min-h-[360px] overflow-hidden rounded-xl bg-surface-container ${className}`}>
      <MapContainer center={center} zoom={initialZoom} scrollWheelZoom className="airml-dashboard-map h-full min-h-[360px]">
        <MapSynchronizer center={center} zoom={initialZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={markerPosition}
          icon={markerIcon}
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
          {showTooltip && (
            <Tooltip permanent direction="bottom" offset={[0, 18]} className="airml-map-tooltip">
              {property.city}
            </Tooltip>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}
