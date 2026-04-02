// ==========================================
// UI, CARGA DE ASSETS Y GAME LOOP
// Punto de entrada del juego (type="module").
// Maneja: canvas, carga de imágenes, botones,
// pantallas del menú, leaderboard y el game loop.
// ==========================================

import {
    GAME_WIDTH, GAME_HEIGHT, MAX_DT, INITIAL_LIVES,
    IMAGE_URLS, EXCUSAS_GUANACO, DATO_P1, DATO_P2, DATO_P3,
    MENSAJES_JEFE
} from './config.js';

import { AudioSystem } from './audio.js';
import { Game } from './game.js';

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

/** Lee los puntajes de localStorage y actualiza la lista HTML */
function updateLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('guanacoScores')) || [];
    const list = document.getElementById('highScoresList');
    list.innerHTML = '';
    if (scores.length === 0) {
        list.innerHTML = '<li>1. Sin récords aún</li>';
    }
    scores.forEach((s, i) => {
        list.innerHTML += `<li>${i + 1}. ${s.name} - ${s.time}</li>`;
    });
}

/**
 * Guarda un puntaje en localStorage.
 * Mantiene solo los 5 mejores tiempos.
 * @param {string} name - Nombre del jugador
 * @param {number} timeInSeconds - Tiempo total en segundos
 */
function saveScore(name, timeInSeconds) {
    const scores = JSON.parse(localStorage.getItem('guanacoScores')) || [];
    const mins = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    scores.push({
        name: name || "Anónimo",
        time: `${mins}:${secs}`,
        rawSeconds: timeInSeconds
    });
    scores.sort((a, b) => a.rawSeconds - b.rawSeconds); // Ordenar por tiempo (menor = mejor)
    scores.splice(5);                                    // Mantener solo top 5
    localStorage.setItem('guanacoScores', JSON.stringify(scores));
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
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Necesario para createPattern con imágenes externas

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
    if (!game) game = new Game(audio, ASSETS, cespedPattern, setScreen);
    game.level = 1;
    game.vidas = INITIAL_LIVES;
    game.timeElapsed = 0;
    game.initLevel(game.level);
    setScreen(null);         // Ocultar menús → mostrar canvas
    game.state = "PLAYING";
});

// Reiniciar tras game over
document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('aiExcuseText').style.display = 'none';
    game.level = 1;
    game.vidas = INITIAL_LIVES;
    game.timeElapsed = 0;
    game.initLevel(game.level);
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
document.getElementById('saveScoreBtn').addEventListener('click', () => {
    const name = document.getElementById('playerName').value;
    saveScore(name, game.timeElapsed);
    updateLeaderboard();
    setScreen('startScreen');
    game.state = "MENU";
});

// Guardar puntaje (pantalla de mensaje temporizado)
document.getElementById('timedSaveScoreBtn').addEventListener('click', () => {
    const name = document.getElementById('timedPlayerName').value;
    saveScore(name, game.timeElapsed);
    updateLeaderboard();
    setScreen('startScreen');
    game.state = "MENU";
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

    // Actualizar y dibujar solo si el juego está activo
    if (game && (game.state === "PLAYING" || game.state === "PAUSED" ||
        game.state === "GAMEOVER" || game.state === "WINLEVEL")) {
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
    game = new Game(audio, ASSETS, cespedPattern, setScreen);
    game.state = "MENU";
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);  // Arrancar el game loop
});
