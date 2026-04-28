import * as THREE from '../../logo3d/libs/three.module.js';
import { GLTFLoader } from '../../logo3d/libs/GLTFLoader.js';

const MODEL_URL = './logo7.glb';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function createGlowTexture(innerColor, outerColor) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, size * 0.06, size / 2, size / 2, size * 0.46);

  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.45, outerColor);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

function createFallback(el) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return () => {};
  }

  let frame = 0;
  let rafId = 0;

  const resize = () => {
    canvas.width = Math.max(el.clientWidth, 320);
    canvas.height = Math.max(el.clientHeight, 240);
  };

  const render = () => {
    frame += 0.018;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    context.clearRect(0, 0, width, height);

    const glow = context.createRadialGradient(centerX, centerY * 0.86, 20, centerX, centerY, Math.min(width, height) * 0.42);
    glow.addColorStop(0, 'rgba(255, 234, 210, 0.78)');
    glow.addColorStop(0.22, 'rgba(255, 191, 128, 0.22)');
    glow.addColorStop(0.58, 'rgba(114, 209, 255, 0.14)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    context.save();
    context.translate(centerX, centerY + 12);
    context.rotate(frame * 0.4);
    context.fillStyle = 'rgba(255, 214, 170, 0.92)';
    context.shadowColor = 'rgba(255, 181, 110, 0.5)';
    context.shadowBlur = 32;
    context.beginPath();
    context.moveTo(0, -96);
    context.lineTo(72, 0);
    context.lineTo(0, 96);
    context.lineTo(-72, 0);
    context.closePath();
    context.fill();
    context.restore();

    context.fillStyle = 'rgba(255, 255, 255, 0.14)';
    for (let i = 0; i < 90; i += 1) {
      const angle = i * 0.34 + frame;
      const radius = 118 + Math.sin(i * 0.18 + frame) * 10;
      context.beginPath();
      context.arc(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * 30, 1.1, 0, Math.PI * 2);
      context.fill();
    }

    rafId = window.requestAnimationFrame(render);
  };

  el.appendChild(canvas);
  resize();
  window.addEventListener('resize', resize);
  render();

  return () => {
    window.cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
}

function createUpgradedMaterial(material) {
  if (material?.isMeshPhysicalMaterial || material?.isMeshStandardMaterial) {
    const clone = material.clone();
    clone.envMapIntensity = 2.6;
    clone.metalness = clamp(typeof clone.metalness === 'number' ? Math.max(clone.metalness, 0.24) : 0.45, 0, 1);
    clone.roughness = clamp(typeof clone.roughness === 'number' ? Math.min(clone.roughness, 0.42) : 0.24, 0.05, 1);

    if ('clearcoat' in clone) {
      clone.clearcoat = Math.max(clone.clearcoat || 0, 0.58);
      clone.clearcoatRoughness = Math.min(clone.clearcoatRoughness || 0.12, 0.14);
    }

    return clone;
  }

  return new THREE.MeshPhysicalMaterial({
    color: material?.color ? material.color.clone() : new THREE.Color(0xd9c0a1),
    map: material?.map || null,
    normalMap: material?.normalMap || null,
    roughnessMap: material?.roughnessMap || null,
    metalnessMap: material?.metalnessMap || null,
    aoMap: material?.aoMap || null,
    emissiveMap: material?.emissiveMap || null,
    emissive: material?.emissive ? material.emissive.clone() : new THREE.Color(0x070707),
    emissiveIntensity: material?.emissiveMap ? 1 : 0.04,
    metalness: 0.42,
    roughness: 0.24,
    clearcoat: 0.74,
    clearcoatRoughness: 0.12,
    transparent: Boolean(material?.transparent),
    opacity: typeof material?.opacity === 'number' ? material.opacity : 1,
    side: material?.side,
  });
}

export function initLogo7Viewer(el, { onReady, variant = 'hero' } = {}) {
  if (!el) {
    return () => {};
  }

  if (!window.WebGLRenderingContext) {
    return createFallback(el);
  }

  const isPreloader = variant === 'preloader';

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch {
    return createFallback(el);
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(Math.max(el.clientWidth, 320), Math.max(el.clientHeight, 240), false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = isPreloader ? 1.08 : 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x09101a, isPreloader ? 0.04 : 0.024);

  const camera = new THREE.PerspectiveCamera(isPreloader ? 38 : 34, 1, 0.1, 120);
  camera.position.set(isPreloader ? 1.1 : 0.2, isPreloader ? 0.8 : 0.35, isPreloader ? 10.5 : 7.1);

  const ambient = new THREE.AmbientLight(0x273445, isPreloader ? 0.82 : 1.02);
  scene.add(ambient);

  const hemisphere = new THREE.HemisphereLight(0xe0efff, 0x05070c, isPreloader ? 0.9 : 1.05);
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight(0xfff0da, isPreloader ? 4.4 : 4.0);
  keyLight.position.set(6, 7.6, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 28;
  keyLight.shadow.camera.left = -8;
  keyLight.shadow.camera.right = 8;
  keyLight.shadow.camera.top = 8;
  keyLight.shadow.camera.bottom = -8;
  keyLight.shadow.bias = -0.00018;
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x72d1ff, isPreloader ? 18 : 14, 28, 1.7);
  fillLight.position.set(-5.8, 2, 6.2);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffffff, isPreloader ? 18 : 14, 34, 1.5);
  rimLight.position.set(0.2, 4.5, -6.2);
  scene.add(rimLight);

  const warmBounce = new THREE.PointLight(0xffb774, isPreloader ? 15 : 12, 26, 1.8);
  warmBounce.position.set(3.2, -0.2, 4.8);
  scene.add(warmBounce);

  const underLight = new THREE.PointLight(0x538fff, isPreloader ? 7 : 5, 20, 2.1);
  underLight.position.set(-1.6, -2.4, 2.8);
  scene.add(underLight);

  const spotlight = new THREE.SpotLight(0xfff5e8, isPreloader ? 20 : 12, 40, Math.PI / 5, 0.45, 1.4);
  spotlight.position.set(1.4, 8.2, 11);
  spotlight.target.position.set(0, 0, 0);
  scene.add(spotlight);
  scene.add(spotlight.target);

  const stage = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.8, 0.42, 64),
    new THREE.MeshStandardMaterial({
      color: 0x11161e,
      metalness: 0.18,
      roughness: 0.72,
    })
  );
  stage.position.set(0, -2.14, 0);
  stage.receiveShadow = true;
  scene.add(stage);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7.8, 72),
    new THREE.MeshStandardMaterial({
      color: 0x0a0f16,
      metalness: 0.12,
      roughness: 0.62,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.38;
  floor.receiveShadow = true;
  scene.add(floor);

  const shadowCatcher = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 72),
    new THREE.ShadowMaterial({ opacity: isPreloader ? 0.38 : 0.24 })
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = -2.05;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  const backdropTexture = createGlowTexture('rgba(255,242,226,0.92)', 'rgba(114,209,255,0.22)');
  const backdrop = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: backdropTexture,
      transparent: true,
      opacity: isPreloader ? 0.32 : 0.18,
      depthWrite: false,
    })
  );
  backdrop.position.set(0, 0.45, -3.2);
  backdrop.scale.set(11.4, 11.4, 1);
  scene.add(backdrop);

  const baseGlowTexture = createGlowTexture('rgba(255,214,170,0.95)', 'rgba(255,183,120,0.18)');
  const baseGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: baseGlowTexture,
      transparent: true,
      opacity: isPreloader ? 0.18 : 0.11,
      depthWrite: false,
    })
  );
  baseGlow.position.set(0, -1.86, 0.2);
  baseGlow.scale.set(6.4, 3.4, 1);
  scene.add(baseGlow);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.08, 0.018, 16, 180),
    new THREE.MeshBasicMaterial({
      color: 0xffd6ad,
      transparent: true,
      opacity: isPreloader ? 0.18 : 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.94;
  scene.add(ring);

  const dustCount = isPreloader ? 320 : 180;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let index = 0; index < dustCount; index += 1) {
    const offset = index * 3;
    dustPositions[offset] = (Math.random() - 0.5) * 10.5;
    dustPositions[offset + 1] = -1.5 + Math.random() * 6.4;
    dustPositions[offset + 2] = -4 + Math.random() * 11;
  }

  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: 0xf8fbff,
    size: isPreloader ? 0.042 : 0.03,
    transparent: true,
    opacity: isPreloader ? 0.12 : 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  scene.add(dust);

  const root = new THREE.Group();
  scene.add(root);

  let logo = null;
  let destroyed = false;
  let frameId = 0;
  let readyFired = false;
  let previousElapsed = 0;

  const pointer = {
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
  };

  const onPointerMove = (event) => {
    if (isPreloader) {
      return;
    }

    const rect = el.getBoundingClientRect();
    pointer.targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  const onPointerLeave = () => {
    pointer.targetX = 0;
    pointer.targetY = 0;
  };

  if (!isPreloader) {
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);
  }

  const loader = new GLTFLoader();
  loader.load(
    MODEL_URL,
    (gltf) => {
      logo = gltf.scene;

      const box = new THREE.Box3().setFromObject(logo);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxDimension = Math.max(size.x, size.y, size.z) || 1;
      const scale = (isPreloader ? 4.4 : 5.2) / maxDimension;

      logo.position.sub(center).multiplyScalar(scale);
      logo.scale.setScalar(scale);
      logo.position.y += 0.28;

      logo.traverse((node) => {
        if (!node.isMesh) {
          return;
        }

        node.castShadow = true;
        node.receiveShadow = true;

        if (Array.isArray(node.material)) {
          const materials = node.material.map((material) => createUpgradedMaterial(material));
          node.material.forEach((material) => material?.dispose?.());
          node.material = materials;
        } else {
          const originalMaterial = node.material;
          node.material = createUpgradedMaterial(originalMaterial);
          originalMaterial?.dispose?.();
        }
      });

      root.add(logo);
    },
    undefined,
    () => {
      if (!readyFired) {
        readyFired = true;
        onReady?.();
      }
    }
  );

  const clock = new THREE.Clock();

  const resize = () => {
    const width = Math.max(el.clientWidth, 320);
    const height = Math.max(el.clientHeight, 240);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const render = () => {
    if (destroyed) {
      return;
    }

    const elapsed = clock.getElapsedTime();
    const delta = Math.min(elapsed - previousElapsed, 0.05);
    previousElapsed = elapsed;

    pointer.currentX += (pointer.targetX - pointer.currentX) * 0.05;
    pointer.currentY += (pointer.targetY - pointer.currentY) * 0.05;

    const progress = clamp(elapsed / 3.8, 0, 1);
    const intro = easeOutCubic(progress);

    if (!readyFired && (logo || elapsed > 0.7)) {
      readyFired = true;
      onReady?.();
    }

    fillLight.intensity = (isPreloader ? 18 : 14) + Math.sin(elapsed * 1.1) * 2.2;
    rimLight.intensity = (isPreloader ? 18 : 14) + Math.cos(elapsed * 0.8) * 1.5;
    warmBounce.intensity = (isPreloader ? 15 : 12) + Math.sin(elapsed * 1.2 + 0.6) * 2.2;
    spotlight.position.x = 1.4 + Math.sin(elapsed * (isPreloader ? 0.9 : 0.45)) * (isPreloader ? 2 : 1.1);
    ring.rotation.z += (isPreloader ? 0.0032 : 0.0016) * delta * 60;
    dust.rotation.y += (isPreloader ? 0.0017 : 0.0009) * delta * 60;
    dust.position.y = Math.sin(elapsed * 0.2) * 0.08;
    baseGlow.material.opacity = (isPreloader ? 0.16 : 0.1) + Math.sin(elapsed * 1.5) * 0.015;

    if (isPreloader) {
      camera.position.x = 1.1 - intro * 1.1 + Math.sin(elapsed * 0.3) * 0.06;
      camera.position.y = 0.8 - intro * 0.42 + Math.cos(elapsed * 0.37) * 0.05;
      camera.position.z = 10.5 - intro * 3.1;
      camera.lookAt(Math.sin(elapsed * 0.2) * 0.08, 0.1, 0);
    } else {
      camera.position.x = 0.2 + pointer.currentX * 0.36 + Math.sin(elapsed * 0.15) * 0.05;
      camera.position.y = 0.35 - pointer.currentY * 0.18 + Math.cos(elapsed * 0.22) * 0.05;
      camera.position.z = 7.1 + Math.sin(elapsed * 0.12) * 0.08;
      camera.lookAt(pointer.currentX * 0.15, 0.06 - pointer.currentY * 0.08, 0);
    }

    if (logo) {
      root.rotation.y += ((isPreloader ? 0.34 : 0.2) + (isPreloader ? (1 - intro) * 0.6 : 0)) * delta;
      root.rotation.x = (isPreloader ? 0.1 : 0.06) + Math.sin(elapsed * 0.7) * 0.04 - pointer.currentY * 0.08;
      root.rotation.z = Math.sin(elapsed * 0.34) * 0.025 - pointer.currentX * 0.05;
      root.position.y = Math.sin(elapsed * 0.95) * 0.07 + (isPreloader ? intro * 0.05 : 0.05);
      root.position.x = pointer.currentX * 0.12;
      root.scale.setScalar(isPreloader ? 0.78 + intro * 0.24 : 1);
    }

    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(render);
  };

  resize();
  window.addEventListener('resize', resize);
  render();

  return () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    window.cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerleave', onPointerLeave);

    backdropTexture.dispose();
    baseGlowTexture.dispose();
    dustGeometry.dispose();
    dustMaterial.dispose();
    stage.geometry.dispose();
    stage.material.dispose();
    floor.geometry.dispose();
    floor.material.dispose();
    shadowCatcher.geometry.dispose();
    shadowCatcher.material.dispose();
    ring.geometry.dispose();
    ring.material.dispose();
    backdrop.material.dispose();
    baseGlow.material.dispose();

    root.traverse((node) => {
      if (!node.isMesh) {
        return;
      }

      node.geometry?.dispose();

      if (Array.isArray(node.material)) {
        node.material.forEach((material) => material.dispose());
      } else {
        node.material?.dispose();
      }
    });

    renderer.dispose();
    renderer.domElement.remove();
  };
}
