// Protege TODO el sitio (incluido /db-proxy) con usuario y contraseña.
// Mismo archivo reutilizado del resto de proyectos KA — ver
// Reglas/Kenneth Plataforma GitHub/_middleware.js. Configurar en Cloudflare Pages
// (Settings -> Variables and secrets): AUTH_USER (texto) y AUTH_PASS (secreto).
export const onRequest = async (context) => {
  const { request, env, next } = context;

  const url = new URL(request.url);
  if (url.pathname === '/favicon.ico' || url.pathname === '/robots.txt') {
    return next();
  }

  const expectedUser = env.AUTH_USER || '';
  const expectedPass = env.AUTH_PASS || '';

  if (!expectedPass) {
    return new Response(
      'Auth no configurado. Set AUTH_USER / AUTH_PASS en Cloudflare Pages.',
      { status: 500 }
    );
  }

  const auth = request.headers.get('Authorization');

  const promptForAuth = () =>
    new Response('Acceso restringido', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Área restringida", charset="UTF-8"',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  if (!auth || !auth.startsWith('Basic ')) return promptForAuth();

  let decoded;
  try {
    decoded = atob(auth.slice('Basic '.length));
  } catch {
    return promptForAuth();
  }

  const idx = decoded.indexOf(':');
  if (idx < 0) return promptForAuth();

  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);

  const ok = user === expectedUser && safeCompare(pass, expectedPass);
  if (!ok) return promptForAuth();

  return next();
};

function safeCompare(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
