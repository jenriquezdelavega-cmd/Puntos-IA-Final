'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// 🔧 CORRECCIÓN DE ICONOS LEAFLET (Para que se vean los pines)
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

// 🎮 CONTROLADOR PARA MOVER EL MAPA
function MapController({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 16, { duration: 2 });
    }
  }, [coords, map]);
  return null;
}

// 🗺️ COMPONENTE PRINCIPAL DEL MAPA
export default function BusinessMap({ tenants, focusCoords }: { tenants: any[], focusCoords: [number, number] | null }) {
  // Centro por defecto (CDMX o el primer tenant)
  const defaultCenter: [number, number] = [19.4326, -99.1332];

  return (
    <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer 
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      
      {/* Controlador invisible que mueve la cámara */}
      <MapController coords={focusCoords} />

      {tenants.map(t => (
         t.lat && t.lng ? (
           <Marker key={t.id} position={[t.lat, t.lng]}>
              <Popup>
                 <div className="text-center">
                     <strong className="text-base text-gray-800 block mb-1">{t.name}</strong>
                     <span className="text-xs text-gray-500 block mb-2">{t.address || 'Ubicación'}</span>
                     <span className="text-pink-600 font-bold text-xs mb-2 block">🏆 {t.prize}</span>
                     <a 
                       href={`https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-bold inline-block hover:bg-blue-700 no-underline"
                     >
                       🚗 Cómo llegar
                     </a>
                 </div>
              </Popup>
           </Marker>
         ) : null
      ))}
    </MapContainer>
  );
}
