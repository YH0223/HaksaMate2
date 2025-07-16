"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children, fallback, redirectTo = "/auth/login" }) => {
  const { user, isLoading, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 초기화가 완료되고 사용자가 없으면 리다이렉트
    if (isInitialized && !isLoading && !user) {
      console.log("🔒 인증되지 않은 사용자 - 리다이렉트:", redirectTo)
      router.replace(redirectTo)
    }
  }, [user, isLoading, isInitialized, router, redirectTo])

  // 로딩 중이거나 초기화되지 않았으면 로딩 화면
  if (!isInitialized || isLoading) {
    return fallback || <AuthLoadingScreen />
  }

  // 사용자가 없으면 빈 화면 (리다이렉트 진행 중)
  if (!user) {
    return fallback || <AuthLoadingScreen />
  }

  // 인증된 사용자면 자식 컴포넌트 렌더링
  return <>{children}</>
}

const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">인증 확인 중...</h2>
      <p className="text-gray-600">잠시만 기다려주세요.</p>
    </div>
  </div>
)
