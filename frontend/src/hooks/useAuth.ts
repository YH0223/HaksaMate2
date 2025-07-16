"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface User {
  id: string
  email: string
  name?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isInitialized: false,
  })

  // 사용자 프로필 조회 (별도 함수로 분리)
  const fetchUserProfile = useCallback(async (userId: string, email: string): Promise<User> => {
    try {
      const { data: profile, error } = await supabase.from("profiles").select("name").eq("id", userId).single()

      if (error) {
        console.warn("프로필 조회 실패, 기본 정보 사용:", error.message)
        return { id: userId, email }
      }

      return {
        id: userId,
        email,
        name: profile?.name || undefined,
      }
    } catch (error) {
      console.warn("프로필 조회 중 예외 발생, 기본 정보 사용:", error)
      return { id: userId, email }
    }
  }, [])

  // 세션에서 사용자 정보 추출
  const processSession = useCallback(
    async (supabaseUser: SupabaseUser | null) => {
      if (!supabaseUser?.email) {
        return null
      }

      // 기본 사용자 정보 먼저 반환
      const basicUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email,
      }

      try {
        // 프로필 정보 조회 (실패해도 기본 정보 유지)
        const userWithProfile = await fetchUserProfile(supabaseUser.id, supabaseUser.email)
        return userWithProfile
      } catch (error) {
        console.warn("프로필 조회 실패, 기본 정보 반환:", error)
        return basicUser
      }
    },
    [fetchUserProfile],
  )

  // 초기 세션 확인
  const initializeAuth = useCallback(async () => {
    try {
      console.log("🔐 인증 초기화 시작")

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("세션 확인 실패:", error)
        setAuthState({
          user: null,
          isLoading: false,
          isInitialized: true,
        })
        return
      }

      const user = await processSession(session?.user || null)

      setAuthState({
        user,
        isLoading: false,
        isInitialized: true,
      })

      console.log("✅ 인증 초기화 완료:", { hasUser: !!user, userId: user?.id })
    } catch (error) {
      console.error("인증 초기화 중 오류:", error)
      setAuthState({
        user: null,
        isLoading: false,
        isInitialized: true,
      })
    }
  }, [processSession])

  // 인증 상태 변화 처리
  const handleAuthChange = useCallback(
    async (event: string, session: any) => {
      console.log("🔄 인증 상태 변화:", event)

      try {
        const user = await processSession(session?.user || null)

        setAuthState((prev) => ({
          ...prev,
          user,
          isLoading: false,
        }))

        console.log("✅ 인증 상태 업데이트 완료:", { event, hasUser: !!user })
      } catch (error) {
        console.error("인증 상태 변화 처리 중 오류:", error)
        setAuthState((prev) => ({
          ...prev,
          user: null,
          isLoading: false,
        }))
      }
    },
    [processSession],
  )

  useEffect(() => {
    // 초기화
    initializeAuth()

    // 인증 상태 변화 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange)

    return () => {
      subscription.unsubscribe()
    }
  }, [initializeAuth, handleAuthChange])

  // 로그아웃 함수
  const logout = useCallback(async () => {
    try {
      console.log("🚪 로그아웃 시작")
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setAuthState({
        user: null,
        isLoading: false,
        isInitialized: true,
      })

      console.log("✅ 로그아웃 완료")
    } catch (error) {
      console.error("로그아웃 실패:", error)
      throw error
    }
  }, [])

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    isInitialized: authState.isInitialized,
    logout,
  }
}
