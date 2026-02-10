'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Tenant = {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
};

function zoomForRadiusKm(radiusKm: number) {
  if (radiusKm <= 10) return 13;
  if (radiusKm <= 20) return 12;
  if (radiusKm <= 50) return 11;
  if (radiusKm <= 100) return 10;
  if (radiusKm <= 200) return 9;
  if (radiusKm <= 500) return 7;
  return 6;
}

function MapController({
  center,
  radiusKm,
  fly,
}: {
  center: [number, number];
  radiusKm: number;
  fly?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    const z = zoomForRadiusKm(radiusKm);
    if (fly) map.flyTo(center, z, { duration: 0.8 });
    else map.setView(center, z);
  }, [center, radiusKm, fly, map]);

  return null;
}

// Fix icon paths (Leaflet en Next)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function BusinessMap({
  tenants,
  focusCoords,
  radiusKm = 50,
}: {
  tenants: Tenant[];
  focusCoords: [number, number] | null;
  radiusKm?: number;
}) {
  const valid = useMemo(
    () =>
      (tenants || []).filter(
        (t) =>
          typeof t?.lat === 'number' &&
          typeof t?.lng === 'number' &&
          !Number.isNaN(t.lat) &&
          !Number.isNaN(t.lng)
      ),
    [tenants]
  );

  // Centro “inteligente”
  const autoCenter = useMemo<[number, number]>(() => {
    if (focusCoords) return focusCoords;
    if (valid.length) {
      const avgLat = valid.reduce((a, t) => a + t.lat, 0) / valid.length;
      const avgLng = valid.reduce((a, t) => a + t.lng, 0) / valid.length;
      return [avgLat, avgLng];
    }
    return [25.6866, -100.3161]; // Monterrey fallback
  }, [focusCoords, valid]);

  const [center, setCenter] = useState<[number, number]>(autoCenter);
  const [fly, setFly] = useState(false);

  // ✅ radio efectivo (para que al tocar un negocio se acerque a 50km)
  const [activeRadiusKm, setActiveRadiusKm] = useState<number>(radiusKm);

  const [selected, setSelected] = useState<Tenant | null>(null);

  // Cuando cambia el focus externo, regresa al radio base y centra
  useEffect(() => {
    setCenter(autoCenter);
    setFly(false);
    setActiveRadiusKm(radiusKm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCenter?.[0], autoCenter?.[1], radiusKm]);

  const onPick = (t: Tenant) => {
    setSelected(t);
    setCenter([t.lat, t.lng]);
    setActiveRadiusKm(50); // 👈 aquí el “acercamiento”
    setFly(true);
  };

  return (
    // ✅ relative para overlays + overflow hidden para verse “app-like”
    <div className="relative h-full w-full overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoomForRadiusKm(activeRadiusKm)}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapController center={center} radiusKm={activeRadiusKm} fly={fly} />

        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* “Zona” visible */}
        <Circle
          center={center}
          radius={activeRadiusKm * 1000}
          pathOptions={{ opacity: 0.25, fillOpacity: 0.08 }}
        />

        {valid.map((t) => (
          <Marker
            key={t.id || `${t.name}-${t.lat}-${t.lng}`}
            position={[t.lat, t.lng]}
            eventHandlers={{ click: () => onPick(t) }}
          >
            <Popup>
              <div className="min-w-[220px]">
                <div className="font-black text-gray-900">{t.name}</div>

                {(t.address || '').trim() ? (
                  <div className="text-xs text-gray-600 mt-1">{t.address}</div>
                ) : (
                  <div className="text-xs text-gray-500 mt-1">
                    {t.lat.toFixed(5)}, {t.lng.toFixed(5)}
                  </div>
                )}

                <a
                  className="mt-3 inline-flex items-center justify-center w-full px-3 py-2 rounded-xl bg-black text-white font-black text-sm no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lng}`}
                >
                  Abrir en Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ✅ Barra inferior “floating” pero SIN encimarse con tabs (subida) */}
      {selected && (
        <div className="pointer-events-none absolute left-4 right-4 bottom-24 sm:bottom-6">
          <div className="pointer-events-auto mx-auto max-w-md bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-3 shadow-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-black text-gray-900 truncate">{selected.name}</div>
              <div className="text-xs text-gray-500 truncate">
                {(selected.address || '').trim()
                  ? selected.address
                  : `${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-black text-white font-black text-xs no-underline"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
              >
                Google Maps
              </a>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gray-100 text-gray-700 font-black text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
