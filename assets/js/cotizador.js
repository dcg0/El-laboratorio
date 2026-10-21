const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const $ = (selector) => document.querySelector(selector);
const form = $('#quote-form');
const materialSelect = $('#material');
const catalogStatus = $('#catalog-status');
let catalog;

const product = (id) => catalog.products.find((item) => item.id === id);
const ceil = (value) => Math.max(1, Math.ceil(value));
const round10 = (value) => Math.ceil(value / 10) * 10;

function fillMaterials() {
  catalog.products.filter((item) => item.category === 'tablero' || item.category === 'madera').forEach((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.name} — ${money.format(item.price)}`;
    materialSelect.appendChild(option);
  });
  catalogStatus.innerHTML = `Catálogo cargado · <strong>${catalog.store}</strong> · actualizado ${catalog.checkedAt}.`;
}

function calculate(event) {
  event.preventDefault();
  const width = Number($('#width').value) / 100;
  const depth = Number($('#depth').value) / 100;
  const height = Number($('#height').value) / 100;
  const finish = $('#finish').value;
  const selected = product(materialSelect.value);
  if (!selected || !width || !depth || !height) return;

  const area = width * depth;
  const waste = 1.12;
  const isPanel = selected.category === 'tablero';
  const mainUnits = isPanel ? ceil((area * waste) / selected.areaM2) : ceil(((area / 0.101) * waste) / 2.44);
  const mainTotal = mainUnits * selected.price;
  const perimeter = 2 * (width + depth);
  const screwUnits = ceil((perimeter * 10 + 16) / 100);
  const screws = product('screws-100');
  const glueUnits = finish === 'natural' ? ceil(mainUnits / 2) : Math.max(1, ceil(mainUnits / 3));
  const glue = product('glue-1kg');
  const paint = product('paint-1l');
  const paintUnits = finish === 'paint' ? ceil((2 * area + (4 * height * 0.15)) / 4) : 0;
  const hardwareTotal = screwUnits * screws.price + glueUnits * glue.price + paintUnits * paint.price;
  const subtotal = mainTotal + hardwareTotal;
  const labor = round10(subtotal * 0.35);
  const contingency = round10((subtotal + labor) * 0.10);
  const total = subtotal + labor + contingency;
  const pieces = isPanel ? `${mainUnits} panel(es) · ${Math.round(area * 100) / 100} m² de cubierta` : `${mainUnits} polín(es) de 2.44 m · estructura y cubierta estimadas`;

  $('#quote-empty').hidden = true;
  $('#quote-result').hidden = false;
  $('#quote-total').textContent = money.format(total);
  $('#quote-range').textContent = `${money.format(total * 0.9)} – ${money.format(total * 1.1)}`;
  $('#quote-meta').textContent = `${Math.round(width * 100)} × ${Math.round(depth * 100)} × ${Math.round(height * 100)} cm · ${selected.name}`;
  $('#quote-materials').innerHTML = [
    [pieces, mainTotal],
    [`${screwUnits} paquete(s) de tornillos`, screwUnits * screws.price],
    [`${glueUnits} envase(s) de adhesivo`, glueUnits * glue.price],
    ...(paintUnits ? [[`${paintUnits} lata(s) de esmalte`, paintUnits * paint.price]] : []),
    ['Mano de obra estimada · 35%', labor],
    ['Margen de desperdicio y variación · 10%', contingency]
  ].map(([label, value]) => `<li><span>${label}</span><strong>${money.format(value)}</strong></li>`).join('');
  $('#quote-source').href = selected.url;
  $('#quote-source').textContent = `Ver precio de referencia · SKU ${selected.sku}`;
  $('#quote-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadCatalog() {
  try {
    const response = await fetch('assets/data/ferreteria-monterrey.json');
    if (!response.ok) throw new Error('No se pudo cargar el catálogo');
    catalog = await response.json();
    fillMaterials();
  } catch (error) {
    catalogStatus.textContent = 'No se pudo cargar el catálogo local. Revisa la conexión o vuelve a intentar.';
    form.querySelector('button[type="submit"]').disabled = true;
  }
}

form.addEventListener('submit', calculate);
$('#reset-form').addEventListener('click', () => {
  form.reset();
  $('#quote-result').hidden = true;
  $('#quote-empty').hidden = false;
});
loadCatalog();
