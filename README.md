# Guanaco Instalador

Un juego arcade estilo Frogger donde controlás a un guanaco técnico de fibra óptica que debe cruzar calles llenas de tráfico, conectar postes y llegar a la casa del cliente para completar la instalación.

## Como jugar

- **Flechas del teclado** o **D-pad tactil** para mover al guanaco
- Conectá todos los postes pasando por encima de ellos
- Una vez conectados todos los postes, entrá a la casa para completar el nivel
- Esquivá los autos o perdés una vida
- 10 niveles con dificultad creciente

## Estructura del proyecto

```
index.html          -> HTML + CSS del juego
js/
  config.js         -> Constantes, rutas de assets, frases y layouts
  audio.js          -> Sistema de audio (Web Audio API)
  entities.js       -> Clases Entity, ParticleSystem, FloatingTextSystem
  game.js           -> Clase Game principal
  ui.js             -> Logica de UI, event listeners y game loop
assets/
  cesped.jpg        -> Textura del cesped
  poste.png         -> Sprite del poste
  casa.png          -> Sprite de la casa
  car1-6.png        -> Sprites de autos
  guanaco_*.png     -> Sprites del jugador (up/down/left/right)
```

## Descargar assets

Los sprites se alojan originalmente en imgur. Para descargarlos localmente:

```bash
bash download_assets.sh
```

## Ejecutar localmente

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000` en el navegador.

## GitHub Pages

El juego esta listo para desplegarse en GitHub Pages directamente desde la rama principal (root `/`).
