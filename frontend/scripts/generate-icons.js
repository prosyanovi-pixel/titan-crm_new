#!/usr/bin/env node
/**
 * Генератор иконок для TITAN CRM
 * Запуск: node scripts/generate-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');
const svgSource = path.join(publicDir, 'img', 'favicon.svg');

// Создаём папку icons если нет
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const svgBuffer = fs.readFileSync(svgSource);

// Все нужные размеры и назначения
const icons = [
  // Стандартные favicon
  { size: 16,  name: 'favicon-16x16.png',           dest: publicDir },
  { size: 32,  name: 'favicon-32x32.png',           dest: publicDir },
  { size: 48,  name: 'favicon-48x48.png',           dest: publicDir },
  // Apple Touch Icon
  { size: 180, name: 'apple-touch-icon.png',        dest: publicDir },
  // Android / PWA
  { size: 192, name: 'android-chrome-192x192.png',  dest: publicDir },
  { size: 512, name: 'android-chrome-512x512.png',  dest: publicDir },
  // Windows / mstile
  { size: 150, name: 'mstile-150x150.png',          dest: publicDir },
  // Open Graph / Social sharing
  { size: 512, name: 'og-image-512.png',            dest: path.join(publicDir, 'img') },
  // icons/ папка — дополнительные размеры
  { size: 72,  name: 'icon-72x72.png',              dest: iconsDir },
  { size: 96,  name: 'icon-96x96.png',              dest: iconsDir },
  { size: 128, name: 'icon-128x128.png',            dest: iconsDir },
  { size: 144, name: 'icon-144x144.png',            dest: iconsDir },
  { size: 152, name: 'icon-152x152.png',            dest: iconsDir },
  { size: 192, name: 'icon-192x192.png',            dest: iconsDir },
  { size: 384, name: 'icon-384x384.png',            dest: iconsDir },
  { size: 512, name: 'icon-512x512.png',            dest: iconsDir },
];

console.log('🎨 Генерация иконок TITAN CRM...\n');

for (const icon of icons) {
  const outputPath = path.join(icon.dest, icon.name);
  await sharp(svgBuffer)
    .resize(icon.size, icon.size)
    .png()
    .toFile(outputPath);
  console.log(`  ✅ ${icon.name} (${icon.size}x${icon.size})`);
}

// Генерируем favicon.ico (объединяем 16, 32, 48 в один .ico)
// sharp не поддерживает .ico напрямую, создаём простую копию 32x32
const icoBuffer = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
console.log('  ✅ favicon.ico (32x32)');

console.log('\n✨ Все иконки успешно сгенерированы!');
console.log(`📁 Основные иконки: ${publicDir}`);
console.log(`📁 Дополнительные: ${iconsDir}`);
