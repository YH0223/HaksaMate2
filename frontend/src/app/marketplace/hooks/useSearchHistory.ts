"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { SearchHistory, SearchSuggestion } from "../types"

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addSearchHistory = useCallback(async (userId: string, keyword: string) => {
    if (!userId || !keyword || !keyword.trim()) {
      throw new Error("사용자 ID와 키워드는 필수입니다.")
    }

    setIsLoading(true)
    setError(null)

    try {
      // 기존에 같은 키워드가 있는지 확인
      const { data: existingHistory } = await supabase
        .from("search_history")
        .select("id")
        .eq("profile_id", userId)
        .eq("keyword", keyword.trim())
        .single()

      if (existingHistory) {
        // 기존 기록이 있으면 삭제 후 새로 추가 (최신 순서로 정렬하기 위해)
        await supabase.from("search_history").delete().eq("id", existingHistory.id)
      }

      // 새로운 검색 기록 추가
      const { data, error } = await supabase
        .from("search_history")
        .insert({
          profile_id: userId,
          keyword: keyword.trim(),
        })
        .select()
        .single()

      if (error) throw error

      // 로컬 상태 업데이트
      setSearchHistory((prev) => [data, ...prev.filter((h) => h.keyword !== keyword.trim())])

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "검색 기록 저장에 실패했습니다."
      setError(errorMessage)
      console.error("Add search history error:", err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getSearchHistory = useCallback(async (userId: string) => {
    if (!userId || !userId.trim()) {
      setSearchHistory([])
      return []
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("search_history")
        .select("*")
        .eq("profile_id", userId)
        .order("search_at", { ascending: false })
        .limit(50) // 최근 50개만 가져오기

      if (error) throw error

      const validHistory = Array.isArray(data) ? data : []
      setSearchHistory(validHistory)
      return validHistory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "검색 기록 조회에 실패했습니다."
      setError(errorMessage)
      console.error("Get search history error:", err)
      setSearchHistory([])
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteSearchHistory = useCallback(async (historyId: string) => {
    if (!historyId || !historyId.trim()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("search_history").delete().eq("id", historyId)

      if (error) throw error

      // 로컬 상태에서 제거
      setSearchHistory((prev) => prev.filter((h) => h.id !== historyId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "검색 기록 삭제에 실패했습니다."
      setError(errorMessage)
      console.error("Delete search history error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getSuggestions = useCallback(async (userId: string, keyword: string) => {
    if (!userId || !keyword || !keyword.trim()) {
      setSuggestions([])
      return []
    }

    setIsLoading(true)
    setError(null)

    try {
      // 키워드를 포함하는 검색 기록을 찾아서 제안으로 사용
      const { data, error } = await supabase
        .from("search_history")
        .select("keyword")
        .eq("profile_id", userId)
        .ilike("keyword", `%${keyword.trim()}%`)
        .order("search_at", { ascending: false })
        .limit(10)

      if (error) throw error

      // 중복 제거 및 빈도수 계산
      const keywordCount = new Map<string, number>()

      data?.forEach((item) => {
        const count = keywordCount.get(item.keyword) || 0
        keywordCount.set(item.keyword, count + 1)
      })

      const suggestions: SearchSuggestion[] = Array.from(keywordCount.entries())
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count) // 빈도수 높은 순으로 정렬

      setSuggestions(suggestions)
      return suggestions
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "검색 제안 조회에 실패했습니다."
      setError(errorMessage)
      console.error("Get suggestions error:", err)
      setSuggestions([])
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearSearchHistory = useCallback(async (userId: string) => {
    if (!userId || !userId.trim()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("search_history").delete().eq("profile_id", userId)

      if (error) throw error

      setSearchHistory([])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "검색 기록 전체 삭제에 실패했습니다."
      setError(errorMessage)
      console.error("Clear search history error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    searchHistory,
    suggestions,
    isLoading,
    error,
    addSearchHistory,
    getSearchHistory,
    deleteSearchHistory,
    getSuggestions,
    clearSearchHistory,
  }
}
