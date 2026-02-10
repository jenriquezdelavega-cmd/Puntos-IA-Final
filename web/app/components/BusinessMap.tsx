'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix icon paths (Leaflet en Next a veces no encuentra los assets)
const DefaultIcon = L.icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type Tenant = {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  googlePlaceId?: string;
};

function FitToFocus({
  focus,
  radiusKm,
}: {
  focus: [number, number] | null;
  radiusKm: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focus) return;

    // Ajusta vista para que el círculo de radiusKm quede en pantalla
    const circle = L.circle(focus as any, { radius: radiusKm * 1000 });
    map.fitBounds(circle.getBounds(), { padding: [24, 24] });
  }, [map, focus, radiusKm]);

  return null;
}

function BottomSheet({
  tenant,
  onClose,
}: {
  tenant: Tenant;
  onClose: () => void;
}) {
  const gmapsUrl = useMemo(() => {
    // Opción 1 (simple y robusta): coords directas
    const q = `${tenant.lat},${tenant.lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

    // Si luego quieres “Directions”:
    // return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
  }, [tenant.lat, tenant.lng]);

  return (
    <div className="absolute left-3 right-3 bottom-3 z-[500]">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">
              Negocio
            </p>
            <h3 className="text-lg font-black text-gray-900 leading-tight truncate">
              {tenant.name}
            </h3>
            {tenant.address ? (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {tenant.address}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Ubicación disponible por coordenadas
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="h-10 w-10 rounded-2xl bg-gray-100 text-gray-700 font-black hover:bg-gray-200 transition"
            aria-label="Cerrar"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-black text-white font-black py-3 rounded-2xl text-center shadow-md"
          >
            Abrir en Google Maps
          </a>

          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 bg-gray-100 text-gray-900 font-black px-4 py-3 rounded-2xl text-center border border-gray-200"
            title="Abrir"
          >
            🧭
          </a>
        </div>
      </div>
    </div>
  );
}

export default function BusinessMap({
  tenants,
  focusCoords,
  radiusKm = 50,
  selectedTenant,
  onSelectTenant,
}: {
  tenants: Tenant[];
  focusCoords: [number, number] | null;
  radiusKm?: number;
  selectedTenant?: Tenant | null;
  onSelectTenant?: (t: Tenant) => void;
}) {
  const mapRef = useRef<L.Map | null>(null);
  const [localSelected, setLocalSelected] = useState<Tenant | null>(null);

  // Usa selectedTenant si viene del padre; si no, usa selección local
  const active = selectedTenant ?? localSelected;

  const validTenants = useMemo(
    () =>
      (tenants || []).filter(
        (t) => typeof t?.lat === 'number' && typeof t?.lng === 'number'
      ),
    [tenants]
  );

  // Si no hay focusCoords, centra en promedio de negocios (para no caer en CDMX)
  const computedCenter = useMemo<[number, number]>(() => {
    if (focusCoords) return focusCoords;
    if (!validTenants.length) return [19.4326, -99.1332]; // fallback (CDMX) solo si no hay data

    const avgLat =
      validTenants.reduce((acc, t) => acc + t.lat, 0) / validTenants.length;
    const avgLng =
      validTenants.reduce((acc, t) => acc + t.lng, 0) / validTenants.length;
    return [avgLat, avgLng];
  }, [focusCoords, validTenants]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={computedCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="h-full w-full"
        whenReady={(e) => {
          mapRef.current = e.target;
        }}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Mantén el mapa siempre “cerca” del foco con radioKm */}
        <FitToFocus focus={computedCenter} radiusKm={radiusKm} />

        {/* Círculo visual de 50km (opcional, pero ayuda a ver el rango) */}
        <Circle
          center={computedCenter as any}
          radius={radiusKm * 1000}
          pathOptions={{ color: '#111', weight: 1, fillOpacity: 0.06 }}
        />

        {validTenants.map((t, idx) => (
          <Marker
            key={t.id ?? `${t.name}-${idx}`}
            position={[t.lat, t.lng]}
            eventHandlers={{
              click: () => {
                // 1) selecciona
                setLocalSelected(t);
                onSelectTenant?.(t);

                // 2) zoom cerca (fit a un círculo 50km centrado en el negocio)
                if (mapRef.current) {
                  const circle = L.circle([t.lat, t.lng] as any, {
                    radius: 50 * 1000,
                  });
                  mapRef.current.fitBounds(circle.getBounds(), {
                    padding: [24, 24],
                  });
                }
              },
            }}
          >
            <Popup>
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs opacity-70">
                Toca “Abrir en Google Maps” abajo
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {active && (
        <BottomSheet
          tenant={active}
          onClose={() => {
            setLocalSelected(null);
            onSelectTenant?.(null as any);
          }}
        />
      )}
    </div>
  );
}
