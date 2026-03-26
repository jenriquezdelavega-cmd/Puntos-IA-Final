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
      eyebrow: 'LEALTAD PARA PyMEs EN MÉXICO',
      title: 'Haz que tus clientes regresen más seguido',
      description: 'Punto IA es una plataforma de lealtad para PyMEs en México. Activa recompensas, Wallet y métricas en tiempo real desde una sola plataforma.',
      chips: ['Wallet Nativos', 'Datos en Tiempo Real', 'Operación Simple'],
      primaryCta: { label: 'Agendar demo', href: marketingRoutes.businessDemo } satisfies Cta,
      secondaryCta: { label: 'Ver cómo funciona', href: '#como-funciona' } satisfies Cta,
      b2bImage: {
        src: '/images/negocios/negocios-hero-dashboard.jpg',
        alt: 'Panel de control de Punto IA para negocios',
      },
      b2cImage: {
        src: '/images/clientes/clientes-hero-wallet.jpg',
        alt: 'Pase digital Wallet de Punto IA en celular',
      },
    },
    bento: {
      title: 'Lealtad premium, sin fricciones',
      description: 'Diseñada para negocios que quieren retener mejor, operar rápido y dar una experiencia moderna a sus clientes.',
      items: [
        {
          title: 'Wallet listo para usar',
          description: 'El cliente guarda su pase en Apple Wallet o Google Wallet. Sin descargar aplicaciones adicionales.',
          colSpan: 1,
          rowSpan: 1,
          icon: <WalletCards strokeWidth={1.5} />,
        },
        {
          title: 'Escaneo rápido en caja',
          description: 'Lee el pase de tu cliente en fracciones de segundo y registra la visita sin retrasar tu operación.',
          colSpan: 2,
          rowSpan: 1,
          icon: <Zap strokeWidth={1.5} />,
        },
        {
          title: 'Red de negocios aliada',
          description: 'Atrae clientes nuevos desde otros comercios afiliados a la red de coalición de Punto IA.',
          colSpan: 2,
          rowSpan: 1,
          highlight: true,
          icon: <Network strokeWidth={1.5} />,
        },
        {
           title: 'Métricas en tiempo real',
           description: 'Conoce exactamente quién vino hoy, quién es tu mejor cliente y quién no ha regresado este mes.',
           colSpan: 1,
           rowSpan: 1,
           icon: <Target strokeWidth={1.5} />,
        },
        {
           title: 'Recompensas por visitas',
           description: 'Premia automáticamente a tus clientes recurrentes sin usar tarjetas de cartón ni sellos.',
           colSpan: 1,
           rowSpan: 1,
           icon: <Flame strokeWidth={1.5} />,
        }
      ]
    },
    journey: {
      title: 'De la primera visita al cliente frecuente',
      subtitle: 'Así funciona Punto IA dentro de tu operación.',
      steps: [
         {
            title: '1. Define tus recompensas',
            description: 'Configura en minutos qué gana tu cliente por volver.',
            imageSrc: '/images/negocios/negocios-hero-dashboard.jpg',
         },
         {
            title: '2. Escanea al momento del pago',
            description: 'Tu cliente muestra su Wallet o QR y el sistema registra la visita en segundos.',
            imageSrc: '/images/home/home-how-it-works.jpg',
         },
         {
            title: '3. Activa la recompra',
            description: 'Mide resultados y recupera clientes con recordatorios y beneficios.',
            imageSrc: '/images/negocios/negocios-operation-scene.jpg',
         }
      ]
    },
    cta: {
      title: 'Haz que más clientes vuelvan a tu negocio',
      description: 'Agenda una demo y descubre cómo Punto IA puede ayudarte a aumentar recompra, frecuencia y retención.',
      primary: { label: 'Agendar demo', href: marketingRoutes.businessDemo } satisfies Cta,
      secondary: { label: 'Ver precios', href: marketingRoutes.precios } satisfies Cta,
    },
  },
  negocios: {
    hero: {
      eyebrow: 'LEALTAD PARA PyMEs',
      title: 'Compite como gigante. Crece como local.',
      description: 'Activa un programa de lealtad con Wallet, gamificación y pases personalizados con la identidad de tu negocio para aumentar la frecuencia de compra y hacer que tus clientes regresen más seguido.',
      chips: ['Wallet Pass Integrado', 'Red de Coalición', 'Dashboard en Tiempo Real'],
      primaryCta: { label: 'Agendar demo', href: marketingRoutes.businessDemo } satisfies Cta,
      secondaryCta: { label: 'Empezar ahora', href: marketingRoutes.precios } satisfies Cta,
      b2bImage: {
        src: '/images/negocios/negocios-hero-dashboard.jpg',
        alt: 'Panel de Punto IA para negocios',
      },
      b2cImage: {
        src: '/images/negocios/negocios-operation-scene.jpg',
        alt: 'Operación en el punto de venta',
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
      eyebrow: 'RECOMPENSAS SIN FRICCIÓN',
      title: 'Tus visitas ahora valen más',
      description: 'Guarda tu pase en Wallet, acumula beneficios y recibe recompensas en tus negocios favoritos.',
      chips: ['Apple Wallet', 'Google Wallet', 'Sin Descargar Apps'],
      primaryCta: { label: 'Iniciar sesión', href: marketingRoutes.login } satisfies Cta,
      secondaryCta: { label: 'Crear cuenta', href: marketingRoutes.signup } satisfies Cta,
      b2bImage: {
        src: '/images/clientes/clientes-hero-wallet.jpg',
        alt: 'Cliente usando Punto IA',
      },
      b2cImage: {
        src: '/images/clientes/clientes-steps-pass.jpg',
        alt: 'Escaneo de Punto IA en celular',
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
