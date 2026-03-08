type Feature = { title: string; description: string; icon?: string };

export function FeatureGrid({
  title,
  description,
  features,
}: {
  title: string;
  description?: string;
  features: readonly Feature[];
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-black tracking-tight text-[#241548] md:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-base text-[#4f3a79]">{description}</p> : null}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-3xl border border-[#e8daf6] bg-white p-5 shadow-[0_8px_22px_rgba(83,58,131,0.06)]">
            {feature.icon ? <span className="text-xl">{feature.icon}</span> : null}
            <h3 className="mt-3 text-lg font-black text-[#26184b]">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#564183]">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
