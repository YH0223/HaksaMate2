"use client"

import { useState, useEffect } from "react"
import { MapPin, Users, Wifi, WifiOff, RefreshCw, Eye, EyeOff } from "lucide-react"
import { useLocationShare, type LocationData } from "../hooks/useLocationShare"

interface LocationSharingControlsProps {
  userId?: string
  isDarkMode: boolean
  onNearbyUsersUpdate: (users: LocationData[]) => void
}

export function LocationSharingControls({ userId, isDarkMode, onNearbyUsersUpdate }: LocationSharingControlsProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    nearbyUsers,
    isConnected,
    isSharing,
    startLocationSharing,
    stopLocationSharing,
    refreshNearbyUsers,
  } = useLocationShare(userId)

  // 컴포넌트 진입 시 자동 위치 공유 시작
  useEffect(() => {
    if (userId && isConnected && !isSharing) {
      startLocationSharing(isVisible)
    }
  }, [userId, isConnected, isSharing, isVisible, startLocationSharing])

  // 근처 사용자 업데이트를 상위로 전달
  useEffect(() => {
    onNearbyUsersUpdate(nearbyUsers)
  }, [nearbyUsers, onNearbyUsersUpdate])

  const handleVisibilityToggle = () => {
    const newVisibility = !isVisible
    setIsVisible(newVisibility)
    if (isSharing) {
      stopLocationSharing()
      setTimeout(() => {
        startLocationSharing(newVisibility)
      }, 500)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshNearbyUsers()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  if (!userId) {
    return (
      <div className={`rounded-3xl p-6 shadow-2xl ${isDarkMode ? "bg-gray-800/60" : "bg-white/90"}`}>
        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>로그인이 필요합니다</p>
      </div>
    )
  }

  return (
    <div className={`rounded-3xl p-6 shadow-2xl ${isDarkMode ? "bg-gray-800/60" : "bg-white/90"}`}>
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-600"}`}>
              <MapPin size={20} />
            </div>
            <div>
              <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-800"}`}>실시간 위치 공유</h3>
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {isConnected ? "연결됨" : "연결 안됨"} • {nearbyUsers.length}명 근처
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
          </div>
        </div>

        {/* 공유 상태 안내 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>위치 공유</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              현재 내 위치는 자동으로 공유되고 있습니다
            </p>
          </div>
        </div>

        {/* 가시성 토글 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>위치 공개</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {isVisible ? "모든 사용자에게 공개" : "위치를 숨김"}
            </p>
          </div>
          <button
            onClick={handleVisibilityToggle}
            disabled={!isConnected}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2 ${
              isVisible
                ? isDarkMode
                  ? "bg-green-500/20 text-green-300 border border-green-400/30"
                  : "bg-green-100 text-green-600 border border-green-200"
                : isDarkMode
                  ? "bg-gray-500/20 text-gray-300 border border-gray-400/30"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
            {isVisible ? "공개" : "비공개"}
          </button>
        </div>

        {/* 근처 사용자 표시 */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200/20">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              근처 사용자: {nearbyUsers.length}명
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={!isConnected || isRefreshing}
            className={`px-3 py-2 rounded-2xl font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center ${
              isDarkMode
                ? "bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* 사용자 미리보기 */}
        {nearbyUsers.length > 0 && (
          <div className="space-y-2">
            <p className={`text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>실시간 사용자</p>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {nearbyUsers.slice(0, 3).map((user) => (
                <div key={user.userId} className={`flex items-center gap-2 text-xs p-2 rounded-lg ${isDarkMode ? "bg-gray-700/30" : "bg-gray-50"}`}>
                  <div className={`w-2 h-2 rounded-full ${user.status === "online" ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>{user.userName}</span>
                  <span className={`ml-auto ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    {new Date(user.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
              {nearbyUsers.length > 3 && (
                <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"} text-center`}>
                  +{nearbyUsers.length - 3}명 더
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
