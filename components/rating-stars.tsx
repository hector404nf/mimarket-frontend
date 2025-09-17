"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onRatingChange?: (rating: number) => void
}

export default function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
}: RatingStarsProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, index) => {
        const starRating = index + 1
        const isFilled = starRating <= rating
        const isHalfFilled = starRating - 0.5 <= rating && starRating > rating

        return (
          <button
            key={index}
            type="button"
            className={cn(
              "relative",
              interactive && "hover:scale-110 transition-transform cursor-pointer",
              !interactive && "cursor-default",
            )}
            onClick={() => handleStarClick(starRating)}
            disabled={!interactive}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled || isHalfFilled ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200",
              )}
            />
            {isHalfFilled && (
              <Star
                className={cn(sizeClasses[size], "absolute top-0 left-0 fill-yellow-400 text-yellow-400")}
                style={{
                  clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)",
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
