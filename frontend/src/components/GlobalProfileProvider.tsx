"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"
import { fetchProfile } from "@/lib/profile"

interface ProfileData {
  name: string
  email: string
  department: string
  studentId: string
  year: string
  profileImage: string | undefined
}

interface GlobalProfileContextType {
  profile: ProfileData
  setProfile: (profile: ProfileData) => void
  isLoading: boolean
  refreshProfile: () => Promise<void>
}

const GlobalProfileContext = createContext<GlobalProfileContextType | undefined>(undefined)

interface GlobalProfileProviderProps {
  children: ReactNode
}

export const GlobalProfileProvider: React.FC<GlobalProfileProviderProps> = ({ children }) => {
  const { user, isInitialized } = useAuth()
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    department: "",
    studentId: "",
    year: "",
    profileImage: undefined,
  })
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const data = await fetchProfile(user.id)
      setProfile({
        name: data.name || "",
        email: data.email || "",
        department: data.department || "",
        studentId: data.student_id || "",
        year: data.year || "",
        profileImage: data.profile_image_url || undefined,
      })
    } catch (error) {
      console.error("프로필 정보 가져오기 실패:", error)
      // 기본값 유지
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // 인증이 초기화되고 사용자 정보가 있을 때만 프로필 로드
    if (isInitialized) {
      if (user?.id) {
        refreshProfile()
      } else {
        // 사용자가 없으면 프로필 초기화
        setProfile({
          name: "",
          email: "",
          department: "",
          studentId: "",
          year: "",
          profileImage: undefined,
        })
        setIsLoading(false)
      }
    }
  }, [user?.id, isInitialized])

  const value: GlobalProfileContextType = {
    profile,
    setProfile,
    isLoading,
    refreshProfile,
  }

  return <GlobalProfileContext.Provider value={value}>{children}</GlobalProfileContext.Provider>
}

export const useGlobalProfile = () => {
  const context = useContext(GlobalProfileContext)
  if (context === undefined) {
    throw new Error("useGlobalProfile must be used within a GlobalProfileProvider")
  }
  return context
}
