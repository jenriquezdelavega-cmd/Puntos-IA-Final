export function ProblemList({ title, description, items }: { title: string; description: string; items: readonly string[] }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-black tracking-tight text-[#241548] md:text-4xl">{title}</h2>
        <p className="mt-3 text-base leading-relaxed text-[#4f3a79]">{description}</p>
      </div>
      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <article key={item} className="rounded-2xl border border-[#eadcf8] bg-white p-4 text-sm font-medium text-[#4a3672]">
            • {item}
          </article>
        ))}
      </div>
    </section>
  );
}
