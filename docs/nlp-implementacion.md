# Implementación de NLP en MiMarket: arquitectura, flujo y correcciones

Este documento describe exhaustivamente cómo está incorporado el Procesamiento de Lenguaje Natural (NLP) en el sistema MiMarket, su flujo extremo a extremo entre frontend y backend, dependencias, puntos de integración, debilidades detectadas y propuestas de corrección/mejora.

## Resumen ejecutivo
- El NLP vive en el frontend. Interpreta consultas en lenguaje natural para: detectar categorías, intención, sentimiento, urgencia, rango de precios y tipo de venta.
- El backend no ejecuta NLP; expone filtros y búsqueda de texto (`buscar`/`search`) que el frontend construye con ayuda del motor NLP.
- La búsqueda inteligente intenta primero resultados del backend (con filtros derivados del NLP) y, si no hay datos o falla, aplica un motor local de recomendaciones que combina análisis NLP + comportamiento del usuario.
- Hallazgos clave: existen inconsistencias entre las interfaces del motor NLP y su consumo en el `RecommendationEngine` (nombres de métodos y tipos). Esto puede causar errores de compilación o de tipado.

---

## Arquitectura y componentes

- `mimarket-frontend/lib/nlp-engine.ts`:
  - Expone `NLPEngine` con método `analyze(text)` y `export const nlpEngine = new NLPEngine()`.
  - Interpreta consultas para: `categories`, `intent`, `sentiment`, `urgency`, `priceRange`, `saleType`.
- `mimarket-frontend/components/smart-search.tsx`:
  - Orquesta la búsqueda inteligente.
  - Usa `nlpEngine.analyze(query)` para construir filtros y llamar a API de backend.
  - Fallback: usa `RecommendationEngine.generateRecommendations` si el backend no devuelve datos.
  - Registra búsquedas en backend vía `BusquedasService` y en local vía `BehaviorTracker`.
- `mimarket-frontend/lib/recommendation-engine.ts`:
  - Motor de recomendaciones local que combina NLP + comportamiento.
  - Dependencias: `BehaviorTracker`, `productos`/`tiendas` mock, y el motor NLP.
  - Observación: referencia métodos/tipos inexistentes en `nlp-engine.ts` (`getInstance`, `processQuery`, `NLPResult`).
- `mimarket-frontend/lib/behavior-tracker.ts`:
  - Rastrea vistas, búsquedas, clics y acciones de carrito con almacenamiento en `localStorage`.
  - Expone métricas para el motor de recomendación: productos más vistos, categorías de interés, afinidad por producto.
- `mimarket-frontend/components/recommendations-section.tsx`:
  - Se apoya en `nlpEngine.analyze` y datos de comportamiento para calcular intereses por categoría y mostrar bloques “Vistos recientemente”, “Recomendados” y “Tiendas que te pueden interesar”.

- Backend (Laravel):
  - `routes/api.php` define endpoints públicos de lectura y CRUD protegido.
  - Controladores relevantes para la búsqueda:
    - `ProductoController@index` y `getByTienda`: filtros por `categoria`, `tienda`, `precio_min`, `precio_max`, `buscar`/`search`, orden con `ordenar`/`sort_by` y dirección.
    - `TiendaController@index`: búsqueda por `search` en `nombre_tienda`, `descripcion`, `email_contacto`, y filtros como `min_rating`, `ciudad` con ordenamiento `sort_by`/`sort_order`.
    - `BusquedaController`: persiste búsquedas (`store`) y expone populares/recientes.

---

## Flujo E2E de la búsqueda inteligente

1. Usuario escribe una consulta en `SmartSearch` (ej.: “Necesito un teléfono barato para gaming hasta ₲1.000.000”).
2. `SmartSearch` invoca `nlpEngine.analyze(query)` y deriva filtros:
   - `categories`: mapea nombres a `id_categoria` (vía `categoriasService`) usando `nombre` y `slug`.
   - `intent`: si es `price`, el componente ordena por `precio asc`; caso contrario por `fecha_creacion desc`.
   - `priceRange`: aplica `precio_min` y/o `precio_max`.
   - `saleType`: aplica match textual contra `tipoVenta` en los resultados para generar razones.
3. Llama a backend:
   - `productosService.getProductos({ search: query, categoria, sort_by, sort_order, precio_min, precio_max, per_page })`.
     - Mapea `search` → `buscar` cuando corresponda; el backend implementa LIKE en `nombre`/`descripcion`.
   - `tiendasService.getTiendas({ search: query, per_page })`.
4. Si backend devuelve resultados:
   - Se construyen razones (coincidencia de categoría, precio, tipo de venta, rating de tienda).
   - Se registra la búsqueda: `busquedasService.logBusqueda({ user_id, termino_busqueda, resultados_encontrados, filtros_aplicados })`.
   - Se actualiza `BehaviorTracker.trackSearch(query, totalResultados)`.
5. Si backend falla o devuelve vacío:
   - Fallback local: `RecommendationEngine.generateRecommendations(query, 8)` que:
     - Aplica NLP local (ver observación de inconsistencia de tipos).
     - Combina intereses de `BehaviorTracker` y similitud de categoría con productos/tiendas mock.

---

## Detalle del motor NLP (frontend)

Archivo: `mimarket-frontend/lib/nlp-engine.ts`

- Interfaz exportada: `NLPAnalysis` con campos:
  - `categories: string[]`
  - `intent: "buy" | "compare" | "browse" | "price" | "info"`
  - `sentiment: "positive" | "neutral" | "negative"`
  - `urgency: number` (0–1)
  - `priceRange: { min?: number; max?: number } | null`
  - `saleType: "directa" | "pedido" | "delivery" | null`
- `NLPEngine.analyze(text)`:
  - Normaliza a minúsculas y sin acentos.
  - `extractCategories`: hace match por palabras clave predefinidas de categorías (tecnología, ropa, hogar, deportes, comida, libros, juguetes, belleza).
  - `detectIntent`: palabras clave para intención (comprar, comparar, ver, precio, info).
  - `analyzeSentiment`: lista corta de positivas/negativas.
  - `calculateUrgency`: alinea palabras a niveles (alto/medio/bajo) y devuelve número.
  - `extractPriceRange`: detecta precios con formato `₲` y deriva min/max según “menos de/máximo” o “más de/mínimo”.
  - `detectSaleType`: mapea palabras a `directa | pedido | delivery`.

Uso principal:
- `smart-search.tsx`: `const analysis = nlpEngine.analyze(query)`.
- `recommendations-section.tsx`: usa `nlpEngine.analyze(search.query)` para sumar intereses de categoría.

---

## Motor de recomendaciones (frontend)

Archivo: `mimarket-frontend/lib/recommendation-engine.ts`

- Propósito: combinar análisis NLP y comportamiento del usuario para producir recomendaciones locales de `productos` y `tiendas`.
- Entradas: consulta del usuario, `BehaviorTracker.getBehaviorData()`, datos mock locales (`productos`, `tiendas`).
- Salidas: `RecommendationResult` con `products`, `stores`, `nlpAnalysis`, `explanation`.
- Lógica de scoring:
  - NLP: match de categoría y keywords contra `nombre/descripcion`, tipo de venta y urgencia.
  - Comportamiento: categorías de interés y productos similares vistos recientemente.
  - Afinidad: cálculo de afinidad por producto (recencia, frecuencia, duración vista).

Observación importante:
- Este archivo importa `NLPEngine, type NLPResult` y llama `NLPEngine.getInstance()` y `this.nlpEngine.processQuery(query)`.
- En `nlp-engine.ts` no existen `getInstance`, `processQuery` ni `NLPResult`. La interfaz real es `NLPAnalysis` y el método es `analyze`.
- Implicación: Debe corregirse para evitar inconsistencias y mejorar mantenibilidad.

---

## Backend: rutas y controladores relevantes a NLP

Archivo: `mimarket-backend/routes/api.php` (prefijo público `v1`)
- Productos:
  - `GET /api/v1/productos` → `ProductoController@index`
  - `GET /api/v1/productos/tienda/{tienda}` → `ProductoController@getByTienda`
- Tiendas:
  - `GET /api/v1/tiendas` → `TiendaController@index`
  - `GET /api/v1/tiendas/{tienda}` → `TiendaController@show`
- Búsquedas:
  - `POST /api/v1/busquedas` → `BusquedaController@store`
  - `GET /api/v1/busquedas/populares`, `GET /api/v1/busquedas/recientes/{usuario}`

Controladores clave:
- `ProductoController@index` y `getByTienda`:
  - Filtros compatibles con frontend: `categoria`, `tienda`, `precio_min`, `precio_max`, `buscar`/`search`.
  - Ordenamiento: `ordenar`/`sort_by` y dirección `direccion`/`sort_order`.
- `TiendaController@index`:
  - Filtros por `search`, `min_rating`, `ciudad`; ordenamiento `sort_by`/`sort_order`.
- `BusquedaController@store`:
  - Persiste `{ user_id?, termino_busqueda, resultados_encontrados, filtros_aplicados?, ip_address? }`.

No hay ejecución de NLP en el backend; sólo recibe parámetros ya derivados por el frontend.

---

## Integraciones del frontend con backend

Servicios (`mimarket-frontend/lib/api/*`):
- `productos.ts` (`ProductosService.getProductos`):
  - Mapea `search` → `buscar` cuando el backend espera ese nombre.
  - Envía `categoria`, `precio_min`, `precio_max`, `sort_by`, `sort_order`, `per_page`.
- `tiendas.ts` (`TiendasService.getTiendas`):
  - Envía `search`, `per_page`, y opcionalmente `sort_*`.
- `busquedas.ts` (`BusquedasService.logBusqueda`):
  - Envía metadatos de la búsqueda y filtros aplicados.

---

## Debilidades e inconsistencias detectadas

1. Desalineación de tipos y métodos del motor NLP:
   - `RecommendationEngine` espera `NLPEngine.getInstance()`, `processQuery(query)` y tipo `NLPResult` con `{ intent: { intent, confidence }, categories: [{category, confidence}], keywords, urgency, salesType }`.
   - `nlp-engine.ts` expone `analyze(text)` y tipo `NLPAnalysis` (sin `confidence` por categoría/intent ni `keywords` explícitas).
   - Riesgo: errores de compilación/ejecución y mantenibilidad reducida.

2. Cobertura limitada de categorías y palabras clave:
   - “tecnología” vs “electrónica” y variaciones (ej. “celu”, “notebook”, “compu”).
   - Sin soporte para sinónimos comunes locales.

3. Extracción de precio rígida:
   - Requiere `₲`; no reconoce “Gs.”, “Gs”, “guaraníes”, “mil”, “hasta 500 mil”, formatos con puntos y sin símbolo.

4. Sentimiento y urgencia simplificados:
   - Listas muy cortas; no diferencian matices ni negaciones.

5. Privacidad y persistencia local:
   - `BehaviorTracker` almacena datos en `localStorage` sin políticas explícitas de retención o anonimización.

6. Métricas y observabilidad:
   - No hay métricas de precisión/recall del NLP ni dashboards de éxito de recomendaciones.

---

## Correcciones recomendadas (plan técnico)

Opción A — Alinear `RecommendationEngine` al motor actual (`NLPAnalysis`):
- Cambiar import a `import { nlpEngine, type NLPAnalysis } from "./nlp-engine"`.
- Reemplazar `getInstance()` y `processQuery(query)` por `nlpEngine.analyze(query)`.
- Adaptar estructura esperada: generar `intent.confidence` y `categories` con confianza (p.ej., `1` si detectado, `0.5` si heurístico). Añadir `keywords` como tokens simples (split por espacios filtrando stopwords básicas).

Opción B — Extender `nlp-engine.ts` para exponer la interfaz esperada por `RecommendationEngine`:
- Añadir método `getInstance()` (singleton) y `processQuery(query)` que devuelva un `NLPResult` enriquecido (incluyendo confidencias y `keywords`).
- Exportar `type NLPResult` junto con `NLPAnalysis` para compatibilidad.

Recomendación: aplicar Opción A por ser menos invasiva y coherente con el uso actual (`smart-search.tsx` y `recommendations-section.tsx` ya usan `analyze`). Posteriormente, si se necesita confianza detallada, evolucionar el motor.

---

## Mejoras sugeridas al motor NLP

- Categorías y sinónimos:
  - Unificar “tecnología/electrónica” y agregar vocabulario local: “celu”, “notebook”, “pc gamer”, “zapatilla”, “remera”, “heladera”, “lavadora”, “sofa”, etc.
  - Incluir `slug` de categoría y etiquetas populares en productos para contextualizar.
- Extracción de precio robusta:
  - Reconocer `Gs`, `Gs.`, `guaraní/es`, números con “mil/millón”, rangos con “hasta”, “entre”, “desde”.
  - Normalizar a entero y tolerar separadores `.` y `,`.
- Intención y urgencia mejoradas:
  - Añadir negaciones (“no quiero caro”), marcadores temporales (“para hoy”, “esta semana”).
- Sentimiento:
  - Integrar librería ligera o listas ampliadas; contabilizar intensificadores (“muy”, “recontra”).
- Métricas & Feedback Loop:
  - Registrar análisis y éxito de clics/conversión para retroalimentar el modelo.
- Internacionalización:
  - Soporte básico para consultas en inglés/portugués con traducción o listas adicionales.

---

## Plan de pruebas

- Unitario (frontend):
  - `nlp-engine`: pruebas para `analyze` con consultas representativas; validar categorías, intención, precio y tipo de venta.
  - `smart-search`: mock de servicios para confirmar construcción correcta de filtros y explicación.
  - `recommendation-engine`: validar scoring con inputs de `BehaviorTracker` y resultados ordenados.
- Integración (E2E):
  - Ejecutar flujo “backend primero, fallback después” asegurando que ambos caminos funcionan.
  - Verificar logging en `BusquedaController` y mapping de filtros (`productosService`, `tiendasService`).
- UI:
  - Confirmar que la sección de explicación y badges de confianza aparecen y colorean correctamente.

---

## Seguridad y privacidad

- Datos en `localStorage`:
  - Definir política de retención (ej. limitar a 50 búsquedas, 100 clics; ya implementado en parte).
  - Proveer endpoint/acción para limpiar historial desde la UI.
- Backend:
  - Guardar `filtros_aplicados` sin PII, y considerar registrar `ip_address` bajo consentimiento.
- `.env` y base de datos:
  - Revisar `.env` para variables de conexión. Entorno actual: Host `localhost`, Port `3306`, Database `mimarket`, Username `root`, Password vacío. Ruta MySQL: `C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin`.
  - No usar Tinker para pruebas; preferir rutas HTTP y scripts SQL controlados.

---

## Checklist para corrección

- [ ] Alinear `RecommendationEngine` al API real de `nlp-engine` (Opción A).
- [ ] Ampliar palabras clave de categorías y sinónimos.
- [ ] Hacer extractor de precios más tolerante.
- [ ] Añadir generación de `keywords` simples en `nlp-engine` si se requiere por el motor de recomendación.
- [ ] Crear métricas básicas (conteo de aciertos, CTR por recomendación) y endpoint de agregación opcional.
- [ ] Documentar y exponer acción para limpiar comportamiento en la UI.

---

## Referencias de archivos

Frontend:
- `mimarket-frontend/lib/nlp-engine.ts`
- `mimarket-frontend/components/smart-search.tsx`
- `mimarket-frontend/lib/recommendation-engine.ts`
- `mimarket-frontend/lib/behavior-tracker.ts`
- `mimarket-frontend/components/recommendations-section.tsx`
- `mimarket-frontend/lib/api/{productos, tiendas, busquedas}.ts`

Backend:
- `mimarket-backend/routes/api.php`
- `mimarket-backend/app/Http/Controllers/Api/{ProductoController, TiendaController, BusquedaController}.php`

---

## Notas finales

- La incidencia inicial de 404 por enlaces antiguos de notificaciones se resolvió actualizando generación de URLs y normalización en frontend.
- Sobre el estilo del botón “Te gusta”: se ajustó para evitar fondo negro al estar activo (estado `outline` con azul suave). Confirmar visualmente en el entorno de pruebas.

Si quieres, puedo aplicar directamente la corrección de la desalineación del motor de recomendaciones con el motor NLP actual (Opción A) y ampliar las listas de keywords y el extractor de precios.