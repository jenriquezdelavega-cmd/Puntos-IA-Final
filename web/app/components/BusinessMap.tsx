'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix de íconos en Next (evita que el marcador salga sin imagen)
// Usamos URLs públicas para no depender del bundling.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type Coords = [number, number];

type Tenant = {
  id?: string;
  name?: string;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
};

function boundsAround(center: Coords, radiusKm: number) {
  const [lat, lng] = center;
  const latRad = (lat * Math.PI) / 180;

  const latDelta = radiusKm / 111; // ~111km por grado de latitud
  const lngDelta = radiusKm / (111 * Math.max(0.15, Math.cos(latRad)));

  return L.latLngBounds(
    [lat - latDelta, lng - lngDelta],
    [lat + latDelta, lng + lngDelta]
  );
}

function avgCenter(points: Coords[]): Coords {
  const sum = points.reduce(
    (acc, p) => [acc[0] + p[0], acc[1] + p[1]] as Coords,
    [0, 0]
  );
  return [sum[0] / points.length, sum[1] / points.length];
}

function Fitter({
  focusCoords,
  coords,
  radiusKm,
}: {
  focusCoords: Coords | null;
  coords: Coords[];
  radiusKm: number;
}) {
  const map = useMap();

  useEffect(() => {
    // 1) Si hay foco explícito (por ejemplo al tocar un negocio), centra en ese punto
    if (focusCoords) {
      map.fitBounds(boundsAround(focusCoords, radiusKm), {
        padding: [24, 24],
        animate: true,
      });
      return;
    }

    // 2) Si hay negocios, centra y abre el zoom para cubrir ~500km alrededor
    if (coords.length > 0) {
      const center = avgCenter(coords);

      // Fit a los negocios + “colchón” de 500km
      const tenantsBounds = L.latLngBounds(coords.map((c) => L.latLng(c[0], c[1])));
      const padded = boundsAround(center, radiusKm);
      tenantsBounds.extend(padded);

      map.fitBounds(tenantsBounds, {
        padding: [24, 24],
        animate: true,
      });
      return;
    }

    // 3) Fallback (si todavía no carga data)
    map.setView([19.4326, -99.1332], 5, { animate: false });
  }, [map, focusCoords, coords, radiusKm]);

  return null;
}

export default function BusinessMap({
  tenants,
  focusCoords,
  radiusKm = 10,
}: {
  tenants: Tenant[];
  focusCoords?: Coords | null;
  radiusKm?: number;
}) {
  const coords = useMemo(() => {
    return (tenants || [])
      .filter((t) => typeof t.lat === 'number' && typeof t.lng === 'number')
      .map((t) => [t.lat as number, t.lng as number] as Coords);
  }, [tenants]);

  const initialCenter = useMemo<Coords>(() => {
    if (focusCoords) return focusCoords;
    if (coords.length > 0) return avgCenter(coords);
    return [19.4326, -99.1332];
  }, [focusCoords, coords]);

  return (
    <div className="w-full h-full">
      <MapContainer
        center={initialCenter}
        zoom={1}
        scrollWheelZoom
        className="w-full h-full rounded-2xl"
        style={{ minHeight: 360 }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Fitter focusCoords={focusCoords ?? null} coords={coords} radiusKm={radiusKm} />

        {(tenants || [])
          .filter((t) => typeof t.lat === 'number' && typeof t.lng === 'number')
          .map((t) => (
            <Marker
              key={t.id || `${t.name}-${t.lat}-${t.lng}`}
              position={[t.lat as number, t.lng as number]}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-black">{t.name || 'Negocio'}</div>
                  {t.address ? (
                    <div className="text-xs opacity-80 mt-1">{t.address}</div>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
