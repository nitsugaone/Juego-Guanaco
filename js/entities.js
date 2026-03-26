// ==========================================
// ENTIDADES DEL JUEGO
// ==========================================

export class Entity {
    constructor(x, y, visW, visH) {
        this.x = x;
        this.y = y;
        this.visW = visW;
        this.visH = visH;
        this.w = visW;
        this.h = visH;
    }

    checkCollision(other) {
        return (
            this.x - this.w / 2 < other.x + other.w / 2 &&
            this.x + this.w / 2 > other.x - other.w / 2 &&
            this.y - this.h / 2 < other.y + other.h / 2 &&
            this.y + this.h / 2 > other.y - other.h / 2
        );
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    spawn(x, y, color, count, speedScale = 1) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 200 * speedScale,
                vy: (Math.random() - 0.5) * 200 * speedScale,
                life: 1.0,
                maxLife: 0.5 + Math.random() * 0.5,
                color: color,
                size: 2 + Math.random() * 4
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        ctx.save();
        this.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.restore();
    }
}

export class FloatingTextSystem {
    constructor() {
        this.texts = [];
    }

    spawn(x, y, text, color = "#f1c40f") {
        this.texts.push({ x, y, text, color, life: 2.0 });
    }

    update(dt) {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.y -= 30 * dt;
            t.life -= dt;
            if (t.life <= 0) this.texts.splice(i, 1);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "10px 'Press Start 2P'";
        this.texts.forEach(t => {
            ctx.globalAlpha = Math.max(0, t.life / 2.0);
            ctx.fillStyle = "#000";
            ctx.fillText(t.text, t.x + 2, t.y + 2);
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        });
        ctx.restore();
    }
}
