"use client"

import { useState, useCallback } from "react"
import type { Product, CreateProductRequest, UpdateProductRequest, SearchFilters,SearchResult } from "../types"
import { supabase } from "@/lib/supabaseClient"
import {useAuth} from "@/hooks/useAuth"
import {fetchProfile} from "@/lib/profile"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const useMarketplace = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [isMarketplaceLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const {user}=useAuth()
  const loadProducts = useCallback(async (userId?: string, filters?: SearchFilters) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("📦 상품 목록 요청 시작 (클라이언트 필터링)")

      // 모든 상품을 가져옵니다. (필터링 파라미터 없이)
      const response = await fetch(`${API_BASE_URL}/api/items`)
      if (!response.ok) throw new Error("상품 목록 조회에 실패했습니다.")

      const allProducts: Product[] = await response.json()
      console.log("✅ 모든 상품 응답:", allProducts)

      let likedMap: Record<number, boolean> = {}
      let likeCountMap: Record<number, number> = {}

      if (userId) {
        console.log("❤️ 좋아요 상태 요청:", `${API_BASE_URL}/api/likes/my?userId=${userId}`)
        const likesRes = await fetch(`${API_BASE_URL}/api/likes/my?userId=${userId}`)
        if (likesRes.ok) {
          const likes = await likesRes.json()
          console.log("✅ 좋아요 목록 응답:", likes)

          likedMap = Object.fromEntries(likes.map((item: { itemid: number }) => [item.itemid, true]))
          likeCountMap = Object.fromEntries(
            likes.map((item: { itemid: number; likeCount: number }) => [item.itemid, item.likeCount]),
          )
        } else {
          console.warn("⚠️ 좋아요 상태 조회 실패:", likesRes.status)
        }
      }

      // 좋아요 정보 병합
      const productsWithLikes = allProducts.map((product) => ({
        ...product,
        isLiked: likedMap[product.itemid] || false,
        likeCount: likeCountMap[product.itemid] ?? 0,
      }))

      // 클라이언트 측 필터링 적용
      let filteredProducts = productsWithLikes
      if (filters?.category && filters.category !== "all") {
        filteredProducts = filteredProducts.filter((product) => product.category === filters.category)
        console.log(`➡️ 카테고리 필터링 적용: ${filters.category}, 결과: ${filteredProducts.length}개`)
      }

      setProducts(filteredProducts)
      return filteredProducts
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "상품 목록 조회에 실패했습니다."
      console.error("❌ 에러 발생:", errorMessage)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  
  
  
  

const searchProducts = useCallback(
  async (
    userId:String|undefined,
    keyword: string,
    filters?: SearchFilters,
    page = 1,
    limit = 20
  ): Promise<SearchResult> => {
    setIsLoading(true)
    setError(null)

    try {
      let query = supabase.from("item").select("*", { count: "exact" })

      if (keyword && keyword.trim()) {
        const searchTerm = keyword.trim()
        const orCondition = `title.ilike.*${searchTerm}*,description.ilike.*${searchTerm}*`
        query = query.or(orCondition, { foreignTable: undefined })
      }

      if (filters?.category && filters.category !== "all") {
        query = query.eq("category", filters.category)
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice)
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice)
      }

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: items, error, count } = await query
      if (error) throw error

      const itemIds = items.map((item) => item.itemid)

      // 이미지 조회
      const { data: imageData, error: imageError } = await supabase
        .from("item_images")
        .select("item_itemid, photo_path")
        .in("item_itemid", itemIds)
      if (imageError) throw imageError

      const imageMap = new Map<number, string[]>()
      imageData?.forEach(({ item_itemid, photo_path }) => {
        const list = imageMap.get(item_itemid) ?? []
        list.push(photo_path)
        imageMap.set(item_itemid, list)
      })

      // ✅ 로그인 사용자 ID 필요
      const currentUserId =  userId// 직접 구현한 함수 또는 context에서 가져오기
      
      // 좋아요 정보 병합
      const productsWithAll: Product[] = await Promise.all(
        items.map(async (item) => {
          const images = imageMap.get(item.itemid) ?? []

          // 좋아요 개수
          const likeCountRes = await fetch(`${API_BASE_URL}/api/likes/${item.itemid}/count`)
          const likeCount = likeCountRes.ok ? await likeCountRes.json() : 0

          // isLiked
          let isLiked = false
          console.log("현재유저:@@@@",currentUserId)
          if (currentUserId) {
            const isLikedRes = await fetch(
              `${API_BASE_URL}/api/likes/${item.itemid}/is-liked?userId=${currentUserId}`
            )
            isLiked = isLikedRes.ok ? await isLikedRes.json() : false
          }
          const sellerprofile=await fetchProfile(item.seller_id)
          return {
            ...item,
            sellerId: item.seller_id,
            buyerId: item.buyer_id,
            sellerName:sellerprofile.name,
            completedDate: item.completed_date,
            meetLocation: {
              address: item.meet_location_address ?? "",
              lat: item.meet_location_lat ?? 0,
              lng: item.meet_location_lng ?? 0,
            },
            itemImages: images,
            imageUrl: images[0] ?? "",
            isLiked,
            likeCount,
          } as Product
        })
      )

      const result: SearchResult = {
        products: productsWithAll,
        total: count || 0,
        page,
        limit,
      }

      setProducts(result.products)
      setTotal(result.total)

      return result
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "상품 검색에 실패했습니다."
      setError(errorMessage)
      console.error("❗ 검색 오류:", err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  },
  []
)

  

  const getProduct = useCallback(async (id: number): Promise<Product | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${id}`)

      if (!response.ok) {
        throw new Error("상품 조회에 실패했습니다.")
      }

      const product = await response.json()
      return product
    } catch (err) {
      console.error("상품 조회 실패:", err)
      return null
    }
  }, [])

  const createProduct = useCallback(async (data: CreateProductRequest, images: File[]) => {
    setIsLoading(true)
    setError(null)
  
    try {
      const formData = new FormData()
      formData.append("item", new Blob([JSON.stringify(data)], { type: "application/json" }))  // ✅ JSON은 Blob으로 명시적으로 설정
      images.forEach((image) => {
        formData.append("images", image)
      })
          // ✅ 콘솔로 확인
      console.log("🟢 전송되는 FormData:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value)
      }
      const response = await fetch(`${API_BASE_URL}/api/items`, {
        method: "POST",
        body: formData,
      })
  
      if (!response.ok) {
        throw new Error("상품 등록에 실패했습니다.")
      }
  
      const product = await response.json()
      setProducts((prev) => [product, ...prev])
      return product
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "상품 등록에 실패했습니다."
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])
  
  const updateProduct = useCallback(async (id: number, data: UpdateProductRequest, images?: File[]) => {
    setIsLoading(true)
    setError(null)
  
    try {
      const formData = new FormData()
  
      // 🔥 JSON 데이터는 반드시 Blob으로, 필드 이름은 "item"
      formData.append("item", new Blob([JSON.stringify(data)], { type: "application/json" }))
  
      if (images) {
        images.forEach((image) => {
          formData.append("images", image)
        })
      }
  
      const response = await fetch(`${API_BASE_URL}/api/items/${id}`, {
        method: "PUT",
        body: formData,
      })
  
      if (!response.ok) {
        throw new Error("상품 수정에 실패했습니다.")
      }
  
      const updatedProduct = await response.json()
      setProducts((prev) =>
        prev.map((product) => (product.itemid === id ? updatedProduct : product)),
      )
      return updatedProduct
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "상품 수정에 실패했습니다."
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])
  

  const deleteProduct = useCallback(async (itemId: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("상품 삭제에 실패했습니다.")
      }

      setProducts((prev) => prev.filter((product) => product.itemid !== itemId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "상품 삭제에 실패했습니다."
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const likeProduct = useCallback(async (itemId: number, userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/${itemId}?userId=${userId}`, {
        method: "POST",
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("응답 실패:", errorText);
        throw new Error("찜하기에 실패했습니다.");
      }
  
      // 응답이 body 없는 구조이므로 JSON 파싱 생략
      setProducts((prev) =>
        prev.map((product) =>
          product.itemid === itemId
            ? {
                ...product,
                isLiked: true,
                likeCount: product.likeCount + 1, // 혹시 정확한 값이 필요하면 count API 따로 호출
              }
            : product,
        ),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "찜하기에 실패했습니다.";
      console.error("에러 발생:", errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const unlikeProduct = useCallback(async (itemId: number, userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/${itemId}?userId=${userId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error("응답 실패:", errorText);
        throw new Error("찜해제에 실패했습니다.");
      }
  
      // 응답이 body 없는 구조이므로 JSON 파싱 생략
      setProducts((prev) =>
        prev.map((product) =>
          product.itemid === itemId
            ? {
                ...product,
                isLiked: false,
                likeCount: product.likeCount - 1, // 혹시 정확한 값이 필요하면 count API 따로 호출
              }
            : product,
        ),
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "찜 해제에 실패했습니다.";
      console.error("에러 발생:", errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);
    // toggleLike 함수 추가 - 현재 상태에 따라 like/unlike 결정
    const toggleLike = useCallback(
      async (itemId: number, userId: string) => {
        const product = products.find((p) => p.itemid === itemId)
        if (!product) {
          throw new Error("상품을 찾을 수 없습니다.")
        }
  
        if (product.isLiked) {
          return await unlikeProduct(itemId, userId)
        } else {
          return await likeProduct(itemId, userId)
        }
      },
      [products, likeProduct, unlikeProduct],
    )
  
  const updateProductStatus = useCallback(async (itemId: number, status: "판매중" | "예약중" | "거래완료") => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${itemId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("상품 상태 변경에 실패했습니다.")
      }

      const updatedProduct = await response.json()
      setProducts((prev) => prev.map((product) => (product.itemid === itemId ? { ...product, status } : product)))
      return updatedProduct
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "상품 상태 변경에 실패했습니다."
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])


  const completeTransaction = useCallback(async (itemId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${itemId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("거래 완료 처리에 실패했습니다.")
      }

      // 상품 목록에서 해당 상품의 상태를 거래완료로 업데이트
      setProducts((prev) =>
        prev.map((product) => (product.itemid === itemId ? { ...product, status: "거래완료" as const } : product)),
      )

      return await response.text() // "거래 완료 처리되었습니다." 메시지
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "거래 완료 처리에 실패했습니다."
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  return {
    products,
    isMarketplaceLoading,
    error,
    loadProducts,
    searchProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    likeProduct,
    unlikeProduct,
    updateProductStatus,
    completeTransaction,
    toggleLike,
  }
}
