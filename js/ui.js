// ==========================================
// UI, CARGA DE ASSETS Y GAME LOOP
// ==========================================

import {
    GAME_WIDTH, GAME_HEIGHT, MAX_DT, INITIAL_LIVES,
    IMAGE_URLS, EXCUSAS_GUANACO, DATO_P1, DATO_P2, DATO_P3,
    MENSAJES_JEFE
} from './config.js';

import { AudioSystem } from './audio.js';
import { Game } from './game.js';

// --- Canvas setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const dpr = window.devicePixelRatio || 1;
canvas.width = Math.floor(GAME_WIDTH * dpr);
canvas.height = Math.floor(GAME_HEIGHT * dpr);
ctx.scale(dpr, dpr);

// --- Audio ---
const audio = new AudioSystem();

// --- Assets ---
const ASSETS = {};
let cespedPattern = null;

// --- Estado ---
let game = null;
let lastTime = 0;

// ==========================================
// Pantallas
// ==========================================
function setScreen(screenId) {
    document.querySelectorAll('.menu-screen').forEach(el => el.style.display = 'none');
    if (screenId) document.getElementById(screenId).style.display = 'flex';
}

// ==========================================
// Leaderboard
// ==========================================
function updateLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('guanacoScores')) || [];
    const list = document.getElementById('highScoresList');
    list.innerHTML = '';
    if (scores.length === 0) {
        list.innerHTML = '<li>1. Sin r\u00e9cords a\u00fan</li>';
    }
    scores.forEach((s, i) => {
        list.innerHTML += `<li>${i + 1}. ${s.name} - ${s.time}</li>`;
    });
}

function saveScore(name, timeInSeconds) {
    const scores = JSON.parse(localStorage.getItem('guanacoScores')) || [];
    const mins = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const secs = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    scores.push({
        name: name || "An\u00f3nimo",
        time: `${mins}:${secs}`,
        rawSeconds: timeInSeconds
    });
    scores.sort((a, b) => a.rawSeconds - b.rawSeconds);
    scores.splice(5);
    localStorage.setItem('guanacoScores', JSON.stringify(scores));
}

// ==========================================
// Carga de assets
// ==========================================
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
        img.crossOrigin = "Anonymous";

        img.onload = () => {
            loaded++;
            if (loadingText) {
                loadingText.innerText = `Cargando... ${Math.floor((loaded / total) * 100)}%`;
            }
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
// Humor procedimental (botones AI offline)
// ==========================================
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

document.getElementById('generateFactBtn').addEventListener('click', () => {
    const el = document.getElementById('aiFactText');
    el.style.display = 'block';
    el.innerText = `"${pickRandom(DATO_P1)} ${pickRandom(DATO_P2)} ${pickRandom(DATO_P3)}"`;
});

document.getElementById('generateWinBtn').addEventListener('click', () => {
    const el = document.getElementById('aiWinText');
    el.style.display = 'block';
    el.innerText = `"${pickRandom(MENSAJES_JEFE)}"`;
});

document.getElementById('generateExcuseBtn').addEventListener('click', () => {
    const el = document.getElementById('aiExcuseText');
    el.style.display = 'block';
    el.innerText = `"${pickRandom(EXCUSAS_GUANACO)}"`;
});

// ==========================================
// Botones de juego
// ==========================================
document.getElementById('startBtn').addEventListener('click', () => {
    audio.resume();
    document.getElementById('aiFactText').style.display = 'none';
    if (!game) game = new Game(audio, ASSETS, cespedPattern, setScreen);
    game.level = 1;
    game.vidas = INITIAL_LIVES;
    game.timeElapsed = 0;
    game.initLevel(game.level);
    setScreen(null);
    game.state = "PLAYING";
});

document.getElementById('restartBtn').addEventListener('click', () => {
    document.getElementById('aiExcuseText').style.display = 'none';
    game.level = 1;
    game.vidas = INITIAL_LIVES;
    game.timeElapsed = 0;
    game.initLevel(game.level);
    setScreen(null);
    game.state = "PLAYING";
});

document.getElementById('nextLevelBtn').addEventListener('click', () => {
    document.getElementById('aiWinText').style.display = 'none';
    game.level++;
    game.initLevel(game.level);
    setScreen(null);
    game.state = "PLAYING";
});

document.getElementById('saveScoreBtn').addEventListener('click', () => {
    const name = document.getElementById('playerName').value;
    saveScore(name, game.timeElapsed);
    updateLeaderboard();
    setScreen('startScreen');
    game.state = "MENU";
});

document.getElementById('timedSaveScoreBtn').addEventListener('click', () => {
    const name = document.getElementById('timedPlayerName').value;
    saveScore(name, game.timeElapsed);
    updateLeaderboard();
    setScreen('startScreen');
    game.state = "MENU";
});

document.getElementById('continuePlayingBtn').addEventListener('click', () => {
    setScreen(null);
    game.state = "PLAYING";
    lastTime = performance.now();
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    if (game && game.state === "PLAYING") {
        game.state = "PAUSED";
        setScreen('pauseScreen');
    }
});

document.getElementById('resumeBtn').addEventListener('click', () => {
    if (game && game.state === "PAUSED") {
        game.state = "PLAYING";
        setScreen(null);
        lastTime = performance.now();
    }
});

// ==========================================
// Game Loop
// ==========================================
function gameLoop(timestamp) {
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (dt > MAX_DT) dt = MAX_DT;

    if (game && (game.state === "PLAYING" || game.state === "PAUSED" ||
        game.state === "GAMEOVER" || game.state === "WINLEVEL")) {
        game.update(dt);
        game.draw(ctx);
    }
    requestAnimationFrame(gameLoop);
}

// ==========================================
// Inicialización
// ==========================================
updateLeaderboard();
loadAssets(() => {
    setScreen('startScreen');
    game = new Game(audio, ASSETS, cespedPattern, setScreen);
    game.state = "MENU";
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
});
