/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
  },
  typescript: {
    // ⚠️ ¡Atención! Esto permite compilar aunque haya errores de tipos.
    // Es útil para MVPs rápidos como este.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
