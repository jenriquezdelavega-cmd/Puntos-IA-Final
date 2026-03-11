export const pricingContent = {
  title: 'Precios simples y sin ataduras',
  description: 'Comienza gratis durante 15 días. Cancela en cualquier momento. Construido para potenciar las ventas de tu PyME.',
  trialCallout: '👉 15 días gratis para nuevos aliados',
  tiers: [
    {
      name: 'Starter',
      description: 'Ideal para cafeterías, barberías y locales probando la retención móvil.',
      price: {
        monthly: '$490',
        annual: '$390',
      },
      features: [
        '1 Sucursal',
        'Hasta 500 escaneos/mes',
        'Panel de Métricas Básico',
        'Apple y Google Wallet Integrados',
      ],
      cta: 'Empezar ahora',
      href: '/ingresar?tipo=negocio&modo=registro&plan=starter',
      highlight: false,
    },
    {
      name: 'Pro (Coalición)',
      description: 'Acércale tráfico nuevo a tu negocio participando en los retos de la red Punto IA.',
      price: {
        monthly: '$890',
        annual: '$690',
      },
      features: [
        'Hasta 3 Sucursales',
        'Escaneos ilimitados',
        'Acceso a la Red de Coalición',
        'Métricas de Tráfico Cruzado',
        'Notificaciones Push (Automáticas)',
      ],
      cta: 'Comenzar 15 días gratis',
      href: '/ingresar?tipo=negocio&modo=registro&plan=pro',
      highlight: true,
      badge: 'Más Popular',
    },
    {
      name: 'Corporativo',
      description: 'Para franquicias y negocios con múltiples unidades buscando control total y marca blanca.',
      price: {
        monthly: 'A medida',
        annual: 'A medida',
      },
      features: [
        'Sucursales Ilimitadas',
        'Pase Wallet Diseño Marca Blanca',
        'API Access y Webhooks',
        'Soporte Prioritario 24/7',
        'Reportes Personalizados',
      ],
      cta: 'Hablar con Ventas',
      href: 'mailto:ventas@puntoia.mx?subject=Consulta%20Plan%20Corporativo',
      highlight: false,
    },
  ],
};
