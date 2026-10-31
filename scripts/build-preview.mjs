import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { vehicles, vehicleCards, escape } from '../src/inventory.js';

let html = await readFile('index.html', 'utf8');
let script = await readFile('app.js', 'utf8');
const css = `${await readFile('style.css', 'utf8')}\n${await readFile('theme.css', 'utf8')}`;
await sharp('assets/original-00.png').trim({ background: '#000000', threshold: 18 }).webp({ quality: 90 }).toFile('assets/original-logo.webp');
html = html.replace('<!-- INVENTORY -->', () => vehicleCards(vehicles));
const reviewSource = JSON.parse(await readFile('assets/reviews-source.json', 'utf8'));
const googleLink = escape(reviewSource.resolvedListing);
const reviewCards = reviewSource.reviewExcerpts.map((review) => {
  if (!review.quote || !review.author || !review.sourceUrl || new URL(review.sourceUrl).protocol !== 'https:') throw new Error('Review cards require genuine quoted text, attribution, and an HTTPS source link.');
  return `<article class="customer-review-card"><span class="google-letter" aria-hidden="true">G</span><blockquote>${escape(review.quote)}</blockquote><p class="review-author">${escape(review.author)}</p><a class="text-button" href="${escape(review.sourceUrl)}" target="_blank" rel="noopener noreferrer">Original Google review ↗</a></article>`;
});
html = html.replace('<!-- CUSTOMER REVIEWS -->', () => `<article class="customer-review-card rating-summary"><span class="google-letter" aria-hidden="true">G</span><p class="eyebrow muted">GOOGLE BUSINESS PROFILE</p><strong class="section-review-score">5.0 <small>/ 5</small></strong><span class="review-stars" aria-label="5 out of 5 stars">★★★★★</span><p>Verified October 31, 2026. Open Google for the current rating and customer reviews.</p><a class="text-button" href="${googleLink}" target="_blank" rel="noopener noreferrer">View on Google ↗</a></article>${reviewCards.length ? reviewCards.join('') : `<article class="customer-review-card reviews-pending"><p class="eyebrow muted">CUSTOMER QUOTATIONS</p><h3>Real words.<br>No made-up stories.</h3><p>Customer review text is not available in this preview yet. Google’s public view restricted access; verified excerpts are needed before we can show their words here.</p><a class="text-button" href="${googleLink}" target="_blank" rel="noopener noreferrer">Read customer reviews on Google ↗</a></article>`}<article class="customer-review-card reviews-invitation"><p class="eyebrow muted">EXPLORE THE EXPERIENCES</p><h3>Go straight<br>to the source.</h3><p>Visit Dahmani Automotive’s Google business profile to read customer feedback and share your own experience.</p><a class="button button-dark" href="${googleLink}" target="_blank" rel="noopener noreferrer">Open Google reviews ↗</a></article>`);
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
