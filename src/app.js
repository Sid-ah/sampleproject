import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const $ = (selector) => document.querySelector(selector);
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const vehicles = [
  { id: 'elantra', name: 'Hyundai Elantra', year: 2012, type: 'sedan', price: 3900, miles: '110,250', tag: 'THE EVERYDAY UPGRADE', fuel: 'Gasoline', image: 'assets/original-02.jpg' },
  { id: 'prius', name: 'Toyota Prius', year: 2012, type: 'hybrid', price: 7900, miles: '121,453', tag: 'GO A LITTLE FURTHER', fuel: 'Hybrid', image: 'assets/original-03.jpg' },
  { id: 'highlander', name: 'Toyota Highlander', year: 2013, type: 'suv', price: 11800, miles: '147,250', tag: 'ROOM FOR WHAT’S NEXT', fuel: 'Gasoline', image: 'assets/original-11.jpg' },
  { id: 'camry', name: 'Toyota Camry', year: 2010, type: 'sedan', price: 4995, miles: '174,250', tag: 'A CLASSIC FOR A REASON', fuel: 'Gasoline', image: 'assets/original-07.jpg' },
  { id: 'impreza', name: 'Subaru Impreza', year: 2013, type: 'sedan', price: 8495, miles: '79,250', tag: 'TAKE THE SCENIC ROUTE', fuel: 'Gasoline', image: 'assets/original-10.jpg' },
  { id: 'malibu', name: 'Chevrolet Malibu', year: 2016, type: 'sedan', price: 4900, miles: '154,080', tag: 'MAKE YOURSELF AT HOME', fuel: 'Gasoline', image: 'assets/original-04.jpg' },
];
vehicles.forEach((vehicle) => { vehicle.imageAlt = `${vehicle.year} ${vehicle.name} — image from the original dealership website`; });
let filter = 'all';
let saved;
try { saved = new Set(JSON.parse(localStorage.getItem('dahmani-saved') || '[]')); }
catch (error) { saved = new Set(); console.warn('Saved vehicles could not be restored.', error); }
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

function renderVehicles() {
  const list = vehicles.filter((vehicle) => filter === 'all' || vehicle.type === filter);
  if ($('#sort').value === 'price-low') list.sort((a, b) => a.price - b.price);
  if ($('#sort').value === 'price-high') list.sort((a, b) => b.price - a.price);
  $('#vehicle-grid').innerHTML = list.map((vehicle) => `<article class="vehicle-card" data-id="${vehicle.id}">
    <button class="save-car" aria-label="Save ${vehicle.name}" aria-pressed="${saved.has(vehicle.id)}" data-save="${vehicle.id}">${saved.has(vehicle.id) ? '♥' : '♡'}</button>
    <button class="vehicle-image" data-detail="${vehicle.id}" aria-label="View ${vehicle.name} details"><img src="${escape(vehicle.image)}" alt="${escape(vehicle.imageAlt || 'Original illustration — not a photo of this vehicle')}" loading="lazy"><span class="vehicle-tag">${vehicle.tag}</span></button>
    <div class="vehicle-title-row"><h3>${vehicle.name}</h3><span>${money(vehicle.price)}</span></div><p class="vehicle-meta">${vehicle.year} &nbsp;·&nbsp; ${vehicle.miles} mi &nbsp;·&nbsp; ${vehicle.fuel}</p>
    <div class="vehicle-card-bottom"><span>Website snapshot</span><button data-detail="${vehicle.id}">Take a closer look &nbsp;↗</button></div></article>`).join('');
}
renderVehicles();
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
function showVehicle(id) {
  const vehicle = vehicles.find((entry) => entry.id === id);
  $('#vehicle-detail').innerHTML = `<img class="detail-image" src="${escape(vehicle.image)}" alt="${escape(vehicle.imageAlt)}"><div class="detail-copy"><p class="eyebrow muted">YOUR NEXT CHAPTER?</p><h2>${vehicle.year} ${vehicle.name}</h2><p>Listed price ${money(vehicle.price)} · Confirm current availability with the dealership.</p><div class="detail-specs"><span>MILEAGE<strong>${vehicle.miles} mi</strong></span><span>CATEGORY<strong>${vehicle.type === 'suv' ? 'SUV' : vehicle.type === 'hybrid' ? 'Hybrid' : 'Sedan'}</strong></span><span>FUEL TYPE<strong>${vehicle.fuel}</strong></span></div><div class="detail-actions"><a class="button button-dark" href="tel:+14086037148">Ask about this model ↗</a><a class="button" href="mailto:sales@dahmaniautomotive.com?subject=${encodeURIComponent(`Enquiry: ${vehicle.year} ${vehicle.name} (website concept)`)}">Arrange a visit ↗</a></div><p class="detail-notice">Listing and image recovered from dahmaniautomotive.com on October 30, 2026. This is a static design preview, not live inventory. Availability, condition, final price, taxes, and fees must be confirmed with the dealership.</p></div>`;
  openDialog($('#vehicle-dialog'));
}
$('.menu-button').addEventListener('click', () => {
  const open = $('.header nav').classList.toggle('open');
  $('.menu-button').setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.header nav a').forEach((link) => link.addEventListener('click', () => {
  $('.header nav').classList.remove('open');
  $('.menu-button').setAttribute('aria-expanded', 'false');
}));
function updatePayment() {
  const price = Number($('#price').value);
  $('#down').max = price;
  const down = Math.min(Number($('#down').value), price);
  $('#down').value = down;
  const aprField = $('#apr');
  if (!aprField.checkValidity() || aprField.value === '') {
    $('#monthly-payment').textContent = 'Enter APR';
    return;
  }
  const principal = price - down;
  const rate = Number(aprField.value) / 1200;
  const months = Number($('#term').value);
  const payment = rate === 0 ? principal / months : principal * rate / (1 - (1 + rate) ** -months);
  $('#price-output').textContent = money(price);
  $('#down-output').textContent = money(down);
  $('#monthly-payment').innerHTML = `${money(payment)}<small>/mo</small>`;
}
['price', 'down', 'term', 'apr'].forEach((id) => $(`#${id}`).addEventListener('input', updatePayment));
updatePayment();
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
  const paint = new THREE.MeshPhysicalMaterial({ color: '#416759', metalness: .65, roughness: .25, clearcoat: 1 });
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
  renderer.setClearColor('#e8e9df'); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.3;
  container.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#e8e9df', 15, 30);
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
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#e8e9df', roughness: .85 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, .04, 100), new THREE.MeshStandardMaterial({ color: '#d8decd', roughness: .7 }));
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
document.querySelectorAll('[data-showroom]').forEach((button) => button.addEventListener('click', () => {
  openDialog($('#showroom-dialog'));
  try { if (!showroom) createShowroom(); if (animation === null) animateShowroom(); }
  catch (error) { console.error('The 3D showroom could not be started.', error); $('#showroom-error').textContent = 'The interactive showroom needs WebGL. Try a browser with hardware acceleration enabled. You can still browse all vehicle photography in the collection.'; }
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
