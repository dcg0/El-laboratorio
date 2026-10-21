# Plan: Cotizador S.I.D.C.

## Implementación

Se añade una página estática interna en `cotizador.html`, enlazada desde la tarjeta S.I.D.C. de `index.html`. El cotizador funciona sin backend: carga `assets/data/ferreteria-monterrey.json`, calcula materiales de una mesa de trabajo y presenta un rango estimado. El catálogo conserva precio, SKU, presentación, URL de consulta y fecha; la interfaz advierte que el precio e inventario pueden cambiar.

La lógica vive en `assets/js/cotizador.js`. Para MDF calcula tableros por área, suma desperdicio, tornillería, adhesivo, acabado opcional, mano de obra y variación. Para polín estima piezas de 2.44 m. La ruta queda declarada en `manus-routes.json`.

## Diseño

- **Estilos considerados:** terminal industrial neón (0.06), catálogo de ferretería técnico (0.04), dashboard editorial sobrio (0.08).
- **Estilo elegido — terminal industrial neón:** estética de panel de ingeniería con fondo oscuro, cyan de marca, verde de estado y tarjetas con bordes técnicos.
- **Principios:** entrada rápida, resultado visible, trazabilidad de precios y lectura cómoda en móvil.
- **Paleta:** el cyan conecta con DC Laboratory; el verde comunica cálculo listo; el naranja solo aparece como acento cálido del universo del laboratorio.
- **Layout:** hero de dos columnas y flujo de formulario/resultado frente a una guía lateral; en móvil se apila para priorizar la acción.
- **Firma:** logo grande de S.I.D.C. dentro de un panel con retícula punteada y etiquetas de sistema.
- **Interacción:** controles de medidas con valores iniciales útiles; cálculo por acción explícita; enlace directo a la fuente del material elegido.
- **Tipografía:** Barlow Condensed para titulares técnicos y DM Mono para datos, etiquetas y precios.
- **Voz:** directa y práctica. Ejemplos: “Cotiza lo que vas a construir.” y “Confirma existencias antes de comprar.”
- **Posicionamiento:** una herramienta local de primera estimación para convertir medidas de proyecto en una lista de compra entendible.
