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
  logoData?: string | null;
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

function businessInitial(name?: string) {
  const clean = String(name || '').trim();
  return clean ? clean.charAt(0).toUpperCase() : 'N';
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

  const [selected, setSelected] = useState<Tenant | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (selected) return [selected.lat, selected.lng];
    return autoCenter;
  }, [selected, autoCenter]);

  // ✅ Radio local: al tocar un negocio, acercamos a 50km para que no se vea vacío
  const localRadiusKm = selected ? 50 : radiusKm;
  const fly = Boolean(selected);

  const onPick = (t: Tenant) => {
    setSelected(t);
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
          return (
            <Marker
              key={t.id || `${t.name}-${t.lat}-${t.lng}`}
              position={[t.lat, t.lng]}
              eventHandlers={{ click: () => onPick(t) }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 shrink-0 rounded-lg border border-[#3b2668] bg-[linear-gradient(120deg,#2a184f_0%,#1e133b_55%,#3a2368_100%)] p-0.5">
                      {t.logoData ? (
                        <div
                          className="h-full w-full rounded-md bg-center bg-contain bg-no-repeat"
                          style={{ backgroundImage: `url(${t.logoData})` }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-md bg-white/10 text-xs font-black text-white">
                          {businessInitial(t.name)}
                        </div>
                      )}
                    </div>
                    <div className="font-black text-gray-900 text-sm">{t.name}</div>
                  </div>
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
              <div className="h-11 w-11 shrink-0 rounded-xl border border-[#3b2668] bg-[linear-gradient(120deg,#2a184f_0%,#1e133b_55%,#3a2368_100%)] p-1">
                {selected.logoData ? (
                  <div
                    className="h-full w-full rounded-lg bg-center bg-contain bg-no-repeat"
                    style={{ backgroundImage: `url(${selected.logoData})` }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-white/10 text-sm font-black text-white">
                    {businessInitial(selected.name)}
                  </div>
                )}
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
