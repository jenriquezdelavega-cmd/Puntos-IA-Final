import { MarketingImageSlot } from './marketing-image-slot';

type Step = { title: string; description: string };

type StepImage = {
  src: string;
  alt: string;
  eyebrow?: string;
  title?: string;
  description?: string;
};

export function StepGrid({
  id,
  title,
  description,
  steps,
  image,
}: {
  id?: string;
  title: string;
  description: string;
  steps: readonly Step[];
  image?: StepImage;
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="max-w-3xl">
        <h2 className="text-3xl font-black tracking-tight text-[#241548] md:text-4xl">{title}</h2>
        <p className="mt-3 text-base text-[#4f3a79]">{description}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-3xl border border-[#e8daf6] bg-white p-5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#d5c2ef] bg-[#faf6ff] text-xs font-black text-[#6f49aa]">
              {index + 1}
            </span>
            <h3 className="mt-3 text-lg font-black text-[#26184b]">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#564183]">{step.description}</p>
          </article>
        ))}
      </div>
      {image ? (
        <div className="mt-6">
          <MarketingImageSlot
            src={image.src}
            alt={image.alt}
            aspectRatio="21 / 9"
            eyebrow={image.eyebrow}
            title={image.title}
            description={image.description}
          />
        </div>
      ) : null}
    </section>
  );
}
