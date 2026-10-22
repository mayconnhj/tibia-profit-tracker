import { fileURLToPath } from 'node:url';

export default {
  plugins: {
    // caminho explícito: sem ele o Tailwind procura a config no cwd e, com o dev server
    // iniciado de outra pasta, gera só o reset (nenhuma classe utilitária)
    tailwindcss: { config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)) },
    autoprefixer: {},
  },
};
