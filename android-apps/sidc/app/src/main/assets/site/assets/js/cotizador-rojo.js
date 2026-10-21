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
    ? { name: 'mañana', color: '#ffb020', glow: '#ffb02066' }
    : hour >= 12 && hour < 18
      ? { name: 'día', color: '#ff3b30', glow: '#ff3b3066' }
      : hour >= 18 && hour < 22
        ? { name: 'tarde', color: '#ff5a4f', glow: '#ff5a4f66' }
        : { name: 'noche', color: '#ff7b72', glow: '#ff7b7266' };

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
const downloadSketchButton = $('#download-sketch');
const sketchColorButtons = document.querySelectorAll('[data-sketch-color]');
const stickerTools = document.querySelectorAll('[data-sticker]');
const stickerLayer = $('#sketch-stickers');
const pngStickerInput = $('#png-sticker-input');
const sketchPaper = document.querySelector('.sketch-paper');
const toggleGrid = $('#toggle-grid');
const snapGrid = $('#snap-grid');
const gridSize = 20;
const builtInStickerImages = { rack: 'assets/sketch-pieces/rack.png', motor: 'assets/sketch-pieces/motor.png', alternador: 'assets/sketch-pieces/alternador.png', 'perfil-aluminio': 'assets/sketch-pieces/aluminio.png', madera: 'assets/sketch-pieces/madera.png', 'malla-metalica': 'assets/sketch-pieces/malla.png', lamina: 'assets/sketch-pieces/lamina.png', 'llantas-industriales': 'assets/sketch-pieces/llanta.png', resortes: 'assets/sketch-pieces/resorte.png', lamparas: 'assets/sketch-pieces/lampara.png', gabinetes: 'assets/sketch-pieces/gabinete.png' };
const builtInStickerSizes = { rack: ['100px', '170px'], motor: ['160px', '115px'], alternador: ['115px', '140px'], 'perfil-aluminio': ['120px', '122px'], madera: ['74px', '170px'], 'malla-metalica': ['140px', '124px'], lamina: ['110px', '135px'], 'llantas-industriales': ['95px', '120px'], resortes: ['75px', '170px'], lamparas: ['105px', '139px'], gabinetes: ['110px', '143px'] };
let sketchColor = '#111827';
let sketchHistory = [];
let sketchDrawing = false;

function paintSketchPaper() {
  const rect = sketchCanvas.getBoundingClientRect();
  sketchContext.fillStyle = '#ffffff';
  sketchContext.fillRect(0, 0, rect.width, rect.height);
  sketchContext.strokeStyle = sketchColor;
  sketchContext.globalCompositeOperation = 'source-over';
  sketchContext.lineWidth = 6;
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

function addSketchSticker(type, imageSource = null) {
  const resolvedImageSource = imageSource || builtInStickerImages[type] || null;
  const sticker = document.createElement('div');
  const count = stickerLayer.children.length;
  sticker.className = 'sketch-sticker';
  sticker.dataset.sticker = type;
  sticker.style.left = `${24 + (count % 5) * 110}px`;
  sticker.style.top = `${24 + Math.floor(count / 5) * 78}px`;
  const builtInSize = builtInStickerSizes[type];
  sticker.style.width = resolvedImageSource ? (builtInSize?.[0] || '150px') : (type === 'llantas-industriales' ? '92px' : '116px');
  sticker.style.height = resolvedImageSource ? (builtInSize?.[1] || '110px') : (type === 'llantas-industriales' ? '92px' : '58px');
  if (resolvedImageSource) {
    sticker.classList.add('image-sticker', 'uploaded-image');
    const image = document.createElement('img');
    image.src = resolvedImageSource;
    image.alt = type === 'rack' ? 'Rack insertado en el boceto' : 'PNG insertado en el boceto';
    sticker.appendChild(image);
  } else {
    sticker.textContent = type.replaceAll('-', ' ').toUpperCase();
  }

  const remove = document.createElement('button');
  remove.className = 'sticker-remove';
  remove.type = 'button';
  remove.setAttribute('aria-label', 'Quitar pieza');
  remove.textContent = '×';
  remove.addEventListener('pointerdown', (event) => event.stopPropagation());
  remove.addEventListener('click', () => sticker.remove());

  const rotate = document.createElement('button');
  rotate.className = 'sticker-rotate';
  rotate.type = 'button';
  rotate.setAttribute('aria-label', 'Rotar pieza');
  rotate.title = 'Rotar pieza 15°';
  rotate.textContent = '↻';
  let rotation = 0;
  rotate.addEventListener('pointerdown', (event) => event.stopPropagation());
  rotate.addEventListener('click', () => {
    rotation = (rotation + 15) % 360;
    sticker.dataset.rotation = rotation;
    sticker.style.transform = `rotate(${rotation}deg)`;
  });

  const resize = document.createElement('span');
  resize.className = 'sticker-resize';
  resize.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = sticker.offsetWidth;
    const startHeight = sticker.offsetHeight;
    const move = (moveEvent) => {
      const nextWidth = Math.max(55, startWidth + moveEvent.clientX - startX);
      const nextHeight = Math.max(38, startHeight + moveEvent.clientY - startY);
      sticker.style.width = `${snapGrid.checked ? Math.round(nextWidth / gridSize) * gridSize : nextWidth}px`;
      sticker.style.height = `${snapGrid.checked ? Math.round(nextHeight / gridSize) * gridSize : nextHeight}px`;
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  });

  sticker.append(remove, rotate, resize);
  stickerLayer.appendChild(sticker);
  sticker.addEventListener('pointerdown', (event) => {
    if (event.target === remove || event.target === rotate || event.target === resize) return;
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const startLeft = sticker.offsetLeft;
    const startTop = sticker.offsetTop;
    const move = (moveEvent) => {
      const layerRect = stickerLayer.getBoundingClientRect();
      const nextLeft = Math.max(0, Math.min(layerRect.width - sticker.offsetWidth, startLeft + moveEvent.clientX - startX));
      const nextTop = Math.max(0, Math.min(layerRect.height - sticker.offsetHeight, startTop + moveEvent.clientY - startY));
      sticker.style.left = `${snapGrid.checked ? Math.round(nextLeft / gridSize) * gridSize : nextLeft}px`;
      sticker.style.top = `${snapGrid.checked ? Math.round(nextTop / gridSize) * gridSize : nextTop}px`;
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  });
}

stickerTools.forEach((tool) => tool.addEventListener('click', () => addSketchSticker(tool.dataset.sticker)));

pngStickerInput.addEventListener('change', () => {
  [...pngStickerInput.files].forEach((file) => {
    if (file.type === 'image/png') addSketchSticker('uploaded-image', URL.createObjectURL(file));
  });
  pngStickerInput.value = '';
});

toggleGrid.addEventListener('change', () => {
  sketchPaper.classList.toggle('grid-off', !toggleGrid.checked);
});

const stickerExportColors = {
  'perfil-aluminio': '#dce7ed',
  ptr: '#c8d2d8',
  'malla-metalica': '#b8c4ca',
  lamina: '#f1f4f6',
  'llantas-industriales': '#26343e',
  resortes: '#d7b86a',
  lamparas: '#fff4b8',
  gabinetes: '#b9c5cd',
  rack: '#d1d7db',
  madera: '#b77b45',
  motor: '#1595d1',
  alternador: '#9099a0'
};

function createSketchExportBlob() {
  return new Promise((resolve) => {
    const rect = sketchCanvas.getBoundingClientRect();
    const scale = 2;
    const exportCanvas = document.createElement('canvas');
    const exportContext = exportCanvas.getContext('2d');
    exportCanvas.width = Math.round(rect.width * scale);
    exportCanvas.height = Math.round(rect.height * scale);
    exportContext.scale(scale, scale);
    const baseImage = new Image();
    baseImage.onload = () => {
      exportContext.drawImage(baseImage, 0, 0, rect.width, rect.height);
      [...stickerLayer.children].forEach((sticker) => {
        const type = sticker.dataset.sticker;
        const width = sticker.offsetWidth;
        const height = sticker.offsetHeight;
        const x = sticker.offsetLeft + width / 2;
        const y = sticker.offsetTop + height / 2;
        const rotation = Number(sticker.dataset.rotation || 0) * Math.PI / 180;
        exportContext.save();
        exportContext.translate(x, y);
        exportContext.rotate(rotation);
        exportContext.strokeStyle = '#172536';
        exportContext.lineWidth = 2;
        if (sticker.classList.contains('image-sticker')) {
          const image = sticker.querySelector('img');
          if (image?.complete) exportContext.drawImage(image, -width / 2, -height / 2, width, height);
        } else {
          exportContext.fillStyle = stickerExportColors[type] || '#e8f1f7';
          exportContext.fillRect(-width / 2, -height / 2, width, height);
          exportContext.strokeRect(-width / 2, -height / 2, width, height);
          exportContext.fillStyle = type === 'llantas-industriales' ? '#fff' : '#172536';
          exportContext.font = '700 11px DM Mono, monospace';
          exportContext.textAlign = 'center';
          exportContext.textBaseline = 'middle';
          exportContext.fillText(type.replaceAll('-', ' ').toUpperCase(), 0, 0, Math.max(35, width - 16));
        }
        exportContext.restore();
      });
      exportCanvas.toBlob(resolve, 'image/png');
    };
    baseImage.src = sketchCanvas.toDataURL('image/png');
  });
}

function downloadSketchBlob(blob) {
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const download = document.createElement('a');
  download.href = url;
  download.download = 'boceto-proyecto-sidc.png';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

if (sketchCanvas && sketchContext) {
  sketchColorButtons.forEach((button) => {
    button.addEventListener('click', () => {
      sketchColor = button.dataset.sketchColor;
      sketchColorButtons.forEach((item) => item.classList.toggle('active', item === button));
      sketchContext.strokeStyle = sketchColor;
    });
  });
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
  downloadSketchButton.addEventListener('click', async () => {
    downloadSketchBlob(await createSketchExportBlob());
  });
  sendSketchButton.addEventListener('click', async () => {
    const blob = await createSketchExportBlob();
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

    downloadSketchBlob(blob);
    window.open(`https://wa.me/528116710029?text=${encodeURIComponent(`${message} Adjunta el archivo boceto-proyecto-sidc.png a este chat.`)}`, '_blank', 'noopener,noreferrer');
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
