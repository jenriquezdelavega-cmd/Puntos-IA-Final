import { ActionLink, actionButtonStyles } from './action-link';

type Cta = { label: string; href: string };

type AudienceCard = {
  eyebrow: string;
  title: string;
  description: string;
  ctas: readonly Cta[];
};

export function AudienceSplitCards({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: readonly AudienceCard[];
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-black tracking-tight text-[#241548] md:text-4xl">{title}</h2>
        <p className="mt-3 text-base text-[#4f3a79]">{description}</p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <article key={item.title} className="rounded-3xl border border-[#e8daf6] bg-white p-6 shadow-[0_12px_28px_rgba(75,45,129,0.08)]">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7a61a4]">{item.eyebrow}</p>
            <h3 className="mt-2 text-2xl font-black text-[#241548]">{item.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#544081]">{item.description}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {item.ctas.map((cta, index) => (
                <ActionLink
                  key={`${item.title}-${cta.label}`}
                  href={cta.href}
                  className={actionButtonStyles(index === 0 ? 'primary' : 'secondary')}
                >
                  {cta.label}
                </ActionLink>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
