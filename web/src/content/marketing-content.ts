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
           title: 'Métricas que se Entienden',
           description: 'Olvídate de Excel. Entra a tu dashboard para ver exactamente quién vino hoy, quién regresó este mes, y cuántos premios de recompensa real has dado.',
           colSpan: 2,
           rowSpan: 1,
           highlight: true,
           icon: '📈',
        },
        {
           title: 'Automatizaciones',
           description: 'Envía campañas push directamente a las pantallas de bloqueo de tus clientes cuando llevan mucho tiempo sin visitarte.',
           colSpan: 1,
           rowSpan: 1,
           icon: '⚡',
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
      eyebrow: 'Lealtad para aumentar recompra',
      title: 'Convierte visitas sueltas en clientes que regresan.',
      description:
        'Punto IA te ayuda a activar recompra con una experiencia clara para tu equipo y simple para tu cliente.',
      chips: ['3–7 días de implementación', '1 panel para operar', 'Sin app para el cliente'],
      primaryCta: { label: 'Agendar demo', href: marketingRoutes.businessDemo } satisfies Cta,
      secondaryCta: { label: 'Ver cómo funciona', href: '#como-funciona' } satisfies Cta,
      image: {
        src: '/images/negocios/negocios-hero-dashboard.jpg',
        alt: 'Panel de Punto IA para negocios',
        eyebrow: 'Operación comercial',
        title: 'Controla recompra desde un solo panel',
        description: 'Visual de dashboard y operación en caja.',
      },
    },
    problema: {
      title: 'Si hoy te cuesta que vuelvan, aquí está el cambio',
      description:
        'Punto IA no se basa en descuentos sueltos. Se enfoca en crear hábitos de recompra con reglas claras, seguimiento y una experiencia fácil de usar.',
      bullets: [
        'Tus clientes compran una vez y no regresan con frecuencia',
        'Tus promociones no siempre generan recompra',
        'Tu equipo necesita una operación simple en caja',
      ],
    },
    steps: {
      title: 'Así empieza tu programa',
      steps: [
        { title: 'Diseñamos reglas simples de visitas o puntos', description: 'Definición comercial sin fricción operativa.' },
        { title: 'Activamos wallet y operación en caja', description: 'Tu equipo opera rápido desde el primer día.' },
        { title: 'Medimos recurrencia, canjes y recompra', description: 'Decisiones con métricas reales y accionables.' },
      ] satisfies Step[],
      image: {
        src: '/images/negocios/negocios-operation-scene.jpg',
        alt: 'Escena de operación del negocio usando Punto IA',
        eyebrow: 'Operación diaria',
        title: 'Caja + campañas + seguimiento',
        description: 'Visual de uso real en punto de venta.',
      },
    },
    includes: {
      title: 'Todo lo necesario para operar lealtad sin fricción',
      features: [
        { title: 'Wallet listo desde el día uno', description: 'Pase digital para clientes sin descargar app adicional.' },
        { title: 'Reglas y recompensas fáciles de entender', description: 'Mecánica clara para tu equipo y tus clientes.' },
        { title: 'Panel para seguimiento comercial', description: 'Visitas, comportamiento y evolución de recompra.' },
        { title: 'Activaciones para volver a traer clientes', description: 'Campañas accionables con enfoque en recurrencia.' },
      ] satisfies Feature[],
    },
    casos: {
      title: 'Cómo se vería en negocios como el tuyo',
      cards: [
        {
          title: 'Cafetería',
          description: 'Aumenta frecuencia semanal con recompensas claras por visitas.',
          image: '/images/negocios/case-cafe.jpg',
        },
        {
          title: 'Barbería',
          description: 'Transforma citas esporádicas en clientes con recurrencia estable.',
          image: '/images/negocios/case-barber.jpg',
        },
        {
          title: 'Boutique',
          description: 'Conecta recompra y campañas con una experiencia premium en tienda.',
          image: '/images/negocios/case-boutique.jpg',
        },
      ],
    },
    cta: {
      title: 'Ve cómo se vería en tu negocio',
      description: 'Agenda una demo y sal con un plan claro de implementación, tiempos y próximos pasos.',
      primary: { label: 'Agendar demo', href: marketingRoutes.businessDemo } satisfies Cta,
      secondary: { label: 'Hablar con ventas', href: marketingRoutes.contactSales } satisfies Cta,
    },
  },
  clientes: {
    hero: {
      eyebrow: 'Acceso simple para clientes',
      title: 'Entra, crea tu cuenta o activa tu pase sin complicarte.',
      description:
        'Todo pasa desde tu celular en minutos: acceso fácil, recompensas claras y seguimiento de tu progreso.',
      primaryCta: { label: 'Iniciar sesión', href: marketingRoutes.login } satisfies Cta,
      secondaryCta: { label: 'Crear cuenta', href: marketingRoutes.signup } satisfies Cta,
      tertiaryCta: { label: 'Activar pase', href: marketingRoutes.activatePass } satisfies Cta,
      image: {
        src: '/images/clientes/clientes-hero-wallet.jpg',
        alt: 'Cliente usando wallet de Punto IA',
        eyebrow: 'Experiencia en celular',
        title: 'Todo desde tu teléfono',
        description: 'Acceso, pase y recompensas en minutos.',
      },
    },
    actions: {
      title: '¿Qué necesitas hacer hoy?',
      items: [
        {
          title: 'Ya tengo cuenta',
          description: 'Entra para ver tu progreso, tus recompensas y tus negocios participantes.',
          cta: { label: 'Iniciar sesión', href: marketingRoutes.login },
        },
        {
          title: 'Es mi primera vez',
          description: 'Crea tu cuenta en minutos y empieza a usar Punto IA.',
          cta: { label: 'Crear cuenta', href: marketingRoutes.signup },
        },
        {
          title: 'Estoy en tienda y tengo mi QR',
          description: 'Activa tu pase para empezar a acumular.',
          cta: { label: 'Activar pase', href: marketingRoutes.activatePass },
        },
      ],
    },
    steps: {
      title: 'Cómo funciona en 3 pasos',
      steps: [
        { title: 'Entras o creas tu cuenta', description: 'Acceso directo sin proceso confuso.' },
        { title: 'Guardas o activas tu pase', description: 'Todo listo en Apple Wallet o Google Wallet.' },
        { title: 'Acumulas y canjeas cuando vuelves', description: 'Tu progreso siempre visible en tu cuenta.' },
      ] satisfies Step[],
      image: {
        src: '/images/clientes/clientes-steps-pass.jpg',
        alt: 'Pasos para usar el pase de cliente',
        eyebrow: 'Flujo cliente',
        title: 'Tres pasos, cero fricción',
        description: 'Visual del proceso completo de acceso y uso.',
      },
    },
    benefits: {
      title: 'Todo claro desde tu celular',
      features: [
        { title: 'Acceso simple', description: 'Login y registro directos para avanzar rápido.' },
        { title: 'Recompensas visibles', description: 'Siempre sabes tu progreso y beneficios.' },
        { title: 'Cuenta protegida', description: 'Tu sesión y tu información con controles seguros.' },
        { title: 'Más valor en negocios participantes', description: 'Usa Punto IA en los lugares que frecuentas.' },
      ] satisfies Feature[],
    },
    cta: {
      title: '¿Ya sabes qué quieres hacer?',
      primary: { label: 'Iniciar sesión', href: marketingRoutes.login } satisfies Cta,
      secondary: { label: 'Crear cuenta', href: marketingRoutes.signup } satisfies Cta,
      tertiary: { label: 'Activar pase', href: marketingRoutes.activatePass } satisfies Cta,
    },
  },
} as const;
