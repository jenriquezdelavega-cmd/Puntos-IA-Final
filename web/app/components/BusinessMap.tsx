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
  // Aproximación práctica (Leaflet): 50km ~ zoom 11, 100km ~ 10, 500km ~ 7
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

// Icono default (Leaflet en Next)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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

  // Centro “inteligente”: focusCoords → promedio negocios → fallback Monterrey
  const autoCenter = useMemo<[number, number]>(() => {
    if (focusCoords) return focusCoords;
    if (valid.length) {
      const avgLat = valid.reduce((a, t) => a + t.lat, 0) / valid.length;
      const avgLng = valid.reduce((a, t) => a + t.lng, 0) / valid.length;
      return [avgLat, avgLng];
    }
    return [25.6866, -100.3161];
  }, [focusCoords, valid]);

  const [center, setCenter] = useState<[number, number]>(autoCenter);
  const [fly, setFly] = useState(false);
  const [selected, setSelected] = useState<Tenant | null>(null);

  // 👇 Radio “dinámico” para que al seleccionar negocio se acerque a 50km
  const [viewRadiusKm, setViewRadiusKm] = useState<number>(radiusKm);

  // Cuando cambia el foco externo (desde tarjeta), usamos el radio normal (prop)
  useEffect(() => {
    setCenter(autoCenter);
    setFly(false);
    setSelected(null);
    setViewRadiusKm(radiusKm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCenter?.[0], autoCenter?.[1], radiusKm]);

  // Click a negocio: acercar a 50km y abrir opciones (popup + barra)
  const onPick = (t: Tenant) => {
    setSelected(t);
    setCenter([t.lat, t.lng]);
    setViewRadiusKm(50);
    setFly(true);
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoomForRadiusKm(viewRadiusKm)}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <MapController center={center} radiusKm={viewRadiusKm} fly={fly} />

        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Zona visible para que no se vea vacío */}
        <Circle center={center} radius={viewRadiusKm * 1000} pathOptions={{ opacity: 0.25, fillOpacity: 0.08 }} />

        {valid.map((t) => (
          <Marker
            key={t.id || `${t.name}-${t.lat}-${t.lng}`}
            position={[t.lat, t.lng]}
            icon={DefaultIcon}
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

      {/* Barra inferior cuando seleccionas un negocio */}
      {selected && (
        <div className="pointer-events-none absolute bottom-4 left-4 right-4">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-3 shadow-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-black text-gray-900 truncate">{selected.name}</div>
              <div className="text-xs text-gray-500 truncate">
                {(selected.address || '').trim()
                  ? selected.address
                  : `${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`}
              </div>
            </div>

            <a
              className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-black text-white font-black text-xs no-underline"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
            >
              Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
