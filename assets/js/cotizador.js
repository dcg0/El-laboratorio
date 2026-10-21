const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const $ = (selector) => document.querySelector(selector);
const form = $('#quote-form');
const materialSelect = $('#material');
const catalogStatus = $('#catalog-status');
let catalog;

const product = (id) => catalog.products.find((item) => item.id === id);
const ceil = (value) => Math.max(1, Math.ceil(value));
const round10 = (value) => Math.ceil(value / 10) * 10;
const categoryLabel = { tablero: 'tablero', madera: 'madera', aluminio: 'perfil de aluminio', metal: 'PTR', lamina: 'lámina' };

function fillMaterials() {
  const groups = { tablero: 'Tableros', madera: 'Madera', aluminio: 'Perfiles de aluminio', metal: 'PTR y metal', lamina: 'Lámina' };
  Object.entries(groups).forEach(([category, label]) => {
    const group = document.createElement('optgroup');
    group.label = label;
    catalog.products.filter((item) => item.category === category).forEach((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.name} — ${money.format(item.price)}`;
      group.appendChild(option);
    });
    materialSelect.appendChild(group);
  });
  catalogStatus.innerHTML = `Referencias internas de materiales y servicios · actualizadas ${catalog.checkedAt}.`;
}

function checkedItems(container, withQuantity = false) {
  return [...document.querySelectorAll(`${container} input[type="checkbox"]:checked`)].map((input) => {
    const item = product(input.value);
    const quantityInput = document.querySelector(`${container} .component-qty[data-component="${input.value}"]`);
    const quantity = withQuantity && quantityInput ? Math.max(1, Number(quantityInput.value) || 1) : 1;
    return item ? { item, quantity } : null;
  }).filter(Boolean);
}

function calculate(event) {
  event.preventDefault();
  const project = $('#project').value.trim();
  const projectType = $('#project-type').value;
  const componentDetails = $('#component-details').value.trim();
  const width = Number($('#width').value) / 100;
  const depth = Number($('#depth').value) / 100;
  const height = Number($('#height').value) / 100;
  const finish = $('#finish').value;
  const selected = product(materialSelect.value);
  if (!project || !selected || !width || !depth || !height) return;

  const area = width * depth;
  const waste = 1.12;
  const perimeter = 2 * (width + depth);
  let mainUnits;
  let mainLabel;
  if (selected.calculation === 'panel') {
    mainUnits = ceil((area * waste) / selected.areaM2);
    mainLabel = `${mainUnits} ${selected.unit}(es) de ${categoryLabel[selected.category] || selected.category}`;
  } else {
    const linearMeters = ((perimeter + (4 * height)) * waste);
    mainUnits = ceil(linearMeters / selected.lengthM);
    mainLabel = `${mainUnits} ${selected.unit}(es) de ${categoryLabel[selected.category] || selected.category} · ${Math.ceil(linearMeters * 10) / 10} m lineales`;
  }
  const mainTotal = mainUnits * selected.price;
  const screws = product('screws-100');
  const glue = product('glue-1kg');
  const paint = product('paint-1l');
  const screwUnits = ceil((perimeter * 10 + 16) / 100);
  const glueUnits = finish === 'natural' ? ceil(mainUnits / 2) : Math.max(1, ceil(mainUnits / 3));
  const paintUnits = finish === 'paint' ? ceil((2 * area + (4 * height * 0.15)) / 4) : 0;
  const hardwareTotal = screwUnits * screws.price + glueUnits * glue.price + paintUnits * paint.price;
  const components = checkedItems('#components', true);
  const tools = checkedItems('#tools');
  const services = checkedItems('#extras');
  const componentsTotal = components.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);
  const toolsTotal = tools.reduce((sum, entry) => sum + entry.item.price, 0);
  const servicesTotal = services.reduce((sum, entry) => sum + entry.item.price, 0);
  const subtotal = mainTotal + hardwareTotal + componentsTotal + toolsTotal + servicesTotal;
  const labor = round10(subtotal * 0.49);
  const contingency = round10((subtotal + labor) * 0.10);
  const travelAndContingency = 200;
  const finalContingency = round10((subtotal + labor + contingency + travelAndContingency) * 0.10);
  const total = subtotal + labor + contingency + travelAndContingency + finalContingency;
  const projectTitle = project.length > 52 ? `${project.slice(0, 52)}…` : project;

  $('#quote-empty').hidden = true;
  $('#quote-result').hidden = false;
  $('#quote-total').textContent = money.format(total);
  $('#quote-range').textContent = `${money.format(total * 0.9)} – ${money.format(total * 1.1)}`;
  $('#quote-meta').textContent = projectTitle;
  $('#quote-materials').innerHTML = [
    [`Tipo de proyecto · ${projectType}`, 0],
    [`Medidas · ${Math.round(width * 100)} × ${Math.round(depth * 100)} × ${Math.round(height * 100)} cm`, 0],
    [mainLabel, mainTotal],
    [`${screwUnits} paquete(s) de fijaciones`, screwUnits * screws.price],
    [`${glueUnits} envase(s) de adhesivo`, glueUnits * glue.price],
    ...(paintUnits ? [[`${paintUnits} lata(s) de acabado`, paintUnits * paint.price]] : []),
    ...components.map(({ item, quantity }) => [`${quantity} × ${item.name}`, item.price * quantity]),
    ...tools.map(({ item }) => [item.name, item.price]),
    ...services.map(({ item }) => [item.name, item.price]),
    ...(componentDetails ? [['Especificaciones recibidas', 0]] : []),
    ['Mano de obra estimada · 49%', labor],
    ['Margen de desperdicio y variación · 10%', contingency],
    ['Viáticos, imprevistos y gastos operativos', travelAndContingency],
    ['10% final por imprevistos, viáticos, consultas y gastos adicionales', finalContingency]
  ].map(([label, value]) => `<li><span>${label}</span><strong>${value ? money.format(value) : '—'}</strong></li>`).join('');
  $('#quote-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadCatalog() {
  try {
    const response = await fetch('assets/data/ferreteria-monterrey.json');
    if (!response.ok) throw new Error('No se pudo cargar el catálogo');
    catalog = await response.json();
    fillMaterials();
  } catch (error) {
    catalogStatus.textContent = 'No se pudieron cargar las referencias. Vuelve a intentar.';
    form.querySelector('button[type="submit"]').disabled = true;
  }
}

form.addEventListener('submit', calculate);
$('#reset-form').addEventListener('click', () => {
  form.reset();
  document.querySelectorAll('#components input, #tools input, #extras input').forEach((input) => { input.checked = false; });
  $('#quote-result').hidden = true;
  $('#quote-empty').hidden = false;
});
loadCatalog();
