# Portfolio · Brahim Nouni Ros

**Web:** https://brahimnr2003-beep.github.io/portfolio_brahim/

Vite + Three.js. Retrato de partículas → red neuronal con los proyectos → túnel de salida → contacto. En español e inglés.

## Arrancar
    npm install
    npm run dev      # http://localhost:5173
    npm run build    # genera dist/

## Publicación
Cada cambio en `main` se compila y se publica solo en GitHub Pages (`.github/workflows/deploy.yml`).

## Dónde editar
- `index.html`: página final (email, GitHub, LinkedIn, CV) y estructura.
- `src/i18n.js`: todos los textos en español e inglés.
- `src/main.js`: proyectos (nombre, descripción, color, enlaces) y recorrido del scroll.
- `src/style.css`: estilos.
- `public/cv/`: CV en PDF (español e inglés).
- `src/portrait-points.json`: puntos del retrato (generados desde la foto).
