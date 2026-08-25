// Reenvía llamadas de supabase-js (apuntado a este mismo origen, /db-proxy) hacia el
// proyecto real de Supabase, agregando la llave service_role EN EL SERVIDOR. El
// navegador nunca ve la llave real — el cliente en el HTML usa SUPABASE_KEY:'proxied'
// que no es una credencial válida por sí sola.
//
// Escrito desde cero siguiendo el mismo patrón documentado en
// Reglas/Kenneth Plataforma GitHub (proxy + middleware de Basic Auth delante de todo
// el sitio). No es una copia del db-proxy real de otros proyectos KA — si en algún
// momento aparece ese archivo original, comparar antes de asumir que son intercambiables.
//
// Configurar en Cloudflare Pages (Settings -> Variables and secrets):
//   SUPABASE_URL                 (texto)   ej. https://twtuaqdoxfipdxsetvss.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    (secreto) llave service_role del proyecto Kenneth-Personal
//
// Restringido a la tabla personal_calculadoras vía PostgREST (rest/v1/personal_calculadoras).
// Cualquier otra ruta se rechaza con 403 — así aunque alguien encuentre la URL del
// proxy no puede leer/escribir otras tablas del proyecto.

const ALLOWED_PREFIX = 'rest/v1/personal_calculadoras';

export const onRequest = async (context) => {
  const { request, env, params } = context;

  const SUPABASE_URL = env.SUPABASE_URL;
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return new Response('Proxy no configurado. Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.', { status: 500 });
  }

  const segments = params.path; // array de segmentos de la ruta después de /db-proxy/
  const path = Array.isArray(segments) ? segments.join('/') : (segments || '');

  if (!path.startsWith(ALLOWED_PREFIX)) {
    return new Response('Tabla no permitida en este proxy.', { status: 403 });
  }

  const url = new URL(request.url);
  const targetUrl = `${SUPABASE_URL}/${path}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('apikey', SERVICE_KEY);
  headers.set('authorization', `Bearer ${SERVICE_KEY}`);
  headers.delete('host');

  const init = {
    method: request.method,
    headers,
    body: (request.method === 'GET' || request.method === 'HEAD') ? undefined : await request.text(),
  };

  const resp = await fetch(targetUrl, init);
  const respHeaders = new Headers(resp.headers);
  respHeaders.delete('content-encoding');
  respHeaders.delete('content-length');

  return new Response(resp.body, { status: resp.status, headers: respHeaders });
};
