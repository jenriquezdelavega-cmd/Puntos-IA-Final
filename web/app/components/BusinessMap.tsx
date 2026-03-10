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

const BrandMarkerIcon = L.divIcon({
  className: '',
  html: `
    <span style="
      display:flex;
      align-items:center;
      justify-content:center;
      width:22px;
      height:22px;
      border-radius:999px;
      background:linear-gradient(140deg,#ff7a59 0%,#ff3f8e 62%,#8b5cf6 100%);
      border:2px solid #ffffff;
      box-shadow:0 8px 16px rgba(69,38,126,0.34);
    "></span>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -8],
});

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

  if (valid.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(150deg,#fffdf9_0%,#f7efff_100%)] p-6 text-center">
        <div className="max-w-sm rounded-2xl border border-[#ead8fb] bg-white/90 p-5 shadow-[0_12px_28px_rgba(63,37,115,0.1)]">
          <p className="text-sm font-black text-[#2b1b53]">No encontramos negocios para mostrar en el mapa</p>
          <p className="mt-2 text-xs font-semibold text-[#6e58a0]">Intenta actualizar o vuelve más tarde para ver aliados cercanos.</p>
        </div>
      </div>
    );
  }

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

        <Circle
          center={center}
          radius={localRadiusKm * 1000}
          pathOptions={{
            color: '#8b5cf6',
            opacity: 0.22,
            fillColor: '#d9c5ff',
            fillOpacity: 0.11,
          }}
        />

        {valid.map((t) => {
          return (
            <Marker
              key={t.id || `${t.name}-${t.lat}-${t.lng}`}
              position={[t.lat, t.lng]}
              icon={BrandMarkerIcon}
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
                        <div
                          className="h-full w-full rounded-md bg-white/10 bg-center bg-cover bg-no-repeat"
                          style={{ backgroundImage: 'url(/icono.png)' }}
                        />
                      )}
                    </div>
                    <div className="text-sm font-black text-[#291a50]">{t.name}</div>
                  </div>
                  {(t.address || '').trim() && (
                    <div className="mt-0.5 text-[11px] text-[#6c5799]">{t.address}</div>
                  )}
                  {t.prize && (
                    <div className="mt-1 text-[10px] font-bold text-[#b04e2f]">🎁 {t.prize}</div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[500]">
        <div className="rounded-xl border border-[#e8daf9] bg-white/95 px-3 py-2 text-[11px] font-semibold text-[#5f4a89] shadow-[0_8px_18px_rgba(49,30,94,0.16)] backdrop-blur-sm">
          <p className="font-black text-[#2b1b53]">{valid.length} negocios visibles</p>
          <p>Radio actual: {localRadiusKm} km</p>
        </div>
      </div>

      {selected && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3">
          <div className="pointer-events-auto rounded-2xl border border-[#e8daf9] bg-white/96 p-3.5 shadow-[0_14px_28px_rgba(61,37,112,0.22)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl border border-[#3b2668] bg-[linear-gradient(120deg,#2a184f_0%,#1e133b_55%,#3a2368_100%)] p-1">
                {selected.logoData ? (
                  <div
                    className="h-full w-full rounded-lg bg-center bg-contain bg-no-repeat"
                    style={{ backgroundImage: `url(${selected.logoData})` }}
                  />
                ) : (
                  <div
                    className="h-full w-full rounded-lg bg-white/10 bg-center bg-cover bg-no-repeat"
                    style={{ backgroundImage: 'url(/icono.png)' }}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-black text-[#2a1a52]">{selected.name}</div>
                <div className="mt-0.5 truncate text-[10px] font-semibold text-[#77629f]">
                  {(selected.address || '').trim() || `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`}
                </div>
              </div>
            </div>

            {selected.prize && (
              <div className="mt-2 rounded-lg border border-[#f8ddcc] bg-gradient-to-r from-[#fff2ea] to-[#fff4fb] px-3 py-1.5">
                <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-[10px] font-black text-transparent">🎁 {selected.prize}</span>
              </div>
            )}

            <div className="mt-2.5 flex flex-wrap gap-2">
              {onCreatePass && (
                <button
                  onClick={() => onCreatePass(selected)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] py-2 text-[11px] font-black text-white shadow-[0_8px_16px_rgba(255,74,147,0.28)]"
                >
                  Abrir pase
                </button>
              )}
              <a
                className="flex-1 rounded-xl border border-[#dfd0f6] bg-[#faf5ff] py-2 text-center text-[11px] font-bold text-[#4f3a7b] no-underline"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
              >
                Cómo llegar
              </a>
              {instagramUrl(selected.instagram) && (
                <a
                  className="rounded-xl border border-[#dfd0f6] bg-[#faf5ff] px-3 py-2 text-[11px] font-bold text-[#4f3a7b] no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={instagramUrl(selected.instagram)!}
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
