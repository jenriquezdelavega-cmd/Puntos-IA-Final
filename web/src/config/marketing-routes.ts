export const marketingRoutes = {
  home: '/',
  negocios: '/negocios',
  clientes: '/clientes',
  login: '/ingresar?tipo=cliente&modo=login',
  signup: '/ingresar?tipo=cliente&modo=registro',
  activatePass: '/activar-pase',
  businessDemo: 'mailto:ventas@puntoia.mx?subject=Demo%20Punto%20IA',
  contactSales: 'mailto:ventas@puntoia.mx?subject=Contacto%20Comercial%20Punto%20IA',
} as const;

export type MarketingRouteKey = keyof typeof marketingRoutes;
