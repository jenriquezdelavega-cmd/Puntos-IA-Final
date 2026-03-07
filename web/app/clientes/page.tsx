import Link from 'next/link';
import Image from 'next/image';

const highlights = [
  {
    icon: '💳',
    title: 'Todo en tu Wallet',
    description: 'Sin descargar apps extras. Tu pase vive en Apple Wallet o Google Wallet desde el primer día.',
  },
  {
    icon: '🎉',
    title: 'Premios claros',
    description: 'Sabes cuánto te falta para canjear y qué beneficios tienes disponibles en este momento.',
  },
  {
    icon: '🔔',
    title: 'Avisos útiles, no spam',
    description: 'Recibes notificaciones de promociones reales según tu actividad, no mensajes vacíos.',
  },
  {
    icon: '🛍️',
    title: 'Red de aliados',
    description: 'Descubre negocios cercanos donde puedes seguir sumando y canjeando recompensas.',
  },
];

const customerFlow = [
  { step: '01', title: 'Te registras en segundos', description: 'Creas tu cuenta y obtienes tu pase digital al instante.' },
  { step: '02', title: 'Acumulas puntos al visitar', description: 'Cada check-in válido aumenta tu progreso de forma visible.' },
  { step: '03', title: 'Completas retos dinámicos', description: 'Participas en campañas con metas fáciles de entender.' },
  { step: '04', title: 'Canjeas con seguridad', description: 'Generas tu código de redención y listo: premio desbloqueado.' },
];

const customerFrames = [
  {
    title: 'Frame 1 · Hero de bienvenida',
    filename: '/public/clientes-hero.jpg',
    size: '1600x900',
    objective: 'Transmitir emoción y facilidad para empezar.',
    upload: 'Personas reales sonriendo mientras revisan puntos/recompensas en su celular dentro de un negocio local.',
  },
  {
    title: 'Frame 2 · Acumulación de puntos',
    filename: '/public/clientes-checkin.jpg',
    size: '1200x900',
    objective: 'Mostrar claramente el momento de check-in y progreso.',
    upload: 'Escena de cliente mostrando wallet o QR en caja con interacción natural y ambiente cercano.',
  },
  {
    title: 'Frame 3 · Momento de canje',
    filename: '/public/clientes-canje.jpg',
    size: '1200x900',
    objective: 'Representar la recompensa tangible que recibe el cliente.',
    upload: 'Cliente recibiendo su premio/producto en mostrador, con gesto de satisfacción y staff amable.',
  },
];

const imagePrompts = [
  {
    label: 'Hero cliente (1600x900)',
    prompt:
      'Create a vibrant, welcoming lifestyle hero image for a loyalty platform called Punto IA. Show two friends in a modern coffee shop smiling while checking rewards on a smartphone wallet screen. Color accents in orange, magenta, and violet with soft cinematic lighting. Clean composition with negative space for text, realistic style, premium but warm atmosphere, no text and no logos.',
  },
  {
    label: 'Escena de check-in (1200x900)',
    prompt:
      'Generate a polished realistic image of a customer showing a loyalty wallet/QR code at checkout while a friendly cashier scans it. Add subtle orange, pink, and purple ambient accents. The image should feel warm, clear, modern, and easy to understand. No readable text.',
  },
  {
    label: 'Escena de canje (1200x900)',
    prompt:
      'Generate a polished realistic image of a customer redeeming a loyalty reward at a local business counter. Show friendly interaction with staff, smartphone in hand, and subtle colorful brand accents inspired by orange, pink, and purple gradients. Professional, optimistic, easy-to-understand composition, no text.',
  },
];

export default function ClientesPage() {
  return (
    <main className="min-h-screen bg-[#090914] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(255,122,89,0.18),transparent_36%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.2),transparent_34%),radial-gradient(circle_at_70%_78%,rgba(255,63,142,0.16),transparent_40%)]" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo Punto IA" width={200} height={110} className="h-14 w-auto object-contain" priority />
          <span className="hidden rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/80 sm:inline-flex">Para Clientes</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/negocios" className="hidden text-sm font-semibold text-white/70 transition hover:text-white sm:block">
            Para negocios
          </Link>
          <Link href="/?clientes=1" className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20">
            Entrar
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-6xl gap-8 px-6 pb-8 pt-4 md:grid-cols-[1.15fr,1fr] md:items-center md:pt-10">
        <div>
          <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
            Rediseño fase 1 · experiencia cliente
          </p>
          <h1 className="mt-5 text-4xl font-black leading-[1.06] md:text-6xl">
            Tu lealtad ahora sí
            <span className="bg-gradient-to-r from-[#ff7a59] via-[#ff3f8e] to-[#a855f7] bg-clip-text text-transparent"> se siente simple</span>
            , visual y valiosa.
          </h1>
          <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-white/75 md:text-lg">
            Una experiencia más pulida y vibrante para que cualquier persona entienda cómo sumar, avanzar y canjear recompensas sin enredos.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/?clientes=1" className="rounded-xl bg-white px-6 py-3 text-sm font-black text-[#ce2d7b] transition hover:bg-white/90">
              Crear cuenta / iniciar sesión
            </Link>
            <Link href="/aliados" className="rounded-xl border border-white/25 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
              Explorar aliados
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="rounded-2xl border border-dashed border-white/30 bg-black/25 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Frame principal recomendado</p>
            <h2 className="mt-2 text-lg font-black">Hero clientes</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Sube una imagen en <span className="font-semibold text-white">/public/clientes-hero.jpg</span> (1600x900). Debe mostrar clientes disfrutando beneficios con celular en mano.
            </p>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-8 md:py-10">
        <div className="grid gap-4 md:grid-cols-2">
          {highlights.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-3xl">{item.icon}</p>
              <h2 className="mt-3 text-xl font-black">{item.title}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-white/70">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-8 md:py-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-9">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">Frames visuales que debes preparar</p>
          <h3 className="mt-3 text-3xl font-black md:text-4xl">Qué subir en cada espacio de imagen</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {customerFrames.map((frame) => (
              <article key={frame.filename} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h4 className="text-base font-black">{frame.title}</h4>
                <p className="mt-2 text-xs text-white/60">Archivo: {frame.filename}</p>
                <p className="text-xs text-white/60">Tamaño: {frame.size}</p>
                <p className="mt-3 text-sm font-semibold text-white/80">Objetivo: {frame.objective}</p>
                <p className="mt-2 text-sm text-white/70">Qué subir: {frame.upload}</p>
                <div className="mt-4 h-28 rounded-xl border border-dashed border-white/25 bg-white/[0.03]" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-8 md:py-12">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-9">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">Flujo cliente</p>
          <h3 className="mt-3 text-3xl font-black md:text-4xl">Cómo funciona Punto IA para personas reales</h3>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {customerFlow.map((item) => (
              <div key={item.step} className="rounded-2xl border border-white/10 bg-black/25 p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-[#ff7a59] to-[#ff3f8e] text-xs font-black">
                  {item.step}
                </span>
                <h4 className="mt-3 font-black">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-12 pt-2 md:pb-14">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-9">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">Prompts para tus imágenes</p>
          <h3 className="mt-3 text-2xl font-black md:text-3xl">Genera visuals consistentes con la marca</h3>
          <p className="mt-2 text-sm text-white/65">
            Si quieres que se vea más local, cambia la escena (cafetería, salón, tienda) y conserva la misma paleta de color.
          </p>
          <div className="mt-6 space-y-4">
            {imagePrompts.map((item) => (
              <article key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h4 className="text-lg font-black">{item.label}</h4>
                <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-white/80">
                  {item.prompt}
                </pre>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
