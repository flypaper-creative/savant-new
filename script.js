const PRELOADER_DURATION_MS = 7000;
const PRELOADER_EXIT_MS = 900;

let heroLogoInitialized = false;

function setupHeroLogo() {
  const heroMount = document.querySelector('#hero-logo-scene');

  if (!heroMount || heroLogoInitialized) {
    return;
  }

  heroLogoInitialized = true;

  import('./public/logo3d/logo3d.js')
    .then(({ initLogo3D }) => {
      initLogo3D(heroMount, { variant: 'hero' });
    })
    .catch(() => {
      heroMount.classList.add('hero__model--fallback');
    });
}

function setupPreloader() {
  const preloader = document.querySelector('#preloader');

  if (!preloader) {
    setupHeroLogo();
    return;
  }

  const sceneMount = preloader.querySelector('#preloader-scene');
  const enterBtn = preloader.querySelector('#preloader-enter');
  const progressFill = preloader.querySelector('#preloader-progress-fill');
  const hudInner = preloader.querySelector('#preloader-hud-inner');
  let disposeScene = () => {};
  let isExiting = false;

  document.body.classList.add('is-preloading');

  // Animate the progress bar independently
  let progressRaf = 0;
  const startTime = performance.now();

  const tickProgress = () => {
    const progress = Math.min((performance.now() - startTime) / PRELOADER_DURATION_MS, 1);

    if (progressFill) {
      progressFill.style.transform = `scaleX(${progress})`;
      progressFill.parentElement?.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    }

    if (progress < 1) {
      progressRaf = window.requestAnimationFrame(tickProgress);
    }
  };

  progressRaf = window.requestAnimationFrame(tickProgress);

  const teardownPreloader = () => {
    if (isExiting) {
      return;
    }

    isExiting = true;
    window.cancelAnimationFrame(progressRaf);
    setupHeroLogo();
    preloader.classList.add('preloader--done');
    document.body.classList.remove('is-preloading');

    const removePreloader = () => {
      disposeScene();
      preloader.remove();
    };

    preloader.addEventListener('transitionend', removePreloader, { once: true });
    window.setTimeout(removePreloader, PRELOADER_EXIT_MS + 250);
  };

  // Enter button click dismisses immediately
  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      window.requestAnimationFrame(teardownPreloader);
    });
  }

  if (sceneMount) {
    import('./public/logo3d/logo3d.js')
      .then(({ initLogo3D }) => {
        const cleanup = initLogo3D(sceneMount, {
          variant: 'preloader',
          onLogoReady: () => {
            if (enterBtn) {
              enterBtn.tabIndex = 0;
              enterBtn.classList.add('preloader__enter-btn--visible');
            }

            if (hudInner) {
              hudInner.classList.add('preloader__hud-inner--hide');
            }
          },
        });

        if (typeof cleanup === 'function') {
          disposeScene = cleanup;
        }
      })
      .catch(() => {
        preloader.classList.add('preloader--fallback');

        // Fallback: show enter button after most of the duration
        window.setTimeout(() => {
          if (enterBtn) {
            enterBtn.tabIndex = 0;
            enterBtn.classList.add('preloader__enter-btn--visible');
          }

          if (hudInner) {
            hudInner.classList.add('preloader__hud-inner--hide');
          }
        }, PRELOADER_DURATION_MS * 0.78);
      });
  }

  // Auto-dismiss fallback after full duration
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
