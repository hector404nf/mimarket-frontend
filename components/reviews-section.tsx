"use client"

import { useState } from "react"
import Image from "next/image"
import { ThumbsUp, MessageCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import RatingStars from "./rating-stars"
import { reviews } from "@/lib/reviews-data"
import { toast } from "@/components/ui/use-toast"

interface ReviewsSectionProps {
  productId?: number
  storeId?: number
  type: "product" | "store"
}

export default function ReviewsSection({ productId, storeId, type }: ReviewsSectionProps) {
  const [newRating, setNewRating] = useState(0)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtrar reseñas según el tipo
  const filteredReviews = reviews.filter((review) =>
    type === "product" ? review.productId === productId : review.storeId === storeId,
  )

  // Calcular estadísticas
  const totalReviews = filteredReviews.length
  const averageRating =
    totalReviews > 0 ? filteredReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0

  const ratingDistribution = Array.from({ length: 5 }, (_, index) => {
    const rating = 5 - index
    const count = filteredReviews.filter((review) => review.rating === rating).length
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
    return { rating, count, percentage }
  })

  const handleSubmitReview = async () => {
    if (newRating === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona una calificación",
        variant: "destructive",
      })
      return
    }

    if (newComment.trim().length < 10) {
      toast({
        title: "Error",
        description: "El comentario debe tener al menos 10 caracteres",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simular envío de reseña
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "¡Reseña enviada!",
        description: "Tu reseña ha sido publicada correctamente",
      })

      // Limpiar formulario
      setNewRating(0)
      setNewComment("")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar la reseña. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
                Basado en {totalReviews} reseña{totalReviews !== 1 ? "s" : ""}
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
        </CardContent>
      </Card>

      {/* Lista de reseñas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Todas las reseñas ({totalReviews})</h3>

        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aún no hay reseñas. ¡Sé el primero en escribir una!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
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
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Útil ({review.helpful})
                        </Button>
                      </div>
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

// Importar Star desde lucide-react
import { Star } from "lucide-react"
