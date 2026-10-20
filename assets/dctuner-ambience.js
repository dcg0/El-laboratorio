(() => {
  const background = document.getElementById('ambient-image');
  const sections = [...document.querySelectorAll('[data-tuner-section]')];
  if (!background || sections.length === 0) return;

  let activeImage = '';
  let changeTimer = 0;

  const activate = (section) => {
    const image = section.dataset.image;
    const rgb = section.dataset.rgb;
    if (rgb) document.documentElement.style.setProperty('--active-rgb', rgb);
    if (!image || image === activeImage) return;

    activeImage = image;
    background.classList.add('is-fading');
    window.clearTimeout(changeTimer);
    changeTimer = window.setTimeout(() => {
      background.style.backgroundImage = `linear-gradient(rgba(3, 7, 13, .70), rgba(3, 7, 13, .82)), url("${image}")`;
      window.requestAnimationFrame(() => background.classList.remove('is-fading'));
    }, 340);
  };

  activate(sections[0]);
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) activate(visible.target);
  }, {
    rootMargin: '-24% 0px -24% 0px',
    threshold: [0, 0.2, 0.4, 0.6, 0.8]
  });

  sections.forEach((section) => observer.observe(section));
})();
