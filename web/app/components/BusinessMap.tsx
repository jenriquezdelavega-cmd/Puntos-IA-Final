'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 🔧 Arreglar iconos
const iconUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// 🎮 Controlador de Cámara
function MapController({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 16, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

export default function BusinessMap({ tenants, focusCoords }: { tenants: any[], focusCoords: [number, number] | null }) {
  const defaultCenter: [number, number] = [19.4326, -99.1332];

  return (
    <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        attribution='&copy; OpenStreetMap'
      />
      
      <MapController coords={focusCoords} />

      {tenants.map(t => (
         t.lat && t.lng ? (
           <Marker key={t.id} position={[t.lat, t.lng]}>
              <Popup>
                 <div className="text-center min-w-[150px]">
                     <strong className="text-base text-gray-900 block mb-1">{t.name}</strong>
                     <span className="text-xs text-gray-500 block mb-3">{t.address || 'Ubicación'}</span>
                     
                     {/* 🔗 ENLACE MEJORADO: Abre el pin directamente */}
                     <a 
                       href={`https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lng}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="bg-blue-600 text-white text-xs px-4 py-2 rounded-full font-bold block w-full hover:bg-blue-700 no-underline shadow-md transition-all"
                     >
                       🚗 Abrir en Google Maps
                     </a>
                 </div>
              </Popup>
           </Marker>
         ) : null
      ))}
    </MapContainer>
  );
}
