import { vehicles, vehicleCards, typeLabels, money, escape } from './inventory.js';

const $ = (selector) => document.querySelector(selector);
for (const vehicle of vehicles) {
  const image = $(`.vehicle-card[data-id="${vehicle.id}"] img`);
  if (image) vehicle.image = image.getAttribute('src');
  vehicle.images = [...document.querySelectorAll(`#gallery-${vehicle.id} [data-gallery-photo]`)].map((image) => ({ src: image.hasAttribute('data-use-card') ? vehicle.image : image.getAttribute('src'), alt: image.getAttribute('data-alt') || image.alt }));
  if (!vehicle.images.length) vehicle.images = [{ src: vehicle.image, alt: vehicle.imageAlt }];
}
let THREE;
let OrbitControls;
let filter = 'all';
let saved;
try { saved = new Set(JSON.parse(localStorage.getItem('dahmani-saved') || '[]')); }
catch (error) { saved = new Set(); console.warn('Saved vehicles could not be restored.', error); }

function renderVehicles() {
  const list = vehicles.filter((vehicle) => filter === 'all' || vehicle.type === filter);
  if ($('#sort').value === 'price-low') list.sort((a, b) => a.price - b.price);
  if ($('#sort').value === 'price-high') list.sort((a, b) => b.price - a.price);
  $('#vehicle-grid').innerHTML = vehicleCards(list, saved);
}
renderVehicles();
async function showFirstVisitSplash() {
  const splash = $('#brand-splash');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try { if (sessionStorage.getItem('dahmani-welcome')) return; }
  catch (error) { console.warn('First-visit splash preference could not be read.', error); }
  splash.hidden = false;
  const finish = () => {
    splash.classList.add('splash-leaving');
    setTimeout(() => { splash.hidden = true; }, 450);
    try { sessionStorage.setItem('dahmani-welcome', '1'); }
    catch (error) { console.warn('First-visit splash preference could not be saved.', error); }
  };
  const start = performance.now();
  const essentialImages = [$('#hero-image'), $('.splash-logo'), ...document.querySelectorAll('.vehicle-image img')].slice(0, 5);
  const ready = Promise.allSettled(essentialImages.map((image) => image.decode())).then((results) => {
    results.forEach((result) => { if (result.status === 'rejected') console.warn('An initial dealership image could not be decoded.', result.reason); });
  });
  await Promise.race([ready, new Promise((resolve) => setTimeout(resolve, 2200))]);
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, 1100 - (performance.now() - start))));
  finish();
}
showFirstVisitSplash();
const reviewsTrack = $('#reviews-track');
function scrollReviews(direction) {
  const card = reviewsTrack.querySelector('article');
  reviewsTrack.scrollBy({ left: direction * (card.getBoundingClientRect().width + 20), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}
const reviewControls = $('.reviews-scroll-controls');
const updateReviewControls = () => { reviewControls.hidden = reviewsTrack.scrollWidth <= reviewsTrack.clientWidth + 1; };
updateReviewControls();
addEventListener('resize', updateReviewControls);
$('#reviews-previous').addEventListener('click', () => scrollReviews(-1));
$('#reviews-next').addEventListener('click', () => scrollReviews(1));
reviewsTrack.addEventListener('keydown', (event) => {
  if (event.target !== reviewsTrack) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); scrollReviews(event.key === 'ArrowRight' ? 1 : -1); }
});
document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach((tab) => tab.classList.toggle('active', tab === button));
  renderVehicles();
}));
$('#sort').addEventListener('change', renderVehicles);
$('#vehicle-grid').addEventListener('click', (event) => {
  const saveButton = event.target.closest('[data-save]');
  if (saveButton) {
    const id = saveButton.dataset.save;
    saved.has(id) ? saved.delete(id) : saved.add(id);
    try { localStorage.setItem('dahmani-saved', JSON.stringify([...saved])); }
    catch (error) { console.warn('Saved vehicles are available for this visit only.', error); }
    renderVehicles();
  }
  const details = event.target.closest('[data-detail]');
  if (details) showVehicle(details.dataset.detail);
});
function openDialog(dialog) {
  document.querySelectorAll('dialog[open]').forEach((open) => open.close());
  dialog.showModal();
  document.body.classList.add('modal-open');
}
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (dialog.id === 'showroom-dialog') stopShowroom();
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
});
let detailVehicle;
let detailIndex = 0;
function galleryThumbnails(vehicle, index, attribute) {
  return vehicle.images.map((image, position) => `<button ${attribute}="${position}" aria-label="View photo ${position + 1} of ${vehicle.name}" aria-pressed="${position === index}"><img src="${escape(image.src)}" alt="${escape(image.alt)}" width="82" height="59" loading="lazy"></button>`).join('');
}
function showVehicle(id) {
  const vehicle = vehicles.find((entry) => entry.id === id);
  detailVehicle = vehicle;
  detailIndex = 0;
  const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  $('#vehicle-detail').innerHTML = `<div class="detail-media"><div class="detail-gallery" tabindex="0" role="group" aria-label="Vehicle photo gallery. Use left and right arrow keys."><img class="detail-image" src="${escape(vehicle.images[0].src)}" alt="${escape(vehicle.images[0].alt)}"><button class="photo-arrow photo-prev" data-detail-step="-1" aria-label="Previous vehicle photo">${icon('left')}</button><button class="photo-arrow photo-next" data-detail-step="1" aria-label="Next vehicle photo">${icon('right')}</button><span class="gallery-position" aria-live="polite">1 / ${vehicle.images.length}</span></div><div class="gallery-thumbnails" aria-label="All vehicle photographs">${galleryThumbnails(vehicle, 0, 'data-detail-photo')}</div><p id="detail-image-error" class="photo-error" role="alert"></p></div><div class="detail-copy"><div><p class="eyebrow">${typeLabels[vehicle.type]} · ${vehicle.year}</p><h2>${vehicle.year} ${vehicle.name}</h2></div><p class="detail-price"><span>Cash price</span><strong>${money(vehicle.price)}</strong></p><div class="detail-specs"><span>Mileage<strong>${vehicle.miles} mi</strong></span><span>Category<strong>${typeLabels[vehicle.type]}</strong></span><span>Fuel<strong>${vehicle.fuel}</strong></span></div><div class="detail-actions"><a class="button button-primary button-large" href="tel:+14086037148">${icon('phone')}Ask about this car</a><a class="button button-ghost-dark" href="mailto:sales@dahmaniautomotive.com?subject=${encodeURIComponent(`Enquiry: ${vehicle.year} ${vehicle.name} (website concept)`)}">${icon('mail')}Email to arrange a visit</a><button class="button button-ghost-dark" data-photo-car="${vehicle.id}">${icon('photos')}Explore the photo viewer</button></div><p class="detail-notice">Original dealership listing snapshot. Complete gallery recovered October 31, 2026. This is a static preview, not live inventory. Availability, condition, final cash price, taxes, and fees must be confirmed with the dealership.</p></div>`;
  $('.detail-image').addEventListener('error', () => { $('#detail-image-error').textContent = 'This photograph could not be displayed. Select another view or contact the dealership.'; });
  attachPhotoDrag($('.detail-gallery'), () => $('.detail-image'), (direction) => setDetailPhoto(detailIndex + direction));
  openDialog($('#vehicle-dialog'));
}
function setDetailPhoto(index) {
  detailIndex = (index + detailVehicle.images.length) % detailVehicle.images.length;
  const photo = detailVehicle.images[detailIndex];
  $('.detail-image').src = photo.src;
  $('.detail-image').alt = photo.alt;
  $('#detail-image-error').textContent = '';
  $('.gallery-position').textContent = `${detailIndex + 1} / ${detailVehicle.images.length}`;
  document.querySelectorAll('[data-detail-photo]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.detailPhoto) === detailIndex)));
}
$('#vehicle-detail').addEventListener('click', (event) => {
  const thumbnail = event.target.closest('[data-detail-photo]');
  const step = event.target.closest('[data-detail-step]');
  const simulate = event.target.closest('[data-photo-car]');
  if (thumbnail) setDetailPhoto(Number(thumbnail.dataset.detailPhoto));
  if (step) setDetailPhoto(detailIndex + Number(step.dataset.detailStep));
  if (simulate) openPhotoExperience(simulate.dataset.photoCar);
});
$('#vehicle-dialog').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setDetailPhoto(detailIndex + (event.key === 'ArrowRight' ? 1 : -1)); }
});
let photoVehicle = vehicles[0];
let photoIndex = 0;
let simulated = true;
function setPhoto(index) {
  photoIndex = (index + photoVehicle.images.length) % photoVehicle.images.length;
  const photo = photoVehicle.images[photoIndex];
  $('#photo-main').src = photo.src;
  $('#photo-main').alt = photo.alt;
  $('#photo-main').style.transform = '';
  $('#photo-position').textContent = `Photo ${photoIndex + 1} of ${photoVehicle.images.length} · ${photoVehicle.year} ${photoVehicle.name}`;
  document.querySelectorAll('[data-explorer-photo]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.explorerPhoto) === photoIndex)));
}
function loadPhotoVehicle(id) {
  photoVehicle = vehicles.find((vehicle) => vehicle.id === id);
  $('#photo-title').textContent = `${photoVehicle.year} ${photoVehicle.name}`;
  $('#photo-vehicle').value = id;
  $('#photo-thumbnails').innerHTML = galleryThumbnails(photoVehicle, 0, 'data-explorer-photo');
  setPhoto(0);
}
function openPhotoExperience(id = vehicles[0].id, index = 0) {
  loadPhotoVehicle(id);
  if (index) setPhoto(index);
  openDialog($('#photo-dialog'));
}
const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let viewerVehicle = vehicles.find((vehicle) => vehicle.id === 'highlander');
let viewerIndex = 0;
function renderViewer() {
  $('#viewer-tabs').innerHTML = vehicles.map((vehicle) => `<button data-viewer-car="${vehicle.id}" aria-pressed="${vehicle.id === viewerVehicle.id}">${vehicle.year} ${vehicle.name.split(' ').slice(1).join(' ')}</button>`).join('');
  $('#viewer-title').textContent = `${viewerVehicle.year} ${viewerVehicle.name}`;
  $('#viewer-price').textContent = `${money(viewerVehicle.price)} cash price · ${viewerVehicle.miles} mi`;
  $('#viewer-thumbs').innerHTML = galleryThumbnails(viewerVehicle, viewerIndex, 'data-viewer-photo');
  setViewerPhoto(0);
}
function setViewerPhoto(index) {
  viewerIndex = (index + viewerVehicle.images.length) % viewerVehicle.images.length;
  const photo = viewerVehicle.images[viewerIndex];
  $('#viewer-image').loading = 'eager';
  $('#viewer-image').src = photo.src;
  $('#viewer-image').alt = photo.alt;
  $('#viewer-image').style.transform = '';
  $('#viewer-counter').textContent = `${viewerIndex + 1} / ${viewerVehicle.images.length}`;
  document.querySelectorAll('[data-viewer-photo]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.viewerPhoto) === viewerIndex)));
}
renderViewer();
$('#viewer-tabs').addEventListener('click', (event) => {
  const tab = event.target.closest('[data-viewer-car]');
  if (!tab) return;
  viewerVehicle = vehicles.find((vehicle) => vehicle.id === tab.dataset.viewerCar);
  viewerIndex = 0;
  renderViewer();
  $('#viewer-tabs [aria-pressed="true"]').focus();
});
$('#viewer-thumbs').addEventListener('click', (event) => {
  const thumbnail = event.target.closest('[data-viewer-photo]');
  if (thumbnail) setViewerPhoto(Number(thumbnail.dataset.viewerPhoto));
});
$('#viewer-prev').addEventListener('click', () => setViewerPhoto(viewerIndex - 1));
$('#viewer-next').addEventListener('click', () => setViewerPhoto(viewerIndex + 1));
$('#viewer-stage').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setViewerPhoto(viewerIndex + (event.key === 'ArrowRight' ? 1 : -1)); }
});
$('#viewer-details').addEventListener('click', () => showVehicle(viewerVehicle.id));
document.querySelectorAll('[data-photo-experience]').forEach((button) => button.addEventListener('click', () => openPhotoExperience(viewerVehicle.id, viewerIndex)));
$('#photo-vehicle').addEventListener('change', (event) => loadPhotoVehicle(event.target.value));
$('#photo-thumbnails').addEventListener('click', (event) => {
  const button = event.target.closest('[data-explorer-photo]');
  if (button) setPhoto(Number(button.dataset.explorerPhoto));
});
$('#photo-stage .photo-prev').addEventListener('click', () => setPhoto(photoIndex - 1));
$('#photo-stage .photo-next').addEventListener('click', () => setPhoto(photoIndex + 1));
$('#photo-stage').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1)); }
});
function setPhotoMode(simulate) {
  simulated = simulate;
  $('#photo-stage').classList.toggle('simulated', simulate);
  $('#photo-main').style.transform = '';
  $('#photo-flat').setAttribute('aria-pressed', String(!simulate));
  $('#photo-simulation').setAttribute('aria-pressed', String(simulate));
  $('.photo-mode-label').textContent = simulate ? 'PHOTO SIMULATION · NOT A CAMERA SCAN' : 'ORIGINAL PHOTO GALLERY';
}
$('#photo-flat').addEventListener('click', () => setPhotoMode(false));
$('#photo-simulation').addEventListener('click', () => setPhotoMode(true));
function attachPhotoDrag(stage, image, step) {
  let movement = null;
  stage.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button') || event.button !== 0) return;
    movement = { x: event.clientX, y: event.clientY };
    stage.classList.add('interacted');
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', (event) => {
    if (!movement) return;
    const distance = event.clientX - movement.x;
    if (((stage.id === 'photo-stage' && simulated) || stage.id === 'viewer-stage') && !prefersReducedMotion.matches) {
      image().style.transform = `rotateY(${Math.max(-12, Math.min(12, distance / 4))}deg) rotateX(${Math.max(-4, Math.min(4, (movement.y - event.clientY) / 10))}deg) scale(1.015)`;
    }
    if (Math.abs(distance) >= 65) { step(distance < 0 ? 1 : -1); movement.x = event.clientX; }
  });
  const end = () => { movement = null; image().style.transform = ''; };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
}
attachPhotoDrag($('#photo-stage'), () => $('#photo-main'), (direction) => setPhoto(photoIndex + direction));
attachPhotoDrag($('#viewer-stage'), () => $('#viewer-image'), (direction) => setViewerPhoto(viewerIndex + direction));
$('#viewer-stage').addEventListener('keydown', () => $('#viewer-stage').classList.add('interacted'));
$('#photo-main').addEventListener('error', () => { $('#photo-position').textContent = 'This photo could not load. Choose another thumbnail or contact the dealership.'; });
$('.menu-button').addEventListener('click', () => {
  const open = $('.header nav').classList.toggle('open');
  $('.menu-button').setAttribute('aria-expanded', String(open));
  $('.menu-button').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
function closeNavigation() {
  $('.header nav').classList.remove('open');
  $('.menu-button').setAttribute('aria-expanded', 'false');
  $('.menu-button').setAttribute('aria-label', 'Open navigation');
}
document.querySelectorAll('.header nav a').forEach((link) => link.addEventListener('click', closeNavigation));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeNavigation(); });
const header = $('.header');
const updateHeader = () => {
  header.classList.toggle('scrolled', scrollY > 16);
  document.body.classList.toggle('past-hero', scrollY > 360);
};
updateHeader();
addEventListener('scroll', updateHeader, { passive: true });
$('#load-map').addEventListener('click', () => {
  const frame = document.createElement('iframe');
  frame.title = 'Map showing Dahmani Automotive at 3275 Stevens Creek Blvd, Santa Clara';
  frame.loading = 'lazy';
  frame.referrerPolicy = 'no-referrer-when-downgrade';
  frame.allowFullscreen = true;
  frame.src = 'https://www.google.com/maps?q=Dahmani+Automotive+LLC%2C+3275+Stevens+Creek+Blvd+%23135%2C+Santa+Clara%2C+CA+95050&output=embed';
  $('#map-frame').append(frame);
  $('.map-facade').hidden = true;
});
let saleRequest = '';
$('#sell-inputs').disabled = false;
$('#sell-form').addEventListener('input', (event) => {
  if (event.target instanceof HTMLInputElement) event.target.setCustomValidity('');
});
$('#sell-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  form.querySelectorAll('input[required]:not([type=checkbox])').forEach((input) => input.setCustomValidity(input.value.trim() ? '' : 'Please enter a value.'));
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const value = (name) => String(data.get(name) || '').trim();
  saleRequest = `Hello Dahmani Automotive,\n\nI would like to sell my vehicle.\n\nName: ${value('name')}\nEmail: ${value('email')}\nPhone: ${value('phone') || 'Not provided'}\nVehicle: ${value('year')} ${value('make')} ${value('model')}\nOdometer: ${value('mileage')} miles\nAsking price: ${value('askingPrice') ? `$${value('askingPrice')}` : 'Please discuss with me'}\n\nCondition and notes:\n${value('notes') || 'Not provided'}\n\nI agree to be contacted about this vehicle.`;
  $('#sell-email-link').href = `mailto:sales@dahmaniautomotive.com?subject=${encodeURIComponent(`Sell my car: ${value('year')} ${value('make')} ${value('model')}`)}&body=${encodeURIComponent(saleRequest)}`;
  $('#sell-email-link').hidden = false;
  $('#copy-sale-request').hidden = false;
  $('#sell-status').textContent = 'Your request is ready, but has not been sent. Open your email app below, review the details, and press Send. You can also copy the request and email it to sales@dahmaniautomotive.com.';
});
$('#copy-sale-request').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(saleRequest); $('#sell-status').textContent = 'Request copied. Paste it into an email to sales@dahmaniautomotive.com and press Send to submit.'; }
  catch (error) { console.warn('Sale request could not be copied.', error); $('#sell-status').textContent = 'Clipboard access is unavailable. Use the email link, or call (408) 603-7148 to discuss selling your car.'; }
});
$('#share-button').addEventListener('click', async () => {
  const url = location.href.split('#')[0];
  try {
    if (navigator.share) await navigator.share({ title: 'Dahmani Automotive — website concept', text: 'Take a look at this dealership website concept.', url });
    else { await navigator.clipboard.writeText(url); $('#share-status').textContent = 'Preview link copied. Ready to share.'; }
  } catch (error) {
    if (error.name !== 'AbortError') $('#share-status').textContent = `Copy this preview link: ${url}`;
  }
});
$('#feedback-link').href += `&body=${encodeURIComponent(`My feedback on the Dahmani website concept:\n${location.href.split('#')[0]}\n\nWhat I like:\n\nWhat I would change:\n`)}`;

let showroom = null;
let animation = null;
function stopShowroom() {
  if (animation !== null) { cancelAnimationFrame(animation); animation = null; }
}
function makeCar() {
  const group = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: '#56606e', metalness: .65, roughness: .25, clearcoat: 1 });
  const glass = new THREE.MeshPhysicalMaterial({ color: '#193039', metalness: .55, roughness: .12, clearcoat: 1 });
  const tire = new THREE.MeshStandardMaterial({ color: '#171c19', roughness: .85 });
  const chrome = new THREE.MeshStandardMaterial({ color: '#c4c9c4', metalness: .9, roughness: .22 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1b2923', roughness: .5 });
  function box(width, height, depth, material, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
  }
  const shape = new THREE.Shape();
  shape.moveTo(-2.2, .5); shape.lineTo(-2.22, .95); shape.quadraticCurveTo(-2.18, 1.1, -1.85, 1.13);
  shape.lineTo(-1.25, 1.16); shape.lineTo(-.64, 1.91); shape.quadraticCurveTo(-.57, 2.02, -.35, 2.02);
  shape.lineTo(.95, 2.02); shape.quadraticCurveTo(1.15, 2.01, 1.28, 1.81); shape.lineTo(1.75, 1.17);
  shape.lineTo(2.12, 1.08); shape.lineTo(2.2, .65); shape.quadraticCurveTo(2.2, .5, 2, .5); shape.closePath();
  const bodyGeometry = new THREE.ExtrudeGeometry(shape, { depth: 1.65, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: .09, bevelThickness: .06, curveSegments: 12 });
  bodyGeometry.translate(0, 0, -.825);
  const body = new THREE.Mesh(bodyGeometry, paint); body.castShadow = true; body.receiveShadow = true; group.add(body);
  function sideWindow(points, z) {
    const windowShape = new THREE.Shape(); points.forEach(([x, y], i) => i ? windowShape.lineTo(x, y) : windowShape.moveTo(x, y)); windowShape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(windowShape), glass); mesh.position.z = z; if (z < 0) mesh.rotation.y = Math.PI;
    if (z < 0) { const positions = mesh.geometry.attributes.position; for (let i = 0; i < positions.count; i++) positions.setX(i, -positions.getX(i)); positions.needsUpdate = true; }
    group.add(mesh);
  }
  for (const z of [-.923, .923]) {
    sideWindow([[-1.11, 1.23], [-.56, 1.91], [-.06, 1.91], [-.06, 1.23]], z);
    sideWindow([[.06, 1.23], [.06, 1.91], [.96, 1.91], [1.46, 1.23]], z);
    box(.27, .045, .035, chrome, -.42, 1.1, z);
    box(.27, .045, .035, chrome, .88, 1.1, z);
    box(3.9, .1, .045, dark, 0, .63, z);
    box(.27, .13, .2, paint, -.95, 1.3, z > 0 ? 1 : -1);
    for (const x of [-1.4, 1.4]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.47, .47, .27, 48), tire);
      wheel.rotation.x = Math.PI / 2; wheel.position.set(x, .48, z); wheel.castShadow = true; group.add(wheel);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .29, 32), chrome);
      rim.rotation.x = Math.PI / 2; rim.position.copy(wheel.position); group.add(rim);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(.095, .095, .31, 24), dark);
      hub.rotation.x = Math.PI / 2; hub.position.copy(wheel.position); group.add(hub);
      for (let i = 0; i < 5; i++) {
        const spoke = box(.055, .53, .03, dark, x, .48, z > 0 ? 1.075 : -1.075); spoke.rotation.z = i * Math.PI / 5;
      }
    }
  }
  const windshield = box(.065, .91, 1.64, glass, -1.04, 1.6, 0); windshield.rotation.z = -.67;
  const rearWindow = box(.06, .83, 1.64, glass, 1.53, 1.6, 0); rearWindow.rotation.z = .6;
  box(.08, .3, 1.18, dark, -2.29, .77, 0);
  const headlight = new THREE.MeshStandardMaterial({ color: '#f6f2d9', emissive: '#e5e1bd', emissiveIntensity: .8 });
  const tailLight = new THREE.MeshStandardMaterial({ color: '#a62c20', emissive: '#a62c20', emissiveIntensity: .5 });
  for (const z of [-.62, .62]) { box(.07, .13, .36, headlight, -2.29, 1.02, z); box(.07, .17, .24, tailLight, 2.24, 1.02, z); }
  box(.08, .08, 1.7, chrome, -2.29, .58, 0);
  box(.1, .1, 1.7, dark, 2.23, .6, 0);
  return { group, paint };
}
function createShowroom() {
  const container = $('#showroom-canvas');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor('#e8eaed'); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  container.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#e8eaed', 15, 30);
  const camera = new THREE.PerspectiveCamera(36, container.clientWidth / container.clientHeight, .1, 100);
  camera.position.set(-6.5, 3.8, 6.7);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, .85, 0); controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 5; controls.maxDistance = 13;
  controls.maxPolarAngle = Math.PI / 2.05; controls.minPolarAngle = .35;
  controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches; controls.autoRotateSpeed = .65;
  scene.add(new THREE.HemisphereLight('#fffef3', '#768b70', 3));
  const key = new THREE.DirectionalLight('#fff9e6', 4); key.position.set(-4, 8, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6; key.shadow.normalBias = .025; scene.add(key);
  const rim = new THREE.DirectionalLight('#cbdedb', 2); rim.position.set(4, 4, -5); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#e8eaed', roughness: .85 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, .04, 100), new THREE.MeshStandardMaterial({ color: '#d8dde5', roughness: .7 }));
  platform.position.y = -.025; platform.receiveShadow = true; scene.add(platform);
  const car = makeCar(); scene.add(car.group);
  const resize = new ResizeObserver(() => {
    if (!container.clientWidth || !container.clientHeight) return;
    renderer.setSize(container.clientWidth, container.clientHeight); camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix();
  }); resize.observe(container);
  showroom = { renderer, camera, scene, controls, paint: car.paint };
  $('#auto-rotate').setAttribute('aria-pressed', String(controls.autoRotate));
  $('#auto-rotate').textContent = controls.autoRotate ? 'Pause rotation' : 'Auto rotate';
}
function animateShowroom() {
  showroom.controls.update(); showroom.renderer.render(showroom.scene, showroom.camera);
  animation = requestAnimationFrame(animateShowroom);
}
document.querySelectorAll('[data-showroom]').forEach((button) => button.addEventListener('click', async () => {
  openDialog($('#showroom-dialog'));
  $('#showroom-canvas').setAttribute('aria-busy', 'true');
  try {
    if (!THREE) {
      THREE = await import('./three-runtime.js');
      OrbitControls = THREE.OrbitControls;
    }
    if (!showroom) createShowroom();
    if ($('#showroom-dialog').open && animation === null) animateShowroom();
  }
  catch (error) { console.error('The 3D showroom could not be started.', error); $('#showroom-error').textContent = 'The interactive showroom needs WebGL. Try a browser with hardware acceleration enabled. You can still browse all vehicle photography in the collection.'; }
  finally { $('#showroom-canvas').setAttribute('aria-busy', 'false'); }
}));
document.querySelectorAll('[data-angle]').forEach((button) => button.addEventListener('click', () => {
  if (!showroom) return;
  const positions = { front: [-8, 2.4, .01], side: [0, 2.6, 9], rear: [8, 2.4, .01] };
  showroom.camera.position.set(...positions[button.dataset.angle]); showroom.controls.autoRotate = false;
  $('#auto-rotate').setAttribute('aria-pressed', 'false'); $('#auto-rotate').textContent = 'Auto rotate';
}));
$('#auto-rotate').addEventListener('click', () => {
  if (!showroom) return;
  showroom.controls.autoRotate = !showroom.controls.autoRotate;
  $('#auto-rotate').setAttribute('aria-pressed', String(showroom.controls.autoRotate));
  $('#auto-rotate').textContent = showroom.controls.autoRotate ? 'Pause rotation' : 'Auto rotate';
});
document.querySelectorAll('[data-color]').forEach((button) => button.addEventListener('click', () => { if (showroom) showroom.paint.color.set(button.dataset.color); }));
