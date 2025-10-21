// C:\Users\PC\Desktop\Footbalsim\frontend\vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url'; // YENİ EKLENEN SATIR

// __dirname yerine fileURLToPath ve import.meta.url kullanın
// Bu, Node.js'e özgü değişken olmadan dosya yolunu doğru alır.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Monorepo'nun Kök Dizinini Doğru Belirleyin
// /frontend'den bir üst klasöre (..) çıkın
const ROOT_PATH = path.resolve(__dirname, '..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // TÜM React importlarını, monorepo'nun kökündeki tek kopyaya zorlayın
      'react': path.resolve(ROOT_PATH, 'node_modules', 'react'),
      'react-dom': path.resolve(ROOT_PATH, 'node_modules', 'react-dom'),
    },
  },
  assetsInclude: ['**/*.mp4'],
});