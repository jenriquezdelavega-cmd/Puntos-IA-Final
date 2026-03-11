import { marketingRoutes } from '@/src/config/marketing-routes';

type Cta = { label: string; href: string };
type Step = { title: string; description: string };
type Feature = { title: string; description: string; icon?: string };

export const marketingContent = {
  nav: [
    { label: 'Inicio', href: marketingRoutes.home },
    { label: 'Negocios', href: marketingRoutes.negocios },
    { label: 'Clientes', href: marketingRoutes.clientes },
    { label: 'Entrar', href: marketingRoutes.login },
  ],
  home: {
    hero: {
      eyebrow: 'Ecosistema de Lealtad en México',
      title: 'Conectando Negocios con Clientes Que Regresan.',
      description:
        'Punto IA une a los comercios locales que quieren retener clientes, con los compradores que aman recibir valor. Una sola plataforma, dos experiencias increíbles.',
      chips: ['Sin apps raras', 'Wallet Nativos (Apple/Google)', 'Datos en Tiempo Real'],
      primaryCta: { label: 'Agendar Demo (Negocios)', href: marketingRoutes.businessDemo } satisfies Cta,
      secondaryCta: { label: 'Entrar o Activar Pase (Clientes)', href: marketingRoutes.login } satisfies Cta,
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
      title: 'Lealtad Premium. Sin Fricciones.',
      description: 'Diseñamos la plataforma que siempre quisiste usar, para el negocio y el cliente.',
      items: [
        {
          title: 'Conexión desde el Celular',
          description: 'El cliente solo abre su cámara, activa su pase digital y lo guarda en su Wallet. Listo. Jamás le pediremos que descargue otra App más que ocupa espacio.',
          colSpan: 1,
          rowSpan: 1,
          icon: '✨',
        },
        {
          title: 'Operación Claro que Funciona',
          description: 'Tu equipo en caja solo pide el número, o escanea el QR en un segundo. Cero filas lentas. Cero confusiones. La magia sucede automáticamente en la nube.',
          colSpan: 2,
          rowSpan: 1,
          icon: '🚀',
        },
        {
          title: 'Coalición de Aliados (Pro)',
          description: 'A medida que la red crece, se activan retos cruzados. Tus clientes pueden ganar puntos extra por visitar otros negocios aliados, y tú recibes tráfico de la red completa. Compite al nivel de las grandes corporaciones.',
          colSpan: 2,
          rowSpan: 1,
          highlight: true,
          icon: '🤝',
        },
        {
           title: 'Métricas Reales',
           description: 'Entra a tu dashboard para ver exactamente quién vino hoy y quién regresó este mes.',
           colSpan: 1,
           rowSpan: 1,
           icon: '📈',
        },
        {
           title: 'Mayor Engagement',
           description: 'Al ser un Wallet pass nativo y no una app olvidada, tus clientes interactúan hasta 3x más con tus recompensas y campañas de retención.',
           colSpan: 1,
           rowSpan: 1,
           icon: '🔥',
        }
      ]
    },
    journey: {
      title: 'Un Flujo. Dos Ganadores.',
      subtitle: 'La magia de Punto IA sucede cuando el negocio y el cliente interactúan en el mismo ecosistema.',
      steps: [
         {
            title: 'Configura tus Recompensas',
            description: 'Como negocio, entras a tu Dashboard y defines qué vas a regalar (ej. Café al 5to escaneo). Toma literalmente 3 minutos decidirlo.',
            imageSrc: '/images/negocios/negocios-operation-scene.jpg',
         },
         {
            title: 'El Cliente Activa su Pase',
            description: 'En su primera visita, el cliente ve tu letrero QR. Escanea, pone su nombre y WhatsApp y ¡PUM! Recibe su tarjeta digital en su iPhone o Android.',
            imageSrc: '/images/clientes/clientes-steps-pass.jpg',
         },
         {
            title: 'Crecemos Juntos',
            description: 'El cliente vuelve porque sabe que le recompensas. Tu cajero lo escanea en 1 segundo y a ti te suben los números y tickets promedios en tu panel.',
            imageSrc: '/images/home/home-how-it-works.jpg',
         }
      ]
    },
    cta: {
      title: 'Elige tu camino',
      description:
        'Únete a la nueva era de la fidelización comercial. ¿Buscas retener clientes o vienes a canjear tus puntos?',
      primary: { label: 'Crecer mi negocio', href: marketingRoutes.negocios } satisfies Cta,
      secondary: { label: 'Acceder a mi cuenta', href: marketingRoutes.login } satisfies Cta,
    },
  },
  negocios: {
    hero: {
      eyebrow: 'Lealtad para PyMEs',
      title: 'Compite como Gigante. Crece como Local.',
      description:
        'Punto IA le da a tu PyME la misma tecnología de lealtad y retención que usan las grandes corporaciones. Aumenta el engagement de tus clientes y únete a la coalición de aliados.',
      chips: ['Wallet Pass Integrado', 'Retos de Coalición', 'Dashboard en Tiempo Real'],
      primaryCta: { label: 'Agendar demo', href: marketingRoutes.businessDemo } satisfies Cta,
      secondaryCta: { label: 'Empezar ahora', href: marketingRoutes.signup } satisfies Cta,
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
          title: 'Red de Coalición',
          description: 'Únete a otros negocios locales. Cuando la red crece, se activan retos especiales (ej. "Visita 3 negocios locales y gana") enviándote tráfico cruzado de alto valor.',
          colSpan: 2,
          rowSpan: 1,
          icon: '🌐',
          highlight: true,
        },
        {
          title: 'Engagement Activo',
          description: 'Mantén a tus clientes regresando con notificaciones Push directas a su Wallet. Sin intermediarios.',
          colSpan: 1,
          rowSpan: 1,
          icon: '📲',
        },
        {
          title: 'Métricas Claras',
          description: 'Visualiza el ciclo de vida de tus clientes. Separa a los esporádicos de tus embajadores leales.',
          colSpan: 1,
          rowSpan: 1,
          icon: '📊',
        },
        {
          title: 'Operación Simple',
          description: 'Tu equipo solo escanea. Olvídate de tarjetas de cartón selladas o iPads exclusivas en mostrador.',
          colSpan: 2,
          rowSpan: 1,
          icon: '⚡',
        }
      ]
    },
    journey: {
      title: 'De la primera visita al cliente leal',
      subtitle: 'Así es como Punto IA transforma tu flujo comercial desde el día uno.',
      steps: [
        {
          title: 'Digitaliza tu Oferta',
          description: 'Define qué recompensa darás. Tu programa de lealtad vive en la nube y se actualiza al instante en todos tus clientes.',
          imageSrc: '/images/negocios/case-cafe.jpg',
        },
        {
          title: 'Escaneo Rapidísimo',
          description: 'El cliente muestra su QR del Wallet en su celular. Tu cajero lo escanea desde cualquier dispositivo y los puntos se asignan en 1 segundo.',
          imageSrc: '/images/negocios/case-barber.jpg',
        },
        {
          title: 'Retención Automática',
          description: 'El sistema detecta cuando un cliente lleva semanas sin ir y le envía recordatorios. Tu base de datos trabaja por ti.',
          imageSrc: '/images/negocios/case-boutique.jpg',
        }
      ]
    },
    cta: {
      title: 'Sube de nivel tu negocio hoy',
      description: 'Agenda una demo y descubre cómo la inteligencia artificial y la coalición de comercios pueden escalar tus ingresos.',
      primary: { label: 'Agendar demo', href: marketingRoutes.businessDemo } satisfies Cta,
      secondary: { label: 'Hablar con ventas', href: marketingRoutes.contactSales } satisfies Cta,
    },
  },
  clientes: {
    hero: {
      eyebrow: 'Recompensas sin fricción',
      title: 'Colecciona Beneficios. Sube de Nivel.',
      description:
        'Disfruta de una experiencia unificada en el Wallet de tu celular. Acumula puntos, supera los retos de la coalición y gana recompensas en las mejores PyMEs locales.',
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
          title: 'Siempre Contigo',
          description: 'Tu pase vive donde viven tus tarjetas de crédito (Apple Wallet / Google Wallet). Literalmente a dos toques de distancia.',
          colSpan: 1,
          rowSpan: 1,
          icon: '💳',
        },
        {
          title: 'Diversión y Retos de Red',
          description: 'Participa en misiones que te premian por explorar nuevos comercios locales aliados de la red Punto IA.',
          colSpan: 2,
          rowSpan: 1,
          highlight: true,
          icon: '🎯',
        },
        {
          title: 'Privacidad Total',
          description: 'Los negocios te reconocen al escanear, pero tus datos y tu perfil siempre están encriptados.',
          colSpan: 3,
          rowSpan: 1,
          icon: '🔒',
        }
      ]
    },
    journey: {
      title: 'Tu camino como embajador local',
      subtitle: 'Solo te toma unos segundos comenzar a ganar.',
      steps: [
        {
          title: 'Escanea en Caja',
          description: 'Apunta la cámara de tu celular al código QR del mostrador en cualquier negocio afiliado.',
          imageSrc: '/images/clientes/clientes-hero-wallet.jpg',
        },
        {
          title: 'Guarda tu Pase',
          description: 'Toca el botón y agrégalo a tu Wallet. No hay formularios eternos ni correos mágicos.',
          imageSrc: '/images/clientes/clientes-steps-pass.jpg',
        },
        {
          title: 'Reclama tus Premios',
          description: 'Cada visita se registra en tiempo real. Cuando llegas a la meta, el cajero te regala tu recompensa.',
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
