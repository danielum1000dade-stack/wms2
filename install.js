
/**
 * WMS Pro - Script de Instalação e Setup
 * Este script garante que a estrutura do projeto e os arquivos de configuração existam.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = [
    'src',
    'src/components',
    'src/pages',
    'src/context',
    'src/hooks',
    'src/assets'
];

const files = {
    'vite.config.ts': `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})`,
    'tailwind.config.js': `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}`,
    'postcss.config.js': `
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    'tsconfig.json': `
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
    'tsconfig.node.json': `
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`,
    'index.html': `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WMS Pro 2025</title>
    <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
  </head>
  <body class="bg-gray-100">
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
  </body>
</html>`,
    'src/index.css': `
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom Print Styles for Full Page Layouts */
@media print {
    @page {
        margin: 0;
    }
    body {
        background: white;
    }
}
`
};

console.log("🚀 Iniciando Instalação do WMS Pro...");

// 1. Criar Pastas
console.log("📁 Verificando estrutura de pastas...");
dirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`   + Criado: ${dir}`);
    }
});

// 2. Criar Arquivos de Configuração
console.log("⚙️  Gerando arquivos de configuração...");
Object.entries(files).forEach(([fileName, content]) => {
    const fullPath = path.join(__dirname, fileName);
    if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, content.trim());
        console.log(`   + Gerado: ${fileName}`);
    } else {
        console.log(`   . Já existe: ${fileName}`);
    }
});

// 3. Mover arquivos soltos para src/ (se existirem na raiz)
console.log("📦 Organizando código fonte...");
const sourceFiles = ['App.tsx', 'index.tsx', 'types.ts'];
sourceFiles.forEach(file => {
    const oldPath = path.join(__dirname, file);
    const newPath = path.join(__dirname, 'src', file);
    
    if (fs.existsSync(oldPath)) {
        // Se o destino já existe, removemos o antigo da raiz para evitar confusão, 
        // ou movemos se o destino não existe.
        if (!fs.existsSync(newPath)) {
            fs.renameSync(oldPath, newPath);
            console.log(`   -> Movido ${file} para src/`);
        }
    }
});

console.log("\n✅ Instalação da Estrutura Concluída!");
console.log("=========================================");
console.log("PRÓXIMOS PASSOS:");
console.log("1. Execute: npm install");
console.log("2. Execute: npm run dev");
console.log("=========================================");
