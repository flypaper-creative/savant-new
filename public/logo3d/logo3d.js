export function initLogo3D(el) {
  if (!el) return;

  const canvas = document.createElement('canvas');
  el.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = el.clientWidth;
    canvas.height = el.clientHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  let t = 0;

  function loop() {
    t += 0.01;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const cx = canvas.width/2;
    const cy = canvas.height/2;

    for (let i = 0; i < 120; i++) {
      const angle = i * 0.1 + t;
      const r = 80 + Math.sin(i * 0.2 + t) * 30;

      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.beginPath();
      ctx.arc(x,y,1.2,0,Math.PI*2);
      ctx.fill();
    }

    requestAnimationFrame(loop);
  }

  loop();
}
