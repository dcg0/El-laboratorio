# Auditoría de seguridad y calidad — El-laboratorio

**Repositorio:** `dcg0/El-laboratorio`
**Rama auditada:** `main`
**Fecha:** 22 de noviembre de 2026
**Alcance:** CI/CD, insignias, seguridad de GitHub, dependencias, secretos, estructura, sitio público, juego DC vs WIZKAS y APK remasterizada.

## Estado de publicación

Al iniciar la auditoría, la copia local contenía cuatro commits posteriores a `origin/main`, incluidos Morgan, la APK remasterizada y los cambios de la tarjeta. Se publicó el commit final `e148801`; GitHub Pages ya despliega la página actualizada y la APK se distribuye mediante el Release `dc-vs-wizkas-morgan-v1.0.0`.

## Insignias y CI

Los últimos workflows visibles en GitHub para el commit público anterior (`e6c0425`) estaban en estado exitoso: Security checks, CodeQL y Pages deployment. El workflow de seguridad se amplió para que, además de validar `DCA-ChromeOS.apk`, compruebe el checksum del asset de GitHub Release `dc-vs-wizkas-morgan-v1.0.0`, la sintaxis de `game/game.js` y `tools/simulate_angel_miguel.mjs`, y que la simulación reproducible produzca resultados para Angel y Miguel.

Los runs de Security checks, CodeQL y Pages terminaron en verde sobre `e148801`. Security checks también terminó correctamente para la etiqueta del Release. No se encontró una insignia roja en los runs consultados.

## Seguridad de GitHub

La API del repositorio confirma que están habilitados Dependabot security updates, Secret Scanning y Secret Scanning push protection. Secret Scanning para patrones no asociados a proveedores y validity checks aparecen deshabilitados.

Los endpoints de alertas de Code Scanning, Dependabot y Secret Scanning devolvieron `403 Resource not accessible by integration` con el token disponible en esta sesión. Por lo tanto, esas alertas no pueden declararse limpias: su estado es **no verificable**. Se requiere un token/conector con permisos de lectura de seguridad para completar esta parte sin inferencias.

La rama `main` no está protegida. Esto permite pushes directos y no exige revisión de pull request. Se recomienda configurar protección de rama con revisión obligatoria, checks de Security checks y CodeQL, resolución de conversaciones y restricción de pushes directos. No se aplicó automáticamente para evitar bloquear al propietario sin confirmar la política de revisión deseada.

## Dependencias y código

No se encontraron manifiestos `package.json`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Cargo.toml` ni `pom.xml` en el repositorio. Dependabot está configurado para GitHub Actions, que es el único ecosistema declarativo detectado en la raíz.

La búsqueda estática no detectó tokens conocidos, claves privadas, contraseñas literales ni comandos de instalación remota del tipo `curl | bash`. `tools/check_secrets.py` y sus ocho pruebas unitarias terminaron correctamente. `git diff --check`, la comprobación de sintaxis JavaScript y la validación de HTML/enlaces también terminaron correctamente.

No se detectaron archivos rastreados de más de 50 MB en el inventario realizado. Los artefactos de build Android no están rastreados por Git.

## Juego y APK

La integración de Morgan conserva las reglas solicitadas: permanece en la trayectoria aérea superior, lanza `morgan-heart.png` con caída lenta (`vy: 1.65`), el corazón aplica `60%` de la vida máxima y Morgan queda fuera de combate al tercer impacto no bloqueado. La APK incluye `game.html`, `game.js`, los sprites de Morgan, el corazón, la tarjeta original y los cinco íconos launcher sin borde blanco.

La simulación determinista Angel vs Miguel se ejecutó con 12 semillas y produjo 9 victorias de Angel, 3 de Miguel y 0 empates; Angel se transformó en 12/12 partidas. La prueba no modifica el balance únicamente con esa muestra.

La APK remasterizada pasó `unzip -t` y la comprobación del checksum publicado:

```text
SHA-256: 12eb67e1f1b7cac66f9ea1edfe1ad82804c3f0e8dbeee91c1d1e2fe00e8ff4ef
Asset: `dc-vs-wizkas-morgan-v1.0.0/dc-vs-wizkas-morgan-debug.apk`
```

No se pudo ejecutar la APK en un emulador Android real porque este entorno no tiene emulador ni dispositivo ADB conectado. La validación Android queda limitada a compilación, integridad del ZIP, contenido del APK y validación web/estática.

## Puntuación actual

| Categoría | Puntos | Resultado |
|---|---:|---|
| Insignias sin errores | 25 | 25 — Security checks, CodeQL y Pages en verde sobre `e148801` |
| Sin vulnerabilidades críticas | 25 | 15 — no hay hallazgos locales, pero las alertas privadas no son consultables |
| Sin vulnerabilidades altas | 20 | 12 — mismo límite de permisos de seguridad |
| Buenas prácticas de código | 15 | 13 — escáner de secretos, CSP, `noopener`, CodeQL y pruebas locales presentes |
| Documentación y estructura | 15 | 11 — `SECURITY.md`, `CODEOWNERS` y Dependabot presentes; falta licencia y protección de `main` |
| **Total** | **100** | **76/100** |

## Veredicto

**REQUIERE REVISIÓN.** La publicación, la página, la descarga y los checks de CI están correctos. No corresponde declarar aprobación total mientras las alertas privadas de seguridad no puedan consultarse y `main` permanezca sin protección.

## Acciones pendientes, en orden

1. Habilitar un conector/token con permisos de lectura de Code Scanning, Dependabot alerts y Secret Scanning alerts.
2. Configurar protección de `main` con los checks requeridos y revisión obligatoria.
3. Añadir una licencia explícita si el propietario confirma qué licencia desea aplicar.
4. Mantener la validación de la APK desde el Release y no volver a rastrear el binario de 310 MB en Git.
