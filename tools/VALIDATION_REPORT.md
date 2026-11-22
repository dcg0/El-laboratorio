# Reporte de validación — DC vs WIZKAS

## Resultado

La integración de Morgan y la simulación Angel vs Miguel quedaron incorporadas en `main`. La APK debug se construyó con Gradle 8.9 y Android SDK 35; el artefacto incluye el juego estático completo dentro de `assets/site/game/`, incluyendo `game.js`, `morgan.png` y `morgan-heart.png`.

## Pruebas ejecutadas

- `node --check game/game.js`: OK.
- `node --check tools/simulate_angel_miguel.mjs`: OK.
- `python3 tools/check_site_links.py`: OK, 32 páginas; CSP, enlaces, imágenes, metadatos y `noopener` verificados.
- `git diff --check`: OK.
- `sha256sum -c downloads/dc-vs-wizkas-morgan-debug.apk.sha256`: OK.
- El workflow `security.yml` ahora valida también la APK remasterizada, la sintaxis del arcade y la simulación reproducible Angel vs Miguel.
- HTTP local: `game/game.html` y `game/assets/projectiles/morgan-heart.png` responden `200 OK`.
- Navegador: el juego cargó el menú `DC VS WIZKAS — ARCADE TAG FIGHTER`; consola sin errores.
- Assets Morgan: `morgan.png` y `morganroja.png` 482×951 RGBA; `morgan-heart.png` 54×57 RGBA; los tres conservan transparencia.
- APK: contenido comprobado con `unzip -l`; contiene el HTML/JS del juego, el sprite de Morgan, el corazón y los recursos PWA.

## Mecánicas verificadas

- Morgan permanece en la trayectoria aérea de `morganPosition()` durante su fase y no entra en la gravedad ni aterriza.
- Morgan lanza corazones con `vy: 1.65`, vida de 440 frames y `percentMaxHp: 0.60`.
- Morgan requiere tres impactos no bloqueados; el tercer impacto produce K.O.
- Angel conserva la transformación a tiburón y sus proyectiles.
- Miguel conserva la presión terrestre, proyectiles y variantes previas.

## Balance

La prueba determinista de 12 semillas produjo 9 victorias de Angel y 3 de Miguel, sin empates, con transformación de Angel en 12/12 partidas. Se conservó el balance actual: la muestra muestra ventaja de Angel, pero no justifica modificar el daño sin una prueba más amplia de juego real.

## APK

- Asset de Release: `dc-vs-wizkas-morgan-v1.0.0/dc-vs-wizkas-morgan-debug.apk`
- SHA-256 final: `12eb67e1f1b7cac66f9ea1edfe1ad82804c3f0e8dbeee91c1d1e2fe00e8ff4ef`
- El launcher usa la imagen completa oficial DC vs WIZKAS en mdpi, hdpi, xhdpi, xxhdpi y xxxhdpi, sin transparencia ni borde blanco.
- La instalación y ejecución en un emulador Android real no pudo realizarse en el sandbox por falta de dispositivo/emulador ADB.
