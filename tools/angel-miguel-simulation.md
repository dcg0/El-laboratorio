# Simulación automática: Angel vs Miguel

Simulación determinista a 60 Hz con 12 semillas: 11, 29, 47, 83, 101, 149, 211, 307, 401, 503, 607, 719. Cada ejecución dura como máximo 45 s. El seed controla todas las decisiones; no depende del reloj ni de aleatoriedad del sistema.

## Resultado agregado

| Métrica | Valor |
|---|---:|
| Victorias Angel | 9/12 (75.0%) |
| Victorias Miguel | 3/12 |
| Empates por tiempo | 0 |
| Duración media | 6.01 s |
| Daño medio de Angel | 96.07 |
| Daño medio de Miguel | 87.44 |
| Vida media restante Angel | 12.56 |
| Vida media restante Miguel | 3.93 |
| Proyectiles medios Angel / Miguel | 1.75 / 3.08 |
| Transformaciones de Angel | 12/12 |

## Lectura de balance

El arnés mantiene a ambos personajes dentro de una ventana jugable: Angel obtiene una transformación consistente y presión adicional de proyectiles, mientras Miguel conserva contraataques terrestres y proyectiles con enfriamiento mayor. No se aplicó un ajuste de daño basado únicamente en una muestra aislada; las doce semillas se conservan para repetir la prueba.

## Comprobaciones de integración

- Código de transformación de Angel detectado: **OK**.
- Corazón de Morgan con caída lenta (vy 1.65) y daño del 60%: **OK**.
- Regla de tres golpes de Morgan detectada: **OK**.

## Detalle por semilla

| Seed | Ganador | Duración | Angel daño / vida | Miguel daño / vida | Angel proyectiles | Transformó |
|---:|---|---:|---:|---:|---:|---|
| 11 | Miguel | 5.57 s | 84.1 / 0.0 | 100.0 / 15.9 | 1 | sí |
| 29 | Angel | 5.8 s | 100.0 / 25.5 | 74.5 / 0.0 | 2 | sí |
| 47 | Angel | 6.13 s | 100.0 / 21.8 | 78.2 / 0.0 | 2 | sí |
| 83 | Angel | 6.38 s | 100.0 / 23.0 | 77.0 / 0.0 | 2 | sí |
| 101 | Angel | 6.12 s | 100.0 / 34.5 | 65.5 / 0.0 | 2 | sí |
| 149 | Angel | 6.15 s | 100.0 / 11.6 | 88.4 / 0.0 | 2 | sí |
| 211 | Miguel | 5.8 s | 84.1 / 0.0 | 100.0 / 15.9 | 1 | sí |
| 307 | Angel | 6.22 s | 100.0 / 24.7 | 75.3 / 0.0 | 2 | sí |
| 401 | Miguel | 5.48 s | 84.6 / 0.0 | 100.0 / 15.4 | 1 | sí |
| 503 | Angel | 6.23 s | 100.0 / 1.8 | 98.2 / 0.0 | 2 | sí |
| 607 | Angel | 6.3 s | 100.0 / 1.4 | 98.6 / 0.0 | 2 | sí |
| 719 | Angel | 5.95 s | 100.0 / 6.5 | 93.5 / 0.0 | 2 | sí |
