import { defineConfig } from 'vite';

/* Rutas relativas: la web funciona igual publicada en la raíz de un dominio
   o en una subruta (por ejemplo, usuario.github.io/portfolio_brahim/). */
export default defineConfig({
  base: './'
});
