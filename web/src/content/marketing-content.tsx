import React from 'react';
import { marketingRoutes } from '@/src/config/marketing-routes';
import { 
  Zap, 
  LineChart, 
  BellRing, 
  Network, 
  ShieldCheck, 
  WalletCards, 
  Flame, 
  Target, 
  Smartphone,
  ScanFace 
} from 'lucide-react';type Cta = { label: string; href: string };
type Step = { title: string; description: string };
type Feature = { title: string; description: string; icon?: string };

export const marketingContent = {
  nav: [
    { label: 'Inicio', href: marketingRoutes.home },
    { label: 'Negocios', href: marketingRoutes.negocios },
    { label: 'Clientes', href: marketingRoutes.clientes },
    { label: 'Precios', href: marketingRoutes.precios },
    { label: 'Entrar', href: marketingRoutes.login },
  ],
  home: {
    hero: {
      eyebrow: 'LA PLATAFORMA DE LEALTAD N°1 PARA NEGOCIOS LOCALES',
      title: 'Deja de perder a los clientes que te visitaron solo una vez',
      description: 'Punto IA transforma a compradores ocasionales en clientes frecuentes. Activa recompensas en Apple Wallet y Google Wallet, y mide tus ventas recurrentes en tiempo real.',
      chips: ['💳 Wallet Nativos', '📊 Datos en Tiempo Real', '⚡ Operación en Segundos'],
      primaryCta: { label: 'Comenzar prueba gratis', href: marketingRoutes.businessDemo } satisfies Cta,
      secondaryCta: { label: 'Descubrir cómo funciona', href: '#como-funciona' } satisfies Cta,
      b2bImage: {
        src: '/images/negocios/negocios-hero-dashboard.jpg',
        alt: 'Panel de control de Punto IA para negocios detallando visitas y ganancias',
      },
      b2cImage: {
        src: '/images/clientes/clientes-hero-wallet.jpg',
        alt: 'Pase digital Wallet de Punto IA instalado en el celular de un cliente',
      },
    },
    bento: {
      title: 'Retención de clase mundial comercial, accesible para tu negocio',
      description: 'Olvídate de las tarjetas de cartón que se pierden o las tablets que estorban. Lleva tu fidelización directamente al celular de tus clientes.',
      items: [
        {
           title: 'Directo en su Wallet Digital',
           description: 'El cliente guarda su pase con tu marca en Apple Wallet o Google Wallet al instante. Sin apps de terceros que nadie descarga.',
           colSpan: 1,
           rowSpan: 1,
           icon: <WalletCards strokeWidth={1.5} />,
        },
        {
           title: 'Escaneo en fracciones de segundo',
           description: 'Desde el panel de operador, escaneas el código del cliente y la visita se registra de inmediato. Cero fricción en tu punto de venta.',
           colSpan: 2,
           rowSpan: 1,
           icon: <Zap strokeWidth={1.5} />,
        },
        {
           title: 'Red de negocios aliados (Coalición)',
           description: 'Forma parte de un ecosistema donde los comercios se envían clientes entre sí mediante misiones y recompensas cruzadas.',
           colSpan: 2,
           rowSpan: 1,
           highlight: true,
           icon: <Network strokeWidth={1.5} />,
        },
        {
           title: 'Métricas de retención claras',
           description: 'Descubre al instante cuántos clientes vuelven, quién es tu cliente top y qué recompensas generan más ganancias.',
           colSpan: 1,
           rowSpan: 1,
           icon: <Target strokeWidth={1.5} />,
        },
        {
           title: 'Automatización de recompensas',
           description: 'El sistema notifica al cliente y actualiza su pase automáticamente cuando alcanza su premio. Tú solo entregas el beneficio.',
           colSpan: 1,
           rowSpan: 1,
           icon: <Flame strokeWidth={1.5} />,
        }
      ]
    },
    journey: {
      title: 'Tu programa de lealtad funcionando en 3 simples pasos',
      subtitle: 'Sin hardware costoso ni implementaciones técnicas de semanas.',
      steps: [
         {
            title: '1. Configura tus reglas y diseña tu pase',
            description: 'Sube tu logo, elige tus colores y decide cuántas visitas necesitan tus clientes para ganar su premio.',
            imageSrc: '/images/negocios/negocios-hero-dashboard.jpg',
         },
         {
            title: '2. Escanea en la caja al pagar',
            description: 'Tus clientes muestran su celular, lo escaneas con la cámara del panel y sumas su visita al instante.',
            imageSrc: '/images/home/home-how-it-works.jpg',
         },
         {
            title: '3. Aumenta tus ventas recurrentes (Retención)',
            description: 'Usa nuestras métricas para enviar notificaciones Push y hacer que vuelvan cuando tus ventas estén lentas.',
            imageSrc: '/images/negocios/negocios-operation-scene.jpg',
         }
      ]
    },
    cta: {
      title: 'El hardware más poderoso para retener clientes ya está en el bolsillo de ellos',
      description: 'Lanza tu sistema de lealtad hoy mismo y ve cómo tus ventas mensuales aumentan gracias a clientes verdaderamente recurrentes.',
      primary: { label: 'Comenzar 15 días gratis', href: marketingRoutes.businessDemo } satisfies Cta,
      secondary: { label: 'Analizar planes', href: marketingRoutes.precios } satisfies Cta,
    },
  },
  negocios: {
    hero: {
      eyebrow: 'EL MOTOR DE CRECIMIENTO PARA DUEÑOS',
      title: 'Compite como gigante. Fideliza como local.',
      description: 'Toma el control absoluto de tus clientes recurrentes. Sin hardware extra, sin integraciones eternas, y con la misma tecnología de fidelidad que hoy usan las grandes cadenas (Apple Wallet / Google Wallet).',
      chips: ['✅ Reportes de Usuarios', '✅ Cero Hardware Extra', '✅ Setup en 5 minutos'],
      primaryCta: { label: 'Iniciar prueba gratuita', href: marketingRoutes.businessDemo } satisfies Cta,
      secondaryCta: { label: 'Ver precios transparentes', href: marketingRoutes.precios } satisfies Cta,
      b2bImage: {
        src: '/images/negocios/negocios-hero-dashboard.jpg',
        alt: 'Estadísticas de retención y visitas dentro del panel Punto IA',
      },
      b2cImage: {
        src: '/images/negocios/negocios-operation-scene.jpg',
        alt: 'Personal del negocio registrando una visita fácilmente',
      },
    },
    bento: {
      title: 'Todo el poder, cero complicaciones',
      description: 'Herramientas diseñadas para que el dueño de negocio tome el control de sus ventas recurrentes.',
      items: [
        {
          title: 'Wallet listo para usar',
          description: 'Tus clientes guardan su pase en Apple Wallet o Google Wallet y lo usan fácilmente en cada visita.',
          colSpan: 2,
          rowSpan: 1,
          icon: <WalletCards strokeWidth={1.5} />,
        },
        {
          title: 'Gamificación que impulsa consumo',
          description: 'Activa retos, metas y recompensas para motivar a tus clientes a volver y también consumir en negocios aliados de la red.',
          colSpan: 1,
          rowSpan: 1,
          highlight: true,
          icon: <Target strokeWidth={1.5} />,
        },
        {
          title: 'Pases con tu identidad de marca',
          description: 'Personaliza los pases con el nombre, colores e identidad visual de tu negocio para dar una experiencia más profesional y consistente.',
          colSpan: 1,
          rowSpan: 1,
          icon: <Smartphone strokeWidth={1.5} />,
        },
        {
          title: 'Escaneo rápido en caja',
          description: 'El cliente muestra su pase y el sistema registra la visita en segundos, sin frenar la operación.',
          colSpan: 1,
          rowSpan: 1,
          icon: <ScanFace strokeWidth={1.5} />,
        },
        {
          title: 'Métricas para entender la recompra',
          description: 'Mide visitas, frecuencia y participación para saber qué acciones realmente hacen volver al cliente.',
          colSpan: 1,
          rowSpan: 1,
          icon: <LineChart strokeWidth={1.5} />,
        }
      ]
    },
    journey: {
      title: 'De la primera visita al cliente leal',
      subtitle: 'Así es como Punto IA transforma tu flujo comercial desde el día uno.',
      steps: [
        {
          title: 'Paso 1: Define tus recompensas',
          description: 'Configura en minutos visitas, beneficios o premios desde la nube.',
          imageSrc: '/images/negocios/case-cafe.jpg',
        },
        {
          title: 'Paso 2: Activa tu pase personalizado',
          description: 'Tus clientes guardan un pase con la identidad de tu negocio en Apple Wallet o Google Wallet y lo usan fácilmente en cada visita.',
          imageSrc: '/images/negocios/case-barber.jpg',
        },
        {
          title: 'Paso 3: Impulsa la recompra',
          description: 'Con escaneo rápido, métricas y dinámicas de gamificación, conviertes visitas en clientes frecuentes.',
          imageSrc: '/images/negocios/case-boutique.jpg',
        }
      ]
    },
    cta: {
      title: 'Haz que más clientes vuelvan a tu negocio',
      description: 'Agenda una demo y descubre cómo Punto IA puede ayudarte a aumentar recompra, frecuencia y retención con Wallet y pases personalizados.',
      primary: { label: 'Agendar demo', href: marketingRoutes.businessDemo } satisfies Cta,
      secondary: { label: 'Hablar con ventas', href: marketingRoutes.contactSales } satisfies Cta,
    },
  },
  clientes: {
    hero: {
      eyebrow: 'TU BILLETERA DE RECOMPENSAS',
      title: 'Tus visitas diarias, ahora valen premios',
      description: 'Deja de perder tarjetas de cartón. Guarda tu pase directamente en Wallet, visita tus lugares favoritos y recibe notificaciones cuando tengas beneficios desbloqueados.',
      chips: ['🍏 Apple Wallet', '🤖 Google Wallet', '🚀 Cero descargas'],
      primaryCta: { label: 'Acceder a tus recompensas', href: marketingRoutes.login } satisfies Cta,
      secondaryCta: { label: 'Registrarse gratis', href: marketingRoutes.signup } satisfies Cta,
      b2bImage: {
        src: '/images/clientes/clientes-hero-wallet.jpg',
        alt: 'Cliente usando Punto IA para canjear un pase',
      },
      b2cImage: {
        src: '/images/clientes/clientes-steps-pass.jpg',
        alt: 'Notificación de recompensa alcanzada en Apple Wallet',
      },
    },
    bento: {
      title: 'Mucho más que puntos sueltos',
      description: 'Una billetera digital inteligente que agrupa todos tus negocios favoritos en un solo pase.',
      items: [
        {
          title: 'Siempre contigo en tu celular',
          description: 'Tu pase vive en la app nativa de Apple Wallet o Google Wallet. Más accesible, imposible.',
          colSpan: 1,
          rowSpan: 1,
          icon: <Smartphone strokeWidth={1.5} />,
        },
        {
          title: 'Gana más en negocios participantes',
          description: 'Desbloquea misiones épicas al recorrer la coalición de comercios aliados de Punto IA.',
          colSpan: 2,
          rowSpan: 1,
          highlight: true,
          icon: <Target strokeWidth={1.5} />,
        },
        {
          title: 'Acceso seguro y rápido',
          description: 'Te reconocen y recompensan al instante, respaldado con cifrado de grado bancario.',
          colSpan: 3,
          rowSpan: 1,
          icon: <ShieldCheck strokeWidth={1.5} />,
        }
      ]
    },
    journey: {
      title: 'Así empiezas a ganar beneficios',
      subtitle: 'Solo te toma unos segundos comenzar a ganar.',
      steps: [
        {
          title: 'Paso 1: Escanea al pagar',
          description: 'Tu visita se registra en segundos.',
          imageSrc: '/images/clientes/clientes-hero-wallet.jpg',
        },
        {
          title: 'Paso 2: Guarda tu pase',
          description: 'Agrégalo a tu Wallet y úsalo fácilmente desde tu celular.',
          imageSrc: '/images/clientes/clientes-steps-pass.jpg',
        },
        {
          title: 'Paso 3: Recibe tus premios',
          description: 'Cada visita te acerca a nuevos beneficios y recompensas.',
          imageSrc: '/images/home/home-hero-business-client.jpg',
        }
      ]
    },
    cta: {
      title: '¿Listo para activar tus recompensas?',
      description: 'Lleva tu pase contigo y ayuda al comercio local mientras ganas beneficios.',
      primary: { label: 'Iniciar sesión', href: marketingRoutes.login } satisfies Cta,
      secondary: { label: 'Crear cuenta', href: marketingRoutes.signup } satisfies Cta,
    },
  },
} as const;
