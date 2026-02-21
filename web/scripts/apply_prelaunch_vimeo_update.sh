#!/usr/bin/env bash
set -euo pipefail

if [[ -f "web/app/page.tsx" ]]; then
  FILE="web/app/page.tsx"
elif [[ -f "app/page.tsx" ]]; then
  FILE="app/page.tsx"
else
  echo "❌ No encontré app/page.tsx. Pégalo en terminal desde ~/workspace/web o desde la raíz del proyecto."
  exit 1
fi

node - "$FILE" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
let s = fs.readFileSync(file, 'utf8');

const newUrl = 'https://player.vimeo.com/video/1165062263?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479';

s = s.replace(
  /https:\/\/player\.vimeo\.com\/video\/\d+\?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479/,
  newUrl
);

<<<<<<< HEAD
=======

>>>>>>> origin/codex/review-my-code
const teaserPlaceholderRegex = /<div className="aspect-video rounded-2xl border border-white\/30 bg-black\/25 flex flex-col items-center justify-center text-center px-4">[\s\S]*?<\/div>/;
const teaserEmbedBlock = `<div className="aspect-video rounded-2xl border border-white/30 bg-black/30 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
              <iframe
                className="h-full w-full"
                src="https://player.vimeo.com/video/1165062263?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
                title="Genera_un_video_1080p_202602141913"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                allowFullScreen
              />
            </div>`;
if (teaserPlaceholderRegex.test(s)) {
  s = s.replace(teaserPlaceholderRegex, teaserEmbedBlock);
}

s = s.replace(
  /title="[^"]*"\n\s*allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media(?:; web-share)?"/,
  'title="Genera_un_video_1080p_202602141913"\n                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"'
);

const topParagraph =
  '          <p className="mt-4 text-white/90 max-w-2xl text-sm md:text-base font-semibold">\n' +
  '            Sistema de puntos multi-negocio para pymes en México. Deja tus datos y sé de los primeros aliados en activar la plataforma.\n' +
  '          </p>\n';

if (s.includes(topParagraph)) {
  s = s.replace(topParagraph, '');
}

const bottomParagraph =
  '\n        <p className="mt-6 text-white/90 max-w-2xl text-sm md:text-base font-semibold mx-auto text-center">\n' +
  '          Sistema de puntos multi-negocio para pymes en México. Deja tus datos y sé de los primeros aliados en activar la plataforma.\n' +
  '        </p>\n';

const anchor = '      </section>\n    </main>\n  ) : (\n';
if (!s.includes(bottomParagraph) && s.includes(anchor)) {
  s = s.replace(anchor, bottomParagraph + anchor);
}

const broken =
  '          </div>\n\n        <p className="mt-6 text-white/90 max-w-2xl text-sm md:text-base font-semibold mx-auto text-center">\n';
const fixed =
  '          </div>\n        </div>\n\n        <p className="mt-6 text-white/90 max-w-2xl text-sm md:text-base font-semibold mx-auto text-center">\n';
if (s.includes(broken)) {
  s = s.replace(broken, fixed);
}

fs.writeFileSync(file, s, 'utf8');

const lines = s.split('\n');
const show = (needle) => {
  const idx = lines.findIndex((l) => l.includes(needle));
  if (idx !== -1) console.log(`${idx + 1}: ${lines[idx]}`);
};

console.log(`✅ prelaunch Vimeo + copy position actualizado en ${file}`);
show('player.vimeo.com/video');
show('Genera_un_video_1080p_202602141913');
show('Sistema de puntos multi-negocio');
NODE
