/* eslint-disable @typescript-eslint/no-explicit-any */
// Compat layer for newer TypeScript/React type definitions used in CI.

declare global {
  interface Body {
    json(): Promise<any>;
  }
}

declare module 'react-leaflet' {
  export const MapContainer: any;
  export const TileLayer: any;
  export const Marker: any;
  export const Circle: any;
  export const Popup: any;
  export const useMap: any;
  export const useMapEvents: any;
}

declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: any;
}

export {};
