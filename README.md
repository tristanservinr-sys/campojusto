# CampoJusto

Prototipo funcional de un mercado agrícola mexicano. Incluye entrada con nombre y rol (productor o consumidor), cosechas, pedidos, matching comercial, cálculo logístico, ranking económico y un agente de ElevenLabs.

**Sitio:** https://campojusto-mercado-agricola.servintristan7.chatgpt.site

## Estado

- Datos de demostración identificados, persistidos en Cloudflare D1.
- Sesiones aisladas por visitante; el formulario de nombre no autentica cuentas comerciales reales.
- Google Maps y Supabase pendientes; las rutas de ejemplo están marcadas como simuladas.
- Ranking determinista; el asistente no determina el orden ni confirma ventas.
- Agente de ElevenLabs integrado: `agent_7701m64pv4r2e1pvf18txwqdy00c`.

## Desarrollo local

Requiere Node.js 22.13 o posterior.

```sh
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_wealthy_payback.sql
npm run dev
```

La migración se aplica una sola vez a una base nueva. El servidor muestra la dirección local, normalmente http://localhost:5173.

## Comprobaciones

```sh
npx tsc --noEmit
node --experimental-strip-types --test tests/engine.test.mjs
npm run build
```

## Código

- `app/ui.tsx`: entrada, navegación y paneles por rol.
- `app/api/workspace/route.ts`: persistencia, validación y permisos en servidor.
- `lib/campojusto/engine.ts`: filtros comerciales y evaluación económica.
- `lib/campojusto/seed.ts`: datos ficticios.
- `components/campojusto/voice-agent.tsx`: widget de ElevenLabs, sin claves privadas.
- `db/` y `drizzle/`: almacenamiento y migración de D1.
- `integrations/`: adaptadores, esquema Supabase de referencia y pendientes de producción.
- `.openai/hosting.json`: configuración del despliegue en Sites.

## Agente

El widget se carga en todas las pantallas. El visitante elige iniciar la conversación. No se envían automáticamente su nombre, ubicación, contactos ni resultados comerciales. Se usa el paquete oficial fijado en la versión 0.22.2. Si el widget no carga, aparece una opción para reintentar.

[Integraciones y pendientes de producción](integrations/README.md) · [Documentación de ElevenLabs](https://elevenlabs.io/docs/eleven-agents/customization/widget)
