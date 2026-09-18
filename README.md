# Viajes LeNu Travels

Cotizador, comparador y registro de cotizaciones para Viajes LeNu Travels.

## Trabajo diario

1. Abrir esta copia de trabajo, no la carpeta de respaldo anterior.
2. Actualizar primero: `git pull --ff-only origin main`.
3. Realizar y revisar los cambios con `git diff`.
4. Comprobar las páginas afectadas en un navegador.
5. Preparar únicamente los archivos verificados: `git add <rutas>`.
6. Crear un commit descriptivo y publicar: `git push origin main`.
7. Confirmar que GitHub Pages terminó el despliegue y revisar el sitio publicado.

La guía operativa completa, las reglas de nombres y la nota sobre las funciones serverless están en [AGENTS.md](AGENTS.md).

## Despliegue

El sitio estático se despliega desde la rama `main` mediante GitHub Pages. Los archivos dentro de `functions/` están conservados en el repositorio, pero GitHub Pages no los ejecuta; requieren un proveedor compatible con funciones, como Cloudflare Pages, y sus secretos configurados fuera de Git.

## Seguimiento pendiente

`cotizador-viajes.html` referencia `/manifest.webmanifest`, pero ese archivo no existe actualmente en el repositorio ni en la copia local de respaldo. Validar si debe recuperarse o retirar esa referencia antes de un cambio futuro.
