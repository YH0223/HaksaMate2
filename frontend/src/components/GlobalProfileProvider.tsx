"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { fetchProfile } from '@/lib/profile'

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
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    department: "",
    studentId: "",
    year: "",
    profileImage: undefined
  })
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = async () => {
    if (!user?.id) return

    try {
      setIsLoading(true)
      const data = await fetchProfile(user.id)
      setProfile({
        name: data.name || "",
        email: data.email || "",
        department: data.department || "",
        studentId: data.student_id || "",
        year: data.year || "",
        profileImage: data.profile_image_url || undefined
      })
    } catch (error) {
      console.error('프로필 정보 가져오기 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      refreshProfile()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const value: GlobalProfileContextType = {
    profile,
    setProfile,
    isLoading,
    refreshProfile
  }

  return (
    <GlobalProfileContext.Provider value={value}>
      {children}
    </GlobalProfileContext.Provider>
  )
}

export const useGlobalProfile = () => {
  const context = useContext(GlobalProfileContext)
  if (context === undefined) {
    throw new Error('useGlobalProfile must be used within a GlobalProfileProvider')
  }
  return context
} 