import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { vehicles, vehicleCards } from '../src/inventory.js';

let html = await readFile('index.html', 'utf8');
let script = await readFile('app.js', 'utf8');
const css = `${await readFile('style.css', 'utf8')}\n${await readFile('theme.css', 'utf8')}`;
await sharp('assets/original-00.png').trim({ background: '#000000', threshold: 18 }).webp({ quality: 90 }).toFile('assets/original-logo.webp');
html = html.replace('<!-- INVENTORY -->', () => vehicleCards(vehicles));
const paths = new Set([...`${html}\n${script}`.matchAll(/assets\/(?:original-\d+\.(?:jpg|png)|original-logo\.webp|(?:mark|car-concept)\.svg)/g)].map((match) => match[0]));
for (const path of paths) {
  const isSvg = path.endsWith('.svg');
  const data = isSvg ? await readFile(path) : await sharp(path).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
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
