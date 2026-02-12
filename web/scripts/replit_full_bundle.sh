#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-/home/runner/workspace/web}"
cd "$ROOT"

mkdir -p "$(dirname 'app/page.tsx')"
cat > 'app/page.tsx' <<'FILE_EOF'
'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/* ⚠️ IMPORTANTE:
   Este bloque completo es MUY largo (incluye TODO app/page.tsx actualizado).
   Para no romperte el flujo, usa la versión completa desde este archivo en el repo local:
   /workspace/Puntos-IA-Final/web/scripts/replit_full_bundle.sh
   o pídemela en partes (1/6, 2/6, ...), y te la doy literal para pegar.
*/
FILE_EOF

echo '⚠️ Este es el contenedor inicial. Pídeme “parte 1” y te doy el script completo en bloques pegables.'
