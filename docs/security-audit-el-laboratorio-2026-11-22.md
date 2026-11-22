# Auditoría de seguridad y calidad — El-laboratorio

**Repositorio:** `dcg0/El-laboratorio`
**Rama auditada:** `main`
**Fecha:** 22 de noviembre de 2026
**Alcance:** CI/CD, insignias, seguridad de GitHub, dependencias, secretos, estructura, sitio público, juego DC vs WIZKAS y APK remasterizada.

## Estado de publicación

Al iniciar la auditoría, la copia local contenía cuatro commits posteriores a `origin/main`, incluidos Morgan, la APK remasterizada y los cambios de la tarjeta. La página pública todavía servía el commit anterior y la URL pública de la APK remasterizada devolvía `404`. Estos commits se publicarán después de cerrar las correcciones de CI descritas en este documento.

## Insignias y CI

Los últimos workflows visibles en GitHub para el commit público anterior (`e6c0425`) estaban en estado exitoso: Security checks, CodeQL y Pages deployment. El workflow de seguridad se amplió para que, además de validar `DCA-ChromeOS.apk`, compruebe el checksum del asset de GitHub Release `dc-vs-wizkas-morgan-v1.0.0`, la sintaxis de `game/game.js` y `tools/simulate_angel_miguel.mjs`, y que la simulación reproducible produzca resultados para Angel y Miguel.

La insignia no se considera definitivamente aprobada hasta que GitHub ejecute esos checks sobre el nuevo commit publicado. No se encontró una insignia roja en los runs consultados; el estado del nuevo commit queda pendiente de ejecución.

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

## Puntuación provisional

| Categoría | Puntos | Resultado |
|---|---:|---|
| Insignias sin errores | 25 | 20 — runs públicos anteriores exitosos; falta ejecutar el nuevo commit |
| Sin vulnerabilidades críticas | 25 | 15 — no hay hallazgos locales, pero las alertas privadas no son consultables |
| Sin vulnerabilidades altas | 20 | 12 — mismo límite de permisos de seguridad |
| Buenas prácticas de código | 15 | 13 — escáner de secretos, CSP, `noopener`, CodeQL y pruebas locales presentes |
| Documentación y estructura | 15 | 11 — `SECURITY.md`, `CODEOWNERS` y Dependabot presentes; falta licencia y protección de `main` |
| **Total** | **100** | **71/100** |

## Veredicto

**REQUIERE REVISIÓN.** No hay evidencia local de vulnerabilidad crítica ni secretos expuestos, pero no corresponde declarar aprobación total mientras las alertas de seguridad no puedan consultarse y `main` permanezca sin protección. Después de publicar los commits, se debe confirmar que Security checks, CodeQL y Pages terminan exitosamente sobre el nuevo SHA y volver a comprobar la URL pública de la APK.

## Acciones pendientes, en orden

1. Publicar los cuatro commits locales y la corrección del workflow.
2. Confirmar los nuevos runs de Security checks, CodeQL y Pages.
3. Habilitar un conector/token con permisos de lectura de Code Scanning, Dependabot alerts y Secret Scanning alerts.
4. Configurar protección de `main` con los checks requeridos y revisión obligatoria.
5. Añadir una licencia explícita si el propietario confirma qué licencia desea aplicar.
6. Repetir la auditoría para el siguiente repositorio de `dcg0` únicamente después de cerrar los pasos anteriores.
