const PRELOADER_DURATION_MS = 6200;
const PRELOADER_EXIT_MS = 900;

let heroViewerStarted = false;
let viewerModulePromise;

function loadViewerModule() {
  if (!viewerModulePromise) {
    viewerModulePromise = import('./public/assets/logo7/logo7-viewer.js');
  }

  return viewerModulePromise;
}

function mountLogo7Scene(element, options = {}) {
  return loadViewerModule().then(({ initLogo7Viewer }) => initLogo7Viewer(element, options));
}

function setupHeroViewer() {
  const heroScene = document.querySelector('#hero-logo-scene');

  if (!heroScene || heroViewerStarted) {
    return;
  }

  heroViewerStarted = true;

  mountLogo7Scene(heroScene, { variant: 'hero' }).catch(() => {
    heroScene.classList.add('hero__model--fallback');
  });
}

function setupPreloader() {
  const preloader = document.querySelector('#preloader');

  if (!preloader) {
    setupHeroViewer();
    return;
  }

  const sceneMount = document.querySelector('#preloader-scene');
  const progressFill = document.querySelector('#preloader-progress-fill');
  const panelInner = document.querySelector('#preloader-panel-inner');
  const enterButton = document.querySelector('#preloader-enter');

  let disposeScene = () => {};
  let isExiting = false;
  let progressRaf = 0;
  const startTime = performance.now();

  document.body.classList.add('is-preloading');

  const finish = () => {
    if (isExiting) {
      return;
    }

    isExiting = true;
    window.cancelAnimationFrame(progressRaf);
    setupHeroViewer();
    document.body.classList.remove('is-preloading');
    preloader.classList.add('preloader--done');

    const cleanup = () => {
      disposeScene();
      preloader.remove();
    };

    preloader.addEventListener('transitionend', cleanup, { once: true });
    window.setTimeout(cleanup, PRELOADER_EXIT_MS + 250);
  };

  const tick = () => {
    const progress = Math.min((performance.now() - startTime) / PRELOADER_DURATION_MS, 1);

    if (progressFill) {
      progressFill.style.transform = `scaleX(${progress})`;
      progressFill.parentElement?.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    }

    if (progress < 1 && !isExiting) {
      progressRaf = window.requestAnimationFrame(tick);
    }
  };

  progressRaf = window.requestAnimationFrame(tick);

  if (enterButton) {
    enterButton.addEventListener('click', () => {
      window.requestAnimationFrame(finish);
    });
  }

  if (sceneMount) {
    mountLogo7Scene(sceneMount, {
      variant: 'preloader',
      onReady: () => {
        panelInner?.classList.add('preloader__panel-inner--hide');

        if (enterButton) {
          enterButton.tabIndex = 0;
          enterButton.classList.add('preloader__enter-btn--visible');
        }
      },
    })
      .then((cleanup) => {
        if (typeof cleanup === 'function') {
          disposeScene = cleanup;
        }
      })
      .catch(() => {
        preloader.classList.add('preloader--fallback');

        window.setTimeout(() => {
          panelInner?.classList.add('preloader__panel-inner--hide');

          if (enterButton) {
            enterButton.tabIndex = 0;
            enterButton.classList.add('preloader__enter-btn--visible');
          }
        }, PRELOADER_DURATION_MS * 0.72);
      });
  }

  window.setTimeout(() => {
    window.requestAnimationFrame(finish);
  }, PRELOADER_DURATION_MS);
}

function setupSectionReveal() {
  const revealItems = document.querySelectorAll('.section-reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupCursorGlow() {
  const glow = document.querySelector('.cursor-glow');

  if (!glow) {
    return;
  }

  const state = {
    currentX: window.innerWidth * 0.5,
    currentY: window.innerHeight * 0.5,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.5,
  };

  const update = () => {
    state.currentX += (state.targetX - state.currentX) * 0.12;
    state.currentY += (state.targetY - state.currentY) * 0.12;

    glow.style.left = `${state.currentX}px`;
    glow.style.top = `${state.currentY}px`;

    window.requestAnimationFrame(update);
  };

  window.addEventListener('pointermove', (event) => {
    state.targetX = event.clientX;
    state.targetY = event.clientY;
  });

  window.requestAnimationFrame(update);
}

function setupTiltCards() {
  const tiltElements = document.querySelectorAll('[data-tilt]');

  tiltElements.forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * 10;
      const rotateX = (0.5 - y) * 10;

      element.style.transform =
        `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      element.style.borderColor = 'rgba(255, 255, 255, 0.22)';
    });

    element.addEventListener('pointerleave', () => {
      element.style.transform = '';
      element.style.borderColor = '';
    });
  });
}

function setupParallax() {
  const parallaxItems = document.querySelectorAll('[data-parallax]');

  if (!parallaxItems.length) {
    return;
  }

  const state = { x: 0, y: 0 };

  window.addEventListener('pointermove', (event) => {
    state.x = (event.clientX / window.innerWidth - 0.5) * 2;
    state.y = (event.clientY / window.innerHeight - 0.5) * 2;

    parallaxItems.forEach((item) => {
      const depth = Number(item.getAttribute('data-parallax')) || 0;
      const offsetX = state.x * depth;
      const offsetY = state.y * depth * 0.5;
      item.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
    });
  });
}

setupPreloader();
setupSectionReveal();
setupCursorGlow();
setupTiltCards();
setupParallax();
