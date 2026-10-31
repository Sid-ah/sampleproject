# Dahmani Automotive review concept

A responsive static redesign concept with recovered dealership imagery, an inventory snapshot, saved vehicles, payment estimator, contact links, sharing, and an interactive Three.js car showroom.

The original dealership website and existing repository default branch are not changed. This project lives only on the `dahmani-preview` branch.

## Run

```sh
npm ci
npm run build
npm start
```

Open http://localhost:4173. Run `npm test` for desktop/mobile browser checks. Set `PREVIEW_URL` to test a hosted deployment instead.

## Review hosting

The preview is served through raw.githack.com from this public branch. A commit-pinned URL keeps all assets on the same version:

`https://raw.githack.com/Sid-ah/sampleproject/COMMIT_SHA/preview.html`

`npm run build` generates `preview.html` with embedded scripts, styles, and optimized WebP imagery, so review hosting does not depend on separate asset requests. The editable source remains in `index.html`, `style.css`, and `src/app.js`.

This is third-party review hosting, not production dealership hosting. No backend, lead storage, credit application, or analytics is configured. Contact buttons open phone/email apps; feedback opens an email draft.

The host may display a safety confirmation first; choose **Open the page** to view the concept. No login or payment information is needed.

## Source and limitations

`assets/manifest.json` records original image URLs and descriptions recovered from https://dahmaniautomotive.com/ on October 30, 2026. Selected inventory prices, years, and odometer readings are a snapshot of that page, not live stock. Confirm all details directly with the business. Showroom imagery was already present on the original site; it is not proof of actual dealership premises or vehicle condition.

The 360-degree experience is an original, interactive 3D concept model with orbit, zoom, viewpoints, and paint selection. It is **not** a photographic vehicle spin, live camera, or interior panorama. Real exterior spins require ordered multi-angle photography; interior tours need equirectangular 360-degree captures. Existing single-view photos cannot truthfully reconstruct unseen surfaces.

The wordmark treatment, colors, illustration, and copy are proposed design directions. The original logo is preserved in `assets/original-00.png`.
