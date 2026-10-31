import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { vehicles, vehicleCards, escape } from '../src/inventory.js';

let html = await readFile('index.html', 'utf8');
let script = await readFile('app.js', 'utf8');
const css = `${await readFile('style.css', 'utf8')}\n${await readFile('theme.css', 'utf8')}`;
await sharp('assets/original-00.png').trim({ background: '#000000', threshold: 18 }).webp({ quality: 90 }).toFile('assets/original-logo.webp');
html = html.replace('<!-- INVENTORY -->', () => vehicleCards(vehicles));
const galleries = JSON.parse(await readFile('assets/galleries/manifest.json', 'utf8'));
const originalSources = new Map(JSON.parse(await readFile('assets/manifest.json', 'utf8')).map((image) => [image.path, image.url]));
html = html.replace('<!-- GALLERIES -->', () => vehicles.map((vehicle) => {
  const gallery = galleries[vehicle.id];
  if (!gallery || !gallery.images.length) throw new Error(`Complete gallery missing: ${vehicle.id}`);
  return `<div id="gallery-${vehicle.id}">${gallery.images.map((image, index) => {
    const alt = escape(image.alt || `${vehicle.year} ${vehicle.name} — original photo ${index + 1}`);
    return image.url === originalSources.get(vehicle.image)
      ? `<span data-gallery-photo data-use-card data-alt="${alt}"></span>`
      : `<img data-gallery-photo src="${escape(image.path)}" alt="${alt}" loading="lazy">`;
  }).join('')}</div>`;
}).join(''));
const paths = new Set([...`${html}\n${script}`.matchAll(/assets\/(?:original-\d+\.(?:jpg|png)|galleries\/[a-z]+-\d+\.jpg|original-logo\.webp|(?:mark|car-concept)\.svg)/g)].map((match) => match[0]));
for (const path of paths) {
  const isSvg = path.endsWith('.svg');
  const data = isSvg ? await readFile(path) : await sharp(path).resize({ width: path.includes('/galleries/') ? 1200 : 1400, withoutEnlargement: true }).webp({ quality: path.includes('/galleries/') ? 72 : 78 }).toBuffer();
  const uri = `data:image/${isSvg ? 'svg+xml' : 'webp'};base64,${data.toString('base64')}`;
  html = html.replaceAll(path, uri);
  if (!/original-\d+\.jpg$/.test(path)) script = script.replaceAll(path, uri);
}
html = html.replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`);
html = html.replace('<link rel="stylesheet" href="theme.css">', '');
html = html.replace('<script type="module" src="app.js"></script>', () => `<script>${script.replaceAll('</script', '<\\/script')}</script>`);
await writeFile('site.html', html);
// The third-party review viewer executes every script tag, including JSON-LD.
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
await writeFile('preview.html', html);
console.log(`Built self-contained preview: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
