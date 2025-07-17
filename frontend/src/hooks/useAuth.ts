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
    console.log(`🔍 [fetchUserProfile] 프로필 조회 시작: userId=${userId}, email=${email}`)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("프로필 조회 타임아웃 (2초)")), 2000),
    ) // 5초 타임아웃

    try {
      console.log(`➡️ [fetchUserProfile] Supabase 쿼리 실행 직전: profiles.select('name').eq('id', ${userId})`)
      const { data: profile, error } = await Promise.race([
        supabase.from("profiles").select("name").eq("id", userId).maybeSingle(),
        timeoutPromise,
      ])
      console.log(`⬅️ [fetchUserProfile] Supabase 쿼리 실행 직후. data:`, profile, `error:`, error)

      if (error) {
        console.error("❌ [fetchUserProfile] Supabase 프로필 조회 실패:", error.message)
        return { id: userId, email }
      }

      if (profile) {
        console.log("✅ [fetchUserProfile] 프로필 조회 성공:", profile)
        return {
          id: userId,
          email,
          name: profile.name || undefined,
        }
      } else {
        console.log("ℹ️ [fetchUserProfile] 프로필 데이터 없음. 기본 사용자 정보 반환.")
        return { id: userId, email }
      }
    } catch (e: any) {
      console.error("❌ [fetchUserProfile] 프로필 조회 중 예외 발생:", e.message || e)
      // 타임아웃 또는 다른 예외 발생 시에도 기본 사용자 정보 반환
      return { id: userId, email }
    }
  }, [])

  const processSession = useCallback(
    async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
      console.log("➡️ [processSession] 호출됨")
      if (!supabaseUser?.email) {
        console.log("➡️ [processSession] Supabase 사용자 또는 이메일 없음. null 반환.")
        return null
      }
      const basicUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email,
      }
      try {
        console.log("➡️ [processSession] fetchUserProfile 호출 전")
        const profile = await fetchUserProfile(supabaseUser.id, supabaseUser.email)
        console.log("⬅️ [processSession] fetchUserProfile 완료. 결과:", profile)
        return profile
      } catch (error) {
        console.warn("⚠️ [processSession] 내 프로필 조회 실패. 기본 정보로 진행", error)
        return basicUser // 무조건 리턴해서 흐름 중단 방지
      }
    },
    [fetchUserProfile],
  )

  // 초기 세션 확인
  const initializeAuth = useCallback(async () => {
    try {
      console.log("🔐 [initializeAuth] 인증 초기화 시작")
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      console.log("✅ [initializeAuth] getSession 응답:", { session, error })

      if (error) {
        console.error("❌ [initializeAuth] 세션 확인 실패:", error)
        setAuthState({
          user: null,
          isLoading: false,
          isInitialized: true,
        })
        return
      }

      console.log("➡️ [initializeAuth] processSession 호출 전")
      const user = await processSession(session?.user || null)
      console.log("✅ [initializeAuth] processSession 결과:", user)

      setAuthState({
        user,
        isLoading: false,
        isInitialized: true,
      })
      console.log("✅ [initializeAuth] 인증 초기화 완료:", { hasUser: !!user, userId: user?.id })
    } catch (error) {
      console.error("❌ [initializeAuth] 인증 초기화 중 오류:", error)
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
      console.log("🔄 [handleAuthChange] 인증 상태 변화:", event)
      try {
        console.log("🟡 [handleAuthChange] processSession 호출 전", session)
        console.log("🟡 [handleAuthChange] session.user:", session?.user)
        const user = await processSession(session?.user || null)
        console.log("🟢 [handleAuthChange] processSession 완료:", user)

        setAuthState((prev) => ({
          ...prev,
          user,
          isLoading: false,
        }))
        console.log("✅ [handleAuthChange] 인증 상태 업데이트 완료:", { event, hasUser: !!user })
      } catch (error) {
        console.error("❌ [handleAuthChange] 인증 상태 변화 처리 중 오류:", error)
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
      console.log("🚪 [logout] 로그아웃 시작")
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setAuthState({
        user: null,
        isLoading: false,
        isInitialized: true,
      })
      console.log("✅ [logout] 로그아웃 완료")
    } catch (error) {
      console.error("❌ [logout] 로그아웃 실패:", error)
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
