export const pricingContent = {
  title: 'Precios simples y sin ataduras',
  description: 'Empieza en días, no en meses. Prueba Punto IA durante 15 días y descubre cómo una experiencia de lealtad simple puede ayudarte a generar más recompra.',
  trialCallout: '👉 15 días gratis para nuevos aliados',
  tiers: [
    {
      name: 'Starter',
      description: 'Ideal para negocios que quieren empezar a premiar visitas y medir recompra sin complicarse.',
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
      name: 'Pro + Red de Coalición',
      description: 'Para negocios que quieren atraer tráfico adicional, activar recompensas más dinámicas y aprovechar la red de coalición Punto IA.',
      price: {
        monthly: '$890',
        annual: '$690',
      },
      features: [
        'Hasta 3 Sucursales',
        'Escaneos ilimitados',
        'Acceso a la Red de Coalición',
        'Métricas de visitas desde la red',
        'Recordatorios automáticos a clientes',
      ],
      cta: 'Comenzar 15 días gratis',
      href: '/ingresar?tipo=negocio&modo=registro&plan=pro',
      highlight: true,
      badge: 'Más Popular',
    },
    {
      name: 'Corporativo',
      description: 'Para franquicias y grupos con múltiples sucursales que necesitan control centralizado, marca blanca e integraciones avanzadas.',
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
