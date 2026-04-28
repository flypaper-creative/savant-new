const PRELOADER_DURATION_MS = 12000;
const PRELOADER_EXIT_MS = 900;

function setupPreloader() {
  const preloader = document.querySelector('#preloader');

  if (!preloader) {
    return;
  }

  const sceneMount = preloader.querySelector('#preloader-scene');
  let disposeScene = () => {};

  document.body.classList.add('is-preloading');

  if (sceneMount) {
    import('./public/logo3d/logo3d.js')
      .then(({ initLogo3D }) => {
        const cleanup = initLogo3D(sceneMount);
        if (typeof cleanup === 'function') {
          disposeScene = cleanup;
        }
      })
      .catch(() => {
        preloader.classList.add('preloader--fallback');
      });
  }

  const teardownPreloader = () => {
    preloader.classList.add('preloader--done');
    document.body.classList.remove('is-preloading');

    const removePreloader = () => {
      disposeScene();
      preloader.remove();
    };

    preloader.addEventListener('transitionend', removePreloader, { once: true });
    window.setTimeout(removePreloader, PRELOADER_EXIT_MS + 250);
  };

  window.setTimeout(() => {
    window.requestAnimationFrame(teardownPreloader);
  }, PRELOADER_DURATION_MS);
}

setupPreloader();

const revealItems = document.querySelectorAll('.section-reveal');
const cursorGlow = document.querySelector('.cursor-glow');
const tiltCards = document.querySelectorAll('.tilt-card');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  },
  {
    threshold: 0.2,
  }
);

revealItems.forEach((item) => observer.observe(item));

window.addEventListener('pointermove', (event) => {
  if (!cursorGlow) {
    return;
  }

  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

tiltCards.forEach((card) => {
  card.addEventListener('mousemove', (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rotateY = ((x / rect.width) - 0.5) * 8;
    const rotateX = (0.5 - (y / rect.height)) * 8;

    card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(700px) rotateX(0deg) rotateY(0deg) translateY(0)';
  });
});
