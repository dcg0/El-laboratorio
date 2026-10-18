# El Laboratorio — DC Laboratory

Portal web de proyectos, herramientas y documentación pública de DC Laboratory.

- **Sitio:** [https://dcg0.github.io/El-laboratorio/](https://dcg0.github.io/El-laboratorio/) (cuando GitHub Pages esté habilitado).
- **Páginas:** portada, productos, demos y páginas de proyecto enlazadas desde `index.html`.
- **Vista local:** `python3 -m http.server 8000` desde la raíz del repositorio.
- **Validación estática:** `python3 tools/check_site_links.py`.

El contenido web procede del repositorio [`DC-laboratory`](https://github.com/dcg0/DC-laboratory); se conservan enlaces de releases y repositorios de cada producto. Las imágenes del logo y la portada principal usan el arte compartido por el propietario.

**Nota de seguridad:** `admin.html` es una página estática pública, no un panel autenticado. No alojes allí secretos, credenciales ni datos personales. Las descargas enlazadas externamente permanecen en sus repositorios de origen.
