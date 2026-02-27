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
  prize?: string;
  instagram?: string | null;
};

function instagramUrl(raw?: string | null) {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;

  // Already a URL (or protocol-relative)
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('//')) return `https:${v}`;

  // "instagram.com/..." without protocol
  if (/^instagram\.com\//i.test(v)) return `https://${v}`;
  if (/^www\.instagram\.com\//i.test(v)) return `https://${v}`;

  // Treat as handle
  const handle = v.replace(/^@/, '');
  if (!handle) return null;
  return `https://instagram.com/${handle}`;
}

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
  onCreatePass,
}: {
  tenants: Tenant[];
  focusCoords: [number, number] | null;
  radiusKm?: number;
  onCreatePass?: (tenant: Tenant) => void;
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

  // ✅ Radio local: al tocar un negocio, acercamos a 50km para que no se vea vacío
  const [localRadiusKm, setLocalRadiusKm] = useState<number>(radiusKm);

  const [selected, setSelected] = useState<Tenant | null>(null);

  useEffect(() => {
    setCenter(autoCenter);
    setFly(false);
    setLocalRadiusKm(radiusKm);
  }, [autoCenter, radiusKm]); // sync props → state (intentional)

  const onPick = (t: Tenant) => {
    setSelected(t);
    setCenter([t.lat, t.lng]);
    setLocalRadiusKm(50);
    setFly(true);
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoomForRadiusKm(localRadiusKm)}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapController center={center} radiusKm={localRadiusKm} fly={fly} />

        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Circle center={center} radius={localRadiusKm * 1000} pathOptions={{ opacity: 0.25, fillOpacity: 0.08 }} />

        {valid.map((t) => {
          const ig = instagramUrl(t.instagram);
          return (
            <Marker
              key={t.id || `${t.name}-${t.lat}-${t.lng}`}
              position={[t.lat, t.lng]}
              eventHandlers={{ click: () => onPick(t) }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="font-black text-gray-900 text-sm">{t.name}</div>
                  {(t.address || '').trim() && (
                    <div className="text-[11px] text-gray-500 mt-0.5">{t.address}</div>
                  )}
                  {t.prize && (
                    <div className="text-[10px] font-bold text-pink-500 mt-1">🎁 {t.prize}</div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {selected && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl p-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center text-white font-black text-sm shrink-0">
                {selected.name?.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-black text-gray-900 truncate">{selected.name}</div>
                <div className="text-[10px] text-gray-400 font-semibold truncate mt-0.5">
                  {(selected.address || '').trim() || `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`}
                </div>
              </div>
            </div>

            {selected.prize && (
              <div className="mt-2 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg px-3 py-1.5 border border-orange-100/50">
                <span className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">🎁 {selected.prize}</span>
              </div>
            )}

            <div className="mt-2.5 flex gap-2">
              {onCreatePass && (
                <button
                  onClick={() => onCreatePass(selected)}
                  className="flex-1 bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] text-white py-2 rounded-xl font-black text-[11px] shadow-sm"
                >
                  🎟️ Crear Pase
                </button>
              )}
              <a
                className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl font-bold text-[11px] no-underline text-center"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
              >
                📍 Cómo llegar
              </a>
              {instagramUrl(selected.instagram) && (
                <a
                  className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl font-bold text-[11px] no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={instagramUrl(selected.instagram)!}
                >
                  📸
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
