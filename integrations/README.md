# Estado del prototipo CampoJusto

El prototipo es una demo con datos ficticios. Usa React, TypeScript, Vinext compatible con Next.js, Tailwind y almacenamiento D1. Sites conserva la audiencia configurada por el propietario. La entrada de la demo pide nombre y rol (productor o consumidor). Si no hay identidad de ChatGPT, se crea una sesión aleatoria con cookie HttpOnly, SameSite=Lax y Secure en producción, aislada por visitante; no es autenticación de cuentas reales. Cada visitante tiene su propia demo persistente; no existe un mercado real compartido entre cuentas.

## Completado
- Interfaces diferenciadas para productor, comprador y administrador de demo.
- Creación, modificación y desactivación de cosechas y solicitudes.
- Validación en servidor, control de acciones por rol de demo, bloqueo de URLs administrativas para otros roles.
- Motor determinista independiente de interfaz e IA, con pruebas de casos límite.
- Top 3 por ingreso neto total, separación territorial, pérdidas y rutas pendientes.
- Interés sin reserva ni venta, revelación de contacto ficticio después de validar elegibilidad.
- Persistencia D1 por identidad de Sites, escritura con revisión para detectar conflictos.
- Catálogo, bandas, suspensión de usuarios demo, notificaciones internas y explicación por plantillas.

## Integraciones pendientes antes de abrir un mercado real
1. Configurar Supabase y aplicar el esquema RLS de referencia. Conectar Auth, verificación de sesiones y alta de perfiles. El adaptador HTTP está en supabase.ts; no está activado. Nunca aceptar el rol ADMIN desde el registro público.
2. Sustituir el almacenamiento aislado de demo por consultas multiusuario autorizadas. El esquema relacional es una base de migración, no una integración ya terminada.
3. Configurar GOOGLE_MAPS_API_KEY del lado del servidor y conectar googleRoute después de filtros comerciales. Consultar ida y regreso por separado. Las distancias de fixtures solo son válidas en modo demo. Nuevas demandas tienen ruta pendiente y quedan fuera del ranking.
4. Configurar un proveedor de lenguaje con AI_API_URL, AI_API_KEY y AI_MODEL. El asistente actual usa plantillas deterministas, claramente identificadas. El motor económico seguirá siendo la única fuente del ranking.
5. Aprovisionar administradores por una vía privada, revisar políticas con pruebas de usuarios cruzados y verificar contactos antes de producción comercial.

No hay pagos, contratos, chat, gráficas ni historial territorial. No se garantiza rentabilidad. No se usan secretos en el navegador. La demo de administración no concede permisos sobre cuentas reales ni sobre otras demos.
