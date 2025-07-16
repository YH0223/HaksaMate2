"use client"
import React, { useState, useCallback, useEffect, useRef } from "react"
import { useKakaoMap } from "@/hooks/useKakaoMap"
import { useGeolocation } from "../hooks/useGeolocation"
import { useAuth } from "@/hooks/useAuth"
import { ApiKeyErrorDisplay } from "./ApiKeyErrorDisplay"
import { LocationPermissionRequest } from "./LocationPermissionRequest"
import { LoadingDisplay } from "./LoadingDisplay"
import { LocationDeniedDisplay } from "./LocationDeniedDisplay"
import { MapContainer } from "./MapContainer"
import { LocationSharingControls } from "./LocationSharingControls"
import type { LocationData } from "../hooks/useLocationShare"
import MapCategoryBar from "./MapCategoryBar"
import { fetchProfile } from "@/lib/profile"
import { Users, Clock, Settings, X, ChevronUp, ChevronDown } from "lucide-react"
import {OtherProfileModal} from "../../components/OthersProfileModal" // Import the new modal component
 // Declare the kakao variable

interface NearbyMatchingProps {
  isDarkMode: boolean
  onOpenChat: (profileId?: string) => void
}

const NearbyMatching = React.memo(({ isDarkMode,onOpenChat }: NearbyMatchingProps) => {
  // 상태 관리
  const [isHovered, setIsHovered] = useState(false)
  const [realTimeUsers, setRealTimeUsers] = useState<LocationData[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isControllerOpen, setIsControllerOpen] = useState(false)
  const [isUserListExpanded, setIsUserListExpanded] = useState(false)
  // New states for the profile modal
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null)

  // ref 관리
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  // 커스텀 훅 사용
  const { kakaoLoaded, sdkError, apiKeyError, loadingMessage } = useKakaoMap()
  const { locationPermission, currentLocation, requestLocation } = useGeolocation()
  const { user } = useAuth()
  // 디버깅을 위한 사용자 정보 로그
  useEffect(() => {
    console.log("🔍 사용자 정보 디버깅:", {
      user,
      userId: user?.id,
      userType: typeof user?.id,
      hasUser: !!user,
    })
  }, [user])
  useEffect(() => {
    if (kakaoLoaded && window.kakao?.maps?.services) {
      psRef.current = new window.kakao.maps.services.Places()
    }
  }, [kakaoLoaded])
  // 실시간 사용자 위치 업데이트 핸들러
  const handleNearbyUsersUpdate = useCallback((users: LocationData[]) => {
    console.log("📍 NearbyMatching - 실시간 사용자 업데이트:", users.length, "명")
    setRealTimeUsers(users)
  }, [])
  // 장소 마커와 함께 인포윈도우도 관리
  const psRef = useRef<kakao.maps.services.Places | null>(null)
  const placeMarkersRef = useRef<{ marker: kakao.maps.Marker; info: kakao.maps.InfoWindow }[]>([])
  const searchPlaces = useCallback(
    (keyword: string) => {
      if (!psRef.current || !currentLocation) return
      // 기존 마커 및 인포윈도우 제거
      placeMarkersRef.current.forEach(({ marker, info }) => {
        marker.setMap(null)
        info.close()
      })
      placeMarkersRef.current = []
      psRef.current.keywordSearch(
        keyword,
        (data, status) => {
          if (status === kakao.maps.services.Status.OK && mapRef.current) {
            data.forEach((place, idx) => {
              const position = new kakao.maps.LatLng(Number(place.y), Number(place.x))
              const marker = new kakao.maps.Marker({
                map: mapRef.current,
                position,
              })
              const infoWindow = new kakao.maps.InfoWindow({
                content: `<div style="padding:5px;font-size:12px;color:#000;">${place.place_name}</div>`,
              })
              kakao.maps.event.addListener(marker, "click", () => {
                infoWindow.open(mapRef.current, marker)
              })
              placeMarkersRef.current.push({ marker, info: infoWindow })
            })
            mapRef.current.setCenter(new kakao.maps.LatLng(currentLocation.lat, currentLocation.lng))
          }
        },
        {
          location: new kakao.maps.LatLng(currentLocation.lat, currentLocation.lng),
          radius: 1000,
        },
      )
    },
    [currentLocation],
  )
  // 개선된 지도 초기화 함수
  const initializeMap = useCallback(
    async (lat: number, lng: number) => {
      if (!kakaoLoaded || !window.kakao || !window.kakao.maps) {
        console.error("❌ 카카오맵 SDK가 아직 로드되지 않았습니다.")
        return
      }
      const container = document.getElementById("kakao-map")
      if (!container) {
        console.error("❌ 지도 컨테이너를 찾을 수 없습니다.")
        return
      }
      try {
        console.log("🗺️ 지도 초기화 시작:", {
          lat,
          lng,
          realTimeUsers: realTimeUsers.length,
          user: user?.id,
        })
        const kakaoMap = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(lat, lng),
          level: 3,
        })
        mapRef.current = kakaoMap
        // 기존 마커 제거
        markersRef.current.forEach((marker) => marker.setMap(null))
        markersRef.current.clear()
        // 현재 사용자 마커 추가 (개선된 에러 처리)
        try {
          // 사용자 ID 검증 강화
          if (!user?.id) {
            console.warn("⚠️ 사용자 ID가 없습니다:", { user })
            return
          }
          console.log("🔍 프로필 가져오기 시도:", {
            userId: user.id,
            userIdType: typeof user.id,
          })
          const currentProfile = await fetchProfile(user.id)
          console.log("✅ 프로필 가져오기 성공:", currentProfile)
          const currentImgUrl = currentProfile?.profile_image_url || "/placeholder.svg?height=40&width=40"
          const currentMarkerImage = new window.kakao.maps.MarkerImage(
            currentImgUrl,
            new window.kakao.maps.Size(40, 40),
            { shape: "circle" },
          )
          const currentMarker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(lat, lng),
            image: currentMarkerImage,
            map: kakaoMap,
          })
          markersRef.current.set("current", currentMarker)
          const currentInfoWindow = new window.kakao.maps.InfoWindow({
            content: '<div style="padding:5px;font-size:12px;color:#000;">📍 내 위치</div>',
          })
          currentInfoWindow.open(kakaoMap, currentMarker)
        } catch (err) {
          console.error("❌ 현재 사용자 프로필 처리 실패:", {
            error: err,
            message: err instanceof Error ? err.message : "알 수 없는 오류",
            stack: err instanceof Error ? err.stack : undefined,
            userId: user?.id,
          })
          // 기본 마커로 대체
          const defaultMarker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(lat, lng),
            map: kakaoMap,
          })
          markersRef.current.set("current", defaultMarker)
          const defaultInfoWindow = new window.kakao.maps.InfoWindow({
            content: '<div style="padding:5px;font-size:12px;color:#000;">📍 내 위치 (기본)</div>',
          })
          defaultInfoWindow.open(kakaoMap, defaultMarker)
        }
        // 실시간 사용자 마커 추가
        for (const rtuser of realTimeUsers) {
          if (rtuser.userId === user?.id?.toString()) continue
          try {
            console.log("🔍 실시간 사용자 프로필 가져오기:", rtuser.userId)
            const profile = await fetchProfile(rtuser.userId)
            const imageUrl = profile?.profile_image_url || "/placeholder.svg?height=40&width=40"
            const userMarkerImage = new window.kakao.maps.MarkerImage(imageUrl, new window.kakao.maps.Size(40, 40), {
              shape: "circle",
            })
            const userMarker = new window.kakao.maps.Marker({
              position: new window.kakao.maps.LatLng(rtuser.latitude, rtuser.longitude),
              image: userMarkerImage,
              map: kakaoMap,
            })
            markersRef.current.set(`realtime-${rtuser.userId}`, userMarker)
            const infoWindow = new window.kakao.maps.InfoWindow({
              content: `<div style="padding:5px;font-size:12px;color:#000;">
                👤 ${rtuser.userName}<br/>
                <span style="color:${rtuser.status === "online" ? "green" : "gray"};">
                  ${rtuser.status === "online" ? "🟢 온라인" : "⚫ 오프라인"}
                </span>
              </div>`,
            })
            window.kakao.maps.event.addListener(userMarker, "click", () => {
              infoWindow.open(kakaoMap, userMarker)
            })
          } catch (err) {
            console.warn("❌ 실시간 사용자 프로필 불러오기 실패:", {
              userId: rtuser.userId,
              error: err,
              message: err instanceof Error ? err.message : "알 수 없는 오류",
            })
          }
        }
        setMapLoaded(true)
        console.log("✅ 지도 초기화 완료! 총 마커:", markersRef.current.size, "개")
      } catch (error) {
        console.error("❌ 지도 초기화 중 오류:", error)
      }
    },
    [kakaoLoaded, realTimeUsers, user],
  )
  // 위치 권한 요청 및 지도 초기화
  const handleLocationRequest = useCallback(async () => {
    if (!kakaoLoaded) {
      return
    }
    const success = await requestLocation()
    console.log("📍 위치 권한 요청 결과:", success)
  }, [kakaoLoaded, requestLocation])
  // 실시간 사용자 변경 시 지도 업데이트
  useEffect(() => {
    if (kakaoLoaded && locationPermission === "granted" && currentLocation && mapLoaded) {
      console.log("🔄 실시간 사용자 변경으로 지도 업데이트 - 실시간 사용자:", realTimeUsers.length, "명")
      initializeMap(currentLocation.lat, currentLocation.lng)
    }
  }, [realTimeUsers, kakaoLoaded, locationPermission, currentLocation, mapLoaded, initializeMap])
  // 카카오맵 로드 및 위치 권한 확인 시 지도 초기화
  useEffect(() => {
    if (kakaoLoaded && locationPermission === "granted" && currentLocation) {
      console.log("🔄 초기 지도 설정")
      setTimeout(() => {
        initializeMap(currentLocation.lat, currentLocation.lng)
      }, 500)
    }
  }, [kakaoLoaded, locationPermission, currentLocation, initializeMap])

  // Handlers for the new profile modal
  const handleOpenProfileModal = useCallback((userId: string) => {
    setSelectedProfileUserId(userId)
    setShowProfileModal(true)
  }, [])

  const handleCloseProfileModal = useCallback(() => {
    setShowProfileModal(false)
    setSelectedProfileUserId(null)
  }, [])


  // 에러 상태 처리
  if (sdkError || apiKeyError) {
    return <ApiKeyErrorDisplay isDarkMode={isDarkMode} sdkError={sdkError} apiKeyError={apiKeyError} />
  }
  // 위치 권한 요청 상태
  if (locationPermission === "prompt") {
    return (
      <LocationPermissionRequest
        isDarkMode={isDarkMode}
        kakaoLoaded={kakaoLoaded}
        loadingMessage={loadingMessage}
        onLocationRequest={handleLocationRequest}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
      />
    )
  }
  // 로딩 상태
  if (locationPermission === "loading") {
    return <LoadingDisplay isDarkMode={isDarkMode} />
  }
  // 위치 권한 거부 상태
  if (locationPermission === "denied") {
    return <LocationDeniedDisplay isDarkMode={isDarkMode} onRetry={handleLocationRequest} />
  }
  return (
    <div className="relative w-full max-w-7xl mx-auto">
      {/* 메인 지도 영역 */}
      <div className="relative h-[70vh] min-h-[500px] rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[90vw] max-w-3xl px-4">
          <MapCategoryBar onCategorySelect={searchPlaces} />
        </div>
        {/* 지도 */}
        <MapContainer
          isDarkMode={isDarkMode}
          mapLoaded={mapLoaded}
          nearbyUsers={realTimeUsers.map((u) => ({
            id: Number.parseInt(u.userId) || 0,
            name: u.userName,
            age: 0,
            mbti: "",
            nickname: u.userName,
            tags: [],
            description: `실시간 사용자 (${u.status})`,
          }))}
          kakaoLoaded={kakaoLoaded}
          currentLocation={currentLocation}
          onRefresh={() => {
            if (kakaoLoaded && currentLocation) {
              console.log("🔄 지도 새로고침 요청")
              initializeMap(currentLocation.lat, currentLocation.lng)
            }
          }}
        />
        {/* Floating 컨트롤러 버튼 */}
        <div className="absolute bottom-4 right-4 z-40">
          <button
            onClick={() => setIsControllerOpen(!isControllerOpen)}
            className={`
              w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105
              ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 border border-gray-600"
                  : "bg-white hover:bg-gray-50 border border-gray-200"
              }
              ${isControllerOpen ? "rotate-45" : ""}
            `}
          >
            {isControllerOpen ? (
              <X className={`w-6 h-6 mx-auto ${isDarkMode ? "text-white" : "text-gray-700"}`} />
            ) : (
              <Settings className={`w-6 h-6 mx-auto ${isDarkMode ? "text-white" : "text-gray-700"}`} />
            )}
          </button>
          {/* 확장된 컨트롤러 패널 */}
          {isControllerOpen && (
            <div
              className={`
                absolute bottom-16 right-0 w-80 rounded-2xl shadow-2xl border transition-all duration-300 transform
                ${
                  isDarkMode
                    ? "bg-gray-800/95 backdrop-blur-xl border-gray-700/50"
                    : "bg-white/95 backdrop-blur-xl border-gray-200/50"
                }
                animate-in slide-in-from-bottom-2 fade-in-0
              `}
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                  <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>위치 공유 설정</h3>
                </div>
                <LocationSharingControls
                  userId={user?.id?.toString()}
                  isDarkMode={isDarkMode}
                  onNearbyUsersUpdate={handleNearbyUsersUpdate}
                />
              </div>
            </div>
          )}
        </div>
        {/* 온라인 사용자 수 표시 */}
        {realTimeUsers.length > 0 && (
          <div className="absolute top-4 right-4 z-30">
            <div
              className={`
                px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300
                ${
                  isDarkMode
                    ? "bg-gray-800/80 border border-gray-700/50 text-white"
                    : "bg-white/80 border border-gray-200/50 text-gray-900"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">{realTimeUsers.length}명 온라인</span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* 하단 실시간 사용자 목록 */}
      {realTimeUsers.length > 0 && (
        <div className="mt-6">
          <div
            className={`
              rounded-2xl shadow-lg border transition-all duration-300
              ${
                isDarkMode
                  ? "bg-gray-800/90 backdrop-blur-xl border-gray-700/50"
                  : "bg-white/90 backdrop-blur-xl border-gray-200/50"
              }
            `}
          >
            {/* 헤더 */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => setIsUserListExpanded(!isUserListExpanded)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                    p-2 rounded-lg
                    ${isDarkMode ? "bg-green-500/20" : "bg-green-50"}
                  `}
                >
                  <Users className={`w-5 h-5 ${isDarkMode ? "text-green-400" : "text-green-600"}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    실시간 위치 공유 중
                  </h3>
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {realTimeUsers.length}명이 위치를 공유하고 있습니다
                  </p>
                </div>
              </div>
              <button
                className={`
                  p-2 rounded-lg transition-all duration-200
                  ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}
                `}
              >
                {isUserListExpanded ? (
                  <ChevronUp className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`} />
                )}
              </button>
            </div>
            {/* 확장 가능한 사용자 목록 */}
            {isUserListExpanded && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {realTimeUsers.map((user) => (
                    <button // Changed div to button for better accessibility and clickability
                      key={user.userId}
                      onClick={() => handleOpenProfileModal(user.userId)} // Added onClick handler
                      className={`
                        flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left
                        ${
                          isDarkMode
                            ? "bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/30"
                            : "bg-gray-50 hover:bg-gray-100 border border-gray-200/50"
                        }
                      `}
                    >
                      {/* 아바타 */}
                      <div className="relative">
                        <div
                          className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm
                            ${
                              user.status === "online"
                                ? isDarkMode
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-green-100 text-green-700"
                                : isDarkMode
                                  ? "bg-gray-600/50 text-gray-400"
                                  : "bg-gray-200 text-gray-500"
                            }
                          `}
                        >
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <div
                          className={`
                            absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2
                            ${user.status === "online" ? "bg-green-500" : "bg-gray-400"}
                            ${isDarkMode ? "border-gray-800" : "border-white"}
                          `}
                        />
                      </div>
                      {/* 사용자 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {user.userName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className={`w-3 h-3 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                          <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            {new Date(user.timestamp).toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Render the OtherProfileModal */}
      {showProfileModal && (
      <OtherProfileModal
        showProfileModal={showProfileModal}
        targetUserId={selectedProfileUserId}
        onClose={handleCloseProfileModal}
        isDarkMode={isDarkMode}
        onStartChat={onOpenChat}
      />
    )}
    </div>
  )
})

NearbyMatching.displayName = "NearbyMatching"
export default NearbyMatching
