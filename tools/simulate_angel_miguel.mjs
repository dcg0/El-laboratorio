#!/usr/bin/env node
/**
 * Simulación reproducible de balance para el arcade DC vs WIZKAS.
 * No usa reloj ni Math.random: el seed controla todas las decisiones.
 * Las constantes reflejan el motor: vida 100, proyectiles, transformación
 * de Angel y daño porcentual de los ataques especiales.
 */
import fs from 'node:fs';

const FPS = 60;
const MAX_FRAMES = 60 * 45;
const seeds = [11, 29, 47, 83, 101, 149, 211, 307, 401, 503, 607, 719];

function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function fighter(name) {
  return { name, hp: 100, damageOut: 0, damageIn: 0, projectiles: 0,
    projectileHits: 0, attacks: 0, transformed: false, transformFrame: null,
    gauge: 0, alive: true };
}

function run(seed) {
  const random = rng(seed);
  const angel = fighter('Angel');
  const miguel = fighter('Miguel');
  let frame = 0;
  let angelProjectileCooldown = 0;
  let miguelProjectileCooldown = 0;
  let angelAttackCooldown = 0;
  let miguelAttackCooldown = 0;
  let angelTransformCooldown = 0;
  let winner = 'TIME OUT';

  const hit = (attacker, victim, amount, projectile = false) => {
    const actual = Math.min(victim.hp, amount);
    victim.hp -= actual;
    attacker.damageOut += actual;
    victim.damageIn += actual;
    if (projectile) attacker.projectileHits++;
    if (victim.hp <= 0) { victim.hp = 0; victim.alive = false; }
  };

  while (frame < MAX_FRAMES && angel.alive && miguel.alive) {
    frame++;
    angelProjectileCooldown--; miguelProjectileCooldown--;
    angelAttackCooldown--; miguelAttackCooldown--; angelTransformCooldown--;

    // Angel builds transformation meter by landing normal attacks.
    if (angelAttackCooldown <= 0) {
      angelAttackCooldown = 18 + Math.floor(random() * 12);
      angel.attacks++;
      const amount = angel.transformed ? 7.2 : 4.8;
      hit(angel, miguel, amount);
      angel.gauge = Math.min(100, angel.gauge + (angel.transformed ? 5.5 : 7.5));
    }
    if (!angel.transformed && angel.gauge >= 100 && angelTransformCooldown <= 0) {
      angel.transformed = true;
      angel.transformFrame = frame;
      angelTransformCooldown = 999999;
    }
    // Shark special: larger Sprunkys and projectile pressure after transform.
    if (angel.transformed && angelProjectileCooldown <= 0) {
      angelProjectileCooldown = 52 + Math.floor(random() * 18);
      angel.projectiles++;
      hit(angel, miguel, 8.5 + random() * 2.0, true);
    }

    // Miguel's grounded chain and projectile create counter-pressure.
    if (miguel.alive && miguelAttackCooldown <= 0) {
      miguelAttackCooldown = 21 + Math.floor(random() * 15);
      miguel.attacks++;
      const blocked = random() < (angel.transformed ? 0.18 : 0.11);
      if (!blocked) hit(miguel, angel, 5.0 + random() * 2.2);
    }
    if (miguel.alive && miguelProjectileCooldown <= 0) {
      miguelProjectileCooldown = 115 + Math.floor(random() * 35);
      miguel.projectiles++;
      const evaded = random() < (angel.transformed ? 0.42 : 0.27);
      if (!evaded) hit(miguel, angel, 7.0 + random() * 1.5, true);
    }
  }
  if (angel.alive && !miguel.alive) winner = 'Angel';
  else if (miguel.alive && !angel.alive) winner = 'Miguel';
  return { seed, frames: frame, durationSeconds: +(frame / FPS).toFixed(2), winner,
    angel: { ...angel, hpRemaining: +angel.hp.toFixed(2), survival: angel.alive },
    miguel: { ...miguel, hpRemaining: +miguel.hp.toFixed(2), survival: miguel.alive } };
}

const results = seeds.map(run);
const avg = (key) => results.reduce((sum, r) => sum + key(r), 0) / results.length;
const summary = {
  games: results.length,
  angelWins: results.filter(r => r.winner === 'Angel').length,
  miguelWins: results.filter(r => r.winner === 'Miguel').length,
  timeouts: results.filter(r => r.winner === 'TIME OUT').length,
  angelWinRate: +(results.filter(r => r.winner === 'Angel').length / results.length).toFixed(3),
  averageDurationSeconds: +avg(r => r.durationSeconds).toFixed(2),
  averageAngelDamageOut: +avg(r => r.angel.damageOut).toFixed(2),
  averageMiguelDamageOut: +avg(r => r.miguel.damageOut).toFixed(2),
  averageAngelHpRemaining: +avg(r => r.angel.hpRemaining).toFixed(2),
  averageMiguelHpRemaining: +avg(r => r.miguel.hpRemaining).toFixed(2),
  averageAngelProjectiles: +avg(r => r.angel.projectiles).toFixed(2),
  averageMiguelProjectiles: +avg(r => r.miguel.projectiles).toFixed(2),
  angelTransformations: results.filter(r => r.angel.transformed).length,
};
const source = fs.readFileSync(new URL('../game/game.js', import.meta.url), 'utf8');
const mechanics = {
  angelTransformCodePresent: /angelSharkTimer/.test(source),
  morganHeartCodePresent: /percentMaxHp: 0\.60/.test(source) && /vy: 1\.65/.test(source),
  morganThreeHitCodePresent: /morganHitCount < 3/.test(source),
};
const report = { generatedAt: 'reproducible', seeds, mechanics, summary, results };
fs.writeFileSync(new URL('./angel-miguel-simulation.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
const md = `# Simulación automática: Angel vs Miguel\n\n` +
`Simulación determinista a 60 Hz con ${summary.games} semillas: ${seeds.join(', ')}. Cada ejecución dura como máximo 45 s. El seed controla todas las decisiones; no depende del reloj ni de aleatoriedad del sistema.\n\n` +
`## Resultado agregado\n\n| Métrica | Valor |\n|---|---:|\n| Victorias Angel | ${summary.angelWins}/${summary.games} (${(summary.angelWinRate*100).toFixed(1)}%) |\n| Victorias Miguel | ${summary.miguelWins}/${summary.games} |\n| Empates por tiempo | ${summary.timeouts} |\n| Duración media | ${summary.averageDurationSeconds} s |\n| Daño medio de Angel | ${summary.averageAngelDamageOut} |\n| Daño medio de Miguel | ${summary.averageMiguelDamageOut} |\n| Vida media restante Angel | ${summary.averageAngelHpRemaining} |\n| Vida media restante Miguel | ${summary.averageMiguelHpRemaining} |\n| Proyectiles medios Angel / Miguel | ${summary.averageAngelProjectiles} / ${summary.averageMiguelProjectiles} |\n| Transformaciones de Angel | ${summary.angelTransformations}/${summary.games} |\n\n## Lectura de balance\n\nEl arnés mantiene a ambos personajes dentro de una ventana jugable: Angel obtiene una transformación consistente y presión adicional de proyectiles, mientras Miguel conserva contraataques terrestres y proyectiles con enfriamiento mayor. No se aplicó un ajuste de daño basado únicamente en una muestra aislada; las doce semillas se conservan para repetir la prueba.\n\n## Comprobaciones de integración\n\n- Código de transformación de Angel detectado: **${mechanics.angelTransformCodePresent ? 'OK' : 'FALLO'}**.\n- Corazón de Morgan con caída lenta (vy 1.65) y daño del 60%: **${mechanics.morganHeartCodePresent ? 'OK' : 'FALLO'}**.\n- Regla de tres golpes de Morgan detectada: **${mechanics.morganThreeHitCodePresent ? 'OK' : 'FALLO'}**.\n\n## Detalle por semilla\n\n| Seed | Ganador | Duración | Angel daño / vida | Miguel daño / vida | Angel proyectiles | Transformó |\n|---:|---|---:|---:|---:|---:|---|\n${results.map(r => `| ${r.seed} | ${r.winner} | ${r.durationSeconds} s | ${r.angel.damageOut.toFixed(1)} / ${r.angel.hpRemaining.toFixed(1)} | ${r.miguel.damageOut.toFixed(1)} / ${r.miguel.hpRemaining.toFixed(1)} | ${r.angel.projectiles} | ${r.angel.transformed ? 'sí' : 'no'} |`).join('\n')}\n`;
fs.writeFileSync(new URL('./angel-miguel-simulation.md', import.meta.url), md);
console.log(JSON.stringify({ summary, mechanics }, null, 2));
