// ==========================================
// SISTEMA DE AUDIO (Web Audio API)
// Genera sonidos procedimentales sin archivos de audio.
// Usa osciladores y ganancia para crear tonos simples:
// - Pasos: tono grave y corto
// - Conexión de poste: dos tonos ascendentes
// - Golpe: tono descendente con distorsión
// - Victoria de nivel: melodía de 5 notas
// ==========================================

export class AudioSystem {
    constructor() {
        // Contexto de audio del navegador (se crea suspendido hasta interacción del usuario)
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    /**
     * Reanuda el contexto de audio tras la primera interacción del usuario.
     * Los navegadores modernos bloquean el audio hasta que el usuario hace click.
     */
    resume() {
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    /**
     * Reproduce un tono simple usando un oscilador.
     * @param {number} freq - Frecuencia inicial en Hz
     * @param {string} type - Tipo de onda: 'sine', 'square', 'sawtooth', 'triangle'
     * @param {number} duration - Duración en segundos
     * @param {number} vol - Volumen (0.0 a 1.0)
     * @param {number|null} slideFreq - Frecuencia final para slide (glissando)
     */
    playTone(freq, type, duration, vol = 0.1, slideFreq = null) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();    // Generador de onda
        const gain = this.ctx.createGain();          // Control de volumen
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        // Slide opcional: la frecuencia cambia gradualmente (ej: efecto de golpe)
        if (slideFreq) {
            osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        }
        // Fade out del volumen para evitar clicks al final
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        // Conectar: oscilador → ganancia → altavoz
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    /** Sonido de paso: tono grave y muy corto */
    playStep() {
        this.playTone(150, 'square', 0.05, 0.02);
    }

    /** Sonido de conexión de poste: dos tonos ascendentes (do-re) */
    playConnect() {
        this.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.2, 0.1), 100);
    }

    /** Sonido de golpe: tono grave descendente con onda sawtooth (áspero) */
    playHit() {
        this.playTone(100, 'sawtooth', 0.4, 0.3, 50); // Slide de 100Hz a 50Hz
    }

    /** Sonido de victoria: melodía ascendente de 5 notas */
    playWinLevel() {
        [300, 400, 500, 600, 800].forEach((f, i) => {
            setTimeout(() => this.playTone(f, 'square', 0.1, 0.1), i * 100);
        });
    }
}
