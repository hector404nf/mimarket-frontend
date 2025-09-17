"use client"

import { useCallback } from "react"

export interface UserBehavior {
  productViews: Array<{
    productId: number
    timestamp: number
    duration: number
    source: string
  }>
  storeViews: Array<{
    storeId: number
    timestamp: number
    duration: number
  }>
  searches: Array<{
    query: string
    timestamp: number
    results: number
  }>
  cartActions: Array<{
    action: "add" | "remove"
    productId: number
    timestamp: number
  }>
  clicks: Array<{
    productId: number
    timestamp: number
    source: string
  }>
}

export function useBehaviorTracking() {
  const getBehaviorData = useCallback((): UserBehavior => {
    if (typeof window === "undefined") {
      return {
        productViews: [],
        storeViews: [],
        searches: [],
        cartActions: [],
        clicks: [],
      }
    }

    const stored = localStorage.getItem("user-behavior")
    if (!stored) {
      return {
        productViews: [],
        storeViews: [],
        searches: [],
        cartActions: [],
        clicks: [],
      }
    }

    try {
      return JSON.parse(stored)
    } catch {
      return {
        productViews: [],
        storeViews: [],
        searches: [],
        cartActions: [],
        clicks: [],
      }
    }
  }, [])

  const saveBehaviorData = useCallback((data: UserBehavior) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user-behavior", JSON.stringify(data))
    }
  }, [])

  const trackProductView = useCallback(
    (productId: number, source = "unknown") => {
      const behavior = getBehaviorData()
      const startTime = Date.now()

      // Track when user leaves the page
      const handleBeforeUnload = () => {
        const duration = Date.now() - startTime
        behavior.productViews.push({
          productId,
          timestamp: startTime,
          duration,
          source,
        })

        // Keep only last 100 views
        if (behavior.productViews.length > 100) {
          behavior.productViews = behavior.productViews.slice(-100)
        }

        saveBehaviorData(behavior)
      }

      window.addEventListener("beforeunload", handleBeforeUnload)

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload)
        handleBeforeUnload()
      }
    },
    [getBehaviorData, saveBehaviorData],
  )

  const trackStoreView = useCallback(
    (storeId: number) => {
      const behavior = getBehaviorData()
      const startTime = Date.now()

      const handleBeforeUnload = () => {
        const duration = Date.now() - startTime
        behavior.storeViews.push({
          storeId,
          timestamp: startTime,
          duration,
        })

        if (behavior.storeViews.length > 50) {
          behavior.storeViews = behavior.storeViews.slice(-50)
        }

        saveBehaviorData(behavior)
      }

      window.addEventListener("beforeunload", handleBeforeUnload)

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload)
        handleBeforeUnload()
      }
    },
    [getBehaviorData, saveBehaviorData],
  )

  const trackSearch = useCallback(
    (query: string, results: number) => {
      const behavior = getBehaviorData()
      behavior.searches.push({
        query,
        timestamp: Date.now(),
        results,
      })

      if (behavior.searches.length > 50) {
        behavior.searches = behavior.searches.slice(-50)
      }

      saveBehaviorData(behavior)
    },
    [getBehaviorData, saveBehaviorData],
  )

  const trackCartAction = useCallback(
    (action: "add" | "remove", productId: number) => {
      const behavior = getBehaviorData()
      behavior.cartActions.push({
        action,
        productId,
        timestamp: Date.now(),
      })

      if (behavior.cartActions.length > 100) {
        behavior.cartActions = behavior.cartActions.slice(-100)
      }

      saveBehaviorData(behavior)
    },
    [getBehaviorData, saveBehaviorData],
  )

  const trackProductClick = useCallback(
    (productId: number, source: string) => {
      const behavior = getBehaviorData()
      behavior.clicks.push({
        productId,
        timestamp: Date.now(),
        source,
      })

      if (behavior.clicks.length > 100) {
        behavior.clicks = behavior.clicks.slice(-100)
      }

      saveBehaviorData(behavior)
    },
    [getBehaviorData, saveBehaviorData],
  )

  return {
    getBehaviorData,
    trackProductView,
    trackStoreView,
    trackSearch,
    trackCartAction,
    trackProductClick,
  }
}
