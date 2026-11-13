(() => {
  const grid = document.querySelector('.project-grid');
  if (!grid || typeof HTMLDialogElement === 'undefined') return;

  const dialog = document.createElement('dialog');
  dialog.id = 'project-card-dialog';
  dialog.setAttribute('aria-label', 'Tarjeta de proyecto ampliada');

  const closeButton = document.createElement('button');
  closeButton.className = 'card-expand-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Cerrar tarjeta ampliada');
  closeButton.textContent = '×';

  const content = document.createElement('div');
  content.id = 'project-card-dialog-content';
  dialog.append(closeButton, content);
  document.body.append(dialog);

  const interactiveSelector = 'a, button, input, select, textarea, summary, [contenteditable="true"]';
  let opener = null;
  let lastTouchCard = null;
  let lastTouchAt = 0;

  function cardTitle(card) {
    const heading = card.querySelector('.project-content h3, h3');
    return heading ? heading.textContent.replace(/\s+/g, ' ').trim() : 'Proyecto DC Laboratory';
  }

  function openCard(card) {
    if (dialog.open || !card) return;
    const expanded = card.cloneNode(true);
    const title = cardTitle(card);

    expanded.classList.remove('reveal');
    expanded.classList.add('project-card-expanded');
    expanded.removeAttribute('tabindex');
    expanded.removeAttribute('aria-haspopup');
    expanded.removeAttribute('aria-describedby');
    expanded.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    expanded.setAttribute('aria-label', title);

    content.replaceChildren(expanded);
    dialog.setAttribute('aria-label', `Tarjeta completa: ${title}`);
    opener = card;
    dialog.showModal();
    closeButton.focus({ preventScroll: true });
  }

  grid.querySelectorAll('.project-card').forEach((card) => {
    const title = cardTitle(card);
    card.tabIndex = 0;
    card.setAttribute('aria-haspopup', 'dialog');
    card.setAttribute('aria-describedby', 'project-card-expand-help');
    card.title = `Doble clic o doble toque para ampliar: ${title}`;

    card.addEventListener('keydown', (event) => {
      if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) return;
      event.preventDefault();
      openCard(card);
    });
  });

  grid.addEventListener('dblclick', (event) => {
    if (event.target.closest(interactiveSelector)) return;
    const card = event.target.closest('.project-card');
    if (!card || !grid.contains(card)) return;
    event.preventDefault();
    openCard(card);
  });

  // En pantallas táctiles, dos toques rápidos sobre la tarjeta equivalen al doble clic.
  grid.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'touch') return;
    const target = event.target instanceof Element ? event.target : null;
    const card = target && target.closest('.project-card');
    if (!card || !grid.contains(card) || target.closest(interactiveSelector)) {
      lastTouchCard = null;
      return;
    }

    const now = performance.now();
    if (lastTouchCard === card && now - lastTouchAt <= 420) {
      lastTouchCard = null;
      openCard(card);
      return;
    }
    lastTouchCard = card;
    lastTouchAt = now;
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    content.replaceChildren();
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
})();
