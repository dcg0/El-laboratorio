# DCtuneRstudio #0 — ficha del proyecto

Página estática del portfolio El Laboratorio que presenta DCtuneRstudio como una interfaz web local de telemetría ECU. Explica el flujo entre sensores, ECU, bridge local, panel y exportación, y distingue el alcance confirmado para Speeduino del perfil normalizado de MegaSquirt.

## Vista previa local

Desde la raíz del repositorio:

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080/dctunerstudio0/` en un navegador. No requiere instalación de dependencias ni proceso de compilación.

## Archivos

- `index.html`: contenido, navegación, metadatos y enlaces a documentación y talleres.
- `styles.css`: diseño OLED oscuro, adaptable y accesible.
- `assets/`: identidad visual, ilustraciones y controlador del menú móvil.

## Alcance descrito

La ficha no es la aplicación ECU ni un servicio en la nube. El panel web requiere el bridge local y hardware compatible para recibir telemetría. No anuncia escritura ni flasheo de mapas. El cableado y la compatibilidad dependen de la placa, el firmware, el arnés y el acondicionamiento de señal; la ilustración de sensores no es un pinout.
