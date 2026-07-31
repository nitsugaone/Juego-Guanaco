// ==========================================
// CACHE DE SPRITES PRE-RENDERIZADOS
//
// Problema que resuelve:
// Los sprites son pixel art guardado en alta resolucion (500-1024px) que se
// dibuja a ~140px. Reducirlos en cada frame cuesta caro, y hacerlo de un solo
// paso hace que se pierdan filas de pixeles distintas segun la posicion
// subpixel del auto: es el "hormigueo" o shimmer del arte en movimiento.
//
// Solucion: escalar cada sprite UNA sola vez a un canvas fuera de pantalla, y
// despues limitarse a copiarlo. El escalado se hace por mitades sucesivas con
// filtrado de calidad, que es lo que da un resultado estable.
// ==========================================

export class SpriteCache {
    /**
     * @param {number} dpr - devicePixelRatio, para cachear a resolucion fisica
     *                       real y que no se vea borroso en pantallas retina.
     */
    constructor(dpr = 1) {
        this.dpr = dpr;
        this.cache = new Map(); // clave "imagen|anchoxalto" -> canvas
    }

    /** Vacia el cache (se llama al cambiar de nivel, donde cambian los tamaños). */
    clear() {
        this.cache.clear();
    }

    /**
     * Devuelve el sprite ya escalado al tamaño de dibujo.
     * La primera llamada lo genera; las siguientes lo reutilizan.
     * @param {HTMLImageElement} img - Imagen original
     * @param {string} key - Clave del asset (para identificarlo en el cache)
     * @param {number} w - Ancho de dibujo en pixeles logicos
     * @param {number} h - Alto de dibujo en pixeles logicos
     * @returns {HTMLCanvasElement|null} Canvas listo para copiar, o null si la
     *                                   imagen todavia no cargo.
     */
    get(img, key, w, h) {
        if (!img || !img.naturalWidth) return null;

        // Pasar a pixeles fisicos
        const pw = Math.max(1, Math.round(w * this.dpr));
        const ph = Math.max(1, Math.round(h * this.dpr));

        const id = `${key}|${pw}x${ph}`;
        const hit = this.cache.get(id);
        if (hit) return hit;

        const made = this.render(img, pw, ph);
        this.cache.set(id, made);
        return made;
    }

    /**
     * Genera el canvas del sprite. Uso interno.
     * Reduce por mitades sucesivas hasta acercarse al tamaño final: bajar de
     * 500px a 140px en un solo paso descarta pixeles, mientras que hacerlo
     * en pasos de 2x promedia y conserva el detalle.
     */
    render(img, pw, ph) {
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

        // Paso final al tamaño exacto
        const out = document.createElement('canvas');
        out.width = pw;
        out.height = ph;
        const octx = out.getContext('2d');
        octx.imageSmoothingEnabled = true;
        octx.imageSmoothingQuality = 'high';
        octx.drawImage(src, 0, 0, pw, ph);
        return out;
    }
}
