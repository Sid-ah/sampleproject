# Dahmani Automotive review concept

A responsive cash-only dealership concept with recovered imagery, complete vehicle galleries, saved vehicles, a photo-based 360-style explorer, seller request links, sharing, and a separate Three.js concept model. No financing section or payment calculator is included.

The original dealership website and existing repository default branch are not changed. This project lives only on the `dahmani-preview` branch.

## Run

```sh
npm ci
npm run build
npm start
```

Open http://localhost:4173. Run `npm test` for desktop/mobile browser checks (including a minimum text size scan and an axe accessibility/contrast audit). Set `PREVIEW_URL` to test a hosted deployment instead.

`npm run build` produces two outputs from the same source:

- `preview.html` / `site.html`: single self-contained files (about 8 MB) for the third-party review viewer and direct file hosting.
- `dist/`: the lightweight multi-file build (about 700 KB HTML plus cacheable WebP images) used for real hosting. It is git-ignored and rebuilt by CI.

## Deploy to Azure Static Web Apps

A free Static Web App serves `dist/` with HTTPS, a `*.azurestaticapps.net` URL, and `X-Robots-Tag: noindex` (see `staticwebapp.config.json`).

One command from a machine signed in with `az login`:

```sh
./scripts/deploy-azure.sh
```

Override `APP_NAME`, `RESOURCE_GROUP`, or `LOCATION` (default `westus2`) with environment variables. The script creates or reuses the app, uploads `dist/`, and prints the live URL.

For automatic redeploys on every push to `dahmani-preview`, copy the app's deployment token (`az staticwebapp secrets list --name <app> --query properties.apiKey -o tsv`) into the repository secret `AZURE_STATIC_WEB_APPS_API_TOKEN`. `.github/workflows/azure-static-web-app.yml` then builds and deploys; without the secret it skips the deploy step.

## Review hosting

The self-contained preview is rendered by the GitHub HTML Preview viewer from this public branch. A commit-pinned URL keeps all assets on the same version:

`https://htmlpreview.github.io/?https://raw.githubusercontent.com/Sid-ah/sampleproject/COMMIT_SHA/preview.html`

`npm run build` generates `preview.html` with embedded scripts, styles, the self-hosted Inter font, and optimized WebP imagery, so review hosting does not depend on separate asset requests. The editable source remains in `index.html`, `styles.css`, and `src/app.js`.

This is third-party review hosting, not production dealership hosting. No backend, lead storage, credit application, or analytics is configured. Contact buttons open phone/email apps; feedback opens an email draft.

No login or payment information is needed. The previous raw.githack.com host was replaced after a reported access failure. Creating a dedicated Pages site is blocked by the session's GitHub permissions; no existing repository homepage has been modified.

## Source and limitations

`assets/manifest.json` records original image URLs and descriptions recovered from https://dahmaniautomotive.com/ on October 30, 2026. Selected inventory prices, years, and odometer readings are a snapshot of that page, not live stock. Confirm all details directly with the business. Showroom imagery was already present on the original site; it is not proof of actual dealership premises or vehicle condition.

`assets/galleries/manifest.json` records every image recovered from the six original vehicle detail pages on October 31, 2026: Elantra 8, Prius 8, Highlander 10, Camry 5, Impreza 8, and Malibu 8 (47 photos total). Galleries preserve the original order, offer thumbnails/arrows/keyboard/swipe navigation, and show the full image without cropping. To refresh imagery in an environment with access to the source site, run `node scripts/recover-galleries.mjs` and rebuild; this is not done on every deploy.

The primary 360-style experience now uses those original photographs. Dragging changes photos and adds a modest perspective effect; **it is a simulation, not a continuous 360-degree camera scan**. Interiors and close-ups remain in their original gallery sequence. It cannot reconstruct unseen surfaces. A separate clearly identified 3D concept model remains available.

The original logo is preserved in `assets/original-00.png` and reused in the interface. Colors, illustration, and copy are proposed design directions.

## Brand, loading, and reviews

The original logo is used in the header, footer, and animated welcome. The build trims the black margins of the recovered image and converts its black background to transparency (`assets/original-logo.webp`) without redrawing the mark, so it sits cleanly on dark surfaces. Typography is Inter, self-hosted from `assets/fonts/` (SIL Open Font License, see `INTER-LICENSE.txt`); there are no third-party font requests. The palette is near-black ink `#0f1216`, light neutral surfaces `#f5f6f7`, and the brand red `#d62836`.

The page has one stylesheet (`styles.css`). The Google Map is a click-to-load facade, so no Google request is made until a visitor asks for it. On phones, a Call/Directions/Sell action bar appears after the first screen.

The splash appears once per tab session, warms up essential image decoding, and leaves after at most about 2.7 seconds. Reduced-motion visitors skip it. The page remains available if JavaScript or session storage is disabled.

The dedicated customer reviews section replaces the floating banner. Its horizontally scrolling cards support native touch scrolling, keyboard arrows, and previous/next buttons (shown only when the cards overflow) without automatic motion. It links to the business listing supplied by the owner via its direct Google Maps URL. The public browser view showed a **5.0 rating**, verified October 31, 2026. `assets/reviews-source.json` records its provenance. This is a clearly dated snapshot, not a live feed.

Customer quotations are not yet available: Google's public view did not expose review text or counts, and its “See more” flow asked for sign-in. The section shows the rating and a call to read the reviews on Google rather than invented testimonials. To display quotes, add approved genuine excerpts to `reviewExcerpts` in `assets/reviews-source.json`, each with `quote`, `author`, and `sourceUrl`, then rebuild. The build requires all three fields and renders attributed quote cards linked to their source. Alternatively configure an authorized Google Places integration under its current display/storage terms.

## Seller requests and cash-only transactions

Public Google links use the verified direct business URL (`https://www.google.com/maps?cid=1306977105441264595`) and the Google Maps directions API URL, rather than `maps.app.goo.gl` app redirects. Original short links remain only in provenance records.

“Submit a sale request online” opens the original dealership's `/sell` form, whose page and POST form were verified without submitting test leads. The preview's local form offers an alternative: it validates the vehicle and contact details and prepares a `mailto:` request to `sales@dahmaniautomotive.com`. The visitor must open their email app and press Send; a clipboard alternative and phone contact are available. It never shows a delivered-success message, sends data to third-party lead services, or stores seller information in browser storage. Production inline submissions would require an authorized backend.

## SEO and production launch

`site.html` and `dist/index.html` are the direct-hosting builds. It includes static inventory markup, a local-search title and description, canonical URL, social cards, AutoDealer JSON-LD, descriptive image text, intrinsic image dimensions, and semantic business contact details. `preview.html` omits JSON-LD because the third-party viewer incorrectly executes JSON data scripts.

Both builds deliberately retain `noindex, follow`: the review concept must not compete with the real dealership or index stale stock. On an authorized production launch, deploy `site.html` as `index.html` on the real domain, verify current business details and stock, remove the preview noindex directive, publish a sitemap, and register it in Search Console. Metadata in a third-party viewer does not optimize the existing live website. No self-serving review stars or unsupported inventory offers are added to structured data.

## Capturing real 360-degree media

For exterior spins, use a tripod-mounted phone or camera and capture 36–72 evenly spaced views around a stationary vehicle. Keep focal length, distance, height, exposure, and lighting consistent. Keep the whole car in every frame; number files in rotation order and group them by vehicle.

For interiors, use a true 360-degree camera on a slim monopod or support inside the cabin. Export full-resolution stitched 2:1 equirectangular images, not reframed screenshots or standard phone panoramas. Move people out of the scene and remove personal information before capturing. Exterior sequences and interior panoramas are separate formats; neither can be reconstructed truthfully from a single standard photograph.
