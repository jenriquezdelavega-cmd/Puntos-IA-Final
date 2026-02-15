#!/usr/bin/env bash
set -euo pipefail

if [[ -f "web/app/page.tsx" ]]; then
  FILE="web/app/page.tsx"
elif [[ -f "app/page.tsx" ]]; then
  FILE="app/page.tsx"
else
  echo "❌ No encontré app/page.tsx. Corre este script desde la raíz del repo o desde la carpeta web/."
  exit 1
fi

node - "$FILE" <<'NODE'
const fs = require('fs');
const file = process.argv[2];
let s = fs.readFileSync(file, 'utf8');

const newUrl = 'https://player.vimeo.com/video/1165202097?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479';

s = s.replace(
  /https:\/\/player\.vimeo\.com\/video\/\d+\?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479/,
  newUrl
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
console.log(`✅ prelaunch Vimeo + copy position actualizado en ${file}`);
NODE

rg -n "player\.vimeo\.com/video|Sistema de puntos multi-negocio" "$FILE" || true
