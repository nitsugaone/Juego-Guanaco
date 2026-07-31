// ==========================================
// CACHE DE SPRITES PRE-RENDERIZADOS
//
// Problema que resuelve:
// 1) Aplicar `ctx.filter = hue-rotate(...)` es de las operaciones mas caras
//    del canvas 2D. Hacerlo por cada auto y por cada frame (60 veces por
//    segundo) hunde el framerate en celulares.
// 2) Los sprites son pixel art guardado en alta resolucion (500-1024px) que
//    se dibuja a ~140px. Reducir de un saque y sin filtrado hace que se
//    pierdan filas de pixeles distintas en cada frame segun la posicion
//    subpixel del auto: es el "hormigueo" o shimmer del arte en movimiento.
//
// Solucion: escalar y colorear cada sprite UNA sola vez a un canvas fuera de
// pantalla, y despues limitarse a copiarlo. El escalado se hace por mitades
// sucesivas con filtrado de calidad, que es lo que da un resultado estable.
// ==========================================

// Los tonos se redondean a multiplos de este valor para que dos autos con
// colores casi iguales compartan el mismo sprite cacheado.
const HUE_STEP = 15;

export class SpriteCache {
    /**
     * @param {number} dpr - devicePixelRatio, para cachear a resolucion fisica
     *                       real y que no se vea borroso en pantallas retina.
     */
    constructor(dpr = 1) {
        this.dpr = dpr;
        this.cache = new Map(); // clave "imagen|anchoxalto|tono" -> canvas
    }

    /** Vacia el cache (se llama al cambiar de nivel, donde cambian los tamaños). */
    clear() {
        this.cache.clear();
    }

    /**
     * Devuelve el sprite ya escalado al tamaño de dibujo y con el tono aplicado.
     * La primera llamada lo genera; las siguientes lo reutilizan.
     * @param {HTMLImageElement} img - Imagen original
     * @param {string} key - Clave del asset (para identificarlo en el cache)
     * @param {number} w - Ancho de dibujo en pixeles logicos
     * @param {number} h - Alto de dibujo en pixeles logicos
     * @param {number} hue - Rotacion de tono en grados
     * @returns {HTMLCanvasElement|null} Canvas listo para copiar, o null si la
     *                                   imagen todavia no cargo.
     */
    get(img, key, w, h, hue = 0) {
        if (!img || !img.naturalWidth) return null;

        // Redondear tono y pasar a pixeles fisicos
        const hueQ = Math.round(hue / HUE_STEP) * HUE_STEP;
        const pw = Math.max(1, Math.round(w * this.dpr));
        const ph = Math.max(1, Math.round(h * this.dpr));

        const id = `${key}|${pw}x${ph}|${hueQ}`;
        const hit = this.cache.get(id);
        if (hit) return hit;

        const made = this.render(img, pw, ph, hueQ);
        this.cache.set(id, made);
        return made;
    }

    /**
     * Genera el canvas del sprite. Uso interno.
     * Reduce por mitades sucesivas hasta acercarse al tamaño final: bajar de
     * 500px a 140px en un solo paso descarta pixeles, mientras que hacerlo
     * en pasos de 2x promedia y conserva el detalle.
     */
    render(img, pw, ph, hue) {
        let src = img;
        let sw = img.naturalWidth;
        let sh = img.naturalHeight;

        while (sw / 2 >= pw && sh / 2 >= ph) {
            const half = document.createElement('canvas');
            half.width = Math.max(1, Math.floor(sw / 2));
            half.height = Math.max(1, Math.floor(sh / 2));
            const hctx = half.getContext('2d');
            hctx.imageSmoothingEnabled = true;
            hctx.imageSmoothingQuality = 'high';
            hctx.drawImage(src, 0, 0, half.width, half.height);
            src = half;
            sw = half.width;
            sh = half.height;
        }

        // Paso final al tamaño exacto, aplicando el tono de una sola vez
        const out = document.createElement('canvas');
        out.width = pw;
        out.height = ph;
        const octx = out.getContext('2d');
        octx.imageSmoothingEnabled = true;
        octx.imageSmoothingQuality = 'high';
        if (hue !== 0) octx.filter = `hue-rotate(${hue}deg)`;
        octx.drawImage(src, 0, 0, pw, ph);
        return out;
    }
}
