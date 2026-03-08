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
      eyebrow: 'Lealtad digital para PyMEs en México',
      title: 'Haz que más clientes regresen.',
      description:
        'Punto IA ayuda a negocios a activar recompra con una experiencia simple para su equipo y fácil para sus clientes.',
      chips: ['Listo en 3–7 días', 'Sin app para el cliente', 'Operación desde un solo panel'],
      primaryCta: { label: 'Ver solución para negocios', href: marketingRoutes.negocios } satisfies Cta,
      secondaryCta: { label: 'Entrar a mi cuenta', href: marketingRoutes.login } satisfies Cta,
      image: {
        src: '/images/home/home-hero-business-client.jpg',
        alt: 'Negocio y cliente usando Punto IA',
        eyebrow: 'Relación negocio + cliente',
        title: 'Una sola plataforma para activar recompra',
        description: 'Visual de operación comercial conectada con experiencia cliente.',
      },
    },
    split: {
      title: 'Elige el camino correcto desde el primer minuto',
      description: 'Dos rutas claras: hacer crecer tu negocio o entrar como cliente.',
      items: [
        {
          eyebrow: 'Negocios',
          title: 'Haz crecer tu negocio con lealtad simple',
          description: 'Activa recompra, campañas y seguimiento comercial sin complicar la operación.',
          ctas: [
            { label: 'Ver solución para negocios', href: marketingRoutes.negocios },
            { label: 'Agendar demo', href: marketingRoutes.businessDemo },
          ],
        },
        {
          eyebrow: 'Clientes',
          title: 'Entra a tu cuenta o activa tu pase',
          description: 'Inicia sesión, crea tu cuenta o guarda tu pase en minutos desde tu celular.',
          ctas: [
            { label: 'Entrar a mi cuenta', href: marketingRoutes.login },
            { label: 'Crear cuenta', href: marketingRoutes.signup },
            { label: 'Activar pase', href: marketingRoutes.activatePass },
          ],
        },
      ],
    },
    howItWorks: {
      title: 'Cómo funciona Punto IA',
      description: 'Una sola experiencia conecta al negocio con clientes que sí regresan.',
      steps: [
        { title: 'El negocio activa su programa', description: 'Define reglas claras de visitas o recompensas.' },
        { title: 'El cliente entra o activa su pase', description: 'Accede desde su celular en minutos.' },
        { title: 'Ambos siguen la recompra', description: 'Todo se mide en una experiencia simple.' },
      ] satisfies Step[],
      image: {
        src: '/images/home/home-how-it-works.jpg',
        alt: 'Flujo de negocio y cliente en Punto IA',
        eyebrow: 'Flujo integrado',
        title: 'Del alta al seguimiento',
        description: 'Visual de activación, uso del pase y seguimiento comercial.',
      },
    },
    diferencial: {
      title: 'Lealtad premium, simple de usar',
      features: [
        { title: 'Sin fricción para cliente', description: 'Login, pase y recompensas en flujo directo.', icon: '⚡' },
        { title: 'Más claridad para negocio', description: 'Métricas accionables y operación ordenada.', icon: '📊' },
        { title: 'Todo en un solo sistema', description: 'Wallet, campañas y seguimiento en un solo lugar.', icon: '🧩' },
      ] satisfies Feature[],
    },
    cta: {
      title: 'Elige tu camino',
      description:
        'Si quieres crecer tu negocio, agenda una demo. Si ya eres cliente, entra o activa tu pase.',
      primary: { label: 'Ver solución para negocios', href: marketingRoutes.negocios } satisfies Cta,
      secondary: { label: 'Entrar a mi cuenta', href: marketingRoutes.login } satisfies Cta,
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
