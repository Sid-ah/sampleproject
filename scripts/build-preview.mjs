import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

let html = await readFile('index.html', 'utf8');
let script = await readFile('app.js', 'utf8');
const css = await readFile('style.css', 'utf8');
const paths = new Set([...`${html}\n${script}`.matchAll(/assets\/(?:original-\d+\.(?:jpg|png)|(?:mark|car-concept)\.svg)/g)].map((match) => match[0]));
for (const path of paths) {
  const isSvg = path.endsWith('.svg');
  const data = isSvg ? await readFile(path) : await sharp(path).resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
  const uri = `data:image/${isSvg ? 'svg+xml' : 'webp'};base64,${data.toString('base64')}`;
  html = html.replaceAll(path, uri);
  script = script.replaceAll(path, uri);
}
html = html.replace('<link rel="stylesheet" href="style.css">', () => `<style>${css}</style>`);
html = html.replace('<script type="module" src="app.js"></script>', () => `<script>${script.replaceAll('</script', '<\\/script')}</script>`);
await writeFile('preview.html', html);
console.log(`Built self-contained preview: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
