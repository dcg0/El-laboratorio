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

function updateSidcButtonColor() {
  const button = document.querySelector('.sidc-cta');
  if (!button) return;

  const hour = new Date().getHours();
  const periods = hour >= 6 && hour < 12
    ? { name: 'mañana', color: '#ffffff', glow: '#ffffff66' }
    : hour >= 12 && hour < 18
      ? { name: 'día', color: '#16d4ff', glow: '#16d4ff66' }
      : hour >= 18 && hour < 22
        ? { name: 'tarde', color: '#16d4ff', glow: '#16d4ff66' }
        : { name: 'noche', color: '#b58cff', glow: '#b58cff66' };

  button.style.setProperty('--cta-color', periods.color);
  button.style.setProperty('--cta-glow', periods.glow);
  button.dataset.timePeriod = periods.name;
}

updateSidcButtonColor();
setInterval(updateSidcButtonColor, 60 * 1000);

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
  const designFee = round10((subtotal + labor + contingency + travelAndContingency + finalContingency) * 0.09);
  const total = subtotal + labor + contingency + travelAndContingency + finalContingency + designFee;
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
    ['10% final por imprevistos, viáticos, consultas y gastos adicionales', finalContingency],
    ['Diseño integral de todo el proyecto · 9%', designFee]
  ].map(([label, value]) => `<li><span>${label}</span><strong>${value ? money.format(value) : '—'}</strong></li>`).join('');
  $('#quote-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const sketchCanvas = $('#project-sketch');
const sketchContext = sketchCanvas?.getContext('2d');
const undoSketchButton = $('#undo-sketch');
const clearSketchButton = $('#clear-sketch');
const sendSketchButton = $('#send-sketch');
let sketchHistory = [];
let sketchDrawing = false;

function paintSketchPaper() {
  const rect = sketchCanvas.getBoundingClientRect();
  sketchContext.fillStyle = '#ffffff';
  sketchContext.fillRect(0, 0, rect.width, rect.height);
  sketchContext.strokeStyle = '#172536';
  sketchContext.lineWidth = 3;
  sketchContext.lineCap = 'round';
  sketchContext.lineJoin = 'round';
}

function resizeSketchCanvas() {
  if (!sketchCanvas || !sketchContext) return;
  const snapshot = sketchCanvas.width ? sketchCanvas.toDataURL() : null;
  const rect = sketchCanvas.getBoundingClientRect();
  const ratio = Math.max(window.devicePixelRatio || 1, 1);
  sketchCanvas.width = Math.round(rect.width * ratio);
  sketchCanvas.height = Math.round(rect.height * ratio);
  sketchContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  paintSketchPaper();
  if (snapshot) {
    const image = new Image();
    image.onload = () => sketchContext.drawImage(image, 0, 0, rect.width, rect.height);
    image.src = snapshot;
  }
}

function sketchPoint(event) {
  const rect = sketchCanvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function saveSketchState() {
  sketchHistory.push(sketchCanvas.toDataURL());
  if (sketchHistory.length > 20) sketchHistory.shift();
}

function restoreSketchState(dataUrl) {
  const rect = sketchCanvas.getBoundingClientRect();
  const image = new Image();
  image.onload = () => {
    paintSketchPaper();
    sketchContext.drawImage(image, 0, 0, rect.width, rect.height);
  };
  image.src = dataUrl;
}

if (sketchCanvas && sketchContext) {
  resizeSketchCanvas();
  window.addEventListener('resize', resizeSketchCanvas);
  sketchCanvas.addEventListener('pointerdown', (event) => {
    saveSketchState();
    sketchDrawing = true;
    sketchCanvas.setPointerCapture(event.pointerId);
    const point = sketchPoint(event);
    sketchContext.beginPath();
    sketchContext.moveTo(point.x, point.y);
  });
  sketchCanvas.addEventListener('pointermove', (event) => {
    if (!sketchDrawing) return;
    const point = sketchPoint(event);
    sketchContext.lineTo(point.x, point.y);
    sketchContext.stroke();
  });
  const stopSketch = () => { sketchDrawing = false; sketchContext.closePath(); };
  sketchCanvas.addEventListener('pointerup', stopSketch);
  sketchCanvas.addEventListener('pointercancel', stopSketch);
  clearSketchButton.addEventListener('click', () => {
    saveSketchState();
    paintSketchPaper();
  });
  sendSketchButton.addEventListener('click', () => {
    sketchCanvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'boceto-proyecto-sidc.png', { type: 'image/png' });
      const message = 'Hola, envío el boceto de mi proyecto para solicitar una cotización.';
      const canShareFile = navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }));

      if (canShareFile) {
        try {
          await navigator.share({ title: 'Boceto de proyecto S.I.D.C.', text: message, files: [file] });
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
        }
      }

      const download = document.createElement('a');
      download.href = URL.createObjectURL(blob);
      download.download = 'boceto-proyecto-sidc.png';
      download.click();
      URL.revokeObjectURL(download.href);
      window.open(`https://wa.me/528116710029?text=${encodeURIComponent(`${message} Adjunta el archivo boceto-proyecto-sidc.png a este chat.`)}`, '_blank', 'noopener,noreferrer');
    }, 'image/png');
  });
  undoSketchButton.addEventListener('click', () => {
    const previous = sketchHistory.pop();
    if (previous) restoreSketchState(previous);
  });
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
