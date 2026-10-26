if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const base = location.pathname.includes('/game/') ? '../' : './';
    navigator.serviceWorker.register(`${base}dcvswizz-sw.js`, { scope: base }).catch(() => {});
  });
}
