
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Получаем текущую директорию в ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Сохраняем в папку публичных ресурсов
const outputDir = path.join(__dirname, '../public/img');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Логотип TITAN CRM
const logoSvgContent = `
<svg width="200" height="200" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Фон -->
  <rect width="100" height="100" rx="16" fill="#0f172a"/>
  <!-- Внешний круг -->
  <circle cx="50" cy="50" r="44" stroke="#3b82f6" stroke-width="3"/>
  <!-- Буква T: горизонтальная перекладина -->
  <line x1="22" y1="33" x2="62" y2="33" stroke="#3b82f6" stroke-width="8" stroke-linecap="square"/>
  <!-- Буква T: вертикальная стойка -->
  <line x1="42" y1="33" x2="42" y2="75" stroke="#3b82f6" stroke-width="8" stroke-linecap="square"/>
  <!-- Буква i: точка -->
  <circle cx="74" cy="34" r="3.5" fill="#3b82f6"/>
  <!-- Буква i: тело -->
  <line x1="74" y1="44" x2="74" y2="73" stroke="#3b82f6" stroke-width="5" stroke-linecap="square"/>
</svg>
`;

const assets = [
    {
        name: 'logo-full.svg',
        content: logoSvgContent
    },
    {
        name: 'favicon.svg',
        content: logoSvgContent
    },
    {
        name: 'logo-sidebar.svg',
        content: logoSvgContent
    },
    {
        name: 'icon.svg',
        content: logoSvgContent
    }
];

console.log('🎨 Генерируем пакет графики TITAN CRM (Updated Neon Design)...');

assets.forEach(asset => {
    const filePath = path.join(outputDir, asset.name);
    fs.writeFileSync(filePath, asset.content.trim());
    console.log(`✅ Создан: ${asset.name}`);
});

console.log(`\n✨ Готово! Не забудьте обновить страницу.`);
