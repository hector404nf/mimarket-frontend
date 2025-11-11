"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ThumbsUp, MessageCircle, Shield, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import RatingStars from "./rating-stars"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import {
  createResena,
  getByProducto,
  getProductoStats,
  ProductoResenasStats,
  Resena,
  getResenaLikes,
  toggleLikeResena,
  getResenaRespuestas,
  createRespuesta,
  ResenaRespuesta,
} from "@/lib/api/resenas"

interface ReviewsSectionProps {
  productId?: number
  storeId?: number
  type?: "product" | "store"
}

export default function ReviewsSection({ productId, storeId, type = "product" }: ReviewsSectionProps) {
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<Resena[]>([])
  const [stats, setStats] = useState<ProductoResenasStats | null>(null)
  const { user, isAuthenticated } = useAuth()
  // Likes y respuestas por reseña
  const [likesCount, setLikesCount] = useState<Record<number, number>>({})
  const [liked, setLiked] = useState<Record<number, boolean>>({})
  const [repliesOpen, setRepliesOpen] = useState<Record<number, boolean>>({})
  const [replies, setReplies] = useState<Record<number, ResenaRespuesta[]>>({})
  const [replyText, setReplyText] = useState<Record<number, string>>({})
  const [isReplySubmitting, setIsReplySubmitting] = useState<Record<number, boolean>>({})

  // Cargar reseñas reales desde backend (solo para producto)
  useEffect(() => {
    const load = async () => {
      if (type !== "product" || !productId) return
      try {
        setIsLoading(true)
        const [list, s] = await Promise.all([
          getByProducto(productId),
          getProductoStats(productId),
        ])
        setItems(list)
        setStats(s)
      } catch (err) {
        toast.error("No se pudieron cargar las reseñas")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [productId, type])

  // Cargar likes por reseña tras obtener items
  useEffect(() => {
    const loadLikes = async () => {
      if (!items.length) return
      try {
        const all = await Promise.all(items.map((r) => getResenaLikes(r.id)))
        const counts: Record<number, number> = {}
        const likedMap: Record<number, boolean> = {}
        items.forEach((r, idx) => {
          const list = all[idx]
          counts[r.id] = list.length
          likedMap[r.id] = !!(user?.id && list.some((l) => l.userId === user.id))
        })
        setLikesCount(counts)
        setLiked(likedMap)
      } catch (err) {
        // silencioso
      }
    }
    loadLikes()
  }, [items, user?.id])

  // Calcular estadísticas
  const totalReviews = stats?.total_resenas ?? items.length
  const averageRating = stats?.promedio_calificacion ?? (items.length > 0
    ? items.reduce((sum, r) => sum + r.rating, 0) / items.length
    : 0)

  const ratingDistribution = useMemo(() => {
    const byStar = {
      5: stats?.cinco_estrellas ?? items.filter(r => r.rating === 5).length,
      4: stats?.cuatro_estrellas ?? items.filter(r => r.rating === 4).length,
      3: stats?.tres_estrellas ?? items.filter(r => r.rating === 3).length,
      2: stats?.dos_estrellas ?? items.filter(r => r.rating === 2).length,
      1: stats?.una_estrella ?? items.filter(r => r.rating === 1).length,
    } as Record<number, number>
    return [5,4,3,2,1].map(rating => {
      const count = byStar[rating] || 0
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
      return { rating, count, percentage }
    })
  }, [stats, items, totalReviews])

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      toast.error("Por favor selecciona una calificación")
      return
    }

    if (newComment.trim().length < 10) {
      toast.error("El comentario debe tener al menos 10 caracteres")
      return
    }

    if (!isAuthenticated || !user?.id) {
      toast.error("Debes iniciar sesión para publicar una reseña")
      return
    }

    setIsSubmitting(true)

    try {
      if (type !== "product" || !productId) {
        toast.error("Solo se admiten reseñas de productos en esta sección")
        return
      }

      await createResena({
        id_producto: productId,
        user_id: user.id,
        calificacion: newRating,
        comentario: newComment.trim(),
      })

      toast.success("¡Reseña enviada!")

      // Recargar lista y estadísticas
      const [list, s] = await Promise.all([
        getByProducto(productId),
        getProductoStats(productId),
      ])
      setItems(list)
      setStats(s)

      // Limpiar formulario
      setNewRating(0)
      setNewComment("")
    } catch (error) {
      toast.error("No se pudo enviar la reseña. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleLike = async (resenaId: number) => {
    if (!isAuthenticated || !user?.id) {
      toast.error("Debes iniciar sesión para dar 'me gusta'")
      return
    }
    try {
      const action = await toggleLikeResena(user.id, resenaId)
      setLiked((prev) => ({ ...prev, [resenaId]: action === "added" }))
      setLikesCount((prev) => ({
        ...prev,
        [resenaId]: Math.max(0, (prev[resenaId] || 0) + (action === "added" ? 1 : -1)),
      }))
      toast.success(action === "added" ? "Marcaste la reseña como útil" : "Quitaste tu me gusta")
    } catch (err) {
      toast.error("No se pudo actualizar tu me gusta")
    }
  }

  const toggleReplies = async (resenaId: number) => {
    const isOpen = !!repliesOpen[resenaId]
    const next = !isOpen
    setRepliesOpen((prev) => ({ ...prev, [resenaId]: next }))
    if (next && !replies[resenaId]) {
      try {
        const list = await getResenaRespuestas(resenaId)
        setReplies((prev) => ({ ...prev, [resenaId]: list }))
      } catch (err) {
        toast.error("No se pudieron cargar las respuestas")
      }
    }
  }

  const handleReplySubmit = async (resenaId: number) => {
    if (!isAuthenticated || !user?.id) {
      toast.error("Debes iniciar sesión para responder")
      return
    }
    const text = (replyText[resenaId] || "").trim()
    if (text.length < 3) {
      toast.error("La respuesta es muy corta")
      return
    }
    setIsReplySubmitting((prev) => ({ ...prev, [resenaId]: true }))
    try {
      await createRespuesta(resenaId, { user_id: user.id, respuesta: text })
      toast.success("Respuesta publicada")
      setReplyText((prev) => ({ ...prev, [resenaId]: "" }))
      const list = await getResenaRespuestas(resenaId)
      setReplies((prev) => ({ ...prev, [resenaId]: list }))
    } catch (err) {
      toast.error("No se pudo publicar la respuesta")
    } finally {
      setIsReplySubmitting((prev) => ({ ...prev, [resenaId]: false }))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Resumen de calificaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Reseñas y calificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calificación promedio */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
              <RatingStars rating={averageRating} size="lg" />
              <p className="text-muted-foreground mt-2">
                {isLoading ? 'Cargando reseñas…' : (
                  <>Basado en {totalReviews} reseña{totalReviews !== 1 ? "s" : ""}</>
                )}
              </p>
            </div>

            {/* Distribución de calificaciones */}
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario para nueva reseña */}
      <Card>
        <CardHeader>
          <CardTitle>Escribir una reseña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Tu calificación</label>
            <RatingStars rating={newRating} size="lg" interactive onRatingChange={setNewRating} />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Tu comentario</label>
            <Textarea
              placeholder={`Comparte tu experiencia con este ${type === "product" ? "producto" : "tienda"}...`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">Mínimo 10 caracteres ({newComment.length}/10)</p>
          </div>

          <Button
            onClick={handleSubmitReview}
            disabled={isSubmitting || newRating === 0 || newComment.trim().length < 10}
            className="w-full"
          >
            {isSubmitting ? "Enviando..." : "Publicar reseña"}
          </Button>
          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground text-center">Debes iniciar sesión para publicar reseñas.</p>
          )}
        </CardContent>
      </Card>

      {/* Lista de reseñas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Todas las reseñas ({totalReviews})</h3>

        {items.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aún no hay reseñas. ¡Sé el primero en escribir una!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="relative h-10 w-10 flex-shrink-0">
                      <Image
                        src={review.userAvatar || "/placeholder.svg"}
                        alt={review.userName}
                        fill
                        className="object-cover rounded-full"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{review.userName}</h4>
                          {review.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDate(review.date)}</span>
                      </div>

                      <RatingStars rating={review.rating} size="sm" />

                      <p className="text-sm leading-relaxed">{review.comment}</p>

                      <div className="flex items-center gap-4 pt-2">
                        <Button
                          variant={liked[review.id] ? "outline" : "ghost"}
                          size="sm"
                          className={liked[review.id]
                            ? "text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100"
                            : "text-muted-foreground"}
                          onClick={() => handleToggleLike(review.id)}
                        >
                          <ThumbsUp className={liked[review.id] ? "h-3 w-3 mr-1 text-blue-600" : "h-3 w-3 mr-1"} />
                          {liked[review.id] ? "Te gusta" : "Útil"}
                          <span className="ml-1 text-xs text-muted-foreground">({likesCount[review.id] || 0})</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => toggleReplies(review.id)}
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Responder
                        </Button>
                      </div>

                      {repliesOpen[review.id] && (
                        <div className="mt-3 space-y-3">
                          <div className="space-y-2">
                            {(replies[review.id] || []).map((resp) => (
                              <div key={resp.id} className="flex gap-2">
                                <div className="relative h-6 w-6 flex-shrink-0">
                                  <Image
                                    src={resp.userAvatar || "/placeholder.svg"}
                                    alt={resp.userName}
                                    fill
                                    className="object-cover rounded-full"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{resp.userName}</span>
                                    <span className="text-xs text-muted-foreground">{formatDate(resp.date)}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{resp.message}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2">
                            <Textarea
                              placeholder="Escribe una respuesta…"
                              value={replyText[review.id] || ""}
                              onChange={(e) => setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))}
                              className="min-h-[60px] resize-none"
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleReplySubmit(review.id)}
                                disabled={!!isReplySubmitting[review.id]}
                              >
                                {isReplySubmitting[review.id] ? "Enviando…" : "Responder"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
