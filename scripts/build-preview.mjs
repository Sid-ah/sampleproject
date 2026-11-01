import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import sharp from 'sharp';
import { vehicles, vehicleCards, money, escape } from '../src/inventory.js';

let html = await readFile('index.html', 'utf8');
let script = await readFile('app.js', 'utf8');
let css = await readFile('styles.css', 'utf8');
// Convert the black-background logo into a transparent one so it sits cleanly on dark surfaces.
const { data: logoPixels, info: logoInfo } = await sharp(await sharp('assets/original-00.png').trim({ background: '#000000', threshold: 18 }).toBuffer()).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let index = 0; index < logoPixels.length; index += 4) {
  const alpha = Math.max(logoPixels[index], logoPixels[index + 1], logoPixels[index + 2]);
  if (alpha < 10) { logoPixels.fill(0, index, index + 4); continue; }
  for (let channel = 0; channel < 3; channel++) logoPixels[index + channel] = Math.min(255, Math.round(logoPixels[index + channel] * 255 / alpha));
  logoPixels[index + 3] = alpha;
}
await sharp(logoPixels, { raw: { width: logoInfo.width, height: logoInfo.height, channels: 4 } }).webp({ quality: 92, alphaQuality: 100 }).toFile('assets/original-logo.webp');
const galleries = JSON.parse(await readFile('assets/galleries/manifest.json', 'utf8'));
for (const vehicle of vehicles) {
  if (galleries[vehicle.id]?.images.length !== vehicle.photos) throw new Error(`Photo count for ${vehicle.id} must match the recovered gallery (${galleries[vehicle.id]?.images.length}).`);
}
html = html.replace('<!-- INVENTORY -->', () => vehicleCards(vehicles));
const reviewSource = JSON.parse(await readFile('assets/reviews-source.json', 'utf8'));
const googleLink = escape(reviewSource.resolvedListing);
html = html.replaceAll('{{GOOGLE_LINK}}', googleLink).replaceAll('{{CAR_COUNT}}', String(vehicles.length)).replaceAll('{{MIN_PRICE}}', money(Math.min(...vehicles.map((vehicle) => vehicle.price))));
const googleIcon = '<svg class="google-icon" aria-hidden="true"><use href="#i-google"/></svg>';
const reviewCards = reviewSource.reviewExcerpts.map((review) => {
  if (!review.quote || !review.author || !review.sourceUrl || new URL(review.sourceUrl).protocol !== 'https:') throw new Error('Review cards require genuine quoted text, attribution, and an HTTPS source link.');
  return `<article class="customer-review-card">${googleIcon}<blockquote>${escape(review.quote)}</blockquote><p class="review-author">${escape(review.author)}</p><a class="text-button" href="${escape(review.sourceUrl)}" target="_blank" rel="noopener noreferrer">Original Google review</a></article>`;
});
const stars = `<span class="review-stars" role="img" aria-label="5 out of 5 stars">${'<svg class="icon" aria-hidden="true"><use href="#i-star"/></svg>'.repeat(5)}</span>`;
html = html.replace('<!-- CUSTOMER REVIEWS -->', () => `<article class="customer-review-card rating-summary">${googleIcon}<p class="eyebrow">Google business profile</p><strong class="section-review-score">5.0 <small>/ 5</small></strong>${stars}<p>Verified October 31, 2026. Open Google for the current rating and every customer review.</p><a class="button button-light" href="${googleLink}" target="_blank" rel="noopener noreferrer">View on Google</a></article>${reviewCards.join('')}<article class="customer-review-card reviews-invitation">${googleIcon}<h3>See what customers are saying</h3><p>Read the full set of reviews, with names and dates, on Dahmani Automotive's Google business profile. You can add your own, too.</p><a class="button button-dark" href="${googleLink}" target="_blank" rel="noopener noreferrer">Open Google reviews</a></article>`);
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
// `dist/` is the multi-file build for real hosting (Azure Static Web Apps); the single-file build is for the third-party review viewer.
let distHtml = html;
let distScript = script;
await rm('dist', { recursive: true, force: true });
for (const path of paths) {
  const isSvg = path.endsWith('.svg');
  const isLogo = path.endsWith('original-logo.webp');
  const data = isSvg ? await readFile(path) : await sharp(path).resize({ width: isLogo ? 560 : path.includes('/galleries/') ? 1200 : 1400, withoutEnlargement: true }).webp({ quality: isLogo ? 88 : path.includes('/galleries/') ? 72 : 78, alphaQuality: 100 }).toBuffer();
  const uri = `data:image/${isSvg ? 'svg+xml' : 'webp'};base64,${data.toString('base64')}`;
  const hostedPath = isSvg ? path : path.replace(/\.(?:jpg|png)$/, '.webp');
  await mkdir(dirname(`dist/${hostedPath}`), { recursive: true });
  await writeFile(`dist/${hostedPath}`, data);
  html = html.replaceAll(path, uri);
  distHtml = distHtml.replaceAll(path, hostedPath);
  if (!/original-\d+\.jpg$/.test(path)) { script = script.replaceAll(path, uri); distScript = distScript.replaceAll(path, hostedPath); }
}
const fontPath = 'assets/fonts/inter-latin-wght-normal.woff2';
css = css.replaceAll(fontPath, `data:font/woff2;base64,${(await readFile(fontPath)).toString('base64')}`);
if (!html.includes('<link rel="stylesheet" href="styles.css">')) throw new Error('index.html must link styles.css.');
const inlineScript = (source) => `<script>${source.replaceAll('</script', '<\\/script')}</script>`;
const inlineStyle = `<style>${css}</style>`;
distHtml = distHtml.replace('<link rel="stylesheet" href="styles.css">', () => inlineStyle).replace('<script type="module" src="app.js"></script>', () => inlineScript(distScript));
await writeFile('dist/index.html', distHtml);
await copyFile('staticwebapp.config.json', 'dist/staticwebapp.config.json');
html = html.replace('<link rel="stylesheet" href="styles.css">', () => inlineStyle);
html = html.replace('<script type="module" src="app.js"></script>', () => inlineScript(script));
await writeFile('site.html', html);
// The third-party review viewer executes every script tag, including JSON-LD.
html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '');
await writeFile('preview.html', html);
console.log(`Built self-contained preview: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB; hosted build: dist/index.html ${(Buffer.byteLength(distHtml) / 1024).toFixed(0)} KB`);
