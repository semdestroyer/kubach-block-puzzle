const TILE_SIZE = 16;
const MAX_PARTICLES = 420;

const TILES = {
  dust: [0, 4, 8, 12],
  shard: [0, 4, 8, 12, 24, 25],
  redstone: [1, 2, 3, 5],
  sparkle: [6, 7, 10, 11, 14, 15],
  smoke: [20, 21, 22],
  firework: [6, 7, 10, 11, 14, 15]
};

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(type, x, y, options = {}) {
    const count = options.count ?? 8;
    const spread = options.spread ?? 18;
    const speed = options.speed ?? 70;
    const life = options.life ?? 0.55;
    const size = options.size ?? 12;
    const gravity = options.gravity ?? 40;
    const tiles = TILES[type] || TILES.dust;

    for (let i = 0; i < count; i++) {
      const angle = options.angle ?? Math.random() * Math.PI * 2;
      const force = speed * (0.4 + Math.random() * 0.8);

      this.particles.push({
        x: x + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force - (options.lift ?? 0),
        life: life * (0.65 + Math.random() * 0.6),
        maxLife: life,
        size: size * (0.7 + Math.random() * 0.6),
        gravity,
        tile: tiles[Math.floor(Math.random() * tiles.length)],
        alpha: options.alpha ?? 1,
        color: options.color ?? null,
        useColor: Boolean(options.color) && Math.random() < (options.colorChance ?? 0),
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 8
      });
    }

    if (this.particles.length > MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - MAX_PARTICLES);
    }
  }

  burst(type, x, y, options = {}) {
    const count = options.count ?? 28;
    const speed = options.speed ?? 140;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
      this.spawn(type, x, y, {
        ...options,
        count: 1,
        angle,
        speed,
        spread: options.spread ?? 8,
        gravity: options.gravity ?? 24
      });
    }
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      particle.vy += particle.gravity * deltaTime;
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.rotation += particle.spin * deltaTime;
    }
  }

  draw(ctx, atlas) {
    if (!atlas || this.particles.length === 0) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    for (const particle of this.particles) {
      const progress = particle.life / particle.maxLife;
      ctx.globalAlpha = Math.max(0, progress) * particle.alpha;
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);

      if (particle.useColor) {
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      } else {
        const sx = (particle.tile % 8) * TILE_SIZE;
        const sy = Math.floor(particle.tile / 8) * TILE_SIZE;
        ctx.drawImage(
          atlas,
          sx,
          sy,
          TILE_SIZE,
          TILE_SIZE,
          -particle.size / 2,
          -particle.size / 2,
          particle.size,
          particle.size
        );
      }

      ctx.restore();
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }
}
