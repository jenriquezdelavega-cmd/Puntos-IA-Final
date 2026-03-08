import { ActionLink, actionButtonStyles } from './action-link';
import { MarketingImageSlot } from './marketing-image-slot';
import { ProofChips } from './proof-chips';

type Cta = { label: string; href: string };

type HeroImage = {
  src: string;
  alt: string;
  eyebrow?: string;
  title?: string;
  description?: string;
};

type MarketingHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  chips?: readonly string[];
  primaryCta: Cta;
  secondaryCta?: Cta;
  tertiaryCta?: Cta;
  image: HeroImage;
};

export function MarketingHero({
  eyebrow,
  title,
  description,
  chips = [],
  primaryCta,
  secondaryCta,
  tertiaryCta,
  image,
}: MarketingHeroProps) {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-6 pb-10 pt-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
      <div>
        <p className="inline-flex rounded-full border border-[#e8daf7] bg-white px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#704f9b]">
          {eyebrow}
        </p>
        <h1 className="mt-5 text-4xl font-black leading-[1.03] tracking-tight text-[#241548] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#4d3975] sm:text-lg">
          {description}
        </p>

        {chips.length > 0 ? <div className="mt-6"><ProofChips items={chips} /></div> : null}

        <div className="mt-7 flex flex-wrap gap-3">
          <ActionLink href={primaryCta.href} className={actionButtonStyles('primary')}>{primaryCta.label}</ActionLink>
          {secondaryCta ? <ActionLink href={secondaryCta.href} className={actionButtonStyles('secondary')}>{secondaryCta.label}</ActionLink> : null}
          {tertiaryCta ? <ActionLink href={tertiaryCta.href} className={actionButtonStyles('ghost')}>{tertiaryCta.label}</ActionLink> : null}
        </div>
      </div>

      <MarketingImageSlot
        src={image.src}
        alt={image.alt}
        aspectRatio="16 / 11"
        eyebrow={image.eyebrow}
        title={image.title}
        description={image.description}
        priority
      />
    </section>
  );
}
