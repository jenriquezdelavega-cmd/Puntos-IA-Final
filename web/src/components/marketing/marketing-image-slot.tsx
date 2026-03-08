import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';

type MarketingImageSlotProps = {
  src: string;
  alt: string;
  aspectRatio?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  priority?: boolean;
};

function normalizeSrc(src: string) {
  if (src.startsWith('/public/')) {
    return src.replace('/public', '');
  }
  return src;
}

function toPublicPath(src: string) {
  const normalized = normalizeSrc(src);
  return path.join(process.cwd(), 'public', normalized.replace(/^\//, ''));
}

function fileExists(src: string) {
  try {
    return fs.existsSync(toPublicPath(src));
  } catch {
    return false;
  }
}

export function MarketingImageSlot({
  src,
  alt,
  aspectRatio = '16 / 10',
  eyebrow,
  title,
  description,
  priority = false,
}: MarketingImageSlotProps) {
  const normalizedSrc = normalizeSrc(src);
  const exists = fileExists(normalizedSrc);
  const expectedPath = `/public${normalizedSrc}`;
  const expectedName = normalizedSrc.split('/').pop() || 'asset.jpg';

  return (
    <article className="rounded-3xl border border-[#eadcf8] bg-white p-3 shadow-[0_16px_34px_rgba(70,45,120,0.09)]">
      <div className="relative w-full overflow-hidden rounded-2xl border border-[#efe5fb] bg-[#fffaf4]" style={{ aspectRatio }}>
        {exists ? (
          <Image src={normalizedSrc} alt={alt} fill priority={priority} className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        ) : (
          <div className="absolute inset-0 flex flex-col justify-end bg-[linear-gradient(140deg,#fff7ef_0%,#fff8fe_46%,#f4ecff_100%)] p-5">
            <p className="inline-flex w-fit rounded-full border border-[#e6d8f5] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6e4f9e]">
              Placeholder visual
            </p>
            <p className="mt-3 text-sm font-semibold text-[#38235f]">{expectedName}</p>
            <p className="mt-1 text-xs text-[#5f4888]">{description || 'Espacio preparado para visual de producto.'}</p>
            <p className="mt-3 text-[11px] text-[#7a65a0]">{expectedPath}</p>
          </div>
        )}
      </div>

      {(eyebrow || title || description) ? (
        <div className="px-2 pb-1 pt-3">
          {eyebrow ? <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#7d64a6]">{eyebrow}</p> : null}
          {title ? <h3 className="mt-1 text-lg font-black text-[#28184b]">{title}</h3> : null}
          {description ? <p className="mt-1 text-sm text-[#5a467f]">{description}</p> : null}
        </div>
      ) : null}
    </article>
  );
}
