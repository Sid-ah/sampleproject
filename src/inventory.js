export const vehicles = [
  { id: 'elantra', name: 'Hyundai Elantra', year: 2012, type: 'sedan', price: 3900, miles: '110,250', tag: 'THE EVERYDAY UPGRADE', fuel: 'Gasoline', image: 'assets/original-02.jpg' },
  { id: 'prius', name: 'Toyota Prius', year: 2012, type: 'hybrid', price: 7900, miles: '121,453', tag: 'GO A LITTLE FURTHER', fuel: 'Hybrid', image: 'assets/original-03.jpg' },
  { id: 'highlander', name: 'Toyota Highlander', year: 2013, type: 'suv', price: 11800, miles: '147,250', tag: 'ROOM FOR WHAT’S NEXT', fuel: 'Gasoline', image: 'assets/original-11.jpg' },
  { id: 'camry', name: 'Toyota Camry', year: 2010, type: 'sedan', price: 4995, miles: '174,250', tag: 'A CLASSIC FOR A REASON', fuel: 'Gasoline', image: 'assets/original-07.jpg' },
  { id: 'impreza', name: 'Subaru Impreza', year: 2013, type: 'sedan', price: 8495, miles: '79,250', tag: 'TAKE THE SCENIC ROUTE', fuel: 'Gasoline', image: 'assets/original-10.jpg' },
  { id: 'malibu', name: 'Chevrolet Malibu', year: 2016, type: 'sedan', price: 4900, miles: '154,080', tag: 'MAKE YOURSELF AT HOME', fuel: 'Gasoline', image: 'assets/original-04.jpg' },
];
vehicles.forEach((vehicle) => { vehicle.imageAlt = `${vehicle.year} ${vehicle.name} — image from the original dealership website`; });
export const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
export const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export function vehicleCards(list, saved = new Set()) {
  return list.map((vehicle) => `<article class="vehicle-card" data-id="${vehicle.id}">
    <button class="save-car" aria-label="Save ${vehicle.name}" aria-pressed="${saved.has(vehicle.id)}" data-save="${vehicle.id}">${saved.has(vehicle.id) ? '♥' : '♡'}</button>
    <button class="vehicle-image" data-detail="${vehicle.id}" aria-label="View ${vehicle.name} details"><img src="${escape(vehicle.image)}" alt="${escape(vehicle.imageAlt)}" width="640" height="440" loading="lazy" decoding="async"><span class="vehicle-tag">${vehicle.tag}</span></button>
    <div class="vehicle-title-row"><h3>${vehicle.name}</h3><span>${money(vehicle.price)}</span></div><p class="vehicle-meta">${vehicle.year} &nbsp;·&nbsp; ${vehicle.miles} mi &nbsp;·&nbsp; ${vehicle.fuel}</p>
    <div class="vehicle-card-bottom"><span>Website snapshot</span><button data-detail="${vehicle.id}">Take a closer look &nbsp;↗</button></div></article>`).join('');
}
