// ==========================================
// CLASE PRINCIPAL DEL JUEGO
// ==========================================

import {
    GAME_WIDTH, GAME_HEIGHT, SCALES, LEVEL_LAYOUTS,
    BASE_PLAYER_SPEED, SPEED_PER_TIER, PLAYER_SIZE_SCALE,
    PLAYER_VIS_WIDTH_FACTOR, PLAYER_VIS_HEIGHT_FACTOR, PLAYER_STEP_INTERVAL,
    NUM_CAR_SPRITES, CARS_PER_LANE, CAR_HEIGHT_FACTOR, CAR_SIZE_SCALE,
    CAR_ASPECT_RATIO, BASE_CAR_SPEED, CAR_SPEED_PER_TIER, CAR_BOUNCE_SPEED,
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
    constructor(audio, assets, cespedPattern, setScreenFn) {
        this.audio = audio;
        this.ASSETS = assets;
        this.cespedPattern = cespedPattern;
        this.setScreen = setScreenFn;

        this.state = "LOADING";
        this.level = 1;
        this.maxLevels = MAX_LEVELS;
        this.vidas = INITIAL_LIVES;
        this.timeElapsed = 0;
        this.levelTime = 0;

        this.nextMessageTime = TIMED_MESSAGE_INTERVAL_MS;
        this.messageIndex = 0;
        this.particles = new ParticleSystem();
        this.floatingTexts = new FloatingTextSystem();

        this.shakeTime = 0;
        this.freezeTime = 0;
        this.flashRed = false;
        this.keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
        this.setupInputs();
    }

    setupInputs() {
        window.addEventListener('keydown', e => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
            if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = true;
        }, { passive: false });

        window.addEventListener('keyup', e => {
            if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = false;
        });

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

    initLevel(levelIndex) {
        this.strips = [];
        this.cars = [];
        this.poles = [];
        this.cableNodes = [];
        this.levelTime = 0;

        const layoutIdx = Math.min(levelIndex, MAX_LEVELS);
        const layout = LEVEL_LAYOUTS[layoutIdx];

        const totalLanes = layout.reduce((sum, strip) => sum + strip.lanes, 0);
        const laneHeight = GAME_HEIGHT / totalLanes;

        this.player = new Entity(
            GAME_WIDTH / 2, 0,
            (laneHeight * PLAYER_VIS_WIDTH_FACTOR) * PLAYER_SIZE_SCALE,
            (laneHeight * PLAYER_VIS_HEIGHT_FACTOR) * PLAYER_SIZE_SCALE
        );

        const diffTier = Math.ceil(levelIndex / LEVELS_PER_TIER);
        this.player.speed = BASE_PLAYER_SPEED + (diffTier * SPEED_PER_TIER);
        this.player.dir = 'up';
        this.player.stepTimer = 0;

        let currentY = 0;
        for (let s = 0; s < layout.length; s++) {
            const strip = layout[s];
            const stripHeight = strip.lanes * laneHeight;
            const isBottom = (s === layout.length - 1);
            const isTop = (s === 0);
            const isRoad = (strip.type === 'road');

            this.strips.push({
                y: currentY, h: stripHeight, isRoad: isRoad,
                laneHeight: laneHeight, lanes: strip.lanes
            });

            if (isBottom) {
                this.player.y = currentY + stripHeight - (laneHeight / 2);
                this.cableNodes.push({ x: this.player.x, y: GAME_HEIGHT });
            } else if (isTop) {
                this.house = new Entity(
                    GAME_WIDTH / 2,
                    currentY + stripHeight / 2,
                    stripHeight * HOUSE_VIS_SCALE,
                    stripHeight * HOUSE_VIS_SCALE
                );
                this.house.w = this.house.visW * SCALES.CASA_W;
                this.house.h = this.house.visH * SCALES.CASA_H;
            }

            if (isRoad) {
                for (let l = 0; l < strip.lanes; l++) {
                    const laneCenterY = currentY + (l + 0.5) * laneHeight;
                    const direction = (l % 2 === 0) ? 1 : -1;
                    const baseSpeed = (BASE_CAR_SPEED + diffTier * CAR_SPEED_PER_TIER) * direction;
                    const spacing = GAME_WIDTH / CARS_PER_LANE;
                    const laneOffset = Math.random() * spacing;

                    for (let c = 0; c < CARS_PER_LANE; c++) {
                        const carVisH = (laneHeight * CAR_HEIGHT_FACTOR) * CAR_SIZE_SCALE;
                        const carVisW = carVisH * CAR_ASPECT_RATIO;
                        const startX = laneOffset + (c * spacing);
                        const car = new Entity(startX, laneCenterY, carVisW, carVisH);
                        car.w = car.visW * SCALES.CAR_W;
                        car.h = car.visH * SCALES.CAR_H;
                        car.speed = baseSpeed;
                        car.img = 'car' + (Math.floor(Math.random() * NUM_CAR_SPRITES) + 1);
                        car.hue = Math.random() * 360;
                        this.cars.push(car);
                    }
                }
            } else if (!isTop && !isBottom) {
                POLE_POSITIONS.forEach(pos => {
                    const p = new Entity(
                        GAME_WIDTH * pos + (Math.random() * POLE_RANDOM_OFFSET - POLE_RANDOM_OFFSET / 2),
                        currentY + stripHeight / 2,
                        laneHeight * POLE_VIS_WIDTH_FACTOR,
                        laneHeight * POLE_VIS_HEIGHT_FACTOR
                    );
                    p.w = POLE_WIDTH;
                    p.h = POLE_HEIGHT;
                    p.activado = false;
                    this.poles.push(p);
                });
            }
            currentY += stripHeight;
        }
        this.updateUI();
    }

    triggerHit() {
        this.audio.playHit();
        this.freezeTime = FREEZE_DURATION;
        this.shakeTime = SHAKE_DURATION;
        this.flashRed = true;
        this.particles.spawn(this.player.x, this.player.y, "#e74c3c", HIT_PARTICLE_COUNT, HIT_PARTICLE_SPEED);

        this.vidas--;
        if (this.vidas <= 0) {
            setTimeout(() => {
                this.setScreen("gameOverScreen");
                document.getElementById("aiExcuseText").style.display = "none";
                this.state = "GAMEOVER";
            }, 200);
        } else {
            setTimeout(() => this.initLevel(this.level), 200);
        }
        this.updateUI();
    }

    update(dt) {
        if (this.state !== "PLAYING") return;

        if (this.freezeTime > 0) {
            this.freezeTime -= dt;
            if (this.freezeTime <= 0) this.flashRed = false;
            return;
        }
        if (this.shakeTime > 0) this.shakeTime -= dt;

        this.timeElapsed += dt;
        this.levelTime += dt;

        if (this.timeElapsed * 1000 >= this.nextMessageTime) {
            this.state = "PAUSED";
            document.getElementById('timedMessageText').textContent =
                MENSAJES_CASA[this.messageIndex % MENSAJES_CASA.length];
            this.setScreen('timedMessageScreen');
            this.messageIndex++;
            this.nextMessageTime += TIMED_MESSAGE_INTERVAL_MS;
            return;
        }

        let moving = false;
        if (this.keys.ArrowUp) { this.player.y -= this.player.speed * dt; this.player.dir = 'up'; moving = true; }
        if (this.keys.ArrowDown) { this.player.y += this.player.speed * dt; this.player.dir = 'down'; moving = true; }
        if (this.keys.ArrowLeft) { this.player.x -= this.player.speed * dt; this.player.dir = 'left'; moving = true; }
        if (this.keys.ArrowRight) { this.player.x += this.player.speed * dt; this.player.dir = 'right'; moving = true; }

        if (moving) {
            this.player.stepTimer -= dt;
            if (this.player.stepTimer <= 0) {
                this.audio.playStep();
                this.particles.spawn(this.player.x, this.player.y + this.player.h / 2, "#95a5a6", STEP_PARTICLE_COUNT, STEP_PARTICLE_SPEED);
                this.player.stepTimer = PLAYER_STEP_INTERVAL;
            }
        }

        if (this.player.dir === 'up' || this.player.dir === 'down') {
            this.player.w = this.player.visW * SCALES.PLAYER_W_V;
            this.player.h = this.player.visH * SCALES.PLAYER_H_V;
        } else {
            this.player.w = this.player.visW * SCALES.PLAYER_W_H;
            this.player.h = this.player.visH * SCALES.PLAYER_H_H;
        }

        if (this.player.x < this.player.w / 2) this.player.x = this.player.w / 2;
        if (this.player.x > GAME_WIDTH - this.player.w / 2) this.player.x = GAME_WIDTH - this.player.w / 2;
        if (this.player.y < this.player.h / 2) this.player.y = this.player.h / 2;
        if (this.player.y > GAME_HEIGHT - this.player.h / 2) this.player.y = GAME_HEIGHT - this.player.h / 2;

        this.particles.update(dt);
        this.floatingTexts.update(dt);

        for (const c of this.cars) {
            c.x += c.speed * dt;
            if (c.speed > 0 && c.x - c.visW / 2 > GAME_WIDTH) c.x = -c.visW / 2;
            if (c.speed < 0 && c.x + c.visW / 2 < 0) c.x = GAME_WIDTH + c.visW / 2;
            if (this.player.checkCollision(c)) {
                this.triggerHit();
                return;
            }
        }

        for (const p of this.poles) {
            if (!p.activado && this.player.checkCollision(p)) {
                p.activado = true;
                this.cableNodes.push({ x: p.x, y: p.y });
                this.audio.playConnect();
                this.particles.spawn(p.x, p.y - p.h / 2, "#f1c40f", CONNECT_PARTICLE_COUNT, CONNECT_PARTICLE_SPEED);
                this.floatingTexts.spawn(
                    p.x, p.y - 40,
                    FRASES_JEFE_IN_GAME[Math.floor(Math.random() * FRASES_JEFE_IN_GAME.length)]
                );
            }
        }

        const allPolesActive = this.poles.every(p => p.activado);
        if (allPolesActive && this.player.checkCollision(this.house)) {
            this.audio.playWinLevel();
            if (this.level >= this.maxLevels) {
                document.getElementById('finalTimeText').innerText =
                    `Tiempo Total: ${this.formatTime(this.timeElapsed)}`;
                this.setScreen("victoryScreen");
                this.state = "VICTORY";
            } else {
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
    }

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

    formatTime(secsTotal) {
        const mins = Math.floor(secsTotal / 60);
        const secs = Math.floor(secsTotal % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateUI() {
        document.getElementById('levelInfo').innerText = `Nivel: ${this.level}`;
        let livesStr = "";
        for (let i = 0; i < this.vidas; i++) livesStr += "\uD83E\uDD99";
        document.getElementById('livesInfo').innerText = livesStr;
        document.getElementById('timeInfo').innerText = this.formatTime(this.timeElapsed);
    }

    draw(ctx) {
        ctx.imageSmoothingEnabled = false;

        if (this.flashRed) {
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            return;
        }

        ctx.save();
        if (this.shakeTime > 0) {
            const mag = (this.shakeTime / SHAKE_DURATION) * SHAKE_MAGNITUDE;
            ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
        }

        for (const s of this.strips) {
            if (s.isRoad) {
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
                ctx.fillStyle = this.cespedPattern ? this.cespedPattern : '#27ae60';
                ctx.fillRect(0, s.y, GAME_WIDTH, s.h);
            }
        }

        for (const p of this.poles) {
            this.drawImgCenter(ctx, 'poste', p.x, p.y, p.visW, p.visH);
            if (this.level === 1 && !p.activado) {
                const arrowY = p.y - p.visH + Math.sin(this.timeElapsed * 10) * 5;
                ctx.fillStyle = "#f1c40f";
                ctx.font = "20px 'Press Start 2P'";
                ctx.textAlign = "center";
                ctx.fillText("\u2193", p.x, arrowY);
            }
        }

        this.drawImgCenter(ctx, 'casa', this.house.x, this.house.y, this.house.visW, this.house.visH);
        if (this.level === 1 && this.poles.every(p => p.activado)) {
            ctx.fillStyle = "#2ecc71";
            ctx.font = "12px 'Press Start 2P'";
            ctx.textAlign = "center";
            ctx.fillText("\u00A1ENTRA!", this.house.x, this.house.y - this.house.visH / 2 - 10);
        }

        if (this.cableNodes.length > 0) {
            ctx.beginPath();
            ctx.moveTo(this.cableNodes[0].x, this.cableNodes[0].y);
            for (let i = 1; i < this.cableNodes.length; i++) {
                ctx.lineTo(this.cableNodes[i].x, this.cableNodes[i].y);
            }
            ctx.lineTo(this.player.x, this.player.y);
            ctx.shadowBlur = CABLE_SHADOW_BLUR;
            ctx.shadowColor = CABLE_SHADOW_COLOR;
            ctx.strokeStyle = CABLE_COLOR;
            ctx.lineWidth = CABLE_WIDTH;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        for (const c of this.cars) {
            const bounce = Math.abs(Math.sin(this.timeElapsed * CAR_BOUNCE_SPEED + c.x)) * 3;
            const flipX = c.speed > 0 ? -1 : 1;
            this.drawImgCenter(ctx, c.img, c.x, c.y - bounce, c.visW, c.visH, c.hue, 0, flipX);
        }

        const isMoving = (this.keys.ArrowUp || this.keys.ArrowDown || this.keys.ArrowLeft || this.keys.ArrowRight);
        const wobble = isMoving ? Math.sin(this.timeElapsed * 20) * 0.15 : 0;
        this.drawImgCenter(ctx, this.player.dir, this.player.x, this.player.y, this.player.visW, this.player.visH, 0, wobble);

        this.particles.draw(ctx);
        this.floatingTexts.draw(ctx);
        ctx.restore();
    }
}
