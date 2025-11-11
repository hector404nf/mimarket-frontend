import { api, ApiResponse } from '@/lib/axios';

// Backend model shape
export interface ResenaBackend {
  id_resena: number;
  id_producto: number;
  user_id: number;
  calificacion: number; // 1-5
  comentario?: string | null;
  verificada?: boolean;
  created_at?: string;
  updated_at?: string;
  // Relaciones incluidas por el controlador
  user?: {
    id: number;
    name?: string;
    apellido?: string | null;
    foto_perfil?: string | null;
  } | null;
}

// Frontend-friendly shape
export interface Resena {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  comment: string;
  verified: boolean;
  date: string; // ISO
  userName: string;
  userAvatar?: string | null;
}

export interface ProductoResenasStats {
  total_resenas: number;
  promedio_calificacion: number;
  cinco_estrellas: number;
  cuatro_estrellas: number;
  tres_estrellas: number;
  dos_estrellas: number;
  una_estrella: number;
}

export interface CreateResenaPayload {
  id_producto: number;
  user_id: number;
  calificacion: number;
  comentario?: string;
  verificada?: boolean;
}

// Likes de reseñas
export interface ResenaLikeBackend {
  id_like: number;
  id_resena: number;
  user_id: number;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: number;
    name?: string;
    apellido?: string | null;
    foto_perfil?: string | null;
  } | null;
}

export interface ResenaLike {
  id: number;
  resenaId: number;
  userId: number;
  date: string;
  userName: string;
  userAvatar?: string | null;
}

function mapLikeBackendToFrontend(l: ResenaLikeBackend): ResenaLike {
  const name = [l.user?.name, l.user?.apellido].filter(Boolean).join(' ').trim();
  return {
    id: l.id_like,
    resenaId: l.id_resena,
    userId: l.user_id,
    date: l.created_at || new Date().toISOString(),
    userName: name || 'Usuario',
    userAvatar: l.user?.foto_perfil || null,
  };
}

// Respuestas de reseñas
export interface ResenaRespuestaBackend {
  id_respuesta: number;
  id_resena: number;
  user_id: number;
  respuesta: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: number;
    name?: string;
    apellido?: string | null;
    foto_perfil?: string | null;
  } | null;
}

export interface ResenaRespuesta {
  id: number;
  resenaId: number;
  userId: number;
  message: string;
  date: string;
  userName: string;
  userAvatar?: string | null;
}

function mapRespuestaBackendToFrontend(r: ResenaRespuestaBackend): ResenaRespuesta {
  const name = [r.user?.name, r.user?.apellido].filter(Boolean).join(' ').trim();
  return {
    id: r.id_respuesta,
    resenaId: r.id_resena,
    userId: r.user_id,
    message: r.respuesta,
    date: r.created_at || new Date().toISOString(),
    userName: name || 'Usuario',
    userAvatar: r.user?.foto_perfil || null,
  };
}

function mapBackendToFrontend(r: ResenaBackend): Resena {
  const name = [r.user?.name, r.user?.apellido].filter(Boolean).join(' ').trim();
  return {
    id: r.id_resena,
    productId: r.id_producto,
    userId: r.user_id,
    rating: r.calificacion,
    comment: r.comentario || '',
    verified: !!r.verificada,
    date: r.created_at || new Date().toISOString(),
    userName: name || 'Usuario',
    userAvatar: r.user?.foto_perfil || null,
  };
}

// Obtener reseñas por producto
export async function getByProducto(productoId: number): Promise<Resena[]> {
  const res = await api.get<ResenaBackend[]>(`/v1/resenas/producto/${productoId}`);
  const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
  return (data as ResenaBackend[]).map(mapBackendToFrontend);
}

// Obtener estadísticas de calificación de un producto
export async function getProductoStats(productoId: number): Promise<ProductoResenasStats> {
  const res = await api.get<ProductoResenasStats>(`/v1/resenas/producto/${productoId}/stats`);
  // Algunos controladores devuelven { data: ... }
  const raw = (res.data as any)?.data ?? res.data;
  return {
    total_resenas: Number(raw?.total_resenas || 0),
    promedio_calificacion: Number(raw?.promedio_calificacion || 0),
    cinco_estrellas: Number(raw?.cinco_estrellas || 0),
    cuatro_estrellas: Number(raw?.cuatro_estrellas || 0),
    tres_estrellas: Number(raw?.tres_estrellas || 0),
    dos_estrellas: Number(raw?.dos_estrellas || 0),
    una_estrella: Number(raw?.una_estrella || 0),
  };
}

// Crear reseña
export async function createResena(payload: CreateResenaPayload): Promise<Resena> {
  const res = await api.post<ResenaBackend | ApiResponse<ResenaBackend>>('/v1/resenas', payload);
  const raw = (res.data as any)?.data ?? (res.data as any);
  return mapBackendToFrontend(raw as ResenaBackend);
}

// Actualizar reseña (solo calificación/comentario)
export async function updateResena(id_resena: number, data: Partial<Pick<CreateResenaPayload, 'calificacion' | 'comentario' | 'verificada'>>): Promise<Resena> {
  const res = await api.put<ResenaBackend | ApiResponse<ResenaBackend>>(`/v1/resenas/${id_resena}`, data);
  const raw = (res.data as any)?.data ?? (res.data as any);
  return mapBackendToFrontend(raw as ResenaBackend);
}

// Verificar reseña (admin/moderación)
export async function verifyResena(id_resena: number): Promise<Resena> {
  const res = await api.patch<ResenaBackend | ApiResponse<ResenaBackend>>(`/v1/resenas/${id_resena}/verify`);
  const raw = (res.data as any)?.data ?? (res.data as any);
  return mapBackendToFrontend(raw as ResenaBackend);
}

// Obtener likes de una reseña
export async function getResenaLikes(resenaId: number): Promise<ResenaLike[]> {
  const res = await api.get<ResenaLikeBackend[]>(`/v1/resenas/${resenaId}/likes`);
  const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
  return (data as ResenaLikeBackend[]).map(mapLikeBackendToFrontend);
}

// Verificar si el usuario dio like a una reseña
export async function checkLikeResena(userId: number, resenaId: number): Promise<boolean> {
  const res = await api.get<{ liked: boolean } | ApiResponse<{ liked: boolean }>>(`/v1/resenas/${resenaId}/likes/check/${userId}`);
  const raw = (res.data as any)?.data ?? (res.data as any);
  return !!raw?.liked;
}

// Alternar like en una reseña
export async function toggleLikeResena(userId: number, resenaId: number): Promise<'added' | 'removed'> {
  const res = await api.post<{ action: 'added' | 'removed' } | ApiResponse<{ action: 'added' | 'removed' }>>('/v1/resenas/likes/toggle', {
    user_id: userId,
    id_resena: resenaId,
  });
  const raw = (res.data as any)?.data ?? (res.data as any);
  return (raw?.action || 'added') as 'added' | 'removed';
}

// Obtener respuestas de una reseña
export async function getResenaRespuestas(resenaId: number): Promise<ResenaRespuesta[]> {
  const res = await api.get<ResenaRespuestaBackend[]>(`/v1/resenas/${resenaId}/respuestas`);
  const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];
  return (data as ResenaRespuestaBackend[]).map(mapRespuestaBackendToFrontend);
}

export interface CreateRespuestaPayload {
  user_id: number;
  respuesta: string;
}

// Crear respuesta a una reseña
export async function createRespuesta(resenaId: number, payload: CreateRespuestaPayload): Promise<ResenaRespuesta> {
  const res = await api.post<ResenaRespuestaBackend | ApiResponse<ResenaRespuestaBackend>>(`/v1/resenas/${resenaId}/respuestas`, payload);
  const raw = (res.data as any)?.data ?? (res.data as any);
  return mapRespuestaBackendToFrontend(raw as ResenaRespuestaBackend);
}