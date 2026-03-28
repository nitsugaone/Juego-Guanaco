// ==========================================
// CONFIGURACIÓN Y CONSTANTES DEL JUEGO
// ==========================================

// --- Dimensiones del canvas ---
export const GAME_WIDTH = 600;
export const GAME_HEIGHT = 800;

// --- Jugador ---
export const BASE_PLAYER_SPEED = 300;
export const SPEED_PER_TIER = 10;
export const PLAYER_SIZE_SCALE = 4.5;
export const PLAYER_VIS_WIDTH_FACTOR = 0.7;
export const PLAYER_VIS_HEIGHT_FACTOR = 0.9;
export const PLAYER_STEP_INTERVAL = 0.2;

// --- Autos ---
export const NUM_CAR_SPRITES = 6;
export const CARS_PER_LANE = 2;
export const CAR_HEIGHT_FACTOR = 0.85;
export const CAR_SIZE_SCALE = 0.75;
export const CAR_ASPECT_RATIO = 2.2;
export const BASE_CAR_SPEED = 80;
export const CAR_SPEED_PER_TIER = 15;
export const CAR_BOUNCE_SPEED = 15;

// --- Escalas de colisión ---
export const SCALES = {
    PLAYER_W_V: 0.08,
    PLAYER_H_V: 0.08,
    PLAYER_W_H: 0.1,
    PLAYER_H_H: 0.05,
    CAR_W: 0.9,
    CAR_H: 0.4,
    CASA_W: 0.7,
    CASA_H: 0.35
};

// --- Casa ---
export const HOUSE_VIS_SCALE = 0.9;

// --- Postes ---
export const POLE_WIDTH = 20;
export const POLE_HEIGHT = 30;
export const POLE_VIS_WIDTH_FACTOR = 0.5;
export const POLE_VIS_HEIGHT_FACTOR = 1.2;
export const POLE_POSITIONS = [0.25, 0.75];
export const POLE_RANDOM_OFFSET = 40;

// --- Efectos ---
export const FREEZE_DURATION = 0.2;
export const SHAKE_DURATION = 0.3;
export const SHAKE_MAGNITUDE = 15;
export const HIT_PARTICLE_COUNT = 40;
export const HIT_PARTICLE_SPEED = 2;
export const CONNECT_PARTICLE_COUNT = 15;
export const CONNECT_PARTICLE_SPEED = 1.5;
export const STEP_PARTICLE_COUNT = 2;
export const STEP_PARTICLE_SPEED = 0.2;

// --- Estrellas de nivel ---
export const STAR_TIME_3 = 15;
export const STAR_TIME_2 = 25;

// --- Timing ---
export const MAX_DT = 0.1;
export const TIMED_MESSAGE_INTERVAL_MS = 300000;
export const LEVELS_PER_TIER = 2;

// --- Vidas ---
export const INITIAL_LIVES = 3;
export const MAX_LEVELS = 10;

// --- Cable visual ---
export const CABLE_WIDTH = 4;
export const CABLE_SHADOW_BLUR = 10;
export const CABLE_COLOR = '#e67e22';
export const CABLE_SHADOW_COLOR = '#f39c12';

// --- Rutas de imágenes (locales) ---
export const IMAGE_URLS = {
    cesped: './assets/cesped.jpg',
    poste: './assets/poste.png',
    casa: './assets/casa.png',
    car1: './assets/car1.png',
    car2: './assets/car2.png',
    car3: './assets/car3.png',
    car4: './assets/car4.png',
    car5: './assets/car5.png',
    car6: './assets/car6.png',
    up: './assets/guanaco_up.png',
    down: './assets/guanaco_down.png',
    left: './assets/guanaco_left.png',
    right: './assets/guanaco_right.png',
};

// --- Frases y mensajes ---
export const EXCUSAS_GUANACO = [
    "Nuestro técnico intentó escupir a un taxi. Salió mal.",
    "El guanaco ruteó su cuerpo bajo un sedán.",
    "Latencia alta: tardó demasiado en esquivar el tráfico.",
    "Pérdida de paquetes... y de pezuñas en el carril rápido.",
    "El técnico fue desconectado por un vehículo a 120 km/h.",
    "No cubrimos la instalación si el técnico enfrenta a una ambulancia.",
    "Su guanaco sufrió un 'hard reset' en la autopista.",
    "Interferencia de señal causada por el parachoques de un auto.",
    "Cuello de botella en la avenida. El técnico era la botella.",
    "Intentó hacer 'ping' a un auto en movimiento. Fatal.",
    "Error 404: Guanaco no encontrado (se lo llevó un flete).",
    "Incompatibilidad de hardware entre el cráneo y un parabrisas.",
    "El instalador entró en suspensión permanente tras el impacto.",
    "El cortafuegos falló. Chocó contra un coche.",
    "El ancho de banda de la calle no alcanzó para ambos."
];

export const FRASES_JEFE_IN_GAME = [
    "¡El cable cuesta dinero!",
    "¡Más fibra, menos pasto!",
    "¡Muévete, rumiante!",
    "¡El cliente espera!",
    "¡Ese poste no se ancla solo!",
    "¡Ping alto! ¡Corre!",
    "¡No te pago por esquivar!"
];

export const DATO_P1 = [
    "¿Sabías que el instalador",
    "Curiosidad: el técnico",
    "Es un secreto que el guanaco",
    "Según el manual, el instalador"
];

export const DATO_P2 = [
    "usa saliva para limpiar",
    "mastica para pelar",
    "exige cobrar en",
    "corre a 50 km/h para evitar"
];

export const DATO_P3 = [
    "módems 5G.",
    "cables de fibra.",
    "routers ajenos.",
    "taxis locos."
];

export const MENSAJES_JEFE = [
    "¡Bien hecho! Te descontaré el tiempo que tardaste en cruzar.",
    "Excelente. Tu bono es una zanahoria.",
    "El cliente tiene internet. Vuelve trotando.",
    "Buen trabajo. Mañana te toca la autopista central.",
    "El ping es de 2ms. Aceptable para un mamífero.",
    "Impecable. Serás 'Empleado del Mes' (sin aumento)."
];

export const MENSAJES_CASA = [
    "¡La casa te extraña!",
    "Tu habitación sigue esperándote.",
    "¿Sabes qué hora es? ¡Vuelve!",
    "El Wi-Fi no funciona sin tus pezuñas.",
    "Tus compañeros de cuadrilla te extrañan."
];

// --- Layouts de niveles ---
export const LEVEL_LAYOUTS = [
    [],
    [
        { type: 'grass', lanes: 2 }, { type: 'road', lanes: 2 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 2 },
        { type: 'grass', lanes: 2 }
    ],
    [
        { type: 'grass', lanes: 2 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 2 },
        { type: 'grass', lanes: 2 }
    ],
    [
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 2 }
    ],
    [
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 4 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 2 }
    ],
    [
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 2 },
        { type: 'grass', lanes: 1 }
    ],
    [
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 4 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 2 },
        { type: 'grass', lanes: 1 }
    ],
    [
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 4 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 4 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 1 }
    ],
    [
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 2 },
        { type: 'grass', lanes: 1 }
    ],
    [
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 4 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 4 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 3 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 2 },
        { type: 'grass', lanes: 1 }
    ],
    [
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 5 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 4 },
        { type: 'grass', lanes: 1 }, { type: 'road', lanes: 4 },
        { type: 'grass', lanes: 1 }
    ]
];
