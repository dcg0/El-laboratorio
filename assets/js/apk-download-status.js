document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.apk-download-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (link.dataset.busy === 'true') return;
      link.dataset.busy = 'true';
      const original = link.innerHTML;
      link.classList.add('is-downloading');
      link.innerHTML = 'PREPARANDO DESCARGA... <span>↓</span>';
      window.setTimeout(() => {
        link.innerHTML = original;
        link.classList.remove('is-downloading');
        link.dataset.busy = 'false';
      }, 2600);
    });
  });
});
