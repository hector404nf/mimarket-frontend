# Plan de implementación NLP (alineado a `idea-nlp.md`)

Este documento define cómo debe funcionar el NLP y las recomendaciones en MiMarket, alineado con las ideas en `docs/idea-nlp.md`, y detalla los cambios necesarios en frontend y backend para lograrlo.

## Objetivo
- Guardar búsquedas y construir un perfil/intereses del usuario basado en su comportamiento (búsquedas, vistas y acciones).
- Mostrar sugerencias y recomendaciones personalizadas (en el navbar, en la búsqueda inteligente y en la home).
- Registrar tiempo de permanencia en productos y páginas, y usar esos datos para métricas de tienda (productos más vistos, populares, tiempo medio, etc.).

---

## Estado actual (confirmado)
- Input de búsqueda del navbar actualmente: `mimarket-frontend/components/search.tsx`.
  - Muestra sugerencias de “Búsquedas recientes” (badges) desde `BehaviorTracker` y registra `trackSearch(term, 0)`.
- Componente SmartSearch: `mimarket-frontend/components/smart-search.tsx`.
  - Se usa en la página dedicada `mimarket-frontend/app/busqueda-inteligente/page.tsx`.
  - Orquesta búsqueda con NLP (`nlpEngine.analyze(query)`), consulta APIs de productos/tiendas, muestra sugerencias (recientes/populares) y explica el análisis.
  - Registra búsquedas localmente y (si está configurado) en el backend vía `busquedasService`.
- Rastreo de comportamiento (local): `mimarket-frontend/lib/behavior-tracker.ts`.
  - Implementa `Singleton` con almacenamiento en `localStorage`: vistas de producto/tienda con duración, búsquedas, clics y acciones de carrito.
  - Expone agregados: más vistos, afinidad por producto, búsquedas recientes.
- Páginas que ya rastrean duración:
  - Producto: `app/productos/[id]/page.tsx` (registro de `trackProductView(id_producto, duration)` y `trackAddToCart`).
  - Tienda: `app/tiendas/[id]/page.tsx` (usa `useBehaviorTracking` para `trackStoreView`).
- Backend (Laravel):
  - `routes/api.php` expone endpoints públicos; `BusquedaController@store` persiste búsquedas y `GET /busquedas/populares`, `GET /busquedas/recientes/{usuario}`.
  - `ProductoController@index` y `TiendaController@index` soportan `search/buscar`, filtros y orden.
  - Existen rutas de analíticas/dashboards (`DashboardTiendaController`, `DashboardAdminController`) para consumo de métricas.

Conclusión: el navbar usa `components/search.tsx` y `SmartSearch` se utiliza sólo en la página `app/busqueda-inteligente`. Para alinearnos con la idea, SmartSearch debe ser el input de búsqueda del navbar y la página dedicada puede quedar opcional o deprecada.

---

## Cómo debe funcionar (flujo E2E)

### 1) Búsqueda y sugerencias (navbar con SmartSearch)
- SmartSearch como input del navbar:
  - Integrar `SmartSearch` dentro de `components/navbar.tsx` sustituyendo el import de `components/search.tsx`.
  - Modo compacto: ocultar la sección de resultados enriquecidos y mantener sólo el input + dropdown de sugerencias (recientes/populares).
  - Al enviar o seleccionar sugerencia: navegar a `/?busqueda=<term>` y registrar `trackSearch(term, resultados)` en `BehaviorTracker` y en backend (`BusquedaController@store`).
- Página dedicada `app/busqueda-inteligente/page.tsx` (opcional):
  - Puede mantenerse para una experiencia completa con explicación de análisis NLP y resultados detallados.
  - Si se decide deprecarla, redirigir a la home con el parámetro `busqueda` y mostrar recomendaciones.

### 2) Perfil y patrones del usuario
- `BehaviorTracker` mantiene un perfil básico del usuario:
  - `searches`: últimos términos y recencia.
  - `productViews`: frecuencia y duración por producto.
  - `storeViews`: duración por tienda.
  - `cartActions` y `productClicks` para señales de interés.
- A partir de esto:
  - Se calculan “Categorías de interés” (frecuencia/recencia de vistas y búsquedas).
  - Se derivan recomendaciones para la home (bloques: “Recomendados”, “Vistos recientemente”, “Populares”).

### 3) Métricas de tienda y popularidad
- Agregación local (cliente):
  - Por sesión/día, se agregan `views_count`, `total_duration`, `avg_duration`, `add_to_cart_count` por `producto_id` y por `tienda_id`.
- Sincronización con backend (batch):
  - Un “job” en frontend envía resúmenes periódicos (p. ej., al cambiar de página o cada X minutos) a un endpoint de ingesta.
  - El backend acumula por día y por tienda para dashboards: “más vistos”, “más tiempo”, “CTR por recomendación”.

---

## Cambios propuestos (Frontend)

**SmartSearch como input único del navbar**
- `components/navbar.tsx`:
  - Reemplazar `import SearchComponent from "@/components/search"` por `import SmartSearch from "@/components/smart-search"` y renderizarlo.
  - Pasar `variant="navbar"` (nuevo prop) para modo compacto.
- `components/smart-search.tsx`:
  - Añadir prop `variant?: "navbar" | "full"`.
  - En `variant="navbar"`: activar input con sugerencias y navegación, desactivar bloques de explicación y resultados extendidos.
  - Mantener registro de búsquedas en `BehaviorTracker` y llamar a `busquedasService.logBusqueda(...)` si `user` está disponible.
- Acción de privacidad:
  - Agregar “Limpiar historial” (botón/acción) que llame a `BehaviorTracker.clear()`.

**Alinear el motor de recomendaciones**
- `lib/recommendation-engine.ts`:
  - Importar `nlpEngine, type NLPAnalysis` en lugar de `getInstance/processQuery`.
  - Reemplazar `this.nlpEngine.processQuery(query)` por `nlpEngine.analyze(query)`.
  - Generar `keywords` simples (tokens del `query` sin stopwords) si se requieren para scoring.

**Mejorar NLP**
- `lib/nlp-engine.ts`:
  - Ampliar palabras clave y sinónimos locales ("celu", "compu", "notebook", "heladera", "remera", etc.).
  - Robustecer extracción de precio: reconocer `Gs`, `Gs.`, “guaraní/es”, “mil”, “hasta 500 mil”, formatos con o sin `₲` y separadores.
  - Opcional: añadir una lista básica de stopwords y detección de negaciones (“no caro”, “no usado”).

**Sincronización de comportamiento con backend**
- Crear `lib/api/analytics.ts` con:
  - `syncBehaviorSummary(summary: BehaviorSummary)`: POST de datos agregados (ver payload abajo).
  - `flushOnVisibilityChange`: hook para enviar cuando `document.visibilityState` cambia o al salir de la página.
- Extender `BehaviorTracker` para obtener un “resumen agregable” (por producto/tienda, día/fecha) y limitar la retención local.

**UI de recomendaciones en la home**
- `components/recommendations-section.tsx`:
  - Usar `BehaviorTracker` + `nlpEngine` para mostrar:
    - “Vistos recientemente” (últimos N productos).
    - “Recomendados para ti” (intereses por categoría + afinidad).
    - “Tiendas que te pueden interesar” (vistas y afinidad).

---

## Cambios propuestos (Backend)

**Persistir búsquedas (existente)**
- Endpoint: `POST /api/v1/busquedas` → `BusquedaController@store`.
- Payload mínimo:
  - `user_id?`: número o `null` si anónimo.
  - `termino_busqueda`: string.
  - `resultados_encontrados`: número.
  - `filtros_aplicados?`: objeto/JSON con `{ categoria?, precio_min?, precio_max?, intent?, saleType? }`.
  - `ip_address?`: string.

**Ingesta de comportamiento (nuevo)**
- Endpoint sugerido: `POST /api/v1/analytics/behavior` (o bajo `dashboard-tienda` si lo prefieres).
- Responsabilidad: recibir un resumen agregado del cliente y acumularlo por día y por tienda.
- Tabla sugerida: `behavior_events` (si se quiere granular) o tablas agregadas:
  - `product_metrics_daily`: `product_id`, `date`, `views_count`, `total_duration_ms`, `avg_duration_ms`, `add_to_cart_count`, `clicks_count`.
  - `store_metrics_daily`: `store_id`, `date`, `views_count`, `total_duration_ms`, `avg_duration_ms`.
  - `search_metrics_daily`: `term`, `date`, `search_count`, `result_clicks`, `conversion_rate`.
- Nota: respetar `.env` de base de datos (Host: `localhost`, Port: `3306`, Database: `mimarket`, Username: `root`, Password vacío). No usar Tinker; probar por rutas HTTP.

**Dashboards y consultas**
- `DashboardTiendaController@getAnaliticasTienda` puede consultar estas tablas agregadas para:
  - Productos más vistos y con mayor tiempo medio.
  - Tendencias de búsqueda por tienda/categoría.
  - CTR de recomendaciones.

---

## Especificaciones técnicas y payloads

**Frontend → Backend: registros de búsqueda**
- Ruta: `POST /api/v1/busquedas`.
- `body`:
```json
{
  "user_id": 123,
  "termino_busqueda": "samsung a54",
  "resultados_encontrados": 18,
  "filtros_aplicados": {
    "categoria": "tecnologia",
    "precio_min": 0,
    "precio_max": 1000000,
    "intent": "buy",
    "saleType": null
  },
  "ip_address": "127.0.0.1"
}
```

**Frontend → Backend: resumen de comportamiento (batch)**
- Ruta sugerida: `POST /api/v1/analytics/behavior`.
- `body` (ejemplo):
```json
{
  "user_id": 123,
  "session_id": "abc-123",
  "date": "2025-11-11",
  "product_metrics": [
    { "product_id": 42, "views_count": 3, "total_duration_ms": 540000, "avg_duration_ms": 180000, "add_to_cart_count": 1, "clicks_count": 2 }
  ],
  "store_metrics": [
    { "store_id": 7, "views_count": 2, "total_duration_ms": 300000, "avg_duration_ms": 150000 }
  ],
  "search_metrics": [
    { "term": "samsung", "search_count": 4, "result_clicks": 3, "conversion_rate": 0.5 }
  ]
}
```

---

## Mapeo a archivos y puntos de integración

- `components/navbar.tsx`:
  - Usar `SmartSearch` como input de búsqueda del navbar en modo compacto.
  - Asegurar que la UI se adapta (espacio, responsivo, dropdown sobrepuesto).

- `components/smart-search.tsx`:
  - Mantener análisis NLP y fallback con `RecommendationEngine`.
  - Añadir `variant="navbar"` para operar sólo como input + sugerencias.
  - Unificar fuente de sugerencias (recientes/populares) con el navbar.

- `components/smart-search.tsx`:
  - Mantener análisis NLP y fallback con `RecommendationEngine`.
  - Unificar fuente de sugerencias (recientes/populares) con el navbar para consistencia.

- `lib/recommendation-engine.ts`:
  - Usar `nlpEngine.analyze(query)` y `NLPAnalysis`.
  - Ajustar scoring con `keywords` simples.

- `lib/nlp-engine.ts`:
  - Ampliar categorías/sinónimos y extractor de precio.

- `app/productos/[id]/page.tsx` y `app/tiendas/[id]/page.tsx`:
  - Confirmar registro de duración y vistas.
  - Opcional: registrar interacciones (scroll, clic en imágenes, etc.).

- `lib/api/busquedas.ts` y `lib/api/analytics.ts` (nuevo):
  - Servicios HTTP para persistir búsquedas y métricas (usar `.env` para base URL).

---

## Pruebas y validación

- Unitarias (frontend):
  - `nlp-engine`: entradas con sinónimos locales y formatos de precio (con/ sin `₲`).
  - `search.tsx`: que el dropdown de recientes aparezca y que clics naveguen y registren búsqueda.
  - `recommendation-engine`: que `analyze` se use correctamente y el scoring favorezca categorías de interés.

- Integración (frontend ↔ backend):
  - `BusquedasController@store`: recibir payloads reales con filtros derivados.
  - `analytics/behavior`: ingesta y acumulación diaria; validar con queries SQL.

- UI:
  - Home: bloques de recomendaciones reflejan comportamiento y búsquedas.
  - Navbar: sugerencias consistentes con `smart-search`.

---

## Seguridad y privacidad

- `localStorage`:
  - Limitar retención (p. ej., 60 búsquedas, 100 vistas). Proveer opción de limpieza.
  - Evitar almacenar PII; si se registra `user_id`, hacerlo bajo sesión autenticada.

- Backend:
  - Guardar `ip_address` sólo bajo política clara; anonimizar si es posible.
  - Validar entrada y sanitizar `termino_busqueda` y `filtros_aplicados`.

- `.env`:
  - Revisar variables de conexión y base de URL de API. Entorno actual: Host `localhost`, Port `3306`, Database `mimarket`, Username `root`, Password vacío.

---

## Checklist de implementación

- [ ] Unificar `search.tsx` y `smart-search.tsx` en experiencia y fuentes de sugerencias.
- [ ] Alinear `recommendation-engine` con `nlp-engine.analyze`.
- [ ] Ampliar sinónimos y extractor de precio en `nlp-engine`.
- [ ] Persistir búsquedas en backend desde ambos inputs (navbar y smart-search).
- [ ] Crear ingesta de comportamiento en backend y servicio `analytics.ts` en frontend.
- [ ] Exponer recomendaciones en home con bloques claros.
- [ ] Añadir acción “Limpiar historial” en la UI.

---

## Notas

- Evitar Tinker; usar rutas HTTP para pruebas.
- El plan permite evolucionar hacia métricas más avanzadas y un motor NLP más rico sin romper el uso actual.
- `app/busqueda-inteligente/page.tsx`:
  - Mantener como experiencia completa o redirigir al flujo principal según decisión.