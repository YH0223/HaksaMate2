"use client"

import { motion, AnimatePresence } from "framer-motion"
import Modal from "react-modal"
import { UserIcon, GraduationCap, MessageCircle } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import ChatModal from "@/components/ChatModal"

interface OtherProfileModalProps {
  showProfileModal: boolean
  targetUserId: string | null // 조회할 대상 사용자 ID
  onClose: () => void
  isDarkMode?: boolean
  onStartChat?: (targetUserId: string) => void // ✅ 콜백 추가
}

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 50,
    transition: {
      duration: 0.2,
    },
  },
}

export function OtherProfileModal({
  showProfileModal,
  targetUserId,
  onClose,
  isDarkMode = false,
  onStartChat,
}: OtherProfileModalProps) {
  const [profileData, setProfileData] = useState({
    name: "",
    department: "",
    profileImageUrl: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)

  // 모달 닫기 핸들러 - useCallback으로 최적화
  const handleClose = useCallback(() => {
    setShowChatModal(false)
    onClose()
  }, [onClose])

  // Supabase에서 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!showProfileModal || !targetUserId) {
        setProfileData({
          name: "",
          department: "",
          profileImageUrl: "",
        })
        return
      }

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("profiles") // 또는 사용자 테이블명
          .select("name, department, profile_image_url")
          .eq("id", targetUserId)
          .single()

        if (error) {
          console.error("프로필 조회 오류:", error)
          setProfileData({
            name: "사용자",
            department: "학과 미설정",
            profileImageUrl: "",
          })
          return
        }

        if (data) {
          setProfileData({
            name: data.name || "사용자",
            department: data.department || "학과 미설정",
            profileImageUrl: data.profile_image_url || "",
          })
        }
      } catch (error) {
        console.error("프로필 정보 불러오기 실패:", error)
        setProfileData({
          name: "사용자",
          department: "학과 미설정",
          profileImageUrl: "",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [showProfileModal, targetUserId])

  // 컴포넌트 unmount 시 정리
  useEffect(() => {
    return () => {
      setShowChatModal(false)
      setIsLoading(false)
    }
  }, [])

  const handleStartChat = useCallback(() => {
    handleClose() // 프로필 모달 닫기
    if (targetUserId && onStartChat) {
      onStartChat(targetUserId)
    }
  }, [targetUserId, onStartChat, handleClose])

  const handleCloseChatModal = useCallback(() => {
    setShowChatModal(false)
  }, [])

  // 로딩 상태 렌더링
  if (isLoading && showProfileModal) {
    return (
      <Modal
        isOpen={showProfileModal}
        onRequestClose={handleClose}
        contentLabel="프로필 로딩"
        className={`backdrop-blur-xl rounded-3xl max-w-md w-full mx-4 p-8 shadow-2xl border ${
          isDarkMode ? "bg-gray-800/90 border-white/20" : "bg-white/90 border-white/50"
        }`}
        overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        ariaHideApp={false}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
        key={`loading-${targetUserId}`}
      >
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-current border-t-transparent rounded-full mx-auto mb-4" />
          <p className={isDarkMode ? "text-white" : "text-gray-900"}>프로필 정보를 불러오는 중...</p>
        </div>
      </Modal>
    )
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showProfileModal && (
          <Modal
            isOpen={showProfileModal}
            onRequestClose={handleClose}
            contentLabel="사용자 프로필"
            className={`backdrop-blur-xl rounded-3xl max-w-md w-full mx-4 p-8 shadow-2xl border ${
              isDarkMode ? "bg-gray-800/90 border-white/20" : "bg-white/90 border-white/50"
            }`}
            overlayClassName="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            ariaHideApp={false}
            shouldCloseOnOverlayClick={true}
            shouldCloseOnEsc={true}
            key={`profile-${targetUserId}-${showProfileModal}`}
          >
            <motion.div variants={modalVariants} initial="hidden" animate="visible" exit="exit" className="text-center">
              {/* 프로필 이미지 */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-2xl overflow-hidden"
              >
                {profileData.profileImageUrl ? (
                  <img
                    src={profileData.profileImageUrl || "/placeholder.svg"}
                    alt="프로필 사진"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = "none"
                      target.nextElementSibling?.classList.remove("hidden")
                    }}
                  />
                ) : (
                  <UserIcon className="h-16 w-16 text-white" />
                )}
                {profileData.profileImageUrl && <UserIcon className="h-16 w-16 text-white hidden" />}
              </motion.div>

              {/* 기본 정보 */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2 className={`text-3xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {profileData.name}
                </h2>
                <p
                  className={`text-lg mb-8 flex items-center justify-center gap-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  <GraduationCap className="h-5 w-5" />
                  {profileData.department}
                </p>
              </motion.div>

              {/* 액션 버튼들 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartChat}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl transition-all font-bold shadow-lg flex items-center justify-center gap-3 text-lg"
                >
                  <MessageCircle className="h-6 w-6" />💬 채팅하기
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  className={`w-full py-3 px-6 rounded-2xl transition-all font-medium backdrop-blur-sm ${
                    isDarkMode
                      ? "bg-gray-700/80 hover:bg-gray-600/80 text-gray-200"
                      : "bg-gray-100/80 hover:bg-gray-200/80 text-gray-800"
                  }`}
                >
                  ✕ 닫기
                </motion.button>
              </motion.div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* 채팅 모달 */}
      {showChatModal && (
        <ChatModal
          isOpen={showChatModal}
          onClose={handleCloseChatModal}
          sellerId={targetUserId}
          isDarkMode={isDarkMode}
        />
      )}
    </>
  )
}
