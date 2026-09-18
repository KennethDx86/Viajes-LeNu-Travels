# Viajes LeNu Travels — guía para Codex

## Alcance del repositorio

- La rama de publicación es `main`.
- El remoto de publicación es `origin` (`KennethDx86/Viajes-LeNu-Travels`).
- Los archivos HTML se publican desde la raíz del repositorio. No moverlos a `html/`.
- Conservar literalmente los nombres con espacios, tildes y corchetes, especialmente `functions/db-proxy/[[path]].js`.
- No almacenar tokens, claves ni archivos `.env` en Git. Los secretos deben configurarse en el proveedor de despliegue.

## Publicar desde Codex

1. Revisar el alcance con `git status`, `git diff` y una comprobación visual de las páginas modificadas.
2. Si existe un archivo de versión o registro en el cambio, actualizarlo. Actualmente no hay un registro de versiones central; los metadatos `kla-published` de las páginas son marcadores de publicación y se actualizan solo cuando corresponda al lanzamiento.
3. Añadir de forma explícita solo los archivos revisados: `git add <rutas>`.
4. Revisar el índice con `git diff --cached` y crear un commit descriptivo.
5. Publicar con `git push origin main`.
6. Confirmar el despliegue asociado al commit y comprobar la URL pública.

No se depende de `Publicar cambios.command`. El atajo antiguo sigue en la carpeta de respaldo local y no forma parte de esta copia de trabajo.

## Despliegue actual y límite conocido

GitHub Pages está conectado a `main` y publica el sitio estático. El historial de despliegues confirma ese origen. GitHub Pages no ejecuta las funciones de Pages Functions/Workers:

- `functions/_middleware.js` (autenticación)
- `functions/db-proxy/[[path]].js` (proxy de Supabase)

Esos archivos se mantienen porque son parte del proyecto. Antes de depender en producción de autenticación o de `/db-proxy`, hay que conectar `main` a Cloudflare Pages (o a otro entorno compatible), crear allí las variables `AUTH_USER`, `AUTH_PASS`, `AUTH_SECRET`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, y verificar esas rutas. No cambiar esta infraestructura sin aprobación explícita.

## Mantenimiento

- No borrar ni mover archivos duplicados, obsoletos o aparentemente sin uso sin presentar primero el hallazgo y obtener aprobación.
- Antes de cambios estructurales, comprobar que no se introduzcan rutas absolutas ni dependencias de la carpeta de respaldo.
- Mantener el repositorio limpio: revisar `git status` antes y después de cada publicación.
