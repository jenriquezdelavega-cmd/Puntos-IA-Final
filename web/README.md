# Puntos IA (MVP SaaS de loyalty para PyMEs)

Aplicación web para que negocios registren visitas y clientes acumulen puntos/recompensas en múltiples comercios.

## Objetivo actual

Lanzar un **MVP rápido** enfocado en experiencia de usuario final:

- Registro / login simple.
- Check-in de visitas sin fricción.
- Visualización de puntos y recompensas.
- Redención básica validada por el negocio.

---

## Qué hacemos primero (Sprint 0: 24-48h)

Objetivo: dejar el MVP **usable de punta a punta** en una URL de Vercel para validación real.

### Paso 1 — Congelar alcance del MVP (hoy)

Alcance único de lanzamiento:

- registro/login
- check-in
- ver puntos
- redimir premio

> Todo lo demás se considera backlog (no bloquea lanzamiento).

### Paso 2 — Validación técnica mínima en Replit

En `web/` ejecutar:

```bash
npm install
npm run build
npm run dev
```

Luego probar manualmente el flujo crítico completo.

### Paso 3 — Publicar candidato en Vercel

- Deploy desde la rama actual.
- Validar misma prueba manual en la URL de preview.
- Si pasa, marcar versión candidata MVP.

### Definición de listo (DoD) de esta semana

- [ ] Flujo registro -> check-in -> puntos -> redención funciona sin bloqueo.
- [ ] Build de producción (`npm run build`) exitoso.
- [ ] Checklist de release completo en Replit y Vercel.
- [ ] URL candidata compartida para revisión.

---


## Variables de entorno recomendadas

Define estas variables en Replit y Vercel para evitar diferencias entre ambientes:

- `DATABASE_URL`
- `MASTER_USERNAME` (si no se define, usa fallback local de desarrollo)
- `MASTER_PASSWORD` (si no se define, usa fallback local de desarrollo)
- `MASTER_TOTP_SECRET` (opcional, pero recomendado para proteger endpoints master con Authenticator)

### Configuración de OTP (Google/Microsoft Authenticator)

El OTP de master **sí está implementado** en backend y se activa únicamente cuando existe `MASTER_TOTP_SECRET`.

#### Dónde se configura

- **Local (desarrollo):** en `web/.env` (puedes copiar de `web/.env.example`).
- **Vercel (producción/preview):** en **Project Settings → Environment Variables** con la misma llave `MASTER_TOTP_SECRET`.
- **No se configura en el cliente** ni en código frontend hardcodeado.

> Regla simple: donde corre el backend de Next.js (local o Vercel), ahí debe existir la variable de entorno.

#### Formato correcto del secret

- Debe ser **Base32** (A-Z y 2-7), sin espacios.
- Si el formato es inválido, la validación falla en servidor.
- El código OTP esperado es de **6 dígitos** y periodo estándar de 30s.
- La tolerancia por defecto es de **±4 pasos** (hasta ~2.5 minutos hacia atrás/adelante) para evitar falsos 401 por desfase leve o expiración inmediata al guardar.
- Puedes ajustar la tolerancia con `MASTER_TOTP_WINDOW_STEPS` (entero de `0` a `10`).

#### Cómo enlazar tu app Authenticator

1. Genera un secret Base32 único para tu proyecto.
2. Cárgalo en `MASTER_TOTP_SECRET` (local y/o Vercel).
3. En Google/Microsoft Authenticator, agrega cuenta TOTP con ese mismo secret.
4. En el panel master, captura `masterUsername`, `masterPassword` y `masterOtp` (6 dígitos).

#### Diagnóstico rápido si “no jala”

1. Verifica que `MASTER_TOTP_SECRET` esté definido en el ambiente donde pruebas.
2. Confirma que no tengas espacios/comillas raras en el valor.
3. Revisa hora del dispositivo (desfase de reloj rompe TOTP).
4. Si en local funciona pero en Vercel no, casi siempre falta la variable en Vercel o está en otro Environment (Preview vs Production).

---

## Arranque local

```bash
cd web
npm install
npm run dev
```

Abrir: [http://localhost:3000](http://localhost:3000)

## Comandos útiles

```bash
npm run dev      # desarrollo
npm run build    # build producción
npm run start    # servir build
npm run lint     # revisión estática
```

---

## Plan MVP de 2 semanas (velocidad > perfección)

### Semana 1 — Fundaciones + flujo principal

1. **Definir flujo crítico E2E** (usuario):
   - crear cuenta
   - hacer check-in
   - ver puntos
   - redimir premio
2. **Asegurar datos base** (Prisma + seed confiable).
3. **Agregar validaciones mínimas** en APIs críticas (`checkin`, `redeem`, `user/profile`).
4. **UX móvil primero** en pantallas de usuario.

### Semana 2 — Estabilidad y salida a producción

1. **Métricas mínimas**:
   - check-ins por día
   - redenciones por día
   - errores API (4xx/5xx)
2. **Observabilidad básica**:
   - logs estructurados por endpoint
   - alertas de error simples
3. **QA express** con checklist manual de smoke test.
4. **Deploy MVP en Vercel** con variables de entorno limpias.

---

## Checklist de validación antes de lanzar

- [ ] Usuario puede registrarse e iniciar sesión.
- [ ] Check-in suma puntos correctamente.
- [ ] Redención descuenta puntos correctamente.
- [ ] No hay errores visibles en consola del navegador en flujo principal.
- [ ] `npm run build` y `npm run lint` pasan.
- [ ] Variables de entorno documentadas.

---

## Siguiente foco recomendado

1. Instrumentar analytics/eventos (aunque sea mínimo).
2. Crear tablero semanal de métricas (Google Sheet / Notion).
3. Iterar UX de usuario final con 3–5 pruebas reales de negocio.

---

## Cómo trabajaremos contigo (Replit -> Vercel)

Flujo propuesto para que avances rápido sin perder control:

1. **Plan semanal (PMO ligero, 15 min):** definimos 3 entregables máximos (ej. login, check-in, redención).
2. **Implementación guiada:** tú haces cambios en Replit y yo te doy tareas concretas por archivo + criterios de aceptación.
3. **Validación técnica mínima:** antes de deploy corremos smoke checks (`build`, flujo E2E manual, revisión de errores API).
4. **Deploy a Vercel:** publicas versión candidata y validamos en URL real con checklist.
5. **Cierre semanal:** registramos qué se lanzó, qué falló y qué sigue (backlog P0/P1/P2).

### Cadencia sugerida

- **Diario (rápido):**
  - me dices objetivo del día en 1 línea
  - yo te regreso plan en 3 bloques: *hacer*, *probar*, *definición de listo*
- **Semanal (60 min):**
  - revisión de avances
  - riesgos técnicos
  - foco de la siguiente semana

### Checklist por release en tu flujo actual

Antes de pasar de Replit a Vercel:

- [ ] Variables de entorno correctas en Replit y Vercel.
- [ ] Flujo crítico probado manualmente: registro -> check-in -> ver puntos -> redimir.
- [ ] Sin errores bloqueantes en consola/browser y endpoints principales.
- [ ] Rollback claro: saber a qué commit volver si algo falla.

### Qué te voy pidiendo en cada iteración

Para ayudarte como partner técnico, solo necesito:

1. URL de preview en Vercel (si existe).
2. Qué cambiaste hoy (máx. 5 bullets).
3. Qué te falló o qué te dio duda.

Con eso yo te devuelvo: prioridades, riesgos, y siguientes tareas accionables.

---

## Troubleshooting rápido de Git (Replit)

Si te aparece este error:

```bash
error: pathspec 'work' did not match any file(s) known to git
```

normalmente significa que **esa rama no existe en tu clon actual** o estás parado en otro proyecto.

### Paso a paso para corregirlo

1. Confirmar que estás en la carpeta correcta del repo:

```bash
pwd
git rev-parse --show-toplevel
```

2. Ver ramas disponibles:

```bash
git branch -a
```

3. Si `work` sí existe en remoto, tráela y cámbiate:

```bash
git fetch origin
git checkout -b work origin/work
```

4. Si `work` no existe, usa la rama que sí tengas (por ejemplo `main`):

```bash
git checkout main
git pull origin main
```

### Regla práctica para no atorarte

Antes de cualquier deploy, ejecuta siempre:

```bash
git status -sb
git branch --show-current
git remote -v
```

Así confirmas en 10 segundos: rama activa, estado local y remoto correcto.

---


## Deployment paso a paso (Replit -> Vercel)

Si quieres probar lo que ya modificamos, sigue este flujo exacto:

1. Verifica que estés en el repo correcto:

```bash
pwd
git rev-parse --show-toplevel
```

2. Revisa tu rama actual y estado:

```bash
git status -sb
git branch --show-current
git branch -a
```

3. Si la rama `work` existe en remoto, cámbiate así:

```bash
git fetch origin
git checkout -b work origin/work
```

4. Si `work` no existe, usa `main`:

```bash
git checkout main
git pull origin main
```

5. Valida build en `web/`:

```bash
cd web
npm install
npm run build
```

6. Sube cambios al remoto (si hay cambios locales):

```bash
cd ..
git add .
git commit -m "chore: deploy candidate"
git push origin $(git branch --show-current)
```

7. En Vercel:
   - Abre tu proyecto -> **Deployments**.
   - Espera el deployment de esa rama en estado **Ready**.
   - Abre la URL de preview.

8. Smoke test en preview:
   - registro/login
   - check-in
   - ver puntos
   - redimir

9. Si todo pasa, promueve a producción (merge a `main` o Promote en Vercel).

---

## Comandos exactos para Replit (copiar/pegar)

Si quieres traer **todo lo que ya hice** y correrlo en Replit, usa esto tal cual:

```bash
# 1) Ir a la raíz del repo (una carpeta arriba de /web)
cd /home/runner/workspace

# 2) Traer ramas remotas
git fetch origin

# 3) Elegir rama correcta SIN fallar
if git show-ref --verify --quiet refs/remotes/origin/work; then
  echo "Usando rama work"
  git checkout -B work origin/work
  git pull origin work
else
  echo "origin/work no existe; usando main"
  git checkout main
  git pull origin main
fi

# 4) Entrar al proyecto web e instalar/correr
cd web
npm install
npm run build
npm run dev
```

Si `npm run dev` marca error de lock (`Unable to acquire lock ... .next/dev/lock`) o dice que el puerto ya está en uso, limpia procesos previos y vuelve a correr:

```bash
# desde /home/runner/workspace/web
pkill -f "next dev" || true
rm -f .next/dev/lock
npm run dev
```

Si ves `✓ Ready` (como en tu último intento), ya quedó resuelto y puedes continuar con validación funcional o deployment.

Luego abre la URL de Replit y valida:
- registro/login
- check-in
- ver puntos
- redimir

Si todo funciona, desde la raíz del repo publica la rama activa:

```bash
cd /home/runner/workspace
git push -u origin "$(git branch --show-current)"
```

Después haz **Redeploy** en Vercel (o espera deploy automático) y prueba la URL `Ready`.

### Publicar eso mismo en Vercel

Desde la raíz del repo (`/home/runner/workspace`):

```bash
# Verifica en qué rama quedaste y empuja ESA rama
git branch --show-current

git push -u origin "$(git branch --show-current)"
```

Después en Vercel:
1. Project -> Deployments
2. abre el deployment de esa rama
3. confirma que esté en `Ready`
4. abre la URL y repite smoke test

---

## Si Codex y Replit muestran versiones distintas

Si en Replit/Vercel ves siempre el mismo SHA pero en Codex aparece otro, normalmente significa que los commits de Codex están en **otra rama local** o en un entorno sin remoto configurado.

Checklist rápido:

```bash
# En Replit (repo conectado a GitHub)
git remote -v
git branch -a
git log --oneline -n 10
```

Qué validar:
- Debe existir `origin` apuntando a tu repo GitHub.
- Debes estar en la rama que sí despliega Vercel (`main` o la configurada en Vercel).
- El SHA de Replit debe existir en GitHub y en el deployment `Ready`.

Si un cambio se hizo en una rama distinta, súbela y haz merge/rebase a la rama de deploy:

```bash
git checkout main
git pull origin main
# ejemplo: traer cambios de work
git merge work
# o cherry-pick del commit específico
# git cherry-pick <sha>
git push origin main
```

---

## Verificación rápida (30 segundos)

### Cómo interpretar el resultado (ejemplo real)

Si en Replit te sale algo como:

```bash
git branch --show-current
git rev-parse --short HEAD
# main
# 361aa82
```

entonces **esa es exactamente la versión que estás corriendo** en Replit.

Ahora haz esto en Vercel:
- abre el último deployment `Ready`,
- revisa su campo **Commit**.

Resultado:
- si Vercel también muestra `361aa82`, sí está actualizado a esa versión,
- si Vercel muestra otro SHA, todavía no estás viendo la misma versión.



Para confirmar si **la opción nueva ya está en Vercel**:

1. En Replit corre:

```bash
git branch --show-current
git rev-parse --short HEAD
```

2. En Vercel abre: Project -> Deployments -> último deployment `Ready`.
3. Compara el **Commit SHA** de Vercel con el SHA de Replit.
4. Si coinciden, estás viendo el código actualizado.
5. Extra recomendado: abre `/api/debug` en el deployment y confirma que `commitSha` y `branch` coinciden con esos comandos de Replit.

---

## Cómo asegurar que Vercel está realmente "up to date"

Si en Replit te aparece `Already up to date` y en Vercel hiciste `Redeploy`, valida con esta secuencia:

1. **Confirma rama local y commit actual** (en Replit):

```bash
git branch --show-current
git rev-parse --short HEAD
```

2. **Compara con el último commit remoto de esa misma rama**:

```bash
git fetch origin
git rev-parse --short origin/$(git branch --show-current)
```

Si ambos SHAs son iguales, tu código local sí está sincronizado con GitHub.

3. **Verifica el commit del deployment en Vercel**:
   - Vercel -> Project -> Deployments -> abre el deployment.
   - Revisa el campo **Commit** (SHA).
   - Debe coincidir con `git rev-parse --short HEAD`.

4. **Haz smoke test en la URL del deployment "Ready"**:
   - registro/login
   - check-in
   - ver puntos
   - redimir

### Caso típico de confusión (muy común)

- Si tú despliegas `main`, pero los cambios nuevos están en `work`, en Replit siempre verás "up to date" para `main` y aun así **no tendrás los cambios**.
- Solución: traer y cambiar a la rama correcta antes del deploy:

```bash
git fetch origin
git checkout -b work origin/work
git pull origin work
```

---

## ¿Conviene migrar de tecnología ahora?

**Recomendación corta: no migrar todavía.**

Para tu etapa (solo founder, sin fecha límite dura, prioridad en velocidad), el stack actual **Next.js + Vercel + Prisma** es suficiente para lanzar MVP rápido.

### Por qué mantener el stack actual

1. **Menos fricción operativa:** ya estás en Replit + Vercel.
2. **Tiempo a mercado menor:** migrar ahora retrasa validación con usuarios reales.
3. **Riesgo controlado:** hoy el cuello de botella no es tecnología, es ejecución y aprendizaje del usuario.

### Qué sí cambiaría de inmediato (sin migrar)

- Estandarizar variables de entorno entre Replit y Vercel.
- Añadir logging mínimo en endpoints críticos.
- Definir 3 métricas del MVP (check-ins, redenciones, errores).
- Crear smoke test manual del flujo principal.

### Cuándo sí considerar migración

Evalúa migrar solo si pasa alguno de estos casos:

- Costos de infraestructura se disparan sin crecimiento equivalente.
- El rendimiento no cumple con demanda real y ya optimizaste lo básico.
- Necesitas capacidades que el stack actual no cubre razonablemente.

### Opciones de migración (si llega el momento)

- **Backend separado (NestJS/Fastify):** si necesitas dominio más complejo y equipos separados.
- **React Native / Flutter:** solo si la app móvil nativa se vuelve prioridad comercial.
- **Postgres administrado + observabilidad dedicada:** primer paso recomendado antes de cualquier reescritura grande.

---

## Aplicar Paquete A + B en un solo paso (Replit)

Si tu Replit marca `up to date` pero faltan archivos como `app/lib/password.ts`, ejecuta este script desde `web/`:

```bash
cd /home/runner/workspace/web
bash scripts/apply_paquetes_a_b.sh
```

> Nota: el script ya **no requiere Python**; usa Node (incluido en Replit de este proyecto).

Este script:
- crea/actualiza `app/aliados/page.tsx` (Paquete A),
- crea/actualiza `app/lib/password.ts` (base Paquete B),
- agrega el CTA a `/aliados` en `app/page.tsx` si aún no existe.

Luego publica normal:

```bash
npm install
npm run build
cd ..
git add web/app/page.tsx web/app/aliados/page.tsx web/app/lib/password.ts
git commit -m "feat: aplicar paquete A+B (aliados + hash base)"
git push origin main
```

---

## Replit: caso real "build OK pero falta /aliados"

Si `npm run build` termina bien, pero en la tabla de rutas no aparece `○ /aliados`, aplica este flujo:

```bash
cd /home/runner/workspace/web
bash scripts/apply_paquetes_a_b.sh
npm install
npm run build
```

Validación esperada:
- `app/lib/password.ts` existe.
- `app/aliados/page.tsx` existe.
- `app/page.tsx` contiene `href="/aliados"`.
- En la salida de build aparece `○ /aliados`.

Comandos de check rápido:

```bash
cd /home/runner/workspace/web
test -f app/lib/password.ts && echo "ok password.ts"
test -f app/aliados/page.tsx && echo "ok aliados"
rg -n 'href="/aliados"' app/page.tsx
```

## Replit: error de lock en `next dev`

Si ves `Unable to acquire lock ... .next/dev/lock` o conflicto de puerto:

```bash
cd /home/runner/workspace/web
pkill -f "next dev" || true
rm -f .next/dev/lock
npm run dev
```

Si inicia en puerto 3001 o 3000, ambos son válidos en Replit.

---

## ¿Puede Codex hacer push directo a tu GitHub/Replit?

Sí, **solo** si este entorno tiene remoto configurado y credenciales válidas.

Checks rápidos:

```bash
cd /workspace/Puntos-IA-Final
git remote -v
```

- Si no sale `origin`, Codex no tiene a dónde empujar.
- Si sale `origin` pero falla push por permisos, faltan credenciales (token/SSH).

### Flujo recomendado cuando no hay acceso remoto desde Codex

1. Codex prepara cambios + script de aplicación (`web/scripts/apply_paquetes_a_b.sh`).
2. Tú lo ejecutas en Replit:

```bash
cd /home/runner/workspace/web
bash scripts/apply_paquetes_a_b.sh
npm install
npm run build
```

3. Tú haces el push desde Replit (que sí tiene tu auth):

```bash
cd /home/runner/workspace
git add web/app/page.tsx web/app/aliados/page.tsx web/app/lib/password.ts
git commit -m "feat: aplicar paquete A+B"
git push origin main
```

Este es el método más estable mientras Codex no tenga `origin` + permisos en este entorno.

---

## Bootstrap completo del diff (1 solo pegado en Replit)

Si nada de lo del diff aparece en Replit/Vercel, usa este script de recuperación total:

```bash
cd /home/runner/workspace/web
bash scripts/replit_bootstrap_full_diff.sh
```

> Nota: este bootstrap también **no requiere Python**.

Este bootstrap reescribe los archivos clave del diff (API routes, libs y `/aliados`) y vuelve a insertar el CTA en `app/page.tsx`.

Luego publica:

```bash
npm install
npm run build
cd ..
git add web/app web/scripts/replit_bootstrap_full_diff.sh
git commit -m "feat: bootstrap full diff from codex"
git push origin main
```

---

## Tablero semanal MVP (plantilla lista)

Usa este formato en Google Sheets o Notion para seguimiento PMO simple.

### Hoja 1: KPI semanal

| Semana | Check-ins (total) | Redenciones solicitadas | Redenciones validadas | Errores API (5xx) | Conversión check-in->redención | Estado |
|---|---:|---:|---:|---:|---:|---|
| 2026-W01 | 0 | 0 | 0 | 0 | 0% | 🟡 |

**Reglas rápidas de semáforo:**
- 🟢 Verde: errores 5xx <= 2 y conversión sube vs semana anterior.
- 🟡 Amarillo: errores 5xx entre 3 y 10 o conversión estable.
- 🔴 Rojo: errores 5xx > 10 o caída fuerte de conversión.

### Hoja 2: Bugs y bloqueos (P0/P1/P2)

| Fecha | Tipo | Prioridad | Módulo | Descripción | Responsable | Estado |
|---|---|---|---|---|---|---|
| 2026-02-12 | Bug | P0 | Check-in | Falla validación de código diario | Founder | Abierto |

### Hoja 3: Validación con negocios reales

| Negocio | Fecha prueba | Flujo probado | Resultado | Feedback principal | Acción |
|---|---|---|---|---|---|
| Demo Café | 2026-02-12 | Registro->Check-in->Puntos->Redimir | Parcial | No entiende vigencia | Cambiar microcopy |

## Plantilla de reporte diario (2 minutos)

Pégalo así cada día:

```text
Objetivo del día:
- ...

Hecho hoy:
- ...
- ...

Bloqueos:
- ...

Siguiente paso:
- ...

URL preview (si aplica):
- ...
```

## Definición de listo para lanzar MVP

- [ ] Flujo registro -> check-in -> puntos -> redimir pasa 3 veces seguidas.
- [ ] Errores 5xx en flujo crítico: 0 en validación final.
- [ ] Vercel en `Ready` con commit correcto (ver `/api/debug`).
- [ ] 1 negocio real probó el flujo y dio feedback.

## Bloque Replit: robustecer dashboard de admin (check-ins, género, edades)

Si en Replit no ves los cambios de este entorno, aplícalos directo así:

```bash
cd /home/runner/workspace/web
bash scripts/apply_admin_dashboard_upgrade.sh
npm install
npm run build

cd /home/runner/workspace
git add web/app/admin/page.tsx web/scripts/apply_admin_dashboard_upgrade.sh
git commit -m "feat(admin): robust dashboard visuals"
git push origin main
```

Validación rápida:

```bash
cd /home/runner/workspace/web
rg -n "Dashboard|Check-ins acumulados|Distribución por género|Distribución por edades" app/admin/page.tsx
```
