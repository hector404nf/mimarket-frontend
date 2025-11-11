# Estado del frontend al loguearse como tienda

Este documento resume qué datos del dashboard de tienda están conectados al backend y cuáles siguen usando datos simulados. También lista los endpoints disponibles y propone próximos pasos para completar las integraciones.

## Contexto de autenticación y sesión
- El frontend usa `AuthContext` para gestionar sesión y cargar el usuario vía `GET /auth/me`.
- El tipo `User` incluye `profile_type`, `has_store` y `store_info` (id, nombre, descripción, categoría). Si el usuario tiene tienda, se habilitan las rutas bajo `dashboard-tienda`.
- Requisito de entorno: `NEXT_PUBLIC_API_URL` debe apuntar al origen del backend SIN `'/api'` (ej.: `http://localhost:8010`). El cliente Axios añade `'/api'` automáticamente. Si no defines `NEXT_PUBLIC_API_URL`, se usa el proxy de `next.config.mjs` controlado por `API_PORT`.

## Conectado al backend (datos reales)
- Notificaciones (usuario y tienda):
  - Hook `useNotifications` usa el cliente Axios central y rutas versionadas.
  - Endpoints: `GET /api/v1/notificaciones/usuario/{usuarioId}`, `GET /api/v1/notificaciones/usuario/{usuarioId}/unread-count`, `PATCH /api/v1/notificaciones/{notificacionId}/read`, `PATCH /api/v1/notificaciones/usuario/{usuarioId}/read-all`, `GET /api/v1/notificaciones/tienda/{tiendaId}`.
  - Vistas: `components/notifications-dropdown.tsx` y `app/dashboard-tienda/notificaciones/page.tsx`.
- Resolución de nombre de tienda en pedidos del usuario:
  - Se prioriza `producto.tienda?.nombre_tienda`; si sólo hay `id_tienda`, se consulta `GET /api/v1/tiendas/{id}`; fallback "Tienda {id}".
  - Impacta la vista de pedidos de usuario (`/perfil/pedidos/{id}`) y componentes relacionados.
- Página pública de tienda (`app/tiendas/[id]/page.tsx`):
  - Conectada al backend. Obtiene la tienda vía `GET /api/v1/tiendas/{id}` y sus productos vía `GET /api/v1/productos/tienda/{tiendaId}`.
  - Usa `lib/api/tiendas.ts` (TiendasService) y `lib/api/productos.ts` (ProductosService) con mapeo a tipos del frontend.

## Parcialmente conectado o disponible en librerías (pero no usado en UI)
- Productos por tienda:
  - Servicio disponible en `lib/api/productos.ts` con `GET /api/v1/productos/tienda/{tiendaId}` y CRUD (`POST/PUT/DELETE /api/v1/productos/{id}`), toggle de estado y manejo de imágenes.
  - La página `app/dashboard-tienda/productos/page.tsx` aún usa datos simulados (`@/lib/data`).

## Pendiente de conectar (usa datos simulados o falta endpoint/uso en UI)
- Dashboard principal de tienda (`app/dashboard-tienda/page.tsx`):
  - Estadísticas, métricas y ventas recientes son simuladas.
  - Endpoints candidatos para datos reales: `GET /api/v1/comisiones/tienda/{tiendaId}` y `GET /api/v1/comisiones/tienda/{tiendaId}/resumen` (requieren auth y permisos). También se pueden derivar métricas de órdenes.
- Pedidos de la tienda (`app/dashboard-tienda/pedidos/page.tsx`):
  - Actualmente simulado. El backend expone `GET /api/v1/ordenes/usuario/{usuarioId}` y `GET /api/v1/detalle-ordenes/orden/{ordenId}`; no existe una ruta directa por tienda.
  - Alternativas: agregar `GET /api/v1/ordenes/tienda/{tiendaId}` en backend o derivar pedidos de la tienda combinando órdenes y sus detalles filtrando por `store_info`/`tiendaId`.
- Clientes de la tienda (`app/dashboard-tienda/clientes/page.tsx`):
  - Simulado. No hay una ruta específica de clientes; puede derivarse desde órdenes y mensajes.
- Configuración de tienda (`app/dashboard-tienda/configuracion/page.tsx`):
  - La UI define opciones (email/SMS/push), pero falta conectar persistencia.
  - Endpoints de tienda disponibles: `PUT /api/v1/tiendas/{tiendaId}`, `POST /api/v1/tiendas` y toggles (`PATCH /api/v1/tiendas/{tiendaId}/deactivate`, `POST /api/v1/tiendas/{tiendaId}/toggle-status`).
 

## Endpoints relevantes existentes en backend
- Autenticación: `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.
- Tiendas (lectura pública): `GET /api/v1/tiendas`, `GET /api/v1/tiendas/{tiendaId}`, `GET /api/v1/tiendas/{tiendaId}/productos`, `GET /api/v1/tiendas/usuario/{usuarioId}`.
- Productos: `GET /api/v1/productos/tienda/{tiendaId}`, CRUD y `PATCH /api/v1/productos/{productoId}/toggle-status`.
- Órdenes: `GET /api/v1/ordenes`, `GET /api/v1/ordenes/usuario/{usuarioId}`, `PATCH /api/v1/ordenes/{ordenId}/status`. No hay `GET /api/v1/ordenes/tienda/{tiendaId}`.
- Detalle de órdenes: `GET /api/v1/detalle-ordenes/orden/{ordenId}`.
- Comisiones: `GET /api/v1/comisiones/tienda/{tiendaId}`, `GET /api/v1/comisiones/tienda/{tiendaId}/resumen`.
- Notificaciones: ver sección "Conectado al backend".

## Requisitos y configuración
- Define `NEXT_PUBLIC_API_URL` con el origen del backend SIN `'/api'` (por ejemplo `http://localhost:8010`). El cliente Axios añadirá `'/api'` si hace falta. Alternativamente, omítela y configura `API_PORT` en `next.config.mjs` para el proxy local.
- El cliente HTTP central de Axios adjunta automáticamente el token (Sanctum) para rutas protegidas.
- Revisa `.env` del frontend para URLs y `.env` del backend para base de datos, CORS y claves VAPID.

## Próximos pasos recomendados (prioridad sugerida)
1. Conectar `productos/page.tsx` al servicio real (`ProductosService.getByTienda`).
2. Conectar la página pública `tiendas/[id]` a `GET tiendas/{id}` y `GET tiendas/{id}/productos`. (COMPLETADO)
3. Implementar pedidos de tienda: nueva ruta backend por tienda o agregación en frontend con detalles de órdenes.
4. Conectar el dashboard a `comisiones` para métricas clave (ingresos, comisiones, rendimiento).
5. Persistir la configuración de notificaciones y de tienda vía `PUT /api/v1/tiendas/{tiendaId}`.
6. Derivar y listar clientes desde órdenes y/o mensajes.

---
Actualizado para entorno local: usa `http://localhost:8010` (o ajusta `API_PORT`) con rutas bajo `/api/v1`.