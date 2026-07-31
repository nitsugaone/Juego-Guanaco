// ==========================================
// UI, CARGA DE ASSETS Y GAME LOOP
// Punto de entrada del juego (type="module").
// Maneja: canvas, carga de imágenes, botones,
// pantallas del menú, leaderboard y el game loop.
// ==========================================

import {
    GAME_WIDTH, GAME_HEIGHT, MAX_DT,
    IMAGE_URLS, EXCUSAS_GUANACO, DATO_P1, DATO_P2, DATO_P3,
    MENSAJES_JEFE, SPRITE_TEXT_REGIONS
} from './config.js';

import { AudioSystem } from './audio.js';
import { Game } from './game.js';
import { SpriteCache } from './sprites.js';

// --- Configuración del canvas ---
// Se escala por devicePixelRatio para pantallas retina/HiDPI
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false }); // alpha:false = fondo opaco (más rápido)
const dpr = window.devicePixelRatio || 1;
canvas.width = Math.floor(GAME_WIDTH * dpr);   // Resolución real del canvas
canvas.height = Math.floor(GAME_HEIGHT * dpr);
ctx.scale(dpr, dpr);                           // Escalar para que las coordenadas sean lógicas

// --- Instanciar sistema de audio ---
const audio = new AudioSystem();

// --- Cache de sprites ---
// Pre-escala y colorea cada sprite una sola vez en vez de hacerlo por frame.
const sprites = new SpriteCache(dpr, SPRITE_TEXT_REGIONS);

// --- Assets (imágenes cargadas) ---
const ASSETS = {};           // Objeto clave→Image con todas las imágenes
let cespedPattern = null;    // Patrón de césped (se crea al cargar cesped.jpg)

// --- Estado global ---
let game = null;    // Instancia del juego
let lastTime = 0;   // Timestamp del frame anterior (para calcular dt)

// ==========================================
// Gestión de pantallas
// ==========================================

/**
 * Muestra una pantalla de menú y oculta las demás.
 * @param {string|null} screenId - ID del div a mostrar (null = ocultar todas → mostrar juego)
 */
function setScreen(screenId) {
    document.querySelectorAll('.menu-screen').forEach(el => el.style.display = 'none');
    if (screenId) document.getElementById(screenId).style.display = 'flex';
}

// ==========================================
// Leaderboard (tabla de puntajes)
// ==========================================

/** Escapa texto para que un nombre con < o & no rompa el HTML de la lista */
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

/** Lee los puntajes de localStorage y actualiza la lista HTML */
function updateLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('guanacoScores')) || [];
    const list = document.getElementById('highScoresList');
    list.innerHTML = '';
    if (scores.length === 0) {
        list.innerHTML = '<li>1. Sin récords aún</li>';
        return;
    }
    scores.forEach((s, i) => {
        // Las entradas viejas no guardaban el nivel alcanzado
        const lvl = s.level ? `Nv.${s.level}` : 'Nv.?';
        list.innerHTML += `<li>${i + 1}. ${escapeHtml(s.name)} - ${lvl} - ${s.time}</li>`;
    });
}

/**
 * Guarda un intento en localStorage y deja solo los 5 mejores.
 *
 * Se ordena primero por nivel alcanzado y recién después por tiempo. Antes se
 * ordenaba solo por tiempo, así que quien abandonaba a los 5 minutos en el
 * nivel 2 quedaba por encima de quien terminaba los 10 niveles en 8 minutos.
 *
 * @param {string} name - Nombre del jugador
 * @param {number} timeInSeconds - Tiempo total en segundos
 * @param {number} level - Nivel alcanzado
 */
function saveScore(name, timeInSeconds, level) {
    const scores = JSON.parse(localStorage.getItem('guanacoScores')) || [];
    const mins = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    scores.push({
        name: (name || "").trim() || "Anónimo",
        level: level,
        time: `${mins}:${secs}`,
        rawSeconds: timeInSeconds
    });
    scores.sort((a, b) => (b.level || 0) - (a.level || 0) || a.rawSeconds - b.rawSeconds);
    scores.splice(5);  // Mantener solo top 5
    localStorage.setItem('guanacoScores', JSON.stringify(scores));
}

/** Guarda el intento actual y vuelve al menú principal */
function saveAndExit(inputId) {
    saveScore(document.getElementById(inputId).value, game.timeElapsed, game.level);
    document.getElementById(inputId).value = '';
    updateLeaderboard();
    setScreen('startScreen');
    game.state = "MENU";
}

// ==========================================
// Carga de assets (imágenes)
// ==========================================

/**
 * Carga todas las imágenes definidas en IMAGE_URLS.
 * Muestra progreso en pantalla. Al completar, ejecuta onComplete.
 * @param {Function} onComplete - Callback cuando todas las imágenes cargaron
 */
function loadAssets(onComplete) {
    let loaded = 0;
    const total = Object.keys(IMAGE_URLS).length;
    const loadingText = document.getElementById('loadingText');

    if (total === 0) {
        onComplete();
        return;
    }

    for (const key in IMAGE_URLS) {
        // Los assets son locales (mismo origen), así que no hace falta
        // crossOrigin: pedirlo solo agrega una restricción que puede
        // hacer fallar la carga en algunos servidores.
        const img = new Image();

        img.onload = () => {
            loaded++;
            // Actualizar texto de progreso
            if (loadingText) {
                loadingText.innerText = `Cargando... ${Math.floor((loaded / total) * 100)}%`;
            }
            // Crear patrón de césped una vez que su imagen cargue
            if (key === 'cesped') {
                cespedPattern = ctx.createPattern(img, 'repeat');
            }
            if (loaded === total) onComplete();
        };

        img.onerror = () => {
            console.error("Fallo al cargar: " + IMAGE_URLS[key]);
            loaded++;
            if (loaded === total) onComplete();
        };

        img.src = IMAGE_URLS[key];
        ASSETS[key] = img;
    }
}

// ==========================================
// Humor procedimental (botones de texto AI)
// Los textos se generan combinando frases aleatorias
// en vez de usar una API de AI (funciona 100% offline).
// ==========================================

/** Selecciona un elemento aleatorio de un array */
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Botón "Dato curioso" en pantalla de inicio
document.getElementById('generateFactBtn').addEventListener('click', () => {
    const el = document.getElementById('aiFactText');
    el.style.display = 'block';
    el.innerText = `"${pickRandom(DATO_P1)} ${pickRandom(DATO_P2)} ${pickRandom(DATO_P3)}"`;
});

// Botón "Mensaje del jefe" en pantalla de victoria de nivel
document.getElementById('generateWinBtn').addEventListener('click', () => {
    const el = document.getElementById('aiWinText');
    el.style.display = 'block';
    el.innerText = `"${pickRandom(MENSAJES_JEFE)}"`;
});

// Botón "Excusa" en pantalla de game over
document.getElementById('generateExcuseBtn').addEventListener('click', () => {
    const el = document.getElementById('aiExcuseText');
    el.style.display = 'block';
    el.innerText = `"${pickRandom(EXCUSAS_GUANACO)}"`;
});

// ==========================================
// Botones de juego
// ==========================================

// Iniciar partida nueva
document.getElementById('startBtn').addEventListener('click', () => {
    audio.resume(); // Desbloquear audio tras interacción del usuario
    document.getElementById('aiFactText').style.display = 'none';
    game.resetRun();
    setScreen(null);         // Ocultar menús → mostrar canvas
    game.state = "PLAYING";
});

// Reiniciar tras game over
document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('aiExcuseText').style.display = 'none';
    game.resetRun();
    setScreen(null);
    game.state = "PLAYING";
});

// Siguiente nivel
document.getElementById('nextLevelBtn').addEventListener('click', () => {
    document.getElementById('aiWinText').style.display = 'none';
    game.level++;
    game.initLevel(game.level);
    setScreen(null);
    game.state = "PLAYING";
});

// Guardar puntaje (pantalla de victoria final)
document.getElementById('saveScoreBtn').addEventListener('click', () => saveAndExit('playerName'));

// Guardar puntaje (pantalla de mensaje temporizado)
document.getElementById('timedSaveScoreBtn').addEventListener('click', () => saveAndExit('timedPlayerName'));

// Guardar el intento tras perder: antes morir no dejaba ningún registro
document.getElementById('gameOverSaveBtn').addEventListener('click', () => {
    document.getElementById('aiExcuseText').style.display = 'none';
    saveAndExit('gameOverPlayerName');
});

// Continuar jugando (desde mensaje temporizado)
document.getElementById('continuePlayingBtn').addEventListener('click', () => {
    setScreen(null);
    game.state = "PLAYING";
    lastTime = performance.now(); // Resetear timer para evitar salto de dt
});

// Pausar juego
document.getElementById('pauseBtn').addEventListener('click', () => {
    if (game && game.state === "PLAYING") {
        game.state = "PAUSED";
        setScreen('pauseScreen');
    }
});

// Reanudar juego
document.getElementById('resumeBtn').addEventListener('click', () => {
    if (game && game.state === "PAUSED") {
        game.state = "PLAYING";
        setScreen(null);
        lastTime = performance.now();
    }
});

// ==========================================
// Game Loop (bucle principal)
// ==========================================

/**
 * Bucle principal del juego.
 * Se ejecuta ~60 veces por segundo via requestAnimationFrame.
 * Calcula delta time, actualiza lógica y renderiza.
 */
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000; // Convertir ms a segundos
    lastTime = timestamp;
    if (dt > MAX_DT) dt = MAX_DT;           // Clampear para evitar saltos grandes (ej: cambio de pestaña)

    // Actualizar y dibujar solo si hay una partida en curso. VICTORY entra en
    // la lista porque si no el canvas quedaba congelado detrás de la pantalla final.
    if (game && (game.state === "PLAYING" || game.state === "PAUSED" ||
        game.state === "GAMEOVER" || game.state === "WINLEVEL" ||
        game.state === "VICTORY")) {
        game.update(dt);
        game.draw(ctx);
    }
    requestAnimationFrame(gameLoop); // Solicitar siguiente frame
}

// ==========================================
// Inicialización
// ==========================================
updateLeaderboard();   // Mostrar puntajes guardados
loadAssets(() => {
    // Cuando todas las imágenes cargaron:
    setScreen('startScreen');  // Mostrar menú principal
    game = new Game(audio, ASSETS, cespedPattern, setScreen, sprites);
    game.state = "MENU";
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);  // Arrancar el game loop
});
