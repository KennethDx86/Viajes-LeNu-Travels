// Protege TODO el sitio (incluido /db-proxy) con una pantalla de acceso propia con
// la marca KA, en vez del diálogo nativo feo del navegador (Basic Auth clásico).
// Usa sesión por cookie firmada (HMAC), no expone la contraseña en la URL ni en JS.
//
// Configurar en Cloudflare Pages (Settings -> Variables and secrets):
//   AUTH_USER    (texto)   el usuario que quieras
//   AUTH_PASS    (secreto) la contraseña
//   AUTH_SECRET  (secreto, opcional) firma de la cookie — si no se define, se reusa AUTH_PASS

const COOKIE_NAME = 'vlt_session';
const SESSION_HOURS = 24;
const SESSION_HOURS_REMEMBER = 24 * 30;

export const onRequest = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (url.pathname === '/favicon.ico' || url.pathname === '/robots.txt') {
    return next();
  }

  const expectedUser = env.AUTH_USER || '';
  const expectedPass = env.AUTH_PASS || '';
  const secret = env.AUTH_SECRET || expectedPass;

  if (!expectedPass) {
    return new Response('Auth no configurado. Set AUTH_USER / AUTH_PASS en Cloudflare Pages.', { status: 500 });
  }

  // ── Envío del formulario de login ──
  if (request.method === 'POST' && url.pathname === '/__login') {
    let form;
    try { form = await request.formData(); } catch { form = new Map(); }
    const user = (form.get ? form.get('usuario') : '') || '';
    const pass = (form.get ? form.get('contrasena') : '') || '';
    const remember = (form.get ? form.get('recordar') : '') === 'on';
    let nextPath = (form.get ? form.get('next') : '') || '/';
    if (!nextPath.startsWith('/')) nextPath = '/';

    if (user === expectedUser && safeCompare(pass, expectedPass)) {
      const hours = remember ? SESSION_HOURS_REMEMBER : SESSION_HOURS;
      const token = await makeToken(secret, hours);
      const dest = new URL(nextPath, request.url).toString();
      const resp = new Response(null, { status: 302, headers: { Location: dest } });
      resp.headers.append('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; Max-Age=${hours * 3600}; HttpOnly; Secure; SameSite=Lax`);
      return resp;
    }

    return new Response(renderLogin({ error: true, next: nextPath }), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // ── ¿Ya trae una cookie de sesión válida? ──
  const cookieHeader = request.headers.get('Cookie') || '';
  const cookieMatch = cookieHeader.match(/(?:^|;\s*)vlt_session=([^;]+)/);
  if (cookieMatch) {
    const ok = await verifyToken(cookieMatch[1], secret);
    if (ok) return next();
  }

  // ── Sin sesión válida: mostrar la pantalla de acceso propia ──
  const nextPath = url.pathname + url.search;
  return new Response(renderLogin({ next: nextPath }), {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};

// ══ Pantalla de acceso — marca KA ══
function renderLogin({ error = false, next = '/' } = {}) {
  return `<!DOCTYPE html>
<html lang="es-CR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Acceso · Viajes LeNu Travels</title>
<style>
  :root{
    --ka-primary:#1B6B64;
    --ka-accent:#DD8B5D;
    --ka-accent-hover:#C6763F;
    --ka-dark:#1D1B3A;
    --ka-base-sobria:#F4F6F5;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;height:100%;}
  body{
    background:var(--ka-base-sobria);
    font-family:Arial, Helvetica, sans-serif;
    display:flex; align-items:center; justify-content:center;
    min-height:100vh; padding:20px;
  }
  .card{
    width:100%; max-width:360px;
    background:linear-gradient(160deg, var(--ka-dark) 0%, #134F49 130%);
    border-radius:22px;
    padding:34px 30px 28px;
    box-shadow:0 20px 50px rgba(0,0,0,0.25);
    color:#fff;
  }
  .mark{ display:flex; justify-content:center; margin-bottom:10px; }
  .mark svg{ width:34px; height:auto; }
  h1{
    text-align:center; margin:0 0 26px;
    font-size:12px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
    color:rgba(255,255,255,0.7);
  }
  form{ display:flex; flex-direction:column; gap:14px; }
  label{
    display:block; font-size:10.5px; font-weight:700; letter-spacing:.08em;
    text-transform:uppercase; color:rgba(255,255,255,0.55); margin-bottom:6px;
  }
  input[type=text], input[type=password]{
    width:100%; background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.16);
    border-radius:10px; padding:11px 13px; font-size:14px; color:#fff; font-family:inherit;
  }
  input[type=text]::placeholder, input[type=password]::placeholder{ color:rgba(255,255,255,0.35); }
  input[type=text]:focus, input[type=password]:focus{ outline:none; border-color:var(--ka-accent); }
  .remember{ display:flex; align-items:center; gap:7px; font-size:12.5px; color:rgba(255,255,255,0.65); margin-top:2px; }
  .remember input{ width:14px; height:14px; }
  .error{ background:rgba(221,139,93,0.18); border:1px solid rgba(221,139,93,0.5); color:#F2C4A4;
    font-size:12.5px; border-radius:8px; padding:8px 10px; text-align:center; }
  button{
    margin-top:6px; border:none; border-radius:30px; padding:13px; width:100%;
    background:var(--ka-accent); color:#fff; font-weight:700; font-size:14px;
    font-family:inherit; cursor:pointer;
  }
  button:hover{ background:var(--ka-accent-hover); }
  .footnote{ text-align:center; margin-top:16px; font-size:11px; color:rgba(255,255,255,0.4); }
</style>
</head>
<body>
  <div class="card">
    <div class="mark">
      <svg viewBox="0 0 1179 945" xmlns="http://www.w3.org/2000/svg"><g transform="translate(0,945) scale(0.1,-0.1)" fill="#F2C4A4" stroke="none"><path d="M5976 8698 c-32 -49 -47 -103 -57 -206 -30 -321 -121 -688 -283 -1142 -18 -52 -47 -133 -64 -180 -16 -47 -33 -92 -36 -101 -6 -13 -28 -17 -114 -21 -88 -5 -121 -11 -187 -37 -152 -59 -320 -179 -418 -299 -63 -77 -85 -117 -103 -187 -33 -123 -7 -207 73 -235 58 -20 193 -2 337 45 59 19 110 35 112 35 7 0 -18 -55 -115 -249 -348 -694 -583 -1020 -1375 -1901 -161 -180 -310 -302 -421 -347 -61 -25 -82 -39 -74 -47 7 -7 253 86 327 123 219 111 496 334 709 572 317 355 531 661 821 1174 34 61 214 423 241 485 13 30 46 107 73 171 l50 117 71 32 c40 18 121 57 181 87 59 30 115 53 124 51 8 -2 46 -57 83 -123 175 -310 289 -438 476 -534 l42 -21 -48 -77 c-121 -195 -161 -258 -262 -408 -245 -366 -377 -547 -584 -800 -699 -859 -1665 -1684 -2405 -2056 -167 -84 -246 -114 -344 -129 -266 -43 -424 72 -521 380 -45 143 -45 143 -40 25 16 -318 100 -532 244 -624 133 -85 343 -78 595 22 100 39 371 175 456 229 472 297 888 635 1350 1098 601 601 1146 1306 1617 2088 91 151 120 191 132 186 38 -17 192 -43 314 -54 282 -25 613 20 816 112 294 132 579 465 691 808 38 116 67 230 76 297 7 60 7 60 154 88 47 9 117 25 155 35 39 10 120 28 180 40 61 12 133 28 160 35 64 18 261 45 325 45 28 0 50 4 50 8 0 15 -235 27 -520 27 -224 -1 -291 -4 -363 -19 -48 -10 -92 -16 -98 -14 -8 3 -11 40 -10 114 3 195 -31 478 -80 650 -54 195 -115 298 -208 352 -41 24 -56 27 -136 27 -128 0 -175 -25 -326 -175 -196 -195 -344 -431 -728 -1162 -40 -76 -79 -138 -86 -138 -27 0 -309 -92 -423 -138 -192 -79 -269 -141 -286 -230 -8 -47 15 -51 88 -15 85 43 185 82 286 111 47 13 116 33 153 44 38 11 71 18 73 15 3 -3 -7 -27 -22 -53 -58 -104 -309 -546 -332 -584 -8 -13 -17 -10 -63 14 -123 67 -271 199 -332 298 -59 96 -157 271 -157 281 0 7 32 29 70 50 115 61 367 215 492 298 263 176 463 367 590 561 93 141 127 204 214 393 38 83 88 178 111 213 46 66 50 81 31 100 -40 40 -83 -11 -195 -233 -164 -325 -283 -489 -492 -678 -179 -162 -513 -383 -817 -539 l-82 -42 -68 63 c-38 35 -88 74 -111 88 -24 14 -43 26 -43 28 0 2 17 52 39 112 21 59 62 185 90 278 29 94 61 197 71 230 31 98 79 320 102 470 15 103 21 190 22 325 1 128 5 192 14 207 17 30 15 70 -4 77 -25 10 -33 7 -48 -16z m2253 -438 c106 -54 191 -228 236 -485 22 -126 37 -341 30 -421 l-7 -70 -87 -18 c-47 -10 -147 -31 -221 -46 -441 -92 -925 -188 -929 -185 -2 2 20 48 49 102 309 577 483 850 638 1001 138 134 209 164 291 122z m231 -1187 c0 -65 -86 -290 -158 -413 -278 -473 -683 -689 -1252 -667 -128 5 -320 33 -336 50 -6 5 13 40 91 172 36 60 152 272 291 532 21 40 45 75 54 78 21 6 329 71 480 100 117 23 231 47 625 129 191 40 205 42 205 19z m-3001 -195 c0 -7 -28 -78 -63 -157 l-62 -144 -54 -20 c-226 -79 -438 -125 -454 -98 -12 18 44 100 117 172 113 112 267 204 401 239 85 22 116 24 115 8z m237 -61 c45 -31 69 -67 45 -67 -5 0 -44 -16 -85 -35 -86 -40 -101 -42 -92 -17 35 93 63 152 72 152 7 0 34 -15 60 -33z"/></g></svg>
    </div>
    <h1>Acceso · Viajes LeNu Travels</h1>
    <form method="POST" action="/__login">
      <input type="hidden" name="next" value="${escapeAttr(next)}">
      ${error ? '<div class="error">Usuario o contraseña incorrectos.</div>' : ''}
      <div>
        <label>Usuario</label>
        <input type="text" name="usuario" autocomplete="username" required autofocus>
      </div>
      <div>
        <label>Contraseña</label>
        <input type="password" name="contrasena" autocomplete="current-password" required>
      </div>
      <label class="remember"><input type="checkbox" name="recordar"> Recordar</label>
      <button type="submit">Iniciar sesión</button>
    </form>
    <div class="footnote">Acceso restringido</div>
  </div>
</body>
</html>`;
}

function escapeAttr(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function safeCompare(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return b64url(new Uint8Array(sigBuf));
}

function b64url(bytes) {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeToken(secret, hours) {
  const expiry = Date.now() + hours * 3600 * 1000;
  const sig = await hmac(secret, String(expiry));
  return `${expiry}.${sig}`;
}

async function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [expiryStr, sig] = parts;
  const expiry = parseInt(expiryStr, 10);
  if (!expiry || Number.isNaN(expiry) || Date.now() > expiry) return false;
  const expectedSig = await hmac(secret, expiryStr);
  return sig.length === expectedSig.length && safeCompare(sig, expectedSig);
}
