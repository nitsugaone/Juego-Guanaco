// ==========================================
// CLASE PRINCIPAL DEL JUEGO
// Contiene toda la lógica: movimiento, colisiones,
// cámara, spawning de entidades y renderizado.
// ==========================================

import {
    GAME_WIDTH, GAME_HEIGHT, WORLD_HEIGHT_SCALE, SCALES, LEVEL_LAYOUTS,
    BASE_PLAYER_SPEED, SPEED_PER_TIER, PLAYER_SIZE_SCALE,
    PLAYER_VIS_WIDTH_FACTOR, PLAYER_VIS_HEIGHT_FACTOR, PLAYER_STEP_INTERVAL,
    NUM_CAR_SPRITES, CARS_PER_LANE, CAR_HEIGHT_FACTOR, CAR_SIZE_SCALE,
    BASE_CAR_SPEED, CAR_SPEED_PER_TIER, CAR_BOUNCE_SPEED,
    CAR2_SIZE_MULTIPLIER, CAR_SPACING_MULTIPLIER,
    HOUSE_VIS_SCALE, POLE_WIDTH, POLE_HEIGHT, POLE_VIS_WIDTH_FACTOR,
    POLE_VIS_HEIGHT_FACTOR, POLE_POSITIONS, POLE_RANDOM_OFFSET,
    FREEZE_DURATION, SHAKE_DURATION, SHAKE_MAGNITUDE,
    HIT_PARTICLE_COUNT, HIT_PARTICLE_SPEED,
    CONNECT_PARTICLE_COUNT, CONNECT_PARTICLE_SPEED,
    STEP_PARTICLE_COUNT, STEP_PARTICLE_SPEED,
    STAR_TIME_3, STAR_TIME_2, LEVELS_PER_TIER,
    INITIAL_LIVES, MAX_LEVELS, TIMED_MESSAGE_INTERVAL_MS,
    CABLE_WIDTH, CABLE_SHADOW_BLUR, CABLE_COLOR, CABLE_SHADOW_COLOR,
    FRASES_JEFE_IN_GAME, MENSAJES_CASA
} from './config.js';

import { Entity, ParticleSystem, FloatingTextSystem } from './entities.js';

export class Game {
    /**
     * Constructor: recibe dependencias por inyección.
     * @param {AudioSystem} audio - Sistema de sonido
     * @param {Object} assets - Imágenes cargadas (clave: nombre, valor: HTMLImageElement)
     * @param {CanvasPattern} cespedPattern - Patrón repetible de textura de césped
     * @param {Function} setScreenFn - Función para cambiar pantallas del UI
     */
    constructor(audio, assets, cespedPattern, setScreenFn) {
        this.audio = audio;
        this.ASSETS = assets;
        this.cespedPattern = cespedPattern;
        this.setScreen = setScreenFn;

        // Estado del juego: LOADING, MENU, PLAYING, PAUSED, GAMEOVER, WINLEVEL, VICTORY
        this.state = "LOADING";
        this.level = 1;                    // Nivel actual (1-10)
        this.maxLevels = MAX_LEVELS;       // Máximo de niveles
        this.vidas = INITIAL_LIVES;        // Vidas restantes
        this.timeElapsed = 0;              // Tiempo total acumulado (seg)
        this.levelTime = 0;                // Tiempo en el nivel actual (seg)

        // Mensajes temporizados (cada 5 min aparece "la casa te extraña")
        this.nextMessageTime = TIMED_MESSAGE_INTERVAL_MS;
        this.messageIndex = 0;

        // Sistemas de efectos visuales
        this.particles = new ParticleSystem();       // Partículas (golpes, conexiones, polvo)
        this.floatingTexts = new FloatingTextSystem(); // Textos flotantes (frases del jefe)

        // Efectos de impacto
        this.shakeTime = 0;     // Tiempo restante de temblor de pantalla
        this.freezeTime = 0;    // Tiempo restante de congelamiento tras golpe
        this.flashRed = false;  // Si la pantalla está en rojo (flash de daño)

        // Estado de teclas presionadas
        this.keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
        this.setupInputs();
    }

    /**
     * Configura controles: teclado (flechas) y D-pad táctil (móvil).
     */
    setupInputs() {
        // Teclado: prevenir scroll con flechas
        window.addEventListener('keydown', e => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
            if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = true;
        }, { passive: false });

        window.addEventListener('keyup', e => {
            if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = false;
        });

        // D-pad táctil para celulares
        document.querySelectorAll('.dpad-btn').forEach(btn => {
            btn.addEventListener('touchstart', e => {
                e.preventDefault();
                this.keys[btn.dataset.key] = true;
            }, { passive: false });
            btn.addEventListener('touchend', e => {
                e.preventDefault();
                this.keys[btn.dataset.key] = false;
            }, { passive: false });
        });
    }

    /**
     * Inicializa un nivel: crea strips, autos, postes, casa y jugador.
     * @param {number} levelIndex - Número de nivel (1-10)
     */
    initLevel(levelIndex) {
        // Resetear entidades del nivel
        this.strips = [];       // Franjas de césped/carretera
        this.cars = [];         // Vehículos en las carreteras
        this.poles = [];        // Postes de fibra óptica
        this.cableNodes = [];   // Nodos del cable (puntos por donde pasa la fibra)
        this.levelTime = 0;     // Resetear tiempo del nivel
        this.cameraY = 0;       // Resetear posición de cámara

        // Seleccionar layout del nivel (clampeado al máximo)
        const layoutIdx = Math.min(levelIndex, MAX_LEVELS);
        const layout = LEVEL_LAYOUTS[layoutIdx];

        // Calcular altura del mundo y de cada carril
        const totalLanes = layout.reduce((sum, strip) => sum + strip.lanes, 0);
        this.worldHeight = GAME_HEIGHT * WORLD_HEIGHT_SCALE; // Mundo más alto que el viewport
        const laneHeight = this.worldHeight / totalLanes;    // Altura de cada carril individual

        // Crear jugador centrado horizontalmente (Y se asigna abajo)
        this.player = new Entity(
            GAME_WIDTH / 2, 0,
            (laneHeight * PLAYER_VIS_WIDTH_FACTOR) * PLAYER_SIZE_SCALE,  // Ancho visual
            (laneHeight * PLAYER_VIS_HEIGHT_FACTOR) * PLAYER_SIZE_SCALE  // Alto visual
        );

        // Tier de dificultad: cada LEVELS_PER_TIER niveles, autos más rápidos
        const diffTier = Math.ceil(levelIndex / LEVELS_PER_TIER);
        this.player.speed = BASE_PLAYER_SPEED + (diffTier * SPEED_PER_TIER);
        this.player.dir = 'up';        // Dirección inicial: mirando arriba
        this.player.stepTimer = 0;     // Timer para sonido de pasos

        // Recorrer strips del layout de arriba a abajo
        let currentY = 0;
        for (let s = 0; s < layout.length; s++) {
            const strip = layout[s];
            const stripHeight = strip.lanes * laneHeight;
            const isBottom = (s === layout.length - 1);  // Último strip = inicio del jugador
            const isTop = (s === 0);                     // Primer strip = casa destino
            const isRoad = (strip.type === 'road');

            // Registrar franja para renderizado
            this.strips.push({
                y: currentY, h: stripHeight, isRoad: isRoad,
                laneHeight: laneHeight, lanes: strip.lanes
            });

            if (isBottom) {
                // Posicionar jugador en el centro del último carril del strip inferior
                this.player.y = currentY + stripHeight - (laneHeight / 2);
                // Primer nodo del cable: borde inferior del mundo
                this.cableNodes.push({ x: this.player.x, y: this.worldHeight });
            } else if (isTop) {
                // Crear casa en la parte alta del strip superior (alejada de la calle)
                this.house = new Entity(
                    GAME_WIDTH / 2,
                    currentY + stripHeight * 0.2,  // 20% desde el tope (alejada de la calle)
                    stripHeight * HOUSE_VIS_SCALE,
                    stripHeight * HOUSE_VIS_SCALE
                );
                // Hitbox de la casa más chico que su visual
                this.house.w = this.house.visW * SCALES.CASA_W;
                this.house.h = this.house.visH * SCALES.CASA_H;
            }

            if (isRoad) {
                // Generar autos en cada carril de la carretera
                for (let l = 0; l < strip.lanes; l++) {
                    const laneCenterY = currentY + (l + 0.5) * laneHeight; // Centro vertical del carril
                    const direction = (l % 2 === 0) ? 1 : -1;             // Carriles alternos van en sentidos opuestos
                    const baseSpeed = (BASE_CAR_SPEED + diffTier * CAR_SPEED_PER_TIER) * direction;

                    // Calcular tamaño base del auto usando proporción natural de la imagen
                    const carBase = (laneHeight * CAR_HEIGHT_FACTOR) * CAR_SIZE_SCALE;

                    // Separación mínima entre autos para evitar apilamiento visual
                    // Se calcula con el auto más grande posible (car2 con multiplicador)
                    const maxCarSize = carBase * CAR2_SIZE_MULTIPLIER * 2; // Estimación del ancho máximo
                    const minSpacing = maxCarSize * CAR_SPACING_MULTIPLIER;
                    const spacing = Math.max(GAME_WIDTH / CARS_PER_LANE, minSpacing);
                    const laneOffset = Math.random() * spacing; // Offset aleatorio inicial

                    for (let c = 0; c < CARS_PER_LANE; c++) {
                        // Seleccionar sprite aleatorio (car1..car6)
                        const carImgKey = 'car' + (Math.floor(Math.random() * NUM_CAR_SPRITES) + 1);

                        // Usar el aspect ratio REAL de la imagen para no deformar
                        const img = this.ASSETS[carImgKey];
                        const imgAspect = (img && img.naturalWidth && img.naturalHeight)
                            ? (img.naturalWidth / img.naturalHeight)
                            : 1.0; // Fallback: cuadrado si la imagen no cargó

                        // Calcular tamaño visual respetando proporciones de la imagen
                        let carVisH = carBase;
                        let carVisW = carBase * imgAspect;

                        // Car2 (camión) es más grande: multiplicador parejo en ambos ejes
                        if (carImgKey === 'car2') {
                            carVisW *= CAR2_SIZE_MULTIPLIER;
                            carVisH *= CAR2_SIZE_MULTIPLIER;
                        }

                        // Posición X inicial con separación uniforme
                        const startX = laneOffset + (c * spacing);
                        const car = new Entity(startX, laneCenterY, carVisW, carVisH);

                        // Hitbox del auto (más chico que el visual para colisiones justas)
                        car.w = car.visW * SCALES.CAR_W;
                        car.h = car.visH * SCALES.CAR_H;
                        car.speed = baseSpeed;
                        car.img = carImgKey;
                        car.hue = Math.random() * 360; // Variación de color por hue-rotate
                        this.cars.push(car);
                    }
                }
            } else if (!isTop && !isBottom) {
                // Strips de césped intermedios: generar postes de fibra óptica
                POLE_POSITIONS.forEach(pos => {
                    const p = new Entity(
                        // Posición X con variación aleatoria
                        GAME_WIDTH * pos + (Math.random() * POLE_RANDOM_OFFSET - POLE_RANDOM_OFFSET / 2),
                        currentY + stripHeight / 2,     // Centrado verticalmente en el strip
                        laneHeight * POLE_VIS_WIDTH_FACTOR,   // Ancho visual
                        laneHeight * POLE_VIS_HEIGHT_FACTOR   // Alto visual
                    );
                    // Hitbox del poste (área donde el jugador activa la conexión)
                    p.w = POLE_WIDTH;
                    p.h = POLE_HEIGHT;
                    p.activado = false; // Se activa cuando el jugador lo toca
                    this.poles.push(p);
                });
            }
            currentY += stripHeight;
        }
        this.updateUI(); // Actualizar HUD (nivel, vidas, tiempo)
    }

    /**
     * Maneja el impacto del jugador con un auto.
     * Activa efectos visuales, resta vida y reinicia o termina el juego.
     */
    triggerHit() {
        this.audio.playHit();
        this.freezeTime = FREEZE_DURATION;   // Congelar el juego brevemente
        this.shakeTime = SHAKE_DURATION;     // Temblar la pantalla
        this.flashRed = true;                // Flash rojo de daño
        // Explosión de partículas rojas en la posición del jugador
        this.particles.spawn(this.player.x, this.player.y, "#e74c3c", HIT_PARTICLE_COUNT, HIT_PARTICLE_SPEED);

        this.vidas--;
        if (this.vidas <= 0) {
            // Sin vidas: Game Over
            setTimeout(() => {
                this.setScreen("gameOverScreen");
                document.getElementById("aiExcuseText").style.display = "none";
                this.state = "GAMEOVER";
            }, 200);
        } else {
            // Reiniciar nivel actual tras breve pausa
            setTimeout(() => this.initLevel(this.level), 200);
        }
        this.updateUI();
    }

    /**
     * Actualización principal del juego (llamada cada frame).
     * Maneja: movimiento, colisiones, cámara, efectos, estado del juego.
     * @param {number} dt - Delta time en segundos
     */
    update(dt) {
        if (this.state !== "PLAYING") return;

        // --- Efectos de impacto (congelamiento y temblor) ---
        if (this.freezeTime > 0) {
            this.freezeTime -= dt;
            if (this.freezeTime <= 0) this.flashRed = false;
            return; // No actualizar nada durante el freeze
        }
        if (this.shakeTime > 0) this.shakeTime -= dt;

        // --- Actualizar timers ---
        this.timeElapsed += dt;
        this.levelTime += dt;

        // --- Mensaje temporizado (cada 5 minutos) ---
        if (this.timeElapsed * 1000 >= this.nextMessageTime) {
            this.state = "PAUSED";
            document.getElementById('timedMessageText').textContent =
                MENSAJES_CASA[this.messageIndex % MENSAJES_CASA.length];
            this.setScreen('timedMessageScreen');
            this.messageIndex++;
            this.nextMessageTime += TIMED_MESSAGE_INTERVAL_MS;
            return;
        }

        // --- Movimiento del jugador ---
        let moving = false;
        if (this.keys.ArrowUp) { this.player.y -= this.player.speed * dt; this.player.dir = 'up'; moving = true; }
        if (this.keys.ArrowDown) { this.player.y += this.player.speed * dt; this.player.dir = 'down'; moving = true; }
        if (this.keys.ArrowLeft) { this.player.x -= this.player.speed * dt; this.player.dir = 'left'; moving = true; }
        if (this.keys.ArrowRight) { this.player.x += this.player.speed * dt; this.player.dir = 'right'; moving = true; }

        // Sonido y partículas de pasos al caminar
        if (moving) {
            this.player.stepTimer -= dt;
            if (this.player.stepTimer <= 0) {
                this.audio.playStep();
                this.particles.spawn(this.player.x, this.player.y + this.player.h / 2, "#95a5a6", STEP_PARTICLE_COUNT, STEP_PARTICLE_SPEED);
                this.player.stepTimer = PLAYER_STEP_INTERVAL;
            }
        }

        // --- Hitbox del jugador cambia según dirección ---
        // Mirando arriba/abajo: hitbox más angosto y alto
        // Mirando izquierda/derecha: hitbox más ancho y bajo
        if (this.player.dir === 'up' || this.player.dir === 'down') {
            this.player.w = this.player.visW * SCALES.PLAYER_W_V;
            this.player.h = this.player.visH * SCALES.PLAYER_H_V;
        } else {
            this.player.w = this.player.visW * SCALES.PLAYER_W_H;
            this.player.h = this.player.visH * SCALES.PLAYER_H_H;
        }

        // --- Limitar posición del jugador al mundo ---
        if (this.player.x < this.player.w / 2) this.player.x = this.player.w / 2;
        if (this.player.x > GAME_WIDTH - this.player.w / 2) this.player.x = GAME_WIDTH - this.player.w / 2;
        if (this.player.y < this.player.h / 2) this.player.y = this.player.h / 2;
        if (this.player.y > this.worldHeight - this.player.h / 2) this.player.y = this.worldHeight - this.player.h / 2;

        // --- Cámara: sigue al jugador centrado verticalmente ---
        this.cameraY = this.player.y - GAME_HEIGHT / 2;
        this.cameraY = Math.max(0, Math.min(this.cameraY, this.worldHeight - GAME_HEIGHT));

        // --- Actualizar sistemas de efectos ---
        this.particles.update(dt);
        this.floatingTexts.update(dt);

        // --- Mover autos y detectar colisión con jugador ---
        for (const c of this.cars) {
            c.x += c.speed * dt;
            // Wrap horizontal: auto sale por un lado y reaparece por el otro
            if (c.speed > 0 && c.x - c.visW / 2 > GAME_WIDTH) c.x = -c.visW / 2;
            if (c.speed < 0 && c.x + c.visW / 2 < 0) c.x = GAME_WIDTH + c.visW / 2;
            // Colisión jugador-auto
            if (this.player.checkCollision(c)) {
                this.triggerHit();
                return;
            }
        }

        // --- Activar postes al tocarlos ---
        for (const p of this.poles) {
            if (!p.activado && this.player.checkCollision(p)) {
                p.activado = true;
                // Agregar nodo al cable de fibra óptica
                this.cableNodes.push({ x: p.x, y: p.y });
                this.audio.playConnect();
                // Efecto visual: partículas doradas
                this.particles.spawn(p.x, p.y - p.h / 2, "#f1c40f", CONNECT_PARTICLE_COUNT, CONNECT_PARTICLE_SPEED);
                // Texto flotante: frase del jefe
                this.floatingTexts.spawn(
                    p.x, p.y - 40,
                    FRASES_JEFE_IN_GAME[Math.floor(Math.random() * FRASES_JEFE_IN_GAME.length)]
                );
            }
        }

        // --- Verificar victoria del nivel ---
        // Condición: todos los postes activados Y jugador tocando la casa
        const allPolesActive = this.poles.every(p => p.activado);
        if (allPolesActive && this.player.checkCollision(this.house)) {
            this.audio.playWinLevel();
            if (this.level >= this.maxLevels) {
                // Victoria total: completó todos los niveles
                document.getElementById('finalTimeText').innerText =
                    `Tiempo Total: ${this.formatTime(this.timeElapsed)}`;
                this.setScreen("victoryScreen");
                this.state = "VICTORY";
            } else {
                // Nivel completado: mostrar estrellas según tiempo
                let stars = 1;
                if (this.levelTime < STAR_TIME_3) stars = 3;
                else if (this.levelTime < STAR_TIME_2) stars = 2;

                let starsHtml = "";
                for (let i = 0; i < 3; i++) {
                    starsHtml += i < stars ? "<span class='star-active'>\u2605</span> " : "\u2605 ";
                }
                document.getElementById('starContainer').innerHTML = starsHtml;
                document.getElementById('levelTimeText').innerText =
                    `Tiempo en nivel: ${this.formatTime(this.levelTime)}`;

                this.setScreen("winLevelScreen");
                document.getElementById("aiWinText").style.display = "none";
                this.state = "WINLEVEL";
            }
        }

        this.updateUI();
    }

    /**
     * Dibuja una imagen centrada en (x, y) con transformaciones opcionales.
     * @param {CanvasRenderingContext2D} ctx - Contexto del canvas
     * @param {string} imgKey - Clave del asset en this.ASSETS
     * @param {number} x - Posición X centro (coordenadas mundo)
     * @param {number} y - Posición Y centro (coordenadas mundo)
     * @param {number} w - Ancho de dibujo
     * @param {number} h - Alto de dibujo
     * @param {number} hue - Rotación de tono en grados (0 = sin cambio)
     * @param {number} wobble - Ángulo de rotación/balanceo en radianes
     * @param {number} flipX - 1 = normal, -1 = espejado horizontal
     */
    drawImgCenter(ctx, imgKey, x, y, w, h, hue = 0, wobble = 0, flipX = 1) {
        const img = this.ASSETS[imgKey];
        if (!img) return;
        ctx.save();
        ctx.translate(x, y);
        if (wobble !== 0) ctx.rotate(wobble);
        if (flipX !== 1) ctx.scale(flipX, 1);
        if (hue !== 0) ctx.filter = `hue-rotate(${hue}deg)`;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
    }

    /**
     * Formatea segundos a string "MM:SS".
     */
    formatTime(secsTotal) {
        const mins = Math.floor(secsTotal / 60);
        const secs = Math.floor(secsTotal % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Actualiza el HUD: nivel, vidas (emoji de guanaco) y tiempo.
     */
    updateUI() {
        document.getElementById('levelInfo').innerText = `Nivel: ${this.level}`;
        let livesStr = "";
        for (let i = 0; i < this.vidas; i++) livesStr += "\uD83E\uDD99"; // 🦙
        document.getElementById('livesInfo').innerText = livesStr;
        document.getElementById('timeInfo').innerText = this.formatTime(this.timeElapsed);
    }

    /**
     * Renderizado principal: dibuja el mundo con offset de cámara.
     * Orden de capas: fondo → postes → casa → cable → autos → jugador → partículas.
     */
    draw(ctx) {
        ctx.imageSmoothingEnabled = false; // Pixel art: sin suavizado

        // Flash rojo al ser golpeado (cubre toda la pantalla)
        if (this.flashRed) {
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            return;
        }

        ctx.save();

        // Efecto de temblor de pantalla tras impacto
        if (this.shakeTime > 0) {
            const mag = (this.shakeTime / SHAKE_DURATION) * SHAKE_MAGNITUDE;
            ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
        }

        // Offset de cámara: desplaza todo el mundo hacia arriba
        ctx.translate(0, -this.cameraY);

        // --- Dibujar franjas (césped y carreteras) ---
        for (const s of this.strips) {
            if (s.isRoad) {
                // Carretera: fondo oscuro con líneas punteadas entre carriles
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(0, s.y, GAME_WIDTH, s.h);
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 4;
                ctx.setLineDash([20, 20]);
                for (let l = 1; l < s.lanes; l++) {
                    const lineY = s.y + l * s.laneHeight;
                    ctx.beginPath();
                    ctx.moveTo(0, lineY);
                    ctx.lineTo(GAME_WIDTH, lineY);
                    ctx.stroke();
                }
                ctx.setLineDash([]);
            } else {
                // Césped: patrón de textura o color verde sólido como fallback
                ctx.fillStyle = this.cespedPattern ? this.cespedPattern : '#27ae60';
                ctx.fillRect(0, s.y, GAME_WIDTH, s.h);
            }
        }

        // --- Dibujar postes ---
        for (const p of this.poles) {
            this.drawImgCenter(ctx, 'poste', p.x, p.y, p.visW, p.visH);
            // Flecha indicadora en nivel 1 para postes no activados (tutorial)
            if (this.level === 1 && !p.activado) {
                const arrowY = p.y - p.visH + Math.sin(this.timeElapsed * 10) * 5; // Animación flotante
                ctx.fillStyle = "#f1c40f";
                ctx.font = "20px 'Press Start 2P'";
                ctx.textAlign = "center";
                ctx.fillText("\u2193", p.x, arrowY);
            }
        }

        // --- Dibujar casa ---
        this.drawImgCenter(ctx, 'casa', this.house.x, this.house.y, this.house.visW, this.house.visH);
        // Texto "¡ENTRA!" en nivel 1 cuando todos los postes están activados (tutorial)
        if (this.level === 1 && this.poles.every(p => p.activado)) {
            ctx.fillStyle = "#2ecc71";
            ctx.font = "12px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.fillText("\u00A1ENTRA!", this.house.x, this.house.y - this.house.visH / 2 - 10);
        }

        // --- Dibujar cable de fibra óptica ---
        // Línea naranja brillante desde el inicio hasta el jugador, pasando por los postes
        if (this.cableNodes.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.cableNodes[0].x, this.cableNodes[0].y);
            for (let i = 1; i < this.cableNodes.length; i++) {
                ctx.lineTo(this.cableNodes[i].x, this.cableNodes[i].y);
            }
            ctx.lineTo(this.player.x, this.player.y); // Cable sigue al jugador
            ctx.shadowBlur = CABLE_SHADOW_BLUR;
            ctx.shadowColor = CABLE_SHADOW_COLOR;
            ctx.strokeStyle = CABLE_COLOR;
            ctx.lineWidth = CABLE_WIDTH;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // --- Dibujar autos ---
        for (const c of this.cars) {
            // Efecto de rebote vertical (simula suspensión)
            const bounce = Math.abs(Math.sin(this.timeElapsed * CAR_BOUNCE_SPEED + c.x)) * 3;
            // Voltear sprite horizontal si va hacia la izquierda
            const flipX = c.speed < 0 ? -1 : 1;
            this.drawImgCenter(ctx, c.img, c.x, c.y - bounce, c.visW, c.visH, c.hue, 0, flipX);
        }

        // --- Dibujar jugador (guanaco) ---
        const isMoving = (this.keys.ArrowUp || this.keys.ArrowDown || this.keys.ArrowLeft || this.keys.ArrowRight);
        const wobble = isMoving ? Math.sin(this.timeElapsed * 20) * 0.15 : 0; // Balanceo al caminar
        this.drawImgCenter(ctx, this.player.dir, this.player.x, this.player.y, this.player.visW, this.player.visH, 0, wobble);

        // --- Dibujar efectos ---
        this.particles.draw(ctx);
        this.floatingTexts.draw(ctx);
        ctx.restore();
    }
}
