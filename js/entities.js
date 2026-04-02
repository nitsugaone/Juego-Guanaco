// ==========================================
// ENTIDADES DEL JUEGO
// Clases base para objetos del juego:
// - Entity: cualquier objeto con posición, tamaño visual y hitbox
// - ParticleSystem: sistema de partículas para efectos visuales
// - FloatingTextSystem: textos que flotan y se desvanecen
// ==========================================

/**
 * Entidad base del juego.
 * Tiene posición central (x, y), tamaño visual (visW, visH)
 * y tamaño de colisión (w, h) que puede ser diferente del visual.
 * Todas las posiciones son del CENTRO de la entidad.
 */
export class Entity {
    constructor(x, y, visW, visH) {
        this.x = x;       // Posición X del centro
        this.y = y;       // Posición Y del centro
        this.visW = visW;  // Ancho visual (para dibujar el sprite)
        this.visH = visH;  // Alto visual (para dibujar el sprite)
        this.w = visW;     // Ancho de colisión (puede modificarse después)
        this.h = visH;     // Alto de colisión (puede modificarse después)
    }

    /**
     * Detección de colisión AABB (Axis-Aligned Bounding Box).
     * Compara el hitbox de esta entidad con el de otra.
     * Usa w/h (hitbox), NO visW/visH (visual).
     * @param {Entity} other - Otra entidad a comparar
     * @returns {boolean} true si los hitboxes se superponen
     */
    checkCollision(other) {
        return (
            this.x - this.w / 2 < other.x + other.w / 2 &&
            this.x + this.w / 2 > other.x - other.w / 2 &&
            this.y - this.h / 2 < other.y + other.h / 2 &&
            this.y + this.h / 2 > other.y - other.h / 2
        );
    }
}

/**
 * Sistema de partículas.
 * Genera cuadraditos de colores que se dispersan y se desvanecen.
 * Se usa para: golpes (rojo), conexiones de poste (dorado), pasos (gris).
 */
export class ParticleSystem {
    constructor() {
        this.particles = []; // Array de partículas activas
    }

    /**
     * Genera partículas en una posición.
     * @param {number} x - Posición X de origen
     * @param {number} y - Posición Y de origen
     * @param {string} color - Color CSS de las partículas
     * @param {number} count - Cantidad de partículas a generar
     * @param {number} speedScale - Multiplicador de velocidad de dispersión
     */
    spawn(x, y, color, count, speedScale = 1) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 200 * speedScale,  // Velocidad X aleatoria
                vy: (Math.random() - 0.5) * 200 * speedScale,  // Velocidad Y aleatoria
                life: 1.0,                                       // Vida restante (1.0 = nueva)
                maxLife: 0.5 + Math.random() * 0.5,             // Vida máxima (para calcular opacidad)
                color: color,
                size: 2 + Math.random() * 4                     // Tamaño aleatorio del cuadradito
            });
        }
    }

    /**
     * Actualiza posición y vida de cada partícula.
     * Elimina las que ya expiraron.
     */
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1); // Eliminar partícula muerta
        }
    }

    /**
     * Dibuja todas las partículas con opacidad proporcional a su vida restante.
     */
    draw(ctx) {
        ctx.save();
        this.particles.forEach(p => {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife); // Fade out progresivo
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        ctx.restore();
    }
}

/**
 * Sistema de textos flotantes.
 * Muestra textos que suben lentamente y se desvanecen.
 * Se usa para: frases del jefe al conectar postes.
 */
export class FloatingTextSystem {
    constructor() {
        this.texts = []; // Array de textos activos
    }

    /**
     * Crea un texto flotante.
     * @param {number} x - Posición X
     * @param {number} y - Posición Y inicial
     * @param {string} text - Contenido del texto
     * @param {string} color - Color CSS del texto
     */
    spawn(x, y, text, color = "#f1c40f") {
        this.texts.push({ x, y, text, color, life: 2.0 }); // 2 segundos de vida
    }

    /**
     * Mueve textos hacia arriba y reduce su vida.
     */
    update(dt) {
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const t = this.texts[i];
            t.y -= 30 * dt;  // Subir 30px por segundo
            t.life -= dt;
            if (t.life <= 0) this.texts.splice(i, 1);
        }
    }

    /**
     * Dibuja textos con sombra y fade out.
     */
    draw(ctx) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "10px 'Press Start 2P'";
        this.texts.forEach(t => {
            ctx.globalAlpha = Math.max(0, t.life / 2.0);
            // Sombra negra para legibilidad
            ctx.fillStyle = "#000";
            ctx.fillText(t.text, t.x + 2, t.y + 2);
            // Texto principal en color
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        });
        ctx.restore();
    }
}
