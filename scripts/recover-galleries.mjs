import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('assets/galleries', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto('https://dahmaniautomotive.com/', { waitUntil: 'networkidle', timeout: 90000 });
  console.log('SOURCE_LINKS', JSON.stringify(await page.locator('a').evaluateAll((links) => links.map((link) => ({ text: link.textContent, href: link.href })))));
  const html = await page.content();
  const first = html.indexOf('2767ba52');
  console.log('SOURCE_DATA_EXCERPT', html.slice(Math.max(0, first - 2500), first + 7000));
  console.log('SOURCE_IMAGE_CONTEXT', JSON.stringify(await page.locator('img').evaluateAll((images) => images.map((image) => ({ alt: image.alt, src: image.src, parent: image.closest('article')?.outerHTML.slice(0, 3000) || image.parentElement?.parentElement?.outerHTML.slice(0, 1500) })))));
} finally { await browser.close(); }
