// ==========================================
// CONFIGURACIÓN Y CONSTANTES DEL JUEGO
// Archivo central con TODOS los valores numéricos,
// rutas de assets, textos y layouts de niveles.
// Modificar aquí para ajustar gameplay sin tocar lógica.
// ==========================================

// --- Dimensiones del canvas (viewport visible) ---
export const GAME_WIDTH = 600;   // Ancho del área de juego en píxeles lógicos
export const GAME_HEIGHT = 800;  // Alto del área de juego en píxeles lógicos

// --- Mundo / Cámara ---
// El mundo es más alto que el viewport; la cámara sigue al jugador verticalmente.
// Ej: 1.6 = mundo 60% más alto que el viewport (1280px vs 800px).
export const WORLD_HEIGHT_SCALE = 1.6;

// --- Jugador (Guanaco) ---
export const BASE_PLAYER_SPEED = 450;          // Velocidad base en px/seg
export const SPEED_PER_TIER = 15;              // Aumento de velocidad por tier de dificultad
export const PLAYER_SIZE_SCALE = 1.05;         // Escala visual del sprite (relativa al alto de carril)
export const PLAYER_VIS_WIDTH_FACTOR = 0.7;    // Factor de ancho visual = laneHeight * este valor * PLAYER_SIZE_SCALE
export const PLAYER_VIS_HEIGHT_FACTOR = 0.9;   // Factor de alto visual = laneHeight * este valor * PLAYER_SIZE_SCALE
export const PLAYER_STEP_INTERVAL = 0.2;       // Segundos entre sonidos de paso al caminar

// --- Autos / Vehículos ---
export const NUM_CAR_SPRITES = 6;              // Cantidad de sprites de autos disponibles (car1..car6)
export const CARS_PER_LANE = 2;                // Cantidad de autos por carril
export const CAR_HEIGHT_FACTOR = 0.85;         // Altura base del auto como fracción del carril
export const CAR_SIZE_SCALE = 1.17;            // Escala general de autos (1.17 = 25% más grande que 0.9375)
export const BASE_CAR_SPEED = 80;              // Velocidad base de autos en px/seg
export const CAR_SPEED_PER_TIER = 15;          // Aumento de velocidad por tier de dificultad
export const CAR_BOUNCE_SPEED = 15;            // Frecuencia del rebote visual de los autos
export const CAR2_SIZE_MULTIPLIER = 1.6;       // Multiplicador extra para car2 (camión) - se aplica parejo a ambos ejes
export const CAR_SPACING_MULTIPLIER = 2.5;     // Multiplicador de separación mínima entre autos (evita apilamiento)

// --- Escalas de colisión (hitbox) ---
// Cada valor es una fracción del tamaño VISUAL de la entidad.
// Ej: PLAYER_W_V = 0.08 significa que el hitbox del jugador (mirando vertical)
// es solo el 8% de su ancho visual. Hitbox más chico = colisiones más justas.
export const SCALES = {
    PLAYER_W_V: 0.08,  // Ancho hitbox del jugador mirando arriba/abajo
    PLAYER_H_V: 0.08,  // Alto hitbox del jugador mirando arriba/abajo
    PLAYER_W_H: 0.1,   // Ancho hitbox del jugador mirando izquierda/derecha
    PLAYER_H_H: 0.05,  // Alto hitbox del jugador mirando izquierda/derecha
    CAR_W: 0.9,        // Ancho hitbox de autos (90% del visual)
    CAR_H: 0.4,        // Alto hitbox de autos (40% del visual)
    CASA_W: 0.7,       // Ancho hitbox de la casa
    CASA_H: 0.35       // Alto hitbox de la casa
};

// --- Casa (objetivo final del nivel) ---
export const HOUSE_VIS_SCALE = 1.53;  // Escala visual de la casa relativa al strip superior

// --- Postes (puntos de conexión de fibra óptica) ---
export const POLE_WIDTH = 35;                  // Ancho del hitbox del poste (para activar conexión)
export const POLE_HEIGHT = 50;                 // Alto del hitbox del poste
export const POLE_VIS_WIDTH_FACTOR = 0.8;      // Ancho visual del poste como fracción del carril
export const POLE_VIS_HEIGHT_FACTOR = 1.8;     // Alto visual del poste como fracción del carril
export const POLE_POSITIONS = [0.25, 0.75];    // Posiciones horizontales de postes (fracciones del ancho)
export const POLE_RANDOM_OFFSET = 40;          // Variación aleatoria en px de la posición del poste

// --- Efectos visuales ---
export const FREEZE_DURATION = 0.2;            // Duración del congelamiento al ser golpeado (seg)
export const SHAKE_DURATION = 0.3;             // Duración del temblor de pantalla (seg)
export const SHAKE_MAGNITUDE = 15;             // Intensidad máxima del temblor en px
export const HIT_PARTICLE_COUNT = 40;          // Partículas generadas al ser golpeado
export const HIT_PARTICLE_SPEED = 2;           // Velocidad de dispersión de partículas de golpe
export const CONNECT_PARTICLE_COUNT = 15;      // Partículas al conectar un poste
export const CONNECT_PARTICLE_SPEED = 1.5;     // Velocidad de partículas de conexión
export const STEP_PARTICLE_COUNT = 2;          // Partículas al caminar (polvo)
export const STEP_PARTICLE_SPEED = 0.2;        // Velocidad de partículas de paso

// --- Estrellas de nivel (evaluación de rendimiento) ---
export const STAR_TIME_3 = 20;  // Completar en menos de 20seg = 3 estrellas
export const STAR_TIME_2 = 35;  // Completar en menos de 35seg = 2 estrellas; más = 1 estrella

// --- Timing general ---
export const MAX_DT = 0.1;                        // Delta time máximo por frame (evita saltos grandes)
export const TIMED_MESSAGE_INTERVAL_MS = 300000;   // Cada 5 minutos aparece un mensaje de "la casa te extraña"
export const LEVELS_PER_TIER = 2;                  // Cada 2 niveles sube un tier de dificultad (autos más rápidos)

// --- Vidas y niveles ---
export const INITIAL_LIVES = 3;   // Vidas iniciales del jugador
export const MAX_LEVELS = 10;     // Cantidad total de niveles en el juego

// --- Cable visual (línea de fibra óptica) ---
export const CABLE_WIDTH = 4;              // Grosor del cable en px
export const CABLE_SHADOW_BLUR = 10;       // Difuminado del brillo del cable
export const CABLE_COLOR = '#e67e22';      // Color naranja del cable
export const CABLE_SHADOW_COLOR = '#f39c12'; // Color del brillo/resplandor del cable

// --- Rutas de imágenes (locales desde assets/) ---
export const IMAGE_URLS = {
    cesped: './assets/cesped.jpg',         // Textura de pasto (se usa como patrón repetido)
    poste: './assets/poste.png',           // Sprite del poste eléctrico
    casa: './assets/casa.png',             // Sprite de la casa destino
    car1: './assets/car1.png',             // Sprite auto sedán
    car2: './assets/car2.png',             // Sprite camión (más grande con CAR2_SIZE_MULTIPLIER)
    car3: './assets/car3.png',             // Sprite auto deportivo
    car4: './assets/car4.png',             // Sprite ambulancia
    car5: './assets/car5.png',             // Sprite taxi
    car6: './assets/car6.png',             // Sprite SUV
    up: './assets/guanaco_up.png',         // Guanaco mirando arriba
    down: './assets/guanaco_down.png',     // Guanaco mirando abajo
    left: './assets/guanaco_left.png',     // Guanaco mirando izquierda
    right: './assets/guanaco_right.png',   // Guanaco mirando derecha
};

// --- Frases y mensajes humorísticos ---

// Excusas al perder (pantalla Game Over)
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

// Frases del jefe que aparecen flotando al conectar un poste
export const FRASES_JEFE_IN_GAME = [
    "¡El cable cuesta dinero!",
    "¡Más fibra, menos pasto!",
    "¡Muévete, rumiante!",
    "¡El cliente espera!",
    "¡Ese poste no se ancla solo!",
    "¡Ping alto! ¡Corre!",
    "¡No te pago por esquivar!"
];

// Partes del "dato curioso" (se combinan aleatoriamente: P1 + P2 + P3)
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

// Mensajes del jefe al completar un nivel
export const MENSAJES_JEFE = [
    "¡Bien hecho! Te descontaré el tiempo que tardaste en cruzar.",
    "Excelente. Tu bono es una zanahoria.",
    "El cliente tiene internet. Vuelve trotando.",
    "Buen trabajo. Mañana te toca la autopista central.",
    "El ping es de 2ms. Aceptable para un mamífero.",
    "Impecable. Serás 'Empleado del Mes' (sin aumento)."
];

// Mensajes que aparecen cada 5 minutos de juego
export const MENSAJES_CASA = [
    "¡La casa te extraña!",
    "Tu habitación sigue esperándote.",
    "¿Sabes qué hora es? ¡Vuelve!",
    "El Wi-Fi no funciona sin tus pezuñas.",
    "Tus compañeros de cuadrilla te extrañan."
];

// --- Layouts de niveles ---
// Cada nivel es un array de strips (franjas) de arriba a abajo.
// type: 'grass' = césped, 'road' = carretera
// lanes: cantidad de carriles/filas que ocupa la franja
// El primer strip (index 0) es el de arriba donde va la casa.
// El último strip es el de abajo donde empieza el jugador.
// Los strips de grass intermedios (ni primero ni último) generan postes.
export const LEVEL_LAYOUTS = [
    [], // Índice 0 no se usa (niveles empiezan en 1)
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
