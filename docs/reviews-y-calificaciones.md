# Reseñas y Calificaciones: Integración Frontend/Backend

Este documento explica cómo hacer funcional la sección de reseñas y calificaciones en MiMarket, cómo está implementada, y cuáles son las prácticas recomendadas para aplicarla correctamente tanto en el frontend (Next.js) como en el backend (Laravel).

## Objetivo
- Mostrar las reseñas reales de un producto desde el backend.
- Presentar estadísticas de calificación (promedio y distribución).
- Permitir que usuarios autenticados publiquen nuevas reseñas.

---

## Requisitos de entorno
- Frontend (Next.js) corriendo en `http://localhost:3000`.
- Backend (Laravel) corriendo con `baseURL` accesible desde el frontend.
- Base de datos MySQL (Laragon):
  - Host: `localhost`
  - Port: `3306`
  - Database: `mimarket`
  - Username: `root`
  - Password: `""` (vacío)
- Revisar el `.env` del backend y el frontend para verificar las variables de configuración.
- No uses Tinker para pruebas de reseñas; usa la API vía HTTP.

### Variables de entorno relevantes
- Frontend (`.env.local`):
  - `NEXT_PUBLIC_API_URL=http://localhost:8010` (ajusta al host/puerto del backend)
    - Nota: el cliente Axios añade automáticamente `/api` al final si no está presente.
- Backend (`.env`):
  - `DB_HOST=127.0.0.1`
  - `DB_PORT=3306`
  - `DB_DATABASE=mimarket`
  - `DB_USERNAME=root`
  - `DB_PASSWORD=` (vacío)

---

## Backend (Laravel)

### Modelo y tabla
- Modelo: `App\Models\Resena`
- Tabla: `resenas`
- Clave primaria: `id_resena`
- Campos fillable:
  - `id_producto`, `user_id`, `calificacion`, `comentario`, `verificada`
- Relaciones: `user` (BelongsTo), `producto` (BelongsTo)

### Controlador
- Controlador: `App\Http\Controllers\Api\ResenaController`
- Endpoints clave:
  - `GET /api/v1/resenas/producto/{productoId}`: lista de reseñas del producto
  - `GET /api/v1/resenas/producto/{productoId}/stats`: estadísticas de calificación
  - `POST /api/v1/resenas`: crear reseña
  - `PUT /api/v1/resenas/{id}`: actualizar reseña
  - `POST /api/v1/resenas/{id}/verify`: marcar como verificada (moderación)

### Validación y reglas
- `store` valida: `id_producto` (existe), `user_id` (existe), `calificacion` (1–5), `comentario` (<=1000), `verificada` (boolean).
- Evita reseñas duplicadas por usuario y producto.

### Prácticas recomendadas (backend)
- Proteger creación/edición/eliminación con `auth:sanctum` o middleware de autenticación.
- No confiar en `user_id` enviado por el cliente: usar `auth()->id()` para asociar la reseña al usuario autenticado.
  
  Ejemplo de mejora en `store`:
  ```php
  $validated = $request->validate([
    'id_producto' => 'required|exists:productos,id_producto',
    'calificacion' => 'required|integer|min:1|max:5',
    'comentario' => 'nullable|string|max:1000',
  ]);
  $validated['user_id'] = auth()->id();
  ```
- Moderación: usar `verify` para marcar reseñas verificadas; considerar roles/permissions.
- Rate limiting/anti-spam: limitar publicaciones repetidas y validar longitud mínima del comentario.

---

## Frontend (Next.js)

### Servicio de API
- Archivo: `lib/api/resenas.ts`
- Funciones principales:
  - `getByProducto(productoId: number): Promise<Resena[]>`
  - `getProductoStats(productoId: number): Promise<ProductoResenasStats>`
  - `createResena(payload: { id_producto, user_id, calificacion, comentario }): Promise<Resena>`
  - `updateResena(id, data)` y `verifyResena(id)` (opcionales)
- Mapeo de tipos: el backend se mapea a un tipo frontend (`Resena`) amigable (nombre completo, avatar, flags, etc.).

### Componente de UI
- Archivo: `components/reviews-section.tsx`
- Props:
  - `productId?: number`
  - `storeId?: number` (reservado para futuro)
  - `type?: 'product' | 'store'` (por defecto: `'product'`)
- Comportamiento:
  - Carga reseñas reales y estadísticas cuando `type === 'product'` y existe `productId`.
  - Muestra promedio y distribución (usa estadísticas del backend si están disponibles).
  - Permite publicar reseñas solo a usuarios autenticados (usa `useAuth` para obtener `user.id`).
  - Usa `sonner` para toasts de éxito/error; el `Toaster` está montado en `app/layout.tsx`.

### Autenticación y Axios
- `contexts/auth-context.tsx` provee `useAuth()` con `user.id`.
- `lib/axios.ts` añade el token `Authorization` desde `localStorage` y maneja deduplicación de GET, 401 y refresh.

---

## Cómo hacerlo funcionar

1) Configura las variables de entorno
- Frontend: define `NEXT_PUBLIC_API_URL` para apuntar al backend (ej.: `http://localhost:8010`).
- Backend: asegúrate de que la base de datos está correctamente configurada según los valores indicados.

2) Inicia ambos servidores
- Backend Laravel (Laragon o `php artisan serve` en el puerto configurado).
- Frontend Next.js (`pnpm run dev` o `npm run dev`).

3) Abre la página de producto
- URL de ejemplo: `http://localhost:3000/productos/1`.
- Verás:
  - Calificación promedio y distribución.
  - Lista de reseñas reales (si existen).
  - Formulario para publicar reseña (solo usuarios autenticados).

4) Publicar una reseña
- Inicia sesión desde `http://localhost:3000/login`.
- En el producto, selecciona una calificación (1–5), escribe un comentario (≥ 10 caracteres) y publica.
- Debe aparecer un toast de éxito y la reseña se actualizará en la lista y estadísticas.

5) Comportamientos de error
- Si no estás autenticado: se muestra error indicando que debes iniciar sesión.
- Si falta calificación o comentario insuficiente: se valida y se muestra error.
- Primer error 401/refresh: el interceptor de Axios intentará refrescar; si falla, redirige al login.

---

## Endpoints de referencia

### Obtener reseñas por producto
`GET /api/v1/resenas/producto/{productoId}`

Ejemplo curl:
```bash
curl -X GET http://localhost:8010/api/v1/resenas/producto/1 \
  -H "Accept: application/json"
```

### Obtener estadísticas de producto
`GET /api/v1/resenas/producto/{productoId}/stats`

```bash
curl -X GET http://localhost:8010/api/v1/resenas/producto/1/stats \
  -H "Accept: application/json"
```

### Crear reseña
`POST /api/v1/resenas`

```bash
curl -X POST http://localhost:8010/api/v1/resenas \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "id_producto": 1,
    "user_id": 123,
    "calificacion": 5,
    "comentario": "Excelente producto, entrega rápida y buena atención."
  }'
```

> Nota: En un entorno ideal, el backend debe ignorar el `user_id` del cliente y usar el usuario autenticado (`auth()->id()`), protegiendo el endpoint con `auth:sanctum`.

---

## Buenas prácticas
- Autenticación fuerte: proteger creación/edición/eliminación; no confiar en `user_id` del cliente.
- Moderación y verificación: usar el endpoint de `verify` con permisos adecuados.
- UX coherente: usar `sonner` para toasts; el `Toaster` ya está montado en el layout.
- Resiliencia del cliente: manejar errores de red y del servidor; deduplicación de GET ya incluida en `axios.ts`.
- Seguridad: Rate limiting y validación de inputs en el backend; sanitizar el comentario.

---

## Mantenimiento y extensiones
- Soporte a reseñas por tienda: añadir endpoints `GET /resenas/tienda/{id}` y extender el componente con `type="store"`.
- Votos “Útil”: crear endpoint para marcar reseña útil y llevar conteo.
- Paginación: aplicar paginación en reseñas si el volumen crece.
- Notificaciones: notificar al dueño del producto/tenda al recibir nuevas reseñas.

---

## Verificación
- Abre `http://localhost:3000/productos/1` y valida:
  - Se cargan reseñas y estadísticas sin errores.
  - Al publicar, aparece toast de éxito y se actualizan lista y estadísticas.

Si algo falla, revisa:
- `.env` del frontend (`NEXT_PUBLIC_API_URL`).
- `.env` del backend (DB, Sanctum, CORS).
- Consola del navegador y logs del servidor.

---

## Notas finales
- Este documento se centra en reseñas de productos. Para reseñas de tiendas, es necesario definir endpoints adicionales y ajustar la UI.
- Evita usar Tinker para reseñas; realiza pruebas con la API HTTP.