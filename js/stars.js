/* ==========================================
   Stars Canvas Animation
   ========================================== */
(function() {
  const canvas = document.getElementById('starCanvas');
  const ctx = canvas.getContext('2d');

  let stars = [];
  let shootingStars = [];
  let animId;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x:       Math.random() * canvas.width,
        y:       Math.random() * canvas.height,
        r:       randomBetween(0.3, 1.8),
        opacity: randomBetween(0.3, 1),
        speed:   randomBetween(0.0003, 0.001),
        phase:   Math.random() * Math.PI * 2,
      });
    }
  }

  function createShootingStar() {
    return {
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height * 0.5,
      len:    randomBetween(80, 200),
      speed:  randomBetween(6, 14),
      angle:  Math.PI / 4,
      alpha:  1,
      active: true,
    };
  }

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars
    stars.forEach(s => {
      const opacity = s.opacity * (0.5 + 0.5 * Math.sin(s.phase + time * s.speed));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${opacity})`;
      ctx.fill();
    });

    // Shooting stars
    shootingStars.forEach((ss, i) => {
      if (!ss.active) return;
      ctx.save();
      ctx.globalAlpha = ss.alpha;
      const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.len * Math.cos(ss.angle), ss.y - ss.len * Math.sin(ss.angle));
      grad.addColorStop(0, 'rgba(255,255,255,0.9)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.moveTo(ss.x, ss.y);
      ctx.lineTo(ss.x - ss.len * Math.cos(ss.angle), ss.y - ss.len * Math.sin(ss.angle));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ss.x += ss.speed * Math.cos(ss.angle);
      ss.y += ss.speed * Math.sin(ss.angle);
      ss.alpha -= 0.018;
      if (ss.alpha <= 0) ss.active = false;
    });

    shootingStars = shootingStars.filter(ss => ss.active);
    animId = requestAnimationFrame(draw);
  }

  // Spawn shooting stars periodically
  setInterval(() => {
    if (Math.random() < 0.4) {
      shootingStars.push(createShootingStar());
    }
  }, 2000);

  window.addEventListener('resize', () => {
    resize();
    createStars(Math.floor((canvas.width * canvas.height) / 6000));
  });

  resize();
  createStars(Math.floor((canvas.width * canvas.height) / 6000));
  requestAnimationFrame(draw);
})();
