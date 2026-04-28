import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';

const INTRO_DURATION_S = 12;
const LOGO_MODEL_URL = '../assets/logo7/logo7.glb';

// ─── Easing ──────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

// ─── Procedural textures ─────────────────────────────────────────────────────
function createGlowSprite(r, g, b) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const c = size / 2;
  const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0,   `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.38, `rgba(${r},${g},${b},0.35)`);
  grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function createGridTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  const divisions = 24;
  const step = size / divisions;

  ctx.strokeStyle = 'rgba(68, 212, 255, 0.45)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= divisions; i++) {
    ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
  }

  // Accent cross
  ctx.strokeStyle = 'rgba(255, 177, 0, 0.85)';
  ctx.lineWidth = 2;
  const m = size / 2;
  ctx.beginPath(); ctx.moveTo(m, 0); ctx.lineTo(m, size); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, m); ctx.lineTo(size, m); ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 7);
  return tex;
}

// ─── Canvas 2D fallback ───────────────────────────────────────────────────────
function initCanvasFallback(el) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  let rafId = 0;
  let t = 0;
  el.appendChild(canvas);
  const resize = () => {
    canvas.width = Math.max(el.clientWidth, 320);
    canvas.height = Math.max(el.clientHeight, 240);
  };
  const loop = () => {
    t += 0.013;
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 260; i++) {
      const a = i * 0.12 + t;
      const rad = 90 + Math.sin(i * 0.19 + t * 1.8) * 38;
      const alpha = Math.max(0.12, (0.45 + Math.sin(i * 0.27 + t * 2.3) * 0.3) * 0.8);
      ctx.fillStyle = `rgba(68,212,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    rafId = window.requestAnimationFrame(loop);
  };
  resize();
  window.addEventListener('resize', resize);
  loop();
  return () => {
    window.cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function initLogo3D(el, { onLogoReady } = {}) {
  if (!el) return () => {};
  if (!window.WebGLRenderingContext) return initCanvasFallback(el);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
  } catch {
    return initCanvasFallback(el);
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  el.appendChild(renderer.domElement);

  // ── Scene ──────────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010306);
  scene.fog = new THREE.FogExp2(0x010306, 0.026);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 130);
  camera.position.set(0, 0.6, 17);

  // ── Lighting ───────────────────────────────────────────────────────────────
  // Very dim ambient — depth and shadow preserved
  const ambient = new THREE.AmbientLight(0x0c1422, 0.7);
  scene.add(ambient);

  // Warm golden key from front-right-top
  const keyLight = new THREE.DirectionalLight(0xffd4a0, 5.0);
  keyLight.position.set(5, 7, 8);
  scene.add(keyLight);

  // Cyan fill from left
  const fillLight = new THREE.PointLight(0x44d4ff, 65, 45, 1.5);
  fillLight.position.set(-7, -2, 7);
  scene.add(fillLight);

  // Hard white rim from behind
  const rimLight = new THREE.PointLight(0xf0f4ff, 35, 40, 1.8);
  rimLight.position.set(0, 6, -7);
  scene.add(rimLight);

  // Deep purple under-light for obsidian mystery
  const underLight = new THREE.PointLight(0x7030ff, 12, 25, 2.2);
  underLight.position.set(0, -6, 3);
  scene.add(underLight);

  // Gold bounce from below-front
  const goldLight = new THREE.PointLight(0xffb100, 30, 32, 1.6);
  goldLight.position.set(3, -2, 9);
  scene.add(goldLight);

  // Tight spot from above for specular drama
  const spotLight = new THREE.SpotLight(0xfff0d0, 55, 50, Math.PI / 9, 0.28, 1.4);
  spotLight.position.set(2, 9, 10);
  scene.add(spotLight);
  scene.add(spotLight.target);

  // ── Grid floor ────────────────────────────────────────────────────────────
  const gridTex = createGridTexture();
  const gridGeo = new THREE.PlaneGeometry(60, 60);
  const gridMat = new THREE.MeshBasicMaterial({
    map: gridTex,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const gridFloor = new THREE.Mesh(gridGeo, gridMat);
  gridFloor.rotation.x = -Math.PI / 2;
  gridFloor.position.y = -4.5;
  scene.add(gridFloor);

  // ── Glow sprite textures ──────────────────────────────────────────────────
  const cyanTex   = createGlowSprite(68,  212, 255);
  const orangeTex = createGlowSprite(255, 135,  45);
  const goldTex   = createGlowSprite(255, 200,  55);

  // ── Deep-space nebula puffs (billboard planes) ────────────────────────────
  const nebulaMeshes = [];
  const nebulaCount = 16;
  for (let i = 0; i < nebulaCount; i++) {
    const isOrange = i % 3 === 0;
    const isGold   = i % 5 === 1;
    const tex = isGold ? goldTex : (isOrange ? orangeTex : cyanTex);
    const w = 4.5 + Math.random() * 7;
    const geom = new THREE.PlaneGeometry(w, w * (0.6 + Math.random() * 0.8));
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      opacity: 0.025 + Math.random() * 0.055,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geom, mat);
    const theta = (i / nebulaCount) * Math.PI * 2 + Math.random() * 0.7;
    const phi   = (Math.random() - 0.5) * Math.PI * 0.55;
    const r     = 6 + Math.random() * 8;
    mesh.position.set(
      Math.cos(theta) * r,
      Math.sin(phi) * r * 0.35,
      Math.sin(theta) * r * 0.65 - 3
    );
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    scene.add(mesh);
    nebulaMeshes.push({ mesh, mat, base: mat.opacity, phase: Math.random() * Math.PI * 2 });
  }

  // ── Star field ────────────────────────────────────────────────────────────
  const starCount = 5000;
  const starPos = new Float32Array(starCount * 3);
  const starCol = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const s = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);
    const r     = 16 + Math.random() * 32;
    starPos[s]     = Math.sin(phi) * Math.cos(theta) * r;
    starPos[s + 1] = Math.sin(phi) * Math.sin(theta) * r;
    starPos[s + 2] = Math.cos(phi) * r;
    const type = Math.random();
    if (type < 0.55) {
      starCol[s] = 0.82 + Math.random() * 0.18; starCol[s+1] = 0.88 + Math.random() * 0.12; starCol[s+2] = 1;
    } else if (type < 0.82) {
      starCol[s] = 0.22 + Math.random() * 0.18; starCol[s+1] = 0.72 + Math.random() * 0.28; starCol[s+2] = 1;
    } else {
      starCol[s] = 1; starCol[s+1] = 0.52 + Math.random() * 0.22; starCol[s+2] = 0.18 + Math.random() * 0.15;
    }
  }
  const starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starsGeo.setAttribute('color',    new THREE.BufferAttribute(starCol, 3));
  const starsMat = new THREE.PointsMaterial({
    size: 0.02,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const stars = new THREE.Points(starsGeo, starsMat);
  scene.add(stars);

  // ── Particle cluster (orbits logo) ───────────────────────────────────────
  const cluster = new THREE.Group();
  scene.add(cluster);

  function makeOrbitLayer(count, color, size, radiusBase, radiusVariance, heightRange) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const s = i * 3;
      const a = (i / count) * Math.PI * 2;
      const r = radiusBase + Math.random() * radiusVariance;
      pos[s]     = Math.cos(a) * r;
      pos[s + 1] = (Math.random() - 0.5) * heightRange;
      pos[s + 2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color, size, sizeAttenuation: true,
      transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    cluster.add(pts);
    return { pts, geo, mat, count };
  }

  const cyanOrbit  = makeOrbitLayer(520, 0x44d4ff,  0.026, 3.0, 0.65, 5.5);
  const orangOrbit = makeOrbitLayer(280, 0xff8844,  0.020, 2.4, 0.75, 4.0);
  const goldOrbit  = makeOrbitLayer(180, 0xffd769,  0.016, 1.6, 0.55, 2.5);

  // ── Halo rings ────────────────────────────────────────────────────────────
  const haloGroup = new THREE.Group();
  cluster.add(haloGroup);

  function makeHalo(radius, tube, color, rotX, rotZ) {
    const geo = new THREE.TorusGeometry(radius, tube, 36, 420);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = rotX;
    mesh.rotation.z = rotZ;
    haloGroup.add(mesh);
    return { mesh, geo, mat };
  }

  const halo1 = makeHalo(2.6, 0.022, 0x44d4ff, Math.PI / 2.5,  0.18);
  const halo2 = makeHalo(3.1, 0.014, 0xff8844, Math.PI / 2.8, -0.28);
  const halo3 = makeHalo(2.2, 0.018, 0xffd769, Math.PI / 2.3,  0.12);

  // ── Logo ─────────────────────────────────────────────────────────────────
  const logoRoot = new THREE.Group();
  scene.add(logoRoot);
  let logo = null;
  let logoReady = false;
  let modelBoundsRadius = 1;
  let logoRotY = 0;

  const loader = new GLTFLoader();
  loader.load(
    LOGO_MODEL_URL,
    (gltf) => {
      logo = gltf.scene;
      const box = new THREE.Box3().setFromObject(logo);
      const sz  = new THREE.Vector3();
      const ctr = new THREE.Vector3();
      box.getSize(sz);
      box.getCenter(ctr);
      modelBoundsRadius = Math.max(sz.x, sz.y, sz.z) * 0.5 || 1;
      const normScale = 2.6 / Math.max(modelBoundsRadius, 0.001);
      logo.position.sub(ctr).multiplyScalar(normScale);
      logo.scale.setScalar(normScale);

      // Override materials → gold obsidian + chrome
      logo.traverse((node) => {
        if (!node.isMesh) return;
        const old = node.material;
        node.material = new THREE.MeshStandardMaterial({
          color:             new THREE.Color(0xffd769),
          metalness:         0.97,
          roughness:         0.045,
          envMapIntensity:   3.2,
          emissive:          new THREE.Color(0x3d1800),
          emissiveIntensity: 0.14,
        });
        if (old) {
          if (Array.isArray(old)) old.forEach((m) => m.dispose());
          else old.dispose();
        }
      });

      logoRoot.add(logo);
      logoReady = true;
    },
    undefined,
    () => { logoReady = false; }
  );

  // ── Resize ────────────────────────────────────────────────────────────────
  const resize = () => {
    const w = Math.max(el.clientWidth,  320);
    const h = Math.max(el.clientHeight, 240);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  let rafId     = 0;
  let destroyed = false;
  let readyFired = false;
  const clock   = new THREE.Clock();
  let prevElapsed = 0;

  // ── Render loop ───────────────────────────────────────────────────────────
  const render = () => {
    if (destroyed) return;

    const elapsed = clock.getElapsedTime();
    const dt      = Math.min(elapsed - prevElapsed, 0.05);
    prevElapsed   = elapsed;

    const p          = clamp(elapsed / INTRO_DURATION_S, 0, 1);
    const entryPhase = clamp(p / 0.30, 0, 1);
    const settlePhase = clamp((p - 0.72) / 0.28, 0, 1);

    const eEntry  = easeOutQuart(entryPhase);
    const eSettle = easeOutCubic(settlePhase);

    // Notify host that the logo has settled — triggers enter button
    if (!readyFired && settlePhase >= 0.07) {
      readyFired = true;
      onLogoReady?.();
    }

    // ── Stars ──────────────────────────────────────────────────────────────
    starsMat.opacity = clamp(eEntry * 1.6, 0, 0.95);
    stars.rotation.y += 0.00028;
    stars.rotation.x  = Math.sin(elapsed * 0.18) * 0.05;

    // ── Nebulae ────────────────────────────────────────────────────────────
    for (const { mesh, mat, base, phase } of nebulaMeshes) {
      mat.opacity = base * clamp(eEntry * 0.9, 0, 1) * (0.65 + Math.sin(elapsed * 0.35 + phase) * 0.35);
      mesh.rotation.z += 0.00012;
    }

    // ── Orbit particles ───────────────────────────────────────────────────
    const animateLayer = (layer, speedOrbit, speedBob, radiusMod, heightMod, finalOpacity) => {
      const arr = layer.geo.attributes.position.array;
      const cnt = layer.count;
      for (let i = 0; i < cnt; i++) {
        const s = i * 3;
        const a = (i / cnt) * Math.PI * 2 + elapsed * speedOrbit;
        const r = (arr[s] === 0 && arr[s + 2] === 0 ? 3.0 : Math.sqrt(arr[s] * arr[s] + arr[s + 2] * arr[s + 2]));
        const rm = r + Math.sin(i * 0.35 + elapsed * radiusMod) * 0.8 * (1 - eSettle * 0.55);
        arr[s]     = Math.cos(a) * rm;
        arr[s + 1] = Math.sin(i * 0.18 + elapsed * speedBob) * heightMod * (1 - eSettle * 0.65);
        arr[s + 2] = Math.sin(a) * rm;
      }
      layer.geo.attributes.position.needsUpdate = true;
      layer.mat.opacity = clamp(eEntry * 0.6, 0, 0.6) * (1 - eSettle * 0.68) + eSettle * finalOpacity;
    };
    animateLayer(cyanOrbit,  0.65, 1.35, 2.1, 2.4, 0.09);
    animateLayer(orangOrbit, 1.10, 1.70, 2.6, 1.9, 0.07);
    animateLayer(goldOrbit,  1.70, 2.20, 3.0, 1.4, 0.12);

    // ── Halos ─────────────────────────────────────────────────────────────
    const haloBase = clamp(eEntry * 0.8, 0, 0.8);
    halo1.mesh.rotation.z += (0.013 * (1 - eSettle * 0.9) + 0.001) * dt * 60;
    halo1.mesh.rotation.y  = Math.sin(elapsed * 0.33) * 0.38 * (1 - eSettle * 0.94);
    halo1.mat.opacity       = haloBase * (0.5 + Math.sin(elapsed * 1.75) * 0.25) * (1 - eSettle * 0.72) + eSettle * 0.14;

    halo2.mesh.rotation.z -= (0.010 * (1 - eSettle * 0.87) + 0.0008) * dt * 60;
    halo2.mesh.rotation.x  = Math.cos(elapsed * 0.27) * 0.28 * (1 - eSettle * 0.9);
    halo2.mat.opacity       = haloBase * (0.3 + Math.sin(elapsed * 1.45 + 1) * 0.15) * (1 - eSettle * 0.7) + eSettle * 0.08;

    halo3.mesh.rotation.z += (0.008 * (1 - eSettle * 0.85) + 0.0007) * dt * 60;
    halo3.mesh.rotation.y  = Math.sin(elapsed * 0.44) * 0.22 * (1 - eSettle * 0.88);
    halo3.mat.opacity       = haloBase * (0.22 + Math.sin(elapsed * 2.0 + 2) * 0.12) * (1 - eSettle * 0.74) + eSettle * 0.18;

    // ── Cluster ───────────────────────────────────────────────────────────
    cluster.rotation.y += (0.003 * (1 - eSettle * 0.88) + 0.0004) * dt * 60;
    cluster.rotation.x  = Math.sin(elapsed * 0.36) * 0.16 * (1 - eSettle * 0.9);
    cluster.rotation.z  = Math.sin(elapsed * 0.21) * 0.07 * (1 - eSettle * 0.93);
    cluster.position.y  = Math.sin(elapsed * 0.82) * 0.18 * (1 - eSettle * 0.9);

    // ── Grid floor ────────────────────────────────────────────────────────
    gridMat.opacity         = eSettle * 0.38;
    gridFloor.position.y    = -4.5 + eSettle * 0.4;

    // ── Lighting pulse ────────────────────────────────────────────────────
    const lm = 1 + eEntry * 0.35 - eSettle * 0.12;
    fillLight.intensity  = 65 * lm + Math.sin(elapsed * 1.45) * 9;
    rimLight.intensity   = 35 * lm + eSettle * 14;
    goldLight.intensity  = 30 * lm + Math.sin(elapsed * 0.88 + 1) * 7;
    spotLight.intensity  = 55 * lm + Math.sin(elapsed * 1.2) * 10;
    keyLight.intensity   = 5.0 * lm;
    underLight.intensity = 12 * (1 - eSettle * 0.82) + Math.sin(elapsed * 2.1) * 3;

    // ── Camera choreography ───────────────────────────────────────────────
    // Entry: fly in from z=17 to z=6.8; settle: lock to final framing
    const camZ = 17 - eEntry * 10.2 - eSettle * 0.5;
    const orbitX = Math.sin(elapsed * 0.17) * 3.2 * (1 - eSettle * 0.9) * eEntry;
    const orbitY = Math.cos(elapsed * 0.13) * 1.8 * (1 - eSettle * 0.9) * eEntry;
    const orbitZ = Math.cos(elapsed * 0.10) * 1.6 * (1 - eSettle * 0.92) * eEntry;

    camera.position.x = orbitX * 0.28;
    camera.position.y = 0.55 + orbitY * 0.14 - eSettle * 0.35;
    camera.position.z = camZ + orbitZ * 0.07;

    const lookX = Math.sin(elapsed * 0.15) * 0.38 * (1 - eSettle * 0.96);
    const lookY = Math.cos(elapsed * 0.20) * 0.24 * (1 - eSettle * 0.97);
    camera.lookAt(lookX, lookY, 0);

    // ── Logo ──────────────────────────────────────────────────────────────
    if (logoReady && logo) {
      // Fast cinematic spin → decelerates to a slow majestic rotation
      const spinRate = 1.2 * (1 - eSettle * 0.975) + 0.0038;
      logoRotY += spinRate * dt;
      logoRoot.rotation.y = logoRotY;
      logoRoot.rotation.x = Math.sin(elapsed * 0.62) * 0.30 * (1 - eSettle * 0.96);
      logoRoot.rotation.z = Math.sin(elapsed * 0.30) * 0.11 * (1 - eSettle * 0.98);
      logoRoot.position.y = Math.sin(elapsed * 1.05) * 0.14 * (1 - eSettle * 0.9) + eSettle * 0.08;
      logoRoot.position.x = Math.sin(elapsed * 0.23) * 0.08 * (1 - eSettle * 0.96);

      // Scale: 0→ full size during entry, tiny nudge bigger at settle
      logoRoot.scale.setScalar(0.42 + eEntry * 0.72 + eSettle * 0.16);
    }

    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(render);
  };

  resize();
  window.addEventListener('resize', resize);
  render();

  // ── Cleanup ───────────────────────────────────────────────────────────────
  return () => {
    if (destroyed) return;
    destroyed = true;
    window.cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);

    // Dispose halos
    for (const h of [halo1, halo2, halo3]) { h.geo.dispose(); h.mat.dispose(); }

    // Dispose orbit layers
    for (const l of [cyanOrbit, orangOrbit, goldOrbit]) { l.geo.dispose(); l.mat.dispose(); }

    // Dispose stars
    starsGeo.dispose(); starsMat.dispose();

    // Dispose nebulae
    for (const { mesh, mat } of nebulaMeshes) { mesh.geometry.dispose(); mat.dispose(); }

    // Dispose textures
    cyanTex.dispose(); orangeTex.dispose(); goldTex.dispose();
    gridTex.dispose(); gridGeo.dispose(); gridMat.dispose();

    // Dispose logo
    logoRoot.traverse((node) => {
      if (!node.isMesh) return;
      node.geometry?.dispose();
      if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose());
      else node.material?.dispose();
    });

    renderer.dispose();
    renderer.domElement.remove();
  };
}
