import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const cars = [
  ['elantra', 'cmt67awh8000301s6sgvpj3tf'],
  ['prius', 'cmt66qpg8000201s6x0p0luew'],
  ['highlander', 'cmuixxqr5000001s6s3hr71tc'],
  ['camry', 'cmuiysv6h000401s6nnudubwp'],
  ['impreza', 'cmuiy32p7000101s6mldesoxi'],
  ['malibu', 'cmt66g7sz000101s6zp6tw67t'],
];
await mkdir('assets/galleries', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const manifest = {};
  for (const [id, sourceId] of cars) {
    const source = `https://dahmaniautomotive.com/cars/${sourceId}`;
    await page.goto(source, { waitUntil: 'networkidle', timeout: 90000 });
    console.log('DETAIL_PAGE', id, (await page.locator('body').innerText()).slice(0, 3500));
    const images = await page.locator('img').evaluateAll((images) => {
      const seen = new Set();
      return images.filter((image) => image.src.startsWith('https://storage.googleapis.com/') && !seen.has(image.src) && seen.add(image.src)).map((image) => ({ url: image.src, alt: image.alt }));
    });
    if (!images.length) throw new Error(`No gallery images recovered for ${id}`);
    for (const [index, image] of images.entries()) {
      const response = await page.request.get(image.url);
      if (!response.ok()) throw new Error(`Gallery photo returned ${response.status()}: ${image.url}`);
      image.path = `assets/galleries/${id}-${String(index).padStart(2, '0')}.jpg`;
      await writeFile(image.path, await response.body());
    }
    manifest[id] = { source, verifiedDate: '2026-10-31', images };
    console.log('RECOVERED_GALLERY', id, JSON.stringify(manifest[id]));
  }
  await writeFile('assets/galleries/manifest.json', JSON.stringify(manifest, null, 2));
  await page.goto('https://dahmaniautomotive.com/sell', { waitUntil: 'networkidle', timeout: 90000 });
  console.log('ORIGINAL_SELL_PAGE', (await page.locator('body').innerText()).slice(0, 5000));
  console.log('ORIGINAL_SELL_FORM', JSON.stringify(await page.locator('form').evaluateAll((forms) => forms.map((form) => ({ action: form.action, method: form.method, text: form.textContent })))));
} finally { await browser.close(); }
