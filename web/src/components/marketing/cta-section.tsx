import { ActionLink, actionButtonStyles } from './action-link';

type Cta = { label: string; href: string };

export function CTASection({
  title,
  description,
  primary,
  secondary,
  tertiary,
}: {
  title: string;
  description?: string;
  primary: Cta;
  secondary?: Cta;
  tertiary?: Cta;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="rounded-3xl border border-[#e8d8f7] bg-[linear-gradient(135deg,#fff8f1_0%,#fff9ff_44%,#f5eeff_100%)] p-7 shadow-[0_18px_40px_rgba(112,67,171,0.12)]">
        <h2 className="text-3xl font-black tracking-tight text-[#26184b] md:text-4xl">{title}</h2>
        {description ? <p className="mt-3 max-w-3xl text-base leading-relaxed text-[#513d7c]">{description}</p> : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <ActionLink href={primary.href} className={actionButtonStyles('primary')}>{primary.label}</ActionLink>
          {secondary ? <ActionLink href={secondary.href} className={actionButtonStyles('secondary')}>{secondary.label}</ActionLink> : null}
          {tertiary ? <ActionLink href={tertiary.href} className={actionButtonStyles('ghost')}>{tertiary.label}</ActionLink> : null}
        </div>
      </div>
    </section>
  );
}
