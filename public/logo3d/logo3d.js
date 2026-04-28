import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';

const INTRO_DURATION_S = 12;
const LOGO_MODEL_URL = '../assets/logo7/logo7.glb';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(t) {
  const k = 1 - t;
  return 1 - (k * k * k);
}

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function easeInCubic(t) {
  return t * t * t;
}

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function initCanvasFallback(el) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let rafId = 0;
  let t = 0;

  if (!ctx) {
    return () => {};
  }

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

    // Main particle ring
    for (let i = 0; i < 240; i += 1) {
      const angle = i * 0.12 + t;
      const radius = 86 + Math.sin(i * 0.19 + t * 1.8) * 36;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const glow = 0.45 + Math.sin(i * 0.27 + t * 2.3) * 0.3;

      ctx.fillStyle = `rgba(68, 212, 255, ${Math.max(0.14, glow * 0.8)})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // Accent particles
    for (let i = 0; i < 90; i += 1) {
      const angle = i * 0.28 + t * 0.6;
      const radius = 120 + Math.sin(i * 0.35 + t * 1.2) * 45;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const pulse = Math.max(0.1, Math.sin(i * 0.4 + t * 2.8) * 0.6);

      ctx.fillStyle = `rgba(255, 122, 61, ${pulse * 0.6})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.8, 0, Math.PI * 2);
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

export function initLogo3D(el) {
  if (!el) {
    return () => {};
  }

  if (!window.WebGLRenderingContext) {
    return initCanvasFallback(el);
  }

  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      tone: true,
    });
  } catch {
    return initCanvasFallback(el);
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.clearColor(0x050913, 0);
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050913, 8.2, 16);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.15, 8.5);

  // Enhanced lighting setup
  const ambient = new THREE.AmbientLight(0x7a9eff, 0.95);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0xff7a3d, 38, 24, 2);
  keyLight.position.set(3.2, 2.3, 4.2);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x52d8ff, 32, 23, 2);
  fillLight.position.set(-3.4, -2.1, 3.8);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffffff, 18, 20, 2);
  rimLight.position.set(0, 3.2, -3.8);
  scene.add(rimLight);

  // Additional accent light for sci-fi atmosphere
  const accentLight = new THREE.PointLight(0x44ff88, 12, 16, 2);
  accentLight.position.set(-2.5, 1.8, 4.5);
  scene.add(accentLight);

  const cluster = new THREE.Group();
  scene.add(cluster);

  // Create a more sophisticated halo system with multiple rings
  const haloGroup = new THREE.Group();
  cluster.add(haloGroup);

  const haloGeometry = new THREE.TorusGeometry(2.35, 0.03, 32, 320);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x44d4ff,
    transparent: true,
    opacity: 0.6,
    wireframe: false,
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.rotation.x = Math.PI / 2.6;
  halo.rotation.z = 0.2;
  haloGroup.add(halo);

  // Secondary halo ring
  const halo2Geometry = new THREE.TorusGeometry(2.68, 0.015, 24, 280);
  const halo2Material = new THREE.MeshBasicMaterial({
    color: 0xff7a3d,
    transparent: true,
    opacity: 0.35,
  });
  const halo2 = new THREE.Mesh(halo2Geometry, halo2Material);
  halo2.rotation.x = Math.PI / 2.8;
  halo2.rotation.z = -0.3;
  haloGroup.add(halo2);

  // Tertiary accent ring
  const halo3Geometry = new THREE.TorusGeometry(1.96, 0.02, 20, 260);
  const halo3Material = new THREE.MeshBasicMaterial({
    color: 0x44ff88,
    transparent: true,
    opacity: 0.25,
  });
  const halo3 = new THREE.Mesh(halo3Geometry, halo3Material);
  halo3.rotation.x = Math.PI / 2.4;
  halo3.rotation.z = 0.15;
  haloGroup.add(halo3);

  // Enhanced star field with multiple layers
  const starCount = 900;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i += 1) {
    const stride = i * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 4.2 + Math.random() * 3.5;

    starPositions[stride] = Math.sin(phi) * Math.cos(theta) * radius;
    starPositions[stride + 1] = Math.sin(phi) * Math.sin(theta) * radius;
    starPositions[stride + 2] = Math.cos(phi) * radius;

    // Color variation for depth
    const colorType = Math.random();
    if (colorType < 0.5) {
      starColors[stride] = 0.9 + Math.random() * 0.1;
      starColors[stride + 1] = 0.95 + Math.random() * 0.05;
      starColors[stride + 2] = 1;
    } else if (colorType < 0.8) {
      starColors[stride] = 0.3 + Math.random() * 0.2;
      starColors[stride + 1] = 0.8 + Math.random() * 0.2;
      starColors[stride + 2] = 1;
    } else {
      starColors[stride] = 1;
      starColors[stride + 1] = 0.5 + Math.random() * 0.3;
      starColors[stride + 2] = 0.2 + Math.random() * 0.2;
    }
  }

  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

  const starsMaterial = new THREE.PointsMaterial({
    size: 0.022,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    vertexColors: true,
    sizeRange: [0.8, 2],
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  // Create high-speed particle stream
  const particleCount = 320;
  const particlePositions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i += 1) {
    const stride = i * 3;
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = Math.random() * 0.5 + 2.8;
    
    particlePositions[stride] = Math.cos(angle) * radius;
    particlePositions[stride + 1] = (Math.random() - 0.5) * 4;
    particlePositions[stride + 2] = Math.sin(angle) * radius;
  }

  const particlesGeometry = new THREE.BufferGeometry();
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    color: 0x44d4ff,
    size: 0.032,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.4,
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  cluster.add(particles);

  // Accent particle layer for energy effect
  const accentParticleCount = 180;
  const accentPositions = new Float32Array(accentParticleCount * 3);
  
  for (let i = 0; i < accentParticleCount; i += 1) {
    const stride = i * 3;
    const angle = (i / accentParticleCount) * Math.PI * 2 + Math.random() * 0.5;
    const radius = Math.random() * 0.8 + 2.2;
    
    accentPositions[stride] = Math.cos(angle) * radius;
    accentPositions[stride + 1] = (Math.random() - 0.5) * 3;
    accentPositions[stride + 2] = Math.sin(angle) * radius;
  }

  const accentGeometry = new THREE.BufferGeometry();
  accentGeometry.setAttribute('position', new THREE.BufferAttribute(accentPositions, 3));

  const accentMaterial = new THREE.PointsMaterial({
    color: 0xff7a3d,
    size: 0.018,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
  });

  const accentParticles = new THREE.Points(accentGeometry, accentMaterial);
  cluster.add(accentParticles);

  const loader = new GLTFLoader();
  const logoRoot = new THREE.Group();
  cluster.add(logoRoot);

  let logo = null;
  let logoReady = false;
  let modelBoundsRadius = 1;

  loader.load(
    LOGO_MODEL_URL,
    (gltf) => {
      logo = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(logo);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      bounds.getSize(size);
      bounds.getCenter(center);

      modelBoundsRadius = Math.max(size.x, size.y, size.z) * 0.5 || 1;
      const scale = 2.2 / Math.max(modelBoundsRadius, 0.001);

      logo.position.sub(center).multiplyScalar(scale);
      logo.scale.setScalar(scale);

      logo.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = false;
          node.receiveShadow = false;

          if (node.material) {
            node.material.needsUpdate = true;
            if ('metalness' in node.material && typeof node.material.metalness === 'number') {
              node.material.metalness = Math.max(node.material.metalness, 0.28);
            }
            if ('roughness' in node.material && typeof node.material.roughness === 'number') {
              node.material.roughness = Math.min(node.material.roughness, 0.48);
            }
            if ('envMapIntensity' in node.material && typeof node.material.envMapIntensity === 'number') {
              node.material.envMapIntensity = 1.5;
            }
          }
        }
      });

      logoRoot.add(logo);
      logoReady = true;
    },
    undefined,
    () => {
      logoReady = false;
    }
  );

  const resize = () => {
    const width = Math.max(el.clientWidth, 320);
    const height = Math.max(el.clientHeight, 240);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  let rafId = 0;
  let destroyed = false;
  const clock = new THREE.Clock();

  const render = () => {
    if (destroyed) {
      return;
    }

    const elapsed = clock.getElapsedTime();
    const introProgress = clamp(elapsed / INTRO_DURATION_S, 0, 1);
    
    // Animation phases
    const entryPhase = clamp(introProgress / 0.35, 0, 1);       // First 35%: entry and expansion
    const sustainPhase = clamp((introProgress - 0.35) / 0.37, 0, 1); // Middle 37%: sustained action
    const settlePhase = clamp((introProgress - 0.72) / 0.28, 0, 1);  // Final 28%: settle and pause

    const easeEntry = easeInCubic(entryPhase);
    const easeSustain = easeInOutSine(sustainPhase);
    const easeSettle = easeOutCubic(settlePhase);

    // === HALO ANIMATIONS ===
    halo.rotation.z += 0.014 * (1 - easeSettle * 0.85);
    halo.rotation.y = Math.sin(elapsed * 0.42) * 0.42 * (1 - easeSettle * 0.88);
    halo.scale.setScalar(0.8 + easeEntry * 0.35 + Math.sin(elapsed * 1.4) * 0.12 * (1 - easeSettle * 0.9));
    haloMaterial.opacity = (0.4 + Math.sin(elapsed * 1.8) * 0.25) * (1 - easeSettle * 0.75);

    halo2.rotation.z -= 0.011 * (1 - easeSettle * 0.82);
    halo2.rotation.x = Math.cos(elapsed * 0.35) * 0.35 * (1 - easeSettle * 0.85);
    halo2.scale.setScalar(0.75 + easeEntry * 0.42 + Math.sin(elapsed * 1.6) * 0.1 * (1 - easeSettle));
    halo2Material.opacity = (0.2 + Math.sin(elapsed * 1.5 + 1) * 0.15) * (1 - easeSettle * 0.8);

    halo3.rotation.z += 0.009 * (1 - easeSettle * 0.8);
    halo3.rotation.y = Math.sin(elapsed * 0.5) * 0.28 * (1 - easeSettle * 0.83);
    halo3.scale.setScalar(0.85 + easeEntry * 0.3 + Math.sin(elapsed * 1.1) * 0.08 * (1 - easeSettle * 0.88));
    halo3Material.opacity = (0.15 + Math.sin(elapsed * 2 + 2) * 0.1) * (1 - easeSettle * 0.85);

    // === CLUSTER ROTATION ===
    cluster.rotation.y += 0.0032 * (1 - easeSettle * 0.75);
    cluster.rotation.x = Math.sin(elapsed * 0.48) * 0.18 * (1 - easeSettle * 0.85);
    cluster.rotation.z = Math.sin(elapsed * 0.25) * 0.08 * (1 - easeSettle * 0.9);
    cluster.position.y = Math.sin(elapsed * 0.95) * 0.16 * (1 - easeSettle * 0.92);
    cluster.position.x = Math.sin(elapsed * 0.32) * 0.06 * (1 - easeSettle * 0.95);

    // === STARS ANIMATION ===
    stars.rotation.y += 0.0012;
    stars.rotation.x = Math.sin(elapsed * 0.35) * 0.14;
    stars.rotation.z = Math.sin(elapsed * 0.18) * 0.06;
    starsMaterial.opacity = 0.85 - easeSettle * 0.52;

    // === PARTICLES ===
    // Primary cyan particles - orbit pattern
    const particlePositions = particlesGeometry.attributes.position.array;
    for (let i = 0; i < particleCount; i += 1) {
      const stride = i * 3;
      const angle = (i / particleCount) * Math.PI * 2 + elapsed * 0.8;
      const radius = 2.8 + Math.sin(i * 0.3 + elapsed * 2.2) * 0.9;
      const verticalShift = Math.sin(i * 0.15 + elapsed * 1.5) * 2;
      
      particlePositions[stride] = Math.cos(angle) * radius;
      particlePositions[stride + 1] = verticalShift * (1 - easeSettle * 0.7);
      particlePositions[stride + 2] = Math.sin(angle) * radius;
    }
    particlesGeometry.attributes.position.needsUpdate = true;
    particles.rotation.y = elapsed * 0.25 * (1 - easeSettle * 0.6);
    particlesMaterial.opacity = (0.35 + Math.sin(elapsed * 2.1) * 0.15) * (1 - easeSettle * 0.7);

    // Accent particles - energetic pulses
    const accentPositions = accentGeometry.attributes.position.array;
    for (let i = 0; i < accentParticleCount; i += 1) {
      const stride = i * 3;
      const angle = (i / accentParticleCount) * Math.PI * 2 + elapsed * 1.3;
      const radius = 2.2 + Math.sin(i * 0.4 + elapsed * 2.8) * 1.1;
      const heightPulse = Math.sin(i * 0.2 + elapsed * 1.8) * 2.2;
      
      accentPositions[stride] = Math.cos(angle) * radius;
      accentPositions[stride + 1] = heightPulse * (1 - easeSettle * 0.65);
      accentPositions[stride + 2] = Math.sin(angle) * radius;
    }
    accentGeometry.attributes.position.needsUpdate = true;
    accentParticles.rotation.z = elapsed * 0.35 * (1 - easeSettle * 0.55);
    accentMaterial.opacity = (0.45 + Math.sin(elapsed * 1.9 + 3) * 0.2) * (1 - easeSettle * 0.75);

    // === LIGHTING ===
    const lightIntensityMultiplier = 1 + easeEntry * 0.3 - easeSettle * 0.2;
    keyLight.intensity = 38 * lightIntensityMultiplier + Math.sin(elapsed * 1.6) * 8;
    fillLight.intensity = 32 * lightIntensityMultiplier + Math.cos(elapsed * 1.4) * 6;
    rimLight.intensity = 18 + easeEntry * 8 + easeSettle * 6;
    accentLight.intensity = 12 * (1 - easeSettle * 0.9) + Math.sin(elapsed * 2.2) * 4;

    // === CAMERA ANIMATIONS ===
    // More dynamic camera movement with multiple phases
    const baseCameraZ = 8.5 - easeEntry * 2.2 - easeSettle * 0.4;
    const orbitX = Math.sin(elapsed * 0.22) * 1.8 * (1 - easeSettle * 0.8);
    const orbitY = Math.cos(elapsed * 0.16) * 1.2 * (1 - easeSettle * 0.85);
    
    camera.position.z = baseCameraZ + orbitX * 0.15;
    camera.position.x = orbitX * 0.08;
    camera.position.y = 0.15 + orbitY * 0.12 - easeSettle * 0.12;

    // Focus point slightly moves during animation
    const focusX = Math.sin(elapsed * 0.18) * 0.3 * (1 - easeSettle * 0.92);
    const focusY = Math.cos(elapsed * 0.24) * 0.2 * (1 - easeSettle * 0.94);
    camera.lookAt(focusX, focusY, 0);

    // === LOGO ===
    if (logoReady && logo) {
      const heroSpin = (1 - easeSettle) * 0.95;
      logoRoot.rotation.y = elapsed * 1.1 * heroSpin;
      logoRoot.rotation.x = Math.sin(elapsed * 0.72) * 0.35 * (1 - easeSettle * 0.92);
      logoRoot.rotation.z = Math.sin(elapsed * 0.38) * 0.14 * (1 - easeSettle * 0.95);
      logoRoot.position.y = Math.sin(elapsed * 1.25) * 0.14 * (1 - easeSettle * 0.88);
      logoRoot.position.x = Math.sin(elapsed * 0.28) * 0.08 * (1 - easeSettle * 0.93);

      const introScale = 0.65 + easeEntry * 0.48 + easeSettle * 0.18;
      const scale = introScale / Math.max(modelBoundsRadius, 0.6);
      logoRoot.scale.setScalar(scale);
    }

    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(render);
  };

  resize();
  window.addEventListener('resize', resize);
  render();

  return () => {
    if (destroyed) {
      return;
    }

    destroyed = true;
    window.cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);

    // Dispose halos
    haloGeometry.dispose();
    haloMaterial.dispose();
    halo2Geometry.dispose();
    halo2Material.dispose();
    halo3Geometry.dispose();
    halo3Material.dispose();

    // Dispose particles
    starsGeometry.dispose();
    starsMaterial.dispose();
    particlesGeometry.dispose();
    particlesMaterial.dispose();
    accentGeometry.dispose();
    accentMaterial.dispose();

    // Dispose logo
    logoRoot.traverse((node) => {
      if (node.isMesh && node.geometry) {
        node.geometry.dispose();
      }

      if (node.isMesh && node.material) {
        if (Array.isArray(node.material)) {
          node.material.forEach((mat) => mat.dispose());
        } else {
          node.material.dispose();
        }
      }
    });

    renderer.dispose();
    renderer.domElement.remove();
  };
}
