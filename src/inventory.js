export const vehicles = [
  { id: 'elantra', name: 'Hyundai Elantra', year: 2012, type: 'sedan', price: 3900, miles: '110,250', photos: 8, focus: '50% 62%', fuel: 'Gasoline', image: 'assets/original-02.jpg' },
  { id: 'prius', name: 'Toyota Prius', year: 2012, type: 'hybrid', price: 7900, miles: '121,453', photos: 8, focus: '50% 62%', fuel: 'Hybrid', image: 'assets/original-03.jpg' },
  { id: 'highlander', name: 'Toyota Highlander', year: 2013, type: 'suv', price: 11800, miles: '147,250', photos: 10, focus: '50% 58%', fuel: 'Gasoline', image: 'assets/original-11.jpg' },
  { id: 'camry', name: 'Toyota Camry', year: 2010, type: 'sedan', price: 4995, miles: '174,250', photos: 5, focus: '50% 55%', fuel: 'Gasoline', image: 'assets/original-07.jpg' },
  { id: 'impreza', name: 'Subaru Impreza', year: 2013, type: 'sedan', price: 8495, miles: '79,250', photos: 8, focus: '50% 55%', fuel: 'Gasoline', image: 'assets/original-10.jpg' },
  { id: 'malibu', name: 'Chevrolet Malibu', year: 2016, type: 'sedan', price: 4900, miles: '154,080', photos: 8, focus: '50% 58%', fuel: 'Gasoline', image: 'assets/original-04.jpg' },
];
export const typeLabels = { sedan: 'Sedan', suv: 'SUV', hybrid: 'Hybrid' };
vehicles.forEach((vehicle) => { vehicle.imageAlt = `${vehicle.year} ${vehicle.name} — image from the original dealership website`; });
export const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
export const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export function vehicleCards(list, saved = new Set()) {
  return list.map((vehicle) => `<article class="vehicle-card" data-id="${vehicle.id}">
    <button class="save-car" aria-label="Save ${vehicle.name}" aria-pressed="${saved.has(vehicle.id)}" data-save="${vehicle.id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg></button>
    <button class="vehicle-image" data-detail="${vehicle.id}" aria-label="View ${vehicle.year} ${vehicle.name} details and photos"><img src="${escape(vehicle.image)}" alt="${escape(vehicle.imageAlt)}" width="640" height="480" loading="lazy" decoding="async" style="object-position:${vehicle.focus}"><span class="vehicle-tag">${typeLabels[vehicle.type]}</span><span class="photo-count"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h2.2l1.3-2h6l1.3 2h2.2A1.5 1.5 0 0 1 20 7.5v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z"/><circle cx="12" cy="12.5" r="3.5"/></svg>${vehicle.photos} photos</span></button>
    <div class="vehicle-body">
      <div class="vehicle-title-row"><h3>${vehicle.name}</h3><p class="vehicle-price"><span>Cash price</span><strong>${money(vehicle.price)}</strong></p></div>
      <ul class="vehicle-specs" aria-label="Vehicle specifications"><li>${vehicle.year}</li><li>${vehicle.miles} mi</li><li>${vehicle.fuel}</li></ul>
      <button class="vehicle-cta" data-detail="${vehicle.id}">View details &amp; photos <span aria-hidden="true">→</span></button>
    </div></article>`).join('');
}
